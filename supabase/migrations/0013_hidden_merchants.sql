-- Merchants are derived from transaction descriptions. Hiding a merchant
-- removes it from management/autocomplete without deleting financial history.
create table hidden_merchants (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  merchant_key text not null,
  merchant_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, merchant_key)
);

alter table hidden_merchants enable row level security;

create policy "Users manage their own hidden merchants" on hidden_merchants
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
