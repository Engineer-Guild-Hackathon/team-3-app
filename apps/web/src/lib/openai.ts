import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

// Prompt Shields に渡すメッセージ型
type PromptShieldMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type PromptShieldEvaluation = {
  shouldBlock: boolean;
  attackDetected: boolean;
  bypassDetected: boolean;
  attackType?: string;
  confidence?: string;
  mitigations: string[];
  detectors: string[]; // どの検知器が発火したか（複数想定）
};

// API バージョン
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";
const PROMPT_SHIELD_API_VERSION =
  process.env.AZURE_CONTENT_SAFETY_API_VERSION ?? "2024-09-01";

function parseIntEnv(name: string, def: number): number {
  const v = process.env[name];
  if (!v) return def;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function requireEnv(name: string, val?: string) {
  if (!val) throw new Error(`Missing env: ${name}`);
}

let client: AzureOpenAI | null = null;
let credential: DefaultAzureCredential | null = null;
let bearerTokenProvider: (() => Promise<string>) | null = null;

// AAD トークン（cognitiveservices スコープ）を確実に取得
function ensureAzureIdentity() {
  if (!credential) {
    credential = new DefaultAzureCredential();
  }
  if (!bearerTokenProvider) {
    bearerTokenProvider = getBearerTokenProvider(
      credential,
      "https://cognitiveservices.azure.com/.default"
    );
  }
  return { credential: credential!, bearerTokenProvider: bearerTokenProvider! };
}

// Azure OpenAI クライアント（既存）
export function getAOAI(): AzureOpenAI {
  if (client) return client;

  const endpoint =
    process.env.AZURE_AISERVICES_OPENAI_BASE ?? process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  requireEnv("AZURE_AISERVICES_OPENAI_BASE or AZURE_OPENAI_ENDPOINT", endpoint);
  requireEnv("AZURE_OPENAI_DEPLOYMENT", deployment);

  const { bearerTokenProvider: azureADTokenProvider } = ensureAzureIdentity();

  client = new AzureOpenAI({
    endpoint: endpoint!,
    deployment: deployment!,
    apiVersion: API_VERSION,
    azureADTokenProvider,
    timeout: parseIntEnv("OPENAI_TIMEOUT_MS", 35000),
    maxRetries: parseIntEnv("OPENAI_MAX_RETRIES", 2),
  });

  return client;
}

const CONTENT_SAFETY_TIMEOUT_MS = parseIntEnv("AZURE_CONTENT_SAFETY_TIMEOUT_MS", 5000);
const MAX_PROMPT_SHIELD_DOCUMENTS = parseIntEnv("AZURE_CONTENT_SAFETY_MAX_DOCUMENTS", 5);

// 明白な漏洩/昇格/無視指示のヒューリスティック（前段でfail-closed）
const HEURISTIC_RULES: { pattern: RegExp; mitigation: string }[] = [
  { pattern: /system\s*prompt/i, mitigation: "ユーザーがシステムプロンプトの開示を要求しています" },
  { pattern: /reveal\s+(the\s+)?(system|initial|hidden)\s+instructions?/i, mitigation: "システム指示の開示要求が検知されました" },
  { pattern: /(機密|内蔵|内部)プロンプト(を)?(見せて|表示|開示)/i, mitigation: "内部/機密プロンプトの開示要求です" },
  { pattern: /システム(設定|プロンプト).*(表示|教えて|開示)/i, mitigation: "システム設定やプロンプトの開示要求が検知されました" },

  { pattern: /debug\s*mode/i, mitigation: "ユーザーがデバッグモードを装って権限昇格を試みています" },
  { pattern: /developer\s*mode/i, mitigation: "ユーザーがデベロッパーモードを要求しています" },
  { pattern: /デバッグモード|デバッグ\s*モード/i, mitigation: "日本語でデバッグモードへの移行を要求しています" },

  { pattern: /ignore\s+(all|any|the)\s+(previous|prior)\s+instructions?/i, mitigation: "以前の指示を無視するよう求めています" },
  { pattern: /(forget|discard)\s+(all\s+)?(previous|earlier)\s+instructions?/i, mitigation: "過去の指示を破棄するよう求めています" },
  { pattern: /(全て|すべて)の?指示を(無視|忘れて)/i, mitigation: "指示の無視を求めています" },
  { pattern: /(指示|ルール)を?無視して?/i, mitigation: "ガードレールを無視する指示が検知されました" },

  { pattern: /\b(jail\s*break|do\s*anything\s*now|dan\b)/i, mitigation: "既知のジェイルブレイク手法が検出されました" },
  { pattern: /\b(no|without)\s+(safety|filter|filtering|guardrails)\b/i, mitigation: "安全フィルタの無効化要求が検知されました" },
  { pattern: /無制限|検閲なし|フィルターなし/i, mitigation: "無制限モードを要求しています" },
  { pattern: /\b(role|pretend|simulate)\b.+(system|root|developer|admin)/i, mitigation: "権限昇格を促すロール指示が含まれています" },

  { pattern: /(bypass|override)\s+(safety|filter|content policy)/i, mitigation: "安全対策を回避するよう求めています" },
  { pattern: /(ポリシー|制限)を(無視|解除|回避)/i, mitigation: "ポリシー無視・解除の要求です" },
  { pattern: /(検閲|制限)なしで答えて/i, mitigation: "制限解除の要求が検知されました" },

  { pattern: /(新しい|秘密の)システム指示をここから開始|###\s*system\s*override/i, mitigation: "システムプロンプトの上書きを試みています" },
  { pattern: /execute\s+shell|run\s+cmd/i, mitigation: "不正なコマンド実行を誘導しています" },
];

type PromptShieldAnalysis = {
  attackDetected?: boolean;
  bypassDetected?: boolean;
  attackType?: string;
  confidence?: string;
  mitigations?: string[];
};

type PromptShieldApiResponse = {
  promptShieldResult?: PromptShieldAnalysis;
  userPromptAnalysis?: PromptShieldAnalysis;
  documentsAnalysis?: PromptShieldAnalysis[];
};

// ヒューリスティック検出（前段ブロック）
function runHeuristics(userPrompt: string | undefined): string[] {
  if (!userPrompt) return [];
  const matches = new Set<string>();
  for (const { pattern, mitigation } of HEURISTIC_RULES) {
    if (pattern.test(userPrompt)) matches.add(mitigation);
  }
  return [...matches];
}

// Prompt Shields 呼び出し（system を必ず documents 先頭に）
export async function runPromptShield(
  messages: PromptShieldMessage[]
): Promise<PromptShieldEvaluation> {
  const baseEndpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
  requireEnv("AZURE_CONTENT_SAFETY_ENDPOINT", baseEndpoint);

  // 空や空白のみを除去
  const trimmed = messages.filter((m) => m.content && m.content.trim().length > 0);

  // 直近の user メッセージ（Shield の userPrompt に渡す）
  const latestUserMessage = [...trimmed].reverse().find((m) => m.role === "user")?.content;

  if (!latestUserMessage) {
    return {
      shouldBlock: false,
      attackDetected: false,
      bypassDetected: false,
      mitigations: [],
      detectors: [],
    };
  }

  // 前段ヒューリスティック（fail-closed）
  const heuristicFindings = runHeuristics(latestUserMessage);
  if (heuristicFindings.length > 0) {
    return {
      shouldBlock: true,
      attackDetected: true,
      bypassDetected: false,
      attackType: "heuristic_prompt_injection",
      confidence: "high",
      mitigations: heuristicFindings,
      detectors: ["heuristics"],
    };
  }

  const documents = trimmed
    .filter((m) => m.role !== "user")
    .slice(-MAX_PROMPT_SHIELD_DOCUMENTS)
    .map((m) => m.content);

  const requestBody = {
    userPrompt: latestUserMessage,
    documents,
    documentType: "plaintext",
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const subscriptionKey =
    process.env.AZURE_CONTENT_SAFETY_KEY ?? process.env.AZURE_AI_CONTENT_SAFETY_KEY;

  if (subscriptionKey) {
    // API キー認証
    headers["Ocp-Apim-Subscription-Key"] = subscriptionKey;
  } else {
    // AAD（Managed Identity）認証
    const { bearerTokenProvider: azureBearer } = ensureAzureIdentity();
    headers.Authorization = `Bearer ${await azureBearer()}`;
  }

  const url = new URL(
    `/contentsafety/text:shieldPrompt?api-version=${PROMPT_SHIELD_API_VERSION}`,
    baseEndpoint
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONTENT_SAFETY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Prompt Shields request failed: ${response.status} ${response.statusText} ${text} (endpoint: ${url.origin})`
      );
    }

    const data = (await response.json()) as PromptShieldApiResponse;

    const analyses: PromptShieldAnalysis[] = [];
    if (data.promptShieldResult) analyses.push(data.promptShieldResult);
    if (data.userPromptAnalysis) analyses.push(data.userPromptAnalysis);
    if (Array.isArray(data.documentsAnalysis)) analyses.push(...data.documentsAnalysis);

    const attackDetected = analyses.some((a) => Boolean(a?.attackDetected));
    const bypassDetected = analyses.some((a) => Boolean(a?.bypassDetected));
    const mitigations = analyses.flatMap((a) => a?.mitigations ?? []);

    const attackType =
      analyses.find((a) => typeof a?.attackType === "string")?.attackType ?? undefined;
    const confidence =
      analyses.find((a) => typeof a?.confidence === "string")?.confidence ?? undefined;

    // 検知器ラベル（現状このAPIのみ。将来追加時に push）
    const detectors: string[] = [];
    if (attackDetected || bypassDetected) detectors.push("prompt_shield_api");

    return {
      shouldBlock: attackDetected || bypassDetected,
      attackDetected,
      bypassDetected,
      attackType,
      confidence,
      mitigations,
      detectors,
    };
  } finally {
    clearTimeout(timeout);
  }
}
