import {
  CreditCard,
  CreditCardPayment,
  daysUntilDue,
  dueStatus,
  dueStatusMeta,
  isCycleSettled,
  nextDueDate,
} from "@/lib/credit-cards"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})

export function CreditCardsDueSoonCard({
  cards,
  payments,
}: {
  cards: CreditCard[]
  payments: CreditCardPayment[]
}) {
  const today = new Date()

  const unsettled = cards
    .map((card) => ({
      card,
      daysUntil: daysUntilDue(card, today),
      settled: isCycleSettled(card, payments, today),
    }))
    .filter((c) => !c.settled)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const nearest = unsettled[0]
  const dueWithinAWeek = nearest && nearest.daysUntil <= 7

  if (!dueWithinAWeek) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Credit cards due soon</CardDescription>
          <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
            No cards due this week
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const status = dueStatus(nearest.daysUntil, false)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Credit cards due soon</CardDescription>
        <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
          {nearest.card.name}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Due {dateFormatter.format(nextDueDate(nearest.card, today))}
        </div>
        <Badge variant="outline" className={dueStatusMeta[status].className}>
          {dueStatusMeta[status].label}
        </Badge>
      </CardHeader>
    </Card>
  )
}
