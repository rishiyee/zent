"use client"

import * as React from "react"
import { GripVertical, Plus, Trash2 } from "lucide-react"

import { CategoryGroup, categoryIconPresets } from "@/lib/categories"
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
  onRename,
  onDelete,
  onAddCategory,
  onDeleteCategory,
  onMoveCategory,
}: {
  group: CategoryGroup
  onRename: (name: string) => void
  onDelete: () => void
  onAddCategory: (name: string, icon: string) => void
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
  const [newName, setNewName] = React.useState("")
  const [newIcon, setNewIcon] = React.useState(categoryIconPresets[0])
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

  function submitAddCategory(event: React.FormEvent) {
    event.preventDefault()
    if (!newName.trim()) return
    onAddCategory(newName.trim(), newIcon)
    setNewName("")
    setNewIcon(categoryIconPresets[0])
    setAddOpen(false)
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
            <form
              onSubmit={submitAddCategory}
              className="flex flex-col gap-2.5"
            >
              <div className="flex flex-wrap gap-1">
                {categoryIconPresets.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewIcon(icon)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-base hover:bg-muted",
                      newIcon === icon && "bg-muted ring-1 ring-ring"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <Input
                autoFocus
                placeholder="Category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={!newName.trim()}>
                <Plus /> Add category
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
