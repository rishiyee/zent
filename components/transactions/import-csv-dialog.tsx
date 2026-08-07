"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Paperclip, Upload } from "lucide-react"

import { importTransactions } from "@/app/(dashboard)/transactions/actions"
import { CategoryGroup, flattenCategoryNames } from "@/lib/categories"
import { ParsedTransactionRow, parseTransactionsCsv } from "@/lib/csv"
import { queryKeys } from "@/lib/query-keys"
import {
  TransactionAccountOption,
  transactionAccountOptions,
} from "@/lib/transactions"
import { useCurrency } from "@/components/currency-provider"
import { Button } from "@/components/ui/button"
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

const PREVIEW_LIMIT = 8

export function ImportCsvDialog({
  accounts,
  categoryGroups,
}: {
  accounts: TransactionAccountOption[]
  categoryGroups: CategoryGroup[]
}) {
  const { format } = useCurrency()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<ParsedTransactionRow[]>([])
  const [errors, setErrors] = React.useState<string[]>([])
  const [accountId, setAccountId] = React.useState(
    () => transactionAccountOptions(accounts)[0]?.id ?? "CASH"
  )
  const [adjustBalance, setAdjustBalance] = React.useState(true)
  const [importing, setImporting] = React.useState(false)

  function reset() {
    setFileName(null)
    setRows([])
    setErrors([])
    setImporting(false)
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setFileName(file.name)
    const text = await file.text()
    const knownCategories = flattenCategoryNames(categoryGroups)
    const result = parseTransactionsCsv(text, knownCategories)
    setRows(result.rows)
    setErrors(result.errors)
  }

  async function handleImport() {
    if (!rows.length) return
    setImporting(true)
    try {
      const count = await importTransactions(rows, accountId, adjustBalance)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
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
        Import CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload CSV</DialogTitle>
          <DialogDescription>
            Needs a header row with at least{" "}
            <span className="font-medium text-foreground">Date</span>,{" "}
            <span className="font-medium text-foreground">Description</span>,
            and <span className="font-medium text-foreground">Amount</span>{" "}
            columns. An optional{" "}
            <span className="font-medium text-foreground">Category</span>{" "}
            column is matched against your existing categories.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm">
              {fileName ?? "Choose a CSV file…"}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>

          {errors.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errors.slice(0, 5).map((error, i) => (
                <span key={i}>{error}</span>
              ))}
              {errors.length > 5 && <span>…and {errors.length - 5} more.</span>}
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div className="max-h-64 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, PREVIEW_LIMIT).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{row.date}</TableCell>
                        <TableCell className="font-medium">{row.description}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.category ?? "Uncategorized"}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${
                            row.type === "income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {row.type === "income" ? "+" : "-"}
                          {format(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground">
                {rows.length} transaction{rows.length === 1 ? "" : "s"} found
                {rows.length > PREVIEW_LIMIT
                  ? ` (showing first ${PREVIEW_LIMIT})`
                  : ""}
                .
              </p>

              <div className="flex flex-col gap-2">
                <Label>Import into account</Label>
                <Select
                  items={Object.fromEntries(
                    transactionAccountOptions(accounts).map((account) => [
                      account.id,
                      account.name,
                    ])
                  )}
                  value={accountId}
                  onValueChange={(v) => v && setAccountId(v)}
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
                  onCheckedChange={setAdjustBalance}
                  disabled={accountId === "CASH"}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={!rows.length || importing}
            onClick={handleImport}
          >
            {importing ? "Adding…" : "Add to account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
