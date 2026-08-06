import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { CurrencyProvider } from "@/components/currency-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <CurrencyProvider
      currency={user.user_metadata?.currency as string | undefined}
      region={user.user_metadata?.region as string | undefined}
    >
      <SidebarProvider>
        <AppSidebar
          user={{
            email: user.email ?? "",
            name: (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Account",
            avatarUrl: user.user_metadata?.avatar_url as string | undefined,
          }}
        />
        <SidebarInset>{children}</SidebarInset>
        {settingsModal}
      </SidebarProvider>
    </CurrencyProvider>
  );
}
