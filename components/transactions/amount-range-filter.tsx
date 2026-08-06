"use client"

import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type AmountRange = { min: string; max: string }

export function AmountRangeFilter({
  value,
  onChange,
}: {
  value: AmountRange
  onChange: (range: AmountRange) => void
}) {
  const active = value.min !== "" || value.max !== ""

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" className="border-dashed" />}
      >
        <SlidersHorizontal />
        Amount
        {active && (
          <span className="text-xs text-muted-foreground">
            {value.min || "0"}–{value.max || "∞"}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount-min">Min</Label>
            <Input
              id="amount-min"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              value={value.min}
              onChange={(e) => onChange({ ...value, min: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount-max">Max</Label>
            <Input
              id="amount-max"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="No limit"
              value={value.max}
              onChange={(e) => onChange({ ...value, max: e.target.value })}
            />
          </div>
          {active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ min: "", max: "" })}
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
