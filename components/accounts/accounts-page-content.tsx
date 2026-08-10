"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  addAccount,
  deleteAccount,
  getAccountsData,
  updateAccount,
} from "@/app/(dashboard)/accounts/actions"
import { Account } from "@/lib/accounts"
import { queryKeys } from "@/lib/query-keys"
import { notify } from "@/components/ui/toast"
import { AccountDetailSheet } from "@/components/accounts/account-detail-sheet"
import { AccountsView } from "@/components/accounts/accounts-view"
import { EditAccountDrawer } from "@/components/accounts/edit-account-drawer"
import { NetWorthSummary } from "@/components/accounts/net-worth-summary"

export function AccountsPageContent({
  accounts: initialAccounts,
}: {
  accounts: Account[]
}) {
  const queryClient = useQueryClient()
  const { data: accounts } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: getAccountsData,
    initialData: initialAccounts,
  })
  const visibleAccounts = accounts.filter(
    (account) => account.category !== "credit-card"
  )
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<string | null>(null)

  const detailAccount = accounts.find((a) => a.id === detailId) ?? null
  const editAccount = accounts.find((a) => a.id === editId) ?? null

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
  }

  function openEdit(account: Account) {
    setDetailId(null)
    setEditId(account.id)
  }

  function handleDelete(id: string) {
    if (detailId === id) setDetailId(null)
    if (editId === id) setEditId(null)
    void notify(deleteAccount(id), "Account deleted").then(invalidate)
  }

  return (
    <>
      <NetWorthSummary accounts={accounts} />
      <AccountsView
        data={visibleAccounts}
        onAdd={(account) =>
          void notify(addAccount(account), "Account added").then(invalidate)
        }
        onRowClick={(account) => setDetailId(account.id)}
      />
      <AccountDetailSheet
        account={detailAccount}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <EditAccountDrawer
        account={editAccount}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSave={(id, patch) =>
          void notify(updateAccount(id, patch), "Account updated").then(invalidate)
        }
      />
    </>
  )
}
