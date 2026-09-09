import type {
  User,
  Workspace,
  Campaign,
  DailyCampaignStat,
  Lead,
  Opportunity,
  LeadActivity,
  TeamMember,
  DashboardStats,
  PlatformComparison,
  Platform,
  LeadStatus,
  OpportunityStage,
} from "../types";

function seededRandom(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seededRandom(42);

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

export const demoWorkspaces: Workspace[] = [
  { id: "ws-1", name: "LeadOps Demo", currency: "USD", timezone: "America/New_York" },
  { id: "ws-2", name: "Acme Corp", currency: "USD", timezone: "America/Chicago" },
  { id: "ws-3", name: "Global Ventures", currency: "EUR", timezone: "Europe/London" },
];

export const demoUsers: User[] = [
  {
    id: "user-1",
    email: "sarah@leadops.io",
    name: "Sarah Chen",
    role: "admin",
    workspaces: ["ws-1", "ws-2", "ws-3"],
    activeWorkspace: "ws-1",
  },
  {
    id: "user-2",
    email: "james@leadops.io",
    name: "James Rivera",
    role: "agent",
    workspaces: ["ws-1", "ws-2"],
    activeWorkspace: "ws-1",
  },
];

export const demoCampaigns: Campaign[] = [
  // Meta campaigns
  {
    id: "cmp-meta-1",
    name: "Q3 SaaS Launch - Awareness",
    platform: "meta",
    status: "active",
    spend: 12450,
    impressions: 892000,
    clicks: 18740,
    leads: 312,
    costPerLead: 39.9,
    wonRevenue: 18600,
    startDate: daysAgo(90),
  },
  {
    id: "cmp-meta-2",
    name: "Retargeting - Website Visitors",
    platform: "meta",
    status: "active",
    spend: 6780,
    impressions: 234000,
    clicks: 8920,
    leads: 198,
    costPerLead: 34.24,
    wonRevenue: 24500,
    startDate: daysAgo(60),
  },
  {
    id: "cmp-meta-3",
    name: "Lookalike - High Value Leads",
    platform: "meta",
    status: "paused",
    spend: 4200,
    impressions: 156000,
    clicks: 5230,
    leads: 87,
    costPerLead: 48.28,
    wonRevenue: 8900,
    startDate: daysAgo(45),
  },
  {
    id: "cmp-meta-4",
    name: "Lead Gen Form - Free Trial",
    platform: "meta",
    status: "active",
    spend: 8900,
    impressions: 445000,
    clicks: 12300,
    leads: 256,
    costPerLead: 34.77,
    wonRevenue: 31200,
    startDate: daysAgo(75),
  },
  // Google campaigns
  {
    id: "cmp-google-1",
    name: "Brand Search - High Intent",
    platform: "google",
    status: "active",
    spend: 15600,
    impressions: 312000,
    clicks: 28400,
    leads: 445,
    costPerLead: 35.06,
    wonRevenue: 52300,
    startDate: daysAgo(90),
  },
  {
    id: "cmp-google-2",
    name: "Non-Brand - CRM Keywords",
    platform: "google",
    status: "active",
    spend: 22100,
    impressions: 189000,
    clicks: 15600,
    leads: 312,
    costPerLead: 70.83,
    wonRevenue: 41200,
    startDate: daysAgo(85),
  },
  {
    id: "cmp-google-3",
    name: "Performance Max - Lead Forms",
    platform: "google",
    status: "active",
    spend: 18400,
    impressions: 567000,
    clicks: 22100,
    leads: 389,
    costPerLead: 47.3,
    wonRevenue: 45600,
    startDate: daysAgo(70),
  },
  {
    id: "cmp-google-4",
    name: "Display - Competitor Conquest",
    platform: "google",
    status: "paused",
    spend: 5600,
    impressions: 890000,
    clicks: 6700,
    leads: 45,
    costPerLead: 124.44,
    wonRevenue: 3200,
    startDate: daysAgo(30),
  },
  // TikTok campaigns
  {
    id: "cmp-tiktok-1",
    name: "Viral Challenge - Product Demo",
    platform: "tiktok",
    status: "active",
    spend: 7800,
    impressions: 1230000,
    clicks: 34500,
    leads: 423,
    costPerLead: 18.44,
    wonRevenue: 15600,
    startDate: daysAgo(60),
  },
  {
    id: "cmp-tiktok-2",
    name: "Creator Partnership - Reviews",
    platform: "tiktok",
    status: "active",
    spend: 12400,
    impressions: 2100000,
    clicks: 56700,
    leads: 678,
    costPerLead: 18.29,
    wonRevenue: 28900,
    startDate: daysAgo(55),
  },
  {
    id: "cmp-tiktok-3",
    name: "Lead Gen Ads - B2B Segment",
    platform: "tiktok",
    status: "paused",
    spend: 3400,
    impressions: 456000,
    clicks: 12300,
    leads: 134,
    costPerLead: 25.37,
    wonRevenue: 6700,
    startDate: daysAgo(25),
  },
  {
    id: "cmp-tiktok-4",
    name: "Spark Ads - Testimonial Series",
    platform: "tiktok",
    status: "active",
    spend: 5600,
    impressions: 890000,
    clicks: 23400,
    leads: 267,
    costPerLead: 20.97,
    wonRevenue: 12400,
    startDate: daysAgo(40),
  },
  // Snapchat campaigns
  {
    id: "cmp-snap-1",
    name: "AR Lens - Brand Awareness",
    platform: "snapchat",
    status: "active",
    spend: 4500,
    impressions: 678000,
    clicks: 15600,
    leads: 189,
    costPerLead: 23.81,
    wonRevenue: 8900,
    startDate: daysAgo(50),
  },
  {
    id: "cmp-snap-2",
    name: "Story Ads - Free Trial CTA",
    platform: "snapchat",
    status: "active",
    spend: 6700,
    impressions: 445000,
    clicks: 11200,
    leads: 156,
    costPerLead: 42.95,
    wonRevenue: 11200,
    startDate: daysAgo(45),
  },
  {
    id: "cmp-snap-3",
    name: "Collection Ads - Product Catalog",
    platform: "snapchat",
    status: "ended",
    spend: 3200,
    impressions: 234000,
    clicks: 7800,
    leads: 78,
    costPerLead: 41.03,
    wonRevenue: 4500,
    startDate: daysAgo(35),
    endDate: daysAgo(10),
  },
  {
    id: "cmp-snap-4",
    name: "Snap Ads - App Install + Lead",
    platform: "snapchat",
    status: "active",
    spend: 2800,
    impressions: 312000,
    clicks: 8900,
    leads: 112,
    costPerLead: 25.0,
    wonRevenue: 6700,
    startDate: daysAgo(30),
  },
];

function generateDailyStats(campaignId: string, startDaysAgo: number, dailySpend: number, dailyLeads: number): DailyCampaignStat[] {
  const stats: DailyCampaignStat[] = [];
  const now = new Date(today);
  for (let i = startDaysAgo; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const variance = 0.7 + rand() * 0.6;
    const spend = Math.round(dailySpend * variance * 100) / 100;
    const leads = Math.max(0, Math.round(dailyLeads * variance + (rand() - 0.5) * 4));
    const impressions = Math.round(leads * (80 + rand() * 120));
    const clicks = Math.round(leads * (3 + rand() * 8));
    stats.push({
      id: `stat-${campaignId}-${i}`,
      campaignId,
      date: dayStr,
      spend,
      impressions,
      clicks,
      leads,
    });
  }
  return stats;
}

export const demoDailyStats: DailyCampaignStat[] = [
  ...generateDailyStats("cmp-meta-1", 90, 138, 3),
  ...generateDailyStats("cmp-meta-2", 60, 113, 3),
  ...generateDailyStats("cmp-meta-3", 45, 93, 2),
  ...generateDailyStats("cmp-meta-4", 75, 119, 3),
  ...generateDailyStats("cmp-google-1", 90, 173, 5),
  ...generateDailyStats("cmp-google-2", 85, 260, 4),
  ...generateDailyStats("cmp-google-3", 70, 263, 6),
  ...generateDailyStats("cmp-google-4", 30, 187, 2),
  ...generateDailyStats("cmp-tiktok-1", 60, 130, 7),
  ...generateDailyStats("cmp-tiktok-2", 55, 225, 12),
  ...generateDailyStats("cmp-tiktok-3", 25, 136, 5),
  ...generateDailyStats("cmp-tiktok-4", 40, 140, 7),
  ...generateDailyStats("cmp-snap-1", 50, 90, 4),
  ...generateDailyStats("cmp-snap-2", 45, 149, 3),
  ...generateDailyStats("cmp-snap-3", 35, 91, 2),
  ...generateDailyStats("cmp-snap-4", 30, 93, 4),
];

const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Cameron", "Dakota", "Emerson", "Finley", "Gray", "Harper", "Indigo", "Jules", "Kendall", "Lane", "Marley", "Noel", "Parker", "Reese", "Sage", "Tatum", "Val", "Winter", "Xen", "Yael", "Zion", "Blair", "Drew", "Ellis", "Frankie", "Glenn", "Hayden", "Ira", "Jade", "Kai", "Lark", "Maven", "Nico", "Oakley", "Peyton", "Robin", "Sky", "Toby", "Uri", "Vesper", "Wren", "Zen"];
const lastNames = ["Anderson", "Baker", "Carter", "Davis", "Evans", "Foster", "Garcia", "Harris", "Ingram", "Jones", "Kim", "Lee", "Martinez", "Nelson", "Ortiz", "Patel", "Quinn", "Rivera", "Singh", "Thomas", "Ueda", "Vargas", "Wang", "Xu", "Young", "Zhang", "Adams", "Brown", "Clark", "Diaz"];
const companies = ["TechFlow Inc", "DataSync Co", "CloudNine Solutions", "Pixel Perfect", "Quantum Leap", "NovaBridge", "Zenith Labs", "Pulse Analytics", "Vertex Digital", "Orbit Systems", "Spark Innovation", "ClearPath AI", "Atlas Commerce", "Prism Media", "Forge Studios", "Helix Health", "Apex Ventures", "Catalyst Group", "Nexus Tech", "Vanguard Labs"];
function pickStatus(daysOld: number): LeadStatus {
  if (daysOld > 40) return "qualified";
  if (daysOld > 20) return rand() > 0.5 ? "contacted" : "qualified";
  if (daysOld > 7) return rand() > 0.6 ? "new" : "contacted";
  return "new";
}

function generateLeads(): Lead[] {
  const leads: Lead[] = [];
  const campaignNames: Record<string, string> = {};
  demoCampaigns.forEach((c) => { campaignNames[c.id] = c.name; });

  const platformCampaigns = demoCampaigns.reduce((acc, c) => {
    if (!acc[c.platform]) acc[c.platform] = [];
    acc[c.platform].push(c);
    return acc;
  }, {} as Record<Platform, Campaign[]>);

  let leadIdx = 0;

  for (const platform of ["meta", "google", "tiktok", "snapchat"] as Platform[]) {
    const campaigns = platformCampaigns[platform];
    for (const campaign of campaigns) {
      const numLeads = Math.min(campaign.leads, 8);
      for (let i = 0; i < numLeads; i++) {
        leadIdx++;
        const daysOld = Math.floor(rand() * 80) + 1;
        const status = pickStatus(daysOld);
        const ownerIdx = leadIdx % 2;
        const createdAt = daysAgo(daysOld);
        leads.push({
          id: `lead-${String(leadIdx).padStart(3, "0")}`,
          name: `${firstNames[leadIdx % firstNames.length]} ${lastNames[(leadIdx * 3) % lastNames.length]}`,
          email: `${firstNames[leadIdx % firstNames.length].toLowerCase()}.${lastNames[(leadIdx * 3) % lastNames.length].toLowerCase()}@${companies[(leadIdx * 2) % companies.length].toLowerCase().replace(/\s+/g, "")}.com`,
          phone: `+1 (555) ${String(100 + leadIdx).padStart(3, "0")}-${String(1000 + leadIdx * 7).slice(0, 4)}`,
          company: companies[(leadIdx * 2) % companies.length],
          platform,
          campaignId: campaign.id,
          campaignName: campaign.name,
          status,
          ownerId: demoUsers[ownerIdx].id,
          ownerName: demoUsers[ownerIdx].name,
          source: platform.charAt(0).toUpperCase() + platform.slice(1) + " Ads",
          createdAt: `${createdAt}T${String(8 + (leadIdx % 12)).padStart(2, "0")}:${String(leadIdx * 7 % 60).padStart(2, "0")}:00Z`,
          updatedAt: daysAgo(Math.floor(rand() * daysOld)),
        });
      }
    }
  }
  return leads;
}

export const demoLeads: Lead[] = generateLeads();

function generateOpportunities(): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const qualifiedLeads = demoLeads.filter((l) => l.status === "qualified");

  qualifiedLeads.forEach((lead, idx) => {
    const daysOld = (idx * 5 + 10) % 80;
    const stages: OpportunityStage[] = ["prospecting", "discovery", "proposal", "negotiation", "closed_won", "closed_lost"];

    let stage: OpportunityStage;
    let probability: number;
    let closedAt: string | undefined;
    let lostReason: string | undefined;

    if (daysOld > 60) {
      stage = rand() > 0.4 ? "closed_won" : "closed_lost";
      probability = stage === "closed_won" ? 100 : 0;
      closedAt = lead.updatedAt;
      if (stage === "closed_lost") {
        lostReason = ["No Budget", "Too Expensive", "No Response", "Competitor", "Bad Timing"][idx % 5];
      }
    } else if (daysOld > 40) {
      stage = "negotiation";
      probability = 75;
    } else if (daysOld > 25) {
      stage = "proposal";
      probability = 60;
    } else if (daysOld > 14) {
      stage = "discovery";
      probability = 40;
    } else {
      stage = "prospecting";
      probability = 20;
    }

    const value = Math.round(1200 + ((idx * 7 + 3) % 8800));
    const expectedCloseDate = daysAgo((idx * 11 + 5) % 30);

    opportunities.push({
      id: `opp-${String(idx + 1).padStart(3, "0")}`,
      leadId: lead.id,
      leadName: lead.name,
      name: `${lead.company || lead.name} - ${lead.campaignName.split(" ")[0]} Deal`,
      stage,
      value,
      probability,
      expectedCloseDate,
      ownerId: lead.ownerId,
      ownerName: lead.ownerName,
      campaignId: lead.campaignId,
      campaignName: lead.campaignName,
      platform: lead.platform,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      closedAt,
      lostReason,
    });

    lead.convertedToOpportunity = `opp-${String(idx + 1).padStart(3, "0")}`;
  });

  return opportunities;
}

export const demoOpportunities: Opportunity[] = generateOpportunities();

function generateActivities(): LeadActivity[] {
  const activities: LeadActivity[] = [];
  const notes = [
    "Responded to initial outreach, interested in demo",
    "Sent follow-up email with pricing details",
    "Scheduled demo for next week",
    "Completed product demo, very positive feedback",
    "Sent proposal and contract",
    "Follow-up call scheduled",
    "Requested additional case studies",
    "Discussed pricing with decision maker",
    "Trial account activated",
    "Proposal signed, onboarding scheduled",
    "Budget approval pending",
    "Competitor evaluation in progress",
    "Technical requirements reviewed",
    "Integration discussion with dev team",
    "Final decision meeting set",
  ];
  const activityTypes: LeadActivity["type"][] = ["note", "email", "call", "status_change", "follow_up"];

  demoLeads.forEach((lead) => {
    const numActivities = Math.floor(rand() * 4) + 1;
    for (let i = 0; i < numActivities; i++) {
      const daysAgoNum = Math.floor(rand() * 30);
      activities.push({
        id: `act-${lead.id}-${i}`,
        leadId: lead.id,
        type: activityTypes[i % activityTypes.length],
        description: notes[(i * 3 + parseInt(lead.id.split("-")[1])) % notes.length],
        createdAt: daysAgo(daysAgoNum),
        createdBy: lead.ownerId,
        createdByName: lead.ownerName,
      });
    }
  });
  return activities;
}

export const demoActivities: LeadActivity[] = generateActivities();

export function getDemoTeamMembers(): TeamMember[] {
  return demoUsers.map((user) => {
    const userLeads = demoLeads.filter((l) => l.ownerId === user.id);
    const userWonDeals = demoOpportunities.filter((o) => o.ownerId === user.id && o.stage === "closed_won").length;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedLeads: userLeads.length,
      wonDeals: userWonDeals,
      winRate: userLeads.length > 0 ? Math.round((userWonDeals / userLeads.length) * 100) : 0,
    };
  });
}

export function getDemoDashboardStats(): DashboardStats {
  const totalLeads = demoLeads.length;
  const totalSpend = demoCampaigns.reduce((s, c) => s + c.spend, 0);
  const openOpps = demoOpportunities.filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost").length;
  const wonDeals = demoOpportunities.filter((o) => o.stage === "closed_won").length;
  const totalRevenue = demoOpportunities.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
  const collectedRevenue = Math.round(totalRevenue * 0.85);
  const pipelineValue = demoOpportunities.filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost").reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const roas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;
  const cac = wonDeals > 0 ? Math.round(totalSpend / wonDeals) : 0;
  return {
    totalLeads,
    totalSpend,
    opportunities: openOpps,
    wonDeals,
    totalRevenue,
    collectedRevenue,
    pipelineValue,
    roas,
    cac,
  };
}

export function getDemoPlatformComparison(): PlatformComparison[] {
  const platforms: Platform[] = ["meta", "google", "tiktok", "snapchat"];
  return platforms.map((platform) => {
    const campaigns = demoCampaigns.filter((c) => c.platform === platform);
    const spend = campaigns.reduce((s, c) => s + c.spend, 0);
    const leads = demoLeads.filter((l) => l.platform === platform);
    const totalLeads = leads.length;
    const platformOpps = demoOpportunities.filter((o) => o.platform === platform);
    const openOpps = platformOpps.filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost");
    const wonDeals = platformOpps.filter((o) => o.stage === "closed_won").length;
    const revenue = platformOpps.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
    const collectedRevenue = Math.round(revenue * 0.85);
    const pipelineValue = openOpps.reduce((s, o) => s + o.value * (o.probability / 100), 0);
    const roas = spend > 0 ? Math.round((revenue / spend) * 100) / 100 : 0;
    const cac = wonDeals > 0 ? Math.round(spend / wonDeals) : 0;
    return {
      platform,
      spend,
      leads: totalLeads,
      opportunities: openOpps.length,
      wonDeals,
      revenue,
      collectedRevenue,
      pipelineValue,
      roas,
      cac,
    };
  });
}

export function getNeedsFollowUp(): Lead[] {
  return demoLeads
    .filter((l) => l.status === "new" || l.status === "contacted")
    .slice(0, 10);
}

export function getSpendOverTime() {
  const dateMap: Record<string, { spend: number; leads: number }> = {};
  demoDailyStats.forEach((stat) => {
    if (!dateMap[stat.date]) dateMap[stat.date] = { spend: 0, leads: 0 };
    dateMap[stat.date].spend += stat.spend;
    dateMap[stat.date].leads += stat.leads;
  });
  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, data]) => ({
      date,
      spend: Math.round(data.spend),
      leads: data.leads,
    }));
}

export function getRevenueByPlatform() {
  const platforms: Platform[] = ["meta", "google", "tiktok", "snapchat"];
  return platforms.map((platform) => {
    const leads = demoLeads.filter((l) => l.platform === platform);
    const platformOpps = demoOpportunities.filter((o) => o.platform === platform && o.stage === "closed_won");
    const revenue = platformOpps.reduce((s, o) => s + o.value, 0);
    const spend = demoCampaigns.filter((c) => c.platform === platform).reduce((s, c) => s + c.spend, 0);
    const wonDeals = platformOpps.length;
    return { platform, revenue, spend, leads: leads.length, wonDeals };
  }).filter((p) => p.revenue > 0 || p.spend > 0);
}

export function getRevenueTrend() {
  const dateMap: Record<string, number> = {};
  demoOpportunities
    .filter((o) => o.stage === "closed_won")
    .forEach((opp) => {
      const date = (opp.closedAt || opp.updatedAt).split("T")[0];
      dateMap[date] = (dateMap[date] || 0) + opp.value;
    });
  let cumulative = 0;
  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, revenue]) => {
      cumulative += revenue;
      return { date, revenue, cumulative };
    });
}

export function getPipelineValue() {
  const dateMap: Record<string, { open: number; value: number }> = {};
  demoOpportunities.forEach((opp) => {
    const date = opp.createdAt.split("T")[0];
    if (!dateMap[date]) dateMap[date] = { open: 0, value: 0 };
    if (opp.stage !== "closed_won" && opp.stage !== "closed_lost") {
      dateMap[date].open++;
      dateMap[date].value += opp.value * (opp.probability / 100);
    }
  });
  let pipelineValue = 0;
  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, data]) => {
      pipelineValue += data.value;
      return { date, pipelineValue };
    });
}

export function getStageDistribution() {
  const stages: LeadStatus[] = ["new", "contacted", "qualified"];
  return stages.map((status) => ({
    stage: status.charAt(0).toUpperCase() + status.slice(1),
    count: demoLeads.filter((l) => l.status === status).length,
  }));
}

export function getGrossProfit() {
  const totalRevenue = demoOpportunities.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
  const totalSpend = demoCampaigns.reduce((s, c) => s + c.spend, 0);
  return totalRevenue - totalSpend;
}

export function getPipelineValueTotal() {
  return demoOpportunities
    .filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost")
    .reduce((s, o) => s + o.value * (o.probability / 100), 0);
}

export function getDealsByStage() {
  const stages: { name: string; status: OpportunityStage; color: string }[] = [
    { name: "Prospecting", status: "prospecting", color: "#3B82F6" },
    { name: "Discovery", status: "discovery", color: "#8B5CF6" },
    { name: "Proposal", status: "proposal", color: "#F59E0B" },
    { name: "Negotiation", status: "negotiation", color: "#F97316" },
    { name: "Won", status: "closed_won", color: "#10B981" },
    { name: "Lost", status: "closed_lost", color: "#EF4444" },
  ];
  return stages.map((s) => ({
    name: s.name,
    count: demoOpportunities.filter((o) => o.stage === s.status).length,
    color: s.color,
  }));
}

export function getInsights() {
  const insights: { type: "positive" | "negative" | "neutral"; title: string; description: string }[] = [];

  const platforms: Platform[] = ["meta", "google", "tiktok", "snapchat"];
  let bestRoas = { platform: "meta" as Platform, roas: 0 };
  let worstRoas = { platform: "meta" as Platform, roas: Infinity };

  platforms.forEach((platform) => {
    const campaigns = demoCampaigns.filter((c) => c.platform === platform);
    const spend = campaigns.reduce((s, c) => s + c.spend, 0);
    const revenue = demoOpportunities.filter((o) => o.platform === platform && o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
    const roas = spend > 0 ? revenue / spend : 0;

    if (roas > bestRoas.roas) bestRoas = { platform, roas };
    if (roas < worstRoas.roas && roas > 0) worstRoas = { platform, roas };
  });

  insights.push({
    type: "positive",
    title: `${bestRoas.platform.charAt(0).toUpperCase() + bestRoas.platform.slice(1)} leads in ROAS`,
    description: `Return on ad spend is ${bestRoas.roas.toFixed(1)}x, the highest across all platforms.`,
  });

  const newLeads = demoLeads.filter((l) => l.status === "new").length;
  if (newLeads > 20) {
    insights.push({
      type: "neutral",
      title: `${newLeads} new leads need attention`,
      description: "Consider assigning or following up with these leads to improve conversion.",
    });
  }

  const qualifiedLeads = demoLeads.filter((l) => l.status === "qualified").length;
  const wonDeals = demoOpportunities.filter((o) => o.stage === "closed_won").length;
  if (qualifiedLeads > 0) {
    const closeRate = Math.round((wonDeals / (qualifiedLeads + wonDeals)) * 100);
    insights.push({
      type: closeRate > 50 ? "positive" : "negative",
      title: `Close rate from qualified: ${closeRate}%`,
      description: `${wonDeals} deals won out of ${qualifiedLeads + wonDeals} qualified opportunities.`,
    });
  }

  const totalSpend = demoCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = demoOpportunities.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
  const netProfit = totalRevenue - totalSpend;
  insights.push({
    type: netProfit > 0 ? "positive" : "negative",
    title: netProfit > 0 ? "Profitable campaign portfolio" : "Campaign spend exceeds revenue",
    description: netProfit > 0
      ? `Net profit of $${netProfit.toLocaleString()} across all platforms.`
      : `Loss of $${Math.abs(netProfit).toLocaleString()}. Consider optimizing underperforming campaigns.`,
  });

  return insights;
}

export function getDailyRevenueTrend() {
  const dateMap: Record<string, { revenue: number; spend: number; leads: number; wonDeals: number }> = {};
  demoOpportunities
    .filter((o) => o.stage === "closed_won")
    .forEach((opp) => {
      const date = (opp.closedAt || opp.updatedAt).split("T")[0];
      if (!dateMap[date]) dateMap[date] = { revenue: 0, spend: 0, leads: 0, wonDeals: 0 };
      dateMap[date].revenue += opp.value;
      dateMap[date].wonDeals++;
    });
  demoLeads.forEach((lead) => {
    const date = lead.createdAt.split("T")[0];
    if (!dateMap[date]) dateMap[date] = { revenue: 0, spend: 0, leads: 0, wonDeals: 0 };
    dateMap[date].leads++;
  });
  demoCampaigns.forEach((c) => {
    const date = c.startDate;
    if (!dateMap[date]) dateMap[date] = { revenue: 0, spend: 0, leads: 0, wonDeals: 0 };
    dateMap[date].spend += c.spend;
  });

  const prevDateMap: Record<string, { revenue: number; spend: number; leads: number; wonDeals: number }> = {};
  demoOpportunities
    .filter((o) => o.stage === "closed_won")
    .forEach((opp) => {
      const d = new Date(opp.closedAt || opp.updatedAt);
      d.setDate(d.getDate() - 30);
      const date = d.toISOString().split("T")[0];
      if (!prevDateMap[date]) prevDateMap[date] = { revenue: 0, spend: 0, leads: 0, wonDeals: 0 };
      prevDateMap[date].revenue += opp.value;
      prevDateMap[date].wonDeals++;
    });
  demoLeads.forEach((lead) => {
    const d = new Date(lead.createdAt);
    d.setDate(d.getDate() - 30);
    const date = d.toISOString().split("T")[0];
    if (!prevDateMap[date]) prevDateMap[date] = { revenue: 0, spend: 0, leads: 0, wonDeals: 0 };
    prevDateMap[date].leads++;
  });

  const dates = Object.keys(dateMap).sort();
  const prevDates = Object.keys(prevDateMap).sort();
  const allDates = Array.from(new Set([...dates, ...prevDates])).sort().slice(-30);

  let cumRevenue = 0;
  let cumSpend = 0;
  let cumLeads = 0;
  let cumWonDeals = 0;

  return allDates.map((date) => {
    const d = dateMap[date] || { revenue: 0, spend: 0, leads: 0, wonDeals: 0 };
    cumRevenue += d.revenue;
    cumSpend += d.spend;
    cumLeads += d.leads;
    cumWonDeals += d.wonDeals;
    return {
      date,
      revenue: cumRevenue,
      spend: cumSpend,
      leads: cumLeads,
      wonDeals: cumWonDeals,
    };
  });
}

export function getDailyPipelineTrend() {
  const dateMap: Record<string, { open: number; value: number }> = {};

  demoOpportunities.forEach((opp) => {
    const date = opp.createdAt.split("T")[0];
    if (!dateMap[date]) dateMap[date] = { open: 0, value: 0 };
    if (opp.stage !== "closed_won" && opp.stage !== "closed_lost") {
      dateMap[date].open++;
      dateMap[date].value += opp.value * (opp.probability / 100);
    }
  });

  const prevDateMap: Record<string, { open: number; value: number }> = {};
  demoOpportunities.forEach((opp) => {
    const d = new Date(opp.createdAt);
    d.setDate(d.getDate() - 30);
    const date = d.toISOString().split("T")[0];
    if (!prevDateMap[date]) prevDateMap[date] = { open: 0, value: 0 };
    if (opp.stage !== "closed_won" && opp.stage !== "closed_lost") {
      prevDateMap[date].open++;
      prevDateMap[date].value += opp.value * (opp.probability / 100);
    }
  });

  const dates = Object.keys(dateMap).sort();
  const prevDates = Object.keys(prevDateMap).sort();
  const allDates = Array.from(new Set([...dates, ...prevDates])).sort().slice(-30);

  let pipelineValue = 0;
  let prevPipelineValue = 0;

  return allDates.map((date) => {
    pipelineValue += dateMap[date]?.value || 0;
    prevPipelineValue += prevDateMap[date]?.value || 0;
    return {
      date,
      pipelineValue,
      previousPipeline: prevPipelineValue,
    };
  });
}

export function getDailyLeadsTrend() {
  const dateMap: Record<string, number> = {};
  demoLeads.forEach((lead) => {
    const date = lead.createdAt.split("T")[0];
    dateMap[date] = (dateMap[date] || 0) + 1;
  });
  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, leads: count }));
}

export function getDailyDealsTrend() {
  const dateMap: Record<string, number> = {};
  demoOpportunities
    .filter((o) => o.stage === "closed_won")
    .forEach((opp) => {
      const date = (opp.closedAt || opp.updatedAt).split("T")[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });
  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, deals: count }));
}

export interface Goal {
  label: string;
  current: number;
  target: number;
}

export function getGoals(): Goal[] {
  const totalRevenue = demoOpportunities.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
  const totalLeads = demoLeads.length;
  const wonDeals = demoOpportunities.filter((o) => o.stage === "closed_won").length;
  const totalSpend = demoCampaigns.reduce((s, c) => s + c.spend, 0);
  const profit = totalRevenue - totalSpend;

  return [
    { label: "Revenue", current: totalRevenue, target: 250000 },
    { label: "Leads", current: totalLeads, target: 150 },
    { label: "Deals Won", current: wonDeals, target: 40 },
    { label: "Profit", current: Math.max(profit, 0), target: 100000 },
  ];
}

export function getTopCampaigns() {
  return demoCampaigns
    .filter((c) => c.status === "active")
    .map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      roas: c.spend > 0 ? Math.round((c.wonRevenue / c.spend) * 100) / 100 : 0,
      revenue: c.wonRevenue,
      spend: c.spend,
    }))
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 3);
}

export function getRecentActivity() {
  const activities: { id: string; type: string; description: string; time: string; lead: string }[] = [];

  demoOpportunities
    .filter((o) => o.stage === "closed_won")
    .slice(0, 10)
    .forEach((opp, idx) => {
      const daysOld = (idx * 7 + 3) % 5;
      activities.push({
        id: `act-opp-${opp.id}`,
        type: "win",
        description: `Deal closed — $${opp.value.toLocaleString()}`,
        time: `${daysOld + 1}d ago`,
        lead: opp.leadName,
      });
    });

  demoLeads.slice(0, 20).forEach((lead, idx) => {
    const daysOld = (idx * 7 + 3) % 5;
    activities.push({
      id: `act-${lead.id}`,
      type: lead.status === "new" ? "new" : "update",
      description:
        lead.status === "new"
          ? `New lead from ${lead.platform}`
          : `Status changed to ${lead.status}`,
      time: `${daysOld + 1}d ago`,
      lead: lead.name,
    });
  });

  return activities
    .sort((a, b) => {
      const order: Record<string, number> = { win: 0, new: 1, update: 2 };
      return (order[a.type] ?? 3) - (order[b.type] ?? 3);
    })
    .slice(0, 5);
}

export interface Alert {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
}

export function getAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const totalSpend = demoCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = demoOpportunities.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);

  const highCplCampaigns = demoCampaigns.filter((c) => c.costPerLead > 80 && c.status === "active");
  if (highCplCampaigns.length > 0) {
    alerts.push({
      id: "high-cpl",
      type: "warning",
      message: `${highCplCampaigns.length} campaign${highCplCampaigns.length > 1 ? "s" : ""} with CPL above $80 — consider pausing or optimizing.`,
    });
  }

  const newLeads = demoLeads.filter((l) => l.status === "new").length;
  if (newLeads > 15) {
    alerts.push({
      id: "unassigned",
      type: "info",
      message: `${newLeads} new leads need assignment or follow-up.`,
    });
  }

  const lostCount = demoOpportunities.filter((o) => o.stage === "closed_lost").length;
  const totalOpps = demoOpportunities.length;
  const lostRate = totalOpps > 0 ? (lostCount / totalOpps) * 100 : 0;
  if (lostRate > 20) {
    alerts.push({
      id: "high-lost",
      type: "warning",
      message: `Lost rate is ${lostRate.toFixed(0)}% — review lost deals for common objections.`,
    });
  }

  if (totalRevenue > totalSpend) {
    alerts.push({
      id: "profitable",
      type: "success",
      message: `Portfolio is profitable — $${(totalRevenue - totalSpend).toLocaleString()} net return.`,
    });
  }

  return alerts;
}

export function getGrowthFunnelData() {
  const totalSpend = demoCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = demoCampaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = demoCampaigns.reduce((s, c) => s + c.clicks, 0);
  const sessions = Math.round(totalClicks * 0.65);
  const totalLeads = demoLeads.length;
  const qualifiedLeads = demoLeads.filter((l) => l.status === "qualified").length;
  const opportunities = demoOpportunities.filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost").length;
  const wonDeals = demoOpportunities.filter((o) => o.stage === "closed_won").length;
  const totalRevenue = demoOpportunities.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
  const collectedRevenue = Math.round(totalRevenue * 0.82);

  const stages = [
    { label: "Ad Spend", volume: totalSpend, color: "bg-slate-500" },
    { label: "Impressions", volume: totalImpressions, color: "bg-slate-400" },
    { label: "Clicks", volume: totalClicks, color: "bg-blue-500" },
    { label: "Sessions", volume: sessions, color: "bg-blue-400" },
    { label: "Leads", volume: totalLeads, color: "bg-indigo-500" },
    { label: "Qualified", volume: qualifiedLeads, color: "bg-purple-500" },
    { label: "Opportunities", volume: opportunities, color: "bg-violet-500" },
    { label: "Won Deals", volume: wonDeals, color: "bg-emerald-500" },
    { label: "Revenue", volume: totalRevenue, color: "bg-emerald-600" },
    { label: "Collected", volume: collectedRevenue, color: "bg-emerald-700" },
  ];

  const enriched = stages.map((s, i) => {
    const prev = stages[i - 1];
    const convRate = prev && prev.volume > 0 ? Math.round((s.volume / prev.volume) * 10000) / 100 : 0;
    const dropOff = prev && prev.volume > 0 ? Math.round(((prev.volume - s.volume) / prev.volume) * 10000) / 100 : 0;
    const costPerStage = s.volume > 0 && i <= 4 ? Math.round(totalSpend / (i < 2 ? 1 : s.volume)) : 0;
    return { ...s, conversionRate: convRate, dropOff, costPerStage };
  });

  return enriched;
}

export function getExecutiveKPIs() {
  const totalSpend = demoCampaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = demoLeads.length;
  const qualifiedLeads = demoLeads.filter((l) => l.status === "qualified").length;
  const openOpps = demoOpportunities.filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost").length;
  const wonDeals = demoOpportunities.filter((o) => o.stage === "closed_won").length;
  const totalRevenue = demoOpportunities.filter((o) => o.stage === "closed_won").reduce((s, o) => s + o.value, 0);
  const collectedRevenue = Math.round(totalRevenue * 0.85);
  const grossProfit = Math.round(collectedRevenue * 0.65);
  const avgDealValue = wonDeals > 0 ? Math.round(totalRevenue / wonDeals) : 0;
  const cac = wonDeals > 0 ? Math.round(totalSpend / wonDeals) : 0;
  const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
  const cpql = qualifiedLeads > 0 ? Math.round(totalSpend / qualifiedLeads) : 0;
  const cpop = openOpps > 0 ? Math.round(totalSpend / openOpps) : 0;
  const roas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;
  const marketingROI = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;
  const salesCycle = 18;

  return {
    totalSpend,
    totalLeads,
    qualifiedLeads,
    opportunities: openOpps,
    wonDeals,
    totalRevenue,
    collectedRevenue,
    grossProfit,
    cpl,
    cpql,
    cpop,
    cac,
    roas,
    marketingROI,
    avgDealValue,
    salesCycle,
  };
}
