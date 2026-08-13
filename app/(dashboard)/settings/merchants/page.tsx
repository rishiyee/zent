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
import { SettingsNav } from "@/components/settings/settings-nav";
import { MerchantsView } from "@/components/settings/merchants-view";
import { getMerchants } from "@/lib/data/merchants";
import { getAccounts } from "@/lib/data/accounts";
import { getCategoryGroups } from "@/lib/data/categories";
import { getRecurringDismissals, getRecurringSchedules } from "@/lib/data/recurring";
import { getTransactions } from "@/lib/data/transactions";
import { detectRecurringSuggestions } from "@/lib/recurring";

export default async function MerchantsSettingsPage() {
  const [merchants, accounts, categoryGroups, schedules, transactions, dismissals] = await Promise.all([
    getMerchants(), getAccounts(), getCategoryGroups(), getRecurringSchedules(), getTransactions(), getRecurringDismissals(),
  ]);
  const suggestions = detectRecurringSuggestions(transactions, schedules, dismissals);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
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
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and household preferences.
          </p>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <SettingsNav />
          <MerchantsView merchants={merchants} accounts={accounts} categoryGroups={categoryGroups} schedules={schedules} suggestions={suggestions} merchantOnly />
        </div>
      </div>
    </>
  );
}
