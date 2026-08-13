"use client"

import * as React from "react"
import {
  ArrowRight,
  ChevronDown,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"

import {
  addRule,
  applyRules,
  deleteRule,
  reorderRules,
  toggleRule,
} from "@/app/(dashboard)/settings/rules/actions"
import { CategoryGroup, flattenCategoryNames } from "@/lib/categories"
import { CategoryRule } from "@/lib/transactions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { CategorySelect } from "@/components/transactions/category-select"

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium">
      {children}
    </span>
  )
}

function CreateRuleDialog({ categoryGroups }: { categoryGroups: CategoryGroup[] }) {
  const [open, setOpen] = React.useState(false)
  const [keyword, setKeyword] = React.useState("")
  const [category, setCategory] = React.useState(
    () => flattenCategoryNames(categoryGroups)[0] ?? ""
  )
  const [pending, setPending] = React.useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!keyword.trim() || !category) return

    setPending(true)
    try {
      await addRule(keyword.trim().toLowerCase(), category)
      toast.add({ title: "Rule created", type: "success" })
      setKeyword("")
      setOpen(false)
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Something went wrong",
        type: "error",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Create rule
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create rule</DialogTitle>
          <DialogDescription>
            When a payee contains this keyword, matching transactions are
            automatically recategorized.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Payee contains</span>
            <Input
              autoFocus
              placeholder="e.g. netflix"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Recategorize to</span>
            <CategorySelect
              groups={categoryGroups}
              value={category}
              onValueChange={setCategory}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending || !keyword.trim() || !category}>
              {pending ? "Creating…" : "Create rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RulesView({
  rules,
  categoryGroups,
}: {
  rules: CategoryRule[]
  categoryGroups: CategoryGroup[]
}) {
  const [search, setSearch] = React.useState("")
  const [dragOverId, setDragOverId] = React.useState<string | null>(null)
  const [applying, setApplying] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rules
    return rules.filter(
      (rule) =>
        rule.keyword.toLowerCase().includes(q) ||
        rule.category.toLowerCase().includes(q)
    )
  }, [rules, search])

  function handleDrop(event: React.DragEvent, targetId: string) {
    event.preventDefault()
    setDragOverId(null)
    const draggedId = event.dataTransfer.getData("text/plain")
    if (!draggedId || draggedId === targetId) return

    const ids = rules.map((r) => r.id)
    const fromIndex = ids.indexOf(draggedId)
    const toIndex = ids.indexOf(targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const next = [...ids]
    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, draggedId)
    void reorderRules(next)
  }

  async function handleApplyRules() {
    setApplying(true)
    try {
      const count = await applyRules()
      toast.add({
        title:
          count > 0
            ? `Applied rules to ${count} transaction${count === 1 ? "" : "s"}`
            : "No uncategorized transactions matched your rules",
        type: count > 0 ? "success" : "info",
      })
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Something went wrong",
        type: "error",
      })
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-xl border p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-semibold">Rules</h2>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            Options
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={applying} onClick={handleApplyRules}>
              <Sparkles />
              Apply rules to existing transactions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-sm text-muted-foreground">
        Rules automatically recategorize new transactions whose payee
        contains a keyword. If multiple rules match, they apply in the order
        listed here (top to bottom) — drag to reorder.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          {filtered.length} Rule{filtered.length === 1 ? "" : "s"}
        </span>
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto w-full max-w-56"
        />
        <CreateRuleDialog categoryGroups={categoryGroups} />
      </div>
      <div className="flex flex-col gap-2">
        {filtered.length ? (
          filtered.map((rule) => (
            <div
              key={rule.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", rule.id)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverId(rule.id)
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(e, rule.id)}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                dragOverId === rule.id ? "bg-muted" : ""
              }`}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50" />
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">If payee</span>
                <Chip>contains</Chip>
                <Chip>&ldquo;{rule.keyword}&rdquo;</Chip>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Recategorize to</span>
                <Chip>{rule.category}</Chip>
              </div>
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) => void toggleRule(rule.id, checked)}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                onClick={() => void deleteRule(rule.id)}
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Delete rule</span>
              </Button>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {rules.length ? "No rules match your search." : "No rules yet."}
          </p>
        )}
      </div>
    </div>
  )
}
