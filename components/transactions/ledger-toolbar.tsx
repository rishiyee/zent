"use client"

import Link from "next/link"
import { Wand2 } from "lucide-react"
import type { DateRange } from "react-day-picker"

import {
  CategoryRule,
  Transaction,
  TransactionAccountOption,
  TransactionStatus,
  UNCATEGORIZED,
  statusMeta,
  transactionAccountOptions,
} from "@/lib/transactions"
import { CategoryGroup, flattenCategoryNames } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddTransactionDrawer } from "@/components/transactions/add-transaction-drawer"
import { AmountRange, AmountRangeFilter } from "@/components/transactions/amount-range-filter"
import { BulkImportWizard } from "@/components/transactions/bulk-import-wizard"
import { DateRangeFilter } from "@/components/transactions/date-range-filter"
import { FacetedFilter } from "@/components/transactions/faceted-filter"
import { LedgerSort } from "@/components/transactions/ledger-table"

export type LedgerFilters = {
  search: string
  categories: string[]
  statuses: TransactionStatus[]
  accountIds: string[]
  dateRange: DateRange | undefined
  amount: AmountRange
}

export function emptyLedgerFilters(): LedgerFilters {
  return {
    search: "",
    categories: [],
    statuses: [],
    accountIds: [],
    dateRange: undefined,
    amount: { min: "", max: "" },
  }
}

const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export function LedgerToolbar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  rules,
  categoryGroups,
  merchants,
  onAdd,
  accounts,
  transactions,
  selectedCount,
  onBulkEdit,
  onClearSelection,
}: {
  filters: LedgerFilters
  onFiltersChange: (next: LedgerFilters) => void
  sort: LedgerSort
  onSortChange: (sort: LedgerSort) => void
  rules: CategoryRule[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
  onAdd: (transaction: Omit<Transaction, "id">) => void
  accounts: TransactionAccountOption[]
  transactions: Transaction[]
  selectedCount: number
  onBulkEdit: () => void
  onClearSelection: () => void
}) {
  const accountOptions = transactionAccountOptions(accounts).map((account) => ({
    value: account.id,
    label: account.name,
  }))

  const categoryOptions = [
    { value: UNCATEGORIZED, label: "Uncategorized" },
    ...flattenCategoryNames(categoryGroups).map((category) => ({
      value: category,
      label: category,
    })),
  ]

  const isFiltered =
    filters.search !== "" ||
    filters.categories.length > 0 ||
    filters.statuses.length > 0 ||
    filters.accountIds.length > 0 ||
    !!filters.dateRange?.from ||
    filters.amount.min !== "" ||
    filters.amount.max !== ""

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search payee or notes..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="h-8 w-full sm:w-56"
        />
        <FacetedFilter
          title="Status"
          options={statusOptions}
          selected={filters.statuses}
          onChange={(values) =>
            onFiltersChange({ ...filters, statuses: values as TransactionStatus[] })
          }
        />
        <FacetedFilter
          title="Category"
          options={categoryOptions}
          selected={filters.categories}
          onChange={(values) => onFiltersChange({ ...filters, categories: values })}
        />
        <FacetedFilter
          title="Account"
          options={accountOptions}
          selected={filters.accountIds}
          onChange={(values) => onFiltersChange({ ...filters, accountIds: values })}
        />
        <DateRangeFilter
          value={filters.dateRange}
          onChange={(range) => onFiltersChange({ ...filters, dateRange: range })}
        />
        <AmountRangeFilter
          value={filters.amount}
          onChange={(amount) => onFiltersChange({ ...filters, amount })}
        />
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={() => onFiltersChange(emptyLedgerFilters())}>
            Reset filters
          </Button>
        )}
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <Select
            items={{
              "date-desc": "Newest first",
              "amount-desc": "Amount: high to low",
              "amount-asc": "Amount: low to high",
            }}
            value={sort}
            onValueChange={(v) => v && onSortChange(v as LedgerSort)}
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest first</SelectItem>
              <SelectItem value="amount-desc">Amount: high to low</SelectItem>
              <SelectItem value="amount-asc">Amount: low to high</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/settings/rules" />}
          >
            <Wand2 />
            Rules
          </Button>
          <BulkImportWizard
            accounts={accounts}
            categoryGroups={categoryGroups}
            rules={rules}
            transactions={transactions}
          />
          <AddTransactionDrawer
            onAdd={onAdd}
            rules={rules}
            accounts={accounts}
            categoryGroups={categoryGroups}
            merchants={merchants}
          />
        </div>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onBulkEdit}>
              Bulk edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
