"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlatformBadge } from "@/components/platform-badge";
import { useRecords } from "@/lib/use-records";
import type { Platform } from "@/lib/types";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const touchpointData = [
  { name: "First Touch", leads: 45, conversion: 32 },
  { name: "Last Touch", leads: 38, conversion: 41 },
  { name: "Linear", leads: 42, conversion: 36 },
  { name: "Time Decay", leads: 40, conversion: 38 },
  { name: "Position Based", leads: 43, conversion: 35 },
];

const channelAttribution = [
  { channel: "Meta Ads", firstTouch: 35, lastTouch: 28, linear: 32 },
  { channel: "Google Ads", firstTouch: 25, lastTouch: 32, linear: 28 },
  { channel: "TikTok Ads", firstTouch: 22, lastTouch: 18, linear: 20 },
  { channel: "Snapchat Ads", firstTouch: 12, lastTouch: 15, linear: 14 },
  { channel: "Direct", firstTouch: 5, lastTouch: 7, linear: 6 },
];

const funnelSteps = [
  { name: "Impressions", value: 125000, color: "#3B82F6" },
  { name: "Clicks", value: 8500, color: "#6366F1" },
  { name: "Landing Page Views", value: 6200, color: "#8B5CF6" },
  { name: "Leads", value: 380, color: "#A855F7" },
  { name: "Qualified", value: 185, color: "#D946EF" },
  { name: "Opportunities", value: 92, color: "#EC4899" },
  { name: "Won", value: 42, color: "#10B981" },
];

export default function AttributionPage() {
  const [model, setModel] = useState("last-touch");
  const { items: campaignRecords } = useRecords<Record<string, unknown>>("campaigns");

  const platformData = useMemo(() => {
    const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
    const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
    return campaignRecords.reduce((acc, r) => {
      const c = r.data;
      const platform = str(c.platform, "meta") as Platform;
      const existing = acc.find((a) => a.platform === platform);
      if (existing) {
        existing.leads += num(c.leads);
        existing.revenue += num(c.wonRevenue);
        existing.spend += num(c.spend);
      } else {
        acc.push({ platform, leads: num(c.leads), revenue: num(c.wonRevenue), spend: num(c.spend) });
      }
      return acc;
    }, [] as { platform: Platform; leads: number; revenue: number; spend: number }[]);
  }, [campaignRecords]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attribution Analytics</h1>
        <p className="text-muted-foreground">Understand which channels drive conversions across the journey.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Impressions</p>
            <p className="text-2xl font-bold">125K</p>
            <p className="text-xs text-emerald-600"><TrendingUp className="inline h-3 w-3 mr-1" />+12% vs last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Clicks</p>
            <p className="text-2xl font-bold">8.5K</p>
            <p className="text-xs text-emerald-600"><TrendingUp className="inline h-3 w-3 mr-1" />+8% vs last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
            <p className="text-2xl font-bold">4.47%</p>
            <p className="text-xs text-amber-600"><TrendingDown className="inline h-3 w-3 mr-1" />-0.3% vs last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cost Per Acquisition</p>
            <p className="text-2xl font-bold">$42.80</p>
            <p className="text-xs text-emerald-600"><TrendingUp className="inline h-3 w-3 mr-1" />-5% vs last period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>Journey from impression to conversion</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelSteps} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelSteps.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel Attribution Comparison</CardTitle>
            <CardDescription>How different models value each channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelAttribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="firstTouch" name="First Touch" fill="#3B82F6" />
                <Bar dataKey="lastTouch" name="Last Touch" fill="#10B981" />
                <Bar dataKey="linear" name="Linear" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Performance</CardTitle>
          <CardDescription>Revenue and cost by platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {platformData.map((p) => {
              const roas = p.spend > 0 ? p.revenue / p.spend : 0;
              const cpl = p.leads > 0 ? p.spend / p.leads : 0;
              return (
                <div key={p.platform} className="flex items-center gap-4 p-3 rounded-lg border">
                  <PlatformBadge platform={p.platform as "meta" | "google" | "tiktok" | "snapchat"} />
                  <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{p.leads}</p>
                      <p className="text-[10px] text-muted-foreground">Leads</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">${(p.revenue / 1000).toFixed(1)}K</p>
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">${roas.toFixed(1)}x</p>
                      <p className="text-[10px] text-muted-foreground">ROAS</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">${cpl.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">CPL</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
