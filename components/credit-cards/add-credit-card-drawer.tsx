"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { CreditCard } from "@/lib/credit-cards"
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
  CreditCardFormFields,
  CreditCardFormValue,
  emptyCreditCardForm,
} from "@/components/credit-cards/credit-card-form-fields"

export function AddCreditCardDrawer({
  onAdd,
}: {
  onAdd: (card: Omit<CreditCard, "id" | "accountId">) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<CreditCardFormValue>(emptyCreditCardForm)

  const balance = Number.parseFloat(form.balance)
  const creditLimit = Number.parseFloat(form.creditLimit)
  const statementDay = Number.parseInt(form.statementDay, 10)
  const paymentDueDay = Number.parseInt(form.paymentDueDay, 10)
  const minimumPaymentValue = Number.parseFloat(form.minimumPaymentValue || "0")
  const apr = form.apr.trim() ? Number.parseFloat(form.apr) : null

  const canSubmit =
    form.name.trim().length > 0 &&
    !Number.isNaN(balance) &&
    balance >= 0 &&
    !Number.isNaN(creditLimit) &&
    creditLimit > 0 &&
    statementDay >= 1 &&
    statementDay <= 28 &&
    paymentDueDay >= 1 &&
    paymentDueDay <= 28

  function handleChange(patch: Partial<CreditCardFormValue>) {
    setForm((f) => ({ ...f, ...patch }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    onAdd({
      name: form.name.trim(),
      balance,
      creditLimit,
      apr,
      statementDay,
      paymentDueDay,
      minimumPaymentType: form.minimumPaymentType,
      minimumPaymentValue,
      autopay: form.autopay,
    })

    setForm(emptyCreditCardForm())
    setOpen(false)
  }

  return (
    <Drawer
      open={open}
      swipeDirection="right"
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setForm(emptyCreditCardForm())
      }}
    >
      <DrawerTrigger render={<Button size="sm" />}>
        <Plus />
        Add credit card
      </DrawerTrigger>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Add credit card</DrawerTitle>
            <DrawerDescription>
              Track a card&apos;s balance, limit, and due date. Balances are
              entered manually — there&apos;s no bank sync in this demo.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <CreditCardFormFields value={form} onChange={handleChange} />
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={!canSubmit}>
              Save card
            </Button>
            <DrawerClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
