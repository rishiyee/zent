"use client"

import * as React from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Account, netWorthSummary } from "@/lib/accounts"
import { Transaction } from "@/lib/transactions"
import { useCurrency } from "@/components/currency-provider"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function AnimatedValue({
  value,
  format,
}: {
  value: number
  format: (value: number) => string
}) {
  const [displayedValue, setDisplayedValue] = React.useState(value)
  const displayedValueRef = React.useRef(value)
  const isFirstRender = React.useRef(true)

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayedValueRef.current = value
      const frame = window.requestAnimationFrame(() => setDisplayedValue(value))
      return () => window.cancelAnimationFrame(frame)
    }

    const startValue = displayedValueRef.current
    const startTime = performance.now()
    const duration = 450
    let frame = 0

    const tick = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = startValue + (value - startValue) * eased
      displayedValueRef.current = nextValue
      setDisplayedValue(nextValue)

      if (progress < 1) frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [value])

  return <span aria-live="polite">{format(displayedValue)}</span>
}

export function SummaryCards({
  transactions,
  accounts = [],
}: {
  transactions: Transaction[]
  accounts?: Account[]
}) {
  const { format } = useCurrency()
  const income = transactions
    .filter((t) => t.type === "income" && !t.linkedPaymentId)
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "expense" && !t.linkedPaymentId)
    .reduce((sum, t) => sum + t.amount, 0)

  // Cash balance only counts transactions against asset accounts (checking,
  // savings, investment, untracked cash) — a credit card purchase doesn't move
  // cash until the bill is paid, so it's excluded here even though it counts as
  // spending above. The later "Credit card payment" transaction (an asset-account
  // expense) is what actually reduces cash, so it's included here even though the
  // Expenses total above skips it to avoid double-counting the original purchase.
  const accountSummary = netWorthSummary(accounts)
  const hasAccountBalances = accounts.length > 0
  const headlineValue = hasAccountBalances
    ? accountSummary.netWorth
    : income - expenses
  const needsReview = transactions.filter(
    (t) => t.status === "needs-review"
  ).length
  const pending = transactions.filter((t) => t.status === "pending").length

  const cards = [
    {
      label: hasAccountBalances ? "Net Worth" : "Net Cash Flow",
      value: headlineValue,
      format,
      trend: "+4.3%",
      up: true,
      footerTitle: "Trending up this month",
      footerSubtitle: hasAccountBalances
        ? "Assets minus credit cards and other liabilities"
        : "Income minus expenses",
    },
    {
      label: "Income",
      value: income,
      format,
      trend: "+12.1%",
      up: true,
      footerTitle: "Strong income this month",
      footerSubtitle: "Total income across all accounts",
    },
    {
      label: "Expenses",
      value: expenses,
      format,
      trend: "-2.6%",
      up: false,
      footerTitle: "Down 2.6% from last month",
      footerSubtitle: "Total expenses across all accounts",
    },
    {
      label: "Needs Review",
      value: needsReview,
      format: (value: number) => String(Math.round(value)),
      trend: `${pending} pending`,
      up: null,
      footerTitle: "Awaiting categorization",
      footerSubtitle: "Uncategorized or unconfirmed transactions",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => (
        <Card key={card.label} className="@container/card">
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              <AnimatedValue value={card.value} format={card.format} />
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.up === true && <TrendingUpIcon />}
                {card.up === false && <TrendingDownIcon />}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.footerTitle}
              {card.up === true && <TrendingUpIcon className="size-4" />}
              {card.up === false && <TrendingDownIcon className="size-4" />}
            </div>
            <div className="text-muted-foreground">{card.footerSubtitle}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
