"use client"

import * as React from "react"
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react"

import {
  CategoryGroup,
  CategoryType,
  categoryIconPresets,
} from "@/lib/categories"
import { cn } from "@/lib/utils"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const typeItems = { income: "Income", expense: "Expense" }

function CategoryEditorForm({
  allGroups,
  initialGroupId,
  initialName = "",
  initialIcon = categoryIconPresets[0],
  submitLabel,
  onSubmit,
}: {
  allGroups: CategoryGroup[]
  initialGroupId: string
  initialName?: string
  initialIcon?: string
  submitLabel: string
  onSubmit: (groupId: string, name: string, icon: string) => void
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
      <div className="flex flex-wrap gap-1">
        {categoryIconPresets.map((presetIcon) => (
          <button
            key={presetIcon}
            type="button"
            onClick={() => setIcon(presetIcon)}
            className={cn(
              "flex size-7 items-center justify-center rounded-md text-base hover:bg-muted",
              icon === presetIcon && "bg-muted ring-1 ring-ring"
            )}
          >
            {presetIcon}
          </button>
        ))}
      </div>
      <Input
        autoFocus
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
            <Popover
              open={editingCategoryId === category.id}
              onOpenChange={(open) => setEditingCategoryId(open ? category.id : null)}
            >
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground opacity-0 group-hover/row:opacity-100"
                  />
                }
              >
                <Pencil className="size-3.5" />
                <span className="sr-only">Edit {category.name}</span>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72">
                <CategoryEditorForm
                  allGroups={allGroups}
                  initialGroupId={group.id}
                  initialName={category.name}
                  initialIcon={category.icon}
                  submitLabel="Save changes"
                  onSubmit={(groupId, name, icon) => {
                    onUpdateCategory(category.id, {
                      name,
                      icon,
                      groupId: groupId !== group.id ? groupId : undefined,
                    })
                    setEditingCategoryId(null)
                  }}
                />
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground opacity-0 group-hover/row:opacity-100"
              onClick={() => onDeleteCategory(category.id)}
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Delete {category.name}</span>
            </Button>
          </div>
        ))}
        {group.categories.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No categories yet.
          </div>
        )}
      </div>
      <div className="border-t px-4 py-2.5">
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              />
            }
          >
            Create Category
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72">
            <CategoryEditorForm
              allGroups={allGroups}
              initialGroupId={group.id}
              submitLabel="Add category"
              onSubmit={(groupId, name, icon) => {
                onAddCategory(groupId, name, icon)
                setAddOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
