-- Ledger app schema: per-user accounts, transactions, category rules, goals, and tags.
-- Every table is scoped to auth.uid() via RLS; there is no cross-user visibility.

create extension if not exists pgcrypto;

create type transaction_type as enum ('income', 'expense');
create type transaction_status as enum ('needs-review', 'pending', 'reviewed');
create type transaction_source as enum ('synced', 'manual');
create type account_source as enum ('manual', 'connected');
create type account_category as enum (
  'checking',
  'savings',
  'investment',
  'credit-card',
  'loan',
  'real-estate',
  'vehicle',
  'jewelry',
  'art-collectibles',
  'business-equity',
  'precious-metals',
  'other'
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null,
  category account_category not null,
  source account_source not null,
  balance numeric(14, 2) not null default 0,
  last_updated date not null default current_date,
  created_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  label text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  date date not null,
  description text not null,
  category text,
  -- null account_id means "Cash / Untracked" (replaces the mock data's synthetic "CASH" id)
  account_id uuid references accounts(id) on delete set null,
  type transaction_type not null,
  amount numeric(14, 2) not null,
  status transaction_status not null default 'needs-review',
  source transaction_source not null default 'manual',
  notes text,
  goal_id uuid references goals(id) on delete set null,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on transactions (user_id, date desc);

create table transaction_tags (
  transaction_id uuid not null references transactions(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

create table category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  keyword text not null,
  category text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;
alter table goals enable row level security;
alter table tags enable row level security;
alter table transactions enable row level security;
alter table transaction_tags enable row level security;
alter table category_rules enable row level security;

create policy "Users manage their own accounts" on accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own goals" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own tags" on tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own category rules" on category_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage tags on their own transactions" on transaction_tags
  for all using (
    exists (
      select 1 from transactions
      where transactions.id = transaction_tags.transaction_id
        and transactions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from transactions
      where transactions.id = transaction_tags.transaction_id
        and transactions.user_id = auth.uid()
    )
  );

-- Atomically replaces one transaction with N split transactions (+ their tags).
-- security invoker (the default): runs as the calling user, so the RLS policies
-- above still gate every read/write this function performs.
create or replace function split_transaction(p_transaction_id uuid, p_splits jsonb)
returns void
language plpgsql
security invoker
as $$
declare
  original transactions%rowtype;
  split jsonb;
  new_id uuid;
  tag text;
begin
  select * into original from transactions where id = p_transaction_id;

  if original.id is null then
    raise exception 'Transaction not found';
  end if;

  for split in select * from jsonb_array_elements(p_splits)
  loop
    if coalesce((split->>'hidden')::boolean, false) then
      continue;
    end if;

    insert into transactions (
      user_id, date, description, category, account_id, type, amount,
      status, source, notes, goal_id
    ) values (
      original.user_id,
      original.date,
      original.description,
      split->>'category',
      original.account_id,
      original.type,
      (split->>'amount')::numeric,
      coalesce((split->>'status')::transaction_status, original.status),
      original.source,
      nullif(split->>'notes', ''),
      nullif(split->>'goal_id', '')::uuid
    )
    returning id into new_id;

    for tag in select * from jsonb_array_elements_text(coalesce(split->'tag_ids', '[]'::jsonb))
    loop
      insert into transaction_tags (transaction_id, tag_id) values (new_id, tag::uuid);
    end loop;
  end loop;

  delete from transactions where id = p_transaction_id;
end;
$$;
