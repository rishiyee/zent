"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react"

import { importTransactions } from "@/app/(dashboard)/transactions/actions"
import { CategoryGroup, flattenCategoryNames } from "@/lib/categories"
import {
  ColumnMapping,
  DraftRow,
  buildDraftRows,
  detectColumnMapping,
  parseCsv,
} from "@/lib/csv"
import { queryKeys } from "@/lib/query-keys"
import {
  CategoryRule,
  Transaction,
  TransactionAccountOption,
  UNCATEGORIZED,
  transactionAccountOptions,
} from "@/lib/transactions"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { CategorySelect } from "@/components/transactions/category-select"
import { useCurrency } from "@/components/currency-provider"

type Step = "upload" | "map" | "review" | "confirm"
type ReviewFilter = "all" | "new" | "duplicate" | "error"
type MappingTarget =
  | "ignore"
  | "date"
  | "description"
  | "amount"
  | "debit"
  | "credit"
  | "type"
  | "category"

const STEPS: { id: Step; label: string; description: string }[] = [
  {
    id: "upload",
    label: "Upload",
    description: "Upload a CSV export from your bank or any spreadsheet.",
  },
  {
    id: "map",
    label: "Map columns",
    description: "Match your file's columns to the fields Zent expects.",
  },
  {
    id: "review",
    label: "Review",
    description: "Review, edit, or exclude rows before importing.",
  },
  {
    id: "confirm",
    label: "Confirm",
    description: "Choose the destination account and confirm.",
  },
]

const MAPPING_TARGET_LABELS: Record<Exclude<MappingTarget, "ignore">, string> = {
  date: "Date",
  description: "Description",
  amount: "Amount",
  debit: "Debit",
  credit: "Credit",
  type: "Type",
  category: "Category",
}

function csvField(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function downloadTemplate(categoryGroups: CategoryGroup[]) {
  const expenseCategory =
    categoryGroups.find((g) => g.type === "expense")?.categories[0]?.name ?? "Groceries"
  const incomeCategory =
    categoryGroups.find((g) => g.type === "income")?.categories[0]?.name ?? "Salary"

  const csv = [
    "Date,Description,Amount,Category",
    `2026-01-15,${csvField("Example expense")},-54.32,${csvField(expenseCategory)}`,
    `2026-01-16,${csvField("Example income")},2500.00,${csvField(incomeCategory)}`,
  ].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "transactions-template.csv"
  link.click()
  URL.revokeObjectURL(url)
}

function targetForColumn(mapping: ColumnMapping, index: number): MappingTarget {
  if (mapping.date === index) return "date"
  if (mapping.description === index) return "description"
  if (mapping.amount === index) return "amount"
  if (mapping.debit === index) return "debit"
  if (mapping.credit === index) return "credit"
  if (mapping.type === index) return "type"
  if (mapping.category === index) return "category"
  return "ignore"
}

function setTarget(mapping: ColumnMapping, index: number, target: MappingTarget): ColumnMapping {
  const cleared: ColumnMapping = {
    ...mapping,
    date: mapping.date === index ? null : mapping.date,
    description: mapping.description === index ? null : mapping.description,
    amount: mapping.amount === index ? null : mapping.amount,
    debit: mapping.debit === index ? null : mapping.debit,
    credit: mapping.credit === index ? null : mapping.credit,
    type: mapping.type === index ? null : mapping.type,
    category: mapping.category === index ? null : mapping.category,
  }
  if (target === "ignore") return cleared
  return { ...cleared, [target]: index }
}

function Stepper({ step }: { step: Step }) {
  const activeIndex = STEPS.findIndex((s) => s.id === step)
  return (
    <div className="flex items-start" aria-label={`Step ${activeIndex + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                i < activeIndex
                  ? "bg-primary text-primary-foreground"
                  : i === activeIndex
                    ? "border-2 border-primary text-primary"
                    : "border border-border text-muted-foreground"
              )}
            >
              {i < activeIndex ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "truncate text-xs sm:text-sm",
                i === activeIndex ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
        </React.Fragment>
      ))}
    </div>
  )
}

function UploadStep({
  fileName,
  rowCount,
  loading,
  dragActive,
  onDragActiveChange,
  onFileInput,
  onDrop,
  onDownloadTemplate,
}: {
  fileName: string | null
  rowCount: number
  loading: boolean
  dragActive: boolean
  onDragActiveChange: (active: boolean) => void
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void
  onDownloadTemplate: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          onDragActiveChange(true)
        }}
        onDragLeave={() => onDragActiveChange(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {loading ? <Loader2 className="size-6 animate-spin" /> : fileName ? <FileSpreadsheet className="size-6" /> : <Upload className="size-6" />}
        </div>
        <span className="text-sm font-medium">
          {loading ? "Reading your file…" : fileName ?? "Drop your CSV here, or click to browse"}
        </span>
        <span className="text-xs text-muted-foreground">
          Any header names are fine — you&apos;ll map columns next.
        </span>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFileInput} />
      </label>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto self-center"
        onClick={onDownloadTemplate}
      >
        <Download />
        Download CSV template
      </Button>
    </div>
  )
}

function MapStep({
  header,
  firstDataRow,
  mapping,
  onMappingChange,
  accounts,
  accountId,
  onAccountIdChange,
}: {
  header: string[]
  firstDataRow: string[]
  mapping: ColumnMapping
  onMappingChange: (mapping: ColumnMapping) => void
  accounts: TransactionAccountOption[]
  accountId: string
  onAccountIdChange: (id: string) => void
}) {
  const availableTargets: MappingTarget[] =
    mapping.amountMode === "split"
      ? ["ignore", "date", "description", "debit", "credit", "type", "category"]
      : ["ignore", "date", "description", "amount", "type", "category"]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Import into account</Label>
        <Select
          items={Object.fromEntries(
            transactionAccountOptions(accounts).map((a) => [a.id, a.name])
          )}
          value={accountId}
          onValueChange={(v) => v && onAccountIdChange(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {transactionAccountOptions(accounts).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used to check for duplicates against this account&apos;s existing transactions.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Separate Debit/Credit columns</span>
          <span className="text-sm text-muted-foreground">
            Turn on if your file has two amount columns instead of one signed Amount column.
          </span>
        </div>
        <Switch
          checked={mapping.amountMode === "split"}
          onCheckedChange={(checked) =>
            onMappingChange({
              ...mapping,
              amountMode: checked ? "split" : "single",
              amount: null,
              debit: null,
              credit: null,
            })
          }
        />
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CSV column</TableHead>
              <TableHead>Maps to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {header.map((columnName, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{columnName || `Column ${index + 1}`}</span>
                    {firstDataRow[index] && (
                      <span className="truncate text-xs text-muted-foreground">
                        e.g. {firstDataRow[index]}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    items={Object.fromEntries(
                      availableTargets.map((t) => [
                        t,
                        t === "ignore" ? "— Ignore —" : MAPPING_TARGET_LABELS[t],
                      ])
                    )}
                    value={targetForColumn(mapping, index)}
                    onValueChange={(v) =>
                      v && onMappingChange(setTarget(mapping, index, v as MappingTarget))
                    }
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargets.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t === "ignore" ? "— Ignore —" : MAPPING_TARGET_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ReviewStep({
  rows,
  counts,
  filter,
  onFilterChange,
  onUpdateRow,
  onSelectAll,
  categoryGroups,
}: {
  rows: DraftRow[]
  counts: { new: number; duplicate: number; error: number }
  filter: ReviewFilter
  onFilterChange: (filter: ReviewFilter) => void
  onUpdateRow: (id: string, patch: Partial<DraftRow>) => void
  onSelectAll: (included: boolean) => void
  categoryGroups: CategoryGroup[]
}) {
  const total = counts.new + counts.duplicate + counts.error
  const chips: { id: ReviewFilter; label: string }[] = [
    { id: "all", label: `All (${total})` },
    { id: "new", label: `New (${counts.new})` },
    { id: "duplicate", label: `Duplicates (${counts.duplicate})` },
    { id: "error", label: `Errors (${counts.error})` },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "new" as const, value: counts.new, label: "Ready", color: "text-emerald-600" },
          { id: "duplicate" as const, value: counts.duplicate, label: "Duplicates", color: "text-amber-600" },
          { id: "error" as const, value: counts.error, label: "Need attention", color: "text-destructive" },
        ].map((item) => (
          <button key={item.id} type="button" onClick={() => onFilterChange(item.id)} className={cn("rounded-lg border p-3 text-left transition-colors hover:bg-muted/50", filter === item.id && "border-primary bg-primary/5")}>
            <p className={cn("text-xl font-semibold tabular-nums", item.color)}>{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <Button
            key={chip.id}
            type="button"
            size="sm"
            variant={filter === chip.id ? "default" : "outline"}
            onClick={() => onFilterChange(chip.id)}
          >
            {chip.label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => onSelectAll(true)}>
            Select all
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onSelectAll(false)}>
            Select none
          </Button>
        </div>
      </div>

      <div className="max-h-[42vh] overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No rows match this filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Checkbox
                      checked={row.included}
                      onCheckedChange={(v) => onUpdateRow(row.id, { included: !!v })}
                      aria-label={`Include ${row.description || "row"}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => onUpdateRow(row.id, { date: e.target.value })}
                      className="h-8 w-36"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.description}
                      onChange={(e) => onUpdateRow(row.id, { description: e.target.value })}
                      className="h-8 min-w-40"
                    />
                  </TableCell>
                  <TableCell>
                    <CategorySelect
                      groups={categoryGroups}
                      value={row.category ?? UNCATEGORIZED}
                      onValueChange={(v) =>
                        onUpdateRow(row.id, { category: v === UNCATEGORIZED ? null : v })
                      }
                      size="sm"
                      className="w-40"
                      leadingOptions={[{ value: UNCATEGORIZED, label: "Uncategorized" }]}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        items={{ income: "+", expense: "-" }}
                        value={row.type}
                        onValueChange={(v) =>
                          v && onUpdateRow(row.id, { type: v as "income" | "expense" })
                        }
                      >
                        <SelectTrigger size="sm" className="w-14">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">+</SelectItem>
                          <SelectItem value="expense">-</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => onUpdateRow(row.id, { amount: e.target.value })}
                        className="h-8 w-24 text-right"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.rowErrors.length > 0 ? (
                      <Badge variant="outline" className="gap-1 text-destructive">
                        <AlertTriangle className="size-3" />
                        {row.rowErrors[0]}
                      </Badge>
                    ) : row.duplicateOf ? (
                      <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                        <Copy className="size-3" />
                        Possible duplicate
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
                        New
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ConfirmStep({
  accountName,
  includedCount,
  totalCount,
  adjustBalance,
  onAdjustBalanceChange,
  disableAdjustBalance,
  netAmount,
  formatCurrency,
}: {
  accountName: string
  includedCount: number
  totalCount: number
  adjustBalance: boolean
  onAdjustBalanceChange: (value: boolean) => void
  disableAdjustBalance: boolean
  netAmount: number
  formatCurrency: (amount: number) => string
}) {
  const excluded = totalCount - includedCount
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-3">
        <div><p className="text-xs text-muted-foreground">Transactions</p><p className="mt-1 text-xl font-semibold tabular-nums">{includedCount}</p></div>
        <div><p className="text-xs text-muted-foreground">Destination</p><p className="mt-1 truncate font-medium">{accountName}</p></div>
        <div><p className="text-xs text-muted-foreground">Net change</p><p className={cn("mt-1 text-xl font-semibold tabular-nums", netAmount >= 0 && "text-emerald-600")}>{netAmount >= 0 ? "+" : "−"}{formatCurrency(Math.abs(netAmount))}</p></div>
        {excluded > 0 && (
          <span className="text-xs text-muted-foreground sm:col-span-3">
            {excluded} row{excluded === 1 ? "" : "s"} excluded.
          </span>
        )}
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Nothing is imported until you press the final button. Imported transactions can still be edited later.
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            Adjust account&apos;s balance based on these transactions
          </span>
          <span className="text-sm text-muted-foreground">
            Updates the account&apos;s balance by the net amount imported.
          </span>
        </div>
        <Switch
          checked={adjustBalance}
          onCheckedChange={onAdjustBalanceChange}
          disabled={disableAdjustBalance}
        />
      </div>
    </div>
  )
}

export function BulkImportWizard({
  accounts,
  categoryGroups,
  rules,
  transactions,
}: {
  accounts: TransactionAccountOption[]
  categoryGroups: CategoryGroup[]
  rules: CategoryRule[]
  transactions: Transaction[]
}) {
  const queryClient = useQueryClient()
  const { format: formatCurrency } = useCurrency()

  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<Step>("upload")
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [table, setTable] = React.useState<string[][]>([])
  const [mapping, setMapping] = React.useState<ColumnMapping | null>(null)
  const [accountId, setAccountId] = React.useState(
    () => transactionAccountOptions(accounts)[0]?.id ?? "CASH"
  )
  const [draftRows, setDraftRows] = React.useState<DraftRow[]>([])
  const [reviewFilter, setReviewFilter] = React.useState<ReviewFilter>("all")
  const [adjustBalance, setAdjustBalance] = React.useState(true)
  const [importing, setImporting] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const [loadingFile, setLoadingFile] = React.useState(false)

  function reset() {
    setStep("upload")
    setFileName(null)
    setTable([])
    setMapping(null)
    setDraftRows([])
    setReviewFilter("all")
    setImporting(false)
    setDragActive(false)
    setLoadingFile(false)
  }

  async function loadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.add({ title: "Choose a CSV file", description: "Other spreadsheet formats aren’t supported yet.", type: "error" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.add({ title: "That file is too large", description: "CSV files must be 10 MB or smaller.", type: "error" })
      return
    }
    setLoadingFile(true)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (parsed.length < 2) {
        toast.add({ title: "No transactions found", description: "Add a header and at least one data row.", type: "error" })
        return
      }
      setFileName(file.name)
      setTable(parsed)
      setMapping(detectColumnMapping(parsed[0]))
      setStep("map")
    } finally {
      setLoadingFile(false)
    }
  }

  async function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) await loadFile(file)
  }

  async function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) await loadFile(file)
  }

  const header = table[0] ?? []
  const firstDataRow = table[1] ?? []

  const mappingComplete =
    !!mapping &&
    mapping.date !== null &&
    mapping.description !== null &&
    (mapping.amountMode === "single"
      ? mapping.amount !== null
      : mapping.debit !== null || mapping.credit !== null)

  function handleBuildRows() {
    if (!mapping) return
    const knownCategories = flattenCategoryNames(categoryGroups)
    const rows = buildDraftRows(table, mapping, knownCategories, rules, transactions, accountId)
    setDraftRows(rows)
    setReviewFilter("all")
    setStep("review")
  }

  function updateRow(id: string, patch: Partial<DraftRow>) {
    setDraftRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const counts = {
    new: draftRows.filter((r) => r.rowErrors.length === 0 && !r.duplicateOf).length,
    duplicate: draftRows.filter((r) => r.duplicateOf).length,
    error: draftRows.filter((r) => r.rowErrors.length > 0).length,
  }

  const visibleRows = draftRows.filter((r) => {
    if (reviewFilter === "new") return r.rowErrors.length === 0 && !r.duplicateOf
    if (reviewFilter === "duplicate") return !!r.duplicateOf
    if (reviewFilter === "error") return r.rowErrors.length > 0
    return true
  })

  const includedCount = draftRows.filter((r) => r.included).length
  const netAmount = draftRows
    .filter((r) => r.included)
    .reduce(
      (sum, row) => sum + (row.type === "income" ? 1 : -1) * (Number.parseFloat(row.amount) || 0),
      0
    )
  const accountName =
    transactionAccountOptions(accounts).find((a) => a.id === accountId)?.name ?? "account"

  async function handleImport() {
    const included = draftRows.filter((r) => r.included)
    if (!included.length) return
    setImporting(true)
    try {
      const rows = included.map((r) => ({
        date: r.date,
        description: r.description,
        amount: Number.parseFloat(r.amount) || 0,
        type: r.type,
        category: r.category,
      }))
      const count = await importTransactions(rows, accountId, adjustBalance)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
      toast.add({
        title: `Imported ${count} transaction${count === 1 ? "" : "s"}`,
        type: "success",
      })
      setOpen(false)
      reset()
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Import failed",
        type: "error",
      })
    } finally {
      setImporting(false)
    }
  }

  const activeStep = STEPS.find((s) => s.id === step)!

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Upload />
        Bulk Import
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Bulk import transactions</DialogTitle>
          <DialogDescription>{activeStep.description}</DialogDescription>
        </DialogHeader>

        <Stepper step={step} />

        <div className="flex flex-col gap-4">
          {step === "upload" && (
            <UploadStep
              fileName={fileName}
              rowCount={Math.max(0, table.length - 1)}
              loading={loadingFile}
              dragActive={dragActive}
              onDragActiveChange={setDragActive}
              onFileInput={handleFileInput}
              onDrop={handleDrop}
              onDownloadTemplate={() => downloadTemplate(categoryGroups)}
            />
          )}

          {step === "map" && mapping && (
            <MapStep
              header={header}
              firstDataRow={firstDataRow}
              mapping={mapping}
              onMappingChange={setMapping}
              accounts={accounts}
              accountId={accountId}
              onAccountIdChange={setAccountId}
            />
          )}

          {step === "review" && (
            <ReviewStep
              rows={visibleRows}
              counts={counts}
              filter={reviewFilter}
              onFilterChange={setReviewFilter}
              onUpdateRow={updateRow}
              onSelectAll={(included) =>
                setDraftRows((prev) => prev.map((r) => ({ ...r, included })))
              }
              categoryGroups={categoryGroups}
            />
          )}

          {step === "confirm" && (
            <ConfirmStep
              accountName={accountName}
              includedCount={includedCount}
              totalCount={draftRows.length}
              adjustBalance={adjustBalance}
              onAdjustBalanceChange={setAdjustBalance}
              disableAdjustBalance={accountId === "CASH"}
              netAmount={netAmount}
              formatCurrency={formatCurrency}
            />
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div>
            {step !== "upload" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (step === "map") setStep("upload")
                  else if (step === "review") setStep("map")
                  else if (step === "confirm") setStep("review")
                }}
              >
                <ArrowLeft />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            {step === "map" && (
              <Button type="button" disabled={!mappingComplete} onClick={handleBuildRows}>
                Review import ({includedCount})
                <ArrowRight />
              </Button>
            )}
            {step === "review" && (
              <Button type="button" disabled={!includedCount} onClick={() => setStep("confirm")}>
                Next
                <ArrowRight />
              </Button>
            )}
            {step === "confirm" && (
              <Button type="button" disabled={!includedCount || importing} onClick={handleImport}>
                {importing ? "Importing…" : `Import ${includedCount}`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
