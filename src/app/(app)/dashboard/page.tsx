"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalDateFilter } from "@/components/global-date-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlatformIcon } from "@/components/platform-icons";
import { Sparkline } from "@/components/sparkline";
import { clientApi } from "@/lib/client-api";
import type { Platform } from "@/lib/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Eye,
  EyeOff,
  ChevronRight,
  ArrowRight,
  Settings,
  ArrowUpRight,
  Inbox,
} from "lucide-react";

const kpiLabels: Record<string, { label: string; format: (v: number) => string }> = {
  totalSpend: { label: "Total Spend", format: (v) => `$${(v / 1000).toFixed(0)}K` },
  totalLeads: { label: "Leads", format: (v) => v.toLocaleString() },
  qualifiedLeads: { label: "Qualified Leads", format: (v) => v.toLocaleString() },
  opportunities: { label: "Opportunities", format: (v) => v.toLocaleString() },
  wonDeals: { label: "Won Deals", format: (v) => v.toLocaleString() },
  totalRevenue: { label: "Revenue", format: (v) => `$${(v / 1000).toFixed(0)}K` },
  collectedRevenue: { label: "Collected Revenue", format: (v) => `$${(v / 1000).toFixed(0)}K` },
  grossProfit: { label: "Gross Profit", format: (v) => `$${(v / 1000).toFixed(0)}K` },
  cac: { label: "CAC", format: (v) => `$${v}` },
  roas: { label: "ROAS", format: (v) => `${v}x` },
};

const defaultVisibleKpis = ["totalSpend", "totalLeads", "qualifiedLeads", "wonDeals"];

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const trendMetrics = ["revenue", "spend", "leads", "wonDeals"] as const;
const platformMetrics = ["revenue", "spend", "leads", "wonDeals"] as const;

type DashboardData = {
  kpis: {
    totalSpend: number; totalLeads: number; totalImpressions: number; qualifiedLeads: number; opportunities: number; wonDeals: number;
    totalRevenue: number; collectedRevenue: number; grossProfit: number; cac: number; roas: number;
  };
  platformSummary: { platform: Platform; spend: number; leads: number; opportunities: number; wonDeals: number; revenue: number }[];
  dealsByStage: { stage: string; count: number; value: number }[];
  topCampaigns: { id: string; name: string; platform: Platform; spend: number; revenue: number; roas: number }[];
  revenueTrend: { date: string; spend: number; leads: number; revenue: number; wonDeals: number }[];
  recentActivity: { type: string; description: string; time: string; lead: string }[];
  totals: { totalRevenue: number; pipelineValue: number; wonDeals: number };
};

const emptyKpis: DashboardData["kpis"] = {
  totalSpend: 0, totalLeads: 0, totalImpressions: 0, qualifiedLeads: 0, opportunities: 0, wonDeals: 0,
  totalRevenue: 0, collectedRevenue: 0, grossProfit: 0, cac: 0, roas: 0,
};

const STAGE_LABELS: Record<string, string> = {
  prospecting: "Prospecting",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const STAGE_COLORS: Record<string, string> = {
  prospecting: "#3B82F6",
  discovery: "#8B5CF6",
  proposal: "#F59E0B",
  negotiation: "#F97316",
  closed_won: "#10B981",
  closed_lost: "#EF4444",
};

export default function DashboardPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState("last_30");
  const [visibleKpis, setVisibleKpis] = useState<string[]>(defaultVisibleKpis);
  const [showKpiPicker, setShowKpiPicker] = useState(false);
  const [trendMetric, setTrendMetric] = useState<"revenue" | "spend" | "leads" | "wonDeals">("revenue");
  const [platformMetric, setPlatformMetric] = useState<"revenue" | "spend" | "leads" | "wonDeals">("revenue");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    clientApi<DashboardData>("/api/dashboard")
      .then((d) => { if (!cancelled) setDashboard(d); })
      .catch(() => { if (!cancelled) setDashboard(null); });
    return () => { cancelled = true; };
  }, []);

  const kpis = dashboard?.kpis ?? emptyKpis;
  const revenueTrend = dashboard?.revenueTrend ?? [];
  const platformData = dashboard?.platformSummary ?? [];
  const topCampaigns = dashboard?.topCampaigns ?? [];
  const recentActivity = dashboard?.recentActivity ?? [];
  const pipelineValue = dashboard?.totals?.pipelineValue ?? 0;
  const dealsByStage = (dashboard?.dealsByStage ?? []).map((s) => ({
    name: STAGE_LABELS[s.stage] ?? s.stage,
    count: s.count,
    color: STAGE_COLORS[s.stage] ?? "#64748b",
  }));
  const maxStageCount = Math.max(...dealsByStage.map((s) => s.count), 0);
  const hasDashboardData = kpis.totalLeads > 0 || kpis.totalSpend > 0 || kpis.totalRevenue > 0 || platformData.length > 0;

  const toggleKpi = (key: string) => {
    setVisibleKpis((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const trendData = useMemo(() => {
    if (trendMetric === "revenue") return revenueTrend;
    if (trendMetric === "spend") return revenueTrend.map((d) => ({ ...d, value: d.spend }));
    if (trendMetric === "leads") return revenueTrend.map((d) => ({ ...d, value: d.leads }));
    return revenueTrend.map((d) => ({ ...d, value: d.wonDeals }));
  }, [trendMetric, revenueTrend]);

  const platformChartData = useMemo(() => {
    if (platformMetric === "revenue") return platformData.map((p) => ({ ...p, value: p.revenue }));
    if (platformMetric === "spend") return platformData.map((p) => ({ ...p, value: p.spend }));
    if (platformMetric === "leads") return platformData.map((p) => ({ ...p, value: p.leads }));
    return platformData.map((p) => ({ ...p, value: p.wonDeals }));
  }, [platformMetric, platformData]);

  const funnelStages = [
    { label: "Spend", value: `$${(kpis.totalSpend / 1000).toFixed(0)}K`, raw: kpis.totalSpend },
    { label: "Traffic", value: kpis.totalImpressions ? `${(kpis.totalImpressions / 1000).toFixed(0)}K` : "0", raw: kpis.totalImpressions },
    { label: "Leads", value: kpis.totalLeads.toLocaleString(), raw: kpis.totalLeads },
    { label: "Qualified", value: kpis.qualifiedLeads.toLocaleString(), raw: kpis.qualifiedLeads },
    { label: "Opportunities", value: kpis.opportunities.toLocaleString(), raw: kpis.opportunities },
    { label: "Won", value: kpis.wonDeals.toLocaleString(), raw: kpis.wonDeals },
    { label: "Revenue", value: `$${(kpis.totalRevenue / 1000).toFixed(0)}K`, raw: kpis.totalRevenue },
  ];

  return (
    <div className="space-y-4">
      {/* Insight chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border bg-muted/40 text-muted-foreground hover:bg-muted"
          onClick={() => router.push(hasDashboardData ? "/reports" : "/data-sync")}
        >
          <Inbox className="h-3 w-3" />
          {hasDashboardData ? "Insights require enough historical data" : "Connect data sources to generate insights"}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Executive overview of marketing, sales and revenue performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <GlobalDateFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => router.push("/reports")}>
            Export
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Key Metrics</h2>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowKpiPicker(!showKpiPicker)}>
            <Settings className="h-3 w-3 mr-1" /> Customize
          </Button>
        </div>

        {showKpiPicker && (
          <Card className="mb-3 py-2">
            <div className="px-3 flex flex-wrap gap-1">
              {Object.entries(kpiLabels).map(([key, { label }]) => {
                const visible = visibleKpis.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleKpi(key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      visible
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {visible ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {visibleKpis.slice(0, 4).map((key) => {
            const { label, format } = kpiLabels[key];
            const value = kpis[key as keyof typeof kpis] as number;
            return (
              <Card key={key} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/pipeline")}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold font-mono">{format(value)}</p>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                    <span>No comparison data</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Row 2: Growth Funnel + Revenue Trend */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/attribution")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Growth Funnel</CardTitle>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 h-[180px] items-end">
              {funnelStages.map((stage, i) => {
                const maxRaw = Math.max(...funnelStages.map((s) => s.raw), 1);
                const height = Math.max(20, (stage.raw / maxRaw) * 140);
                return (
                  <div key={stage.label} className="flex flex-col items-center gap-2">
                    <div className="text-center">
                      <p className="text-sm font-bold font-mono">{stage.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stage.label}</p>
                    </div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all hover:from-primary/80 hover:to-primary/40"
                      style={{ height: `${height}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/attribution")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Revenue Trend</CardTitle>
              <div className="flex gap-0.5">
                {trendMetrics.map((m) => (
                  <button
                    key={m}
                    onClick={(e) => { e.stopPropagation(); setTrendMetric(m); }}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${trendMetric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {m === "wonDeals" ? "Won" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey={trendMetric === "revenue" ? "revenue" : "value"} stroke="#2563EB" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Platform Performance + Pipeline */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/campaigns")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Platform Performance</CardTitle>
              <div className="flex gap-0.5">
                {platformMetrics.map((m) => (
                  <button
                    key={m}
                    onClick={(e) => { e.stopPropagation(); setPlatformMetric(m); }}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${platformMetric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    {m === "wonDeals" ? "Won" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformChartData}
                  dataKey="value"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {platformChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/pipeline") }>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Pipeline Health</CardTitle>
              <Badge variant="secondary" className="text-[10px]">${(pipelineValue / 1000).toFixed(0)}K weighted</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dealsByStage.map((stage) => (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{stage.name}</span>
                  <span className="font-mono font-medium">{stage.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(stage.count / maxStageCount) * 100}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Recent Activity + Executive Insights */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/leads")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.slice(0, 6).map((a, i) => (
              <div key={i} className="flex gap-2.5 text-xs py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Executive Insights */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/dashboard")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Executive Insights</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No executive insights yet</p>
              <p className="text-xs mt-1 max-w-[220px]">
                {hasDashboardData
                  ? "Insights will appear after enough synced history is available."
                  : "Connect ad platforms and sync records to generate insights."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
