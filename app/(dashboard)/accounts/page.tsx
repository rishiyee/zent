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
import { AccountsPageContent } from "@/components/accounts/accounts-page-content";
import { getAccounts } from "@/lib/data/accounts";
import { getTransactions } from "@/lib/data/transactions";

export default async function AccountsPage() {
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
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
              <BreadcrumbPage>Accounts</BreadcrumbPage>
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
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Track connected accounts and manually valued assets in one place.
          </p>
        </div>
        <AccountsPageContent accounts={accounts} transactions={transactions} />
      </div>
    </>
  );
}
