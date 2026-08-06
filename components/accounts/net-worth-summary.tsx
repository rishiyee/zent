"use client"

import { Account, netWorthSummary } from "@/lib/accounts"
import { useCurrency } from "@/components/currency-provider"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function NetWorthSummary({ accounts }: { accounts: Account[] }) {
  const { format } = useCurrency()
  const { assets, liabilities, netWorth, assetCount, liabilityCount } =
    netWorthSummary(accounts)

  const cards = [
    {
      label: "Net Worth",
      value: format(netWorth),
      footerTitle: "Assets minus liabilities",
      footerSubtitle: `Across ${accounts.length} account${accounts.length === 1 ? "" : "s"}`,
    },
    {
      label: "Total Assets",
      value: format(assets),
      footerTitle: "Connected and manual assets",
      footerSubtitle: `${assetCount} account${assetCount === 1 ? "" : "s"}`,
    },
    {
      label: "Total Liabilities",
      value: format(liabilities),
      footerTitle: "Credit cards and loans",
      footerSubtitle: `${liabilityCount} account${liabilityCount === 1 ? "" : "s"}`,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-3 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => (
        <Card key={card.label} className="@container/card">
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 font-medium">{card.footerTitle}</div>
            <div className="text-muted-foreground">{card.footerSubtitle}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
