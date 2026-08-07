import { DisplayForm } from "@/components/settings/display-form"
import { SettingsModal } from "@/components/settings/settings-modal"
import { SettingsNav } from "@/components/settings/settings-nav"
import { DEFAULT_CURRENCY, DEFAULT_REGION } from "@/lib/currency"
import { createClient } from "@/lib/supabase/server"

export default async function DisplaySettingsModalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const metadata = (user.user_metadata ?? {}) as {
    currency?: string
    region?: string
  }

  return (
    <SettingsModal>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav />
        <DisplayForm
          currency={metadata.currency ?? DEFAULT_CURRENCY}
          region={metadata.region ?? DEFAULT_REGION}
        />
      </div>
    </SettingsModal>
  )
}
