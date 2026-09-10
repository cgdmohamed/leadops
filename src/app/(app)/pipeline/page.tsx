"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRecords, type ApiRecord } from "@/lib/use-records";
import { clientApi } from "@/lib/client-api";
import { PlatformBadge } from "@/components/platform-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GripVertical,
  Phone,
  Mail,
  StickyNote,
  ArrowRight,
  Clock,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Opportunity, OpportunityStage, Platform, TeamMember } from "@/lib/types";

const stages: { status: OpportunityStage; label: string; color: string; bgColor: string; borderColor: string; ringColor: string }[] = [
  { status: "prospecting", label: "Prospecting", color: "bg-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200", ringColor: "ring-blue-200" },
  { status: "discovery", label: "Discovery", color: "bg-purple-500", bgColor: "bg-purple-50", borderColor: "border-purple-200", ringColor: "ring-purple-200" },
  { status: "proposal", label: "Proposal", color: "bg-amber-500", bgColor: "bg-amber-50", borderColor: "border-amber-200", ringColor: "ring-amber-200" },
  { status: "negotiation", label: "Negotiation", color: "bg-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200", ringColor: "ring-orange-200" },
  { status: "closed_won", label: "Closed Won", color: "bg-emerald-500", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", ringColor: "ring-emerald-200" },
  { status: "closed_lost", label: "Closed Lost", color: "bg-red-500", bgColor: "bg-red-50", borderColor: "border-red-200", ringColor: "ring-red-200" },
];

const platforms: { value: Platform | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "tiktok", label: "TikTok" },
  { value: "snapchat", label: "Snapchat" },
];

export default function PipelinePage() {
  const { items: oppRecords, update } = useRecords<Record<string, unknown>>("opportunities");
  const { items: leadRecords } = useRecords<Record<string, unknown>>("leads");
  const { items: campaignRecords } = useRecords<Record<string, unknown>>("campaigns");
  const { items: noteRecords, create: createNote } = useRecords<Record<string, unknown>>("notes");
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    clientApi<TeamMember[]>("/api/team")
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        data.forEach((m) => { map[m.id] = m.name; });
        setOwnerMap(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const leadNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    leadRecords.forEach((r) => {
      const d = r.data as Record<string, unknown>;
      map[r.id] = typeof d.name === "string" ? d.name : "";
    });
    return map;
  }, [leadRecords]);

  const campaignNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    campaignRecords.forEach((r) => {
      const d = r.data as Record<string, unknown>;
      map[r.id] = typeof d.name === "string" ? d.name : "";
    });
    return map;
  }, [campaignRecords]);

  const opportunities = useMemo<Opportunity[]>(() => {
    return oppRecords.map((r: ApiRecord) => {
      const d = r.data as Record<string, unknown>;
      const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
      const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
      return {
        id: r.id,
        leadId: str(d.leadId),
        leadName: leadNameMap[str(d.leadId)] || str(d.leadName, "Unknown lead"),
        name: str(d.name),
        stage: str(d.stage, "prospecting") as OpportunityStage,
        value: num(d.value),
        probability: num(d.probability),
        expectedCloseDate: str(d.expectedCloseDate),
        ownerId: r.ownerId ?? "",
        ownerName: (r.ownerId && ownerMap[r.ownerId]) || str(d.ownerName, "Unassigned"),
        campaignId: str(d.campaignId),
        campaignName: campaignNameMap[str(d.campaignId)] || str(d.campaignName, "—"),
        platform: str(d.platform) as Platform,
        createdAt: r.createdAt,
        updatedAt: str(d.updatedAt, r.updatedAt),
        lostReason: str(d.lostReason),
      };
    });
  }, [oppRecords, leadNameMap, campaignNameMap, ownerMap]);

  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchTarget, setBatchTarget] = useState<string>("");
  const [batchOpen, setBatchOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [detailOpp, setDetailOpp] = useState<Opportunity | null>(null);
  const [noteText, setNoteText] = useState("");
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveOppId, setMoveOppId] = useState<string>("");
  const [lostReason, setLostReason] = useState("");
  const [lostReasonOpen, setLostReasonOpen] = useState(false);
  const [lostOppId, setLostOppId] = useState<string>("");
  const [compact, setCompact] = useState(false);

  const lostReasons = [
    "No Budget", "Too Expensive", "No Response", "Competitor", "Bad Timing",
    "Not Qualified", "Duplicate", "Spam", "Wrong Contact", "Other",
  ];

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    opportunities.forEach((o) => map.set(o.ownerId, o.ownerName));
    return Array.from(map.entries());
  }, [opportunities]);

  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const hasFilters = platformFilter !== "all" || ownerFilter !== "all";

  const filteredOpps = useMemo(() => {
    return opportunities.filter((o) => {
      if (platformFilter !== "all" && o.platform !== platformFilter) return false;
      if (ownerFilter !== "all" && o.ownerId !== ownerFilter) return false;
      return true;
    });
  }, [opportunities, platformFilter, ownerFilter]);

  const oppsByStage = useMemo(() => {
    const grouped: Record<OpportunityStage, Opportunity[]> = { prospecting: [], discovery: [], proposal: [], negotiation: [], closed_won: [], closed_lost: [] };
    filteredOpps.forEach((opp) => { grouped[opp.stage].push(opp); });
    return grouped;
  }, [filteredOpps]);

  const stageValues = useMemo(() => {
    const values: Record<string, number> = {};
    Object.entries(oppsByStage).forEach(([stage, stageOpps]) => {
      values[stage] = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);
    });
    return values;
  }, [oppsByStage]);

  const getDaysInStage = (opp: Opportunity): number => {
    const created = new Date(opp.createdAt);
    const now = new Date();
    return Math.ceil((now.getTime() - created.getTime()) / 86400000);
  };

  const moveOpp = useCallback((oppId: string, newStage: OpportunityStage) => {
    const opp = opportunities.find((o) => o.id === oppId);
    const patch: Record<string, unknown> = { stage: newStage };
    if (newStage === "closed_won") patch.probability = 100;
    if (newStage === "closed_lost") patch.probability = 0;
    update(oppId, patch).then(() => {
      toast.success(`Opportunity moved to ${newStage}`, { description: opp?.name });
    }).catch((e) => toast.error((e as Error).message));
  }, [opportunities, update]);

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData("oppId", oppId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(oppId);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("oppId");
    if (oppId) {
      if (targetStage === "closed_lost") {
        setLostOppId(oppId);
        setLostReason("");
        setLostReasonOpen(true);
      } else {
        moveOpp(oppId, targetStage as OpportunityStage);
      }
    }
    setDragOverStage(null);
    setDraggingId(null);
  };

  const handleLostConfirm = () => {
    if (!lostOppId) return;
    const opp = opportunities.find((o) => o.id === lostOppId);
    update(lostOppId, { stage: "closed_lost", probability: 0, lostReason: lostReason || opp?.lostReason })
      .then(() => {
        toast.info(lostReason ? `Lost reason: ${lostReason}` : "Opportunity marked as lost");
        setLostReasonOpen(false);
        setLostOppId("");
        setLostReason("");
      })
      .catch((e) => toast.error((e as Error).message));
  };

  const handleDragEnd = () => { setDragOverStage(null); setDraggingId(null); };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleBatchMove = async () => {
    if (!batchTarget) return;
    try {
      await Promise.all(selectedIds.map((id) => update(id, { stage: batchTarget as OpportunityStage })));
      toast.success(`${selectedIds.length} opportunities moved to ${batchTarget}`);
      setSelectedIds([]);
      setBatchTarget("");
      setBatchOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleMoveClick = (oppId: string) => {
    setMoveOppId(oppId);
    setMoveTarget("");
    setMoveOpen(true);
  };

  const handleMoveConfirm = () => {
    if (!moveTarget) return;
    moveOpp(moveOppId, moveTarget as OpportunityStage);
    setMoveOpen(false);
  };

  const clearFilters = () => { setPlatformFilter("all"); setOwnerFilter("all"); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm">Drag opportunities between stages to update status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCompact(!compact)}>
            {compact ? "Default" : "Compact"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
            {hasFilters && <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">!</Badge>}
          </Button>
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
                  onClick={() => setPlatformFilter(p.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    platformFilter === p.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Owner</span>
            <div className="flex gap-1">
              <button
                onClick={() => setOwnerFilter("all")}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  ownerFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All
              </button>
              {owners.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setOwnerFilter(id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    ownerFilter === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {name.split(" ")[0]}
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

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {stages.map((stage) => {
          const isOver = dragOverStage === stage.status;
          const isEmpty = oppsByStage[stage.status].length === 0;
          return (
            <div
              key={stage.status}
              className={`w-[240px] shrink-0 rounded-xl border ${stage.borderColor} ${stage.bgColor} transition-all ${isOver ? "border-2 border-dashed border-primary shadow-md" : "border"}`}
              onDragOver={(e) => handleDragOver(e, stage.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.status)}
            >
              <div className="sticky top-0 z-10 bg-background backdrop-blur-sm rounded-t-xl border-b px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <h3 className="font-semibold text-xs">{stage.label}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{oppsByStage[stage.status].length}</Badge>
                    {(stageValues[stage.status] || 0) > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">${(stageValues[stage.status] / 1000).toFixed(0)}K</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-2.5">
                <div className={`space-y-1.5 min-h-[60px] ${compact ? "" : ""}`}>
                  {oppsByStage[stage.status].map((opp) => {
                    const days = getDaysInStage(opp);
                    const isStale = days > 7 && stage.status !== "closed_won" && stage.status !== "closed_lost";
                    const isSelected = selectedIds.includes(opp.id);
                    return (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setDetailOpp(opp)}
                        className={`group relative bg-card rounded-md border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${compact ? "p-1.5 text-[10px]" : "p-2 text-xs"} ${draggingId === opp.id ? "opacity-40 border-dashed" : ""} ${isSelected ? "ring-2 ring-primary" : ""} ${isStale ? "border-l-3 border-l-amber-400" : ""}`}
                      >
                        <div className={compact ? "" : ""}>
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <GripVertical className="text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <p className="font-medium leading-tight truncate">{opp.name}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => { e.stopPropagation(); toggleSelect(opp.id); }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-3 w-3 rounded border-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          {!compact && (
                            <p className="text-[10px] text-muted-foreground truncate pl-4 mb-0.5">{opp.leadName}</p>
                          )}
                          <div className={`flex items-center justify-between ${compact ? "" : "pl-4"}`}>
                            <div className="flex items-center gap-1">
                              <PlatformBadge platform={opp.platform} className={`${compact ? "text-[8px] px-0.5 py-0 h-3" : "text-[9px] px-1 py-0 h-3.5"}`} />
                              {!compact && isStale && (
                                <span className="flex items-center gap-0.5 text-[9px] text-amber-600">
                                  <Clock className="h-2.5 w-2.5" />
                                  {days}d
                                </span>
                              )}
                            </div>
                            {opp.value > 0 && (
                              <span className="font-medium text-success">${opp.value.toLocaleString()}</span>
                            )}
                          </div>
                          {!compact && (
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/30 pl-4">
                              <span className="text-[9px] text-muted-foreground truncate">{opp.ownerName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground">{opp.probability}%</span>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); toast.info("Call feature coming soon"); }} className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><Phone className="h-2.5 w-2.5" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); toast.info("Email feature coming soon"); }} className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><Mail className="h-2.5 w-2.5" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleMoveClick(opp.id); }} className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><ArrowRight className="h-2.5 w-2.5" /></button>
                                </div>
                              </div>
                            </div>
                          )}
                          {compact && (
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[9px] text-muted-foreground">{opp.probability}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isEmpty && (
                    <div className="border-2 border-dashed border-border/50 rounded-md py-6 flex flex-col items-center justify-center">
                      {isOver ? (
                        <p className="text-xs text-primary font-medium">Drop here</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">No opportunities</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-lg border-primary/30 bg-primary/5 backdrop-blur-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-sm font-medium text-primary">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-border" />
              <select
                value={batchTarget}
                onChange={(e) => setBatchTarget(e.target.value)}
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Move to...</option>
                {stages.map((s) => <option key={s.status} value={s.status}>{s.label}</option>)}
              </select>
              <Button size="sm" disabled={!batchTarget} onClick={() => setBatchOpen(true)}>Move</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!detailOpp} onOpenChange={(o) => { if (!o) { setDetailOpp(null); setNoteText(""); } }}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {detailOpp && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{detailOpp.name}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <PlatformBadge platform={detailOpp.platform} />
                <Badge variant="secondary" className={stages.find(s => s.status === detailOpp.stage)?.bgColor}>{detailOpp.stage.replace("_", " ")}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{getDaysInStage(detailOpp)}d in stage</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs mb-0.5">Lead</p><p className="font-medium text-xs">{detailOpp.leadName}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Owner</p><p className="font-medium text-xs">{detailOpp.ownerName}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Value</p><p className="font-medium">${(detailOpp.value || 0).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Probability</p><p className="font-medium">{detailOpp.probability}%</p></div>
                <div><p className="text-muted-foreground text-xs mb-0.5">Campaign</p><p className="font-medium text-xs">{detailOpp.campaignName}</p></div>
                {detailOpp.lostReason && <div><p className="text-muted-foreground text-xs mb-0.5">Lost Reason</p><p className="font-medium text-xs text-destructive">{detailOpp.lostReason}</p></div>}
              </div>
              <div className="border-t pt-3">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-sm"><StickyNote className="h-3.5 w-3.5" />Activity</h4>
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {noteRecords
                    .filter((n) => (n.data as Record<string, unknown>).leadId === detailOpp.leadId)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((activity) => (
                    <div key={activity.id} className="flex gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className="text-[9px] py-0 px-1 h-3.5">note</Badge>
                          <span className="text-muted-foreground">{new Date(activity.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        <p>{String((activity.data as Record<string, unknown>).content ?? "")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3">
                <Label htmlFor="pipeline-note" className="text-sm font-medium">Add Note</Label>
                <div className="flex gap-2 mt-1">
                  <Textarea id="pipeline-note" placeholder="Type a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} />
                  <Button size="sm" onClick={() => { if (!noteText.trim() || !detailOpp) return; const leadId = detailOpp.leadId; createNote({ leadId, content: noteText.trim() }).then(() => { setNoteText(""); toast.success("Note added"); }).catch((e) => toast.error((e as Error).message)); }} disabled={!noteText.trim()} className="shrink-0">Add</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={batchOpen} onOpenChange={setBatchOpen} title={`Move ${selectedIds.length} opportunities`} description={`Move ${selectedIds.length} opportunities to "${batchTarget}"?`} confirmLabel="Move" onConfirm={handleBatchMove} />
      <ConfirmDialog open={moveOpen} onOpenChange={setMoveOpen} title="Move Opportunity" description={`Move this opportunity to "${moveTarget}"?`} confirmLabel="Move" onConfirm={handleMoveConfirm} />

      <Dialog open={lostReasonOpen} onOpenChange={setLostReasonOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Lost Reason</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Select a reason for marking this opportunity as lost.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {lostReasons.map((r) => (
              <button
                key={r}
                onClick={() => setLostReason(r)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                  lostReason === r
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setLostReasonOpen(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={handleLostConfirm}>Mark as Lost</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
