"use client"

import { Pencil, Trash2 } from "lucide-react"

import { Account, categoryMeta } from "@/lib/accounts"
import { useCurrency } from "@/components/currency-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
})

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}

export function AccountDetailSheet({
  account,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (account: Account) => void
  onDelete: (id: string) => void
}) {
  const { format } = useCurrency()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {account && (
          <>
            <SheetHeader>
              <SheetTitle>{account.name}</SheetTitle>
              <SheetDescription>
                {categoryMeta[account.category].label}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col px-4">
              <div
                className={`text-3xl font-semibold tabular-nums ${
                  categoryMeta[account.category].kind === "liability"
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {categoryMeta[account.category].kind === "liability" ? "-" : ""}
                {format(account.balance)}
              </div>
              <Separator className="my-3" />
              <DetailRow label="Type">
                <Badge
                  variant="outline"
                  className={
                    categoryMeta[account.category].kind === "liability"
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {categoryMeta[account.category].kind === "liability"
                    ? "Liability"
                    : "Asset"}
                </Badge>
              </DetailRow>
              <DetailRow label="Category">
                <Badge variant="secondary" className="font-normal">
                  {categoryMeta[account.category].label}
                </Badge>
              </DetailRow>
              <DetailRow label="Source">
                <span className="capitalize">{account.source}</span>
              </DetailRow>
              <DetailRow label="Last updated">
                {dateFormatter.format(new Date(account.lastUpdated))}
              </DetailRow>
              <DetailRow label="Account ID">
                <span className="font-mono text-xs">{account.id}</span>
              </DetailRow>
            </div>
            <SheetFooter>
              <Button onClick={() => onEdit(account)}>
                <Pencil />
                Edit account
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  <Trash2 />
                  Delete account
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete &ldquo;{account.name}&rdquo;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Any transactions linked to this account will become
                      Cash / Untracked instead of being deleted. This can&apos;t
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => {
                        onDelete(account.id)
                        onOpenChange(false)
                      }}
                    >
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
