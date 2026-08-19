import { MerchantsView } from "@/components/settings/merchants-view"
import { ModeToggle } from "@/components/mode-toggle"
import { PrivacyToggle } from "@/components/privacy-toggle"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getAccounts } from "@/lib/data/accounts"
import { getCategoryGroups } from "@/lib/data/categories"
import { getMerchants } from "@/lib/data/merchants"
import { getRecurringDismissals, getRecurringSchedules } from "@/lib/data/recurring"
import { getTransactions } from "@/lib/data/transactions"
import { detectRecurringSuggestions } from "@/lib/recurring"

export default async function MerchantsPage() {
  const [merchants, accounts, categoryGroups, schedules, transactions, dismissals] = await Promise.all([getMerchants(), getAccounts(), getCategoryGroups(), getRecurringSchedules(), getTransactions(), getRecurringDismissals()])
  return <><header className="flex h-14 shrink-0 items-center gap-2 border-b px-4"><SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 h-4" /><Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Merchants</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb><div className="ml-auto flex items-center gap-1"><PrivacyToggle /><ModeToggle /></div></header><main className="flex flex-1 flex-col gap-6 p-4 md:p-6"><div><h1 className="text-2xl font-semibold tracking-tight">Merchants</h1><p className="text-sm text-muted-foreground">Review payees, transaction history, and recurring activity.</p></div><MerchantsView merchants={merchants} accounts={accounts} categoryGroups={categoryGroups} schedules={schedules} suggestions={detectRecurringSuggestions(transactions, schedules, dismissals)} merchantOnly /></main></>
}
