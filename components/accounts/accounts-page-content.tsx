"use client"

import * as React from "react"

import {
  addAccount,
  deleteAccount,
  updateAccount,
} from "@/app/(dashboard)/accounts/actions"
import { Account } from "@/lib/accounts"
import { notify } from "@/components/ui/toast"
import { AccountDetailSheet } from "@/components/accounts/account-detail-sheet"
import { AccountsView } from "@/components/accounts/accounts-view"
import { EditAccountDrawer } from "@/components/accounts/edit-account-drawer"
import { NetWorthSummary } from "@/components/accounts/net-worth-summary"

export function AccountsPageContent({
  accounts,
}: {
  accounts: Account[]
}) {
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<string | null>(null)

  const detailAccount = accounts.find((a) => a.id === detailId) ?? null
  const editAccount = accounts.find((a) => a.id === editId) ?? null

  function openEdit(account: Account) {
    setDetailId(null)
    setEditId(account.id)
  }

  function handleDelete(id: string) {
    if (detailId === id) setDetailId(null)
    if (editId === id) setEditId(null)
    void notify(deleteAccount(id), "Account deleted")
  }

  return (
    <>
      <NetWorthSummary accounts={accounts} />
      <AccountsView
        data={accounts}
        onAdd={(account) => void notify(addAccount(account), "Account added")}
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
        onSave={(id, patch) => void notify(updateAccount(id, patch), "Account updated")}
      />
    </>
  )
}
