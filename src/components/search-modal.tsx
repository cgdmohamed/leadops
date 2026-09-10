"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRecords } from "@/lib/use-records";
import { PlatformIcon } from "@/components/platform-icons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Users, Megaphone, ArrowRight } from "lucide-react";
import type { Platform } from "@/lib/types";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const { items: leadRecords } = useRecords<Record<string, unknown>>("leads");
  const { items: campaignRecords } = useRecords<Record<string, unknown>>("campaigns");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
        if (open) setQuery("");
      }
      if (e.key === "Escape") {
        onOpenChange(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const q = query.trim().toLowerCase();
  const str = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
  const results = q.length > 0 ? [
    ...leadRecords
      .filter(
        (record) => {
          const lead = record.data;
          return str(lead.name).toLowerCase().includes(q) ||
            str(lead.email).toLowerCase().includes(q) ||
            str(lead.company).toLowerCase().includes(q);
        }
      )
      .slice(0, 5)
      .map((record) => ({
        id: record.id,
        type: "lead" as const,
        title: str(record.data.name, "Untitled lead"),
        subtitle: str(record.data.email),
        platform: str(record.data.platform, "meta") as Platform,
        href: `/leads/${record.id}`,
      })),
    ...campaignRecords
      .filter((record) => str(record.data.name).toLowerCase().includes(q))
      .slice(0, 3)
      .map((record) => ({
        id: record.id,
        type: "campaign" as const,
        title: str(record.data.name, "Untitled campaign"),
        subtitle: `${str(record.data.platform)} · ${str(record.data.status)}`,
        platform: str(record.data.platform, "meta") as Platform,
        href: `/campaigns/${record.id}`,
      })),
  ] : [];

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setQuery("");
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 max-w-lg gap-0 overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search leads, campaigns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {query.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type to search across leads and campaigns...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.href)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    {result.type === "lead" ? (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PlatformIcon platform={result.platform} className="h-3.5 w-3.5 text-muted-foreground" />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
