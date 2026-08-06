"use client"

import * as React from "react"
import { endOfDay, startOfDay } from "date-fns"

import {
  addTransaction,
  bulkUpdateTransactions,
  deleteTransaction,
  splitTransaction,
  updateTransaction,
} from "@/app/(dashboard)/transactions/actions"
import { Goal } from "@/lib/goals"
import { Tag } from "@/lib/tags"
import { CategoryGroup } from "@/lib/categories"
import {
  CategoryRule,
  Transaction,
  TransactionAccountOption,
  UNCATEGORIZED,
} from "@/lib/transactions"
import { notify } from "@/components/ui/toast"
import { SummaryCards } from "@/components/transactions/summary-cards"
import { BulkEditDrawer, BulkEditPatch } from "@/components/transactions/bulk-edit-drawer"
import { EditTransactionDrawer } from "@/components/transactions/edit-transaction-drawer"
import { LedgerFilters, LedgerToolbar, emptyLedgerFilters } from "@/components/transactions/ledger-toolbar"
import { LedgerSort, LedgerTable } from "@/components/transactions/ledger-table"
import { SplitTransactionDialog } from "@/components/transactions/split-transaction-dialog"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"

function matchesFilters(txn: Transaction, filters: LedgerFilters) {
  if (filters.search) {
    const q = filters.search.toLowerCase()
    const haystack = `${txn.description} ${txn.notes ?? ""}`.toLowerCase()
    if (!haystack.includes(q)) return false
  }

  if (filters.statuses.length && !filters.statuses.includes(txn.status)) {
    return false
  }

  if (filters.categories.length) {
    const key = txn.category ?? UNCATEGORIZED
    if (!filters.categories.includes(key)) return false
  }

  if (filters.accountIds.length && !filters.accountIds.includes(txn.accountId)) {
    return false
  }

  if (filters.dateRange?.from) {
    const date = new Date(`${txn.date}T00:00:00`)
    const from = startOfDay(filters.dateRange.from)
    const to = endOfDay(filters.dateRange.to ?? filters.dateRange.from)
    if (date < from || date > to) return false
  }

  const min = filters.amount.min ? Number.parseFloat(filters.amount.min) : undefined
  const max = filters.amount.max ? Number.parseFloat(filters.amount.max) : undefined
  if (min != null && !Number.isNaN(min) && txn.amount < min) return false
  if (max != null && !Number.isNaN(max) && txn.amount > max) return false

  return true
}

export function TransactionsPageContent({
  transactions,
  rules,
  accounts,
  goals,
  tags,
  categoryGroups,
  merchants,
}: {
  transactions: Transaction[]
  rules: CategoryRule[]
  accounts: TransactionAccountOption[]
  goals: Goal[]
  tags: Tag[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
}) {
  const [filters, setFilters] = React.useState<LedgerFilters>(emptyLedgerFilters)
  const [sort, setSort] = React.useState<LedgerSort>("date-desc")
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [splitId, setSplitId] = React.useState<string | null>(null)

  const filtered = React.useMemo(
    () => transactions.filter((txn) => matchesFilters(txn, filters)),
    [transactions, filters]
  )

  const selectedCount = Object.keys(selected).length
  const detailTransaction = transactions.find((t) => t.id === detailId) ?? null
  const editTransaction = transactions.find((t) => t.id === editId) ?? null
  const splitTransactionRecord = transactions.find((t) => t.id === splitId) ?? null

  function openEdit(transaction: Transaction) {
    setDetailId(null)
    setEditId(transaction.id)
  }

  function handleDelete(id: string) {
    setSelected((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (detailId === id) setDetailId(null)
    if (editId === id) setEditId(null)
    void notify(deleteTransaction(id), "Transaction deleted")
  }

  function handleSaveEdit(id: string, patch: Partial<Transaction>) {
    void notify(updateTransaction(id, patch), "Transaction updated")
  }

  function handleMarkReviewed(id: string) {
    void notify(updateTransaction(id, { status: "reviewed" }))
  }

  function handleSplit(original: Transaction, splits: Parameters<typeof splitTransaction>[1]) {
    setSplitId(null)
    if (detailId === original.id) setDetailId(null)
    if (editId === original.id) setEditId(null)
    void notify(splitTransaction(original.id, splits), "Transaction split")
  }

  function handleBulkApply(patch: BulkEditPatch) {
    const ids = Object.keys(selected)
    setSelected({})
    void notify(
      bulkUpdateTransactions(ids, patch),
      `Updated ${ids.length} transaction${ids.length === 1 ? "" : "s"}`
    )
  }

  return (
    <>
      <SummaryCards transactions={filtered} />
      <div>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">All transactions</h2>
            <p className="text-sm text-muted-foreground">
              Search, filter, and manage every transaction across your accounts.
            </p>
          </div>
        </div>
        <LedgerToolbar
          filters={filters}
          onFiltersChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          rules={rules}
          categoryGroups={categoryGroups}
          merchants={merchants}
          onAdd={(txn) => void notify(addTransaction(txn), "Transaction added")}
          accounts={accounts}
          selectedCount={selectedCount}
          onBulkEdit={() => setBulkEditOpen(true)}
          onClearSelection={() => setSelected({})}
        />
        <div className="mt-3">
          <LedgerTable
            data={filtered}
            sort={sort}
            selected={selected}
            onSelectedChange={setSelected}
            onRowClick={(txn) => setDetailId(txn.id)}
            onEdit={openEdit}
            onDelete={handleDelete}
            onMarkReviewed={handleMarkReviewed}
            onSplit={(txn) => setSplitId(txn.id)}
            accounts={accounts}
          />
        </div>
      </div>
      <TransactionDetailSheet
        transaction={detailTransaction}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={openEdit}
        onDelete={handleDelete}
        onMarkReviewed={handleMarkReviewed}
        accounts={accounts}
      />
      <EditTransactionDrawer
        transaction={editTransaction}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSave={handleSaveEdit}
        accounts={accounts}
        categoryGroups={categoryGroups}
        merchants={merchants}
      />
      <BulkEditDrawer
        count={selectedCount}
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        onApply={handleBulkApply}
        accounts={accounts}
        categoryGroups={categoryGroups}
      />
      <SplitTransactionDialog
        transaction={splitTransactionRecord}
        open={!!splitId}
        onOpenChange={(open) => !open && setSplitId(null)}
        onSplit={handleSplit}
        accounts={accounts}
        goals={goals}
        tags={tags}
        categoryGroups={categoryGroups}
      />
    </>
  )
}
