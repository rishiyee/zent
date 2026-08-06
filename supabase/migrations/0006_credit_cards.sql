-- Credit card management: card-specific attributes + payment history.
-- One row per credit card, 1:1 with an existing `accounts` row
-- (account.category = 'credit-card', account.balance = current outstanding balance,
-- same as today -- this table adds the card-specific attributes accounts doesn't have).
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

alter table credit_cards enable row level security;
alter table credit_card_payments enable row level security;

create policy "Users manage their own credit_cards" on credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own credit_card_payments" on credit_card_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
