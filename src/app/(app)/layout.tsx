import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { db } from "@/lib/server/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const workspaces = (await db().query('SELECT w.id,w.name,w.currency,w.timezone FROM workspaces w JOIN memberships m ON m.workspace_id=w.id WHERE m.user_id=$1 ORDER BY w.created_at', [session.id])).rows;
  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <Sidebar user={session} workspaces={workspaces} />
        <main className="flex-1 ml-64">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
