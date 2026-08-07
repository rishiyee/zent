import { RulesView } from "@/components/settings/rules-view"
import { SettingsModal } from "@/components/settings/settings-modal"
import { SettingsNav } from "@/components/settings/settings-nav"
import { getCategoryGroups } from "@/lib/data/categories"
import { getCategoryRules } from "@/lib/data/transactions"

export default async function RulesSettingsModalPage() {
  const [rules, categoryGroups] = await Promise.all([
    getCategoryRules(),
    getCategoryGroups(),
  ])

  return (
    <SettingsModal>
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav />
        <RulesView rules={rules} categoryGroups={categoryGroups} />
      </div>
    </SettingsModal>
  )
}
