"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { clientApi } from "@/lib/client-api";
import type { Platform, TeamMember, User as AppUser, Workspace } from "@/lib/types";

interface PlatformConnection {
  platform: Platform;
  label: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  accountId?: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  entityId: string | null;
  createdAt: string;
  userName: string;
}

const platformLabels: Record<Platform, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
  snapchat: "Snapchat Ads",
};

const platforms = Object.keys(platformLabels) as Platform[];

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
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("profile");
  const [me, setMe] = useState<AppUser | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [connections, setConnections] = useState<PlatformConnection[]>(platforms.map((platform) => ({
    platform,
    label: platformLabels[platform],
    status: "disconnected",
  })));
  const [disconnectId, setDisconnectId] = useState<Platform | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);
  const roleCounts = useMemo(() => ({
    admin: teamMembers.filter((member) => member.role === "admin").length,
    agent: teamMembers.filter((member) => member.role === "agent").length,
  }), [teamMembers]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [user, workspaceData, integrationData, team, audit] = await Promise.all([
          clientApi<AppUser>("/api/me"),
          clientApi<Workspace>("/api/settings"),
          clientApi<{ connections: Array<{ platform: Platform; status: PlatformConnection["status"]; account_id: string | null; last_sync: string | null }> }>("/api/integrations"),
          clientApi<TeamMember[]>("/api/team"),
          clientApi<AuditEntry[]>("/api/audit"),
        ]);
        if (cancelled) return;
        setMe(user);
        setName(user.name);
        setEmail(user.email);
        setWorkspace(workspaceData);
        setTeamMembers(team);
        setAuditEntries(audit);
        setConnections(platforms.map((platform) => {
          const found = integrationData.connections.find((connection) => connection.platform === platform);
          return {
            platform,
            label: platformLabels[platform],
            status: found?.status ?? "disconnected",
            accountId: found?.account_id,
            lastSync: found?.last_sync ?? undefined,
          };
        }));
      } catch (error) {
        if (!cancelled) toast.error((error as Error).message);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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
    try {
      const updated = await clientApi<AppUser>("/api/me", { method: "PATCH", body: JSON.stringify({ name, email }) });
      setMe((prev) => prev ? { ...prev, ...updated } : prev);
      toast.success("Profile updated");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 12) {
      toast.error("Password too short", { description: "Must be at least 12 characters." });
      return;
    }
    setSaving(true);
    try {
      await clientApi("/api/me", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = () => {
    router.push("/data-sync");
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      await clientApi("/api/integrations", { method: "DELETE", body: JSON.stringify({ platform }) });
      setConnections((prev) => prev.map((c) => c.platform === platform ? { ...c, status: "disconnected", lastSync: undefined, accountId: null } : c));
      toast.success("Disconnected");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSync = async (platform: Platform) => {
    try {
      await clientApi("/api/integrations", { method: "POST", body: JSON.stringify({ platform }) });
      toast.success("Synced");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await clientApi<Workspace>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name: workspace.name,
          currency: workspace.currency,
          timezone: workspace.timezone,
        }),
      });
      setWorkspace(updated);
      toast.success("Workspace settings saved");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
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
  };

  const updatePipelineName = (pipelineId: string, name: string) => {
    setPipelines((prev) => prev.map((p) => p.id === pipelineId ? { ...p, name } : p));
  };

  const deletePipeline = (pipelineId: string) => {
    setPipelines((prev) => prev.filter((p) => p.id !== pipelineId));
  };

  const updateStage = (pipelineId: string, stageId: string, updates: { name?: string; probability?: number }) => {
    setPipelines((prev) => prev.map((p) => p.id === pipelineId ? {
      ...p,
      stages: p.stages.map((s) => s.id === stageId ? { ...s, ...updates } : s),
    } : p));
  };

  const addStage = (pipelineId: string) => {
    setPipelines((prev) => prev.map((p) => p.id === pipelineId ? {
      ...p,
      stages: [...p.stages, { id: `s_${Date.now()}`, name: "New Stage", color: "#6B7280", probability: 50 }],
    } : p));
  };

  const deleteStage = (pipelineId: string, stageId: string) => {
    setPipelines((prev) => prev.map((p) => p.id === pipelineId ? {
      ...p,
      stages: p.stages.filter((s) => s.id !== stageId),
    } : p));
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: workspace?.currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, workspace, integrations, and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* Sidebar Navigation */}
        <Card className="h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="space-y-4">
          {/* Profile */}
          {activeSection === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                        {(me?.name ?? "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button type="button" variant="outline" size="sm">Change Photo</Button>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={me?.role ?? ""} disabled />
                  </div>
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Password */}
          {activeSection === "password" && (
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Must be at least 12 characters.</p>
                  </div>
                  <Button type="submit" disabled={saving}>{saving ? "Changing..." : "Change Password"}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Platforms */}
          {activeSection === "platforms" && (
            <Card>
              <CardHeader>
                <CardTitle>Platform Connections</CardTitle>
                <CardDescription>Connect your advertising platforms to sync campaign data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connections.map((conn) => (
                  <div key={conn.platform} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <PlatformIcon platform={conn.platform} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{conn.label}</h3>
                          {conn.status === "connected" && <Badge variant="success" className="text-xs">Connected</Badge>}
                          {conn.status === "error" && <Badge variant="destructive" className="text-xs">Error</Badge>}
                          {conn.status === "disconnected" && <Badge variant="secondary" className="text-xs">Not Connected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {conn.status === "connected" && `Account: ${conn.accountId ?? "Connected account"} - Last sync: ${conn.lastSync ?? "Not synced yet"}`}
                          {conn.status === "error" && "Connection error. Please reconnect."}
                          {conn.status === "disconnected" && "Connect to import campaigns, leads, and performance metrics"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conn.status === "connected" ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleSync(conn.platform)}>
                            Sync Now
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDisconnectId(conn.platform)}>
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={handleConnect}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pipelines */}
          {activeSection === "pipelines" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pipelines & Stages</CardTitle>
                    <CardDescription>Customize your sales pipelines and stage probabilities</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowNewPipeline(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Pipeline
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {showNewPipeline && (
                  <div className="flex gap-2 p-4 border rounded-lg bg-muted/30">
                    <Input
                      placeholder="Pipeline name"
                      value={newPipelineName}
                      onChange={(e) => setNewPipelineName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPipeline()}
                    />
                    <Button onClick={addPipeline}>Add</Button>
                    <Button variant="outline" onClick={() => setShowNewPipeline(false)}>Cancel</Button>
                  </div>
                )}

                {pipelines.map((pipeline) => (
                  <div key={pipeline.id} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-5 w-5 text-muted-foreground" />
                        <Input
                          value={pipeline.name}
                          onChange={(e) => updatePipelineName(pipeline.id, e.target.value)}
                          className="font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0 w-48"
                        />
                        {pipeline.isDefault && <Badge variant="secondary">Default</Badge>}
                      </div>
                      {!pipeline.isDefault && (
                        <Button variant="ghost" size="icon" onClick={() => deletePipeline(pipeline.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      {pipeline.stages.map((stage) => (
                        <div key={stage.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }} />
                          {editingStage === stage.id ? (
                            <Input
                              value={stage.name}
                              onChange={(e) => updateStage(pipeline.id, stage.id, { name: e.target.value })}
                              onBlur={() => setEditingStage(null)}
                              onKeyDown={(e) => e.key === "Enter" && setEditingStage(null)}
                              autoFocus
                              className="flex-1 h-8"
                            />
                          ) : (
                            <span className="flex-1 font-medium" onClick={() => setEditingStage(stage.id)}>{stage.name}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={stage.probability}
                              onChange={(e) => updateStage(pipeline.id, stage.id, { probability: parseInt(e.target.value) || 0 })}
                              className="w-20 h-8 text-right"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setEditingStage(stage.id)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {pipeline.stages.length > 2 && (
                            <Button variant="ghost" size="icon" onClick={() => deleteStage(pipeline.id, stage.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addStage(pipeline.id)} className="w-full mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stage
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive alerts and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: "New Lead Assigned", description: "When a new lead is assigned to you", enabled: true },
                  { title: "Lead Status Changed", description: "When a lead status is updated", enabled: true },
                  { title: "Campaign Performance", description: "Daily summary of campaign metrics", enabled: false },
                  { title: "Goal Progress", description: "When goals reach 80% or 100%", enabled: true },
                  { title: "Team Updates", description: "When team members join or leave", enabled: false },
                ].map((notification, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <button
                      onClick={() => {}}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notification.enabled ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notification.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Roles */}
          {activeSection === "roles" && (
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage role permissions for your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { role: "Admin", count: roleCounts.admin, color: "bg-primary" },
                    { role: "Agent", count: roleCounts.agent, color: "bg-blue-500" },
                  ].map((role) => (
                    <Card key={role.role}>
                      <CardContent className="p-4">
                        <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center mb-3`}>
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold">{role.role}</h3>
                        <p className="text-sm text-muted-foreground">{role.count} members</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Team Members</h3>
                  <div className="space-y-2">
                    {teamMembers.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                        Team members will appear here after they are invited.
                      </div>
                    ) : teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revenue */}
          {activeSection === "revenue" && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Definitions</CardTitle>
                <CardDescription>Configure how revenue is calculated and attributed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "Closed Won Revenue", description: "Revenue from opportunities marked as won", enabled: true },
                    { label: "Collected Revenue", description: "Only count revenue after payment is received", enabled: true },
                    { label: "Recurring Revenue", description: "Include monthly/annual recurring revenue", enabled: false },
                    { label: "Upsell Revenue", description: "Track expansion revenue from existing customers", enabled: true },
                  ].map((def, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <input type="checkbox" checked={def.enabled} readOnly className="mt-1" />
                      <div>
                        <h4 className="font-medium">{def.label}</h4>
                        <p className="text-sm text-muted-foreground">{def.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <select
                    value={workspace?.currency ?? "USD"}
                    onChange={(e) => setWorkspace((prev) => prev ? { ...prev, currency: e.target.value } : prev)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="EGP">EGP - Egyptian Pound</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Currency */}
          {activeSection === "currency" && (
            <Card>
              <CardHeader>
                <CardTitle>Currency & Workspace</CardTitle>
                <CardDescription>Manage workspace settings and localization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input value={workspace?.name ?? ""} onChange={(e) => setWorkspace((prev) => prev ? { ...prev, name: e.target.value } : prev)} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <select
                      value={workspace?.currency ?? "USD"}
                      onChange={(e) => setWorkspace((prev) => prev ? { ...prev, currency: e.target.value } : prev)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="EGP">EGP - Egyptian Pound</option>
                      <option value="SAR">SAR - Saudi Riyal</option>
                      <option value="AED">AED - UAE Dirham</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <select
                      value={workspace?.timezone ?? "UTC"}
                      onChange={(e) => setWorkspace((prev) => prev ? { ...prev, timezone: e.target.value } : prev)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Africa/Cairo">Cairo</option>
                      <option value="Asia/Dubai">Dubai</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleSaveWorkspace} disabled={saving || !workspace}>{saving ? "Saving..." : "Save Workspace Settings"}</Button>
              </CardContent>
            </Card>
          )}

          {/* Audit Log */}
          {activeSection === "audit" && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Recent security and configuration changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditEntries.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      No audit events have been recorded yet.
                    </div>
                  ) : auditEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <History className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.userName} - {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage security settings and active sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {twoFactor ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        {twoFactor ? "Your account is protected with 2FA" : "Add an extra layer of security"}
                      </p>
                    </div>
                  </div>
                  <Button variant={twoFactor ? "outline" : "default"} onClick={() => setTwoFactor(!twoFactor)}>
                    {twoFactor ? "Disable" : "Enable"}
                  </Button>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Active Sessions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Current session</p>
                        <p className="text-sm text-muted-foreground">Other session management is not enabled yet.</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Account deletion is not enabled yet. Workspaces can be deleted from the workspace menu when more than one workspace exists.
                  </p>
                  <Button variant="destructive" disabled>Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={disconnectId !== null}
        onOpenChange={(open) => !open && setDisconnectId(null)}
        title={`Disconnect ${disconnectId ? platformLabels[disconnectId] : "platform"}?`}
        description="This will stop future syncs for this platform. Existing records will stay in the workspace."
        confirmLabel="Disconnect"
        variant="destructive"
        onConfirm={() => {
          if (!disconnectId) return;
          void handleDisconnect(disconnectId);
        }}
      />
    </div>
  );
}
