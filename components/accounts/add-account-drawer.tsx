"use client"

import * as React from "react"
import { format } from "date-fns"
import { Plus } from "lucide-react"

import {
  Account,
  AccountCategory,
  AccountSource,
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
  DrawerTrigger,
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

const emptyForm = {
  source: "manual" as AccountSource,
  name: "",
  category: "checking" as AccountCategory,
  balance: "",
}

export function AddAccountDrawer({
  onAdd,
}: {
  onAdd: (account: Omit<Account, "id">) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)

  const isManual = form.source === "manual"
  const balance = Number.parseFloat(form.balance)
  const canSubmit =
    isManual && form.name.trim().length > 0 && !Number.isNaN(balance) && balance >= 0

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    onAdd({
      name: form.name.trim(),
      category: form.category,
      source: "manual",
      balance,
      lastUpdated: format(new Date(), "yyyy-MM-dd"),
    })

    setForm(emptyForm)
    setOpen(false)
  }

  return (
    <Drawer
      open={open}
      swipeDirection="right"
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setForm(emptyForm)
      }}
    >
      <DrawerTrigger render={<Button size="sm" />}>
        <Plus />
        Add account
      </DrawerTrigger>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>Add account</DrawerTitle>
            <DrawerDescription>
              Link a connected account or add one you track manually, like a
              vehicle, property, or collectible.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              <Label>Source</Label>
              <Select
                items={{ manual: "Manual", connected: "Connected" }}
                value={form.source}
                onValueChange={(value: AccountSource | null) =>
                  value && setForm((f) => ({ ...f, source: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={
                  isManual ? "e.g. Downtown Loft Condo" : "e.g. Chase Bank"
                }
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            {isManual ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <Select
                    items={Object.fromEntries(
                      [...accountCashCategories, ...valuableCategories].map((category) => [
                        category,
                        categoryMeta[category].label,
                      ])
                    )}
                    value={form.category}
                    onValueChange={(value: AccountCategory | null) =>
                      value && setForm((f) => ({ ...f, category: value }))
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
                  <Label htmlFor="balance">Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.balance}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, balance: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p>
                  Bank connections aren&apos;t available in this demo. Add
                  this account manually instead, and update its balance
                  yourself whenever it changes.
                </p>
              </div>
            )}
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={!canSubmit}>
              Save account
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
