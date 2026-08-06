import { ProfileForm } from "@/components/settings/profile-form"
import { SettingsModal } from "@/components/settings/settings-modal"
import { SettingsNav } from "@/components/settings/settings-nav"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsModalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const metadata = (user.user_metadata ?? {}) as {
    full_name?: string
    birthday?: string
    timezone?: string
    avatar_url?: string
  }

  return (
    <SettingsModal>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav />
        <ProfileForm
          userId={user.id}
          fullName={metadata.full_name ?? user.email?.split("@")[0] ?? ""}
          birthday={metadata.birthday ?? null}
          timezone={metadata.timezone ?? null}
          avatarUrl={metadata.avatar_url ?? null}
        />
      </div>
    </SettingsModal>
  )
}
