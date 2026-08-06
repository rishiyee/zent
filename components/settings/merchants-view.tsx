"use client"

import * as React from "react"
import { Building2, Pencil, Search } from "lucide-react"

import { renameMerchant } from "@/app/(dashboard)/settings/merchants/actions"
import { Merchant } from "@/lib/data/merchants"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"

type SortKey = "count" | "name"

export function MerchantsView({ merchants }: { merchants: Merchant[] }) {
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("count")
  const [editing, setEditing] = React.useState<Merchant | null>(null)
  const [draft, setDraft] = React.useState("")
  const [pending, setPending] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? merchants.filter((m) => m.name.toLowerCase().includes(q))
      : merchants
    return [...list].sort((a, b) =>
      sort === "count" ? b.count - a.count : a.name.localeCompare(b.name)
    )
  }, [merchants, search, sort])

  function openEdit(merchant: Merchant) {
    setEditing(merchant)
    setDraft(merchant.name)
  }

  async function submitRename(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return
    const next = draft.trim()
    if (!next || next === editing.name) {
      setEditing(null)
      return
    }

    setPending(true)
    try {
      await renameMerchant(editing.name, next)
      toast.add({ title: "Merchant updated", type: "success" })
      setEditing(null)
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Something went wrong",
        type: "error",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border p-6">
      <div>
        <h2 className="text-lg font-semibold">Merchants</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These are the distinct payees from your transaction history.
          Renaming a merchant updates how it displays on every transaction
          that uses it.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={{ count: "Transaction count", name: "Name" }}
          value={sort}
          onValueChange={(v) => v && setSort(v as SortKey)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Transaction count</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative ml-auto w-full max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${merchants.length} merchants…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <p className="text-sm font-medium">
        {filtered.length} Merchant{filtered.length === 1 ? "" : "s"}
      </p>
      <div className="flex flex-col">
        {filtered.length ? (
          filtered.map((merchant) => (
            <div
              key={merchant.name}
              className="flex items-center gap-3 border-b py-3 last:border-b-0"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{merchant.name}</span>
                <span className="text-xs text-muted-foreground">
                  {merchant.count} transaction{merchant.count === 1 ? "" : "s"}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(merchant)}>
                <Pencil />
                Edit
              </Button>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {merchants.length
              ? "No merchants match your search."
              : "No transactions yet — merchants show up here once you add some."}
          </p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit merchant</DialogTitle>
            <DialogDescription>
              Renames this payee on all {editing?.count} transaction
              {editing?.count === 1 ? "" : "s"} that use it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRename} className="flex flex-col gap-4">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={pending || !draft.trim()}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
