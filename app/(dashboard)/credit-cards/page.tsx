import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { CreditCardsView } from "@/components/credit-cards/credit-cards-view";
import { getAccounts } from "@/lib/data/accounts";
import { getCreditCardPayments, getCreditCards } from "@/lib/data/credit-cards";
import { getTransactions } from "@/lib/data/transactions";

export default async function CreditCardsPage() {
  const [accounts, cards, payments, transactions] = await Promise.all([
    getAccounts(),
    getCreditCards(),
    getCreditCardPayments(),
    getTransactions(),
  ]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Credit Cards</BreadcrumbPage>
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Credit Cards
          </h1>
          <p className="text-sm text-muted-foreground">
            Track balances, due dates, and payments across every card.
          </p>
        </div>
        <CreditCardsView
          cards={cards}
          payments={payments}
          transactions={transactions}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        />
      </div>
    </>
  );
}
