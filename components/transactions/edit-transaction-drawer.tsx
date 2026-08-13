"use client"

import * as React from "react"
import { format } from "date-fns"
import { useIsMobile } from "@/hooks/use-mobile"

import { Transaction, TransactionAccountOption } from "@/lib/transactions"
import { CategoryGroup } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  TransactionFormFields,
  TransactionFormValue,
  UNCATEGORIZED,
} from "@/components/transactions/transaction-form-fields"

function toFormValue(txn: Transaction): TransactionFormValue {
  return {
    date: new Date(`${txn.date}T00:00:00`),
    description: txn.description,
    category: txn.category ?? UNCATEGORIZED,
    accountId: txn.accountId,
    type: txn.type,
    amount: String(txn.amount),
    status: txn.status,
    notes: txn.notes ?? "",
  }
}

export function EditTransactionDrawer({
  transaction,
  open,
  onOpenChange,
  onSave,
  accounts,
  categoryGroups,
  merchants,
}: {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, patch: Partial<Transaction>) => void
  accounts: TransactionAccountOption[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
}) {
  const isMobile = useIsMobile()
  const [form, setForm] = React.useState<TransactionFormValue | null>(
    transaction ? toFormValue(transaction) : null
  )
  const [loadedId, setLoadedId] = React.useState(transaction?.id ?? null)

  if (transaction && transaction.id !== loadedId) {
    setLoadedId(transaction.id)
    setForm(toFormValue(transaction))
  }

  function handleChange(patch: Partial<TransactionFormValue>) {
    setForm((f) => (f ? { ...f, ...patch } : f))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!transaction || !form) return

    const amount = Number.parseFloat(form.amount)
    if (!form.description.trim() || Number.isNaN(amount) || amount <= 0) return

    onSave(transaction.id, {
      date: format(form.date ?? new Date(), "yyyy-MM-dd"),
      description: form.description.trim(),
      category: form.category === UNCATEGORIZED ? null : form.category,
      accountId: form.accountId,
      type: form.type,
      amount,
      status: form.status,
      notes: form.notes.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} swipeDirection={isMobile ? "down" : "right"} showSwipeHandle={isMobile} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[calc(100dvh-1rem)]">
        {form && (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DrawerHeader className="border-b">
              <DrawerTitle>Edit transaction</DrawerTitle>
              <DrawerDescription>
                Update the details for {transaction?.description}.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-8 [-webkit-overflow-scrolling:touch]">
              <div className="flex flex-col gap-4">
              <TransactionFormFields
                value={form}
                onChange={handleChange}
                accounts={accounts}
                categoryGroups={categoryGroups}
                merchants={merchants}
              />
              </div>
            </div>
            <DrawerFooter className="border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button type="submit">Save changes</Button>
              <DrawerClose render={<Button variant="outline" type="button" />}>
                Cancel
              </DrawerClose>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  )
}
