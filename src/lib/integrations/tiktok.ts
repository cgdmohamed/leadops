import type { PlatformClient, PlatformCampaign, PlatformLeads } from './types';
import { normalizeStatus } from './types';

export class TikTokClient implements PlatformClient {
  platform = 'tiktok' as const;

  async fetchCampaigns(credentials: Record<string, unknown>): Promise<PlatformCampaign[]> {
    const accessToken = credentials.accessToken as string;
    const advertiserId = credentials.advertiserId as string;
    if (!accessToken || !advertiserId) return [];
    const url = 'https://business-api.tiktok.com/open_api/v1.3/campaign/get/';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': accessToken },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        fields: ['campaign_id', 'campaign_name', 'status', 'objective'],
        page_size: 100,
      }),
    });
    if (!response.ok) throw new Error('TikTok API request failed');
    const data = await response.json();
    const campaigns = (data.data?.list ?? []) as Array<{ campaign_id?: string; campaign_name?: string; status?: string; objective?: string }>;
    return campaigns.map((c) => ({
      externalId: c.campaign_id ?? '',
      name: c.campaign_name ?? '',
      platform: 'tiktok' as const,
      status: normalizeStatus(c.status ?? ''),
      spend: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      startDate: '',
    }));
  }

  async fetchLeads(_credentials: Record<string, unknown>, _since?: Date): Promise<PlatformLeads[]> {
    return [];
  }
}