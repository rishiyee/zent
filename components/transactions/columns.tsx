"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

import { Transaction, TransactionAccountOption, accountName } from "@/lib/transactions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TransactionStatusBadge } from "@/components/transactions/transaction-status-badge"

function SortableHeader({
  column,
  children,
}: {
  column: import("@tanstack/react-table").Column<Transaction, unknown>
  children: React.ReactNode
}) {
  const sorted = column.getIsSorted()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp />
      ) : sorted === "desc" ? (
        <ArrowDown />
      ) : (
        <ArrowUpDown className="text-muted-foreground" />
      )}
    </Button>
  )
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function TransactionActions({ transactionId }: { transactionId: string }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" className="ml-2" />}
      >
        <MoreHorizontal />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/transactions?transaction=${transactionId}`)}
        >
          Open in transactions
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function getColumns(
  accounts: TransactionAccountOption[],
  formatCurrency: (amount: number) => string
): ColumnDef<Transaction>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableHeader column={column}>Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {dateFormatter.format(new Date(row.getValue("date")))}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column}>Description</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("description")}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string | null
      return row.original.linkedPaymentId ? (
        <Badge variant="outline" className="font-normal">
          Transfer
        </Badge>
      ) : category ? (
        <Badge variant="secondary" className="font-normal">
          {category}
        </Badge>
      ) : (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          Uncategorized
        </Badge>
      )
    },
    filterFn: (row, id, value: string[]) =>
      !value?.length || value.includes(row.getValue(id) ?? "Uncategorized"),
  },
  {
    accessorKey: "accountId",
    header: "Account",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {accountName(row.getValue("accountId"), accounts)}
      </span>
    ),
    filterFn: (row, id, value: string[]) =>
      !value?.length || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <TransactionStatusBadge status={row.getValue("status")} />
    ),
    filterFn: (row, id, value: string[]) =>
      !value?.length || value.includes(row.getValue(id)),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader column={column}>Amount</SortableHeader>
      </div>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number
      const type = row.original.type
      return (
        <div
          className={`text-right font-medium tabular-nums ${
            type === "income"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          }`}
        >
          {row.original.linkedPaymentId ? "" : type === "income" ? "+" : "-"}
          {formatCurrency(amount)}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <TransactionActions transactionId={row.original.id} />,
  },
  ]
}
