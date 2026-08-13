"use client"

import { Eye, EyeOff } from "lucide-react"

import { useCurrency } from "@/components/currency-provider"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function PrivacyToggle() {
  const { valuesHidden, toggleValuesHidden } = useCurrency()
  const label = valuesHidden ? "Show number values" : "Hide number values"

  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={toggleValuesHidden} aria-label={label} />}>
        {valuesHidden ? <EyeOff /> : <Eye />}
      </TooltipTrigger>
      <TooltipContent>{label} (Ctrl/Cmd + Shift + H)</TooltipContent>
    </Tooltip>
  )
}
