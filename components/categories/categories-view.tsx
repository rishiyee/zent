"use client"

import { Info } from "lucide-react"

import {
  addCategory,
  addCategoryGroup,
  deleteCategory,
  deleteCategoryGroup,
  moveCategory,
  renameCategoryGroup,
  updateCategory,
} from "@/app/(dashboard)/categories/actions"
import {
  CategoryGroup,
  categoryTypeLabels,
  categoryTypeOrder,
} from "@/lib/categories"
import { notify } from "@/components/ui/toast"
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
          allGroups={groups}
          onAddGroup={(name) => void notify(addCategoryGroup(type, name), "Group added")}
          onRenameGroup={(groupId, name) =>
            void notify(renameCategoryGroup(groupId, name), "Group renamed")
          }
          onDeleteGroup={(groupId) => void notify(deleteCategoryGroup(groupId), "Group deleted")}
          onAddCategory={(groupId, name, icon) =>
            void notify(addCategory(groupId, name, icon), "Category added")
          }
          onUpdateCategory={(categoryId, patch) =>
            void notify(updateCategory(categoryId, patch), "Category updated")
          }
          onDeleteCategory={(_groupId, categoryId) =>
            void notify(deleteCategory(categoryId), "Category deleted")
          }
          onMoveCategory={(categoryId, _fromGroupId, toGroupId, toIndex) =>
            void notify(moveCategory(categoryId, toGroupId, toIndex))
          }
        />
      ))}
    </div>
  )
}
