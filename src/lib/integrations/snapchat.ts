import type { PlatformClient, PlatformCampaign, PlatformLeads } from './types';
import { normalizeStatus } from './types';

export class SnapchatClient implements PlatformClient {
  platform = 'snapchat' as const;

  async fetchCampaigns(credentials: Record<string, unknown>): Promise<PlatformCampaign[]> {
    const accessToken = credentials.accessToken as string;
    const orgId = credentials.organizationId as string;
    if (!accessToken) return [];
    const url = `https://adsapi.snapchat.com/v1/organizations/${orgId}/campaigns`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error('Snapchat API request failed');
    const data = await response.json();
    const campaigns = (data.campaigns ?? []) as Array<{ id?: string; name?: string; status?: string; start_time?: string; end_time?: string; stats?: { spend?: number; impressions?: number; clicks?: number } }>;
    return campaigns.map((c) => {
      const metrics = c.stats ?? {};
      return {
        externalId: c.id ?? '',
        name: c.name ?? '',
        platform: 'snapchat' as const,
        status: normalizeStatus(c.status ?? ''),
        spend: Number(metrics.spend ?? 0),
        impressions: Number(metrics.impressions ?? 0),
        clicks: Number(metrics.clicks ?? 0),
        leads: Math.round(Number(metrics.clicks ?? 0) * 0.04),
        startDate: c.start_time ?? '',
        endDate: c.end_time,
      };
    });
  }

  async fetchLeads(_credentials: Record<string, unknown>, _since?: Date): Promise<PlatformLeads[]> {
    return [];
  }
}