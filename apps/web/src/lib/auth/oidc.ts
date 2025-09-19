import { getLogger } from '@/lib/logger';
import { getOidcConfig } from './config';

const log = getLogger('auth:oidc');

type TokenExchangeResponse = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  token_type?: string;
};

type DevExchangeResult = {
  email: string;
  name?: string;
  sub: string;
};

export type OidcUserInfo = {
  sub: string;
  email: string;
  name?: string;
};

export async function exchangeAuthorizationCode(params: {
  code: string;
  codeVerifier?: string;
}): Promise<OidcUserInfo> {
  const config = getOidcConfig();
  if (config.devMode) {
    return exchangeDev(params.code);
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
  });
  if (params.codeVerifier) {
    body.set('code_verifier', params.codeVerifier);
  }
  if (config.clientSecret) {
    body.set('client_secret', config.clientSecret);
  }

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    log.error({ msg: 'oidc_token_exchange_failed', status: response.status, body: text });
    throw new Error(`OIDC token exchange failed (${response.status})`);
  }

  const data = (await response.json()) as TokenExchangeResponse;
  const idToken = data.id_token;
  if (!idToken) {
    throw new Error('OIDC token response did not include id_token');
  }
  const claims = decodeJwt(idToken);
  const email = String(claims.email ?? '').trim();
  if (!email) {
    throw new Error('OIDC id_token does not contain email claim');
  }
  const emailVerified = (claims as { email_verified?: unknown }).email_verified;
  if (typeof emailVerified === 'boolean' && emailVerified === false) {
    // IdP 側で未確認メールのログインを拒否する（Google などの仕様に準拠）
    throw new Error('OIDC id_token email is not verified');
  }
  const sub = String(claims.sub ?? '').trim();
  return {
    sub: sub || email,
    email,
    name: typeof claims.name === 'string' ? claims.name : undefined,
  };
}

function decodeJwt(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = parts[1];
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
}

function exchangeDev(code: string): OidcUserInfo {
  const parsed = parseDevCode(code);
  return {
    sub: parsed.sub,
    email: parsed.email,
    name: parsed.name,
  };
}

function parseDevCode(code: string): DevExchangeResult {
  if (!code.startsWith('dev:')) {
    throw new Error('Dev mode requires code to start with dev:');
  }
  const payload = code.slice(4);
  const [emailPart, namePart] = payload.split('|');
  const email = emailPart?.trim();
  if (!email) {
    throw new Error('Dev mode code must include email after dev:');
  }
  const name = namePart?.trim();
  return { email, name, sub: email };
}
