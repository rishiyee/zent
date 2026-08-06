"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export function PayeeCombobox({
  value,
  onChange,
  merchants,
  placeholder,
  id,
}: {
  value: string
  onChange: (value: string) => void
  merchants: string[]
  placeholder?: string
  id?: string
}) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase()
    const list = q
      ? merchants.filter((m) => m.toLowerCase().includes(q))
      : merchants
    return list.slice(0, 8)
  }, [value, merchants])

  const exactMatch = merchants.some(
    (m) => m.toLowerCase() === value.trim().toLowerCase()
  )
  const showCreate = value.trim().length > 0 && !exactMatch

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        required
      />
      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.map((merchant) => (
              <button
                key={merchant}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(merchant)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  merchant.toLowerCase() === value.trim().toLowerCase() &&
                    "bg-accent text-accent-foreground"
                )}
              >
                {merchant}
              </button>
            ))}
            {showCreate && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="size-3.5" />
                Use &ldquo;{value.trim()}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
