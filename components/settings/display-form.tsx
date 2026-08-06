"use client"

import * as React from "react"

import { updateDisplayPreferences } from "@/app/(dashboard)/settings/actions"
import { CURRENCIES, REGIONS } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"

export function DisplayForm({
  currency,
  region,
}: {
  currency: string
  region: string
}) {
  const [selectedCurrency, setSelectedCurrency] = React.useState(currency)
  const [selectedRegion, setSelectedRegion] = React.useState(region)
  const [pending, setPending] = React.useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      await updateDisplayPreferences({
        currency: selectedCurrency,
        region: selectedRegion,
      })
      toast.add({ title: "Display preferences updated", type: "success" })
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
    <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-xl border p-6">
      <h2 className="mb-6 text-lg font-semibold">Display</h2>
      <FieldGroup>
        <Field>
          <FieldLabel>Currency</FieldLabel>
          <Select
            items={Object.fromEntries(CURRENCIES.map((c) => [c.code, c.label]))}
            value={selectedCurrency}
            onValueChange={(v) => v && setSelectedCurrency(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Region</FieldLabel>
          <Select
            items={Object.fromEntries(REGIONS.map((r) => [r.code, r.label]))}
            value={selectedRegion}
            onValueChange={(v) => v && setSelectedRegion(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
