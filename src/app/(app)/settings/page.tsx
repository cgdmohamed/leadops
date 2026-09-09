"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/platform-icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  User,
  Lock,
  Bell,
  Link2,
  Shield,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Globe,
  History,
  Key,
  GitBranch,
  Plus,
  GripVertical,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import type { Platform } from "@/lib/types";

const demoUser = { name: "Sarah Chen", email: "sarah@leadops.io", role: "admin" as const };

interface PlatformConnection {
  platform: Platform;
  label: string;
  connected: boolean;
  lastSync?: string;
  accounts?: number;
}

const initialConnections: PlatformConnection[] = [
  { platform: "meta", label: "Meta Ads", connected: true, lastSync: "2 minutes ago", accounts: 3 },
  { platform: "google", label: "Google Ads", connected: true, lastSync: "5 minutes ago", accounts: 2 },
  { platform: "tiktok", label: "TikTok Ads", connected: false },
  { platform: "snapchat", label: "Snapchat Ads", connected: false },
];

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "platforms", label: "Platforms", icon: Link2 },
  { id: "pipelines", label: "Pipelines", icon: GitBranch },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "roles", label: "Roles & Permissions", icon: Key },
  { id: "revenue", label: "Revenue Definitions", icon: DollarSign },
  { id: "currency", label: "Currency & Workspace", icon: Globe },
  { id: "audit", label: "Audit Log", icon: History },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [name, setName] = useState(demoUser.name);
  const [email, setEmail] = useState(demoUser.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [connections, setConnections] = useState<PlatformConnection[]>(initialConnections);
  const [disconnectId, setDisconnectId] = useState<Platform | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);

  const [pipelines, setPipelines] = useState([
    {
      id: "p1",
      name: "Sales Pipeline",
      isDefault: true,
      stages: [
        { id: "s1", name: "New", color: "#3B82F6", probability: 10 },
        { id: "s2", name: "Attempted Contact", color: "#6366F1", probability: 20 },
        { id: "s3", name: "Contacted", color: "#8B5CF6", probability: 30 },
        { id: "s4", name: "Qualified", color: "#A855F7", probability: 50 },
        { id: "s5", name: "Meeting", color: "#D946EF", probability: 60 },
        { id: "s6", name: "Proposal", color: "#EC4899", probability: 75 },
        { id: "s7", name: "Negotiation", color: "#F59E0B", probability: 85 },
        { id: "s8", name: "Won", color: "#10B981", probability: 100 },
        { id: "s9", name: "Lost", color: "#EF4444", probability: 0 },
      ],
    },
    {
      id: "p2",
      name: "Partnership Pipeline",
      isDefault: false,
      stages: [
        { id: "ps1", name: "Prospect", color: "#3B82F6", probability: 10 },
        { id: "ps2", name: "Discovery Call", color: "#8B5CF6", probability: 30 },
        { id: "ps3", name: "Proposal", color: "#F59E0B", probability: 60 },
        { id: "ps4", name: "Closed Won", color: "#10B981", probability: 100 },
        { id: "ps5", name: "Closed Lost", color: "#EF4444", probability: 0 },
      ],
    },
  ]);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Profile updated", { description: "Your profile has been saved." });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password too short", { description: "Must be at least 6 characters." });
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Password changed", { description: "Your password has been updated." });
  };

  const handleConnect = (platform: Platform) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.platform === platform
          ? { ...c, connected: true, lastSync: "Just now", accounts: 1 }
          : c
      )
    );
    toast.success("Connected", { description: `${platform} account linked successfully.` });
  };

  const handleDisconnect = (platform: Platform) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.platform === platform
          ? { ...c, connected: false, lastSync: undefined, accounts: undefined }
          : c
      )
    );
    toast.success("Disconnected", { description: `${platform} account removed.` });
  };

  const handleSync = (platform: Platform) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.platform === platform ? { ...c, lastSync: "Just now" } : c
      )
    );
    toast.success("Synced", { description: `${platform} data is up to date.` });
  };

  const addPipeline = () => {
    if (!newPipelineName.trim()) return;
    setPipelines((prev) => [...prev, {
      id: `p_${Date.now()}`,
      name: newPipelineName,
      isDefault: false,
      stages: [
        { id: `s_${Date.now()}_1`, name: "New", color: "#3B82F6", probability: 10 },
        { id: `s_${Date.now()}_2`, name: "Qualified", color: "#8B5CF6", probability: 50 },
        { id: `s_${Date.now()}_3`, name: "Won", color: "#10B981", probability: 100 },
        { id: `s_${Date.now()}_4`, name: "Lost", color: "#EF4444", probability: 0 },
      ],
    }]);
    setNewPipelineName("");
    setShowNewPipeline(false);
    toast.success("Pipeline created");
  };

  const deletePipeline = (id: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== id));
    toast.success("Pipeline deleted");
  };

  const addStage = (pipelineId: string) => {
    setPipelines((prev) => prev.map((p) => {
      if (p.id !== pipelineId) return p;
      const newStage = {
        id: `s_${Date.now()}`,
        name: "New Stage",
        color: "#8B5CF6",
        probability: 50,
      };
      const insertIdx = p.stages.length - 2;
      const stages = [...p.stages];
      stages.splice(insertIdx, 0, newStage);
      return { ...p, stages };
    }));
  };

  const updateStage = (pipelineId: string, stageId: string, updates: { name?: string; probability?: number; color?: string }) => {
    setPipelines((prev) => prev.map((p) => {
      if (p.id !== pipelineId) return p;
      return { ...p, stages: p.stages.map((s) => s.id === stageId ? { ...s, ...updates } : s) };
    }));
  };

  const deleteStage = (pipelineId: string, stageId: string) => {
    setPipelines((prev) => prev.map((p) => {
      if (p.id !== pipelineId) return p;
      return { ...p, stages: p.stages.filter((s) => s.id !== stageId) };
    }));
  };

  const moveStage = (pipelineId: string, stageId: string, direction: "up" | "down") => {
    setPipelines((prev) => prev.map((p) => {
      if (p.id !== pipelineId) return p;
      const idx = p.stages.findIndex((s) => s.id === stageId);
      if (idx === -1) return p;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= p.stages.length) return p;
      const stages = [...p.stages];
      [stages[idx], stages[newIdx]] = [stages[newIdx], stages[idx]];
      return { ...p, stages };
    }));
  };

  const colorOptions = [
    "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
    "#EC4899", "#F43F5E", "#EF4444", "#F97316", "#F59E0B",
    "#EAB308", "#84CC16", "#22C55E", "#10B981", "#14B8A6",
    "#06B6D4", "#0EA5E9",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, integrations, and preferences.</p>
      </div>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0 space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          {activeSection === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                        {demoUser.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{demoUser.name}</p>
                      <Badge variant="secondary" className="capitalize mt-1">{demoUser.role}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === "password" && (
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving || !currentPassword || !newPassword}>
                      {saving ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === "platforms" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Connections</CardTitle>
                  <CardDescription>Connect your ad platforms to sync campaign data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.platform}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <PlatformIcon platform={conn.platform} className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{conn.label}</p>
                          {conn.connected ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-success" />
                              Synced {conn.lastSync} · {conn.accounts} account{conn.accounts !== 1 ? "s" : ""}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Not connected
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conn.connected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(conn.platform)}
                            >
                              Sync
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDisconnectId(conn.platform)}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleConnect(conn.platform)}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Sync</CardTitle>
                  <CardDescription>Control how often data is synced from connected platforms.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-sync</p>
                      <p className="text-xs text-muted-foreground">Automatically sync data every 15 minutes</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Sync leads</p>
                      <p className="text-xs text-muted-foreground">Import new leads from ad platforms</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Sync campaign metrics</p>
                      <p className="text-xs text-muted-foreground">Update spend, impressions, and conversions</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success("Sync settings saved")}>Save Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "pipelines" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Pipelines</h2>
                  <p className="text-sm text-muted-foreground">Configure your sales pipelines and stages.</p>
                </div>
                <Button onClick={() => setShowNewPipeline(!showNewPipeline)} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> New Pipeline
                </Button>
              </div>

              {showNewPipeline && (
                <Card className="border-dashed">
                  <CardContent className="p-4 flex gap-2">
                    <Input placeholder="Pipeline name..." value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === "Enter" && addPipeline()} />
                    <Button onClick={addPipeline} disabled={!newPipelineName.trim()}>Create</Button>
                    <Button variant="ghost" onClick={() => setShowNewPipeline(false)}>Cancel</Button>
                  </CardContent>
                </Card>
              )}

              {pipelines.map((pipeline) => (
                <Card key={pipeline.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{pipeline.name}</CardTitle>
                        {pipeline.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => addStage(pipeline.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Stage
                        </Button>
                        {!pipeline.isDefault && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => deletePipeline(pipeline.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>{pipeline.stages.length} stages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pipeline.stages.map((stage, i) => {
                      const isEditing = editingStage === stage.id;
                      const isWon = stage.name.toLowerCase() === "won";
                      const isLost = stage.name.toLowerCase() === "lost";
                      return (
                        <div key={stage.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                          <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                defaultValue={stage.name}
                                className="h-7 text-xs flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateStage(pipeline.id, stage.id, { name: e.currentTarget.value });
                                    setEditingStage(null);
                                  }
                                  if (e.key === "Escape") setEditingStage(null);
                                }}
                                onBlur={(e) => {
                                  updateStage(pipeline.id, stage.id, { name: e.target.value });
                                  setEditingStage(null);
                                }}
                              />
                              <Input
                                type="number"
                                defaultValue={stage.probability}
                                className="h-7 text-xs w-16"
                                placeholder="%"
                                onBlur={(e) => updateStage(pipeline.id, stage.id, { probability: Number(e.target.value) })}
                              />
                              <div className="flex gap-0.5">
                                {colorOptions.slice(0, 8).map((c) => (
                                  <button
                                    key={c}
                                    className="h-4 w-4 rounded-full border border-border"
                                    style={{ backgroundColor: c }}
                                    onClick={() => updateStage(pipeline.id, stage.id, { color: c })}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-medium flex-1">{stage.name}</span>
                              <Badge variant="outline" className="text-[10px]">{stage.probability}%</Badge>
                              <div className="flex items-center gap-0.5">
                                {!isWon && !isLost && i > 0 && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveStage(pipeline.id, stage.id, "up")}>↑</Button>
                                )}
                                {!isWon && !isLost && i < pipeline.stages.length - 1 && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveStage(pipeline.id, stage.id, "down")}>↓</Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingStage(stage.id)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                {!isWon && !isLost && !pipeline.isDefault && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => deleteStage(pipeline.id, stage.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeSection === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "New lead assigned", desc: "Get notified when a lead is assigned to you" },
                  { label: "Lead status change", desc: "Get notified when a lead you own changes stage" },
                  { label: "Campaign paused", desc: "Alert when a campaign is paused due to budget" },
                  { label: "Weekly summary", desc: "Receive a weekly performance summary" },
                  { label: "Low ROAS alert", desc: "Notify when campaign ROAS drops below 2x" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Preferences saved")}>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "roles" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Roles & Permissions</CardTitle>
                      <CardDescription>Manage team roles and access levels.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline">
                      <Key className="h-3.5 w-3.5 mr-1" /> Create Custom Role
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: "admin", role: "Admin", members: 1, color: "#EF4444", permissions: ["All Leads", "All Campaigns", "Settings", "Team Management", "Billing", "Integrations"] },
                    { id: "manager", role: "Manager", members: 2, color: "#F59E0B", permissions: ["Assigned Leads", "All Campaigns", "Analytics", "Reports"] },
                    { id: "agent", role: "Agent", members: 5, color: "#3B82F6", permissions: ["Assigned Leads", "Basic Analytics", "Tasks"] },
                    { id: "viewer", role: "Viewer", members: 1, color: "#8B5CF6", permissions: ["Read-only Dashboards", "Read-only Reports"] },
                  ].map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <div>
                            <p className="text-sm font-medium">{item.role}</p>
                            <p className="text-[10px] text-muted-foreground">{item.members} members</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toast.success(`Edit ${item.role} permissions`)}>
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.permissions.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[9px] px-1.5 py-0">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Assign roles to team members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Sarah Chen", email: "sarah@leadops.io", role: "Admin", avatar: "SC" },
                    { name: "James Rivera", email: "james@leadops.io", role: "Manager", avatar: "JR" },
                    { name: "Mike Johnson", email: "mike@leadops.io", role: "Agent", avatar: "MJ" },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{member.role}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "revenue" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Definitions</CardTitle>
                  <CardDescription>Configure how revenue is calculated and attributed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "First-Touch Attribution", desc: "Credit the first ad platform the lead interacted with", enabled: false },
                    { name: "Last-Touch Attribution", desc: "Credit the last ad platform before conversion", enabled: true },
                    { name: "Linear Attribution", desc: "Split credit equally across all touchpoints", enabled: false },
                    { name: "Include Opp Revenue", desc: "Count opportunity values in pipeline revenue", enabled: true },
                    { name: "Include Won Revenue", desc: "Count closed-won deal values in total revenue", enabled: true },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
                        <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  ))}
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label>Revenue Currency</Label>
                    <Input
                      placeholder="USD"
                      defaultValue="USD"
                      onChange={(e) => e.target.value.toUpperCase()}
                    />
                    <p className="text-xs text-muted-foreground">Currency for revenue reporting across all platforms</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success("Revenue settings saved")}>Save</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "currency" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Currency & Workspace</CardTitle>
                  <CardDescription>Set your workspace currency and regional preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input
                      placeholder="USD"
                      defaultValue="USD"
                      onChange={(e) => e.target.value.toUpperCase()}
                    />
                    <p className="text-xs text-muted-foreground">e.g., USD, EUR, GBP</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <select className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <select className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Pacific Time (PT)</option>
                      <option>UTC</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Workspace Name</Label>
                    <Input defaultValue="LeadOps Demo" />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success("Workspace settings saved")}>Save</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "audit" && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Track all changes and actions in your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { time: "10:32 AM", user: "Sarah Chen", action: "Updated campaign budget", target: "Q3 Lead Gen", type: "update" },
                  { time: "10:28 AM", user: "James Rivera", action: "Moved lead to Won", target: "Alex Thompson", type: "status" },
                  { time: "10:15 AM", user: "Sarah Chen", action: "Connected Meta Ads", target: "Platform Settings", type: "config" },
                  { time: "09:45 AM", user: "Mike Johnson", action: "Created new campaign", target: "Fall Promo 2026", type: "create" },
                  { time: "09:30 AM", user: "Sarah Chen", action: "Changed team role", target: "James Rivera → Manager", type: "permission" },
                  { time: "09:00 AM", user: "System", action: "Auto-sync completed", target: "Meta, Google", type: "system" },
                  { time: "Yesterday", user: "Sarah Chen", action: "Exported lead report", target: "Sep 2026 Leads", type: "export" },
                  { time: "Yesterday", user: "James Rivera", action: "Deleted campaign", target: "Old Test Campaign", type: "delete" },
                ].map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <History className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{entry.time}</span>
                    <span className="text-sm font-medium w-28 shrink-0">{entry.user}</span>
                    <span className="text-sm flex-1">{entry.action}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-48">{entry.target}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{entry.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === "security" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{twoFactor ? "Enabled" : "Disabled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {twoFactor
                          ? "Your account is protected with 2FA."
                          : "We recommend enabling 2FA for your account."}
                      </p>
                    </div>
                    <Button
                      variant={twoFactor ? "outline" : "default"}
                      onClick={() => {
                        setTwoFactor(!twoFactor);
                        toast.success(twoFactor ? "2FA disabled" : "2FA enabled");
                      }}
                    >
                      {twoFactor ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your active login sessions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { device: "Chrome on Windows", location: "New York, US", current: true, time: "Active now" },
                    { device: "Safari on iPhone", location: "New York, US", current: false, time: "2 hours ago" },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">
                          {session.device}
                          {session.current && (
                            <Badge variant="secondary" className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 border-0">
                              Current
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
                      </div>
                      {!session.current && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently delete your account and all data.</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!disconnectId}
        onOpenChange={(o) => { if (!o) setDisconnectId(null); }}
        title={`Disconnect ${disconnectId || ""}?`}
        description="This will stop syncing data from this platform. You can reconnect at any time."
        confirmLabel="Disconnect"
        variant="destructive"
        onConfirm={() => { if (disconnectId) handleDisconnect(disconnectId); }}
      />
    </div>
  );
}
