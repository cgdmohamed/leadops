"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Megaphone,
  UserCog,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  X,
  TrendingUp,
  Globe,
  MessageSquare,
  FileText,
  Target,
  RefreshCw,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SearchModal } from "@/components/search-modal";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { clientApi } from "@/lib/client-api";
import { toast } from "sonner";
import type { User, Workspace } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const crmItems = [
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/pipeline/analytics", label: "Opportunities", icon: TrendingUp },
];

const marketingItems = [
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/attribution", label: "Attribution", icon: BarChart3 },
  { href: "/website-analytics", label: "Website Analytics", icon: Globe },
  { href: "/social-comments", label: "Social Comments", icon: MessageSquare },
];

const operationsItems = [
  { href: "/lead-assignment", label: "Lead Assignment", icon: Target },
  { href: "/saved-views", label: "Saved Views", icon: Layers },
  { href: "/goals", label: "Goals & Targets", icon: Target },
];

const dataItems = [
  { href: "/data-sync", label: "Data Sync", icon: RefreshCw },
];

const bottomItems = [
  { href: "/team", label: "Team", icon: UserCog },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: User;
  workspaces: Workspace[];
}

export function Sidebar({ user, workspaces }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const navContent = (
    <>
      <div className={cn("flex items-center px-6 py-5", collapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <BarChart3 className="h-4 w-4" />
          </div>
          {!collapsed && <span className="text-lg font-semibold tracking-tight">LeadOps</span>}
        </div>
        {!collapsed && (
          <button
            className="lg:hidden rounded-md p-1.5 hover:bg-muted"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Separator />

      {!collapsed && (
        <button
          onClick={() => setSearchOpen(true)}
          className="mx-3 mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors w-[calc(100%-1.5rem)]"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
          </svg>
          Search...
          <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}

      <div className={cn("px-3 mt-3", collapsed && "px-2")}>
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspace={user.activeWorkspace}
          onSwitch={async (id) => {
            try {
              await clientApi('/api/workspaces', { method: 'PATCH', body: JSON.stringify({ workspaceId: id }) });
              window.location.reload();
            } catch (error) { toast.error((error as Error).message); }
          }}
          onAdd={async (ws) => {
            await clientApi('/api/workspaces', { method: 'POST', body: JSON.stringify({ name: ws.name, currency: ws.currency, timezone: ws.timezone || 'UTC' }) });
            router.refresh();
          }}
          onUpdate={async (ws) => {
            await clientApi('/api/settings', { method: 'PATCH', body: JSON.stringify({ name: ws.name, currency: ws.currency, timezone: ws.timezone || 'UTC' }) });
            window.location.reload();
          }}
          onDelete={async (id) => {
            await clientApi('/api/workspaces', { method: 'DELETE', body: JSON.stringify({ workspaceId: id }) });
            window.location.reload();
          }}
          collapsed={collapsed}
        />
      </div>

      <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
        {/* Dashboard */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}

        <Separator className="my-1" />

        {/* CRM Group */}
        <div>
          {!collapsed && <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">CRM</p>}
          {crmItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ))}
        </div>

        {/* Marketing Group */}
        <div>
          {!collapsed && <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Marketing</p>}
          {marketingItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ))}
        </div>

        {/* Operations Group */}
        <div>
          {!collapsed && <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Operations</p>}
          {operationsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ))}
        </div>

        <Separator className="my-1" />

        {/* Reports */}
        <Link
          href="/reports"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            collapsed && "justify-center px-2",
            pathname === "/reports"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={collapsed ? "Reports" : undefined}
        >
          <FileText className="h-4 w-4 shrink-0" />
          {!collapsed && "Reports"}
        </Link>

        <Separator className="my-1" />

        {/* Data Group */}
        <div>
          {!collapsed && <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Data</p>}
          {dataItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ))}
        </div>

        <Separator className="my-1" />

        {/* Team + Settings */}
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>
      <Separator />

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 my-2 flex items-center justify-center rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4 mr-2" />
            <span>Collapse</span>
          </>
        )}
      </button>

      <div className="p-3">
        <div className={cn("flex items-center gap-3 rounded-md px-3 py-2", collapsed && "justify-center px-0")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {user.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      <button
        className="fixed top-4 left-4 z-50 lg:hidden rounded-md p-2 bg-card border shadow-sm hover:bg-muted"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border bg-card flex flex-col transition-all duration-200",
          collapsed ? "w-16" : "w-64",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
