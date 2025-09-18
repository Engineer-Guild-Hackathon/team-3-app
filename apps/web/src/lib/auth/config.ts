import { getLogger } from '@/lib/logger';

export type OidcConfig = {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string;
  devMode: boolean;
};

export type AppJwtConfig = {
  secret: string;
  issuer?: string;
  audience?: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
};

const log = getLogger('auth:config');

export function getOidcConfig(): OidcConfig {
  const {
    BFF_OIDC_AUTHORIZATION_ENDPOINT,
    BFF_OIDC_TOKEN_ENDPOINT,
    BFF_OIDC_CLIENT_ID,
    BFF_OIDC_CLIENT_SECRET,
    BFF_OIDC_REDIRECT_URI,
    BFF_OIDC_SCOPE,
    BFF_AUTH_DEV_MODE,
  } = process.env;

  if (!BFF_OIDC_AUTHORIZATION_ENDPOINT || !BFF_OIDC_TOKEN_ENDPOINT) {
    throw new Error('BFF_OIDC_AUTHORIZATION_ENDPOINT and BFF_OIDC_TOKEN_ENDPOINT must be set');
  }
  if (!BFF_OIDC_CLIENT_ID) {
    throw new Error('BFF_OIDC_CLIENT_ID must be set');
  }
  if (!BFF_OIDC_REDIRECT_URI) {
    throw new Error('BFF_OIDC_REDIRECT_URI must be set');
  }

  const scope = BFF_OIDC_SCOPE?.trim() || 'openid profile email';
  const devMode = (BFF_AUTH_DEV_MODE ?? '0') === '1';
  if (devMode) {
    log.warn('OIDC dev mode is enabled. Code exchange will use fallback logic.');
  }

  return {
    authorizationEndpoint: BFF_OIDC_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: BFF_OIDC_TOKEN_ENDPOINT,
    clientId: BFF_OIDC_CLIENT_ID,
    clientSecret: BFF_OIDC_CLIENT_SECRET,
    redirectUri: BFF_OIDC_REDIRECT_URI,
    scope,
    devMode,
  };
}

export function getAppJwtConfig(): AppJwtConfig {
  const {
    BFF_APP_JWT_SECRET,
    BFF_APP_JWT_ISSUER,
    BFF_APP_JWT_AUDIENCE,
    BFF_APP_JWT_ACCESS_TTL,
    BFF_APP_JWT_REFRESH_TTL,
  } = process.env;

  if (!BFF_APP_JWT_SECRET) {
    throw new Error('BFF_APP_JWT_SECRET must be set');
  }

  const accessTokenTtlSeconds = Number(BFF_APP_JWT_ACCESS_TTL ?? 900);
  const refreshTokenTtlSeconds = Number(BFF_APP_JWT_REFRESH_TTL ?? 60 * 60 * 24 * 30);

  return {
    secret: BFF_APP_JWT_SECRET,
    issuer: BFF_APP_JWT_ISSUER,
    audience: BFF_APP_JWT_AUDIENCE,
    accessTokenTtlSeconds,
    refreshTokenTtlSeconds,
  };
}
