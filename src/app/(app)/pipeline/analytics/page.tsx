"use client";

import { useMemo } from "react";
import { useRecords } from "@/lib/use-records";
import { PipelineFunnel } from "@/components/pipeline-funnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Target,
  Users,
  BarChart3,
} from "lucide-react";
import type { Lead, LeadStatus, Opportunity, OpportunityStage, Platform } from "@/lib/types";

const stages: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "bg-blue-500" },
  { status: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { status: "qualified", label: "Qualified", color: "bg-purple-500" },
];

function toLead(record: { id: string; data: Record<string, unknown>; ownerId: string | null; createdAt: string; updatedAt: string }): Lead {
  const d = record.data;
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
  return {
    id: record.id,
    name: str(d.name),
    email: str(d.email),
    phone: str(d.phone),
    company: str(d.company),
    platform: str(d.platform, "meta") as Platform,
    campaignId: str(d.campaignId),
    campaignName: str(d.campaignName),
    status: str(d.status, "new") as LeadStatus,
    ownerId: record.ownerId ?? "",
    ownerName: str(d.ownerName, "Unassigned"),
    source: str(d.source),
    createdAt: record.createdAt,
    updatedAt: str(d.updatedAt, record.updatedAt),
    convertedToOpportunity: str(d.convertedToOpportunity),
  };
}

function toOpportunity(record: { id: string; data: Record<string, unknown>; createdAt: string; updatedAt: string }): Opportunity {
  const d = record.data;
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
  return {
    id: record.id,
    leadId: str(d.leadId),
    leadName: str(d.leadName, "Unknown lead"),
    name: str(d.name),
    stage: str(d.stage, "prospecting") as OpportunityStage,
    value: num(d.value),
    probability: num(d.probability),
    expectedCloseDate: str(d.expectedCloseDate),
    ownerId: "",
    ownerName: str(d.ownerName, "Unassigned"),
    campaignId: str(d.campaignId),
    campaignName: str(d.campaignName, "—"),
    platform: str(d.platform, "meta") as Platform,
    createdAt: record.createdAt,
    updatedAt: str(d.updatedAt, record.updatedAt),
    lostReason: str(d.lostReason),
  };
}

export default function PipelineAnalyticsPage() {
  const { items: leadRecords } = useRecords<Record<string, unknown>>("leads");
  const { items: oppRecords } = useRecords<Record<string, unknown>>("opportunities");

  const leads = useMemo<Lead[]>(() => leadRecords.map((r) => toLead(r)), [leadRecords]);
  const opportunities = useMemo<Opportunity[]>(() => oppRecords.map((r) => toOpportunity(r)), [oppRecords]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = { new: [], contacted: [], qualified: [] };
    leads.forEach((lead) => { grouped[lead.status].push(lead); });
    return grouped;
  }, [leads]);

  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<OpportunityStage, Opportunity[]> = {
      prospecting: [], discovery: [], proposal: [], negotiation: [], closed_won: [], closed_lost: [],
    };
    opportunities.forEach((opp) => { grouped[opp.stage].push(opp); });
    return grouped;
  }, [opportunities]);

  const stageValues = useMemo(() => {
    const values: Record<string, number> = {};
    Object.entries(leadsByStatus).forEach(([status, leads]) => {
      values[status] = 0;
    });
    Object.entries(opportunitiesByStage).forEach(([stage, opps]) => {
      values[stage] = opps.reduce((sum, o) => sum + o.value, 0);
    });
    return values;
  }, [leadsByStatus, opportunitiesByStage]);

  const totalLeads = leads.length;
  const wonCount = opportunitiesByStage.closed_won.length;
  const wonValue = stageValues.closed_won || 0;
  const pipelineValue = (stageValues.new || 0) + (stageValues.contacted || 0) + (stageValues.qualified || 0);
  const totalValue = Object.values(stageValues).reduce((s, v) => s + v, 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;
  const expectedRevenue = Math.round(pipelineValue * (conversionRate / 100));

  const statusOrder: LeadStatus[] = ["new", "contacted", "qualified"];

  const conversionData = stages.slice(0, -1).map((stage, i) => {
    const nextStage = stages[i + 1];
    const fromCount = leadsByStatus[stage.status].length;
    const toCount = leadsByStatus[nextStage.status].length;
    const totalInAndAfter = leads.filter((l) => {
      return statusOrder.indexOf(l.status) >= statusOrder.indexOf(stage.status);
    }).length;
    const rate = totalInAndAfter > 0 ? Math.round((toCount / totalInAndAfter) * 100) : 0;
    return { from: stage, to: nextStage, fromCount, toCount, rate };
  });

  const stageBreakdown = stages.map((s) => ({
    ...s,
    count: leadsByStatus[s.status].length,
    value: stageValues[s.status] || 0,
    pct: totalLeads > 0 ? Math.round((leadsByStatus[s.status].length / totalLeads) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline Analytics</h1>
        <p className="text-muted-foreground">Conversion rates, funnel breakdown, and pipeline health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">${(totalValue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pipeline Value</p>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">${(pipelineValue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Won Revenue</p>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold mt-1">${(wonValue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">{wonCount} of {totalLeads} leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expected Rev.</p>
            <p className="text-2xl font-bold mt-1">${(expectedRevenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground mt-0.5">from pipeline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Funnel Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineFunnel
              stages={stageBreakdown.map((s) => ({
                label: s.label,
                count: s.count,
                value: s.value,
                color: s.color,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Stage-to-Stage Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversionData.map((item) => (
              <div key={item.from.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.from.label} → {item.to.label}</span>
                  <span className="text-muted-foreground">{item.toCount} leads</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${item.to.color} rounded-full transition-all`} style={{ width: `${Math.min(item.rate, 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-10 text-right">{item.rate}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Stage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5">
            {stageBreakdown.map((stage) => (
              <div key={stage.status} className={`rounded-lg border p-4 ${stage.color.replace("bg-", "border-")} bg-opacity-5`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                  <span className="font-medium text-sm">{stage.label}</span>
                </div>
                <p className="text-2xl font-bold">{stage.count}</p>
                <p className="text-xs text-muted-foreground">{stage.pct}% of total</p>
                {stage.value > 0 && (
                  <p className="text-sm font-medium mt-1">${stage.value.toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
