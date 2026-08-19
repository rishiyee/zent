import { SettingsModal } from "@/components/settings/settings-modal"
import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsModalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsModal>
      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        <SettingsNav />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </SettingsModal>
  )
}
