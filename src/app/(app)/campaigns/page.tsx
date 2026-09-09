"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRecords, type ApiRecord } from "@/lib/use-records";
import { PlatformBadge } from "@/components/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CampaignForm } from "@/components/campaign-form";
import { EmptyState } from "@/components/empty-state";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Trash2,
  Pause,
  Play,
  Eye,
  Filter,
  X,
  DollarSign,
  Users,
  Target,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import type { Campaign, Platform } from "@/lib/types";

const platforms: { value: Platform | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "tiktok", label: "TikTok" },
  { value: "snapchat", label: "Snapchat" },
];

const statuses = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
];

const sortOptions = [
  { value: "spend", label: "Spend" },
  { value: "leads", label: "Leads" },
  { value: "revenue", label: "Revenue" },
  { value: "cpl", label: "CPL" },
  { value: "roas", label: "ROAS" },
];

type ColumnKey = "campaign" | "platform" | "status" | "spend" | "revenue" | "roas" | "cpl" | "leads" | "startDate";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "campaign", label: "Campaign" },
  { key: "platform", label: "Platform" },
  { key: "status", label: "Status" },
  { key: "spend", label: "Spend" },
  { key: "revenue", label: "Revenue" },
  { key: "roas", label: "ROAS" },
  { key: "cpl", label: "CPL" },
  { key: "leads", label: "Leads" },
  { key: "startDate", label: "Start Date" },
];

const DEFAULT_COLUMNS: ColumnKey[] = ["campaign", "platform", "status", "spend", "revenue", "roas", "leads"];

function toCampaign(record: ApiRecord): Campaign {
  const d = record.data as Record<string, unknown>;
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
  };
}

export default function CampaignsPage() {
  const router = useRouter();
  const { items: campaignRecords, create, update, remove } = useRecords<Record<string, unknown>>("campaigns");
  const campaigns = useMemo<Campaign[]>(() => campaignRecords.map((r) => toCampaign(r)), [campaignRecords]);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("spend");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const hasFilters = platform !== "all" || status !== "all";

  const CAMPAIGNS_PER_PAGE = 10;

  const filtered = useMemo(() => {
    const result = campaigns.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = platform === "all" || c.platform === platform;
      const matchStatus = status === "all" || c.status === status;
      return matchSearch && matchPlatform && matchStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "spend": return b.spend - a.spend;
        case "leads": return b.leads - a.leads;
        case "revenue": return b.wonRevenue - a.wonRevenue;
        case "cpl": return a.costPerLead - b.costPerLead;
        case "roas": return (b.spend > 0 ? b.wonRevenue / b.spend : 0) - (a.spend > 0 ? a.wonRevenue / a.spend : 0);
        default: return 0;
      }
    });

    return result;
  }, [campaigns, search, platform, status, sortBy]);

  const totalPages = Math.ceil(filtered.length / CAMPAIGNS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * CAMPAIGNS_PER_PAGE, page * CAMPAIGNS_PER_PAGE);

  const totalSpend = filtered.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = filtered.reduce((s, c) => s + c.wonRevenue, 0);
  const totalLeads = filtered.reduce((s, c) => s + c.leads, 0);
  const avgRoas = filtered.length > 0 ? filtered.reduce((s, c) => s + (c.spend > 0 ? c.wonRevenue / c.spend : 0), 0) / filtered.length : 0;

  const platformStats = useMemo(() => {
    const stats: Record<string, { spend: number; revenue: number; leads: number; count: number }> = {};
    campaigns.forEach((c) => {
      if (!stats[c.platform]) stats[c.platform] = { spend: 0, revenue: 0, leads: 0, count: 0 };
      stats[c.platform].spend += c.spend;
      stats[c.platform].revenue += c.wonRevenue;
      stats[c.platform].leads += c.leads;
      stats[c.platform].count++;
    });
    return stats;
  }, [campaigns]);

  const handleCreate = async (data: { name: string; platform: string; budget: number }) => {
    try {
      await create({
        name: data.name,
        platform: data.platform,
        status: "active",
        spend: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        costPerLead: 0,
        wonRevenue: 0,
        startDate: new Date().toISOString().split("T")[0],
      });
      toast.success("Campaign created", { description: `"${data.name}" is now active.` });
      setCreateOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    try {
      await remove(id);
      toast.success("Campaign deleted", { description: `"${campaign?.name}" has been removed.` });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleStatus = async (id: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    const next = campaign?.status === "active" ? "paused" : "active";
    try {
      await update(id, { status: next });
      toast.success(`Campaign ${next}`, { description: campaign?.name });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const clearFilters = () => { setPlatform("all"); setStatus("all"); };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const hasActiveFilter = (p: Platform) => platform === p;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} campaigns across 4 platforms</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Spend</p>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold mt-0.5">${(totalSpend / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            </div>
            <p className="text-xl font-bold mt-0.5">${(totalRevenue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Avg. ROAS</p>
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold mt-0.5">{avgRoas.toFixed(1)}x</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Total Leads</p>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold mt-0.5">{totalLeads.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["meta", "google", "tiktok", "snapchat"] as Platform[]).map((p) => {
          const stat = platformStats[p];
          if (!stat) return null;
          const roas = stat.spend > 0 ? (stat.revenue / stat.spend).toFixed(1) : "0";
          const isActive = hasActiveFilter(p);
          return (
            <Card
              key={p}
              className={`cursor-pointer transition-all hover:bg-muted/50 ${
                isActive ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onClick={() => setPlatform(platform === p ? "all" : p)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={p} />
                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlatform("all");
                        }}
                        className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                      >
                        <X className="h-2.5 w-2.5 text-primary" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{stat.count} campaigns</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Spend</p>
                    <p className="font-medium">${(stat.spend / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">${(stat.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROAS</p>
                    <p className="font-medium">{roas}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {hasFilters && <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px]">!</Badge>}
        </Button>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnSettings(!showColumnSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          {showColumnSettings && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md p-2 min-w-[180px]">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Toggle Columns</p>
              {ALL_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted text-sm"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-input"
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 ml-auto">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <Card className="py-3">
          <div className="px-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">Platform</span>
            <div className="flex gap-1">
              {platforms.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setPlatform(p.value); setPage(1); }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    platform === p.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <div className="flex gap-1">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setStatus(s.value); setPage(1); }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    status === s.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {hasFilters && (
              <>
                <div className="h-4 w-px bg-border" />
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear
                </button>
              </>
            )}
          </div>
        </Card>
      )}

      {paginated.length === 0 ? (
        <EmptyState
          type={search || platform !== "all" || status !== "all" ? "search" : "campaigns"}
          action={
            search || platform !== "all" || status !== "all" ? (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 bg-card z-10">
                  {visibleColumns.includes("campaign") && <TableHead>Campaign</TableHead>}
                  {visibleColumns.includes("platform") && <TableHead>Platform</TableHead>}
                  {visibleColumns.includes("status") && <TableHead>Status</TableHead>}
                  {visibleColumns.includes("spend") && <TableHead className="text-right">Spend</TableHead>}
                  {visibleColumns.includes("revenue") && <TableHead className="text-right">Revenue</TableHead>}
                  {visibleColumns.includes("roas") && <TableHead className="text-right">ROAS</TableHead>}
                  {visibleColumns.includes("cpl") && <TableHead className="text-right">CPL</TableHead>}
                  {visibleColumns.includes("leads") && <TableHead className="text-right">Leads</TableHead>}
                  {visibleColumns.includes("startDate") && <TableHead>Start Date</TableHead>}
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((campaign) => {
                  const roas = campaign.spend > 0 ? (campaign.wonRevenue / campaign.spend).toFixed(1) : "0";
                  return (
                    <TableRow
                      key={campaign.id}
                      className="cursor-pointer hover:bg-muted/50 h-12"
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                    >
                      {visibleColumns.includes("campaign") && (
                        <TableCell className="py-2">
                          <p className="font-medium text-sm">{campaign.name}</p>
                        </TableCell>
                      )}
                      {visibleColumns.includes("platform") && (
                        <TableCell className="py-2">
                          <PlatformBadge platform={campaign.platform} />
                        </TableCell>
                      )}
                      {visibleColumns.includes("status") && (
                        <TableCell className="py-2">
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
                        </TableCell>
                      )}
                      {visibleColumns.includes("spend") && (
                        <TableCell className="text-right py-2">${campaign.spend.toLocaleString()}</TableCell>
                      )}
                      {visibleColumns.includes("revenue") && (
                        <TableCell className="text-right font-medium py-2">${campaign.wonRevenue.toLocaleString()}</TableCell>
                      )}
                      {visibleColumns.includes("roas") && (
                        <TableCell className="text-right py-2">
                          <span className={Number(roas) >= 3 ? "text-success" : Number(roas) >= 2 ? "text-foreground" : "text-destructive"}>
                            {roas}x
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.includes("cpl") && (
                        <TableCell className="text-right py-2">
                          <span className={campaign.costPerLead < 40 ? "text-success" : campaign.costPerLead < 60 ? "text-foreground" : "text-destructive"}>
                            ${campaign.costPerLead.toFixed(0)}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.includes("leads") && (
                        <TableCell className="text-right py-2">{campaign.leads}</TableCell>
                      )}
                      {visibleColumns.includes("startDate") && (
                        <TableCell className="py-2 text-sm text-muted-foreground">{campaign.startDate}</TableCell>
                      )}
                      <TableCell onClick={(e) => e.stopPropagation()} className="py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title={campaign.status === "active" ? "Pause" : "Resume"}
                            onClick={() => toggleStatus(campaign.id)}
                          >
                            {campaign.status === "active" ? (
                              <Pause className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(campaign.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * CAMPAIGNS_PER_PAGE + 1}–{Math.min(page * CAMPAIGNS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <Button key={p} variant={page === p ? "default" : "outline"} size="sm" className="w-8" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {showColumnSettings && (
        <div className="fixed inset-0 z-40" onClick={() => setShowColumnSettings(false)} />
      )}

      <CampaignForm open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Delete Campaign"
        description="This action cannot be undone. The campaign will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { if (deleteId) handleDelete(deleteId); }}
      />
    </div>
  );
}
