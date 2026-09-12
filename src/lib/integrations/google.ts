import type { PlatformClient, PlatformCampaign, PlatformLeads } from './types';
import { normalizeStatus } from './types';

const GOOGLE_OAUTH = 'https://oauth2.googleapis.com';

function googleAdsVersion() {
  return process.env.GOOGLE_ADS_API_VERSION ?? 'v21';
}

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  const error = record.error as Record<string, unknown> | undefined;
  if (typeof error?.message === 'string') return error.message;
  const details = error?.details;
  if (Array.isArray(details)) {
    const messages = details
      .flatMap((detail) => {
        const errors = (detail as Record<string, unknown>).errors;
        if (!Array.isArray(errors)) return [];
        return errors.map((item) => {
          const errorItem = item as Record<string, unknown>;
          const message = errorItem.message;
          return typeof message === 'string' ? message : null;
        }).filter(Boolean);
      });
    if (messages.length > 0) return messages.join('; ');
  }
  return fallback;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google integration is not configured');
  const response = await fetch(`${GOOGLE_OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) throw new Error('Failed to refresh Google access token');
  const data = await response.json();
  return data.access_token as string;
}

export class GoogleAdsClient implements PlatformClient {
  platform = 'google' as const;

  async fetchCampaigns(credentials: Record<string, unknown>): Promise<PlatformCampaign[]> {
    const refreshToken = credentials.refreshToken as string;
    const customerId = credentials.customerId as string;
    if (!refreshToken || !customerId) return [];
    if (!process.env.GOOGLE_DEVELOPER_TOKEN) throw new Error('GOOGLE_DEVELOPER_TOKEN is not configured');
    const accessToken = await refreshGoogleAccessToken(refreshToken);
    const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, campaign.start_date FROM campaign WHERE campaign.status != 'REMOVED'`;
    const url = `https://googleads.googleapis.com/${googleAdsVersion()}/customers/${customerId}/googleAds:searchStream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_DEVELOPER_TOKEN ?? '',
        ...(process.env.GOOGLE_LOGIN_CUSTOMER_ID ? { 'login-customer-id': process.env.GOOGLE_LOGIN_CUSTOMER_ID } : {}),
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      let detail: unknown = null;
      try { detail = await response.json(); } catch {}
      throw new Error(`Google Ads API request failed: ${errorMessage(detail, response.statusText)}`);
    }
    const data = await response.json();
    const campaigns: PlatformCampaign[] = [];
    for (const row of data[0]?.results ?? []) {
      const c = row.campaign;
      campaigns.push({
        externalId: c.id?.toString() ?? '',
        name: c.name ?? '',
        platform: 'google' as const,
        status: normalizeStatus(c.status ?? ''),
        spend: (row.metrics?.costMicros ?? 0) / 1e6,
        impressions: row.metrics?.impressions ?? 0,
        clicks: row.metrics?.clicks ?? 0,
        leads: Math.round((row.metrics?.clicks ?? 0) * 0.05),
        startDate: c.startDate ?? '',
      });
    }
    return campaigns;
  }

  async fetchLeads(_credentials: Record<string, unknown>, _since?: Date): Promise<PlatformLeads[]> {
    return [];
  }
}
