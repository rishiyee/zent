"use client"

import * as React from "react"
import { CalendarDays, Download, Filter, GitFork, BarChart3, Table2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

import type { Transaction } from "@/lib/transactions"
import type { CategoryGroup } from "@/lib/categories"
import type { Account } from "@/lib/accounts"
import { useCurrency } from "@/components/currency-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type ReportTab = "cash-flow" | "spending" | "income"
type Range = "all" | "year" | "90d" | "30d"
type View = "flow" | "bar" | "table"

const COLORS = ["#2563eb", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6", "#64748b"]

export function ReportsView({ transactions, categoryGroups, accounts }: {
  transactions: Transaction[]
  categoryGroups: CategoryGroup[]
  accounts: Account[]
}) {
  const { format } = useCurrency()
  const [tab, setTab] = React.useState<ReportTab>("cash-flow")
  const [range, setRange] = React.useState<Range>("all")
  const [account, setAccount] = React.useState("all")
  const [view, setView] = React.useState<View>("flow")

  const filtered = React.useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (range === "year") start.setMonth(0, 1)
    if (range === "90d") start.setDate(start.getDate() - 90)
    if (range === "30d") start.setDate(start.getDate() - 30)
    return transactions.filter((t) =>
      !t.linkedPaymentId && !t.transferToAccountId &&
      (account === "all" || t.accountId === account) &&
      (range === "all" || new Date(`${t.date}T00:00:00`) >= start)
    )
  }, [transactions, range, account])

  const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const net = income - expenses
  const savingsRate = income > 0 ? (net / income) * 100 : 0

  const categoryToGroup = React.useMemo(() => new Map(categoryGroups.flatMap(
    (g) => g.categories.map((c) => [c.name, { group: g.name, icon: c.icon }] as const)
  )), [categoryGroups])

  const rows = React.useMemo(() => {
    const map = new Map<string, { group: string; category: string; icon: string; value: number }>()
    const wanted = tab === "income" ? "income" : "expense"
    for (const t of filtered.filter((item) => item.type === wanted)) {
      const category = t.category ?? "Uncategorized"
      const meta = categoryToGroup.get(category)
      const key = `${meta?.group ?? "Other"}:${category}`
      const old = map.get(key)
      map.set(key, { group: meta?.group ?? "Other", category, icon: meta?.icon ?? "•", value: (old?.value ?? 0) + t.amount })
    }
    return [...map.values()].sort((a, b) => b.value - a.value)
  }, [filtered, tab, categoryToGroup])

  const rangeLabel = { all: "All Time", year: "This Year", "90d": "Last 90 Days", "30d": "Last 30 Days" }[range]

  function exportCsv() {
    const csv = ["Group,Category,Amount", ...rows.map((r) => `"${r.group}","${r.category}",${r.value}`)].join("\n")
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    link.download = `zent-${tab}-report.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <Tabs value={tab} onValueChange={(value) => setTab(value as ReportTab)} className="min-w-0 overflow-x-auto">
            <TabsList variant="line" aria-label="Report type">
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
              <TabsTrigger value="spending">Spending</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <Select value={range} onValueChange={(v) => v && setRange(v as Range)}>
              <SelectTrigger className="w-[150px]"><CalendarDays /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Time</SelectItem><SelectItem value="year">This Year</SelectItem><SelectItem value="90d">Last 90 Days</SelectItem><SelectItem value="30d">Last 30 Days</SelectItem></SelectContent>
            </Select>
            <Select value={account} onValueChange={(v) => v && setAccount(v)}>
              <SelectTrigger className="w-[170px]"><Filter /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Accounts</SelectItem>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}><Download /> Export</Button>
          </div>
        </div>

        {tab !== "spending" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total income" value={format(income)} tone="text-emerald-600 dark:text-emerald-400" />
          <Metric label="Total expenses" value={format(expenses)} tone="text-rose-600 dark:text-rose-400" />
          <Metric label="Net income" value={format(net)} tone={net >= 0 ? "text-foreground" : "text-rose-600 dark:text-rose-400"} />
          <Metric label="Savings rate" value={`${Math.max(0, savingsRate).toFixed(1)}%`} tone="text-foreground" />
        </div>}

        {tab === "spending" ? (
          <SpendingReport
            rows={rows}
            transactions={filtered.filter((t) => t.type === "expense")}
            accounts={accounts}
            total={expenses}
            rangeLabel={rangeLabel}
            format={format}
          />
        ) : <Card className="min-h-[560px] gap-0 py-0">
          <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{tab.replace('-', ' ')}</p><h2 className="mt-1 text-xl font-semibold">{rangeLabel}</h2></div>
            <div className="flex items-center gap-1 sm:ml-auto">
              <span className="mr-2 hidden text-sm text-muted-foreground sm:inline">By category & group</span>
              <ToggleGroup variant="outline" size="sm" spacing={0} aria-label="Report view">
                <ToggleGroupItem pressed={view === "flow"} onPressedChange={(pressed) => pressed && setView("flow")} aria-label="Flow" title="Flow"><GitFork /></ToggleGroupItem>
                <ToggleGroupItem pressed={view === "bar"} onPressedChange={(pressed) => pressed && setView("bar")} aria-label="Bars" title="Bars"><BarChart3 /></ToggleGroupItem>
                <ToggleGroupItem pressed={view === "table"} onPressedChange={(pressed) => pressed && setView("table")} aria-label="Table" title="Table"><Table2 /></ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <CardContent className="min-w-0 flex-1 p-3 sm:p-6">
            {rows.length === 0 ? <Empty /> : view === "flow" ? <FlowReport rows={rows} total={tab === "income" ? income : expenses} format={format} /> : view === "bar" ? <BarReport rows={rows} format={format} /> : <TableReport rows={rows} total={tab === "income" ? income : expenses} format={format} />}
          </CardContent>
        </Card>}
      </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardTitle className={cn("truncate text-2xl font-semibold tabular-nums", tone)}>{value}</CardTitle></CardHeader></Card>
}

type Row = { group: string; category: string; icon: string; value: number }

function SpendingReport({ rows, transactions, accounts, total, rangeLabel, format }: {
  rows: Row[]
  transactions: Transaction[]
  accounts: Account[]
  total: number
  rangeLabel: string
  format: (n: number) => string
}) {
  const [showAll, setShowAll] = React.useState(false)
  const visibleRows = showAll ? rows : rows.slice(0, 9)
  const accountNames = new Map(accounts.map((a) => [a.id, a.name]))
  const ordered = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  const largest = Math.max(0, ...transactions.map((t) => t.amount))
  const average = transactions.length ? total / transactions.length : 0
  const first = ordered.at(-1)?.date
  const last = ordered[0]?.date
  const date = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"

  return <div className="flex flex-col gap-6">
    <Card className="gap-0 py-0">
      <div className="border-b px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Spending by category</p>
        <h2 className="mt-1 text-xl font-semibold">{rangeLabel}</h2>
      </div>
      <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.5fr)] lg:items-center lg:p-8">
        {rows.length ? <div className="relative mx-auto h-[300px] w-full max-w-[360px]">
          <ChartContainer config={{}} className="h-full w-full">
            <PieChart><Pie data={rows} dataKey="value" nameKey="category" innerRadius={82} outerRadius={120} strokeWidth={2}>{rows.map((row, i) => <Cell key={row.category} fill={COLORS[i % COLORS.length]} />)}</Pie><ChartTooltip content={<ChartTooltipContent formatter={(v) => <span className="font-medium">{format(Number(v))}</span>} />} /></PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-xl font-semibold tabular-nums">{format(total)}</p><p className="text-sm text-muted-foreground">Total</p></div></div>
        </div> : <Empty />}
        <div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRows.map((row, i) => <div key={`${row.group}-${row.category}`} className="flex min-w-0 items-start gap-2.5"><span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><div className="min-w-0"><p className="truncate font-medium">{row.icon} {row.category}</p><p className="font-medium tabular-nums">{format(row.value)} <span className="text-muted-foreground">({((row.value / Math.max(total, 1)) * 100).toFixed(1)}%)</span></p></div></div>)}
          </div>
          {rows.length > 9 && <Button variant="ghost" className="mt-5" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show Less" : "Show All Categories"}</Button>}
        </div>
      </CardContent>
    </Card>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="gap-0 py-0">
        <div className="border-b px-5 py-4"><h2 className="text-lg font-medium">Transactions</h2><p className="text-sm text-muted-foreground">Expenses included in this report.</p></div>
        <div className="divide-y">
          {ordered.slice(0, 12).map((t) => <div key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,.8fr)_auto] sm:px-5"><div className="min-w-0"><p className="truncate font-medium">{t.description}</p><p className="text-xs text-muted-foreground sm:hidden">{date(t.date)}</p></div><p className="hidden truncate text-muted-foreground sm:block">{t.category ?? "Uncategorized"}</p><p className="hidden truncate text-muted-foreground sm:block">{accountNames.get(t.accountId) ?? "Cash"}</p><p className="font-medium tabular-nums">{format(t.amount)}</p></div>)}
          {!ordered.length && <div className="p-8 text-center text-sm text-muted-foreground">No spending transactions in this period.</div>}
        </div>
      </Card>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b"><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent className="divide-y px-4">
          <SummaryRow label="Total transactions" value={transactions.length.toLocaleString()} />
          <SummaryRow label="Largest transaction" value={format(largest)} />
          <SummaryRow label="Average transaction" value={format(average)} />
          <SummaryRow label="Total spending" value={format(total)} />
          <SummaryRow label="First transaction" value={date(first)} />
          <SummaryRow label="Last transaction" value={date(last)} />
        </CardContent>
      </Card>
    </div>
  </div>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3.5"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium tabular-nums text-right">{value}</span></div>
}

function FlowReport({ rows, total, format }: { rows: Row[]; total: number; format: (n: number) => string }) {
  const groups = [...new Set(rows.map((r) => r.group))].map((name) => ({ name, value: rows.filter((r) => r.group === name).reduce((s, r) => s + r.value, 0) })).sort((a,b) => b.value-a.value).slice(0, 6)
  const shown = rows.filter((r) => groups.some((g) => g.name === r.group)).slice(0, 9)
  const groupPositions = groups.reduce<{ items: Array<{ name: string; value: number; y: number; h: number }>; nextY: number }>((layout, group) => {
    const h = Math.max(38, (group.value / Math.max(total, 1)) * 380)
    return { items: [...layout.items, { ...group, y: layout.nextY, h }], nextY: layout.nextY + h + 18 }
  }, { items: [], nextY: 30 }).items
  const groupOffsets = new Map<string, number>()
  const rowPositions = shown.reduce<{ items: Array<{ row: Row; sourceH: number; sourceY: number; targetH: number; targetY: number; colorIndex: number }>; nextY: number }>((layout, row) => {
    const group = groupPositions.find((item) => item.name === row.group)!
    const used = groupOffsets.get(row.group) ?? 0
    const sourceH = Math.max(5, (row.value / group.value) * group.h)
    const sourceY = group.y + used + sourceH / 2
    groupOffsets.set(row.group, used + sourceH)
    const targetH = Math.max(28, (row.value / Math.max(total, 1)) * 380)
    const targetY = layout.nextY + targetH / 2
    return {
      items: [...layout.items, { row, sourceH, sourceY, targetH, targetY, colorIndex: groupPositions.indexOf(group) % COLORS.length }],
      nextY: layout.nextY + targetH + 16,
    }
  }, { items: [], nextY: 24 }).items
  return <div className="overflow-x-auto"><svg viewBox="0 0 1100 540" className="min-w-[900px] w-full" role="img" aria-label="Cash flow by category group and category">
    <defs>{COLORS.map((c, i) => <linearGradient key={c} id={`flow-${i}`} x1="0" x2="1"><stop stopColor={c} stopOpacity=".18"/><stop offset="1" stopColor={c} stopOpacity=".42"/></linearGradient>)}</defs>
    <text x="20" y="20" className="fill-muted-foreground text-[12px] font-semibold">TOTAL</text><text x="20" y="47" className="fill-foreground text-[18px] font-semibold">{format(total)}</text>
    {rowPositions.map(({ row, sourceH, sourceY, targetH, targetY, colorIndex }) => <g key={`${row.group}-${row.category}`}><path d={`M 430 ${sourceY} C 610 ${sourceY}, 650 ${targetY}, 820 ${targetY}`} fill="none" stroke={`url(#flow-${colorIndex})`} strokeWidth={sourceH} /><rect x="820" y={targetY-targetH/2} width="10" height={targetH} rx="2" fill={COLORS[colorIndex]} /><text x="850" y={targetY-4} className="fill-foreground text-[13px] font-medium">{row.icon} {row.category}</text><text x="850" y={targetY+15} className="fill-muted-foreground text-[12px]">{format(row.value)} · {((row.value/Math.max(total,1))*100).toFixed(1)}%</text></g>)}
    {groupPositions.map((g, i) => <g key={g.name}><rect x="420" y={g.y} width="10" height={g.h} rx="2" fill={COLORS[i % COLORS.length]} /><text x="395" y={g.y+g.h/2-4} textAnchor="end" className="fill-foreground text-[14px] font-medium">{g.name}</text><text x="395" y={g.y+g.h/2+15} textAnchor="end" className="fill-muted-foreground text-[12px]">{format(g.value)} · {((g.value/Math.max(total,1))*100).toFixed(1)}%</text></g>)}
  </svg></div>
}

function BarReport({ rows, format }: { rows: Row[]; format: (n: number) => string }) {
  return <ChartContainer config={{ value: { label: "Amount", color: "var(--primary)" } }} className="h-[470px] w-full"><BarChart data={rows.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 24 }}><CartesianGrid horizontal={false}/><XAxis type="number" tickFormatter={(v) => format(v)} /><YAxis type="category" dataKey="category" width={110} tickLine={false} axisLine={false}/><ChartTooltip content={<ChartTooltipContent formatter={(v) => <span className="font-medium">{format(Number(v))}</span>} />} /><Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} /></BarChart></ChartContainer>
}

function TableReport({ rows, total, format }: { rows: Row[]; total: number; format: (n: number) => string }) {
  return <div className="rounded-lg border"><Table>
    <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Group</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Share</TableHead></TableRow></TableHeader>
    <TableBody>{rows.map((r) => <TableRow key={`${r.group}-${r.category}`}><TableCell className="font-medium">{r.icon} {r.category}</TableCell><TableCell className="text-muted-foreground">{r.group}</TableCell><TableCell className="text-right font-medium tabular-nums">{format(r.value)}</TableCell><TableCell className="text-right text-muted-foreground tabular-nums">{((r.value / Math.max(total, 1)) * 100).toFixed(1)}%</TableCell></TableRow>)}</TableBody>
  </Table></div>
}

function Empty() { return <div className="grid min-h-[420px] place-items-center text-center"><div><BarChart3 className="mx-auto mb-3 size-8 text-muted-foreground"/><p className="font-medium">No report data</p><p className="text-sm text-muted-foreground">Try a wider date range or another account.</p></div></div> }
