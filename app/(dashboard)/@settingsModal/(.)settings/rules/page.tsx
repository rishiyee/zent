import { RulesView } from "@/components/settings/rules-view"
import { getCategoryGroups } from "@/lib/data/categories"
import { getCategoryRules } from "@/lib/data/transactions"

export default async function RulesSettingsModalPage() {
  const [rules, categoryGroups] = await Promise.all([
    getCategoryRules(),
    getCategoryGroups(),
  ])

  return <RulesView rules={rules} categoryGroups={categoryGroups} />
}
