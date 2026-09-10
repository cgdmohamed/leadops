"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/platform-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { clientApi } from "@/lib/client-api";
import { toast } from "sonner";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  ScrollText,
  Settings2,
  Inbox,
  LogOut,
} from "lucide-react";
import type { Platform } from "@/lib/types";

interface Connection {
  platform: "meta" | "google" | "tiktok" | "snapchat";
  display_name: string;
  status: "connected" | "disconnected" | "error";
  account_id: string | null;
  last_sync: string | null;
  last_error: string | null;
}

interface SyncRun {
  id: string;
  platform: "meta" | "google" | "tiktok" | "snapchat";
  status: "running" | "succeeded" | "failed";
  started_at: string;
  finished_at: string | null;
  error: string | null;
}

interface SyncResponse {
  connections: Connection[];
  history: SyncRun[];
}

const platforms = ["meta", "google", "tiktok", "snapchat"] as const;

const dataTypes = [
  { name: "Campaigns", meta: true, google: true, tiktok: true, snapchat: true },
  { name: "Ad Sets", meta: true, google: true, tiktok: true, snapchat: true },
  { name: "Ads", meta: true, google: true, tiktok: true, snapchat: true },
  { name: "Insights", meta: true, google: true, tiktok: true, snapchat: false },
  { name: "Conversions", meta: true, google: true, tiktok: false, snapchat: false },
  { name: "Audiences", meta: true, google: false, tiktok: false, snapchat: false },
];

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  synced: { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, label: "Synced", color: "bg-emerald-50 text-emerald-700" },
  syncing: { icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />, label: "Syncing", color: "bg-blue-50 text-blue-700" },
  failed: { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, label: "Failed", color: "bg-red-50 text-red-700" },
  pending: { icon: <Clock className="h-4 w-4 text-amber-500" />, label: "Pending", color: "bg-amber-50 text-amber-700" },
};

function formatTime(value: string): string {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatText(value: string): string {
  return value.length > 24 ? `${value.slice(0, 24)}…` : value;
}

export default function DataSyncPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [history, setHistory] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncPending, setSyncPending] = useState<Record<string, boolean>>({});
  const [syncingAll, setSyncingAll] = useState(false);
  const [configurePlatform, setConfigurePlatform] = useState<Platform | null>(null);
  const [logsPlatform, setLogsPlatform] = useState<Platform | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const connectedCount = connections.filter((connection) => connection.status === "connected").length;
  const syncRunsToday = history.filter((entry) => entry.started_at.startsWith(new Date().toISOString().split("T")[0])).length;
  const failedRuns = history.filter((entry) => entry.status === "failed").length;

  const load = useCallback(async () => {
    try {
      const data = await clientApi<SyncResponse>("/api/integrations");
      setConnections(data.connections);
      setHistory(data.history);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    clientApi<SyncResponse>("/api/integrations")
      .then((data) => { if (!cancelled) { setConnections(data.connections); setHistory(data.history); } })
      .catch((e) => { if (!cancelled) toast.error((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSync = async (platform: string) => {
    setSyncPending((prev) => ({ ...prev, [platform]: true }));
    try {
      const result = await clientApi<{ campaigns: number; leads: number }>("/api/integrations", {
        method: "POST",
        body: JSON.stringify({ platform }),
      });
      toast.success(`Synced ${result.campaigns} campaigns and ${result.leads} leads`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
      await load();
    } finally {
      setSyncPending((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      for (const platform of platforms) {
        try {
          await clientApi("/api/integrations", { method: "POST", body: JSON.stringify({ platform }) });
        } catch { /* keep going */ }
      }
      await load();
      toast.success("All syncs completed");
    } finally {
      setSyncingAll(false);
    }
  };

  const handleAccountConnect = async (platform: Platform) => {
    setConnecting(true);
    try {
      const { url } = await clientApi<{ url: string }>(`/api/integrations/${platform}/auth`);
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setConnecting(false);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    setDisconnecting(true);
    try {
      await clientApi(`/api/integrations`, { method: "DELETE", body: JSON.stringify({ platform }) });
      toast.success(`${platform} disconnected`);
      setConfigurePlatform(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Sync Center</h1>
          <p className="text-muted-foreground">Manage platform data synchronization.</p>
        </div>
        <Button onClick={handleSyncAll} disabled={syncingAll}>
          {syncingAll ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Sync All
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading sync status...
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Connected Platforms</p>
            <p className="text-2xl font-bold font-mono">{connections.filter((c) => c.status === "connected").length}</p>
            <p className="text-xs text-emerald-600">
              <CheckCircle className="inline h-3 w-3 mr-1" />
              {connections.length} total platforms
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Last Sync</p>
            <p className="text-2xl font-bold">
              {history[0]?.started_at
                ? new Date(history[0].started_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                : "Never"}
            </p>
            {history[0]?.status === "running" ? (
              <p className="text-xs text-blue-600"><Loader2 className="inline h-3 w-3 mr-1 animate-spin" />In progress</p>
            ) : (
              <p className="text-xs text-muted-foreground">{history.length} runs recorded</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sync Health</p>
            <p className="text-2xl font-bold">
              {connections.length > 0 ? Math.round((connections.filter((c) => c.status !== "error").length / connections.length) * 100) : 0}%
            </p>
            <p className={`text-xs ${connections.some((c) => c.status === "error") ? "text-amber-600" : "text-muted-foreground"}`}>
              {connections.some((c) => c.status === "error") ? <AlertTriangle className="inline h-3 w-3 mr-1" /> : <CheckCircle className="inline h-3 w-3 mr-1" />}
              {connections.some((c) => c.status === "error") ? `${connections.filter((c) => c.status === "error").length} platform(s) in error` : "All platforms healthy"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Status</CardTitle>
            <CardDescription>Live connection and sync status for each platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {platforms.map((platform) => {
              const connection = connections.find((c) => c.platform === platform);
              const status = connection?.status ?? "disconnected";
              const running = connection && history.some((h) => h.platform === platform && h.status === "running");
              const effectiveStatus = running ? "syncing" : status === "connected" ? "synced" : status === "error" ? "failed" : "pending";
              const config = statusConfig[effectiveStatus];
              return (
                <div key={platform} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={platform} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{platform}</span>
                        <Badge className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground/70">Status: </span>
                      <span className="text-foreground">{connection ? connection.status : "Not connected"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Account ID: </span>
                      <span className="text-foreground font-mono text-[11px]">{connection?.account_id ?? formatText("--")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Last Sync: </span>
                      <span className="text-foreground">{connection?.last_sync ? formatTime(connection.last_sync) : "--"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/70">Display: </span>
                      <span className="text-foreground">{connection ? formatText(connection.display_name) : "--"}</span>
                    </div>
                  </div>

                  {connection?.last_error && <p className="text-xs text-red-500">{connection.last_error}</p>}

                  <div className="flex items-center gap-1 pt-1 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleSync(platform)}
                      disabled={syncPending[platform] || effectiveStatus === "syncing"}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${effectiveStatus === "syncing" ? "animate-spin" : ""}`} />
                      Sync Now
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setLogsPlatform(platform)}
                    >
                      <ScrollText className="h-3 w-3 mr-1" />
                      Logs
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setConfigurePlatform(platform)}
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Types</CardTitle>
            <CardDescription>Which data is synced from each platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="sticky left-0 bg-card text-left pb-2 pr-4 font-medium z-10">Data Type</th>
                    <th className="w-14 text-center pb-2 font-medium">Meta</th>
                    <th className="w-14 text-center pb-2 font-medium">Google</th>
                    <th className="w-14 text-center pb-2 font-medium">TikTok</th>
                    <th className="w-14 text-center pb-2 font-medium">Snap</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTypes.map((dt) => (
                    <tr key={dt.name} className="border-b last:border-0">
                      <td className="sticky left-0 bg-card py-1.5 pr-4 font-medium z-10">{dt.name}</td>
                      {[dt.meta, dt.google, dt.tiktok, dt.snapchat].map((enabled, i) => (
                        <td key={i} className="text-center py-1.5">
                          {enabled ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sync History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No sync history yet</p>
                <p className="text-xs mt-1">Sync a platform to see history here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground w-20">{new Date(entry.started_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                    <span className="font-medium w-20 capitalize">{entry.platform}</span>
                    <span className="flex-1 text-muted-foreground">{entry.error ?? "Full sync"}</span>
                    <Badge
                      variant={entry.status === "succeeded" ? "secondary" : entry.status === "failed" ? "destructive" : "default"}
                      className="text-[10px]"
                    >
                      {entry.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Details</CardTitle>
            <CardDescription>API usage and system information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sync Runs Today</span>
              <span className="font-medium">{syncRunsToday}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(connectedCount / platforms.length) * 100}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connected Platforms</span>
              <span className="font-medium">{connectedCount} / {platforms.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Failed Sync Runs</span>
              <span className="font-medium">{failedRuns}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Webhook Status</span>
              <Badge variant="outline" className="text-[10px]">Not configured</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!configurePlatform} onOpenChange={(o) => { if (!o) setConfigurePlatform(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              Configure {configurePlatform}
            </DialogTitle>
          </DialogHeader>
          {configurePlatform && (() => {
            const connection = connections.find((c) => c.platform === configurePlatform);
            return (
            <div className="space-y-4">
              {connection?.status === "connected" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    This platform is connected. Sync will reconcile campaigns and leads against your ad account.
                  </p>
                  <div className="rounded-lg border p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-emerald-50 text-emerald-700 text-[10px]">Connected</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Account ID</span><span className="font-medium font-mono text-xs">{connection.account_id ?? "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last Sync</span><span className="font-medium">{connection.last_sync ? formatTime(connection.last_sync) : "—"}</span></div>
                  </div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={() => handleDisconnect(configurePlatform)} disabled={disconnecting}>
                      <LogOut className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Connect with your {configurePlatform} account. You will be redirected to authorize access, then brought back automatically.
                  </p>
                  <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                    Make sure the OAuth app credentials for {configurePlatform} are configured in the production environment first.
                    The callback URL is <span className="font-mono text-foreground">/api/integrations/{configurePlatform}/callback</span>.
                  </div>
                  {configurePlatform !== "google" && (
                    <p className="text-xs text-muted-foreground">
                      After login, LeadOps will try to detect the first available ad account automatically.
                    </p>
                  )}
                  <DialogFooter>
                    <Button onClick={() => handleAccountConnect(configurePlatform)} disabled={connecting}>
                      {connecting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Connect with {configurePlatform}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!logsPlatform} onOpenChange={(o) => { if (!o) setLogsPlatform(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              <ScrollText className="h-4 w-4" /> Sync Logs — {logsPlatform}
            </DialogTitle>
          </DialogHeader>
          {logsPlatform && (
            <div className="space-y-2">
              {history.filter((h) => h.platform === logsPlatform).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No runs recorded for {logsPlatform} yet.</p>
              ) : (
                history.filter((h) => h.platform === logsPlatform).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                    <div className="w-32 shrink-0 text-muted-foreground">{new Date(entry.started_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                    <Badge variant={entry.status === "succeeded" ? "secondary" : entry.status === "failed" ? "destructive" : "default"} className="text-[10px] shrink-0 capitalize">{entry.status}</Badge>
                    <div className="flex-1 min-w-0 truncate text-muted-foreground">{entry.error ?? (entry.status === "running" ? "In progress..." : "Completed")}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
