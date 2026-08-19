"use client"

import Link from "next/link"
import { format as formatDate } from "date-fns"
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Building2, CalendarDays, ReceiptText } from "lucide-react"

import { Account } from "@/lib/accounts"
import { Transaction, accountName } from "@/lib/transactions"
import { useCurrency } from "@/components/currency-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge"

export function MerchantDetailView({ name, transactions, accounts }: { name: string; transactions: Transaction[]; accounts: Account[] }) {
  const { format } = useCurrency()
  const expenses = transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0)
  const income = transactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0)
  const latest = transactions[0]?.date

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit -ml-2" render={<Link href="/settings/merchants" />}><ArrowLeft />All merchants</Button>
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="size-5" /></div>
        <div className="min-w-0"><h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1><p className="text-sm text-muted-foreground">Complete transaction history for this merchant.</p></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ReceiptText className="size-4" />Transactions</div><p className="mt-2 text-2xl font-semibold tabular-nums">{transactions.length}</p></div>
        <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ArrowUpRight className="size-4" />Total spent</div><p className="mt-2 text-2xl font-semibold tabular-nums">{format(expenses)}</p></div>
        <div className="rounded-xl border p-4"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarDays className="size-4" />Latest activity</div><p className="mt-2 text-lg font-semibold">{latest ? formatDate(new Date(`${latest}T00:00:00`), "MMM d, yyyy") : "No activity"}</p></div>
      </div>
      {income > 0 && <p className="-mt-3 text-sm text-muted-foreground">Income received from this merchant: <span className="font-medium text-foreground">{format(income)}</span></p>}
      <section>
        <div className="mb-3"><h2 className="text-lg font-semibold">All transactions</h2><p className="text-sm text-muted-foreground">Newest transactions appear first.</p></div>
        {transactions.length ? <div className="overflow-hidden rounded-xl border">
          {transactions.map((transaction) => <Link key={transaction.id} href={`/transactions?transaction=${transaction.id}`} className="flex items-center gap-3 border-b p-4 transition-colors last:border-b-0 hover:bg-muted/40">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${transaction.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{transaction.type === "income" ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}</div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-medium">{formatDate(new Date(`${transaction.date}T00:00:00`), "MMM d, yyyy")}</span><TransactionStatusBadge status={transaction.status} /></div><div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><span className="truncate">{transaction.category ?? "Uncategorized"}</span><span aria-hidden="true">·</span><span className="truncate">{accountName(transaction.accountId, accounts)}</span></div></div>
            <div className="text-right"><p className={`font-semibold tabular-nums ${transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{transaction.type === "income" ? "+" : "-"}{format(transaction.amount)}</p><Badge variant="outline" className="mt-1 font-normal">View details</Badge></div>
          </Link>)}
        </div> : <div className="rounded-xl border px-4 py-12 text-center text-sm text-muted-foreground">No transactions found for this merchant.</div>}
      </section>
    </div>
  )
}
