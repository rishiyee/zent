"use client"

import { Account, categoryMeta } from "@/lib/accounts"
import { useCurrency } from "@/components/currency-provider"
import { AddAccountDrawer } from "@/components/accounts/add-account-drawer"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function AccountsView({
  data,
  onAdd,
  onRowClick,
}: {
  data: Account[]
  onAdd: (account: Omit<Account, "id">) => void
  onRowClick: (account: Account) => void
}) {
  const { format } = useCurrency()
  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Connected accounts and manually tracked assets.
          </p>
        </div>
        <AddAccountDrawer onAdd={onAdd} />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last Updated</TableHead>
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
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    <TableCell className="text-muted-foreground capitalize">
                      {account.source}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
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
