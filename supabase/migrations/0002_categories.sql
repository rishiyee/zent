-- User-editable category groups and categories, used to drive the categories
-- management UI and the category picker throughout the app. transactions.category
-- and category_rules.category remain free text (matched by name) so this does
-- not require migrating existing transaction data.

create table category_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  name text not null,
  type transaction_type not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  group_id uuid not null references category_groups(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index category_groups_user_type_idx on category_groups (user_id, type, sort_order);
create index categories_group_idx on categories (group_id, sort_order);

alter table category_groups enable row level security;
alter table categories enable row level security;

create policy "Users manage their own category groups" on category_groups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
