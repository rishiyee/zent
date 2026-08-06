"use client"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import {
  TransactionAccountOption,
  TransactionStatus,
  TransactionType,
  UNCATEGORIZED,
  statusMeta,
  transactionAccountOptions,
} from "@/lib/transactions"
import { CategoryGroup, flattenCategoryNames } from "@/lib/categories"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CategorySelect } from "@/components/transactions/category-select"
import { PayeeCombobox } from "@/components/transactions/payee-combobox"

export { UNCATEGORIZED }

export type TransactionFormValue = {
  date: Date | undefined
  description: string
  category: string
  accountId: string
  type: TransactionType
  amount: string
  status: TransactionStatus
  notes: string
}

export function TransactionFormFields({
  value,
  onChange,
  accounts,
  categoryGroups,
  merchants,
}: {
  value: TransactionFormValue
  onChange: (patch: Partial<TransactionFormValue>) => void
  accounts: TransactionAccountOption[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
}) {
  const categoryGroupsForType = categoryGroups.filter(
    (group) => group.type === value.type
  )

  function handleTypeChange(next: TransactionType) {
    const validNames = new Set(
      flattenCategoryNames(categoryGroups.filter((group) => group.type === next))
    )
    const categoryStillValid =
      value.category === UNCATEGORIZED || validNames.has(value.category)

    onChange({
      type: next,
      ...(categoryStillValid ? {} : { category: UNCATEGORIZED }),
    })
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Payee / description</Label>
        <PayeeCombobox
          id="description"
          placeholder="e.g. Whole Foods Market"
          value={value.description}
          onChange={(description) => onChange({ description })}
          merchants={merchants}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={value.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal",
                    !value.date && "text-muted-foreground"
                  )}
                />
              }
            >
              <CalendarIcon />
              {value.date ? format(value.date, "PPP") : "Today"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value.date}
                onSelect={(date) => onChange({ date })}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <Select
            items={{ expense: "Expense", income: "Income" }}
            value={value.type}
            onValueChange={(next: TransactionType | null) =>
              next && handleTypeChange(next)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            items={Object.fromEntries(
              Object.entries(statusMeta).map(([status, meta]) => [status, meta.label])
            )}
            value={value.status}
            onValueChange={(next: TransactionStatus | null) =>
              next && onChange({ status: next })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusMeta).map(([status, meta]) => (
                <SelectItem key={status} value={status}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <CategorySelect
            groups={categoryGroupsForType}
            value={value.category || UNCATEGORIZED}
            onValueChange={(next) => onChange({ category: next })}
            className="w-full"
            leadingOptions={[{ value: UNCATEGORIZED, label: "Uncategorized" }]}
          />
          <p className="text-xs text-muted-foreground">
            Showing {value.type} categories only.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Account</Label>
          <Select
            items={Object.fromEntries(
              transactionAccountOptions(accounts).map((account) => [
                account.id,
                account.name,
              ])
            )}
            value={value.accountId}
            onValueChange={(next: string | null) =>
              next && onChange({ accountId: next })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {transactionAccountOptions(accounts).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any extra detail for this transaction"
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
        />
      </div>
    </>
  )
}
