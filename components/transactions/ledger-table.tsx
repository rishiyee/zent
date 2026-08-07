"use client"

import * as React from "react"
import { format, isToday, isYesterday } from "date-fns"
import { MoreHorizontal } from "lucide-react"

import {
  Transaction,
  TransactionAccountOption,
  accountName,
  groupByDate,
} from "@/lib/transactions"
import { useCurrency } from "@/components/currency-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge"

export type LedgerSort = "date-desc" | "amount-desc" | "amount-asc"

function formatGroupLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (isToday(parsed)) return "Today"
  if (isYesterday(parsed)) return "Yesterday"
  return format(parsed, "EEEE, MMMM d")
}

function sortWithinGroup(transactions: Transaction[], sort: LedgerSort) {
  if (sort === "date-desc") return transactions
  const sorted = [...transactions].sort((a, b) => a.amount - b.amount)
  return sort === "amount-asc" ? sorted : sorted.reverse()
}

export function LedgerTable({
  data,
  sort,
  selected,
  onSelectedChange,
  onRowClick,
  onEdit,
  onDelete,
  onMarkReviewed,
  onSplit,
  accounts,
}: {
  data: Transaction[]
  sort: LedgerSort
  selected: Record<string, boolean>
  onSelectedChange: (next: Record<string, boolean>) => void
  onRowClick: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onMarkReviewed: (id: string) => void
  onSplit: (transaction: Transaction) => void
  accounts: TransactionAccountOption[]
}) {
  const { format } = useCurrency()
  const groups = React.useMemo(() => {
    return groupByDate(data).map((group) => ({
      ...group,
      transactions: sortWithinGroup(group.transactions, sort),
    }))
  }, [data, sort])

  const allIds = React.useMemo(() => data.map((t) => t.id), [data])
  const allSelected = allIds.length > 0 && allIds.every((id) => selected[id])
  const someSelected = allIds.some((id) => selected[id])

  function toggleAll(checked: boolean) {
    const next = { ...selected }
    for (const id of allIds) {
      if (checked) next[id] = true
      else delete next[id]
    }
    onSelectedChange(next)
  }

  function toggleOne(id: string, checked: boolean) {
    const next = { ...selected }
    if (checked) next[id] = true
    else delete next[id]
    onSelectedChange(next)
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onCheckedChange={(value) => toggleAll(!!value)}
                aria-label="Select all"
                disabled={allIds.length === 0}
              />
            </TableHead>
            <TableHead>Payee</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.length ? (
            groups.flatMap((group) => [
              <TableRow key={`group-${group.date}`} className="bg-muted/40 hover:bg-muted/40">
                <TableCell colSpan={5} className="py-1.5 text-xs font-medium text-muted-foreground">
                  {formatGroupLabel(group.date)}
                </TableCell>
                <TableCell
                  className={`py-1.5 text-right text-xs font-medium tabular-nums ${
                    group.net >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {group.net >= 0 ? "+" : "-"}
                  {format(Math.abs(group.net))}
                </TableCell>
                <TableCell className="py-1.5" />
              </TableRow>,
              ...group.transactions.map((txn) => (
                <TableRow
                  key={txn.id}
                  data-state={selected[txn.id] && "selected"}
                  className="cursor-pointer"
                  onClick={() => onRowClick(txn)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!!selected[txn.id]}
                      onCheckedChange={(value) => toggleOne(txn.id, !!value)}
                      aria-label={`Select ${txn.description}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{txn.description}</span>
                      {txn.notes && (
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {txn.notes}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {txn.linkedPaymentId ? (
                      <Badge variant="outline" className="font-normal">
                        Transfer
                      </Badge>
                    ) : txn.category ? (
                      <Badge variant="secondary" className="font-normal">
                        {txn.category}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Uncategorized
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {accountName(txn.accountId, accounts)}
                  </TableCell>
                  <TableCell>
                    <TransactionStatusBadge status={txn.status} />
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${
                      txn.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    {txn.linkedPaymentId ? "" : txn.type === "income" ? "+" : "-"}
                    {format(txn.amount)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <MoreHorizontal />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRowClick(txn)}>
                          View details
                        </DropdownMenuItem>
                        {!txn.linkedPaymentId && <DropdownMenuItem onClick={() => onEdit(txn)}>
                          Edit transaction
                        </DropdownMenuItem>}
                        {!txn.linkedPaymentId && <DropdownMenuItem onClick={() => onSplit(txn)}>
                          Split transaction
                        </DropdownMenuItem>}
                        {!txn.linkedPaymentId && txn.status !== "reviewed" && (
                          <DropdownMenuItem onClick={() => onMarkReviewed(txn.id)}>
                            Mark as reviewed
                          </DropdownMenuItem>
                        )}
                        {!txn.linkedPaymentId && <DropdownMenuSeparator />}
                        {!txn.linkedPaymentId && <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(txn.id)}
                        >
                          Delete
                        </DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )),
            ])
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No transactions match your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
