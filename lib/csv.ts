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

export type ParsedTransactionRow = {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string | null
}

export type CsvImportResult = {
  rows: ParsedTransactionRow[]
  errors: string[]
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase()
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

export function parseTransactionsCsv(
  text: string,
  knownCategories: string[]
): CsvImportResult {
  const table = parseCsv(text)
  const errors: string[] = []
  if (table.length === 0) {
    return { rows: [], errors: ["The file is empty."] }
  }

  const header = table[0].map(normalizeHeader)
  const dateIdx = header.findIndex((h) => h === "date")
  const descIdx = header.findIndex((h) =>
    ["description", "payee", "merchant", "name"].includes(h)
  )
  const amountIdx = header.findIndex((h) => h === "amount")
  const typeIdx = header.findIndex((h) => h === "type")
  const categoryIdx = header.findIndex((h) => h === "category")

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    return {
      rows: [],
      errors: [
        'The file needs at least "Date", "Description", and "Amount" columns.',
      ],
    }
  }

  const categoryByLower = new Map(
    knownCategories.map((c) => [c.toLowerCase(), c])
  )

  const rows: ParsedTransactionRow[] = []
  for (let i = 1; i < table.length; i++) {
    const cells = table[i]
    const lineNumber = i + 1

    const date = parseDate(cells[dateIdx] ?? "")
    const description = (cells[descIdx] ?? "").trim()
    const amountRaw = (cells[amountIdx] ?? "").replace(/[$,]/g, "").trim()
    const amount = Number.parseFloat(amountRaw)

    if (!date) {
      errors.push(`Line ${lineNumber}: couldn't read the date.`)
      continue
    }
    if (!description) {
      errors.push(`Line ${lineNumber}: missing description.`)
      continue
    }
    if (Number.isNaN(amount)) {
      errors.push(`Line ${lineNumber}: couldn't read the amount.`)
      continue
    }

    const explicitType = typeIdx !== -1 ? cells[typeIdx]?.trim().toLowerCase() : undefined
    const type: "income" | "expense" =
      explicitType === "income" || explicitType === "expense"
        ? explicitType
        : amount < 0
          ? "expense"
          : "income"

    const rawCategory = categoryIdx !== -1 ? cells[categoryIdx]?.trim() : ""
    const category = rawCategory
      ? (categoryByLower.get(rawCategory.toLowerCase()) ?? rawCategory)
      : null

    rows.push({
      date,
      description,
      amount: Math.abs(amount),
      type,
      category,
    })
  }

  return { rows, errors }
}
