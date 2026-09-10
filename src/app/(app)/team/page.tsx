"use client";

import { useState, useEffect } from "react";
import { clientApi } from "@/lib/client-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Shield, User, Edit2, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import type { TeamMember } from "@/lib/types";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<{ email: string; role: "admin" | "agent" }>({ email: "", role: "agent" });

  useEffect(() => {
    clientApi<TeamMember[]>("/api/team").then(setMembers).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!newMember.email) {
      toast.error("Please enter an email address");
      return;
    }
    try {
      const result = await clientApi<{ emailSent?: boolean; inviteLink?: string }>("/api/team", { method: "POST", body: JSON.stringify({ email: newMember.email, role: newMember.role }) });
      toast.success(result.emailSent === false ? `Invite link created for ${newMember.email}` : `Invitation sent to ${newMember.email}`, {
        description: result.inviteLink ?? `Role: ${newMember.role}`,
      });
      setInviteOpen(false);
      setNewMember({ email: "", role: "agent" });
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleEditRole = async (memberId: string, newRole: string) => {
    try {
      await clientApi("/api/team", { method: "PATCH", body: JSON.stringify({ id: memberId, role: newRole }) });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole as "admin" | "agent" } : m)));
      setEditOpen(false);
      setEditingMember(null);
      toast.success("Role updated");
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await clientApi("/api/team", { method: "DELETE", body: JSON.stringify({ id: memberId }) });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their assignments.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Team Members</p>
            <p className="text-2xl font-bold">{members.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Assigned Leads</p>
            <p className="text-2xl font-bold">
              {members.reduce((s, m) => s + m.assignedLeads, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Win Rate</p>
            <p className="text-2xl font-bold">
              {members.length > 0
                ? Math.round(members.reduce((s, m) => s + m.winRate, 0) / members.length)
                : 0}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Assigned Leads</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    Loading team members...
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No team members found.
                  </TableCell>
                </TableRow>
              ) : members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {member.role === "admin" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {member.assignedLeads}
                  </TableCell>
                  <TableCell className="text-right">{member.wonDeals}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        member.winRate >= 20
                          ? "text-success font-medium"
                          : member.winRate >= 10
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {member.winRate}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingMember(member.id);
                          setEditOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                placeholder="email@company.com"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newMember.role}
                onValueChange={(v) => v && setNewMember({ ...newMember, role: v as "admin" | "agent" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite}>
              <Mail className="h-4 w-4 mr-1" /> Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editingMember && (() => {
              const member = members.find((m) => m.id === editingMember);
              if (!member) return null;
              return (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      defaultValue={member.role}
                      onValueChange={(v) => v && handleEditRole(member.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {member.role === "admin"
                      ? "Admins have full access to all features, settings, and team management."
                      : "Agents can view and manage assigned leads only."}
                  </p>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
