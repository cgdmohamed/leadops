import type { Platform } from '@/lib/types';

export interface PlatformCampaign {
  externalId: string;
  name: string;
  platform: Platform;
  status: 'active' | 'paused' | 'ended';
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  startDate: string;
  endDate?: string;
}

export interface PlatformLeads {
  externalId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
  campaignExternalId: string;
}

export interface PlatformClient {
  platform: Platform;
  fetchCampaigns(credentials: Record<string, unknown>): Promise<PlatformCampaign[]>;
  fetchLeads(credentials: Record<string, unknown>, since?: Date): Promise<PlatformLeads[]>;
}

export function normalizeStatus(raw: string): PlatformCampaign['status'] {
  const value = raw.toLowerCase();
  if (value.includes('paus')) return 'paused';
  if (value.includes('end') || value.includes('archiv') || value.includes('complete')) return 'ended';
  return 'active';
}