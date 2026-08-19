export type CategoryType = "income" | "expense"

export type Category = {
  id: string
  name: string
  icon: string
}

export type CategoryGroup = {
  id: string
  name: string
  type: CategoryType
  categories: Category[]
}

export const categoryTypeOrder: CategoryType[] = ["income", "expense"]

export const categoryTypeLabels: Record<CategoryType, string> = {
  income: "Income",
  expense: "Expenses",
}

export const categoryIconPresets = [
  "💵", "💰", "💸", "💼", "🏠", "💡", "🛒", "🍽️",
  "🚗", "💪", "🎬", "🛍️", "✈️", "🎁", "🐾", "📈",
  "🔁", "📦", "🎓", "🧾", "🏥", "🎮", "☕", "👶",
  "💳", "🏦", "🪙", "📊", "📉", "🧮", "🧑‍💻", "🛠️",
  "🏢", "🛋️", "🔑", "🧹", "🔧", "🪴", "🏡", "🧱",
  "🍔", "🍕", "🥗", "🍎", "🥐", "🍺", "🍷", "🧋",
  "⛽", "🚌", "🚆", "🚲", "🛵", "🚕", "🅿️", "🧳",
  "💊", "🩺", "🦷", "🧘", "🏃", "🏋️", "⚽", "🏊",
  "📱", "💻", "🌐", "📺", "🎧", "📚", "🎨", "📷",
  "👕", "👟", "💄", "💇", "⌚", "💍", "🧸", "🎉",
  "🌱", "🌳", "☀️", "🌧️", "❤️", "🤝", "🙏", "⭐",
]

export function flattenCategoryNames(groups: CategoryGroup[]): string[] {
  return groups.flatMap((group) => group.categories.map((c) => c.name))
}
