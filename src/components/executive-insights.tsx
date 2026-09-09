"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, AlertCircle, Zap, Info } from "lucide-react";

type Severity = "positive" | "opportunity" | "warning" | "critical";

interface Insight {
  severity: Severity;
  title: string;
  description: string;
  metric?: string;
}

const severityConfig: Record<Severity, { icon: typeof TrendingUp; color: string; bgColor: string; borderColor: string; label: string }> = {
  positive: { icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", label: "Positive" },
  opportunity: { icon: Zap, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", label: "Opportunity" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200", label: "Warning" },
  critical: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200", label: "Critical" },
};

const demoInsights: Insight[] = [
  {
    severity: "opportunity",
    title: "Google Search outperforming",
    description: "Google Search generated 38% of total revenue from 24% of ad spend. Consider increasing budget allocation.",
    metric: "+38% revenue",
  },
  {
    severity: "warning",
    title: "Meta qualification rate dropping",
    description: "Meta lead volume increased 12%, but qualification rate dropped by 18% compared to last month.",
    metric: "-18% qual rate",
  },
  {
    severity: "critical",
    title: "12 leads exceeded SLA",
    description: "12 new leads have not been contacted within the 15-minute first response SLA.",
    metric: "12 breached",
  },
  {
    severity: "positive",
    title: "Revenue above target",
    description: "Revenue is 14% above the previous period. Won deals increased by 8 this month.",
    metric: "+14% revenue",
  },
];

interface ExecutiveInsightsProps {
  insights?: Insight[];
}

export function ExecutiveInsights({ insights = demoInsights }: ExecutiveInsightsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          Executive Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight, i) => {
          const config = severityConfig[insight.severity];
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={`flex gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
            >
              <div className={`mt-0.5 shrink-0 ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 ${config.color} border-current`}>
                    {config.label}
                  </Badge>
                  {insight.metric && (
                    <span className={`text-[10px] font-medium ${config.color}`}>{insight.metric}</span>
                  )}
                </div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
              </div>
            </div>
          );
        })}
        <div className="pt-2 border-t">
          <p className="text-[10px] text-muted-foreground text-center">AI-powered insights coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
