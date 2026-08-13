"use client"

import * as React from "react"

import { DEFAULT_CURRENCY, DEFAULT_REGION, regionLocale } from "@/lib/currency"

type CurrencyContextValue = {
  currency: string
  region: string
  valuesHidden: boolean
  toggleValuesHidden: () => void
  format: (amount: number) => string
}

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({
  currency = DEFAULT_CURRENCY,
  region = DEFAULT_REGION,
  children,
}: {
  currency?: string
  region?: string
  children: React.ReactNode
}) {
  const [valuesHidden, setValuesHidden] = React.useState(false)

  React.useEffect(() => {
    setValuesHidden(window.localStorage.getItem("zent-hide-values") === "true")
  }, [])

  const toggleValuesHidden = React.useCallback(() => {
    setValuesHidden((current) => {
      const next = !current
      window.localStorage.setItem("zent-hide-values", String(next))
      return next
    })
  }, [])

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.key.toLowerCase() !== "h") return
      event.preventDefault()
      toggleValuesHidden()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleValuesHidden])

  const value = React.useMemo<CurrencyContextValue>(() => {
    const locale = regionLocale(region)
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    })
    return {
      currency,
      region,
      valuesHidden,
      toggleValuesHidden,
      format: (amount: number) => valuesHidden ? "••••" : formatter.format(amount),
    }
  }, [currency, region, toggleValuesHidden, valuesHidden])

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider")
  return ctx
}
