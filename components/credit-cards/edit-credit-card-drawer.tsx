"use client"

import * as React from "react"

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
} from "@/components/ui/drawer"
import {
  CreditCardFormFields,
  CreditCardFormValue,
} from "@/components/credit-cards/credit-card-form-fields"

function toFormValue(card: CreditCard): CreditCardFormValue {
  return {
    name: card.name,
    balance: String(card.balance),
    creditLimit: String(card.creditLimit),
    apr: card.apr != null ? String(card.apr) : "",
    statementDay: String(card.statementDay),
    paymentDueDay: String(card.paymentDueDay),
    minimumPaymentType: card.minimumPaymentType,
    minimumPaymentValue: String(card.minimumPaymentValue),
    autopay: card.autopay,
  }
}

export function EditCreditCardDrawer({
  card,
  open,
  onOpenChange,
  onSave,
}: {
  card: CreditCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, patch: Omit<CreditCard, "id" | "accountId">) => void
}) {
  const [form, setForm] = React.useState<CreditCardFormValue | null>(
    card ? toFormValue(card) : null
  )
  const [loadedId, setLoadedId] = React.useState(card?.id ?? null)

  if (card && card.id !== loadedId) {
    setLoadedId(card.id)
    setForm(toFormValue(card))
  }

  const balance = Number.parseFloat(form?.balance ?? "")
  const creditLimit = Number.parseFloat(form?.creditLimit ?? "")
  const statementDay = Number.parseInt(form?.statementDay ?? "", 10)
  const paymentDueDay = Number.parseInt(form?.paymentDueDay ?? "", 10)

  const canSubmit =
    !!form &&
    form.name.trim().length > 0 &&
    !Number.isNaN(balance) &&
    balance >= 0 &&
    !Number.isNaN(creditLimit) &&
    creditLimit > 0 &&
    statementDay >= 1 &&
    statementDay <= 28 &&
    paymentDueDay >= 1 &&
    paymentDueDay <= 28

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!card || !form || !canSubmit) return

    onSave(card.id, {
      name: form.name.trim(),
      balance,
      creditLimit,
      apr: form.apr.trim() ? Number.parseFloat(form.apr) : null,
      statementDay,
      paymentDueDay,
      minimumPaymentType: form.minimumPaymentType,
      minimumPaymentValue: Number.parseFloat(form.minimumPaymentValue || "0"),
      autopay: form.autopay,
    })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} swipeDirection="right" onOpenChange={onOpenChange}>
      <DrawerContent>
        {form && card && (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <DrawerHeader>
              <DrawerTitle>Edit credit card</DrawerTitle>
              <DrawerDescription>
                Update the details for {card.name}.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              <CreditCardFormFields
                value={form}
                balanceReadOnly
                onChange={(patch) =>
                  setForm((f) => (f ? { ...f, ...patch } : f))
                }
              />
            </div>
            <DrawerFooter>
              <Button type="submit" disabled={!canSubmit}>
                Save changes
              </Button>
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
