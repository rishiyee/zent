export const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
] as const

export const REGIONS = [
  { code: "US", label: "United States", locale: "en-US" },
  { code: "GB", label: "United Kingdom", locale: "en-GB" },
  { code: "EU", label: "European Union", locale: "de-DE" },
  { code: "IN", label: "India", locale: "en-IN" },
  { code: "JP", label: "Japan", locale: "ja-JP" },
  { code: "CA", label: "Canada", locale: "en-CA" },
  { code: "AU", label: "Australia", locale: "en-AU" },
  { code: "SG", label: "Singapore", locale: "en-SG" },
] as const

export const DEFAULT_CURRENCY = "USD"
export const DEFAULT_REGION = "US"

export function regionLocale(region: string | null | undefined): string {
  return REGIONS.find((r) => r.code === region)?.locale ?? "en-US"
}
