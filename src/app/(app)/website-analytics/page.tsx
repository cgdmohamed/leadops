"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink } from "lucide-react";

export default function WebsiteAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Analytics</h1>
          <p className="text-muted-foreground">Website metrics will appear after a real analytics source is connected.</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <ExternalLink className="h-4 w-4 mr-1" /> Open Analytics
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">No Analytics Source Connected</CardTitle>
          <CardDescription>
            Connect GA4 or another website analytics provider before showing visitors, top pages, devices, and traffic sources.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Globe className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No website analytics available</p>
          <p className="text-xs mt-1 max-w-sm">This page no longer displays placeholder traffic metrics.</p>
        </CardContent>
      </Card>
    </div>
  );
}
