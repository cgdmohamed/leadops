"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRecords, type ApiRecord } from "@/lib/use-records";
import { PlatformBadge } from "@/components/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/skeletons";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Mail,
  Phone,
  Building2,
  StickyNote,
  SlidersHorizontal,
  X,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import type { Lead, LeadStatus, Platform } from "@/lib/types";

const LEADS_PER_PAGE = 10;

const statuses: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
  { value: "qualified", label: "Qualified", color: "bg-purple-100 text-purple-700" },
];

function toLead(record: ApiRecord): Lead {
  const d = record.data as Record<string, unknown>;
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  return {
    id: record.id,
    name: str(d.name),
    email: str(d.email),
    phone: str(d.phone),
    company: str(d.company),
    platform: str(d.platform) as Platform,
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

const platforms: { value: Platform; label: string }[] = [
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "tiktok", label: "TikTok" },
  { value: "snapchat", label: "Snapchat" },
];

const dateFilters = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const ALL_COLUMNS = ["Lead", "Stage", "Source", "Platform", "Owner", "Created", "Value"] as const;
type ColumnKey = (typeof ALL_COLUMNS)[number];

const DEFAULT_VISIBLE: ColumnKey[] = ["Lead", "Stage", "Source", "Platform", "Owner"];

export default function LeadsPage() {
  const router = useRouter();
  const { items: leadRecords, loading, load, create, update, remove } = useRecords("leads");
  const { items: noteRecords } = useRecords("notes");
  const leads = useMemo<Lead[]>(() => leadRecords.map((r) => toLead(r)), [leadRecords]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");

  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>([...DEFAULT_VISIBLE]);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach((l) => {
      if (!map.has(l.ownerId)) map.set(l.ownerId, l.ownerName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [leads]);

  const sources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.source));
    return Array.from(set).sort();
  }, [leads]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedPlatforms.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedOwner !== "all") count++;
    if (selectedSource !== "all") count++;
    if (selectedDateFilter !== "all") count++;
    return count;
  }, [selectedPlatforms, selectedStatuses, selectedOwner, selectedSource, selectedDateFilter]);

  const clearAllFilters = () => {
    setSelectedPlatforms([]);
    setSelectedStatuses([]);
    setSelectedOwner("all");
    setSelectedSource("all");
    setSelectedDateFilter("all");
  };

  const togglePlatformFilter = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const toggleStatusFilter = (s: LeadStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleColumn = (col: ColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch =
        !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        l.company?.toLowerCase().includes(search.toLowerCase());

      const matchPlatform =
        selectedPlatforms.length === 0 || selectedPlatforms.includes(l.platform);

      const matchStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(l.status);

      const matchOwner =
        selectedOwner === "all" || l.ownerId === selectedOwner;

      const matchSource =
        selectedSource === "all" || l.source === selectedSource;

      let matchDate = true;
      if (selectedDateFilter !== "all") {
        const days = Number(selectedDateFilter);
        const created = new Date(l.createdAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        matchDate = created >= cutoff;
      }

      return matchSearch && matchPlatform && matchStatus && matchOwner && matchSource && matchDate;
    });
  }, [leads, search, selectedPlatforms, selectedStatuses, selectedOwner, selectedSource, selectedDateFilter]);

  const totalPages = Math.ceil(filtered.length / LEADS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * LEADS_PER_PAGE, page * LEADS_PER_PAGE);

  const totalValue = 0;
  const qualifiedLeads = filtered.filter((l) => l.status === "qualified").length;
  const avgDays =
    filtered.length > 0
      ? Math.round(
          filtered.reduce((s, l) => {
            const created = new Date(l.createdAt);
            const now = new Date();
            return s + Math.ceil((now.getTime() - created.getTime()) / 86400000);
          }, 0) / filtered.length
        )
      : 0;

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          update(id, { status: bulkStatus as LeadStatus, updatedAt: new Date().toISOString() })
        )
      );
      toast.success(`${selectedIds.length} leads updated`, {
        description: `Status changed to ${bulkStatus}.`,
      });
      setSelectedIds([]);
      setBulkStatus("");
      setBulkStatusOpen(false);
    } catch {
      toast.error("Failed to update leads");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => remove(id)));
      toast.success(`${selectedIds.length} leads deleted`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch {
      toast.error("Failed to delete leads");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success("Lead deleted");
      if (detailLead?.id === id) setDetailLead(null);
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const handleAddNote = async () => {
    if (!detailLead || !noteText.trim()) return;
    try {
      await create({ leadId: detailLead.id, content: noteText.trim(), createdAt: new Date().toISOString() }, detailLead.ownerId) as unknown as unknown;
      setNoteText("");
      await load();
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">{filtered.length} leads total</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {ALL_COLUMNS.map((col) => (
                <DropdownMenuItem key={col} onSelect={(e) => e.preventDefault()}>
                  <label className="flex items-center gap-2 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col)}
                      onChange={() => toggleColumn(col)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    <span className="text-sm">{col}</span>
                  </label>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 relative"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Qualified Leads</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{qualifiedLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold mt-1">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Avg. Days Open</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{avgDays}d</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {selectedPlatforms.map((p) => (
                <Badge key={p} variant="secondary" className="gap-1 pr-1">
                  {p}
                  <button
                    onClick={() => togglePlatformFilter(p)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedStatuses.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1">
                  {s}
                  <button
                    onClick={() => toggleStatusFilter(s)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedOwner !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Owner: {owners.find((o) => o.id === selectedOwner)?.name}
                  <button
                    onClick={() => setSelectedOwner("all")}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedSource !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Source: {selectedSource}
                  <button
                    onClick={() => setSelectedSource("all")}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedDateFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {dateFilters.find((d) => d.value === selectedDateFilter)?.label}
                  <button
                    onClick={() => setSelectedDateFilter("all")}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            </div>
          )}

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-primary/5 border border-primary/20">
              <span className="text-sm font-medium text-primary">
                {selectedIds.length} selected
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Select
                value={bulkStatus}
                onValueChange={(v) => v && setBulkStatus(v)}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!bulkStatus}
                onClick={() => setBulkStatusOpen(true)}
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState
            type={hasActiveFilters ? "search" : "leads"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters or clearing them to see more results."
                : "Create your first lead to get started."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 bg-background">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === paginated.length && paginated.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableHead>
                  {visibleColumns.includes("Lead") && <TableHead>Lead</TableHead>}
                  {visibleColumns.includes("Platform") && <TableHead>Platform</TableHead>}
                  {visibleColumns.includes("Stage") && <TableHead>Status</TableHead>}
                  {visibleColumns.includes("Source") && <TableHead>Source</TableHead>}
                  {visibleColumns.includes("Owner") && <TableHead>Owner</TableHead>}
                  {visibleColumns.includes("Created") && <TableHead>Created</TableHead>}
                  {visibleColumns.includes("Value") && <TableHead>Value</TableHead>}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    {visibleColumns.includes("Lead") && (
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.includes("Platform") && (
                      <TableCell>
                        <PlatformBadge platform={lead.platform} />
                      </TableCell>
                    )}
                    {visibleColumns.includes("Stage") && (
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${statuses.find((s) => s.value === lead.status)?.color} border-0`}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("Source") && (
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{lead.source}</span>
                      </TableCell>
                    )}
                    {visibleColumns.includes("Owner") && (
                      <TableCell>
                        <span className="text-sm">{lead.ownerName}</span>
                      </TableCell>
                    )}
                    {visibleColumns.includes("Created") && (
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes("Value") && (
                      <TableCell>
                        <span className="text-sm text-muted-foreground">-</span>
                      </TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(lead.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * LEADS_PER_PAGE + 1}–
                  {Math.min(page * LEADS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const p = i + 1;
                    return (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        className="w-8"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-[340px] sm:w-[380px]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2.5 block">Platform</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => {
                  const active = selectedPlatforms.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      onClick={() => togglePlatformFilter(p.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2.5 block">Status</Label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => {
                  const active = selectedStatuses.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      onClick={() => toggleStatusFilter(s.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2.5 block">Owner</Label>
              <Select value={selectedOwner} onValueChange={(v) => v && setSelectedOwner(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2.5 block">Source</Label>
              <Select value={selectedSource} onValueChange={(v) => v && setSelectedSource(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2.5 block">Created Date</Label>
              <div className="flex flex-wrap gap-2">
                {dateFilters.map((d) => {
                  const active = selectedDateFilter === d.value;
                  return (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDateFilter(d.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t p-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
            <Button className="flex-1" onClick={() => setFilterOpen(false)}>
              Apply
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={!!detailLead}
        onOpenChange={(o) => {
          if (!o) {
            setDetailLead(null);
            setNoteText("");
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {detailLead && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{detailLead.name}</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-2">
                <PlatformBadge platform={detailLead.platform} />
                <Badge
                  variant="secondary"
                  className={statuses.find((s) => s.value === detailLead.status)?.color}
                >
                  {detailLead.status}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{detailLead.email}</span>
                </div>
                {detailLead.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{detailLead.phone}</span>
                  </div>
                )}
                {detailLead.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>{detailLead.company}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Campaign</p>
                  <p className="font-medium text-xs">{detailLead.campaignName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Owner</p>
                  <p className="font-medium text-xs">{detailLead.ownerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <p className="font-medium capitalize">{detailLead.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Created</p>
                  <p className="font-medium text-xs">
                    {new Date(detailLead.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Activity & Notes
                </h4>

                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {noteRecords
                    .filter((a) => (a.data as { leadId?: string })?.leadId === detailLead.id)
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((note) => (
                      <div key={note.id} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge
                              variant="outline"
                              className="text-xs py-0 px-1.5 h-5 capitalize"
                            >
                              note
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{(note.data as { content?: string })?.content}</p>
                        </div>
                      </div>
                    ))}
                  {noteRecords.filter((a) => (a.data as { leadId?: string })?.leadId === detailLead.id).length ===
                    0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                </div>
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="lead-note" className="text-sm font-medium">
                  Add Note
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Textarea
                    id="lead-note"
                    placeholder="Type a note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title="Delete Lead"
        description="This action cannot be undone. The lead will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Selected Leads"
        description={`This will permanently delete ${selectedIds.length} leads. This action cannot be undone.`}
        confirmLabel="Delete All"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
      <ConfirmDialog
        open={bulkStatusOpen}
        onOpenChange={setBulkStatusOpen}
        title="Update Status"
        description={`Change ${selectedIds.length} leads to "${bulkStatus}"?`}
        confirmLabel="Apply"
        onConfirm={handleBulkStatus}
      />
    </div>
  );
}
