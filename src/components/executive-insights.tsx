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

interface ExecutiveInsightsProps {
  insights?: Insight[];
}

export function ExecutiveInsights({ insights = [] }: ExecutiveInsightsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          Executive Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No insights yet</p>
            <p className="text-xs mt-1">Insights will appear after enough real campaign and lead data is available.</p>
          </div>
        ) : null}
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
