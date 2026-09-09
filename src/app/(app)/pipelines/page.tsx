"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

export default function PipelinesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Pipeline Settings Moved</CardTitle>
          <CardDescription>
            Pipeline configuration is now available under Settings &gt; Pipelines.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push("/settings")}>
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
