import {
  Search, Users, Megaphone, Target, FileText, MessageSquare,
  Layers, BarChart3, RefreshCw, Settings, AlertTriangle, CheckCircle,
  Clock, Inbox, UserPlus, GitBranch, Globe, StickyNote, ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmptyStateType =
  | "leads" | "campaigns" | "search" | "general" | "opportunities"
  | "pipeline" | "reports" | "comments" | "views" | "goals"
  | "sync" | "settings" | "activity" | "tasks" | "notes"
  | "team" | "analytics" | "error" | "empty" | "loading";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
}

const configs: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  leads: { icon: <Users className="h-8 w-8 text-muted-foreground/40" />, title: "No leads found", description: "Try adjusting your filters or create a new lead." },
  campaigns: { icon: <Megaphone className="h-8 w-8 text-muted-foreground/40" />, title: "No campaigns yet", description: "Create your first campaign to start tracking performance." },
  search: { icon: <Search className="h-8 w-8 text-muted-foreground/40" />, title: "No results", description: "Try a different search term or adjust your filters." },
  general: { icon: <Inbox className="h-8 w-8 text-muted-foreground/40" />, title: "Nothing here yet", description: "Check back later or take action to get started." },
  opportunities: { icon: <Target className="h-8 w-8 text-muted-foreground/40" />, title: "No opportunities yet", description: "Convert qualified leads to opportunities to track your pipeline." },
  pipeline: { icon: <GitBranch className="h-8 w-8 text-muted-foreground/40" />, title: "Pipeline is empty", description: "Add leads to your pipeline to start tracking deals." },
  reports: { icon: <FileText className="h-8 w-8 text-muted-foreground/40" />, title: "No reports generated", description: "Generate your first report to analyze performance." },
  comments: { icon: <MessageSquare className="h-8 w-8 text-muted-foreground/40" />, title: "No comments yet", description: "Comments from your ad campaigns will appear here." },
  views: { icon: <Layers className="h-8 w-8 text-muted-foreground/40" />, title: "No saved views", description: "Save your favorite filter combinations for quick access." },
  goals: { icon: <BarChart3 className="h-8 w-8 text-muted-foreground/40" />, title: "No goals configured", description: "Set targets to track your team's performance." },
  sync: { icon: <RefreshCw className="h-8 w-8 text-muted-foreground/40" />, title: "No sync history", description: "Connect a platform to start syncing data." },
  settings: { icon: <Settings className="h-8 w-8 text-muted-foreground/40" />, title: "No settings configured", description: "Configure your workspace to get started." },
  activity: { icon: <Clock className="h-8 w-8 text-muted-foreground/40" />, title: "No activity yet", description: "Activity will appear here as your team works." },
  tasks: { icon: <ListTodo className="h-8 w-8 text-muted-foreground/40" />, title: "No tasks", description: "Create tasks to follow up with leads." },
  notes: { icon: <StickyNote className="h-8 w-8 text-muted-foreground/40" />, title: "No notes", description: "Add notes to keep track of important details." },
  team: { icon: <UserPlus className="h-8 w-8 text-muted-foreground/40" />, title: "No team members", description: "Invite team members to collaborate." },
  analytics: { icon: <BarChart3 className="h-8 w-8 text-muted-foreground/40" />, title: "No analytics data", description: "Data will appear here once campaigns are running." },
  error: { icon: <AlertTriangle className="h-8 w-8 text-red-400" />, title: "Something went wrong", description: "An error occurred while loading data." },
  empty: { icon: <Inbox className="h-8 w-8 text-muted-foreground/40" />, title: "Nothing here", description: "This area is empty." },
  loading: { icon: <Clock className="h-8 w-8 text-muted-foreground/40 animate-pulse" />, title: "Loading...", description: "Please wait while we load your data." },
};

export function EmptyState({ type, title, description, action, icon, compact }: EmptyStateProps) {
  const c = configs[type];

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        {icon || c.icon}
        <h3 className="mt-3 text-sm font-medium">{title || c.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description || c.description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon || c.icon}
      <h3 className="mt-4 text-base font-medium">{title || c.title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{description || c.description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      type="error"
      title="Something went wrong"
      description={message || "An error occurred while loading data. Please try again."}
      action={onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
        </Button>
      ) : undefined}
    />
  );
}

export function LoadingState({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="mt-3 text-sm text-muted-foreground">{text || "Loading..."}</p>
    </div>
  );
}
