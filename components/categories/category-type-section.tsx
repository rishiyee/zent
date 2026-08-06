"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { CategoryGroup, CategoryType } from "@/lib/categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CategoryGroupCard } from "@/components/categories/category-group-card"

export function CategoryTypeSection({
  label,
  groups,
  allGroups,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMoveCategory,
}: {
  type: CategoryType
  label: string
  groups: CategoryGroup[]
  allGroups: CategoryGroup[]
  onAddGroup: (name: string) => void
  onRenameGroup: (groupId: string, name: string) => void
  onDeleteGroup: (groupId: string) => void
  onAddCategory: (groupId: string, name: string, icon: string) => void
  onUpdateCategory: (
    categoryId: string,
    patch: { name?: string; icon?: string; groupId?: string }
  ) => void
  onDeleteCategory: (groupId: string, categoryId: string) => void
  onMoveCategory: (
    categoryId: string,
    fromGroupId: string,
    toGroupId: string,
    toIndex: number
  ) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    onAddGroup(name.trim())
    setName("")
    setOpen(false)
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{label}</h2>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
              />
            }
          >
            Create group
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <form onSubmit={submit} className="flex flex-col gap-2.5">
              <Input
                autoFocus
                placeholder="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={!name.trim()}>
                <Plus /> Create group
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <CategoryGroupCard
            key={group.id}
            group={group}
            allGroups={allGroups}
            onRename={(name) => onRenameGroup(group.id, name)}
            onDelete={() => onDeleteGroup(group.id)}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={(categoryId) =>
              onDeleteCategory(group.id, categoryId)
            }
            onMoveCategory={onMoveCategory}
          />
        ))}
        {groups.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No groups yet.
          </p>
        )}
      </div>
    </section>
  )
}
