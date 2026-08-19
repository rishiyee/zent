"use client"

import * as React from "react"
import { Download, Info, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { addInvestmentHolding } from "@/app/(dashboard)/investments/actions"
import { useCurrency } from "@/components/currency-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { InvestmentAssetType, InvestmentHolding, InvestmentPricePoint } from "@/lib/investments"
import { investmentAssetLabels } from "@/lib/investments"
import { cn } from "@/lib/utils"

type Range = "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y"

function rangeStart(range: Range, now = new Date()) {
  const start = new Date(now)
  if (range === "YTD") return new Date(now.getFullYear(), 0, 1)
  const days: Partial<Record<Range, number>> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "5Y": 1825 }
  start.setDate(start.getDate() - (days[range] ?? 90))
  return start
}

function performanceData(history: InvestmentPricePoint[], holdings: InvestmentHolding[], range: Range) {
  const holdingIds = new Set(holdings.map((item) => item.id))
  const totals = new Map<string, number>()
  for (const point of history) {
    if (!holdingIds.has(point.holdingId) || new Date(`${point.valuedOn}T00:00:00`) < rangeStart(range)) continue
    totals.set(point.valuedOn, (totals.get(point.valuedOn) ?? 0) + point.price * point.quantity)
  }
  const today = new Date().toISOString().slice(0, 10)
  totals.set(today, holdings.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const points = [...totals].sort(([a], [b]) => a.localeCompare(b))
  const baseline = points[0]?.[1] ?? 0
  return points.map(([date, value]) => ({
    label: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`)),
    portfolio: baseline > 0 ? Number((((value - baseline) / baseline) * 100).toFixed(2)) : 0,
  }))
}

export function InvestmentsView({ accounts, initialHoldings, priceHistory }: { accounts: Array<{ id: string; name: string }>; initialHoldings: InvestmentHolding[]; priceHistory: InvestmentPricePoint[] }) {
  const { format } = useCurrency()
  const [range, setRange] = React.useState<Range>("3M")
  const [account, setAccount] = React.useState("all")
  const [groupBy, setGroupBy] = React.useState("type")
  const holdings = account === "all" ? initialHoldings : initialHoldings.filter((item) => item.accountId === account)
  const chartData = React.useMemo(() => performanceData(priceHistory, holdings, range), [priceHistory, holdings, range])
  const total = holdings.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const portfolioChange = chartData.at(-1)?.portfolio ?? 0
  const groups = groupBy === "none" ? [["All holdings", holdings] as const] : [...new Set(holdings.map((item) => item.type))].map((type) => [investmentAssetLabels[type], holdings.filter((item) => item.type === type)] as const)

  function exportCsv() {
    const rows = ["Symbol,Name,Type,Price,Quantity,Cost basis,Value", ...holdings.map((item) => `${item.symbol},${item.name},${item.type},${item.price},${item.quantity},${item.costBasis ?? ""},${item.price * item.quantity}`)]
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }))
    link.download = "zent-holdings.csv"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return <Tabs defaultValue="holdings" className="gap-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
      <div><h1 className="text-2xl font-semibold tracking-tight">Investments</h1><p className="text-sm text-muted-foreground">Track portfolio performance and manage your holdings.</p></div>
      <TabsList variant="line" className="xl:ml-4"><TabsTrigger value="holdings">Holdings</TabsTrigger><TabsTrigger value="allocation">Allocation</TabsTrigger></TabsList>
      <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
        <ToggleGroup size="sm" className="flex-wrap" aria-label="Performance range">{(["1W", "1M", "3M", "6M", "YTD", "1Y", "5Y"] as Range[]).map((item) => <ToggleGroupItem key={item} pressed={range === item} onPressedChange={(pressed) => pressed && setRange(item)} aria-label={item}>{item}</ToggleGroupItem>)}</ToggleGroup>
        <Select value={account} onValueChange={(value) => value && setAccount(value)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All accounts</SelectItem>{accounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
      </div>
    </div>

    <TabsContent value="holdings" className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PerformanceCard title="Your portfolio" value={format(total)} change={portfolioChange} accent="bg-primary" />
        <PerformanceCard title="Invested cost" value={format(holdings.reduce((sum, item) => sum + (item.costBasis ?? item.price * item.quantity), 0))} change={portfolioChange} accent="bg-sky-400" />
        <PerformanceCard title="US stocks" value={format(holdings.filter((item) => item.type === "stock").reduce((sum, item) => sum + item.price * item.quantity, 0))} change={portfolioChange} />
        <PerformanceCard title="Crypto" value={format(holdings.filter((item) => item.type === "cryptocurrency").reduce((sum, item) => sum + item.price * item.quantity, 0))} change={portfolioChange} />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center border-b py-4"><div className="flex flex-wrap gap-4 text-sm font-medium"><Legend color="bg-primary" label="Your portfolio" /></div><Button className="ml-auto" variant="ghost" size="icon" onClick={exportCsv} aria-label="Export holdings"><Download /></Button></CardHeader>
        <CardContent className="p-3 sm:p-6"><ChartContainer config={{ portfolio: { label: "Your portfolio", color: "var(--primary)" } }} className="h-[320px] w-full sm:h-[430px]"><LineChart data={chartData} margin={{ left: 0, right: 12 }}><CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} width={44} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => <div className="flex min-w-36 justify-between gap-4"><span className="text-muted-foreground">Portfolio</span><span className="font-medium tabular-nums">{Number(value).toFixed(2)}%</span></div>} />} /><Line type="monotone" dataKey="portfolio" stroke="var(--color-portfolio)" strokeWidth={3} dot={chartData.length < 3} /></LineChart></ChartContainer></CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center"><CardTitle className="flex items-center gap-2">Holdings <Info className="size-4 text-muted-foreground" /></CardTitle><div className="flex flex-wrap gap-2 sm:ml-auto"><Select value={groupBy} onValueChange={(value) => value && setGroupBy(value)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="type">Group by type</SelectItem><SelectItem value="none">No grouping</SelectItem></SelectContent></Select><AddHolding accounts={accounts} selectedAccount={account} /></div></CardHeader>
        <Table><TableHeader><TableRow><TableHead>Security</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Cost basis</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader><TableBody>{groups.map(([group, items]) => <React.Fragment key={group}><TableRow className="bg-muted/40 hover:bg-muted/40"><TableCell colSpan={5} className="font-medium text-muted-foreground">{group}</TableCell></TableRow>{items.map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{item.symbol}</div><div className="text-xs text-muted-foreground">{item.name}</div></TableCell><TableCell className="text-right tabular-nums">{format(item.price)}</TableCell><TableCell className="text-right tabular-nums">{item.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</TableCell><TableCell className="text-right tabular-nums">{item.costBasis === null ? "—" : format(item.costBasis)}</TableCell><TableCell className="text-right font-medium tabular-nums">{format(item.price * item.quantity)}</TableCell></TableRow>)}</React.Fragment>)}</TableBody></Table>
      </Card>
    </TabsContent>

    <TabsContent value="allocation"><Card><CardHeader><CardTitle>Portfolio allocation</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">{groups.filter(([name]) => name !== "All holdings").map(([name, items]) => { const value = items.reduce((sum, item) => sum + item.price * item.quantity, 0); return <div key={name} className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{name}</p><p className="mt-1 text-xl font-semibold tabular-nums">{format(value)}</p><p className="text-sm text-muted-foreground">{((value / Math.max(total, 1)) * 100).toFixed(1)}% of portfolio</p></div> })}</CardContent></Card></TabsContent>
  </Tabs>
}

function PerformanceCard({ title, value, change, accent = "bg-muted-foreground/40" }: { title: string; value: string; change: number; accent?: string }) {
  return <Card className="relative overflow-hidden"><div className={cn("absolute inset-x-0 top-0 h-1", accent)} /><CardHeader><CardTitle className="text-base">{title}</CardTitle><p className="text-xl font-semibold tabular-nums">{value}</p><div><p className="text-xs font-medium uppercase text-muted-foreground">Selected period</p><p className={cn("mt-1 font-semibold tabular-nums", change >= 0 ? "text-emerald-600" : "text-rose-600")}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</p></div></CardHeader></Card>
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><span className={cn("size-2.5 rounded-full", color)} />{label}</span> }

function AddHolding({ accounts, selectedAccount }: { accounts: Array<{ id: string; name: string }>; selectedAccount: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const [accountId, setAccountId] = React.useState(selectedAccount === "all" ? accounts[0]?.id ?? "" : selectedAccount)
  const [symbol, setSymbol] = React.useState("")
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<InvestmentAssetType>("stock")
  const [price, setPrice] = React.useState("")
  const [quantity, setQuantity] = React.useState("")
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const parsedPrice = Number(price)
    const parsedQuantity = Number(quantity)
    if (!accountId || !symbol.trim() || !name.trim() || parsedPrice <= 0 || parsedQuantity <= 0) return
    startTransition(async () => {
      await addInvestmentHolding({ accountId, symbol, name, type, price: parsedPrice, quantity: parsedQuantity })
      setSymbol(""); setName(""); setPrice(""); setQuantity(""); setOpen(false)
      router.refresh()
    })
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button disabled={accounts.length === 0} />}><Plus /> Add holding</DialogTrigger><DialogContent><form onSubmit={submit}><DialogHeader><DialogTitle>Add holding</DialogTitle><DialogDescription>Add a security to an investment account.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><div className="grid gap-2 sm:col-span-2"><Label>Investment account</Label><Select value={accountId} onValueChange={(value) => value && setAccountId(value)}><SelectTrigger className="w-full"><SelectValue placeholder="Select an account" /></SelectTrigger><SelectContent>{accounts.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="holding-symbol">Symbol</Label><Input id="holding-symbol" value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="AAPL" required /></div><div className="grid gap-2"><Label htmlFor="holding-name">Name</Label><Input id="holding-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Apple Inc." required /></div><div className="grid gap-2 sm:col-span-2"><Label>Asset type</Label><Select value={type} onValueChange={(value) => value && setType(value as InvestmentAssetType)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(investmentAssetLabels) as Array<[InvestmentAssetType, string]>).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="holding-price">Price</Label><Input id="holding-price" type="number" min="0.00000001" step="any" value={price} onChange={(event) => setPrice(event.target.value)} required /></div><div className="grid gap-2"><Label htmlFor="holding-quantity">Quantity</Label><Input id="holding-quantity" type="number" min="0.00000001" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending || !accountId}>{pending ? "Adding…" : "Add holding"}</Button></DialogFooter></form></DialogContent></Dialog>
}
