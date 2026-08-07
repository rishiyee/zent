"use client"

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

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

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const { format } = useCurrency()
  const income = transactions
    .filter((t) => t.type === "income" && !t.linkedPaymentId)
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "expense" && !t.linkedPaymentId)
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = income - expenses
  const needsReview = transactions.filter(
    (t) => t.status === "needs-review"
  ).length
  const pending = transactions.filter((t) => t.status === "pending").length

  const cards = [
    {
      label: "Total Balance",
      value: format(balance),
      trend: "+4.3%",
      up: true,
      footerTitle: "Trending up this month",
      footerSubtitle: "Balance across all accounts",
    },
    {
      label: "Income",
      value: format(income),
      trend: "+12.1%",
      up: true,
      footerTitle: "Strong income this month",
      footerSubtitle: "Total income across all accounts",
    },
    {
      label: "Expenses",
      value: format(expenses),
      trend: "-2.6%",
      up: false,
      footerTitle: "Down 2.6% from last month",
      footerSubtitle: "Total expenses across all accounts",
    },
    {
      label: "Needs Review",
      value: String(needsReview),
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
              {card.value}
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
