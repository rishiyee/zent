import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { TransactionsPageContent } from "@/components/transactions/transactions-page-content";
import { getAccounts } from "@/lib/data/accounts";
import { getCategoryGroups } from "@/lib/data/categories";
import { getGoals } from "@/lib/data/goals";
import { getMerchants } from "@/lib/data/merchants";
import { getTags } from "@/lib/data/tags";
import { getCategoryRules, getTransactions } from "@/lib/data/transactions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ transaction?: string }>;
}) {
  const { transaction } = await searchParams;
  const [transactions, rules, accounts, goals, tags, categoryGroups, merchants] =
    await Promise.all([
      getTransactions(),
      getCategoryRules(),
      getAccounts(),
      getGoals(),
      getTags(),
      getCategoryGroups(),
      getMerchants(),
    ]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Transactions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Every transaction across your accounts, in one ledger.
          </p>
        </div>
        <TransactionsPageContent
          transactions={transactions}
          initialDetailId={transaction}
          rules={rules}
          accounts={accounts}
          goals={goals}
          tags={tags}
          categoryGroups={categoryGroups}
          merchants={merchants.map((m) => m.name)}
        />
      </div>
    </>
  );
}
