"use client"

import { addTransaction } from "@/app/(dashboard)/transactions/actions"
import { CategoryRule, Transaction, TransactionAccountOption } from "@/lib/transactions"
import { CategoryGroup } from "@/lib/categories"
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
          onAdd={(transaction) => void notify(addTransaction(transaction), "Transaction added")}
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
