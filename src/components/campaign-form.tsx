"use client";

import { useState } from "react";
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

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; platform: string; budget: number }) => void;
}

export function CampaignForm({ open, onOpenChange, onSubmit }: CampaignFormProps) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [budget, setBudget] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      platform,
      budget: Number(budget),
    });
    setName("");
    setPlatform("");
    setBudget("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g. Q4 Product Launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => v && setPlatform(v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta">Meta</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="snapchat">Snapchat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="10000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name || !platform || !budget}>
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
