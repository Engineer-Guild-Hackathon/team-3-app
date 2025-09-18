import { and, desc, eq, sql } from 'drizzle-orm';

import { authorize } from '../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../_lib/cors';
import { errorResponse, jsonResponse } from '../_lib/responses';
import { runChat } from '@/lib/pipeline';
import { getLogger } from '@/lib/logger';
import { isConversationTurn, isRunChatOutput } from '@/lib/schemas';
import type { ConversationTurn } from '@/types/llm';
import { numericIdFromUuid } from '@/lib/chat/id';
import { db } from '@/db/client';
import { chats, messages } from '@/db/schema';

const log = getLogger('api:v1:chat');

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function POST(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const result = await authorize(request, cors, { requiredScope: 'chat:rw' });
  if (result.type === 'error') {
    return result.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Request body must be JSON.', { status: 400, cors });
  }

  if (!isValidPayload(payload)) {
    return errorResponse('invalid_request', 'Invalid request payload.', { status: 400, cors });
  }

  const chatUuid = extractChatUuid(payload);
  if (!chatUuid) {
    return errorResponse('invalid_request', 'chatId or clientSessionId is required.', { status: 400, cors });
  }

  const numericChatId = numericIdFromUuid(chatUuid);
  const subject = typeof payload.subject === 'string' ? payload.subject : '';
  const theme = typeof payload.theme === 'string' ? payload.theme : '';
  const description = typeof payload.description === 'string' ? payload.description : undefined;
  const history = normalizeHistory(payload.history);

  const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  log.info({ msg: 'run_chat:start', chatUuid, numericChatId, turns: history.length, requestId });

  const runInput = {
    chatId: numericChatId,
    subject,
    theme,
    description,
    clientSessionId: chatUuid,
    history,
  } as const;

  try {
    const output = await runChat(runInput, { sessionId: `chat:${numericChatId}`, requestId });
    if (!isRunChatOutput(output)) {
      log.error({ msg: 'run_chat:invalid_output', output });
      return errorResponse('internal_error', 'Chat pipeline returned invalid result.', { status: 500, cors });
    }

    const meta = await persistChat({
      userId: result.user.userId,
      chatUuid,
      subject,
      history,
      answer: output.answer,
      ended: output.status !== -1,
    });

    log.info({ msg: 'run_chat:success', chatUuid, numericChatId, status: output.status, persisted: meta?.assistantPersisted ?? false });

    return jsonResponse(
      {
        chatId: chatUuid,
        answer: output.answer,
        status: output.status,
        meta,
      },
      { cors }
    );
  } catch (error) {
    log.error({ msg: 'run_chat:error', err: error instanceof Error ? error.message : String(error) });
    return errorResponse('internal_error', error instanceof Error ? error.message : 'Failed to run chat.', {
      status: 500,
      cors,
    });
  }
}

type PersistParams = {
  userId: string;
  chatUuid: string;
  subject: string;
  history: { assistant: string; user: string }[];
  answer: string;
  ended: boolean;
};

async function persistChat(params: PersistParams) {
  const dbClient = db;
  if (!dbClient) {
    return { assistantPersisted: false };
  }

  const title = params.subject?.trim() || '新しいチャット';
  const now = sql`now()`;

  await dbClient
    .insert(chats)
    .values({
      id: params.chatUuid,
      userId: params.userId,
      title,
      status: params.ended ? 'ended' : 'in_progress',
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: chats.id,
      set: {
        title,
        status: params.ended ? 'ended' : 'in_progress',
        updatedAt: now,
      },
    });

  await persistUserMessage(dbClient, params);
  const assistantPersisted = await persistAssistantMessage(dbClient, params);

  await dbClient
    .update(chats)
    .set({
      status: params.ended ? 'ended' : 'in_progress',
      updatedAt: now,
    })
    .where(and(eq(chats.id, params.chatUuid), eq(chats.userId, params.userId)));

  return { assistantPersisted };
}

async function persistUserMessage(dbClient: NonNullable<typeof db>, params: PersistParams) {
  const lastTurn = params.history[params.history.length - 1];
  const userContent = typeof lastTurn?.user === 'string' ? lastTurn.user.trim() : '';
  if (!userContent) return;

  const lastUser = await dbClient
    .select({ content: messages.content })
    .from(messages)
    .where(and(eq(messages.chatId, params.chatUuid), eq(messages.role, 'user')))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  if (lastUser[0]?.content === userContent) return;

  await dbClient.insert(messages).values({ chatId: params.chatUuid, role: 'user', content: userContent });
}

async function persistAssistantMessage(dbClient: NonNullable<typeof db>, params: PersistParams) {
  const assistantContent = params.answer?.trim();
  if (!assistantContent) return false;

  const lastMessage = await dbClient
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.chatId, params.chatUuid))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  if (lastMessage[0]?.role === 'assistant' && lastMessage[0]?.content === assistantContent) {
    return false;
  }

  if (lastMessage[0]?.role === 'assistant') {
    return false;
  }

  await dbClient.insert(messages).values({ chatId: params.chatUuid, role: 'assistant', content: assistantContent });
  return true;
}

type ChatRequestPayload = {
  history: ConversationTurn[];
  subject?: unknown;
  theme?: unknown;
  description?: unknown;
  chatId?: unknown;
  clientSessionId?: unknown;
};

function isValidPayload(payload: unknown): payload is ChatRequestPayload {
  if (typeof payload !== 'object' || payload === null) return false;
  const body = payload as Record<string, unknown>;
  const history = body.history;
  if (!Array.isArray(history) || history.length === 0) return false;
  if (!history.every(isConversationTurn)) return false;
  return true;
}

function normalizeHistory(items: ConversationTurn[]): { assistant: string; user: string }[] {
  return items.map((turn) => ({
    assistant: typeof turn.assistant === 'string' ? turn.assistant : '',
    user: typeof turn.user === 'string' ? turn.user : '',
  }));
}

function extractChatUuid(payload: ChatRequestPayload): string | null {
  const raw = [payload.clientSessionId, payload.chatId].find((value) => typeof value === 'string' && value.trim().length > 0);
  return raw ? String(raw).trim() : null;
}
