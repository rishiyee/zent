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
import { CashFlowChart } from "@/components/transactions/cash-flow-chart";
import { SummaryCards } from "@/components/transactions/summary-cards";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { CreditCardsDueSoonCard } from "@/components/credit-cards/due-soon-card";
import { GetStartedChecklist } from "@/components/onboarding/get-started-checklist";
import { getAccounts } from "@/lib/data/accounts";
import { getCategoryGroups } from "@/lib/data/categories";
import { getCreditCardPayments, getCreditCards } from "@/lib/data/credit-cards";
import { getMerchants } from "@/lib/data/merchants";
import { getGoals } from "@/lib/data/goals";
import { getTags } from "@/lib/data/tags";
import { getCategoryRules, getTransactions } from "@/lib/data/transactions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const [transactions, accounts, rules, categoryGroups, merchants, goals, tags, creditCards, creditCardPayments] =
    await Promise.all([
      getTransactions(),
      getAccounts(),
      getCategoryRules(),
      getCategoryGroups(),
      getMerchants(),
      getGoals(),
      getTags(),
      getCreditCards(),
      getCreditCardPayments(),
    ]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
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
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your money today.
          </p>
        </div>
        <GetStartedChecklist
          hasAccount={accounts.length > 0}
          hasTransaction={transactions.length > 0}
          hasCategorizedTransaction={transactions.some((transaction) => Boolean(transaction.category))}
        />
        <SummaryCards transactions={transactions} accounts={accounts} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CreditCardsDueSoonCard cards={creditCards} payments={creditCardPayments} />
        </div>
        <CashFlowChart transactions={transactions} />
        <TransactionsView
          data={transactions}
          accounts={accounts}
          rules={rules}
          categoryGroups={categoryGroups}
          merchants={merchants.map((m) => m.name)}
          goals={goals}
          tags={tags}
        />
      </div>
    </>
  );
}
