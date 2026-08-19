"use client"

import * as React from "react"
import { format, isToday, isYesterday } from "date-fns"
import { MoreHorizontal } from "lucide-react"

import {
  Transaction,
  TransactionAccountOption,
  accountName,
  groupByDate,
  transactionPayeeName,
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
import { DataPagination } from "@/components/ui/data-pagination"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

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
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(25)
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageData = React.useMemo(() => data.slice(safePage * pageSize, (safePage + 1) * pageSize), [data, pageSize, safePage])
  const groups = React.useMemo(() => {
    return groupByDate(pageData).map((group) => ({
      ...group,
      transactions: sortWithinGroup(group.transactions, sort),
    }))
  }, [pageData, sort])

  const allIds = React.useMemo(() => pageData.map((t) => t.id), [pageData])
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

  function TransactionActions({ transaction }: { transaction: Transaction }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MoreHorizontal />
          <span className="sr-only">Actions for {transactionPayeeName(transaction.description)}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRowClick(transaction)}>View details</DropdownMenuItem>
          {!transaction.linkedPaymentId && <DropdownMenuItem onClick={() => onEdit(transaction)}>Edit transaction</DropdownMenuItem>}
          {!transaction.linkedPaymentId && !transaction.transferToAccountId && <DropdownMenuItem onClick={() => onSplit(transaction)}>Split transaction</DropdownMenuItem>}
          {!transaction.linkedPaymentId && transaction.status !== "reviewed" && <DropdownMenuItem onClick={() => onMarkReviewed(transaction.id)}>Mark as reviewed</DropdownMenuItem>}
          {!transaction.linkedPaymentId && <DropdownMenuSeparator />}
          {!transaction.linkedPaymentId && <DropdownMenuItem variant="destructive" onClick={() => onDelete(transaction.id)}>Delete</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  function RowContextMenu({ transaction }: { transaction: Transaction }) {
    return <ContextMenuContent>
      <ContextMenuItem onClick={() => onRowClick(transaction)}>View details</ContextMenuItem>
      {!transaction.linkedPaymentId && <ContextMenuItem onClick={() => onEdit(transaction)}>Edit transaction</ContextMenuItem>}
      {!transaction.linkedPaymentId && !transaction.transferToAccountId && <ContextMenuItem onClick={() => onSplit(transaction)}>Split transaction</ContextMenuItem>}
      {!transaction.linkedPaymentId && transaction.status !== "reviewed" && <ContextMenuItem onClick={() => onMarkReviewed(transaction.id)}>Mark as reviewed</ContextMenuItem>}
      {!transaction.linkedPaymentId && <ContextMenuSeparator />}
      {!transaction.linkedPaymentId && <ContextMenuItem variant="destructive" onClick={() => onDelete(transaction.id)}>Delete transaction</ContextMenuItem>}
    </ContextMenuContent>
  }

  return (
    <>
      <div className="sm:hidden">
        {groups.length ? (
          <div className="grid gap-5">
            <div className="flex items-center justify-between px-1">
              <label className="flex min-h-10 items-center gap-3 text-sm text-muted-foreground">
                <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onCheckedChange={(value) => toggleAll(!!value)} aria-label="Select all transactions" />
                Select all
              </label>
              <span className="text-xs text-muted-foreground">{data.length} transaction{data.length === 1 ? "" : "s"}</span>
            </div>
            {groups.map((group) => (
              <section key={group.date} aria-labelledby={`transaction-group-${group.date}`}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 id={`transaction-group-${group.date}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatGroupLabel(group.date)}</h3>
                  <span className={`text-xs font-medium tabular-nums ${group.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{group.net >= 0 ? "+" : "-"}{format(Math.abs(group.net))}</span>
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                  {group.transactions.map((txn) => (
                    <div key={txn.id} data-state={selected[txn.id] && "selected"} role="button" tabIndex={0} onClick={() => onRowClick(txn)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onRowClick(txn) } }} className="grid min-h-20 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-3 text-left last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=selected]:bg-muted/60">
                      <div onClick={(event) => event.stopPropagation()}><Checkbox checked={!!selected[txn.id]} onCheckedChange={(value) => toggleOne(txn.id, !!value)} aria-label={`Select ${transactionPayeeName(txn.description)}`} /></div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate font-medium">{transactionPayeeName(txn.description)}</span>
                          <span className={`shrink-0 font-semibold tabular-nums ${txn.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{txn.linkedPaymentId ? "" : txn.type === "income" ? "+" : "-"}{format(txn.amount)}</span>
                        </div>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="max-w-[45%] truncate">{txn.linkedPaymentId ? "Transfer" : txn.category ?? "Uncategorized"}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{accountName(txn.accountId, accounts)}</span>
                        </div>
                        <div className="mt-2"><TransactionStatusBadge status={txn.status} /></div>
                      </div>
                      <div onClick={(event) => event.stopPropagation()}><TransactionActions transaction={txn} /></div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : <div className="rounded-xl border px-4 py-12 text-center text-sm text-muted-foreground">No transactions match your filters.</div>}
      </div>
      <div className="hidden overflow-hidden rounded-lg border sm:block">
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
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="hidden lg:table-cell">Account</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
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
                <ContextMenu key={txn.id}>
                <ContextMenuTrigger
                  render={<TableRow />}
                  data-state={selected[txn.id] && "selected"}
                  className="cursor-pointer"
                  onClick={() => onRowClick(txn)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!!selected[txn.id]}
                      onCheckedChange={(value) => toggleOne(txn.id, !!value)}
                      aria-label={`Select ${transactionPayeeName(txn.description)}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{transactionPayeeName(txn.description)}</span>
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
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {accountName(txn.accountId, accounts)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
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
                    <TransactionActions transaction={txn} />
                  </TableCell>
                </ContextMenuTrigger>
                <RowContextMenu transaction={txn} />
                </ContextMenu>
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
      {data.length > 10 && <DataPagination page={safePage} pageSize={pageSize} total={data.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(0) }} />}
    </>
  )
}
