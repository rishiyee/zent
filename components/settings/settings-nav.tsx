"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
    <div className="rounded-xl border">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {links.map((link) => (
          <Link
            key={link.title}
            href={link.url}
            className={cn(
              "rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
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
    <div className="flex w-full max-w-56 shrink-0 flex-col gap-6">
      <SettingsLinkGroup title="Account" links={accountLinks} pathname={pathname} />
      <SettingsLinkGroup title="Household" links={householdLinks} pathname={pathname} />
    </div>
  )
}
