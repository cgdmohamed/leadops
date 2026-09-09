"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  FileSpreadsheet,
  FileImage,
  Clock,
  ArrowUpDown,
  Plus,
  Calendar,
  Share2,
  Send,
  Inbox,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  lastGenerated: string;
  format: string[];
  category: string;
}

const initialReports: Report[] = [
  { id: "r1", name: "Revenue Summary", description: "Monthly revenue breakdown by platform and campaign", icon: <DollarSign className="h-5 w-5" />, lastGenerated: "Sep 1, 2026", format: ["PDF", "CSV", "Excel"], category: "Financial" },
  { id: "r2", name: "Lead Pipeline Report", description: "Current pipeline status with conversion rates", icon: <Users className="h-5 w-5" />, lastGenerated: "Sep 8, 2026", format: ["PDF", "CSV"], category: "Pipeline" },
  { id: "r3", name: "Campaign Performance", description: "Detailed metrics for all active campaigns", icon: <BarChart3 className="h-5 w-5" />, lastGenerated: "Sep 8, 2026", format: ["PDF", "CSV", "Excel"], category: "Campaigns" },
  { id: "r4", name: "ROI Analysis", description: "Return on investment across all channels", icon: <TrendingUp className="h-5 w-5" />, lastGenerated: "Sep 1, 2026", format: ["PDF", "Excel"], category: "Financial" },
  { id: "r5", name: "Team Activity", description: "Agent performance and activity logs", icon: <Users className="h-5 w-5" />, lastGenerated: "Sep 8, 2026", format: ["PDF", "CSV"], category: "Team" },
  { id: "r6", name: "Attribution Report", description: "Multi-touch attribution analysis", icon: <ArrowUpDown className="h-5 w-5" />, lastGenerated: "Aug 31, 2026", format: ["PDF"], category: "Analytics" },
];

const scheduledReports = [
  { name: "Weekly Revenue Summary", frequency: "Every Monday 9:00 AM", recipients: "sarah@leadops.io, james@leadops.io", format: "PDF", active: true },
  { name: "Monthly Campaign Report", frequency: "1st of month", recipients: "sarah@leadops.io", format: "Excel", active: true },
  { name: "Daily Pipeline Digest", frequency: "Daily 8:00 AM", recipients: "james@leadops.io", format: "PDF", active: false },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [activeTab, setActiveTab] = useState("available");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: "",
    dateRange: "",
    format: "PDF",
    recipients: "",
  });

  const handleGenerate = (id: string) => {
    setGenerating(id);
    toast.info("Generating report...");
    setTimeout(() => {
      setGenerating(null);
      toast.success("Report generated and ready for download");
    }, 2000);
  };

  const handleDownload = (name: string) => {
    toast.info(`Downloading ${name}...`);
  };

  const handleSchedule = (name: string) => {
    toast.info(`Schedule settings for ${name} opened`);
  };

  const handleShare = (name: string) => {
    toast.info(`Share dialog for ${name} opened`);
  };

  const handleCreateReport = () => {
    if (!newReport.name.trim()) return;
    const report: Report = {
      id: Date.now().toString(),
      name: newReport.name,
      description: `Custom report - ${newReport.dateRange || "All time"}`,
      icon: <FileText className="h-5 w-5" />,
      lastGenerated: "Not yet generated",
      format: [newReport.format],
      category: "Custom",
    };
    setReports((prev) => [...prev, report]);
    setNewReport({ name: "", dateRange: "", format: "PDF", recipients: "" });
    setDialogOpen(false);
    toast.success("Report created successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and schedule reports.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Reports Generated</p>
            <p className="text-2xl font-bold">47</p>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Scheduled Reports</p>
            <p className="text-2xl font-bold">{scheduledReports.filter((r) => r.active).length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Last Generated</p>
            <p className="text-2xl font-bold">Today</p>
            <p className="text-xs text-muted-foreground">Campaign Performance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => v && setActiveTab(v)}>
        <TabsList variant="line">
          <TabsTrigger value="available">Available Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Reports</CardTitle>
              <CardDescription>Click to generate or download</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No reports yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first report to get started.</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      {report.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{report.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{report.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Last: {report.lastGenerated}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-1">
                        {report.format.map((f) => (
                          <Badge key={f} variant="outline" className="text-[10px]">
                            {f === "PDF" ? <FileText className="h-3 w-3 mr-0.5" /> : f === "CSV" ? <FileSpreadsheet className="h-3 w-3 mr-0.5" /> : <FileImage className="h-3 w-3 mr-0.5" />}
                            {f}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleGenerate(report.id)}
                          disabled={generating === report.id}
                        >
                          {generating === report.id ? "Generating..." : <><Send className="h-3.5 w-3.5 mr-1" /> Generate</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleDownload(report.name)}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleSchedule(report.name)}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleShare(report.name)}
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scheduled Reports</CardTitle>
              <CardDescription>Automated report delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduledReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No scheduled reports</p>
                  <p className="text-xs text-muted-foreground mt-1">Schedule a report to automate delivery.</p>
                </div>
              ) : (
                scheduledReports.map((report, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground">{report.frequency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{report.format}</Badge>
                      <Badge variant={report.active ? "secondary" : "outline"} className="text-[10px]">
                        {report.active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report History</CardTitle>
              <CardDescription>Previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No history yet</p>
                <p className="text-xs text-muted-foreground mt-1">Generated reports will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Report</DialogTitle>
            <DialogDescription>Configure a new custom report.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Name</label>
              <Input
                placeholder="e.g. Q3 Sales Summary"
                value={newReport.name}
                onChange={(e) => setNewReport((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Input
                type="text"
                placeholder="e.g. Jul 1 - Sep 30, 2026"
                value={newReport.dateRange}
                onChange={(e) => setNewReport((prev) => ({ ...prev, dateRange: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select
                value={newReport.format}
                onValueChange={(v) => v && setNewReport((prev) => ({ ...prev, format: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Recipients <span className="text-muted-foreground font-normal">(email, comma-separated)</span>
              </label>
              <Input
                placeholder="e.g. team@leadops.io, manager@leadops.io"
                value={newReport.recipients}
                onChange={(e) => setNewReport((prev) => ({ ...prev, recipients: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button onClick={handleCreateReport}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
