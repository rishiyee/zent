import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { CurrencyProvider } from "@/components/currency-provider";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { GlobalAddTransaction } from "@/components/global-add-transaction";
import { RecurringMaterializer } from "@/components/recurring-materializer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/data/accounts";
import { getCategoryGroups } from "@/lib/data/categories";
import { getMerchants } from "@/lib/data/merchants";
import { getCategoryRules } from "@/lib/data/transactions";

export default async function DashboardLayout({
  children,
  settingsModal,
}: Readonly<{
  children: React.ReactNode;
  settingsModal: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [accounts, categoryGroups, merchants, rules] = await Promise.all([
    getAccounts(),
    getCategoryGroups(),
    getMerchants(),
    getCategoryRules(),
  ]);

  return (
    <CurrencyProvider
      currency={user.user_metadata?.currency as string | undefined}
      region={user.user_metadata?.region as string | undefined}
    >
      <GlobalShortcuts />
      <RecurringMaterializer />
      <GlobalAddTransaction
        accounts={accounts}
        categoryGroups={categoryGroups}
        merchants={merchants.map((merchant) => merchant.name)}
        rules={rules}
      />
      <SidebarProvider>
        <AppSidebar
          user={{
            email: user.email ?? "",
            name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Account",
            avatarUrl: user.user_metadata?.avatar_url as string | undefined,
          }}
        />
        <SidebarInset className="min-w-0">{children}</SidebarInset>
        {settingsModal}
      </SidebarProvider>
    </CurrencyProvider>
  );
}
