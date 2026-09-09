import { z } from 'zod';

const text = z.string().trim().min(1).max(200);
const uuid = z.uuid();
const platform = z.enum(['meta', 'google', 'tiktok', 'snapchat']);
const money = z.number().finite().min(0).max(1e12);
export const workspaceSchema = z.object({ name: text, currency: z.string().trim().min(1).max(32).transform(v => v.toUpperCase()), timezone: z.string().max(100).refine(v => { try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; } }).default('UTC') }).strict();
export const schemas = {
  leads: z.object({ name: text, email: z.email().max(254), phone: z.string().max(50).optional(), company: z.string().max(200).optional(), platform, campaignId: uuid.optional(), status: z.enum(['new','contacted','qualified']), source: text }),
  opportunities: z.object({ name: text, leadId: uuid, campaignId: uuid.optional(), platform, stage: z.enum(['prospecting','discovery','proposal','negotiation','closed_won','closed_lost']), value: money, probability: z.number().min(0).max(100), expectedCloseDate: z.iso.date(), lostReason: z.string().max(1000).optional() }),
  campaigns: z.object({ name: text, platform, status: z.enum(['active','paused','ended']), startDate: z.iso.date(), endDate: z.iso.date().optional() }),
  tasks: z.object({ name: text, leadId: uuid.optional(), dueDate: z.iso.date(), completed: z.boolean() }),
  notes: z.object({ leadId: uuid, content: z.string().trim().min(1).max(10000) }),
  goals: z.object({ name: text, metric: z.enum(['leads','revenue','spend','wonDeals']), target: money, dueDate: z.iso.date() }),
  'saved-views': z.object({ name: text, filters: z.object({ platform: platform.optional(), status: z.enum(['new','contacted','qualified']).optional(), ownerId: uuid.optional() }).strict() }),
  reports: z.object({ name: text, type: z.enum(['leads','campaigns','revenue']), startDate: z.iso.date(), endDate: z.iso.date() }),
  'assignment-rules': z.object({ name: text, enabled: z.boolean(), strategy: z.enum(['round-robin','load-balanced']), memberIds: z.array(uuid).min(1).max(100) }),
};
export const kindSchema = z.enum(Object.keys(schemas) as [keyof typeof schemas, ...(keyof typeof schemas)[]]);
export const recordInput = z.object({ data: z.unknown(), ownerId: uuid.nullable().optional(), version: z.number().int().positive().optional() }).strict();
