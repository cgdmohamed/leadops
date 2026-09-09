"use client";

interface FunnelStage {
  label: string;
  volume: number;
  conversionRate: number;
  dropOff: number;
  costPerStage: number;
  color: string;
}

interface GrowthFunnelProps {
  stages: FunnelStage[];
}

export function GrowthFunnel({ stages }: GrowthFunnelProps) {
  const maxVolume = Math.max(...stages.map((s) => s.volume), 1);

  return (
    <div className="space-y-1">
      {stages.map((stage, i) => {
        const width = Math.max((stage.volume / maxVolume) * 100, 8);
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="w-28 text-right shrink-0">
              <p className="text-xs font-medium text-foreground">{stage.label}</p>
              <p className="text-[10px] text-muted-foreground">{stage.volume.toLocaleString()}</p>
            </div>
            <div className="flex-1 relative">
              <div
                className={`h-7 ${stage.color} rounded-r-md flex items-center justify-end pr-2 transition-all duration-300`}
                style={{ width: `${width}%` }}
              >
                {stage.volume > 0 && (
                  <span className="text-[10px] font-medium text-white drop-shadow-sm">
                    {stage.volume.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="w-24 shrink-0 text-right">
              {i > 0 && stage.conversionRate > 0 ? (
                <>
                  <p className="text-[10px] text-success font-medium">{stage.conversionRate}% conv.</p>
                  <p className="text-[10px] text-destructive">{stage.dropOff}% drop</p>
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground">{stage.costPerStage > 0 ? `$${stage.costPerStage.toFixed(0)}/ea` : "—"}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
