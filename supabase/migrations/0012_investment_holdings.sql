-- Investment portfolios: current positions and dated valuations.
-- Investment accounts remain the source of truth for portfolio totals in the
-- rest of the app; holdings provide the position-level breakdown.

create table investment_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  account_id uuid not null references accounts(id) on delete cascade,
  symbol text not null,
  name text not null,
  asset_type text not null check (asset_type in (
    'stock', 'etf', 'mutual-fund', 'bond', 'cryptocurrency', 'cash', 'other'
  )),
  quantity numeric(24, 8) not null check (quantity >= 0),
  price numeric(24, 8) not null check (price >= 0),
  cost_basis numeric(24, 8) check (cost_basis is null or cost_basis >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  price_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_holdings_account_symbol_key unique (account_id, symbol)
);

create index investment_holdings_user_account_idx
  on investment_holdings (user_id, account_id);

create table investment_price_history (
  holding_id uuid not null references investment_holdings(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  valued_on date not null,
  price numeric(24, 8) not null check (price >= 0),
  quantity numeric(24, 8) not null check (quantity >= 0),
  created_at timestamptz not null default now(),
  primary key (holding_id, valued_on)
);

create index investment_price_history_user_date_idx
  on investment_price_history (user_id, valued_on desc);

alter table investment_holdings enable row level security;
alter table investment_price_history enable row level security;

create policy "Users manage their own investment holdings" on investment_holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own investment price history" on investment_price_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Prevent clients from attaching a holding to another user's account or to an
-- account that is not categorized as an investment account.
create or replace function validate_investment_holding_account()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1 from accounts
    where id = new.account_id
      and user_id = new.user_id
      and category = 'investment'
  ) then
    raise exception 'Holding account must be an investment account owned by the user';
  end if;

  return new;
end;
$$;

create trigger validate_investment_holding_account_trigger
  before insert or update of user_id, account_id on investment_holdings
  for each row execute function validate_investment_holding_account();

-- History rows repeat user_id for simple, efficient RLS. Keep it aligned with
-- the parent holding rather than trusting a value supplied by the client.
create or replace function set_investment_history_user()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  select user_id into new.user_id
  from investment_holdings
  where id = new.holding_id;

  if new.user_id is null then
    raise exception 'Investment holding not found';
  end if;

  return new;
end;
$$;

create trigger set_investment_history_user_trigger
  before insert or update of holding_id, user_id on investment_price_history
  for each row execute function set_investment_history_user();

create or replace function touch_investment_holding()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.symbol := upper(trim(new.symbol));
  new.currency := upper(trim(new.currency));
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_investment_holding_trigger
  before insert or update on investment_holdings
  for each row execute function touch_investment_holding();

-- Keep the existing account balance in sync so net-worth and account views do
-- not need investment-specific aggregation logic.
create or replace function sync_investment_account_balance()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op <> 'INSERT' then
    update accounts
    set balance = coalesce((
      select round(sum(quantity * price), 2)
      from investment_holdings
      where account_id = old.account_id
    ), 0),
    last_updated = current_date
    where id = old.account_id;
  end if;

  if tg_op <> 'DELETE'
    and (tg_op = 'INSERT' or new.account_id is distinct from old.account_id)
  then
    update accounts
    set balance = coalesce((
      select round(sum(quantity * price), 2)
      from investment_holdings
      where account_id = new.account_id
    ), 0),
    last_updated = current_date
    where id = new.account_id;
  end if;

  return null;
end;
$$;

create trigger sync_investment_account_balance_trigger
  after insert or update or delete on investment_holdings
  for each row execute function sync_investment_account_balance();
