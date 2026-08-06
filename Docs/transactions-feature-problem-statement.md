# Feature: Transactions Table / Ledger View

## Problem Statement

Users need a central view where every transaction across all their accounts is listed in one place, so they can see what was spent, earned, or moved — when it happened, where it happened, what it was for, and which account it hit — without having to check each account individually.

Right now, without this view, a user has no single source of truth for their financial activity. They can't quickly answer basic questions like "what did I spend this week," "has this transaction been reviewed," or "what category is this expense in" — they'd have to piece it together manually across accounts.

## Context

- Transactions originate from multiple accounts (cash, cards, etc.), each potentially a different type (bank, credit, manual/cash).
- Transactions need to be categorized (e.g., Rent, Pets, Charity, Interest) so users can understand spending patterns later in reports/budgets.
- Some transactions need a review/confirmation step — e.g., freshly synced or uncategorized transactions may need the user to confirm details before they're considered "settled."
- Transactions are naturally grouped by day, and users want to see a running total per day as well as per account.
- Users need to be able to search, filter, and sort this list since it can grow very large over time.
- Some transactions may need editing after the fact (recategorizing, fixing merchant name, splitting, etc.), individually or in bulk.

## Requirements

1. Every transaction must show, at minimum: date, merchant/payee, category, account, and amount.
2. Transactions must be groupable by date, with a summed total shown per group.
3. Each transaction must have a status (e.g., needs review / reviewed / pending) so the user knows what still requires attention.
4. Users must be able to filter the list (by date range, account, category, amount, etc.) and search by keyword.
5. Users must be able to sort the list (e.g., by date, amount).
6. Users must be able to edit a transaction (single) or multiple transactions at once (bulk edit).
7. Users must be able to manually add a transaction (for cash or untracked activity).
8. There should be a way to define rules so recurring transactions get auto-categorized instead of requiring manual review each time.
9. Each transaction should be expandable/clickable to view full details.

## Open Questions for Design/Eng to Resolve

- What exact statuses should a transaction support, and what triggers each one (e.g., is "needs review" only for synced/imported transactions)?
- Can a transaction belong to more than one category (split transactions), or is it strictly one category per transaction?
- Should manually added transactions (e.g., cash) behave differently from synced ones in terms of review status?
- What happens when a transaction is bulk-edited — which fields are safe to change in bulk vs. which need individual attention?
- Do daily/period totals need to separate income from expenses, or just show a net number?
