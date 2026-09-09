export type Platform = "meta" | "google" | "tiktok" | "snapchat";

export type LeadStatus = "new" | "contacted" | "qualified";

export type OpportunityStage =
  | "prospecting"
  | "discovery"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type UserRole = "admin" | "agent";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  workspaces: string[];
  activeWorkspace: string;
}

export interface Workspace {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: "active" | "paused" | "ended";
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  costPerLead: number;
  wonRevenue: number;
  startDate: string;
  endDate?: string;
  adAccountId?: string;
  campaignGroupId?: string;
}

export interface DailyCampaignStat {
  id: string;
  campaignId: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  platform: Platform;
  campaignId: string;
  campaignName: string;
  status: LeadStatus;
  ownerId: string;
  ownerName: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  convertedToOpportunity?: string;
}

export interface Opportunity {
  id: string;
  leadId: string;
  leadName: string;
  name: string;
  stage: OpportunityStage;
  value: number;
  probability: number;
  expectedCloseDate: string;
  ownerId: string;
  ownerName: string;
  campaignId: string;
  campaignName: string;
  platform: Platform;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  lostReason?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: "status_change" | "note" | "follow_up" | "email" | "call";
  description: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedLeads: number;
  wonDeals: number;
  winRate: number;
  avatarUrl?: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalSpend: number;
  opportunities: number;
  wonDeals: number;
  totalRevenue: number;
  collectedRevenue: number;
  pipelineValue: number;
  roas: number;
  cac: number;
}

export interface PlatformComparison {
  platform: Platform;
  spend: number;
  leads: number;
  opportunities: number;
  wonDeals: number;
  revenue: number;
  collectedRevenue: number;
  pipelineValue: number;
  roas: number;
  cac: number;
}
