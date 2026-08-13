"use client"

import * as React from "react"
import { ArrowRightLeft } from "lucide-react"

import { Account, categoryMeta } from "@/lib/accounts"
import { Transaction } from "@/lib/transactions"
import { useCurrency } from "@/components/currency-provider"
import { AddAccountDrawer } from "@/components/accounts/add-account-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TransferDrawer } from "@/components/transactions/transfer-drawer"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function AccountsView({
  data,
  onAdd,
  onTransfer,
  onRowClick,
}: {
  data: Account[]
  onAdd: (account: Omit<Account, "id">) => void
  onTransfer: (transaction: Omit<Transaction, "id">) => void
  onRowClick: (account: Account) => void
}) {
  const { format } = useCurrency()
  const [transferOpen, setTransferOpen] = React.useState(false)
  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Connected accounts and manually tracked assets.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            variant="outline"
            size="sm"
            disabled={data.length < 2}
            onClick={() => setTransferOpen(true)}
          >
            <ArrowRightLeft />
            Transfer
          </Button>
          <TransferDrawer
            accounts={data}
            open={transferOpen}
            onOpenChange={setTransferOpen}
            onSave={onTransfer}
          />
          <AddAccountDrawer onAdd={onAdd} />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead className="hidden xl:table-cell">Last Updated</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((account) => {
                const meta = categoryMeta[account.category]
                return (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer"
                    onClick={() => onRowClick(account)}
                  >
                    <TableCell className="font-medium">
                      {account.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="font-normal">
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={
                          meta.kind === "liability"
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {meta.kind === "liability" ? "Liability" : "Asset"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground capitalize lg:table-cell">
                      {account.source}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">
                      {dateFormatter.format(new Date(account.lastUpdated))}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        meta.kind === "liability"
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {meta.kind === "liability" ? "-" : ""}
                      {format(account.balance)}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No accounts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
