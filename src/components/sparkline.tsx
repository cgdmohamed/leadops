"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "#2563EB", height = 40 }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.1}
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
