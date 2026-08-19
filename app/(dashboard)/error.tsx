"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("Dashboard render failed", error)
  }, [error])

  return (
    <main className="grid min-h-[60vh] place-items-center p-4 md:p-6">
      <Card className="w-full max-w-md" role="alert" aria-labelledby="dashboard-error-title">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true">
            <AlertTriangle className="size-5" />
          </span>
          <CardTitle id="dashboard-error-title">We couldn&apos;t load your dashboard</CardTitle>
          <CardDescription>Your data is safe. This is usually a temporary connection issue.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={reset}><RefreshCw aria-hidden="true" />Try again</Button>
        </CardContent>
      </Card>
    </main>
  )
}
