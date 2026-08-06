import { createClient } from "@/lib/supabase/server"
import { Category, CategoryGroup, CategoryType } from "@/lib/categories"

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type CategoryRow = {
  id: string
  name: string
  icon: string
  sort_order: number
}

type CategoryGroupRow = {
  id: string
  name: string
  type: CategoryType
  sort_order: number
  categories: CategoryRow[] | null
}

function toCategoryGroup(row: CategoryGroupRow): CategoryGroup {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    categories: (row.categories ?? []).map((c): Category => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    })),
  }
}

const DEFAULT_GROUPS: {
  name: string
  type: CategoryType
  categories: { name: string; icon: string }[]
}[] = [
  {
    name: "Income",
    type: "income",
    categories: [
      { name: "Salary", icon: "💵" },
      { name: "Freelance", icon: "💼" },
      { name: "Interest", icon: "💸" },
    ],
  },
  {
    name: "Housing",
    type: "expense",
    categories: [
      { name: "Rent", icon: "🏠" },
      { name: "Utilities", icon: "💡" },
    ],
  },
  {
    name: "Food & Dining",
    type: "expense",
    categories: [
      { name: "Groceries", icon: "🛒" },
      { name: "Dining", icon: "🍽️" },
    ],
  },
  {
    name: "Transportation",
    type: "expense",
    categories: [{ name: "Transportation", icon: "🚗" }],
  },
  {
    name: "Health & Fitness",
    type: "expense",
    categories: [{ name: "Health & Fitness", icon: "💪" }],
  },
  {
    name: "Entertainment",
    type: "expense",
    categories: [{ name: "Entertainment", icon: "🎬" }],
  },
  {
    name: "Shopping",
    type: "expense",
    categories: [{ name: "Shopping", icon: "🛍️" }],
  },
  {
    name: "Travel",
    type: "expense",
    categories: [{ name: "Travel", icon: "✈️" }],
  },
  {
    name: "Gifts & Donations",
    type: "expense",
    categories: [{ name: "Charity", icon: "🎁" }],
  },
  {
    name: "Pets",
    type: "expense",
    categories: [{ name: "Pets", icon: "🐾" }],
  },
  {
    name: "Other",
    type: "expense",
    categories: [
      { name: "Transfer", icon: "🔁" },
      { name: "Investment", icon: "📈" },
      { name: "Other", icon: "📦" },
    ],
  },
]

// Uses upsert + ignoreDuplicates against the (user_id, type, name) and
// (group_id, name) unique constraints, so this stays safe even if multiple
// requests race to seed the same user at once — only one copy of each
// default group/category can ever exist.
async function seedDefaultCategories(supabase: SupabaseServerClient) {
  const { error: groupError } = await supabase
    .from("category_groups")
    .upsert(
      DEFAULT_GROUPS.map((group, index) => ({
        name: group.name,
        type: group.type,
        sort_order: index,
      })),
      { onConflict: "user_id,type,name", ignoreDuplicates: true }
    )
  if (groupError) throw groupError

  const { data: groups, error: fetchError } = await supabase
    .from("category_groups")
    .select("id, name, type")
  if (fetchError) throw fetchError

  const groupIdByKey = new Map(
    (groups ?? []).map((g) => [`${g.type}:${g.name}`, g.id as string])
  )

  const categoryRows = DEFAULT_GROUPS.flatMap((group) => {
    const groupId = groupIdByKey.get(`${group.type}:${group.name}`)
    if (!groupId) return []
    return group.categories.map((category, index) => ({
      group_id: groupId,
      name: category.name,
      icon: category.icon,
      sort_order: index,
    }))
  })

  if (categoryRows.length) {
    const { error: categoryError } = await supabase
      .from("categories")
      .upsert(categoryRows, { onConflict: "group_id,name", ignoreDuplicates: true })
    if (categoryError) throw categoryError
  }
}

export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const supabase = await createClient()

  async function fetchGroups() {
    const { data, error } = await supabase
      .from("category_groups")
      .select("id, name, type, sort_order, categories(id, name, icon, sort_order)")
      .order("sort_order", { ascending: true })
      .order("sort_order", { ascending: true, referencedTable: "categories" })
    if (error) throw error
    return data as CategoryGroupRow[]
  }

  let groups = await fetchGroups()
  if (groups.length === 0) {
    await seedDefaultCategories(supabase)
    groups = await fetchGroups()
  }

  return groups.map(toCategoryGroup)
}
