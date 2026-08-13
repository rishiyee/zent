"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"

import { materializeRecurringSchedules } from "@/app/(dashboard)/settings/merchants/recurring-actions"
import { queryKeys } from "@/lib/query-keys"

export function RecurringMaterializer() {
  const queryClient = useQueryClient()
  React.useEffect(() => {
    const today = new Date()
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    void materializeRecurringSchedules(localDate).then((count) => {
      if (!count) return
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts })
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards })
    })
  }, [queryClient])
  return null
}
