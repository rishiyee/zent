"use client"

import { useQueryClient } from "@tanstack/react-query"

import { addTransaction } from "@/app/(dashboard)/transactions/actions"
import { Account } from "@/lib/accounts"
import { CategoryGroup } from "@/lib/categories"
import { queryKeys } from "@/lib/query-keys"
import { CategoryRule } from "@/lib/transactions"
import { notify } from "@/components/ui/toast"
import { AddTransactionDrawer } from "@/components/transactions/add-transaction-drawer"

export function GlobalAddTransaction({
  accounts,
  rules,
  categoryGroups,
  merchants,
}: {
  accounts: Account[]
  rules: CategoryRule[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
}) {
  const queryClient = useQueryClient()

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
  }

  return (
    <AddTransactionDrawer
      accounts={accounts}
      rules={rules}
      categoryGroups={categoryGroups}
      merchants={merchants}
      shortcutTarget
      hideTrigger
      onAdd={(transaction) =>
        void notify(addTransaction(transaction), "Transaction added").then(invalidate)
      }
    />
  )
}
