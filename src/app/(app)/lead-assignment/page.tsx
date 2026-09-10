"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useRecords } from "@/lib/use-records";
import { clientApi } from "@/lib/client-api";
import type { Lead, LeadStatus, Platform, TeamMember } from "@/lib/types";
import { toast } from "sonner";
import {
  Users,
  RotateCcw,
  Zap,
  UserPlus,
  Shield,
} from "lucide-react";

const slaPolicies = [
  { id: "high", name: "High Priority", responseTime: "1 hour", followUpCount: 5, color: "#EF4444" },
  { id: "medium", name: "Medium Priority", responseTime: "4 hours", followUpCount: 3, color: "#F59E0B" },
  { id: "low", name: "Low Priority", responseTime: "24 hours", followUpCount: 2, color: "#3B82F6" },
];

const assignmentRules = [
  { id: "round-robin", name: "Round Robin", description: "Distribute leads evenly across team members", enabled: true, icon: <RotateCcw className="h-4 w-4" /> },
  { id: "load-balanced", name: "Load Balanced", description: "Assign to team member with fewest active leads", enabled: false, icon: <Users className="h-4 w-4" /> },
  { id: "skill-based", name: "Skill Based", description: "Match lead platform to team member expertise", enabled: false, icon: <Zap className="h-4 w-4" /> },
  { id: "territory", name: "Territory", description: "Assign based on lead location or company", enabled: false, icon: <Shield className="h-4 w-4" /> },
];

function toLead(record: { id: string; data: Record<string, unknown>; ownerId: string | null; createdAt: string }): Lead {
  const d = record.data;
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
    updatedAt: str(d.updatedAt, record.createdAt),
    convertedToOpportunity: str(d.convertedToOpportunity),
  };
}

export default function LeadAssignmentPage() {
  const { items: leadRecords, update } = useRecords<Record<string, unknown>>("leads");
  const leads = useMemo<Lead[]>(() => leadRecords.map((r) => toLead(r)), [leadRecords]);
  const [rules, setRules] = useState(assignmentRules);
  const [roundRobinIndex, setRoundRobinIndex] = useState(0);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    clientApi<TeamMember[]>("/api/team")
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        data.forEach((m) => { map[m.id] = m.name; });
        setOwnerNames(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const unassignedLeads = useMemo(() => leads.filter((l) => !l.ownerId), [leads]);

  const agents = useMemo(() => {
    const map = new Map<string, { name: string; count: number; avatar: string }>();
    leads.forEach((l) => {
      const name = l.ownerId ? ownerNames[l.ownerId] || "Team Member" : "";
      if (!name) return;
      const existing = map.get(name) || { name, count: 0, avatar: name.split(" ").map((n) => n[0]).join("") };
      existing.count++;
      map.set(name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [leads, ownerNames]);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    toast.success("Rule updated");
  };

  const handleAutoAssign = async () => {
    const memberIds = Object.keys(ownerNames);
    if (!memberIds.length) {
      toast.error("Add team members before assigning leads");
      return;
    }
    try {
      await Promise.all(
        unassignedLeads.map((lead, index) =>
          update(lead.id, {}, memberIds[(roundRobinIndex + index) % memberIds.length])
        )
      );
      setRoundRobinIndex((roundRobinIndex + unassignedLeads.length) % memberIds.length);
      toast.success(`Assigned ${unassignedLeads.length} leads using round robin`, {
        description: "All unassigned leads have been distributed.",
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Assignment</h1>
        <p className="text-muted-foreground">Configure automatic lead routing and SLA policies.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Assignment Rules</CardTitle>
            <CardDescription>Choose how incoming leads are distributed to your team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    {rule.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Quick Assign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{unassignedLeads.length}</p>
                <p className="text-xs text-muted-foreground">Unassigned Leads</p>
              </div>
              <Button className="w-full" onClick={handleAutoAssign}>
                <RotateCcw className="h-4 w-4 mr-1" /> Auto-Assign All
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Load</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.name} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[8px]">{agent.avatar}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">{agent.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{agent.count} leads</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SLA Policies</CardTitle>
          <CardDescription>Set response time requirements by lead priority.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {slaPolicies.map((policy) => (
              <div key={policy.id} className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: policy.color }} />
                  <h3 className="text-sm font-medium">{policy.name}</h3>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="font-medium text-foreground">{policy.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Follow-ups:</span>
                    <span className="font-medium text-foreground">{policy.followUpCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
