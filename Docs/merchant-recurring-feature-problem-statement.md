# Feature: Merchant Edit & Recurring Transaction Setup

## Problem Statement

When a user opens a transaction, they need a way to correct or enrich the merchant behind it (name, photo) and, separately, mark that merchant as recurring so the app can forecast future transactions from it — without this being folded confusingly into basic transaction editing.

Right now, without this, merchants stay as raw imported names (which may be inaccurate or unclear, e.g., a person's name instead of a business), and there's no way to tell the system "I expect to pay/receive from this merchant repeatedly" so it shows up in forecasting/recurring views.

## Context

- A transaction is tied to a merchant, but the merchant identity (name, photo) may need manual correction — e.g., an imported transaction might just show a person's name ("Matt") instead of a properly identified merchant.
- Some merchants represent recurring activity (rent, subscriptions, loans) that the user wants forecasted into the future, not just logged after the fact.
- Recurring setup needs enough detail (frequency, type, starting date, amount, status) to actually forecast upcoming transactions accurately.
- A recurring merchant can later be paused or ended (status changed to "Canceled") without erasing its transaction history — past transactions must remain visible even if future forecasting stops.
- There's also a need to resolve duplicate/incorrectly split merchants by merging them together.

## Requirements

1. User must be able to edit a merchant's name and photo from within a transaction.
2. User must be able to toggle a merchant as "recurring," which surfaces it in a dedicated Recurring section with forecasted upcoming transactions.
3. When marked recurring, the user must be able to define:
   - Recurring frequency (e.g., weekly, monthly)
   - Recurring type (Expense or Income)
   - Starting date (used as the anchor for forecasting future occurrences)
   - Amount (expected recurring amount)
   - Recurring status (Active or Canceled)
4. If status is set to Canceled, past transactions must remain visible in the recurring calendar, but no new future transactions should be forecasted.
5. User must be able to merge a merchant into another and delete the duplicate, consolidating transaction history under one merchant.
6. Changes made here must be saved independently (Save) or discarded (Cancel) without affecting the rest of the transaction being edited.

## Open Questions for Design/Eng to Resolve

- If a merchant is merged into another, what happens to its recurring configuration, if any existed?
- Can a merchant be recurring with a variable amount (e.g., "roughly $X"), or must the amount be fixed for forecasting to work?
- What recurring frequency options need to be supported (weekly, biweekly, monthly, custom/irregular)?
- Does turning off "recurring" on a merchant delete the recurring configuration entirely, or just stop forecasting while preserving the settings?
- Should merchant name/photo edits apply only to this transaction's merchant globally, or create a new distinct merchant?
