"use client"

import * as React from "react"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { calculateExpression } from "@/lib/calculator"
import { useIsMobile } from "@/hooks/use-mobile"

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
  initialOpen = false,
  shortcutTarget = false,
  hideTrigger = false,
}: {
  onAdd: (transaction: Omit<Transaction, "id">) => void
  rules: CategoryRule[]
  accounts: TransactionAccountOption[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
  initialOpen?: boolean
  shortcutTarget?: boolean
  hideTrigger?: boolean
}) {
  const [open, setOpen] = React.useState(initialOpen)
  const isMobile = useIsMobile()
  const [form, setForm] = React.useState<TransactionFormValue>(() => emptyForm(accounts))
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    if (!shortcutTarget) return
    function openDrawer() {
      setOpen(true)
    }
    window.addEventListener("zent:add-transaction", openDrawer)
    return () => window.removeEventListener("zent:add-transaction", openDrawer)
  }, [shortcutTarget])

  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  function handleChange(patch: Partial<TransactionFormValue>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const amount = calculateExpression(form.amount)
    if (!form.description.trim() || amount === null || amount <= 0) {
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
      transferToAccountId: null,
    })

    setForm(emptyForm(accounts))
    setOpen(false)
  }

  return (
    <Drawer
      open={open}
      swipeDirection={isMobile ? "down" : "right"}
      showSwipeHandle={isMobile}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setForm(emptyForm(accounts))
      }}
    >
      {!hideTrigger && (
        <DrawerTrigger render={<Button size="sm" className="order-first w-full sm:order-none sm:w-auto" />}>
          <Plus />
          Add transaction
        </DrawerTrigger>
      )}
      <DrawerContent>
        <form ref={formRef} onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Add transaction</DrawerTitle>
            <DrawerDescription>
              Record a new income or expense, or log cash and other
              untracked activity. Press Ctrl/Cmd + Enter to save.
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
