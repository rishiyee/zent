import { MerchantsView } from "@/components/settings/merchants-view"
import { getMerchants } from "@/lib/data/merchants"

export default async function MerchantsSettingsModalPage() {
  const merchants = await getMerchants()

  return <MerchantsView merchants={merchants} />
}
