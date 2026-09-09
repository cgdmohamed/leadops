"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Globe,
  Users,
  MousePointerClick,
  Clock,
  ExternalLink,
} from "lucide-react";

const visitorData = [
  { date: "Mon", visitors: 1240, pageViews: 3800, bounceRate: 42 },
  { date: "Tue", visitors: 1380, pageViews: 4200, bounceRate: 38 },
  { date: "Wed", visitors: 1520, pageViews: 4600, bounceRate: 35 },
  { date: "Thu", visitors: 1290, pageViews: 3900, bounceRate: 44 },
  { date: "Fri", visitors: 1650, pageViews: 5100, bounceRate: 32 },
  { date: "Sat", visitors: 980, pageViews: 2800, bounceRate: 52 },
  { date: "Sun", visitors: 870, pageViews: 2400, bounceRate: 55 },
];

const topPages = [
  { page: "/pricing", views: 2840, uniques: 1920, avgTime: "2:45", bounce: "28%" },
  { page: "/features", views: 2120, uniques: 1680, avgTime: "3:12", bounce: "32%" },
  { page: "/demo", views: 1890, uniques: 1540, avgTime: "4:05", bounce: "18%" },
  { page: "/blog/lead-gen", views: 1650, uniques: 1320, avgTime: "5:30", bounce: "42%" },
  { page: "/case-studies", views: 1420, uniques: 1180, avgTime: "3:45", bounce: "35%" },
  { page: "/signup", views: 1280, uniques: 1040, avgTime: "2:20", bounce: "22%" },
];

const deviceData = [
  { name: "Desktop", value: 58, color: "#3B82F6" },
  { name: "Mobile", value: 32, color: "#10B981" },
  { name: "Tablet", value: 10, color: "#F59E0B" },
];

const trafficSources = [
  { source: "Paid Social", visitors: 4200, conversion: 3.8 },
  { source: "Google Ads", visitors: 3100, conversion: 4.2 },
  { source: "Organic Search", visitors: 2800, conversion: 2.1 },
  { source: "Direct", visitors: 1900, conversion: 5.6 },
  { source: "Referral", visitors: 1200, conversion: 3.4 },
  { source: "Email", visitors: 800, conversion: 6.8 },
];

const realtimeMetrics = [
  { label: "Active Users", value: 47, icon: <Users className="h-4 w-4" /> },
  { label: "Page Views/min", value: 12, icon: <Globe className="h-4 w-4" /> },
  { label: "Avg Session", value: "3:24", icon: <Clock className="h-4 w-4" /> },
  { label: "Conversions Today", value: 8, icon: <MousePointerClick className="h-4 w-4" /> },
];

export default function WebsiteAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Analytics</h1>
          <p className="text-muted-foreground">GA4-style website performance metrics.</p>
        </div>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-1" /> Open GA4
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {realtimeMetrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <div className="text-muted-foreground">{m.icon}</div>
              </div>
              <p className="text-2xl font-bold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs h-7 px-3">Overview</TabsTrigger>
          <TabsTrigger value="pages" className="text-xs h-7 px-3">Top Pages</TabsTrigger>
          <TabsTrigger value="traffic" className="text-xs h-7 px-3">Traffic Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visitors & Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={visitorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visitors" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pageViews" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                        {deviceData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {deviceData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-sm">{d.name}</span>
                        <span className="text-sm font-medium ml-auto">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bounce Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={visitorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="bounceRate" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPages.map((page, i) => (
                  <div key={page.page} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50">
                    <span className="text-xs font-mono text-muted-foreground w-6 text-center">#{i + 1}</span>
                    <span className="text-sm font-medium flex-1 font-mono">{page.page}</span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{page.views.toLocaleString()} views</span>
                      <span>{page.uniques.toLocaleString()} uniques</span>
                      <span>{page.avgTime} avg</span>
                      <Badge variant="outline" className="text-[10px]">{page.bounce} bounce</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trafficSources.map((source) => (
                  <div key={source.source} className="flex items-center gap-3 p-2.5 rounded-lg border">
                    <span className="text-sm font-medium flex-1">{source.source}</span>
                    <span className="text-sm text-muted-foreground">{source.visitors.toLocaleString()} visitors</span>
                    <Badge variant="secondary" className="text-[10px]">{source.conversion}% conv</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
