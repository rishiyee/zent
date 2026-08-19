"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react"

import {
  Transaction,
  TransactionAccountOption,
  TransactionStatus,
  accountName,
  statusMeta,
  statuses,
} from "@/lib/transactions"
import { CategoryGroup } from "@/lib/categories"
import { regionLocale } from "@/lib/currency"
import { Goal } from "@/lib/goals"
import { Tag } from "@/lib/tags"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/currency-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CategorySelect } from "@/components/transactions/category-select"

export type SplitRow = {
  id: string
  amount: number
  category: string | null
  tagIds: string[]
  goalId: string | null
  status: TransactionStatus | null
  notes: string
  hidden: boolean
}

type SplitMode = "amount" | "percent"

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function createSplit(amount: number, category: string | null): SplitRow {
  return {
    id: `split-${Math.random().toString(36).slice(2, 9)}`,
    amount: round2(amount),
    category,
    tagIds: [],
    goalId: null,
    status: null,
    notes: "",
    hidden: false,
  }
}

function SplitTagPicker({
  selected,
  onChange,
  tags,
}: {
  selected: string[]
  onChange: (tagIds: string[]) => void
  tags: Tag[]
}) {
  const selectedSet = new Set(selected)
  const selectedTags = tags.filter((tag) => selectedSet.has(tag.id))

  function toggle(id: string) {
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(Array.from(next))
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full justify-start px-2.5 font-normal"
          />
        }
      >
        {selectedTags.length ? (
          <div className="flex flex-wrap items-center gap-1">
            {selectedTags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="gap-1.5 font-normal">
                <span className={cn("size-1.5 rounded-full", tag.color)} />
                {tag.label}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">Add tags…</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags…" />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  data-checked={selectedSet.has(tag.id)}
                  onSelect={() => toggle(tag.id)}
                >
                  <span className={cn("size-2 rounded-full", tag.color)} />
                  <span>{tag.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SplitTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSplit,
  accounts,
  goals,
  tags,
  categoryGroups,
}: {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSplit: (transaction: Transaction, splits: SplitRow[]) => void
  accounts: TransactionAccountOption[]
  goals: Goal[]
  tags: Tag[]
  categoryGroups: CategoryGroup[]
}) {
  const { format, currency, region } = useCurrency()
  const currencySymbol = React.useMemo(
    () =>
      new Intl.NumberFormat(regionLocale(region), {
        style: "currency",
        currency,
      }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency,
    [currency, region]
  )
  const [mode, setMode] = React.useState<SplitMode>("amount")
  const [splits, setSplits] = React.useState<SplitRow[]>([])
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (!transaction) return
    const half = round2(transaction.amount / 2)
    const first = createSplit(half, transaction.category)
    const second = createSplit(round2(transaction.amount - half), transaction.category)
    setSplits([first, second])
    setExpanded({ [first.id]: true })
    setMode("amount")
  }, [transaction])

  const total = transaction?.amount ?? 0
  const allocated = splits.reduce((sum, split) => sum + split.amount, 0)
  const remaining = round2(total - allocated)
  const hasInvalidAmounts = splits.some((split) => split.amount <= 0)
  const canSplit =
    splits.length >= 2 && !hasInvalidAmounts && Math.abs(remaining) < 0.005
  const allocatedPercent = total > 0
    ? Math.min(100, Math.max(0, (allocated / total) * 100))
    : 0

  function updateSplit(id: string, patch: Partial<SplitRow>) {
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function setAmountFromInput(id: string, raw: string) {
    const value = Number.parseFloat(raw)
    const parsed = Number.isNaN(value) ? 0 : value
    const amount = mode === "percent" ? (parsed / 100) * total : parsed
    updateSplit(id, { amount: round2(amount) })
  }

  function addSplit() {
    if (!transaction) return
    const next = createSplit(Math.max(remaining, 0), transaction.category)
    setSplits((prev) => [...prev, next])
    setExpanded((prev) => ({ ...prev, [next.id]: true }))
  }

  function removeSplit(id: string) {
    setSplits((prev) => prev.filter((s) => s.id !== id))
  }

  function balanceSplits() {
    setSplits((prev) => {
      const last = prev.at(-1)
      if (!last) return prev
      const nextAmount = round2(last.amount + remaining)
      if (nextAmount <= 0) return prev
      return prev.map((split) =>
        split.id === last.id ? { ...split, amount: nextAmount } : split
      )
    })
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSplit() {
    if (!transaction || !canSplit) return
    onSplit(transaction, splits)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Split transaction</DialogTitle>
          <DialogDescription>
            Splitting a transaction will create individual transactions that
            you can categorize and manage separately.
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
            <div>
              <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Original
              </p>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{transaction.description}</span>
                  <span className="text-xs text-muted-foreground">
                    {accountName(transaction.accountId, accounts)}
                  </span>
                </div>
                {transaction.category && (
                  <Badge variant="secondary" className="font-normal">
                    {transaction.category}
                  </Badge>
                )}
                <span className="font-medium tabular-nums">
                  {format(total)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Splits
              </p>
              <ToggleGroup
                multiple={false}
                value={[mode]}
                onValueChange={(value) => {
                  if (value[0]) setMode(value[0] as SplitMode)
                }}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="amount">By Amount</ToggleGroupItem>
                <ToggleGroupItem value="percent">By Percent</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Allocated</span>
                <span className="font-medium tabular-nums">
                  {format(allocated)} <span className="text-muted-foreground">of {format(total)}</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    Math.abs(remaining) < 0.005 ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{ width: `${allocatedPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {splits.map((split, index) => (
                <div key={split.id} className="rounded-lg border">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleExpanded(split.id)}
                    >
                      {expanded[split.id] ? <ChevronDown /> : <ChevronRight />}
                      <span className="sr-only">Toggle split details</span>
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Split {index + 1}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {transaction.description}
                      </p>
                    </div>
                    <CategorySelect
                      groups={categoryGroups}
                      value={split.category ?? undefined}
                      onValueChange={(v) => updateSplit(split.id, { category: v })}
                      size="sm"
                      className="order-last w-[calc(100%-2.5rem)] sm:order-none sm:w-36"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
                        {mode === "percent" ? "%" : currencySymbol}
                      </span>
                      <Input
                        aria-label={`${mode === "percent" ? "Percentage" : "Amount"} for split ${index + 1}`}
                        inputMode="decimal"
                        className="pl-8 text-right tabular-nums"
                        value={
                          mode === "percent"
                            ? total
                              ? (Math.round((split.amount / total) * 1000) / 10).toString()
                              : "0"
                            : split.amount.toString()
                        }
                        onChange={(e) => setAmountFromInput(split.id, e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeSplit(split.id)}
                      disabled={splits.length <= 2}
                    >
                      <Trash2 />
                      <span className="sr-only">Remove split</span>
                    </Button>
                  </div>
                  {expanded[split.id] && (
                    <div className="grid gap-3 border-t px-3 py-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Tags
                        </span>
                        <SplitTagPicker
                          selected={split.tagIds}
                          onChange={(tagIds) => updateSplit(split.id, { tagIds })}
                          tags={tags}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Link to goal
                        </span>
                        <Select
                          items={{
                            none: "No goal",
                            ...Object.fromEntries(goals.map((g) => [g.id, g.name])),
                          }}
                          value={split.goalId ?? "none"}
                          onValueChange={(v) =>
                            updateSplit(split.id, { goalId: v === "none" ? null : v })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No goal</SelectItem>
                            {goals.map((goal) => (
                              <SelectItem key={goal.id} value={goal.id}>
                                {goal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Review status
                        </span>
                        <Select
                          items={{
                            none: "No status",
                            ...Object.fromEntries(
                              statuses.map((s) => [s, statusMeta[s].label])
                            ),
                          }}
                          value={split.status ?? "none"}
                          onValueChange={(v) =>
                            updateSplit(split.id, {
                              status: v === "none" ? null : (v as TransactionStatus),
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="No status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No status</SelectItem>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusMeta[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          Notes
                        </span>
                        <Textarea
                          placeholder="Add notes…"
                          value={split.notes}
                          onChange={(e) =>
                            updateSplit(split.id, { notes: e.target.value })
                          }
                          className="min-h-16"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-3">
                        <Switch
                          checked={split.hidden}
                          onCheckedChange={(checked) =>
                            updateSplit(split.id, { hidden: checked })
                          }
                        />
                        <span className="text-sm">Move to Hidden</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSplit}
              className="w-fit"
            >
              <Plus />
              Add a split
            </Button>

            {Math.abs(remaining) >= 0.005 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={balanceSplits}
                className="w-fit"
                disabled={splits.length === 0 || splits.at(-1)!.amount + remaining <= 0}
              >
                Apply {format(Math.abs(remaining))} {remaining > 0 ? "remaining" : "overage"} to last split
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-3 border-t pt-4 sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onOpenChange(false)}
          >
            Discard splits
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end text-right leading-tight">
              <span
                className={cn(
                  "font-medium tabular-nums",
                  remaining !== 0 && "text-destructive"
                )}
              >
                {format(Math.abs(remaining))}
              </span>
              <span className="text-xs text-muted-foreground">
                {hasInvalidAmounts
                  ? "each split must be greater than zero"
                  : remaining < 0
                    ? "over allocated"
                    : "left to split"}
              </span>
            </div>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="button" disabled={!canSplit} onClick={handleSplit}>
              Split into {splits.length} transactions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
