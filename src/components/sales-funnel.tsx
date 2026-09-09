"use client";

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface SalesFunnelProps {
  stages: FunnelStage[];
}

export function SalesFunnel({ stages }: SalesFunnelProps) {
  const totalHeight = stages.length * 44;
  const maxWidth = 220;
  const minWidth = 60;

  return (
    <div className="flex items-center gap-6">
      <div className="flex-1">
        <svg
          viewBox={`0 0 ${maxWidth} ${totalHeight}`}
          className="w-full"
          style={{ maxHeight: "220px" }}
        >
          {stages.map((stage, index) => {
            const progress = index / (stages.length - 1 || 1);
            const nextProgress = (index + 1) / (stages.length - 1 || 1);

            const topWidth = maxWidth - (maxWidth - minWidth) * progress;
            const bottomWidth = index < stages.length - 1
              ? maxWidth - (maxWidth - minWidth) * nextProgress
              : minWidth;

            const topX = (maxWidth - topWidth) / 2;
            const bottomX = (maxWidth - bottomWidth) / 2;
            const y = index * 44;
            const height = 40;
            const gap = 2;

            const path = `
              M ${topX} ${y + gap}
              L ${topX + topWidth} ${y + gap}
              L ${bottomX + bottomWidth} ${y + height}
              L ${bottomX} ${y + height}
              Z
            `;

            return (
              <g key={stage.label}>
                <path d={path} fill={stage.color} />
                <text
                  x={maxWidth / 2}
                  y={y + height / 2 + gap + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="600"
                >
                  {stage.value.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="w-32 space-y-0">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center justify-between text-sm h-[44px]">
            <span className="text-muted-foreground">{stage.label}</span>
            <span className="font-medium">{stage.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
