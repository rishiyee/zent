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
import { CategoriesView } from "@/components/categories/categories-view";
import { getCategoryGroups } from "@/lib/data/categories";

export default async function CategoriesPage() {
  const groups = await getCategoryGroups();

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Categories</BreadcrumbPage>
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
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize income and expense categories into groups used across
            transactions and rules.
          </p>
        </div>
        <CategoriesView groups={groups} />
      </div>
    </>
  );
}
