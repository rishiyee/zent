"use client"

import * as React from "react"
import { format } from "date-fns"

import {
  Account,
  AccountCategory,
  cashCreditCategories,
  categoryMeta,
  valuableCategories,
} from "@/lib/accounts"
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
  balance: string
}

function toFormValue(account: Account): EditAccountFormValue {
  return {
    name: account.name,
    category: account.category,
    balance: String(account.balance),
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
  onSave: (id: string, patch: Partial<Omit<Account, "id">>) => void
}) {
  const [form, setForm] = React.useState<EditAccountFormValue | null>(
    account ? toFormValue(account) : null
  )
  const [loadedId, setLoadedId] = React.useState(account?.id ?? null)

  if (account && account.id !== loadedId) {
    setLoadedId(account.id)
    setForm(toFormValue(account))
  }

  const isManual = account?.source === "manual"
  const balance = Number.parseFloat(form?.balance ?? "")
  const canSubmit =
    !!form &&
    form.name.trim().length > 0 &&
    (!isManual || (!Number.isNaN(balance) && balance >= 0))

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!account || !form || !canSubmit) return

    onSave(account.id, {
      name: form.name.trim(),
      category: form.category,
      ...(isManual
        ? { balance, lastUpdated: format(new Date(), "yyyy-MM-dd") }
        : {}),
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
                      [...cashCreditCategories, ...valuableCategories].map(
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
                        {cashCreditCategories.map((category) => (
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
                    value={form.balance}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, balance: e.target.value } : f))
                    }
                    disabled={!isManual}
                    required={isManual}
                  />
                </div>
              </div>
              {!isManual && (
                <p className="text-sm text-muted-foreground">
                  Balance isn&apos;t editable for connected accounts in this
                  demo.
                </p>
              )}
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
