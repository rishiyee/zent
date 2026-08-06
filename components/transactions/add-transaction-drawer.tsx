"use client"

import * as React from "react"
import { format } from "date-fns"
import { Plus } from "lucide-react"

import {
  CategoryRule,
  Transaction,
  TransactionAccountOption,
  matchRule,
} from "@/lib/transactions"
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
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  TransactionFormFields,
  TransactionFormValue,
  UNCATEGORIZED,
} from "@/components/transactions/transaction-form-fields"

function emptyForm(accounts: TransactionAccountOption[]): TransactionFormValue {
  return {
    date: undefined,
    description: "",
    category: UNCATEGORIZED,
    accountId: accounts[0]?.id ?? "CASH",
    type: "expense",
    amount: "",
    status: "reviewed",
    notes: "",
  }
}

export function AddTransactionDrawer({
  onAdd,
  rules,
  accounts,
  categoryGroups,
  merchants,
}: {
  onAdd: (transaction: Omit<Transaction, "id">) => void
  rules: CategoryRule[]
  accounts: TransactionAccountOption[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
}) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<TransactionFormValue>(() => emptyForm(accounts))

  function handleChange(patch: Partial<TransactionFormValue>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const amount = Number.parseFloat(form.amount)
    if (!form.description.trim() || Number.isNaN(amount) || amount <= 0) {
      return
    }

    const rule = matchRule(form.description, rules)
    const category =
      form.category === UNCATEGORIZED ? (rule?.category ?? null) : form.category

    onAdd({
      date: format(form.date ?? new Date(), "yyyy-MM-dd"),
      description: form.description.trim(),
      category,
      accountId: form.accountId,
      type: form.type,
      amount,
      status: form.status,
      source: "manual",
      notes: form.notes.trim() || undefined,
      goalId: null,
      tagIds: [],
    })

    setForm(emptyForm(accounts))
    setOpen(false)
  }

  return (
    <Drawer
      open={open}
      swipeDirection="right"
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setForm(emptyForm(accounts))
      }}
    >
      <DrawerTrigger render={<Button size="sm" />}>
        <Plus />
        Add transaction
      </DrawerTrigger>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Add transaction</DrawerTitle>
            <DrawerDescription>
              Record a new income or expense, or log cash and other
              untracked activity.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <TransactionFormFields
              value={form}
              onChange={handleChange}
              accounts={accounts}
              categoryGroups={categoryGroups}
              merchants={merchants}
            />
          </div>
          <DrawerFooter>
            <Button type="submit">Save transaction</Button>
            <DrawerClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
