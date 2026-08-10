import { SettingsModal } from "@/components/settings/settings-modal"
import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsModalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsModal>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav />
        {children}
      </div>
    </SettingsModal>
  )
}
