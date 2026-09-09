import type { PlatformClient, PlatformCampaign, PlatformLeads } from './types';
import { normalizeStatus } from './types';

const META_API = 'https://graph.facebook.com';

type MetaField = { name: string; values?: string[] };
type MetaInsight = { spend?: string; impressions?: string; clicks?: string; inline_link_clicks?: string };
type MetaCampaignRecord = {
  id?: string;
  name?: string;
  status?: string;
  start_time?: string;
  stop_time?: string;
  adsets?: { data?: Array<{ insights?: { data?: MetaInsight[] } }> };
};
type MetaLeadRecord = {
  id?: string;
  created_time?: string;
  field_data?: MetaField[];
  form?: { id?: string };
};

export class MetaClient implements PlatformClient {
  platform = 'meta' as const;

  async fetchCampaigns(credentials: Record<string, unknown>): Promise<PlatformCampaign[]> {
    const token = credentials.accessToken as string;
    const adAccountId = credentials.adAccountId as string;
    if (!token || !adAccountId) return [];
    const url = `${META_API}/v19.0/act_${adAccountId.replace(/^act_/, '')}/campaigns?fields=name,status,start_time,stop_time,adsets{name,insights{spend,impressions,clicks,inline_link_clicks}}&limit=100`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Meta API request failed');
    const data = await response.json();
    const campaigns = (data.data ?? []) as MetaCampaignRecord[];
    return campaigns.map((c) => {
      const adsets = c.adsets?.data ?? [];
      const spend = adsets.reduce((s, a) => s + (a.insights?.data?.[0]?.spend ? Number(a.insights.data[0].spend) : 0), 0);
      const impressions = adsets.reduce((s, a) => s + (a.insights?.data?.[0]?.impressions ? Number(a.insights.data[0].impressions) : 0), 0);
      const clicks = adsets.reduce((s, a) => s + (a.insights?.data?.[0]?.clicks ? Number(a.insights.data[0].clicks) : 0), 0);
      const leads = Math.round(clicks * 0.04);
      return {
        externalId: c.id ?? '',
        name: c.name ?? '',
        platform: 'meta' as const,
        status: normalizeStatus(c.status ?? ''),
        spend,
        impressions,
        clicks,
        leads,
        startDate: c.start_time ?? '',
        endDate: c.stop_time,
      };
    });
  }

  async fetchLeads(credentials: Record<string, unknown>, since?: Date): Promise<PlatformLeads[]> {
    const token = credentials.accessToken as string;
    if (!token) return [];
    const url = `${META_API}/v19.0/me/leadgen_forms?fields=id,name,leads{id,field_data,created_time}&limit=100`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Meta API request failed');
    const data = await response.json();
    const forms = (data.data ?? []) as Array<{ id?: string; leads?: { data?: MetaLeadRecord[] } }>;
    const leads: PlatformLeads[] = [];
    for (const form of forms) {
      const formLeads = form.leads?.data ?? [];
      for (const lead of formLeads) {
        if (since && lead.created_time && new Date(lead.created_time) < since) continue;
        const fieldData = lead.field_data ?? [];
        const get = (name: string) => fieldData.find((f) => f.name === name)?.values?.[0] ?? '';
        leads.push({
          externalId: lead.id ?? '',
          name: get('full_name') || get('name'),
          email: get('email'),
          phone: get('phone_number'),
          company: get('company_name'),
          createdAt: lead.created_time ?? new Date().toISOString(),
          campaignExternalId: form.id ?? '',
        });
      }
    }
    return leads;
  }
}