import { MerchantsView } from "@/components/settings/merchants-view"
import { SettingsModal } from "@/components/settings/settings-modal"
import { SettingsNav } from "@/components/settings/settings-nav"
import { getMerchants } from "@/lib/data/merchants"

export default async function MerchantsSettingsModalPage() {
  const merchants = await getMerchants()

  return (
    <SettingsModal>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav />
        <MerchantsView merchants={merchants} />
      </div>
    </SettingsModal>
  )
}
