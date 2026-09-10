"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FileText, Download, BarChart3, TrendingUp, Users, DollarSign, ArrowUpDown, Plus, Calendar, Send, Inbox, Loader2 } from "lucide-react";
import { useRecords } from "@/lib/use-records";

interface ReportData {
  [key: string]: unknown;
  name: string;
  description?: string;
  category: string;
  format: string;
  dateRange?: string;
  recipients?: string;
  scheduled?: boolean;
}

const templates = [
  { id: "revenue", name: "Revenue Summary", description: "Revenue breakdown by platform and campaign", icon: DollarSign, format: ["PDF", "CSV", "Excel"], category: "Financial" },
  { id: "pipeline", name: "Lead Pipeline Report", description: "Current pipeline status with conversion rates", icon: Users, format: ["PDF", "CSV"], category: "Pipeline" },
  { id: "campaigns", name: "Campaign Performance", description: "Detailed metrics for synced campaigns", icon: BarChart3, format: ["PDF", "CSV", "Excel"], category: "Campaigns" },
  { id: "roi", name: "ROI Analysis", description: "Return on investment across connected channels", icon: TrendingUp, format: ["PDF", "Excel"], category: "Financial" },
  { id: "team", name: "Team Activity", description: "Agent performance and activity logs", icon: Users, format: ["PDF", "CSV"], category: "Team" },
  { id: "attribution", name: "Attribution Report", description: "Multi-touch attribution analysis", icon: ArrowUpDown, format: ["PDF"], category: "Analytics" },
];

export default function ReportsPage() {
  const { items, loading, create } = useRecords<ReportData>("reports");
  const [activeTab, setActiveTab] = useState("available");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({ name: "", dateRange: "", format: "PDF", recipients: "" });

  const scheduledReports = useMemo(() => items.filter((report) => report.data.scheduled), [items]);

  const handleGenerate = (name: string) => {
    toast.info(`${name} export needs a report worker before files can be generated.`);
  };

  const handleDownload = (name: string) => {
    toast.info(`${name} has no generated file yet.`);
  };

  const handleSchedule = (name: string) => {
    toast.info(`Scheduling UI is ready for ${name}; backend schedule execution is not enabled yet.`);
  };

  const handleCreateReport = async () => {
    if (!newReport.name.trim()) return;
    try {
      await create({
        name: newReport.name.trim(),
        description: `Custom report - ${newReport.dateRange || "All time"}`,
        category: "Custom",
        format: newReport.format,
        dateRange: newReport.dateRange.trim() || undefined,
        recipients: newReport.recipients.trim() || undefined,
        scheduled: Boolean(newReport.recipients.trim()),
      });
      setNewReport({ name: "", dateRange: "", format: "PDF", recipients: "" });
      setDialogOpen(false);
      toast.success("Report saved");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Create report definitions from real workspace data.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saved Reports</p>
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-xs text-muted-foreground">Workspace definitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Scheduled Reports</p>
            <p className="text-2xl font-bold">{scheduledReports.length}</p>
            <p className="text-xs text-muted-foreground">Pending scheduler backend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Generated Files</p>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">No export worker configured</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="available">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4 mt-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading reports...
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {template.format.map((format) => <Badge key={format} variant="secondary" className="text-[10px]">{format}</Badge>)}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerate(template.name)} className="flex-1">
                        <FileText className="h-4 w-4 mr-1" /> Generate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(template.name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSchedule(template.name)}>
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scheduled Reports</CardTitle>
              <CardDescription>Saved reports with recipients configured</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Send className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No scheduled reports yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create a report with recipients to list it here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{report.data.name}</p>
                        <p className="text-xs text-muted-foreground">{report.data.recipients}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{report.data.format}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report History</CardTitle>
              <CardDescription>Previously generated report files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No generated files yet</p>
                <p className="text-xs text-muted-foreground mt-1">Generated files will appear after an export worker is configured.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Report</DialogTitle>
            <DialogDescription>Save a report definition for this workspace.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Name</label>
              <Input value={newReport.name} onChange={(e) => setNewReport((prev) => ({ ...prev, name: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Input value={newReport.dateRange} onChange={(e) => setNewReport((prev) => ({ ...prev, dateRange: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={newReport.format} onValueChange={(v) => v && setNewReport((prev) => ({ ...prev, format: v }))}>
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
              <label className="text-sm font-medium">Recipients</label>
              <Input value={newReport.recipients} onChange={(e) => setNewReport((prev) => ({ ...prev, recipients: e.target.value }))} />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button onClick={handleCreateReport}>Save Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
