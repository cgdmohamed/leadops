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
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Settings,
  ArrowUpRight,
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

const insights = [
  { type: "warning" as const, text: "Meta qualification rate down 18%" },
  { type: "opportunity" as const, text: "Google Search ROAS increased 24%" },
  { type: "critical" as const, text: "12 leads exceeded first-response SLA" },
];

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
        {insights.map((insight, i) => (
          <button
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              insight.type === "warning"
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : insight.type === "opportunity"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
            onClick={() => router.push("/dashboard")}
          >
            {insight.type === "warning" && <AlertTriangle className="h-3 w-3" />}
            {insight.type === "opportunity" && <TrendingUp className="h-3 w-3" />}
            {insight.type === "critical" && <AlertTriangle className="h-3 w-3" />}
            {insight.text}
          </button>
        ))}
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleKpis.slice(0, 4).map((key) => {
            const { label, format } = kpiLabels[key];
            const value = kpis[key as keyof typeof kpis];
            return (
              <Card key={key} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/pipeline")}>
                <CardContent className="p-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-xl font-bold mt-0.5">{format(value as number)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Row 2: Revenue by Platform, Revenue Trend, Growth Funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue by Platform */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/attribution")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Revenue by Platform</CardTitle>
              <div className="flex gap-1">
                {platformMetrics.map((m) => (
                  <button
                    key={m}
                    onClick={(e) => { e.stopPropagation(); setPlatformMetric(m); }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      platformMetric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {m === "wonDeals" ? "Won" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {platformChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [platformMetric === "revenue" || platformMetric === "spend" ? `$${Number(v).toLocaleString()}` : Number(v).toLocaleString(), platformMetric]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {platformData.map((p, i) => (
                  <div key={p.platform} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <PlatformIcon platform={p.platform} className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize">{p.platform}</span>
                    </div>
                    <span className="font-medium">
                      {platformMetric === "revenue" || platformMetric === "spend"
                        ? `$${((platformMetric === "revenue" ? p.revenue : p.spend) / 1000).toFixed(0)}K`
                        : (platformMetric === "leads" ? p.leads : p.wonDeals)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/attribution")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Revenue Trend</CardTitle>
              <div className="flex gap-1">
                {trendMetrics.map((m) => (
                  <button
                    key={m}
                    onClick={(e) => { e.stopPropagation(); setTrendMetric(m); }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      trendMetric === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {m === "wonDeals" ? "Won" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9 }}
                    tickFormatter={(v) => trendMetric === "revenue" || trendMetric === "spend" ? `$${(v / 1000).toFixed(0)}K` : v}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [
                      trendMetric === "revenue" || trendMetric === "spend" ? `$${Number(v).toLocaleString()}` : Number(v).toLocaleString(),
                      trendMetric.charAt(0).toUpperCase() + trendMetric.slice(1),
                    ]}
                  />
                  <Area type="monotone" dataKey={trendMetric === "wonDeals" ? "value" : trendMetric} stroke="#2563EB" strokeWidth={1.5} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Growth Funnel */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/pipeline/analytics")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Growth Funnel</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-0">
              {funnelStages.map((stage, i) => {
                const isLast = i === funnelStages.length - 1;
                const prevRaw = i > 0 ? funnelStages[i - 1].raw : null;
                const convRate = prevRaw && prevRaw > 0 ? ((stage.raw / prevRaw) * 100).toFixed(1) : null;
                const isReverse = stage.label === "Spend" || stage.label === "Traffic";
                return (
                  <div key={stage.label}>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[11px] text-muted-foreground">{stage.label}</span>
                      <span className="text-xs font-semibold">{stage.value}</span>
                    </div>
                    {!isLast && (
                      <div className="flex items-center gap-2 pl-2">
                        <div className="h-3 w-px bg-border" />
                        {convRate && (
                          <span className="text-[9px] text-muted-foreground">
                            {isReverse ? `${(100 - parseFloat(convRate)).toFixed(1)}% drop` : `${convRate}% conv`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Top Campaigns, Pipeline Value, Deals by Stage */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top Campaigns */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/campaigns")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Top Campaigns</CardTitle>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {topCampaigns.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-1.5">
                    <PlatformIcon platform={c.platform} className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">${c.spend.toLocaleString()} spend</span>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="text-xs font-medium">${c.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{c.roas}x ROAS</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/pipeline")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Pipeline Value</CardTitle>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(pipelineValue / 1000).toFixed(0)}K</p>
            <p className="text-[11px] text-muted-foreground mt-1">Total value across all pipeline stages</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold">{kpis.opportunities}</p>
                <p className="text-[9px] text-muted-foreground">Open Opps</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold">{kpis.wonDeals}</p>
                <p className="text-[9px] text-muted-foreground">Won</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-sm font-bold">{kpis.qualifiedLeads}</p>
                <p className="text-[9px] text-muted-foreground">Qualified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deals by Stage */}
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push("/pipeline/analytics")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Sales Pipeline</CardTitle>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {dealsByStage.slice(0, 6).map((stage) => (
              <div key={stage.name}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">{stage.name}</span>
                  <span className="font-medium">{stage.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
          <CardContent className="space-y-2.5">
            <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-0.5">Opportunity</p>
              <p className="text-xs text-emerald-800">Google Search produced 38% of revenue from 24% of spend.</p>
            </div>
            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Warning</p>
              <p className="text-xs text-amber-800">Meta qualification rate decreased by 18%.</p>
            </div>
            <div className="p-2.5 rounded-lg border border-red-200 bg-red-50/50">
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-0.5">Critical</p>
              <p className="text-xs text-red-800">12 leads exceeded first-response SLA.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
