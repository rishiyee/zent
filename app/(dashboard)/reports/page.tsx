import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { ModeToggle } from "@/components/mode-toggle"
import { PrivacyToggle } from "@/components/privacy-toggle"
import { ReportsView } from "@/components/reports/reports-view"
import { getTransactions } from "@/lib/data/transactions"
import { getCategoryGroups } from "@/lib/data/categories"
import { getAccounts } from "@/lib/data/accounts"

export default async function ReportsPage() {
  const [transactions, categoryGroups, accounts] = await Promise.all([
    getTransactions(),
    getCategoryGroups(),
    getAccounts(),
  ])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <PrivacyToggle />
          <ModeToggle />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Understand where your money comes from, where it goes, and what you keep.
          </p>
        </div>
        <ReportsView
          transactions={transactions}
          categoryGroups={categoryGroups}
          accounts={accounts}
        />
      </div>
    </>
  )
}
