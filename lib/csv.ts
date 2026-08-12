import { CategoryRule, matchRule, Transaction } from "./transactions"

// Minimal RFC 4180-ish CSV parser: handles quoted fields, escaped quotes ("")
// commas/newlines inside quotes. No external dependency needed for this scale.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }

  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""))
}

export type ColumnMapping = {
  date: number | null
  description: number | null
  amountMode: "single" | "split"
  amount: number | null
  debit: number | null
  credit: number | null
  type: number | null
  category: number | null
}

export type DraftRow = {
  id: string
  included: boolean
  date: string
  description: string
  amount: string
  type: "income" | "expense"
  category: string | null
  rowErrors: string[]
  duplicateOf: { date: string; description: string; amount: number } | null
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase()
}

function findIndexOrNull(normalized: string[], names: string[]): number | null {
  const idx = normalized.findIndex((h) => names.includes(h))
  return idx === -1 ? null : idx
}

/** Best-guess mapping from CSV headers to import fields, used to pre-fill the mapping step. */
export function detectColumnMapping(header: string[]): ColumnMapping {
  const normalized = header.map(normalizeHeader)

  const amount = findIndexOrNull(normalized, ["amount"])
  const debit = findIndexOrNull(normalized, ["debit", "withdrawal", "debit amount", "money out"])
  const credit = findIndexOrNull(normalized, ["credit", "deposit", "credit amount", "money in"])
  const amountMode: "single" | "split" =
    amount === null && (debit !== null || credit !== null) ? "split" : "single"

  return {
    date: findIndexOrNull(normalized, ["date", "transaction date", "posted date", "trans date"]),
    description: findIndexOrNull(normalized, ["description", "payee", "merchant", "name", "details"]),
    amountMode,
    amount: amountMode === "single" ? amount : null,
    debit: amountMode === "split" ? debit : null,
    credit: amountMode === "split" ? credit : null,
    type: findIndexOrNull(normalized, ["type", "transaction type"]),
    category: findIndexOrNull(normalized, ["category"]),
  }
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (usMatch) {
    const [, m, d, y] = usMatch
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return null
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,]/g, "").trim()
  if (!cleaned) return null
  const value = Number.parseFloat(cleaned)
  return Number.isNaN(value) ? null : value
}

/** Exact date + amount + normalized-description match against an account's existing transactions. */
export function findDuplicate(
  candidate: { date: string; description: string; amount: number; accountId: string },
  existingTransactions: Transaction[]
): Transaction | null {
  const normalizedDescription = candidate.description.trim().toLowerCase()
  return (
    existingTransactions.find(
      (t) =>
        t.accountId === candidate.accountId &&
        t.date === candidate.date &&
        Math.abs(t.amount - candidate.amount) < 0.005 &&
        t.description.trim().toLowerCase() === normalizedDescription
    ) ?? null
  )
}

/** Applies a user-confirmed column mapping to every data row, producing editable draft rows. */
export function buildDraftRows(
  table: string[][],
  mapping: ColumnMapping,
  knownCategories: string[],
  rules: CategoryRule[],
  existingTransactions: Transaction[],
  accountId: string
): DraftRow[] {
  const categoryByLower = new Map(knownCategories.map((c) => [c.toLowerCase(), c]))

  return table.slice(1).map((cells, index) => {
    const lineNumber = index + 2
    const rowErrors: string[] = []

    const rawDate = mapping.date !== null ? (cells[mapping.date] ?? "") : ""
    const date = parseDate(rawDate)
    if (!date) rowErrors.push(`Couldn't read the date.`)

    const description = (mapping.description !== null ? (cells[mapping.description] ?? "") : "").trim()
    if (!description) rowErrors.push(`Missing description.`)

    let amount = 0
    let type: "income" | "expense" = "expense"

    if (mapping.amountMode === "split") {
      const debit = mapping.debit !== null ? parseAmount(cells[mapping.debit] ?? "") : null
      const credit = mapping.credit !== null ? parseAmount(cells[mapping.credit] ?? "") : null
      if (debit === null && credit === null) {
        rowErrors.push(`Couldn't read the debit/credit amount.`)
      } else if ((debit ?? 0) > 0) {
        amount = debit ?? 0
        type = "expense"
      } else {
        amount = credit ?? 0
        type = "income"
      }
    } else {
      const parsed = mapping.amount !== null ? parseAmount(cells[mapping.amount] ?? "") : null
      if (parsed === null) {
        rowErrors.push(`Couldn't read the amount.`)
      } else {
        const explicitType =
          mapping.type !== null ? cells[mapping.type]?.trim().toLowerCase() : undefined
        type =
          explicitType === "income" || explicitType === "expense"
            ? explicitType
            : parsed < 0
              ? "expense"
              : "income"
        amount = Math.abs(parsed)
      }
    }

    const rawCategory = mapping.category !== null ? cells[mapping.category]?.trim() : ""
    const category = rawCategory
      ? (categoryByLower.get(rawCategory.toLowerCase()) ?? rawCategory)
      : (matchRule(description, rules)?.category ?? null)

    const duplicate =
      date && description && rowErrors.length === 0
        ? findDuplicate({ date, description, amount, accountId }, existingTransactions)
        : null

    return {
      id: `row-${lineNumber}`,
      included: rowErrors.length === 0 && !duplicate,
      date: date ?? rawDate,
      description,
      amount: rowErrors.length === 0 ? String(amount) : "",
      type,
      category,
      rowErrors,
      duplicateOf: duplicate
        ? { date: duplicate.date, description: duplicate.description, amount: duplicate.amount }
        : null,
    }
  })
}
