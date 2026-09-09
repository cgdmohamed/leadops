"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRecords, type ApiRecord } from "@/lib/use-records";
import { PlatformBadge } from "@/components/platform-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/skeletons";
import {
  ArrowLeft,
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  TrendingUp,
  Target,
  Calendar,
  ChevronRight,
  BarChart3,
  Trophy,
  Briefcase,
  Wallet,
} from "lucide-react";
import type { Campaign, Platform } from "@/lib/types";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { items: campaignRecords, loading } = useRecords<Record<string, unknown>>("campaigns");
  const { items: leadRecords } = useRecords<Record<string, unknown>>("leads");
  const { items: noteRecords } = useRecords<Record<string, unknown>>("notes");
  const { items: oppRecords } = useRecords<Record<string, unknown>>("opportunities");

  const campaign = useMemo<Campaign | null>(() => {
    const record = campaignRecords.find((r) => r.id === id);
    if (!record) return null;
    const d = record.data;
    const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
    const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
    return {
      id: record.id,
      name: str(d.name),
      platform: str(d.platform, "meta") as Platform,
      status: str(d.status, "active") as Campaign["status"],
      spend: num(d.spend),
      impressions: num(d.impressions),
      clicks: num(d.clicks),
      leads: num(d.leads),
      costPerLead: num(d.costPerLead),
      wonRevenue: num(d.wonRevenue),
      startDate: str(d.startDate, record.createdAt.split("T")[0]),
      endDate: str(d.endDate),
    };
  }, [campaignRecords, id]);

  const campaignLeads = useMemo(() => {
    return leadRecords.filter((r) => (r.data as Record<string, unknown>).campaignId === id);
  }, [leadRecords, id]);

  const campaignActivities = useMemo(() => {
    const leadIds = new Set(campaignLeads.map((l) => l.id));
    return noteRecords
      .filter((n) => leadIds.has((n.data as Record<string, unknown>).leadId as string))
      .map((n) => ({
        id: n.id,
        createdAt: n.createdAt,
        type: "note",
        description: String((n.data as Record<string, unknown>).content ?? ""),
        createdByName: "System",
      }));
  }, [noteRecords, campaignLeads]);

  const businessPerformance = useMemo(() => {
    if (!campaign) return null;
    const campaignOpps = oppRecords
      .filter((r) => (r.data as Record<string, unknown>).campaignId === id)
      .map((r) => r.data as Record<string, unknown>);
    const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
    const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
    const qualifiedLeads = campaignLeads.filter((l) => (l.data as Record<string, unknown>).status === "qualified").length;
    const openOpps = campaignOpps.filter((o) => str(o.stage) !== "closed_won" && str(o.stage) !== "closed_lost");
    const wonDeals = campaignOpps.filter((o) => str(o.stage) === "closed_won");
    const pipelineValue = openOpps.reduce((s, o) => s + num(o.value) * (num(o.probability) / 100), 0);
    const totalRevenue = wonDeals.reduce((s, o) => s + num(o.value), 0);
    const collectedRevenue = Math.round(totalRevenue * 0.85);
    const cac = wonDeals.length > 0 ? Math.round(campaign.spend / wonDeals.length) : 0;
    const realRoas = campaign.spend > 0 ? Math.round((totalRevenue / campaign.spend) * 100) / 100 : 0;
    return {
      qualifiedLeads,
      opportunities: openOpps.length,
      wonDeals: wonDeals.length,
      pipelineValue,
      collectedRevenue,
      cac,
      realRoas,
    };
  }, [campaign, campaignLeads, oppRecords, id]);

  const dailySpend: { date: string; spend: number }[] = [];

  if (loading && campaignRecords.length === 0) {
    return <TableSkeleton rows={6} />;
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/campaigns")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Campaign not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const ctr =
    campaign.impressions > 0
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : "0";
  const convRate =
    campaign.clicks > 0
      ? ((campaign.leads / campaign.clicks) * 100).toFixed(1)
      : "0";
  const roas =
    campaign.spend > 0
      ? (campaign.wonRevenue / campaign.spend).toFixed(1)
      : "0";

  const metrics = [
    {
      label: "Spend",
      value: `$${campaign.spend.toLocaleString()}`,
      icon: DollarSign,
      color: "text-muted-foreground",
    },
    {
      label: "Revenue",
      value: `$${campaign.wonRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-success",
    },
    {
      label: "ROAS",
      value: `${roas}x`,
      icon: Target,
      color:
        Number(roas) >= 3
          ? "text-success"
          : Number(roas) >= 2
            ? "text-foreground"
            : "text-destructive",
    },
    {
      label: "Leads",
      value: campaign.leads.toString(),
      icon: Users,
      color: "text-foreground",
    },
    {
      label: "CPL",
      value: `$${campaign.costPerLead.toFixed(0)}`,
      icon: DollarSign,
      color:
        campaign.costPerLead < 40
          ? "text-success"
          : campaign.costPerLead < 60
            ? "text-foreground"
            : "text-destructive",
    },
    {
      label: "CTR",
      value: `${ctr}%`,
      icon: MousePointerClick,
      color: "text-foreground",
    },
    {
      label: "Conv. Rate",
      value: `${convRate}%`,
      icon: Target,
      color: "text-foreground",
    },
    {
      label: "Impressions",
      value: campaign.impressions.toLocaleString(),
      icon: Eye,
      color: "text-muted-foreground",
    },
  ];

  const maxSpend = Math.max(...dailySpend.map((d) => d.spend), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/campaigns")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <button
                onClick={() => router.push("/campaigns")}
                className="hover:text-foreground"
              >
                Campaigns
              </button>
              <ChevronRight className="h-3 w-3" />
              <button
                onClick={() =>
                  router.push(`/campaigns?platform=${campaign.platform}`)
                }
                className="hover:text-foreground capitalize"
              >
                {campaign.platform}
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">
                {campaign.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <PlatformBadge platform={campaign.platform} />
              <Badge
                variant="secondary"
                className={
                  campaign.status === "active"
                    ? "bg-emerald-100 text-emerald-700 border-0"
                    : campaign.status === "paused"
                      ? "bg-amber-100 text-amber-700 border-0"
                      : "bg-gray-100 text-gray-700 border-0"
                }
              >
                {campaign.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.slice(0, 4).map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.slice(4).map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Spend Trend (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailySpend.every((d) => d.spend === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              No spend data for the last 7 days.
            </p>
          ) : (
            <div className="flex items-end gap-1 h-24">
              {dailySpend.map((d) => {
                const height =
                  maxSpend > 0
                    ? Math.max((d.spend / maxSpend) * 100, 2)
                    : 2;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {d.spend > 0 ? `$${d.spend}` : ""}
                    </span>
                    <div
                      className="w-full bg-primary/20 rounded-sm relative"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-sm"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(d.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { weekday: "short" }
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Campaign Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{campaign.startDate}</span>
            </div>
            {campaign.endDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{campaign.endDate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <PlatformBadge platform={campaign.platform} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant="secondary"
                className={
                  campaign.status === "active"
                    ? "bg-emerald-100 text-emerald-700 border-0"
                    : campaign.status === "paused"
                      ? "bg-amber-100 text-amber-700 border-0"
                      : "bg-gray-100 text-gray-700 border-0"
                }
              >
                {campaign.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads ({campaignLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No leads from this campaign yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {campaignLeads.slice(0, 10).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{String((lead.data as Record<string, unknown>).name ?? "")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {String((lead.data as Record<string, unknown>).email ?? "")}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] shrink-0 ml-2"
                    >
                      {String((lead.data as Record<string, unknown>).status ?? "new")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {campaignActivities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1 h-4 capitalize"
                        >
                          {activity.type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      </div>
                      <p className="truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        by {activity.createdByName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {businessPerformance && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Business Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Qualified Leads</p>
                  <p className="text-lg font-bold">{businessPerformance.qualifiedLeads}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Opportunities</p>
                  <p className="text-lg font-bold">{businessPerformance.opportunities}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Won Deals</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-success" />
                    {businessPerformance.wonDeals}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Pipeline Value</p>
                  <p className="text-lg font-bold">
                    ${businessPerformance.pipelineValue.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Collected Revenue</p>
                  <p className="text-lg font-bold text-success">
                    ${businessPerformance.collectedRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">CAC</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    ${businessPerformance.cac.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Real ROAS</p>
                  <p className="text-lg font-bold">
                    {businessPerformance.realRoas}x
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
