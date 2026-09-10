import 'server-only';
import type { Platform } from '@/lib/types';
import { ApiError } from '@/lib/server/api';

type TokenResult = {
  credentials: Record<string, unknown>;
  accountId: string | null;
  displayName: string;
};

const platformLabels: Record<Platform, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
  snapchat: 'Snapchat Ads',
};

function appUrl(path: string) {
  const base = process.env.APP_URL;
  if (!base) throw new ApiError(503, 'APP_URL is not configured');
  return new URL(path, base).toString();
}

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new ApiError(503, `${name} is not configured`);
  return value;
}

export function getOAuthRedirectUri(platform: Platform) {
  return appUrl(`/api/integrations/${platform}/callback`);
}

export function getPlatformAuthUrl(platform: Platform, state: string) {
  const redirectUri = getOAuthRedirectUri(platform);

  if (platform === 'google') {
    return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })}`;
  }

  if (platform === 'meta') {
    return `https://www.facebook.com/v19.0/dialog/oauth?${new URLSearchParams({
      client_id: env('META_CLIENT_ID'),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: process.env.META_OAUTH_SCOPES ?? 'ads_read,leads_retrieval,business_management',
      state,
    })}`;
  }

  if (platform === 'tiktok') {
    return `${process.env.TIKTOK_AUTH_URL ?? 'https://ads.tiktok.com/marketing_api/auth'}?${new URLSearchParams({
      app_id: env('TIKTOK_CLIENT_ID'),
      redirect_uri: redirectUri,
      state,
    })}`;
  }

  return `https://accounts.snapchat.com/login/oauth2/authorize?${new URLSearchParams({
    client_id: env('SNAPCHAT_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: process.env.SNAPCHAT_OAUTH_SCOPES ?? 'snapchat-marketing-api offline_access',
    state,
  })}`;
}

async function json<T>(response: Response, provider: string): Promise<T> {
  if (!response.ok) throw new Error(`${provider} OAuth request failed`);
  return response.json() as Promise<T>;
}

export async function exchangePlatformCode(platform: Platform, code: string): Promise<TokenResult> {
  if (platform === 'google') return exchangeGoogle(code);
  if (platform === 'meta') return exchangeMeta(code);
  if (platform === 'tiktok') return exchangeTikTok(code);
  return exchangeSnapchat(code);
}

async function exchangeGoogle(code: string): Promise<TokenResult> {
  const token = await json<{ access_token?: string; refresh_token?: string }>(await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'),
      client_secret: env('GOOGLE_CLIENT_SECRET'),
      code,
      redirect_uri: getOAuthRedirectUri('google'),
      grant_type: 'authorization_code',
    }),
  }), 'Google');
  if (!token.refresh_token) throw new Error('Google did not return a refresh token. Reconnect with consent enabled.');

  let customerId: string | null = null;
  if (token.access_token) {
    const customers = await fetch('https://googleads.googleapis.com/v16/customers:listAccessibleCustomers', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (customers.ok) {
      const data = await customers.json();
      const name = (data.resourceNames ?? [])[0] as string | undefined;
      if (name) customerId = name.replace(/^customers\//, '');
    }
  }
  if (!customerId) throw new Error('No accessible Google Ads customer was found for this account');

  return {
    displayName: platformLabels.google,
    accountId: customerId,
    credentials: { accessToken: token.access_token, refreshToken: token.refresh_token, customerId },
  };
}

async function exchangeMeta(code: string): Promise<TokenResult> {
  const shortToken = await json<{ access_token?: string }>(await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
    client_id: env('META_CLIENT_ID'),
    client_secret: env('META_CLIENT_SECRET'),
    redirect_uri: getOAuthRedirectUri('meta'),
    code,
  })}`), 'Meta');
  if (!shortToken.access_token) throw new Error('Meta did not return an access token');

  let accessToken = shortToken.access_token;
  const longToken = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: env('META_CLIENT_ID'),
    client_secret: env('META_CLIENT_SECRET'),
    fb_exchange_token: accessToken,
  })}`);
  if (longToken.ok) {
    const data = await longToken.json();
    if (data.access_token) accessToken = data.access_token;
  }

  let accountId: string | null = null;
  let displayName = platformLabels.meta;
  const accounts = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&limit=25&access_token=${encodeURIComponent(accessToken)}`);
  if (accounts.ok) {
    const data = await accounts.json();
    const account = data.data?.[0];
    if (account?.id) accountId = String(account.id).replace(/^act_/, '');
    if (account?.name) displayName = account.name;
  }
  if (!accountId) throw new Error('No Meta ad account was found for this account');

  return { displayName, accountId, credentials: { accessToken, adAccountId: accountId } };
}

async function exchangeTikTok(code: string): Promise<TokenResult> {
  const token = await json<{ data?: { access_token?: string; refresh_token?: string } }>(await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: env('TIKTOK_CLIENT_ID'),
      secret: env('TIKTOK_CLIENT_SECRET'),
      auth_code: code,
    }),
  }), 'TikTok');
  const accessToken = token.data?.access_token;
  if (!accessToken) throw new Error('TikTok did not return an access token');

  let advertiserId: string | null = null;
  const advertisers = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': accessToken },
    body: JSON.stringify({ app_id: env('TIKTOK_CLIENT_ID'), secret: env('TIKTOK_CLIENT_SECRET') }),
  });
  if (advertisers.ok) {
    const data = await advertisers.json();
    advertiserId = data.data?.list?.[0]?.advertiser_id ? String(data.data.list[0].advertiser_id) : null;
  }
  if (!advertiserId) throw new Error('No TikTok advertiser account was found for this login');

  return {
    displayName: platformLabels.tiktok,
    accountId: advertiserId,
    credentials: { accessToken, refreshToken: token.data?.refresh_token, advertiserId },
  };
}

async function exchangeSnapchat(code: string): Promise<TokenResult> {
  const basic = Buffer.from(`${env('SNAPCHAT_CLIENT_ID')}:${env('SNAPCHAT_CLIENT_SECRET')}`).toString('base64');
  const token = await json<{ access_token?: string; refresh_token?: string }>(await fetch('https://accounts.snapchat.com/login/oauth2/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      redirect_uri: getOAuthRedirectUri('snapchat'),
      grant_type: 'authorization_code',
    }),
  }), 'Snapchat');
  if (!token.access_token) throw new Error('Snapchat did not return an access token');

  let organizationId: string | null = null;
  const organizations = await fetch('https://adsapi.snapchat.com/v1/me/organizations', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (organizations.ok) {
    const data = await organizations.json();
    organizationId = data.organizations?.[0]?.organization?.id ?? data.organizations?.[0]?.id ?? null;
  }
  if (!organizationId) throw new Error('No Snapchat organization was found for this login');

  return {
    displayName: platformLabels.snapchat,
    accountId: organizationId,
    credentials: { accessToken: token.access_token, refreshToken: token.refresh_token, organizationId },
  };
}
