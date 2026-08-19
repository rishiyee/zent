import Link from "next/link"
import { ArrowRight, Check, Circle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ChecklistStep = {
  title: string
  description: string
  href: string
  action: string
  complete: boolean
}

export function GetStartedChecklist({
  hasAccount,
  hasTransaction,
  hasCategorizedTransaction,
}: {
  hasAccount: boolean
  hasTransaction: boolean
  hasCategorizedTransaction: boolean
}) {
  const steps: ChecklistStep[] = [
    {
      title: "Add your first account",
      description: "Create a bank, cash, credit, or investment account to establish your starting balance.",
      href: "/accounts",
      action: "Go to accounts",
      complete: hasAccount,
    },
    {
      title: "Record a transaction",
      description: "Add income or an expense so Zent can begin showing your cash flow.",
      href: "/transactions",
      action: "Add a transaction",
      complete: hasTransaction,
    },
    {
      title: "Categorize your spending",
      description: "Assign a category to a transaction to unlock useful reports and spending insights.",
      href: hasTransaction ? "/transactions" : "/categories",
      action: hasTransaction ? "Review transactions" : "View categories",
      complete: hasCategorizedTransaction,
    },
  ]
  const completed = steps.filter((step) => step.complete).length

  if (completed === steps.length) return null

  return (
    <Card aria-labelledby="get-started-title" className="border-primary/20 bg-linear-to-br from-primary/8 via-card to-card">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle id="get-started-title">Get started with Zent</CardTitle>
            <CardDescription className="mt-1">Complete these essentials to build your financial overview.</CardDescription>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums" aria-label={`${completed} of ${steps.length} steps complete`}>
            {completed}/{steps.length}
          </span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={completed}
        >
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(completed / steps.length) * 100}%` }} />
        </div>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-2 lg:grid-cols-3">
          {steps.map((step) => (
            <li key={step.title} className={cn("flex min-w-0 flex-col rounded-lg border bg-background/70 p-4", step.complete && "bg-muted/40 text-muted-foreground")}>
              <div className="flex items-start gap-3">
                {step.complete ? (
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Complete"><Check className="size-3.5" /></span>
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <h3 className={cn("font-medium", step.complete && "line-through")}>{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {!step.complete && (
                <Button variant="link" className="mt-2 h-auto self-start p-0" render={<Link href={step.href} />}>
                  {step.action}<ArrowRight aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
