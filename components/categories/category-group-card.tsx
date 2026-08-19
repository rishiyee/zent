"use client"

import * as React from "react"
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react"

import {
  CategoryGroup,
  CategoryType,
  categoryIconPresets,
} from "@/lib/categories"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const typeItems = { income: "Income", expense: "Expense" }
const iconLabels = [
  "Cash", "Savings", "Money", "Work", "Housing", "Utilities", "Groceries", "Dining",
  "Car", "Fitness", "Entertainment", "Shopping", "Travel", "Gifts", "Pets", "Investments",
  "Transfers", "Other", "Education", "Bills", "Healthcare", "Gaming", "Coffee", "Childcare",
  "Credit card", "Banking", "Coins", "Analytics", "Loss", "Calculator", "Freelance", "Maintenance",
  "Office", "Furniture", "Rent", "Cleaning", "Repairs", "Plants", "Home", "Construction",
  "Fast food", "Pizza", "Healthy food", "Fruit", "Bakery", "Beer", "Wine", "Drinks",
  "Fuel", "Bus", "Train", "Bicycle", "Scooter", "Taxi", "Parking", "Luggage",
  "Medicine", "First aid", "Dental", "Wellness", "Running", "Gym", "Sports", "Swimming",
  "Mobile", "Computer", "Internet", "Television", "Audio", "Books", "Art", "Photography",
  "Clothing", "Shoes", "Beauty", "Haircare", "Watch", "Jewelry", "Toys", "Celebration",
  "Sustainability", "Nature", "Sunny day", "Rainy day", "Love", "Partnership", "Faith", "Favorite",
]

function IconPicker({
  icon,
  onChange,
}: {
  icon: string
  onChange: (icon: string) => void
}) {
  return (
    <TooltipProvider delay={300}>
      <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto pr-1 sm:grid-cols-10" aria-label="Choose a category emoji">
        {categoryIconPresets.map((presetIcon, index) => (
          <Tooltip key={presetIcon}>
            <TooltipTrigger render={<button type="button" onClick={() => onChange(presetIcon)} aria-label={`${iconLabels[index] ?? "Category"} emoji`} aria-pressed={icon === presetIcon} className={cn("flex size-10 items-center justify-center rounded-lg text-lg hover:bg-muted sm:size-9", icon === presetIcon && "bg-muted ring-1 ring-ring")} />}>
              {presetIcon}
            </TooltipTrigger>
            <TooltipContent>{iconLabels[index] ?? "Category"}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

function CategoryCreateForm({
  initialIcon = categoryIconPresets[0],
  submitLabel,
  onSubmit,
  autoFocus = true,
}: {
  initialIcon?: string
  submitLabel: string
  onSubmit: (name: string, icon: string) => void
  autoFocus?: boolean
}) {
  const [name, setName] = React.useState("")
  const [icon, setIcon] = React.useState(initialIcon)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim(), icon)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <IconPicker icon={icon} onChange={setIcon} />
      <Input
        autoFocus={autoFocus}
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={!name.trim()}>
        <Plus /> {submitLabel}
      </Button>
    </form>
  )
}

function CategoryEditorForm({
  allGroups,
  initialGroupId,
  initialName = "",
  initialIcon = categoryIconPresets[0],
  submitLabel,
  onSubmit,
  autoFocus = true,
}: {
  allGroups: CategoryGroup[]
  initialGroupId: string
  initialName?: string
  initialIcon?: string
  submitLabel: string
  onSubmit: (groupId: string, name: string, icon: string) => void
  autoFocus?: boolean
}) {
  const [type, setType] = React.useState<CategoryType>(
    () => allGroups.find((g) => g.id === initialGroupId)?.type ?? "expense"
  )
  const [groupId, setGroupId] = React.useState(initialGroupId)
  const [name, setName] = React.useState(initialName)
  const [icon, setIcon] = React.useState(initialIcon)

  const groupsForType = allGroups.filter((g) => g.type === type)

  function handleTypeChange(nextType: CategoryType) {
    setType(nextType)
    const groups = allGroups.filter((g) => g.type === nextType)
    if (!groups.some((g) => g.id === groupId)) {
      setGroupId(groups[0]?.id ?? "")
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !groupId) return
    onSubmit(groupId, name.trim(), icon)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Select
          items={typeItems}
          value={type}
          onValueChange={(next: CategoryType | null) => next && handleTypeChange(next)}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select
          items={Object.fromEntries(groupsForType.map((g) => [g.id, g.name]))}
          value={groupId}
          onValueChange={(next: string | null) => next && setGroupId(next)}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Choose group" />
          </SelectTrigger>
          <SelectContent>
            {groupsForType.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {groupsForType.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No {type} groups yet — create one in the {type === "income" ? "Income" : "Expenses"}{" "}
          section first.
        </p>
      )}
      <IconPicker icon={icon} onChange={setIcon} />
      <Input
        autoFocus={autoFocus}
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={!name.trim() || !groupId}>
        <Plus /> {submitLabel}
      </Button>
    </form>
  )
}

function CategoryFormOverlay({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent>
          <DrawerHeader className="border-b p-4 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

type DragPayload = { categoryId: string; groupId: string }

function readDragPayload(event: React.DragEvent): DragPayload | null {
  try {
    const raw = event.dataTransfer.getData("text/plain")
    if (!raw) return null
    return JSON.parse(raw) as DragPayload
  } catch {
    return null
  }
}

export function CategoryGroupCard({
  group,
  allGroups,
  onRename,
  onDelete,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMoveCategory,
}: {
  group: CategoryGroup
  allGroups: CategoryGroup[]
  onRename: (name: string) => void
  onDelete: () => void
  onAddCategory: (groupId: string, name: string, icon: string) => void
  onUpdateCategory: (
    categoryId: string,
    patch: { name?: string; icon?: string; groupId?: string }
  ) => void
  onDeleteCategory: (categoryId: string) => void
  onMoveCategory: (
    categoryId: string,
    fromGroupId: string,
    toGroupId: string,
    toIndex: number
  ) => void
}) {
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState(group.name)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  function startRename() {
    setNameDraft(group.name)
    setIsRenaming(true)
  }

  function submitRename(event: React.FormEvent) {
    event.preventDefault()
    if (!nameDraft.trim()) return
    onRename(nameDraft.trim())
    setIsRenaming(false)
  }

  function handleDrop(event: React.DragEvent, index: number) {
    event.preventDefault()
    event.stopPropagation()
    setDragOverIndex(null)
    const payload = readDragPayload(event)
    if (!payload) return
    onMoveCategory(payload.categoryId, payload.groupId, group.id, index)
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
        {isRenaming ? (
          <form
            onSubmit={submitRename}
            className="flex flex-1 items-center gap-2"
          >
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="h-8"
            />
            <Button type="submit" size="sm" disabled={!nameDraft.trim()}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsRenaming(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{group.name}</h3>
              <button
                type="button"
                onClick={startRename}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Edit
              </button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                  />
                }
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Delete group</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete &ldquo;{group.name}&rdquo;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This also deletes the {group.categories.length} categor
                    {group.categories.length === 1 ? "y" : "ies"} inside it.
                    Transactions using them will become uncategorized.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDelete}>
                    Delete group
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOverIndex(group.categories.length)
        }}
        onDrop={(e) => handleDrop(e, group.categories.length)}
      >
        {group.categories.map((category, index) => (
          <div
            key={category.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "text/plain",
                JSON.stringify({ categoryId: category.id, groupId: group.id })
              )
              e.dataTransfer.effectAllowed = "move"
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragOverIndex(index)
            }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "group/row flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-muted/50",
              dragOverIndex === index && "bg-muted"
            )}
          >
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50" />
            <span className="text-base leading-none">{category.icon}</span>
            <span className="flex-1 text-sm">{category.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100"
              onClick={() => setEditingCategoryId(category.id)}
            >
                <Pencil className="size-3.5" />
                <span className="sr-only">Edit {category.name}</span>
            </Button>
            <CategoryFormOverlay
              open={editingCategoryId === category.id}
              onOpenChange={(open) => setEditingCategoryId(open ? category.id : null)}
              title="Edit category"
              description={`Update ${category.name} or move it to another group.`}
            >
                <CategoryEditorForm
                  allGroups={allGroups}
                  initialGroupId={group.id}
                  initialName={category.name}
                  initialIcon={category.icon}
                  submitLabel="Save changes"
                  autoFocus={false}
                  onSubmit={(groupId, name, icon) => {
                    onUpdateCategory(category.id, {
                      name,
                      icon,
                      groupId: groupId !== group.id ? groupId : undefined,
                    })
                    setEditingCategoryId(null)
                  }}
                />
            </CategoryFormOverlay>
            <AlertDialog>
              <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon" className="text-muted-foreground md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100" />}>
                <Trash2 className="size-3.5" />
                <span className="sr-only">Delete {category.name}</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete &ldquo;{category.name}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This category will be removed permanently. Existing transactions using it will become uncategorized.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep category</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => onDeleteCategory(category.id)}>
                    Delete category
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {group.categories.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No categories yet.
          </div>
        )}
      </div>
      <div className="border-t px-4 py-2.5">
        <button
          type="button"
          className="min-h-10 text-sm font-medium text-primary hover:underline sm:min-h-0 sm:text-muted-foreground sm:hover:text-foreground"
          onClick={() => setAddOpen(true)}
        >
          Create Category
        </button>
        <CategoryFormOverlay
          open={addOpen}
          onOpenChange={setAddOpen}
          title={`Add category to ${group.name}`}
          description="Choose an icon and give this category a clear name."
        >
            <CategoryCreateForm
              submitLabel="Add category"
              autoFocus={false}
              onSubmit={(name, icon) => {
                onAddCategory(group.id, name, icon)
                setAddOpen(false)
              }}
            />
        </CategoryFormOverlay>
      </div>
    </div>
  )
}
