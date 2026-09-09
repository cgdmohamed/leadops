"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRange = {
  label: string;
  from: Date;
  to: Date;
};

export type CompareOption = "none" | "previous_period" | "previous_year";

const presets: { label: string; value: string }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7" },
  { label: "Last 30 Days", value: "last_30" },
  { label: "This Month", value: "this_month" },
  { label: "Previous Month", value: "prev_month" },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This Year", value: "this_year" },
];

function getDateRange(value: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (value) {
    case "today":
      return { label: "Today", from: today, to: now };
    case "yesterday": {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      return { label: "Yesterday", from: d, to: d };
    }
    case "last_7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { label: "Last 7 Days", from, to: now };
    }
    case "last_30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { label: "Last 30 Days", from, to: now };
    }
    case "this_month":
      return { label: "This Month", from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "prev_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { label: "Previous Month", from, to };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return { label: "This Quarter", from: new Date(now.getFullYear(), q * 3, 1), to: now };
    }
    case "this_year":
      return { label: "This Year", from: new Date(now.getFullYear(), 0, 1), to: now };
    default:
      return { label: "Last 30 Days", from: new Date(today.getTime() - 29 * 86400000), to: now };
  }
}

interface GlobalDateFilterProps {
  value: string;
  onChange: (value: string) => void;
  compare?: CompareOption;
  onCompareChange?: (value: CompareOption) => void;
}

export function GlobalDateFilter({ value, onChange, compare = "none", onCompareChange }: GlobalDateFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
        {presets.slice(0, 5).map((p) => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              value === p.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
        <Select value={value} onValueChange={(v) => v && onChange(v)}>
          <SelectTrigger className="h-7 w-auto border-0 bg-transparent text-xs px-2 data-[placeholder]:text-muted-foreground">
            <SelectValue placeholder="More..." />
          </SelectTrigger>
          <SelectContent>
            {presets.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onCompareChange && (
        <Select value={compare} onValueChange={(v) => v && onCompareChange(v as CompareOption)}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No comparison</SelectItem>
            <SelectItem value="previous_period">vs Previous Period</SelectItem>
            <SelectItem value="previous_year">vs Previous Year</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export { getDateRange, presets };
