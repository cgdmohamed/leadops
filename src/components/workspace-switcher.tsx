"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Building2, Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  currency: string;
  timezone?: string;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeWorkspace: string;
  onSwitch: (id: string) => void;
  onAdd?: (workspace: Workspace) => void | Promise<void>;
  onUpdate?: (workspace: Workspace) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspace, onSwitch, onAdd, onUpdate, onDelete, collapsed }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", currency: "USD" });
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const active = workspaces.find((w) => w.id === activeWorkspace);
  const deleting = workspaces.find((w) => w.id === deleteId);

  const handleAdd = async () => {
    if (saving) return;
    if (!newWorkspace.name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }
    setSaving(true);
    try {
      await onAdd?.({ id: `ws-${Date.now()}`, name: newWorkspace.name.trim(), currency: newWorkspace.currency.trim().toUpperCase() || "USD" });
      setAddOpen(false);
      setNewWorkspace({ name: "", currency: "USD" });
      toast.success("Workspace created");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (saving || !editingWorkspace || !onUpdate) return;
    if (!editingWorkspace.name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }
    setSaving(true);
    try {
      await onUpdate({
        ...editingWorkspace,
        name: editingWorkspace.name.trim(),
        currency: editingWorkspace.currency.trim().toUpperCase() || "USD",
        timezone: editingWorkspace.timezone || "UTC",
      });
      setEditOpen(false);
      toast.success("Workspace updated");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;
    try {
      await onDelete(deleteId);
      toast.success("Workspace deleted");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const workspaceList = (
    <>
      {workspaces.map((ws) => (
        <div
          key={ws.id}
          className={cn("flex items-center rounded-sm hover:bg-muted transition-colors", activeWorkspace === ws.id && "bg-muted")}
        >
          <button
            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm outline-none"
            onClick={() => {
              onSwitch(ws.id);
              setOpen(false);
            }}
          >
            <Check className={cn("h-4 w-4 shrink-0", activeWorkspace === ws.id ? "opacity-100" : "opacity-0")} />
            <div className="flex-1 text-left min-w-0">
              <p className="font-medium truncate">{ws.name}</p>
              <p className="text-[10px] text-muted-foreground">{ws.currency}</p>
            </div>
          </button>
          {onUpdate && ws.id === activeWorkspace && (
            <button
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              title="Edit workspace"
              onClick={(event) => {
                event.stopPropagation();
                setEditingWorkspace({ ...ws, timezone: ws.timezone || "UTC" });
                setOpen(false);
                setEditOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && workspaces.length > 1 && (
            <button
              className="mr-1 rounded p-1 text-muted-foreground hover:text-destructive"
              title="Delete workspace"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteId(ws.id);
                setOpen(false);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      <div className="border-t mt-1 pt-1">
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted transition-colors"
          onClick={() => {
            setOpen(false);
            setAddOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Workspace</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "rounded-md hover:bg-muted transition-colors",
            collapsed ? "h-9 w-9 flex items-center justify-center" : "w-full flex items-center justify-between h-9 px-3 text-sm font-medium"
          )}
          title={active?.name || "Select workspace"}
        >
          {collapsed ? (
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{active?.name || "Select workspace"}</span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          {workspaceList}
        </PopoverContent>
      </Popover>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Workspace name"
                value={newWorkspace.name}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                placeholder="USD"
                value={newWorkspace.currency}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, currency: e.target.value.toUpperCase() })}
              />
              <p className="text-[10px] text-muted-foreground">e.g., USD, EUR, GBP</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Workspace name"
                value={editingWorkspace?.name ?? ""}
                onChange={(e) => setEditingWorkspace((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                placeholder="USD"
                value={editingWorkspace?.currency ?? ""}
                onChange={(e) => setEditingWorkspace((prev) => prev ? { ...prev, currency: e.target.value.toUpperCase() } : prev)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <select
                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                value={editingWorkspace?.timezone ?? "UTC"}
                onChange={(e) => setEditingWorkspace((prev) => prev ? { ...prev, timezone: e.target.value } : prev)}
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Cairo">Africa/Cairo</option>
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(value) => !value && setDeleteId(null)}
        title="Delete workspace"
        description={`Delete "${deleting?.name ?? "this workspace"}" and all its data? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
