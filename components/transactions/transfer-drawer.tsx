"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Transaction, TransactionAccountOption } from "@/lib/transactions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function TransferDrawer({
  accounts,
  open,
  onOpenChange,
  onSave,
  transaction = null,
  onUpdate,
}: {
  accounts: TransactionAccountOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (transaction: Omit<Transaction, "id">) => void
  transaction?: Transaction | null
  onUpdate?: (id: string, patch: Partial<Transaction>) => void
}) {
  const [amount, setAmount] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [fromAccountId, setFromAccountId] = React.useState(accounts[0]?.id ?? "")
  const [toAccountId, setToAccountId] = React.useState(accounts[1]?.id ?? "")
  const [notes, setNotes] = React.useState("")
  const [wasOpen, setWasOpen] = React.useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setAmount(transaction ? String(transaction.amount) : "")
      setDate(
        transaction
          ? new Date(`${transaction.date}T00:00:00`)
          : new Date()
      )
      setFromAccountId(transaction?.accountId ?? accounts[0]?.id ?? "")
      setToAccountId(
        transaction?.transferToAccountId ?? accounts[1]?.id ?? accounts[0]?.id ?? ""
      )
      setNotes(transaction?.notes ?? "")
    }
  }

  const parsedAmount = Number.parseFloat(amount)
  const canSubmit =
    !!fromAccountId &&
    !!toAccountId &&
    fromAccountId !== toAccountId &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !!date

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || !date) return

    const toName = accounts.find((a) => a.id === toAccountId)?.name ?? "account"

    if (transaction && onUpdate) {
      onUpdate(transaction.id, {
        date: format(date, "yyyy-MM-dd"),
        description: `Transfer to ${toName}`,
        accountId: fromAccountId,
        amount: parsedAmount,
        notes: notes.trim() || undefined,
        transferToAccountId: toAccountId,
      })
    } else {
      onSave?.({
        date: format(date, "yyyy-MM-dd"),
        description: `Transfer to ${toName}`,
        category: "Transfer",
        accountId: fromAccountId,
        type: "expense",
        amount: parsedAmount,
        status: "reviewed",
        source: "manual",
        notes: notes.trim() || undefined,
        goalId: null,
        tagIds: [],
        transferToAccountId: toAccountId,
      })
    }
    onOpenChange(false)
  }

  return (
    <Drawer open={open} swipeDirection="right" onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>{transaction ? "Edit transfer" : "Transfer funds"}</DrawerTitle>
            <DrawerDescription>
              Move money between two of your accounts. Both balances update
              automatically.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="transfer-amount">Amount</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="transfer-date">Date</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id="transfer-date"
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start font-normal",
                          !date && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon />
                    {date ? format(date, "PPP") : "Today"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>From</Label>
              <Select
                items={Object.fromEntries(accounts.map((a) => [a.id, a.name]))}
                value={fromAccountId}
                onValueChange={(v) => v && setFromAccountId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>To</Label>
              <Select
                items={Object.fromEntries(
                  accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => [a.id, a.name])
                )}
                value={toAccountId}
                onValueChange={(v) => v && setToAccountId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-notes">Notes (optional)</Label>
              <Textarea
                id="transfer-notes"
                placeholder="Any extra detail for this transfer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={!canSubmit}>
              {transaction ? "Save changes" : "Transfer funds"}
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
