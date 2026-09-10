"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRecords, type ApiRecord } from "@/lib/use-records";
import { PlatformBadge } from "@/components/platform-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { TableSkeleton } from "@/components/skeletons";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  User,
  Globe,
  MousePointerClick,
  CheckSquare,
  Clock,
  DollarSign,
  TrendingUp,
  Tag,
  ExternalLink,
  Zap,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import type { Lead, LeadStatus, Platform } from "@/lib/types";

const tabs = ["Overview", "Acquisition", "Attribution", "Activity", "Opportunity", "Tasks", "Notes"];

type TaskStatus = "pending" | "in_progress" | "completed";

interface Task {
  id: string;
  type: string;
  title: string;
  dueDate: string;
  priority: string;
  status: TaskStatus;
  owner: string;
}

function toLead(record: ApiRecord): Lead {
  const d = record.data as Record<string, unknown>;
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
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

export default function Lead360Page() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("Overview");
  const [noteText, setNoteText] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTag, setNewTag] = useState("");

  const { items: leadRecords, loading, update: updateLead } = useRecords<Record<string, unknown>>("leads");
  const { items: noteRecords, create: createNote } = useRecords<Record<string, unknown>>("notes");
  const { items: taskRecords, create: createTask, update: updateTask } = useRecords<Record<string, unknown>>("tasks");
  const { items: opportunityRecords } = useRecords<Record<string, unknown>>("opportunities");

  const leadRecord = useMemo(() => leadRecords.find((r) => r.id === id) ?? null, [leadRecords, id]);
  const lead = useMemo(() => leadRecord ? toLead(leadRecord) : null, [leadRecord]);

  const activities = useMemo(() => {
    return noteRecords.filter((n) => (n.data as Record<string, unknown>).leadId === id)
      .map((n) => ({
        id: n.id,
        leadId: id,
        type: "note" as const,
        description: String((n.data as Record<string, unknown>).content ?? ""),
        createdAt: n.createdAt,
        createdBy: "",
        createdByName: "System",
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [noteRecords, id]);

  const tasks = useMemo<Task[]>(() => taskRecords
    .filter((record) => record.data.leadId === id)
    .map((record) => ({
      id: record.id,
      type: "task",
      title: String(record.data.name ?? ""),
      dueDate: String(record.data.dueDate ?? ""),
      priority: "normal",
      status: record.data.completed ? "completed" : "pending",
      owner: "Workspace",
    })), [taskRecords, id]);

  const opportunity = useMemo(() => opportunityRecords.find((record) => record.data.leadId === id), [opportunityRecords, id]);
  const tags = useMemo(() => {
    const raw = leadRecords.find((record) => record.id === id)?.data.tags;
    return Array.isArray(raw) ? raw.filter((tag): tag is string => typeof tag === "string") : [];
  }, [leadRecords, id]);

  if (loading && leadRecords.length === 0) {
    return <TableSkeleton rows={4} />;
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card><CardContent className="py-12 text-center text-muted-foreground">Lead not found.</CardContent></Card>
      </div>
    );
  }

  const daysOpen = Math.ceil((new Date().getTime() - new Date(lead.createdAt).getTime()) / 86400000);
  const rawLead = leadRecord?.data ?? {};
  const text = (value: unknown, fallback = "--") => typeof value === "string" && value.trim() ? value : fallback;
  const amount = (value: unknown) => typeof value === "number" ? `$${value.toLocaleString()}` : "--";
  const probability = typeof opportunity?.data.probability === "number" ? `${opportunity.data.probability}%` : "--";

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask({
      leadId: id,
      name: newTaskTitle.trim(),
      dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      completed: false,
    }).then(() => {
      setNewTaskTitle("");
      setShowNewTask(false);
      toast.success("Task created");
    }).catch((error) => toast.error((error as Error).message));
  };

  const toggleTaskStatus = (taskId: string) => {
    const task = taskRecords.find((record) => record.id === taskId);
    if (!task) return;
    updateTask(taskId, { completed: !task.data.completed }).catch((error) => toast.error((error as Error).message));
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag)) return;
    updateLead(id, { tags: [...tags, newTag.trim()] })
      .then(() => setNewTag(""))
      .catch((error) => toast.error((error as Error).message));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-1" /> Call</Button>
          <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Email</Button>
          <Button size="sm">Edit Lead</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-sm">
        <Badge variant="secondary" className="capitalize">{lead.status}</Badge>
        <span className="text-muted-foreground">·</span>
        <span className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" /> {lead.ownerName}</span>
        <span className="text-muted-foreground">·</span>
        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {daysOpen}d open</span>
        <span className="text-muted-foreground">·</span>
        <PlatformBadge platform={lead.platform} />
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{lead.email}</span></div>
                <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{lead.phone || "—"}</span></div>
                <div className="flex items-center gap-2 text-sm"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span>{lead.company || "—"}</span></div>
                <div className="flex items-center gap-2 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground" /><span>{lead.ownerName}</span></div>
              </div>
              <Separator />
              <div className="grid gap-2 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm font-medium">{new Date(lead.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Last Activity</p><p className="text-sm font-medium">{activities[0]?.createdAt ? new Date(activities[0].createdAt).toLocaleDateString() : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Lead Score</p><p className="text-sm font-medium">72</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><p className="text-sm font-medium capitalize">{lead.status}</p></div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Acquisition</CardTitle></CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><PlatformBadge platform={lead.platform} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span className="font-medium truncate max-w-[140px]">{lead.campaignName}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Button variant="outline" size="sm" className="w-full justify-start h-8"><Phone className="h-3.5 w-3.5 mr-2" /> Schedule Call</Button>
                <Button variant="outline" size="sm" className="w-full justify-start h-8"><Mail className="h-3.5 w-3.5 mr-2" /> Send Email</Button>
                <Button variant="outline" size="sm" className="w-full justify-start h-8"><ExternalLink className="h-3.5 w-3.5 mr-2" /> View Campaign</Button>
                <Button variant="outline" size="sm" className="w-full justify-start h-8"><Zap className="h-3.5 w-3.5 mr-2" /> Convert to Opportunity</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} className="h-7 text-xs" onKeyDown={(e) => e.key === "Enter" && addTag()} />
                  <Button size="sm" className="h-7 px-2" onClick={addTag}><Tag className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "Acquisition" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-3.5 w-3.5" />Source</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><PlatformBadge platform={lead.platform} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Source Type</span><span className="font-medium">{text(rawLead.source)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span className="font-medium text-xs">{lead.campaignName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ad Set</span><span className="font-medium">{text(rawLead.adSetName)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ad</span><span className="font-medium">{text(rawLead.adName)}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "Attribution" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MousePointerClick className="h-3.5 w-3.5" />Attribution Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between"><span className="text-muted-foreground">Landing Page</span><span className="font-medium">{text(rawLead.landingPage)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UTM Source</span><span className="font-medium">{text(rawLead.utmSource, lead.platform)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UTM Medium</span><span className="font-medium">{text(rawLead.utmMedium)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UTM Campaign</span><span className="font-medium text-xs">{text(rawLead.utmCampaign)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">First Touch</span><span className="font-medium">{text(rawLead.firstTouch)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last Touch</span><span className="font-medium">{text(rawLead.lastTouch)}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "Activity" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Activity Timeline</CardTitle></CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <EmptyState type="activity" compact />
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary border-2 border-background shrink-0" />
                      <div className="w-px flex-1 bg-border mt-1" />
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[10px] py-0 px-1 h-4 capitalize">{a.type.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm">{a.description}</p>
                      <p className="text-xs text-muted-foreground">by {a.createdByName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "Opportunity" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" />Deal Information</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between"><span className="text-muted-foreground">Deal Name</span><span className="font-medium">{text(opportunity?.data.name, "--")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pipeline</span><span className="font-medium">{text(opportunity?.data.pipelineName)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Stage</span><Badge variant="secondary" className="capitalize">{text(opportunity?.data.stage, "--")}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expected Value</span><span className="font-medium">{amount(opportunity?.data.value)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Probability</span><span className="font-medium">{probability}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expected Close</span><span className="font-medium">{text(opportunity?.data.expectedCloseDate)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" />Revenue</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between"><span className="text-muted-foreground">Pipeline Value</span><span className="font-medium">{amount(opportunity?.data.value)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Won Revenue</span><span className="font-medium">{opportunity?.data.stage === "closed_won" ? amount(opportunity.data.value) : "--"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Collected</span><span className="font-medium">{amount(opportunity?.data.collectedRevenue)}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "Tasks" && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Tasks</CardTitle>
            <Button size="sm" className="h-7" onClick={() => setShowNewTask(!showNewTask)}>+ New Task</Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {showNewTask && (
              <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
                <Input placeholder="Task title..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="h-7 text-sm" onKeyDown={(e) => e.key === "Enter" && handleAddTask()} />
                <Button size="sm" className="h-7" onClick={handleAddTask}>Add</Button>
              </div>
            )}
            {tasks.length === 0 ? (
              <EmptyState type="tasks" compact />
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50">
                  <button onClick={() => toggleTaskStatus(task.id)} className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    task.status === "completed" ? "bg-success border-success text-white" :
                    task.status === "in_progress" ? "bg-primary border-primary text-white" :
                    "border-muted-foreground/30"
                  }`}>
                    {task.status === "completed" && <CheckSquare className="h-2.5 w-2.5" />}
                    {task.status === "in_progress" && <Clock className="h-2.5 w-2.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.type} · Due {task.dueDate} · {task.owner}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${
                    task.priority === "high" ? "text-destructive border-destructive/30" :
                    task.priority === "medium" ? "text-amber-600 border-amber-300" :
                    "text-muted-foreground"
                  }`}>{task.priority}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "Notes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Add Note</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Textarea placeholder="Type a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} className="text-sm" />
                <Button size="sm" className="shrink-0 self-end h-8" onClick={() => { if (!noteText.trim()) return; createNote({ leadId: id, content: noteText.trim() }).then(() => { setNoteText(""); toast.success("Note added"); }).catch((e) => toast.error((e as Error).message)); }} disabled={!noteText.trim()}>Add</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-0">
              {activities.filter((a) => a.type === "note").length === 0 ? (
                <EmptyState type="notes" compact />
              ) : (
                activities.filter((a) => a.type === "note").map((a) => (
                  <div key={a.id} className="p-2 rounded-lg bg-muted/50">
                    <p className="text-sm">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {a.createdByName} · {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
