import { TransactionStatus, statusMeta } from "@/lib/transactions"
import { Badge } from "@/components/ui/badge"

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const meta = statusMeta[status]
  return <Badge className={meta.className}>{meta.label}</Badge>
}
