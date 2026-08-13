"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format as formatDate } from "date-fns"
import { ArrowDownRight, ArrowUpRight, Building2, CalendarClock, CalendarIcon, Check, MoreHorizontal, Pencil, Plus, Search, Sparkles } from "lucide-react"

import { renameMerchant } from "@/app/(dashboard)/settings/merchants/actions"
import {
  createRecurringSchedule,
  deleteRecurringSchedule,
  dismissRecurringSuggestion,
  setRecurringScheduleStatus,
  updateRecurringSchedule,
} from "@/app/(dashboard)/settings/merchants/recurring-actions"
import { Account } from "@/lib/accounts"
import { CategoryGroup } from "@/lib/categories"
import { Merchant } from "@/lib/data/merchants"
import {
  cadenceLabels,
  RecurringCadence,
  RecurringSchedule,
  RecurringScheduleInput,
  RecurringSuggestion,
} from "@/lib/recurring"
import { accountName, transactionAccountOptions, UNCATEGORIZED } from "@/lib/transactions"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCurrency } from "@/components/currency-provider"
import { CategorySelect } from "@/components/transactions/category-select"
import { PayeeCombobox } from "@/components/transactions/payee-combobox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type SortKey = "count" | "name"
type EditorState = { id?: string; value: RecurringScheduleInput } | null

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })

function defaultSchedule(name: string, accountId: string): RecurringScheduleInput {
  const next = new Date()
  next.setMonth(next.getMonth() + 1)
  return {
    merchantName: name,
    transactionType: "expense",
    amount: 0,
    accountId,
    category: null,
    cadence: "monthly",
    nextDate: next.toISOString().slice(0, 10),
    status: "active",
  }
}

function ScheduleEditor({
  editor, accounts, categoryGroups, merchants, onChange, onClose, onSaved,
}: {
  editor: EditorState
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  merchants: string[]
  onChange: (editor: EditorState) => void
  onClose: () => void
  onSaved: () => void
}) {
  const [pending, setPending] = React.useState(false)
  const isMobile = useIsMobile()
  const { format } = useCurrency()
  if (!editor) return null
  const value = editor.value
  const groups = categoryGroups.filter((group) => group.type === value.transactionType)
  const patch = (next: Partial<RecurringScheduleInput>) => onChange({ ...editor, value: { ...value, ...next } })

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!value.merchantName.trim() || value.amount <= 0 || !value.nextDate) return
    setPending(true)
    try {
      if (editor?.id) await updateRecurringSchedule(editor.id, value)
      else await createRecurringSchedule(value)
      toast.add({ title: editor?.id ? "Recurring schedule updated" : "Recurring schedule created", type: "success" })
      onSaved()
    } catch (error) {
      toast.add({ title: error instanceof Error ? error.message : "Could not save schedule", type: "error" })
    } finally {
      setPending(false)
    }
  }

  return (
    <Drawer open swipeDirection={isMobile ? "down" : "right"} showSwipeHandle={isMobile} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="[--drawer-content-width:min(32rem,100vw)]">
        <DrawerHeader className="border-b p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarClock className="size-5" /></div>
            <div className="grid gap-1"><DrawerTitle>{editor.id ? "Edit recurring transaction" : "Set up recurring transaction"}</DrawerTitle><DrawerDescription>Automatically create a pending ledger entry on schedule.</DrawerDescription></div>
          </div>
        </DrawerHeader>
        <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-6 overflow-y-auto p-4">
          <section className="grid gap-4">
            <div><h3 className="font-medium">Transaction details</h3><p className="text-xs text-muted-foreground">Choose what appears in your ledger.</p></div>
            <div className="grid gap-2"><Label htmlFor="recurring-merchant">Payee / description</Label><PayeeCombobox id="recurring-merchant" placeholder="e.g. Netflix or Monthly salary" value={value.merchantName} onChange={(merchantName) => patch({ merchantName })} merchants={merchants} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label>Type</Label><Select items={{ expense: "Expense", income: "Income" }} value={value.transactionType} onValueChange={(v) => v && patch({ transactionType: v as "income" | "expense", category: null })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="recurring-amount">Amount</Label><Input id="recurring-amount" type="number" min="0.01" step="0.01" value={value.amount || ""} onChange={(e) => patch({ amount: Number(e.target.value) })} required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Account</Label><Select items={Object.fromEntries(transactionAccountOptions(accounts).map((a) => [a.id, a.name]))} value={value.accountId} onValueChange={(v) => v && patch({ accountId: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{transactionAccountOptions(accounts).map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Category</Label><CategorySelect className="w-full" groups={groups} value={value.category ?? UNCATEGORIZED} onValueChange={(v) => patch({ category: v === UNCATEGORIZED ? null : v })} leadingOptions={[{ value: UNCATEGORIZED, label: "Uncategorized" }]} /></div></div>
          </section>
          <div className="h-px bg-border" />
          <section className="grid gap-4">
            <div><h3 className="font-medium">Schedule</h3><p className="text-xs text-muted-foreground">Choose when this transaction should recur.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label>Repeats</Label><Select items={cadenceLabels} value={value.cadence} onValueChange={(v) => v && patch({ cadence: v as RecurringCadence })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(cadenceLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label htmlFor="recurring-next">Next date</Label><Popover><PopoverTrigger render={<Button id="recurring-next" type="button" variant="outline" className="w-full justify-start font-normal" />}><CalendarIcon />{formatDate(new Date(`${value.nextDate}T12:00:00`), "PPP")}</PopoverTrigger><PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={new Date(`${value.nextDate}T12:00:00`)} onSelect={(date) => date && patch({ nextDate: formatDate(date, "yyyy-MM-dd") })} autoFocus={!isMobile} /></PopoverContent></Popover></div>
          </div>
          </section>
          {value.amount > 0 && value.nextDate && <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></div><div className="min-w-0"><p className="text-sm font-medium">Next transaction</p><p className="mt-0.5 text-sm leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">{format(value.amount)}</span> for {value.merchantName || "this payee"} on {dateFormatter.format(new Date(`${value.nextDate}T12:00:00`))}. Repeats {cadenceLabels[value.cadence].toLowerCase()}.</p></div></div>}
          </div>
          <DrawerFooter className="border-t bg-background p-4">
            <Button type="submit" disabled={pending || !value.merchantName.trim() || value.amount <= 0}>{pending ? "Saving…" : "Save schedule"}</Button>
            <DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export function MerchantsView({ merchants, accounts, categoryGroups, schedules, suggestions, recurringOnly = false, merchantOnly = false }: {
  merchants: Merchant[]
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  schedules: RecurringSchedule[]
  suggestions: RecurringSuggestion[]
  recurringOnly?: boolean
  merchantOnly?: boolean
}) {
  const router = useRouter()
  const { format } = useCurrency()
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("count")
  const [editing, setEditing] = React.useState<Merchant | null>(null)
  const [draft, setDraft] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [editor, setEditor] = React.useState<EditorState>(null)
  const [actionPending, setActionPending] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<RecurringSchedule | null>(null)

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q ? merchants.filter((m) => m.name.toLowerCase().includes(q)) : merchants
    return [...list].sort((a, b) => sort === "count" ? b.count - a.count : a.name.localeCompare(b.name))
  }, [merchants, search, sort])
  const recurringByMerchant = React.useMemo(() => new Map(schedules.map((schedule) => [schedule.merchantName.toLowerCase(), schedule])), [schedules])
  const suggestedMerchants = React.useMemo(() => new Set(suggestions.map((suggestion) => suggestion.merchantName.toLowerCase())), [suggestions])
  const activeSchedules = schedules.filter((schedule) => schedule.status === "active")
  const monthlyExpense = activeSchedules
    .filter((schedule) => schedule.transactionType === "expense")
    .reduce((sum, schedule) => sum + schedule.amount * ({ weekly: 52 / 12, biweekly: 26 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }[schedule.cadence]), 0)
  const nextSchedule = [...activeSchedules].sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0]

  function refresh() { setEditor(null); router.refresh() }
  function editSchedule(schedule: RecurringSchedule) { setEditor({ id: schedule.id, value: { ...schedule } }) }
  function createFromSuggestion(suggestion: RecurringSuggestion) { setEditor({ value: { ...suggestion, status: "active" } }) }
  function createForMerchant(name: string) { setEditor({ value: defaultSchedule(name, accounts[0]?.id ?? "CASH") }) }

  async function run(key: string, action: Promise<unknown>, success: string) {
    setActionPending(key)
    try { await action; toast.add({ title: success, type: "success" }); router.refresh() }
    catch (error) { toast.add({ title: error instanceof Error ? error.message : "Something went wrong", type: "error" }) }
    finally { setActionPending(null) }
  }

  async function submitRename(event: React.FormEvent) {
    event.preventDefault()
    if (!editing) return
    const next = draft.trim()
    if (!next || next === editing.name) { setEditing(null); return }
    setPending(true)
    try { await renameMerchant(editing.name, next); toast.add({ title: "Merchant updated", type: "success" }); setEditing(null); router.refresh() }
    catch (error) { toast.add({ title: error instanceof Error ? error.message : "Something went wrong", type: "error" }) }
    finally { setPending(false) }
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      {!recurringOnly && <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{merchantOnly ? "Merchants" : "Merchants & recurring"}</h2>
        <p className="text-sm text-muted-foreground">{merchantOnly ? "Review payees, manage names, and connect merchants to recurring schedules." : "Stay ahead of repeating income and expenses, and keep merchant names tidy."}</p>
      </div>}
      <Tabs defaultValue={merchantOnly ? "merchants" : "recurring"} className="min-w-0 gap-5">
        {!recurringOnly && !merchantOnly && <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="recurring" className="px-3">Recurring <Badge variant="secondary" className="ml-1">{schedules.length}</Badge></TabsTrigger>
          <TabsTrigger value="merchants" className="px-3">All merchants <Badge variant="secondary" className="ml-1">{merchants.length}</Badge></TabsTrigger>
        </TabsList>}
        {!merchantOnly && <TabsContent value="recurring" className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4"><p className="text-xs font-medium text-muted-foreground">Active schedules</p><p className="mt-2 text-2xl font-semibold tabular-nums">{activeSchedules.length}</p><p className="mt-1 text-xs text-muted-foreground">{schedules.length - activeSchedules.length} paused</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs font-medium text-muted-foreground">Estimated monthly expenses</p><p className="mt-2 text-2xl font-semibold tabular-nums">{format(monthlyExpense)}</p><p className="mt-1 text-xs text-muted-foreground">Normalized across cadences</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs font-medium text-muted-foreground">Next occurrence</p><p className="mt-2 truncate text-base font-semibold">{nextSchedule?.merchantName ?? "Nothing scheduled"}</p><p className="mt-1 text-xs text-muted-foreground">{nextSchedule ? dateFormatter.format(new Date(`${nextSchedule.nextDate}T12:00:00`)) : "Add a recurring transaction"}</p></div>
      </div>
      {suggestions.length > 0 && <section className="rounded-xl border bg-amber-500/5 p-5">
        <div className="mb-4 flex items-start gap-3"><div className="rounded-lg bg-amber-500/10 p-2 text-amber-600"><Sparkles className="size-4" /></div><div><h2 className="font-semibold">Recurring suggestions</h2><p className="text-sm text-muted-foreground">Patterns found in your transaction history. Nothing is scheduled until you confirm.</p></div></div>
        <div className="grid gap-3 xl:grid-cols-2">{suggestions.map((suggestion) => <div key={suggestion.key} className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center"><div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", suggestion.transactionType === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>{suggestion.transactionType === "income" ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-medium">{suggestion.merchantName}</p><Badge variant="outline">{suggestion.confidence} confidence</Badge></div><p className="mt-1 text-xs text-muted-foreground">{format(suggestion.amount)} · {cadenceLabels[suggestion.cadence]} · based on {suggestion.occurrences} transactions</p></div><div className="flex gap-2 sm:ml-auto"><Button size="sm" className="flex-1 sm:flex-none" onClick={() => createFromSuggestion(suggestion)}>Review</Button><Button size="sm" variant="ghost" disabled={actionPending === suggestion.key} onClick={() => void run(suggestion.key, dismissRecurringSuggestion(suggestion.merchantName, suggestion.transactionType), "Suggestion dismissed")}>Dismiss</Button></div></div>)}</div>
      </section>}

      <section className="rounded-xl border p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-semibold">Recurring transactions</h2><p className="text-sm text-muted-foreground">Pending transactions are created when their scheduled date arrives.</p></div><Button size="sm" onClick={() => createForMerchant("")}><Plus />Add recurring</Button></div>
        {schedules.length ? <div className="grid gap-3 xl:grid-cols-2">{schedules.map((schedule) => <div key={schedule.id} className={cn("group rounded-xl border p-4 transition-colors hover:bg-muted/20", schedule.status === "paused" && "bg-muted/30 opacity-75")}><div className="flex items-start gap-3"><div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", schedule.transactionType === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>{schedule.transactionType === "income" ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-medium">{schedule.merchantName}</span><Badge variant={schedule.status === "active" ? "secondary" : "outline"}>{schedule.status === "active" ? "Active" : "Paused"}</Badge></div><p className={cn("mt-1 text-xl font-semibold tabular-nums", schedule.transactionType === "income" && "text-emerald-600")}>{schedule.transactionType === "income" ? "+" : "−"}{format(schedule.amount)}</p></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" disabled={actionPending === schedule.id} />}><MoreHorizontal /><span className="sr-only">Schedule actions</span></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => editSchedule(schedule)}>Edit schedule</DropdownMenuItem><DropdownMenuItem onClick={() => void run(schedule.id, setRecurringScheduleStatus(schedule.id, schedule.status === "active" ? "paused" : "active"), schedule.status === "active" ? "Schedule paused" : "Schedule resumed")}>{schedule.status === "active" ? "Pause schedule" : "Resume schedule"}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(schedule)}>Delete schedule</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div><div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs"><div><p className="text-muted-foreground">Repeats</p><p className="mt-1 font-medium">{cadenceLabels[schedule.cadence]}</p></div><div><p className="text-muted-foreground">{schedule.status === "active" ? "Next date" : "Schedule"}</p><p className="mt-1 font-medium">{schedule.status === "active" ? dateFormatter.format(new Date(`${schedule.nextDate}T12:00:00`)) : "Paused"}</p></div><div><p className="text-muted-foreground">Account</p><p className="mt-1 truncate font-medium">{accountName(schedule.accountId, accounts)}</p></div><div><p className="text-muted-foreground">Category</p><p className="mt-1 truncate font-medium">{schedule.category ?? "Uncategorized"}</p></div></div></div>)}</div> : <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center"><div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted"><CalendarClock className="size-5 text-muted-foreground" /></div><h3 className="font-medium">No recurring transactions</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Add repeating bills, subscriptions, salary, or other regular activity.</p><Button className="mt-4" size="sm" onClick={() => createForMerchant("")}><Plus />Add your first schedule</Button></div>}
      </section>

        </TabsContent>}
        {!recurringOnly && <TabsContent value="merchants">

      <section className="rounded-xl border p-5">
        <div><h2 className="text-lg font-semibold">All merchants</h2><p className="mt-1 text-sm text-muted-foreground">Distinct payees from your transaction history.</p></div>
        <div className="my-4 flex flex-wrap items-center gap-2"><Select items={{ count: "Transaction count", name: "Name" }} value={sort} onValueChange={(v) => v && setSort(v as SortKey)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="count">Transaction count</SelectItem><SelectItem value="name">Name</SelectItem></SelectContent></Select><div className="relative ml-auto w-full max-w-64"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder={`Search ${merchants.length} merchants…`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" /></div></div>
        <div className="divide-y">{filtered.length ? filtered.map((merchant) => {
          const recurring = recurringByMerchant.get(merchant.name.toLowerCase())
          const suggested = suggestedMerchants.has(merchant.name.toLowerCase())
          return <div key={merchant.name} className="flex items-center gap-3 py-3"><div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Building2 className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-medium">{merchant.name}</span>{recurring && <Badge variant={recurring.status === "active" ? "secondary" : "outline"}>{recurring.status === "active" ? "Active" : "Paused"}</Badge>}{!recurring && suggested && <Badge variant="outline">Suggested</Badge>}</div><p className="text-xs text-muted-foreground">{merchant.count} transaction{merchant.count === 1 ? "" : "s"}</p></div><Button variant="outline" size="sm" onClick={() => recurring ? editSchedule(recurring) : createForMerchant(merchant.name)}><CalendarClock />{recurring ? "Manage" : "Recurring"}</Button><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(merchant); setDraft(merchant.name) }}><Pencil /><span className="sr-only">Rename merchant</span></Button></div>
        }) : <p className="py-8 text-center text-sm text-muted-foreground">{merchants.length ? "No merchants match your search." : "No transactions yet."}</p>}</div>
      </section>
        </TabsContent>}
      </Tabs>

      <ScheduleEditor editor={editor} accounts={accounts} categoryGroups={categoryGroups} merchants={merchants.map((merchant) => merchant.name)} onChange={setEditor} onClose={() => setEditor(null)} onSaved={refresh} />
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete recurring schedule?</AlertDialogTitle><AlertDialogDescription>Future transactions for {deleteTarget?.merchantName} will no longer be created. Transactions already added to your ledger will be kept.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep schedule</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (!deleteTarget) return; const target = deleteTarget; setDeleteTarget(null); void run(target.id, deleteRecurringSchedule(target.id), "Schedule deleted") }}>Delete schedule</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit merchant</DialogTitle><DialogDescription>Renames this payee across its transactions and recurring schedules.</DialogDescription></DialogHeader><form onSubmit={submitRename} className="flex flex-col gap-4"><Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus /><DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose><Button type="submit" disabled={pending || !draft.trim()}>{pending ? "Saving…" : "Save"}</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  )
}
