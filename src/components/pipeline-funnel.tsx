"use client";

interface FunnelStage {
  label: string;
  count: number;
  value: number;
  color: string;
}

interface PipelineFunnelProps {
  stages: FunnelStage[];
}

export function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col items-center gap-1">
      {stages.map((stage, i) => {
        const width = Math.max((stage.count / maxCount) * 100, 15);
        const convRate = stages[i - 1] && stages[i - 1].count > 0
          ? Math.round((stage.count / stages[i - 1].count) * 100)
          : 100;

        return (
          <div key={stage.label} className="flex items-center gap-3 w-full">
            <div className="flex-1 flex justify-center">
              <div
                className={`h-8 ${stage.color} rounded-md flex items-center justify-center transition-all duration-300`}
                style={{ width: `${width}%`, minWidth: "60px" }}
              >
                <span className="text-xs font-medium text-white drop-shadow-sm">
                  {stage.count}
                </span>
              </div>
            </div>
            <div className="w-24 text-right">
              <p className="text-xs text-muted-foreground">{stage.label}</p>
              {i > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {convRate}% conv.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
