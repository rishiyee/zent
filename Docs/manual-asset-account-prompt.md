# Feature: Manual Asset / Valuables Account

## Problem Statement

Users have assets that don't sync via bank/API connections — things like art, jewelry, vehicles, real estate, or collectibles — but they still want these reflected in their overall net worth and asset breakdown. Currently there's no way to add a non-linked asset to the ledger; only connected accounts are supported.

## Context

- These accounts have no live balance feed — the user must self-report and periodically update the value.
- The value entered should factor into the existing Net Worth calculation and Assets/Liabilities summary, the same way a connected account does.
- This needs to sit within our existing account creation flow (wherever "Add Account" currently lives), not as a separate disconnected feature.

## Requirements

1. User can create a new account of this type with, at minimum: a name, a category/type of valuable, and a balance/value.
2. The category should be selectable from a defined set (not free text) so reporting/grouping stays consistent.
3. Balance is manually entered and editable at any time (not real-time synced).
4. Once created, the account should appear alongside other manual/connected accounts and contribute to net worth, asset totals, and any existing summary breakdowns (assets vs. liabilities).
5. Should support future updates to the value (e.g., re-appraisal) without needing to delete/recreate the account.

## Open Questions for Design/Eng to Resolve

- What's the full list of valuable categories we need to support?
- Do we need value history/tracking over time for these, or just current balance?
- Should there be any validation or guardrails on entered values (e.g., currency formatting, negative values)?
