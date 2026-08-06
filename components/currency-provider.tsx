"use client"

import * as React from "react"

import { DEFAULT_CURRENCY, DEFAULT_REGION, regionLocale } from "@/lib/currency"

type CurrencyContextValue = {
  currency: string
  region: string
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
  const value = React.useMemo<CurrencyContextValue>(() => {
    const locale = regionLocale(region)
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    })
    return { currency, region, format: (amount: number) => formatter.format(amount) }
  }, [currency, region])

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext)
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider")
  return ctx
}
