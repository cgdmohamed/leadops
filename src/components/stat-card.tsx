import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, change, changeLabel, icon, className }: StatCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="flex items-center text-xs text-muted-foreground mt-1">
            {change >= 0 ? (
              <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
            ) : (
              <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
            )}
            <span className={change >= 0 ? "text-success" : "text-destructive"}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">{changeLabel || "vs last period"}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
