"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DataPagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100] }: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount - 1)
  const first = total ? current * pageSize + 1 : 0
  const last = Math.min((current + 1) * pageSize, total)
  return <div className="flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm text-muted-foreground">{first}–{last} of {total}</p>
    <div className="flex flex-wrap items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">Rows per page</span>
      <Select value={String(pageSize)} onValueChange={(value) => value && onPageSizeChange(Number(value))}><SelectTrigger size="sm" className="w-20"><SelectValue /></SelectTrigger><SelectContent>{pageSizeOptions.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select>
      <span className="min-w-24 text-center text-sm">Page {current + 1} of {pageCount}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(0)} disabled={current === 0} aria-label="First page"><ChevronsLeft /></Button>
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(current - 1)} disabled={current === 0} aria-label="Previous page"><ChevronLeft /></Button>
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(current + 1)} disabled={current >= pageCount - 1} aria-label="Next page"><ChevronRight /></Button>
        <Button variant="outline" size="icon-sm" onClick={() => onPageChange(pageCount - 1)} disabled={current >= pageCount - 1} aria-label="Last page"><ChevronsRight /></Button>
      </div>
    </div>
  </div>
}
