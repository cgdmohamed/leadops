import { api } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import type { Platform } from '@/lib/types';

const PLATFORMS = ['meta', 'google', 'tiktok', 'snapchat'] as const;
const STAGES = ['prospecting', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;
const LEAD_STATUSES = ['new', 'contacted', 'qualified'] as const;

export async function GET(request: Request) {
  return api(request, async user => {
    const workspaceId = user.activeWorkspace;
    const isAdmin = user.role === 'admin';

    const [campaignRows, leadRows, oppRows] = await Promise.all([
      db().query('SELECT id, data, created_at FROM records WHERE workspace_id=$1 AND kind=\'campaigns\'', [workspaceId]),
      db().query(`SELECT data, created_at, updated_at FROM records WHERE workspace_id=$1 AND kind='leads'${isAdmin ? '' : ' AND owner_id=$2'}`, isAdmin ? [workspaceId] : [workspaceId, user.id]),
      db().query(`SELECT data, created_at, updated_at FROM records WHERE workspace_id=$1 AND kind='opportunities'${isAdmin ? '' : ' AND owner_id=$2'}`, isAdmin ? [workspaceId] : [workspaceId, user.id]),
    ]);
    const campaigns = campaignRows.rows.map(r => ({ id: r.id as string, data: r.data as Record<string, unknown>, createdAt: r.created_at as Date }));
    const leads = leadRows.rows.map(r => ({ data: r.data as Record<string, unknown>, createdAt: r.created_at as Date, updatedAt: r.updated_at as Date }));
    const opportunities = oppRows.rows.map(r => ({ data: r.data as Record<string, unknown>, createdAt: r.created_at as Date, updatedAt: r.updated_at as Date }));

    const num = (v: unknown, fallback = 0) => typeof v === 'number' ? v : fallback;
    const str = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback;

    const totalSpend = campaigns.reduce((s, c) => s + num(c.data.spend), 0);
    const totalLeads = leads.length;
    const totalImpressions = campaigns.reduce((s, c) => s + num(c.data.impressions), 0);
    const qualifiedLeads = leads.filter(l => l.data.status === 'qualified').length;
    const wonDeals = opportunities.filter(o => o.data.stage === 'closed_won').length;
    const totalRevenue = opportunities.filter(o => o.data.stage === 'closed_won').reduce((s, o) => s + num(o.data.value), 0);
    const collectedRevenue = Math.round(totalRevenue * 0.85);
    const pipelineValue = opportunities
      .filter(o => !['closed_won', 'closed_lost'].includes(str(o.data.stage)))
      .reduce((s, o) => s + num(o.data.value) * (num(o.data.probability) / 100), 0);
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const cac = totalLeads > 0 ? totalSpend / totalLeads : 0;

    const platformSummary = PLATFORMS.map(platform => {
      const pSpend = campaigns.filter(c => c.data.platform === platform).reduce((s, c) => s + num(c.data.spend), 0);
      const pLeads = leads.filter(l => l.data.platform === platform);
      const pOpps = opportunities.filter(o => o.data.platform === platform);
      const pWon = pOpps.filter(o => o.data.stage === 'closed_won');
      const pRevenue = pWon.reduce((s, o) => s + num(o.data.value), 0);
      return {
        platform,
        spend: pSpend,
        leads: pLeads.length,
        opportunities: pOpps.length,
        wonDeals: pWon.length,
        revenue: pRevenue,
        collectedRevenue: Math.round(pRevenue * 0.85),
        pipelineValue: pOpps.filter(o => !['closed_won', 'closed_lost'].includes(str(o.data.stage))).reduce((s, o) => s + num(o.data.value) * (num(o.data.probability) / 100), 0),
        roas: pSpend > 0 ? pRevenue / pSpend : 0,
        cac: pLeads.length > 0 ? pSpend / pLeads.length : 0,
      };
    });

    const dayKey = (d: Date) => d.toISOString().split('T')[0];
    const dateMap: Record<string, { spend: number; leads: number; revenue: number; wonDeals: number }> = {};
    campaigns.forEach(c => {
      const start = str(c.data.startDate) || dayKey(c.createdAt);
      const date = start.split('T')[0];
      if (!dateMap[date]) dateMap[date] = { spend: 0, leads: 0, revenue: 0, wonDeals: 0 };
      dateMap[date].spend += num(c.data.spend);
    });
    leads.forEach(l => {
      const date = dayKey(l.createdAt);
      if (!dateMap[date]) dateMap[date] = { spend: 0, leads: 0, revenue: 0, wonDeals: 0 };
      dateMap[date].leads++;
    });
    opportunities.forEach(o => {
      if (o.data.stage === 'closed_won') {
        const date = dayKey(o.updatedAt);
        if (!dateMap[date]) dateMap[date] = { spend: 0, leads: 0, revenue: 0, wonDeals: 0 };
        dateMap[date].revenue += num(o.data.value);
        dateMap[date].wonDeals++;
      }
    });
    const sortedDates = Object.keys(dateMap).sort().slice(-30);
    let cumSpend = 0, cumLeads = 0, cumRevenue = 0, cumWonDeals = 0;
    const revenueTrend = sortedDates.map(date => {
      const d = dateMap[date];
      cumSpend += d.spend;
      cumLeads += d.leads;
      cumRevenue += d.revenue;
      cumWonDeals += d.wonDeals;
      return { date, spend: cumSpend, leads: cumLeads, revenue: cumRevenue, wonDeals: cumWonDeals };
    });

    const activity: { type: string; description: string; time: string; lead: string }[] = [];
    opportunities
      .filter(o => o.data.stage === 'closed_won')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
      .forEach(o => {
        activity.push({
          type: 'win',
          description: `Deal closed — $${num(o.data.value).toLocaleString()}`,
          time: dayKey(o.updatedAt),
          lead: str(o.data.leadName),
        });
      });
    leads
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 20)
      .forEach(l => {
        activity.push({
          type: l.data.status === 'new' ? 'new' : 'update',
          description: l.data.status === 'new' ? `New lead from ${str(l.data.platform)}` : `Status changed to ${str(l.data.status)}`,
          time: dayKey(l.updatedAt),
          lead: str(l.data.name),
        });
      });

    return {
      kpis: {
        totalSpend, totalLeads, totalImpressions, qualifiedLeads, opportunities: opportunities.length, wonDeals,
        totalRevenue, collectedRevenue, grossProfit: Math.round(collectedRevenue * 0.45),
        cac: Math.round(cac), roas: Math.round(roas * 100) / 100,
      },
      platformSummary,
      dealsByStage: STAGES.map(stage => ({
        stage,
        count: opportunities.filter(o => o.data.stage === stage).length,
        value: opportunities.filter(o => o.data.stage === stage).reduce((s, o) => s + num(o.data.value), 0),
      })),
      topCampaigns: campaigns
        .map(c => ({ id: c.id, name: str(c.data.name), platform: str(c.data.platform) as Platform, spend: num(c.data.spend), leads: num(c.data.leads), costPerLead: num(c.data.costPerLead), revenue: num(c.data.wonRevenue), roas: num(c.data.spend) ? num(c.data.wonRevenue) / num(c.data.spend) : 0 }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
      leadStatusCounts: LEAD_STATUSES.map(status => ({ status, count: leads.filter(l => l.data.status === status).length })),
      revenueTrend,
      recentActivity: activity.slice(0, 10),
      totals: { totalRevenue, pipelineValue, wonDeals },
    };
  });
}
