import type { PlatformClient, PlatformCampaign, PlatformLeads } from './types';
import { normalizeStatus } from './types';

const GOOGLE_OAUTH = 'https://oauth2.googleapis.com';

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
    const accessToken = await refreshGoogleAccessToken(refreshToken);
    const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, campaign.start_date FROM campaign WHERE campaign.status != 'REMOVED'`;
    const url = `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_DEVELOPER_TOKEN ?? '',
      },
      body: JSON.stringify({ query, pageSize: 100 }),
    });
    if (!response.ok) throw new Error('Google Ads API request failed');
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
