"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  addTransaction,
  deleteTransaction,
  getTransactionsData,
  splitTransaction,
  updateTransaction,
} from "@/app/(dashboard)/transactions/actions"
import { Account } from "@/lib/accounts"
import { CategoryGroup } from "@/lib/categories"
import { Goal } from "@/lib/goals"
import { queryKeys } from "@/lib/query-keys"
import { Tag } from "@/lib/tags"
import { CategoryRule, Transaction } from "@/lib/transactions"
import { notify } from "@/components/ui/toast"
import { AddTransactionDrawer } from "@/components/transactions/add-transaction-drawer"
import { EditTransactionDrawer } from "@/components/transactions/edit-transaction-drawer"
import { LedgerTable } from "@/components/transactions/ledger-table"
import { SplitTransactionDialog } from "@/components/transactions/split-transaction-dialog"
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet"
import { TransferDrawer } from "@/components/transactions/transfer-drawer"

export function TransactionsView({
  data: initialData,
  accounts,
  rules,
  categoryGroups,
  merchants,
  goals,
  tags,
}: {
  data: Transaction[]
  accounts: Account[]
  rules: CategoryRule[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
  goals: Goal[]
  tags: Tag[]
}) {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: getTransactionsData,
    initialData,
  })
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [transferEditId, setTransferEditId] = React.useState<string | null>(null)
  const [splitId, setSplitId] = React.useState<string | null>(null)

  const detailTransaction = data.find((item) => item.id === detailId) ?? null
  const editTransaction = data.find((item) => item.id === editId) ?? null
  const transferEditTransaction = data.find((item) => item.id === transferEditId) ?? null
  const splitTransactionRecord = data.find((item) => item.id === splitId) ?? null

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
  }

  function openEdit(transaction: Transaction) {
    setDetailId(null)
    if (transaction.transferToAccountId) setTransferEditId(transaction.id)
    else setEditId(transaction.id)
  }

  function handleDelete(id: string) {
    setDetailId(null)
    setEditId(null)
    setTransferEditId(null)
    setSelected((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    void notify(deleteTransaction(id), "Transaction deleted").then(invalidate)
  }

  function handleSave(id: string, patch: Partial<Transaction>) {
    void notify(updateTransaction(id, patch), "Transaction updated").then(invalidate)
  }

  function handleMarkReviewed(id: string) {
    void notify(updateTransaction(id, { status: "reviewed" })).then(invalidate)
  }

  function handleSplit(original: Transaction, splits: Parameters<typeof splitTransaction>[1]) {
    setSplitId(null)
    setDetailId(null)
    void notify(splitTransaction(original.id, splits), "Transaction split").then(invalidate)
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            A list of your recent income and expenses.
          </p>
        </div>
        <AddTransactionDrawer
          onAdd={(transaction) =>
            void notify(addTransaction(transaction), "Transaction added").then(invalidate)
          }
          rules={rules}
          accounts={accounts}
          categoryGroups={categoryGroups}
          merchants={merchants}
        />
      </div>
      <LedgerTable
        data={data.slice(0, 10)}
        sort="date-desc"
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(transaction) => setDetailId(transaction.id)}
        onEdit={openEdit}
        onDelete={handleDelete}
        onMarkReviewed={handleMarkReviewed}
        onSplit={(transaction) => setSplitId(transaction.id)}
        accounts={accounts}
      />
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
        onSave={handleSave}
        accounts={accounts}
        categoryGroups={categoryGroups}
        merchants={merchants}
      />
      <TransferDrawer
        accounts={accounts}
        open={!!transferEditId}
        onOpenChange={(open) => !open && setTransferEditId(null)}
        transaction={transferEditTransaction}
        onUpdate={handleSave}
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
    </div>
  )
}
