"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { addTransaction } from "@/app/(dashboard)/transactions/actions"
import { CategoryRule, Transaction, TransactionAccountOption } from "@/lib/transactions"
import { CategoryGroup } from "@/lib/categories"
import { queryKeys } from "@/lib/query-keys"
import { notify } from "@/components/ui/toast"
import { useCurrency } from "@/components/currency-provider"
import { AddTransactionDrawer } from "@/components/transactions/add-transaction-drawer"
import { getColumns } from "@/components/transactions/columns"
import { DataTable } from "@/components/transactions/data-table"

export function TransactionsView({
  data,
  accounts,
  rules,
  categoryGroups,
  merchants,
}: {
  data: Transaction[]
  accounts: TransactionAccountOption[]
  rules: CategoryRule[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
}) {
  const { format } = useCurrency()
  const router = useRouter()
  const queryClient = useQueryClient()

  async function handleAdd(transaction: Omit<Transaction, "id">) {
    await notify(addTransaction(transaction), "Transaction added")
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards }),
    ])
    router.refresh()
  }

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            A list of your recent income and expenses.
          </p>
        </div>
        <AddTransactionDrawer
          onAdd={(transaction) => void handleAdd(transaction)}
          rules={rules}
          accounts={accounts}
          categoryGroups={categoryGroups}
          merchants={merchants}
        />
      </div>
      <DataTable columns={getColumns(accounts, format)} data={data} />
    </div>
  )
}
