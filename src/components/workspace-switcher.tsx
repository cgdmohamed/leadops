"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Building2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspace, onSwitch, onAdd, collapsed }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", currency: "USD" });
  const active = workspaces.find((w) => w.id === activeWorkspace);

  const [saving, setSaving] = useState(false);
  const handleAdd = async () => {
    if (saving) return;
    if (!newWorkspace.name) {
      toast.error("Please enter a workspace name");
      return;
    }
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name: newWorkspace.name,
      currency: newWorkspace.currency,
    };
    setSaving(true);
    try {
    await onAdd?.(ws);
    setAddOpen(false);
    setNewWorkspace({ name: "", currency: "USD" });
    toast.success(`Workspace "${ws.name}" created`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally { setSaving(false); }
  };

  if (collapsed) {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
            title={active?.name || "Select workspace"}
          >
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="start">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted transition-colors",
                  activeWorkspace === ws.id && "bg-muted"
                )}
                onClick={() => {
                  onSwitch(ws.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    activeWorkspace === ws.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{ws.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ws.currency}</p>
                </div>
              </button>
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
              <Button onClick={handleAdd}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="w-full flex items-center justify-between h-9 px-3 text-sm font-medium rounded-md hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{active?.name || "Select workspace"}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted transition-colors",
                activeWorkspace === ws.id && "bg-muted"
              )}
              onClick={() => {
                onSwitch(ws.id);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  activeWorkspace === ws.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex-1 text-left">
                <p className="font-medium">{ws.name}</p>
                <p className="text-[10px] text-muted-foreground">{ws.currency}</p>
              </div>
            </button>
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
            <Button onClick={handleAdd}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
