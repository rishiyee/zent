"use client"

import * as React from "react"

import {
  Account,
  AccountCategory,
  cashCreditCategories,
  categoryMeta,
  valuableCategories,
} from "@/lib/accounts"

const accountCashCategories = cashCreditCategories.filter(
  (category) => category !== "credit-card"
)
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EditAccountFormValue = {
  name: string
  category: AccountCategory
}

function toFormValue(account: Account): EditAccountFormValue {
  return {
    name: account.name,
    category: account.category,
  }
}

export function EditAccountDrawer({
  account,
  open,
  onOpenChange,
  onSave,
}: {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, patch: Pick<Account, "name" | "category">) => void
}) {
  const [form, setForm] = React.useState<EditAccountFormValue | null>(
    account ? toFormValue(account) : null
  )
  const [loadedId, setLoadedId] = React.useState(account?.id ?? null)

  if (account && account.id !== loadedId) {
    setLoadedId(account.id)
    setForm(toFormValue(account))
  }

  const canSubmit =
    !!form &&
    form.name.trim().length > 0

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!account || !form || !canSubmit) return

    onSave(account.id, {
      name: form.name.trim(),
      category: form.category,
    })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} swipeDirection="right" onOpenChange={onOpenChange}>
      <DrawerContent>
        {form && account && (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <DrawerHeader>
              <DrawerTitle>Edit account</DrawerTitle>
              <DrawerDescription>
                Update the details for {account.name}.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-account-name">Name</Label>
                <Input
                  id="edit-account-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, name: e.target.value } : f))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <Select
                    items={Object.fromEntries(
                      [...accountCashCategories, ...valuableCategories].map(
                        (category) => [category, categoryMeta[category].label]
                      )
                    )}
                    value={form.category}
                    onValueChange={(value: AccountCategory | null) =>
                      value &&
                      setForm((f) => (f ? { ...f, category: value } : f))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Cash & Credit</SelectLabel>
                        {accountCashCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {categoryMeta[category].label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Valuables</SelectLabel>
                        {valuableCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {categoryMeta[category].label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-account-balance">Balance</Label>
                  <Input
                    id="edit-account-balance"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={account.balance}
                    disabled
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Balance is managed by income and expense transactions.
              </p>
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
