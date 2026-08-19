import { notFound } from "next/navigation"

import { MerchantDetailView } from "@/components/settings/merchant-detail-view"
import { ModeToggle } from "@/components/mode-toggle"
import { PrivacyToggle } from "@/components/privacy-toggle"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getAccounts } from "@/lib/data/accounts"
import { getTransactions } from "@/lib/data/transactions"

export default async function MerchantDetailPage({ params }: { params: Promise<{ merchant: string }> }) {
  const { merchant } = await params
  const name = decodeURIComponent(merchant)
  const [allTransactions, accounts] = await Promise.all([getTransactions(), getAccounts()])
  const transactions = allTransactions.filter((transaction) => transaction.description.toLocaleLowerCase() === name.toLocaleLowerCase())
  if (!transactions.length) notFound()

  return <>
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/settings/merchants">Merchants</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
      <div className="ml-auto flex items-center gap-1"><PrivacyToggle /><ModeToggle /></div>
    </header>
    <main className="flex flex-1 flex-col p-4 md:p-6"><MerchantDetailView name={name} transactions={transactions} accounts={accounts} /></main>
  </>
}
