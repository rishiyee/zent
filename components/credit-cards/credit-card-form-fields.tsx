"use client"

import { MinimumPaymentType } from "@/lib/credit-cards"
import { useCurrency } from "@/components/currency-provider"
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

export type CreditCardFormValue = {
  name: string
  balance: string
  creditLimit: string
  apr: string
  statementDay: string
  paymentDueDay: string
  minimumPaymentType: MinimumPaymentType
  minimumPaymentValue: string
  autopay: boolean
}

export function emptyCreditCardForm(): CreditCardFormValue {
  return {
    name: "",
    balance: "0",
    creditLimit: "",
    apr: "",
    statementDay: "1",
    paymentDueDay: "21",
    minimumPaymentType: "fixed",
    minimumPaymentValue: "",
    autopay: false,
  }
}

function ordinal(day: number): string {
  if (day % 10 === 1 && day !== 11) return `${day}st`
  if (day % 10 === 2 && day !== 12) return `${day}nd`
  if (day % 10 === 3 && day !== 13) return `${day}rd`
  return `${day}th`
}

const dayItems = Object.fromEntries(
  Array.from({ length: 28 }, (_, i) => i + 1).map((day) => [String(day), ordinal(day)])
)

export function CreditCardFormFields({
  value,
  onChange,
  balanceReadOnly = false,
}: {
  value: CreditCardFormValue
  onChange: (patch: Partial<CreditCardFormValue>) => void
  balanceReadOnly?: boolean
}) {
  const { format } = useCurrency()

  const balance = Number.parseFloat(value.balance)
  const creditLimit = Number.parseFloat(value.creditLimit)
  const hasValidRange =
    !Number.isNaN(balance) && !Number.isNaN(creditLimit) && creditLimit > 0
  const utilizationPct = hasValidRange
    ? Math.min(Math.round((balance / creditLimit) * 100), 999)
    : null

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cc-name">Card name</Label>
        <Input
          id="cc-name"
          placeholder="e.g. Chase Sapphire Preferred"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          autoFocus
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-balance">Amount currently owed</Label>
          <Input
            id="cc-balance"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={value.balance}
            onChange={(e) => onChange({ balance: e.target.value })}
            disabled={balanceReadOnly}
            required
          />
          {balanceReadOnly && (
            <p className="text-xs text-muted-foreground">
              Managed by card transactions and payments.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-limit">Credit limit</Label>
          <Input
            id="cc-limit"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={value.creditLimit}
            onChange={(e) => onChange({ creditLimit: e.target.value })}
            required
          />
        </div>
      </div>
      {hasValidRange && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {format(Math.max(creditLimit - balance, 0))} available credit
          </span>
          <span
            className={
              utilizationPct !== null && utilizationPct >= 90
                ? "font-medium text-destructive"
                : "font-medium text-muted-foreground"
            }
          >
            {utilizationPct}% of limit used
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-statement-day">Statement closes on</Label>
          <Select
            items={dayItems}
            value={value.statementDay}
            onValueChange={(next: string | null) => next && onChange({ statementDay: next })}
          >
            <SelectTrigger id="cc-statement-day" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dayItems).map(([day, label]) => (
                <SelectItem key={day} value={day}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-due-day">Payment due on</Label>
          <Select
            items={dayItems}
            value={value.paymentDueDay}
            onValueChange={(next: string | null) => next && onChange({ paymentDueDay: next })}
          >
            <SelectTrigger id="cc-due-day" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dayItems).map(([day, label]) => (
                <SelectItem key={day} value={day}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Day of the month (1st–28th) your statement closes and your payment is due — each recurs monthly.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Minimum payment</Label>
          <Select
            items={{ fixed: "Fixed amount", percent: "Percent of balance" }}
            value={value.minimumPaymentType}
            onValueChange={(next: MinimumPaymentType | null) =>
              next && onChange({ minimumPaymentType: next })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed amount</SelectItem>
              <SelectItem value="percent">Percent of balance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-min-payment">
            {value.minimumPaymentType === "fixed" ? "Amount" : "Percent"}
          </Label>
          <Input
            id="cc-min-payment"
            type="number"
            inputMode="decimal"
            min="0"
            step={value.minimumPaymentType === "fixed" ? "0.01" : "0.1"}
            placeholder={value.minimumPaymentType === "fixed" ? "0.00" : "0"}
            value={value.minimumPaymentValue}
            onChange={(e) => onChange({ minimumPaymentValue: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cc-apr">APR (optional)</Label>
        <Input
          id="cc-apr"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="e.g. 21.49"
          value={value.apr}
          onChange={(e) => onChange({ apr: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Autopay enabled</span>
          <span className="text-sm text-muted-foreground">
            Just a label for now — doesn&apos;t schedule anything.
          </span>
        </div>
        <Switch
          checked={value.autopay}
          onCheckedChange={(checked) => onChange({ autopay: checked })}
        />
      </div>
    </>
  )
}
