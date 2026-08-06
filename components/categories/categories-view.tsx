"use client"

import { Info } from "lucide-react"

import {
  addCategory,
  addCategoryGroup,
  deleteCategory,
  deleteCategoryGroup,
  moveCategory,
  renameCategoryGroup,
} from "@/app/(dashboard)/categories/actions"
import {
  CategoryGroup,
  categoryTypeLabels,
  categoryTypeOrder,
} from "@/lib/categories"
import { CategoryTypeSection } from "@/components/categories/category-type-section"

export function CategoriesView({ groups }: { groups: CategoryGroup[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-3 rounded-lg bg-sky-500/10 p-4 text-sm text-sky-700 dark:text-sky-300">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Changes you make to your groups and categories here are applied
          throughout the app. Customize your category structure to fit your
          needs.
        </p>
      </div>
      {categoryTypeOrder.map((type) => (
        <CategoryTypeSection
          key={type}
          type={type}
          label={categoryTypeLabels[type]}
          groups={groups.filter((g) => g.type === type)}
          onAddGroup={(name) => void addCategoryGroup(type, name)}
          onRenameGroup={(groupId, name) => void renameCategoryGroup(groupId, name)}
          onDeleteGroup={(groupId) => void deleteCategoryGroup(groupId)}
          onAddCategory={(groupId, name, icon) =>
            void addCategory(groupId, name, icon)
          }
          onDeleteCategory={(_groupId, categoryId) => void deleteCategory(categoryId)}
          onMoveCategory={(categoryId, _fromGroupId, toGroupId, toIndex) =>
            void moveCategory(categoryId, toGroupId, toIndex)
          }
        />
      ))}
    </div>
  )
}
