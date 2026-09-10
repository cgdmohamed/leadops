"use client";

import { useMemo, useState } from "react";
import { useRecords, type ApiRecord } from "@/lib/use-records";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Target,
  TrendingUp,
  Trophy,
  Plus,
  Flame,
  CircleDollarSign,
  Percent,
  Phone,
  Briefcase,
  Handshake,
  Megaphone,
  BarChart3,
  Inbox,
} from "lucide-react";

type GoalType =
  | "revenue"
  | "collected_revenue"
  | "leads"
  | "qualified_leads"
  | "opportunities"
  | "deals"
  | "calls"
  | "cac"
  | "roas";

interface Goal {
  id: string;
  name: string;
  type: GoalType;
  target: number;
  current: number;
  period: string;
  icon: React.ReactNode;
  color: string;
  assignedTo?: string;
}

const goalTypeLabels: Record<GoalType, string> = {
  revenue: "Revenue",
  collected_revenue: "Collected Revenue",
  leads: "Leads",
  qualified_leads: "Qualified Leads",
  opportunities: "Opportunities",
  deals: "Won Deals",
  calls: "Calls",
  cac: "CAC",
  roas: "ROAS",
};

const goalTypeIcons: Record<GoalType, React.ReactNode> = {
  revenue: <TrendingUp className="h-4 w-4" />,
  collected_revenue: <CircleDollarSign className="h-4 w-4" />,
  leads: <Target className="h-4 w-4" />,
  qualified_leads: <Megaphone className="h-4 w-4" />,
  opportunities: <Briefcase className="h-4 w-4" />,
  deals: <Trophy className="h-4 w-4" />,
  calls: <Flame className="h-4 w-4" />,
  cac: <Percent className="h-4 w-4" />,
  roas: <Handshake className="h-4 w-4" />,
};

const goalTypeColors: Record<GoalType, string> = {
  revenue: "#3B82F6",
  collected_revenue: "#06B6D4",
  leads: "#8B5CF6",
  qualified_leads: "#A855F7",
  opportunities: "#EC4899",
  deals: "#10B981",
  calls: "#F59E0B",
  cac: "#EF4444",
  roas: "#14B8A6",
};

const teamMembers = ["Sarah Chen", "James Rivera", "Mike Johnson"];

const weeklyProgress = [
  { week: "W1", revenue: 22000, leads: 32, deals: 4 },
  { week: "W2", revenue: 28000, leads: 38, deals: 5 },
  { week: "W3", revenue: 25000, leads: 35, deals: 4 },
  { week: "W4", revenue: 23500, leads: 37, deals: 5 },
];

const teamGoals = [
  { name: "Sarah Chen", revenue: 45000, target: 50000, deals: 8, targetDeals: 10 },
  { name: "James Rivera", revenue: 32000, target: 40000, deals: 5, targetDeals: 8 },
  { name: "Mike Johnson", revenue: 21500, target: 30000, deals: 5, targetDeals: 6 },
];

function monthEndDate(period: string): string {
  const parsed = new Date(`${period} 1`);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split("T")[0];
  return new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0).toISOString().split("T")[0];
}

function formatPeriod(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function toGoal(record: ApiRecord<Record<string, unknown>>): Goal {
  const d = record.data;
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
  const type = str(d.metric, "revenue") as GoalType;
  return {
    id: record.id,
    name: str(d.name, goalTypeLabels[type] ?? "Goal"),
    type,
    target: num(d.target),
    current: num(d.current),
    period: formatPeriod(str(d.dueDate, record.createdAt)),
    icon: goalTypeIcons[type] ?? goalTypeIcons.revenue,
    color: goalTypeColors[type] ?? goalTypeColors.revenue,
    assignedTo: str(d.assignedTo) || undefined,
  };
}

function isCurrencyType(type: GoalType): boolean {
  return type === "revenue" || type === "collected_revenue" || type === "cac";
}

function isRatioType(type: GoalType): boolean {
  return type === "roas";
}

function formatGoalValue(type: GoalType, value: number): string {
  if (isCurrencyType(type)) return `$${(value / 1000).toFixed(1)}K`;
  if (isRatioType(type)) return `${value.toFixed(1)}x`;
  return value.toLocaleString();
}

function formatGoalTarget(type: GoalType, value: number): string {
  if (isCurrencyType(type)) return `$${(value / 1000).toFixed(0)}K`;
  if (isRatioType(type)) return `${value.toFixed(0)}x`;
  return value.toLocaleString();
}

export default function GoalsPage() {
  const { items: goalRecords, create } = useRecords<Record<string, unknown>>("goals");
  const goals = useMemo(() => goalRecords.map((record) => toGoal(record)), [goalRecords]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState<"revenue" | "leads" | "deals">("revenue");

  const [newGoal, setNewGoal] = useState({
    type: "revenue" as GoalType,
    target: "",
    period: "Sep 2026",
    assignedTo: "",
  });

  const handleCreateGoal = async () => {
    if (!newGoal.target || Number(newGoal.target) <= 0) return;

    await create({
      name: goalTypeLabels[newGoal.type],
      metric: newGoal.type,
      target: Number(newGoal.target),
      current: 0,
      dueDate: monthEndDate(newGoal.period),
      assignedTo: newGoal.assignedTo || undefined,
    });
    setNewGoal({ type: "revenue", target: "", period: "Sep 2026", assignedTo: "" });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals & Targets</h1>
          <p className="text-muted-foreground">Track team performance against targets.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No goals yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first goal to start tracking team performance.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {goals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const isOnTrack = progress >= 60;
            return (
              <Card key={goal.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                    >
                      {goal.icon}
                    </div>
                    <Badge variant={isOnTrack ? "secondary" : "destructive"} className="text-[10px]">
                      {isOnTrack ? "On Track" : "Behind"}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{goal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {goal.period}
                    {goal.assignedTo && ` · ${goal.assignedTo}`}
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{formatGoalValue(goal.type, goal.current)}</span>
                      <span className="text-muted-foreground">{formatGoalTarget(goal.type, goal.target)}</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% complete</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Progress</CardTitle>
            <Tabs
              value={chartMetric}
              onValueChange={(v: string | null) => v && setChartMetric(v as "revenue" | "leads" | "deals")}
            >
              <TabsList variant="line" className="mt-2">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="leads">Leads</TabsTrigger>
                <TabsTrigger value="deals">Deals</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    chartMetric === "revenue" ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString(),
                    chartMetric.charAt(0).toUpperCase() + chartMetric.slice(1),
                  ]}
                />
                <Bar dataKey={chartMetric} fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Performance</CardTitle>
            <CardDescription>Individual progress toward personal targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamGoals.map((member) => {
              const revProgress = (member.revenue / member.target) * 100;
              const dealProgress = (member.deals / member.targetDeals) * 100;
              return (
                <div key={member.name} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{member.name}</span>
                    <Badge
                      variant={revProgress >= 80 ? "secondary" : "destructive"}
                      className="text-[10px]"
                    >
                      {revProgress >= 80 ? "On Track" : "Behind"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Revenue</span>
                        <span>
                          ${(member.revenue / 1000).toFixed(1)}K / $
                          {(member.target / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <Progress value={revProgress} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Deals</span>
                        <span>
                          {member.deals} / {member.targetDeals}
                        </span>
                      </div>
                      <Progress value={dealProgress} className="h-1.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Goal</DialogTitle>
            <DialogDescription>Set a new target for your team.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Type</label>
              <Select
                value={newGoal.type}
                onValueChange={(v: string | null) => v && setNewGoal((prev) => ({ ...prev, type: v as GoalType }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(goalTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Value</label>
              <Input
                type="number"
                placeholder={isCurrencyType(newGoal.type) ? "150000" : isRatioType(newGoal.type) ? "3.5" : "200"}
                value={newGoal.target}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, target: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Input
                type="text"
                placeholder="Sep 2026"
                value={newGoal.period}
                onChange={(e) => setNewGoal((prev) => ({ ...prev, period: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Assign to Team Member <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Select
                value={newGoal.assignedTo}
                onValueChange={(v: string | null) => setNewGoal((prev) => ({ ...prev, assignedTo: v ?? "" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No one" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} disabled={!newGoal.target || Number(newGoal.target) <= 0}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
