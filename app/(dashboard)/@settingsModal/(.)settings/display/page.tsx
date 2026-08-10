import { DisplayForm } from "@/components/settings/display-form"
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
    <DisplayForm
      currency={metadata.currency ?? DEFAULT_CURRENCY}
      region={metadata.region ?? DEFAULT_REGION}
    />
  )
}
