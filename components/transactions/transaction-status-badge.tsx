import { Check } from "lucide-react"

import { TransactionStatus, statusMeta } from "@/lib/transactions"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const meta = statusMeta[status]
  return <Badge key={status} className={cn(meta.className, status === "reviewed" && "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-75 motion-safe:duration-300")} aria-live="polite">
    {status === "reviewed" && <Check className="size-3" aria-hidden="true" />}
    {meta.label}
  </Badge>
}
