import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { ModeToggle } from "@/components/mode-toggle"
import { PrivacyToggle } from "@/components/privacy-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { InvestmentsView } from "@/components/investments/investments-view"
import { getAccounts } from "@/lib/data/accounts"
import { getInvestmentHoldings, getInvestmentPriceHistory } from "@/lib/data/investments"

export default async function InvestmentsPage() {
  const [accounts, holdings, priceHistory] = await Promise.all([getAccounts(), getInvestmentHoldings(), getInvestmentPriceHistory()])
  const investmentAccounts = accounts.filter((account) => account.category === "investment")

  return <>
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>Investments</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
      <div className="ml-auto flex items-center gap-1"><PrivacyToggle /><ModeToggle /></div>
    </header>
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <InvestmentsView accounts={investmentAccounts.map(({ id, name }) => ({ id, name }))} initialHoldings={holdings} priceHistory={priceHistory} />
    </main>
  </>
}
