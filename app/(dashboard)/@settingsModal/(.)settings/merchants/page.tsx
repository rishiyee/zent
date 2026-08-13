import { MerchantsView } from "@/components/settings/merchants-view"
import { getMerchants } from "@/lib/data/merchants"
import { getAccounts } from "@/lib/data/accounts"
import { getCategoryGroups } from "@/lib/data/categories"
import { getRecurringDismissals, getRecurringSchedules } from "@/lib/data/recurring"
import { getTransactions } from "@/lib/data/transactions"
import { detectRecurringSuggestions } from "@/lib/recurring"

export default async function MerchantsSettingsModalPage() {
  const [merchants, accounts, categoryGroups, schedules, transactions, dismissals] = await Promise.all([
    getMerchants(), getAccounts(), getCategoryGroups(), getRecurringSchedules(), getTransactions(), getRecurringDismissals(),
  ])
  const suggestions = detectRecurringSuggestions(transactions, schedules, dismissals)

  return <MerchantsView merchants={merchants} accounts={accounts} categoryGroups={categoryGroups} schedules={schedules} suggestions={suggestions} merchantOnly />
}
