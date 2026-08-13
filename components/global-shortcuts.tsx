"use client"

import * as React from "react"

export function GlobalShortcuts() {
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.key.toLowerCase() !== "a") return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return
      event.preventDefault()
      window.dispatchEvent(new Event("zent:add-transaction"))
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return null
}
