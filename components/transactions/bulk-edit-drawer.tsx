"use client"

import * as React from "react"

import {
  TransactionAccountOption,
  TransactionStatus,
  UNCATEGORIZED,
  statusMeta,
  transactionAccountOptions,
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
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategorySelect } from "@/components/transactions/category-select"

const KEEP = "__keep__"

export type BulkEditPatch = {
  category?: string | null
  status?: TransactionStatus
  accountId?: string
}

export function BulkEditDrawer({
  count,
  open,
  onOpenChange,
  onApply,
  accounts,
  categoryGroups,
}: {
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (patch: BulkEditPatch) => void
  accounts: TransactionAccountOption[]
  categoryGroups: CategoryGroup[]
}) {
  const [category, setCategory] = React.useState(KEEP)
  const [status, setStatus] = React.useState(KEEP)
  const [accountId, setAccountId] = React.useState(KEEP)
  const [wasOpen, setWasOpen] = React.useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setCategory(KEEP)
      setStatus(KEEP)
      setAccountId(KEEP)
    }
  }

  const hasChange = category !== KEEP || status !== KEEP || accountId !== KEEP

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!hasChange) return

    const patch: BulkEditPatch = {}
    if (category !== KEEP) {
      patch.category = category === UNCATEGORIZED ? null : category
    }
    if (status !== KEEP) patch.status = status as TransactionStatus
    if (accountId !== KEEP) patch.accountId = accountId

    onApply(patch)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} swipeDirection="right" onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>
              Bulk edit {count} transaction{count === 1 ? "" : "s"}
            </DrawerTitle>
            <DrawerDescription>
              Only the fields you change below are applied. Date, payee, and
              amount need to be edited individually per transaction.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <CategorySelect
                groups={categoryGroups}
                value={category}
                onValueChange={setCategory}
                className="w-full"
                leadingOptions={[
                  { value: KEEP, label: "Don't change" },
                  { value: UNCATEGORIZED, label: "Uncategorized" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                items={{
                  [KEEP]: "Don't change",
                  ...Object.fromEntries(
                    Object.entries(statusMeta).map(([s, meta]) => [s, meta.label])
                  ),
                }}
                value={status}
                onValueChange={(v) => v && setStatus(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KEEP}>Don&apos;t change</SelectItem>
                  {Object.entries(statusMeta).map(([s, meta]) => (
                    <SelectItem key={s} value={s}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Account</Label>
              <Select
                items={{
                  [KEEP]: "Don't change",
                  ...Object.fromEntries(
                    transactionAccountOptions(accounts).map((a) => [a.id, a.name])
                  ),
                }}
                value={accountId}
                onValueChange={(v) => v && setAccountId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KEEP}>Don&apos;t change</SelectItem>
                  {transactionAccountOptions(accounts).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={!hasChange}>
              Apply to {count} transaction{count === 1 ? "" : "s"}
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
