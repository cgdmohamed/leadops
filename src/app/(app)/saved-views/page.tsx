"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/platform-badge";
import { EmptyState } from "@/components/empty-state";
import { useRecords, type ApiRecord } from "@/lib/use-records";
import { type Lead, type LeadStatus, type Platform } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Star,
  Clock,
  AlertTriangle,
  UserX,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Plus,
  MoreHorizontal,
  Copy,
  Share2,
  Trash2,
  Pencil,
  Layers,
} from "lucide-react";

interface SavedView {
  id: string;
  name: string;
  icon: React.ReactNode;
  filter: (lead: Lead) => boolean;
  color?: string;
}

interface ViewFormData {
  name: string;
  platform: Platform | "all";
  status: LeadStatus | "all";
  owner: string;
}

const statusColors: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-purple-100 text-purple-700 border-purple-200",
  qualified: "bg-amber-100 text-amber-700 border-amber-200",
};

const defaultViews: SavedView[] = [
  {
    id: "unassigned",
    name: "Unassigned Leads",
    icon: <UserX className="h-4 w-4" />,
    filter: (l) => !l.ownerName || l.ownerName === "Unassigned",
    color: "#EF4444",
  },
  {
    id: "needs-followup",
    name: "Needs Follow-up",
    icon: <Clock className="h-4 w-4" />,
    filter: (l) => l.status === "contacted" || l.status === "qualified",
    color: "#F59E0B",
  },
  {
    id: "high-value",
    name: "High Value",
    icon: <Star className="h-4 w-4" />,
    filter: (l) => l.status === "qualified",
    color: "#8B5CF6",
  },
  {
    id: "hot-leads",
    name: "Hot Leads",
    icon: <Sparkles className="h-4 w-4" />,
    filter: (l) => l.status === "contacted" || l.status === "qualified",
    color: "#EF4444",
  },
  {
    id: "stale",
    name: "Stale (>7 days)",
    icon: <AlertTriangle className="h-4 w-4" />,
    filter: (l) => {
      const daysSince = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 86400000);
      return daysSince > 7;
    },
    color: "#F97316",
  },
  {
    id: "new-today",
    name: "New Today",
    icon: <Sparkles className="h-4 w-4" />,
    filter: (l) => {
      const today = new Date().toISOString().split("T")[0];
      return l.createdAt.startsWith(today);
    },
    color: "#3B82F6",
  },
];

function buildFilter(
  platform: Platform | "all",
  status: LeadStatus | "all",
  owner: string
): (lead: Lead) => boolean {
  return (lead: Lead) => {
    if (platform !== "all" && lead.platform !== platform) return false;
    if (status !== "all" && lead.status !== status) return false;
    if (owner && owner !== "all" && lead.ownerName !== owner) return false;
    return true;
  };
}

function getIconForFilter(
  platform: Platform | "all",
  status: LeadStatus | "all"
): React.ReactNode {
  if (platform !== "all") return <TrendingUp className="h-4 w-4" />;
  if (status === "new") return <Sparkles className="h-4 w-4" />;
  if (status === "contacted") return <Clock className="h-4 w-4" />;
  if (status === "qualified") return <Star className="h-4 w-4" />;
  return <Layers className="h-4 w-4" />;
}

function getColorForFilter(
  platform: Platform | "all",
  status: LeadStatus | "all"
): string {
  if (platform === "meta") return "#1877F2";
  if (platform === "google") return "#4285F4";
  if (platform === "tiktok") return "#000000";
  if (platform === "snapchat") return "#FFFC00";
  if (status === "new") return "#3B82F6";
  if (status === "contacted") return "#8B5CF6";
  if (status === "qualified") return "#F59E0B";
  return "#6366F1";
}

export default function SavedViewsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { items: leadRecords } = useRecords<Record<string, unknown>>("leads");
  const leads = useMemo<Lead[]>(() => leadRecords.map((r: ApiRecord) => {
    const d = r.data as Record<string, unknown>;
    const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
    return {
      id: r.id,
      name: str(d.name),
      email: str(d.email),
      phone: str(d.phone),
      company: str(d.company),
      platform: str(d.platform, "meta") as Platform,
      campaignId: str(d.campaignId),
      campaignName: str(d.campaignName),
      status: str(d.status, "new") as LeadStatus,
      ownerId: r.ownerId ?? "",
      ownerName: str(d.ownerName, "Unassigned"),
      source: str(d.source),
      createdAt: r.createdAt,
      updatedAt: str(d.updatedAt, r.updatedAt),
      convertedToOpportunity: str(d.convertedToOpportunity),
    };
  }), [leadRecords]);
  const [savedViews, setSavedViews] = useState<SavedView[]>(defaultViews);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [formData, setFormData] = useState<ViewFormData>({
    name: "",
    platform: "all",
    status: "all",
    owner: "all",
  });

  const uniqueOwners = useMemo(() => {
    const owners = new Set<string>();
    leads.forEach((l) => {
      if (l.ownerName && l.ownerName !== "Unassigned") {
        owners.add(l.ownerName);
      }
    });
    return Array.from(owners).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, search]);

  const getViewLeads = (view: SavedView) => filteredLeads.filter(view.filter);

  const handleCreateView = () => {
    if (!formData.name.trim()) return;

    const newView: SavedView = {
      id: `custom-${Date.now()}`,
      name: formData.name.trim(),
      icon: getIconForFilter(formData.platform, formData.status),
      filter: buildFilter(formData.platform, formData.status, formData.owner),
      color: getColorForFilter(formData.platform, formData.status),
    };

    setSavedViews((prev) => [...prev, newView]);
    setFormData({ name: "", platform: "all", status: "all", owner: "all" });
    setCreateDialogOpen(false);
  };

  const handleRename = () => {
    if (!renamingViewId || !renameValue.trim()) return;
    setSavedViews((prev) =>
      prev.map((v) => (v.id === renamingViewId ? { ...v, name: renameValue.trim() } : v))
    );
    setRenameDialogOpen(false);
    setRenamingViewId(null);
    setRenameValue("");
  };

  const handleDuplicate = (view: SavedView) => {
    const newView: SavedView = {
      ...view,
      id: `${view.id}-copy-${Date.now()}`,
      name: `${view.name} (Copy)`,
    };
    setSavedViews((prev) => [...prev, newView]);
  };

  const handleDelete = (viewId: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
  };

  const openRenameDialog = (view: SavedView) => {
    setRenamingViewId(view.id);
    setRenameValue(view.name);
    setRenameDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Views</h1>
          <p className="text-muted-foreground">Quick access to filtered lead lists.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create View
        </Button>
      </div>

      {savedViews.length === 0 ? (
        <EmptyState
          type="views"
          title="No saved views"
          description="Create your first saved view to quickly access filtered lead lists."
          action={
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create View
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {savedViews.map((view) => {
            const viewLeads = getViewLeads(view);
            return (
              <Card
                key={view.id}
                className="cursor-pointer hover:shadow-md transition-all group relative"
                onClick={() => router.push(`/leads?view=${view.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${view.color}20`,
                          color: view.color,
                        }}
                      >
                        {view.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{view.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {viewLeads.length} leads
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {viewLeads.length}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/leads?view=${view.id}`);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                            Open View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openRenameDialog(view);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(view);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(
                                `${window.location.origin}/leads?view=${view.id}`
                              );
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(view.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {viewLeads.length > 0 && (
                    <div className="flex -space-x-1.5 mt-3">
                      {viewLeads.slice(0, 5).map((l) => (
                        <Avatar
                          key={l.id}
                          className="h-6 w-6 border-2 border-background"
                        >
                          <AvatarFallback className="text-[8px] font-medium">
                            {l.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {viewLeads.length > 5 && (
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-medium">
                          +{viewLeads.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">All Leads ({filteredLeads.length})</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 w-64 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="p-4">
            <Tabs defaultValue="all">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs h-6 px-3">
                  All
                </TabsTrigger>
                <TabsTrigger value="by-status" className="text-xs h-6 px-3">
                  By Status
                </TabsTrigger>
                <TabsTrigger value="by-platform" className="text-xs h-6 px-3">
                  By Platform
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {filteredLeads.length === 0 ? (
                  <EmptyState
                    type="search"
                    title="No leads found"
                    description="Try adjusting your search."
                  />
                ) : (
                  <div className="space-y-2">
                    {filteredLeads.slice(0, 20).map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/leads/${lead.id}`)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-medium">
                            {lead.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.email}
                          </p>
                        </div>
                        <PlatformBadge platform={lead.platform} />
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusColors[lead.status]}`}
                        >
                          {lead.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="by-status" className="mt-4">
                {(["new", "contacted", "qualified"] as LeadStatus[]).map((status) => {
                  const statusLeads = filteredLeads.filter((l) => l.status === status);
                  if (statusLeads.length === 0) return null;
                  return (
                    <div key={status} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColors[status]}`}
                        >
                          {status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({statusLeads.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {statusLeads.slice(0, 5).map((lead) => (
                          <div
                            key={lead.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[8px]">
                                {lead.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate flex-1">{lead.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="by-platform" className="mt-4">
                {(["meta", "google", "tiktok", "snapchat"] as const).map((platform) => {
                  const platformLeads = filteredLeads.filter(
                    (l) => l.platform === platform
                  );
                  if (platformLeads.length === 0) return null;
                  return (
                    <div key={platform} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PlatformBadge platform={platform} />
                        <span className="text-xs text-muted-foreground">
                          ({platformLeads.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {platformLeads.slice(0, 5).map((lead) => (
                          <div
                            key={lead.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[8px]">
                                {lead.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate flex-1">{lead.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${statusColors[lead.status]}`}
                            >
                              {lead.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Create View Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Saved View</DialogTitle>
            <DialogDescription>
              Define filters to create a quick-access view of your leads.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                placeholder="e.g. Hot Meta Leads"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(val: string | null) =>
                  setFormData((prev) => ({
                    ...prev,
                    platform: (val ?? "all") as Platform | "all",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="snapchat">Snapchat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val: string | null) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: (val ?? "all") as LeadStatus | "all",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Owner</Label>
              <Select
                value={formData.owner}
                onValueChange={(val: string | null) =>
                  setFormData((prev) => ({ ...prev, owner: val ?? "all" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  {uniqueOwners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleCreateView} disabled={!formData.name.trim()}>
              Create View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename View Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename View</DialogTitle>
            <DialogDescription>Enter a new name for this view.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="rename-input">View Name</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
