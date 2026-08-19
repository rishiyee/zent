"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { logout } from "@/app/login/actions"
import { cn } from "@/lib/utils"

const accountLinks = [
  { title: "Profile", url: "/settings" },
  { title: "Display", url: "/settings/display" },
  { title: "Notifications", url: "#" },
  { title: "Security", url: "#" },
]

const householdLinks = [
  { title: "General", url: "#" },
  { title: "Members", url: "#" },
  { title: "Preferences", url: "#" },
  { title: "Institutions", url: "#" },
  { title: "Categories", url: "/categories" },
  { title: "Merchants", url: "/settings/merchants" },
  { title: "Rules", url: "/settings/rules" },
  { title: "Tags", url: "#" },
  { title: "Data", url: "#" },
  { title: "Billing", url: "#" },
  { title: "Referrals", url: "#" },
]

function SettingsLinkGroup({
  title,
  links,
  pathname,
}: {
  title: string
  links: { title: string; url: string }[]
  pathname: string
}) {
  return (
    <div className="shrink-0 rounded-xl border max-lg:contents">
      <div className="border-b px-4 py-3 max-lg:hidden">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 max-lg:flex-row max-lg:p-0">
        {links.map((link) => (
          <Link
            key={link.title}
            href={link.url}
            replace
            className={cn(
              "shrink-0 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
              pathname === link.url && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
            )}
          >
            {link.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <div className="flex w-full max-w-56 shrink-0 flex-col gap-6 max-lg:max-w-none max-lg:flex-row max-lg:overflow-x-auto max-lg:rounded-xl max-lg:border max-lg:p-2 lg:sticky lg:top-0 lg:max-h-full lg:self-start lg:overflow-y-auto lg:pr-1">
      <SettingsLinkGroup title="Account" links={accountLinks} pathname={pathname} />
      <SettingsLinkGroup title="Household" links={householdLinks} pathname={pathname} />
      <div className="shrink-0 rounded-xl border max-lg:contents">
        <nav className="flex flex-col gap-0.5 p-2 max-lg:flex-row max-lg:p-0">
          <button
            type="button"
            onClick={() => logout()}
            className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </nav>
      </div>
    </div>
  )
}
