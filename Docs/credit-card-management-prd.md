# Credit Card Management — PRD

Status: **Draft, awaiting approval.** Nothing in this document has been built yet. This is a planning artifact only — no migrations, actions, or UI changes have been made.

## 1. Problem

Today, a credit card is just an `accounts` row with `category = 'credit-card'`. It has a name and a manually-edited balance, same as any other liability. There is no way to:

- Track multiple cards with their own credit limit, statement cycle, and due date.
- See how many days until a payment is due, or whether a card is overdue.
- Record a payment against a specific card and see payment history.
- See utilization (balance ÷ limit) per card or across all cards.
- Get any due-date-driven surface (a "cards due soon" list, a badge, a reminder) anywhere in the app.

This PRD scopes a **Credit Card Management** module on top of the existing Accounts feature to close those gaps.

## 2. Goals (V1)

1. Support **multiple credit cards**, each with its own limit, statement day, and due day.
2. Show, per card and in aggregate: current balance, credit limit, utilization %, next due date, days remaining / overdue state.
3. Let the user **record a payment** against a card (amount, date, which bank account it came from) and see payment history per card.
4. Let a payment mark the **current billing cycle as settled**, so the due-date indicator resets until the next cycle.
5. Surface all of this from a dedicated **Credit Cards** page, reachable from the sidebar, plus a compact summary on the Dashboard.

## 3. Non-goals (V1) — explicitly out of scope for now

- **Real bank sync.** Statement balances, due dates, and limits are entered and maintained manually, same as every other manual account in this app today.
- **Interest / APR calculation.** We'll store an optional APR field for future use, but no interest accrual math in V1.
- **Full statement history.** We track "the current cycle's due date and whether it's been paid," not a ledger of every past statement with its own balance and minimum payment. (See §7 for what a V2 "real statement tracking" would add.)
- **Reminders/notifications** (email, push, etc.). V1 is in-app visual indicators only (color-coded due dates), not an alerting system.
- **Automatic account-balance reconciliation.** See §6.3 — this is a real open question, not a silent decision.

## 4. Data model

New tables, following this project's existing conventions (per-user RLS via `auth.uid() = user_id`, `sort_order` for anything reorderable):

```sql
-- One row per credit card, 1:1 with an existing `accounts` row
-- (account.category = 'credit-card', account.balance = current outstanding balance,
-- same as today — this table adds the card-specific attributes accounts doesn't have).
create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  account_id uuid not null unique references accounts(id) on delete cascade,
  credit_limit numeric(14, 2) not null,
  apr numeric(5, 2),                    -- nullable, unused in V1 math, stored for later
  statement_day smallint not null check (statement_day between 1 and 28),
  payment_due_day smallint not null check (payment_due_day between 1 and 28),
  minimum_payment_type text not null default 'fixed' check (minimum_payment_type in ('fixed', 'percent')),
  minimum_payment_value numeric(14, 2) not null default 0,
  autopay boolean not null default false,
  created_at timestamptz not null default now()
);

-- One row per payment recorded against a card.
create table credit_card_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  credit_card_id uuid not null references credit_cards(id) on delete cascade,
  source_account_id uuid references accounts(id) on delete set null, -- which account paid it (nullable = "Cash/Untracked", same convention as transactions.account_id)
  amount numeric(14, 2) not null check (amount > 0),
  paid_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index credit_card_payments_card_idx on credit_card_payments (credit_card_id, paid_on desc);
```

Both tables get RLS enabled with the standard `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)` policy.

**Due date logic (computed, not stored):** "next due date" = the next calendar occurrence of `payment_due_day` from today. "Current cycle settled?" = does a `credit_card_payments` row exist with `paid_on >=` the most recent statement close date (the most recent occurrence of `statement_day`)? This avoids needing to model a full statement table in V1, at the cost of not tracking a distinct "statement balance" per cycle (see Non-goals).

## 5. UI / pages

- **Sidebar:** new "Credit Cards" item under Overview (or nested under Accounts — open question, see §8).
- **Credit Cards page** (`/credit-cards`):
  - Summary row: total balance across cards, total limit, blended utilization %.
  - One card per row/tile: name, balance, limit, utilization bar, next due date with color state (green >7 days / amber 3-7 / red ≤2 or overdue), "Record payment" quick action.
  - "Add credit card" — either wraps the existing Add Account flow (forcing category = credit-card) plus the new card-specific fields, or is a dedicated flow that creates both the `accounts` row and the `credit_cards` row in one step. (Recommend the latter — one form, one submit.)
- **Card detail** (click a row, matching the Accounts row-click pattern just built): balance, limit, utilization, due date, minimum payment, autopay flag, edit button, payment history table, "Record payment" button.
- **Record payment drawer:** amount, date (defaults today), source account select (reuses `transactionAccountOptions`), notes.
- **Dashboard:** a small "Credit cards due soon" card in the summary row, showing the single nearest due date across all cards (or nothing, if none are due within e.g. 7 days).

## 6. Open questions — need your answer before implementation starts

1. **Where does it live in navigation?** Its own top-level "Credit Cards" sidebar item, or nested inside the Accounts page as a tab/section?
2. **Add-card flow:** one combined form (account + card details together), or keep "Add account" as-is and add a separate "convert to credit card" step for accounts already categorized as credit-card?
3. **Balance reconciliation:** when a payment is recorded, should it **automatically decrease** the card's `accounts.balance` (and optionally increase/decrease the source account's balance)? Today, no part of this app auto-adjusts `accounts.balance` from transaction activity — balances are always manually edited. Introducing auto-adjustment here would be a first, and would need a clear rule for what happens if the user *also* manually edits the balance later (do they conflict?). The alternative — a payment is purely a logged record for due-date tracking, and the user still manually updates the balance separately — is consistent with the rest of the app but means the user does two actions to record one real-world payment. **I'd recommend the manual-balance approach for V1** (consistent, less surprising) unless you want the automatic version.
4. **Minimum payment:** fixed dollar amount, percent of balance, or should we support both (as modeled in §4)? Is minimum payment tracking actually needed for V1, or is due-date + balance + limit enough?
5. **Multiple payments per cycle:** if the user pays $50 now and $50 later in the same cycle, do we just sum them for "cycle settled," or does settlement require a single payment ≥ minimum payment?
6. **Should closed/paid-off cards be archivable** (hidden from the main list without deleting history), or is delete (same cascade-safe delete pattern as accounts) sufficient?

## 7. Phase 2 ideas (not in this PRD's scope, listed so nothing is lost)

- Real per-cycle statement tracking (separate `credit_card_statements` table: cycle dates, statement balance, minimum payment due, paid status) instead of the computed-due-date approximation in §4.
- Interest accrual estimate using the stored APR.
- Reminder notifications (email/push) ahead of a due date.
- CSV import of card statements (reusing the transactions CSV import pattern already in the app).

## 8. Rollout plan

1. Migration: `credit_cards` + `credit_card_payments` tables, RLS (via the `supabase-schema-agent`).
2. Data layer + server actions: `getCreditCards()`, `addCreditCard()`, `updateCreditCard()`, `deleteCreditCard()`, `getPayments(cardId)`, `addPayment()`.
3. `/credit-cards` page + list view + summary.
4. Add/edit card drawer, card detail sheet (mirroring the Accounts detail/edit pattern just built).
5. Record-payment drawer + payment history table.
6. Dashboard "due soon" summary tile.
7. Live verification (via the `feature-verifier` agent) before calling it done.

---

**Next step:** answer the open questions in §6, or tell me to make the calls myself with the recommendations noted above, and I'll build it.
