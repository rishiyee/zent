"use client"

import { MinimumPaymentType } from "@/lib/credit-cards"
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
    balance: "",
    creditLimit: "",
    apr: "",
    statementDay: "1",
    paymentDueDay: "21",
    minimumPaymentType: "fixed",
    minimumPaymentValue: "",
    autopay: false,
  }
}

export function CreditCardFormFields({
  value,
  onChange,
}: {
  value: CreditCardFormValue
  onChange: (patch: Partial<CreditCardFormValue>) => void
}) {
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
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-balance">Current balance</Label>
          <Input
            id="cc-balance"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={value.balance}
            onChange={(e) => onChange({ balance: e.target.value })}
            required
          />
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
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-statement-day">Statement closes on</Label>
          <Input
            id="cc-statement-day"
            type="number"
            inputMode="numeric"
            min="1"
            max="28"
            placeholder="Day of month"
            value={value.statementDay}
            onChange={(e) => onChange({ statementDay: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cc-due-day">Payment due on</Label>
          <Input
            id="cc-due-day"
            type="number"
            inputMode="numeric"
            min="1"
            max="28"
            placeholder="Day of month"
            value={value.paymentDueDay}
            onChange={(e) => onChange({ paymentDueDay: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
