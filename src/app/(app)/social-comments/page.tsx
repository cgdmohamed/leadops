"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SocialCommentsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Comments</h1>
          <p className="text-muted-foreground">Monitor comments once social comment sync is connected.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/data-sync")}>
          <RefreshCw className="h-4 w-4 mr-1" /> Configure Sync
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">No Comments Synced</CardTitle>
          <CardDescription>
            Social comment ingestion is not connected yet. Connect a platform and add comment sync before showing live comments here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No social comments available</p>
          <p className="text-xs mt-1 max-w-sm">This page is ready for real data and no longer displays sample comments.</p>
        </CardContent>
      </Card>
    </div>
  );
}
