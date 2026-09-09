import type { Platform } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/components/platform-icons";

const platformConfig: Record<Platform, { label: string; color: string; bg: string }> = {
  meta: { label: "Meta", color: "text-[#1877F2]", bg: "bg-[#1877F2]/10" },
  google: { label: "Google", color: "text-[#4285F4]", bg: "bg-[#4285F4]/10" },
  tiktok: { label: "TikTok", color: "text-foreground", bg: "bg-foreground/10" },
  snapchat: { label: "Snapchat", color: "text-yellow-600", bg: "bg-[#FFFC00]/15" },
};

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
  showIcon?: boolean;
}

export function PlatformBadge({ platform, className, showIcon = true }: PlatformBadgeProps) {
  const config = platformConfig[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.color,
        className
      )}
    >
      {showIcon && <PlatformIcon platform={platform} className="h-3 w-3" />}
      {config.label}
    </span>
  );
}

const platformDotColor: Record<Platform, string> = {
  meta: "bg-[#1877F2]",
  google: "bg-[#4285F4]",
  tiktok: "bg-foreground",
  snapchat: "bg-[#FFFC00]",
};

export function PlatformDot({ platform }: { platform: Platform }) {
  return (
    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", platformDotColor[platform])} />
  );
}
