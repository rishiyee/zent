create table recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  merchant_name text not null,
  transaction_type transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  account_id uuid references accounts(id) on delete set null,
  category text,
  cadence text not null check (cadence in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  next_date date not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recurring_schedules_user_status_date_idx
  on recurring_schedules (user_id, status, next_date);

alter table recurring_schedules enable row level security;
create policy "Users manage their own recurring schedules" on recurring_schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table recurring_suggestion_dismissals (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  merchant_key text not null,
  transaction_type transaction_type not null,
  created_at timestamptz not null default now(),
  primary key (user_id, merchant_key, transaction_type)
);

alter table recurring_suggestion_dismissals enable row level security;
create policy "Users manage their own recurring suggestion dismissals"
  on recurring_suggestion_dismissals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table transactions
  add column recurring_schedule_id uuid references recurring_schedules(id) on delete set null,
  add column recurring_occurrence_date date;

create unique index transactions_recurring_occurrence_key
  on transactions (recurring_schedule_id, recurring_occurrence_date)
  where recurring_schedule_id is not null;

create or replace function materialize_due_recurring_schedules(
  p_today date,
  p_limit_per_schedule integer default 24
)
returns integer
language plpgsql
security invoker
as $$
declare
  schedule recurring_schedules%rowtype;
  occurrence date;
  generated integer := 0;
  schedule_generated integer;
  account_record record;
  delta numeric(14, 2);
begin
  if p_today < current_date - 1 or p_today > current_date + 1 then
    raise exception 'Materialization date must be the user''s current local date';
  end if;

  for schedule in
    select * from recurring_schedules
    where user_id = auth.uid() and status = 'active' and next_date <= p_today
    order by next_date, id
    for update
  loop
    occurrence := schedule.next_date;
    schedule_generated := 0;

    while occurrence <= p_today and schedule_generated < greatest(1, least(p_limit_per_schedule, 24)) loop
      insert into transactions (
        user_id, date, description, category, account_id, type, amount,
        status, source, recurring_schedule_id, recurring_occurrence_date
      ) values (
        schedule.user_id, occurrence, schedule.merchant_name, schedule.category,
        schedule.account_id, schedule.transaction_type, schedule.amount,
        'pending', 'manual', schedule.id, occurrence
      ) on conflict (recurring_schedule_id, recurring_occurrence_date)
        where recurring_schedule_id is not null do nothing;

      if found then
        generated := generated + 1;
        if schedule.account_id is not null then
          select category, balance into account_record from accounts
          where id = schedule.account_id for update;
          delta := case when schedule.transaction_type = 'income' then schedule.amount else -schedule.amount end;
          if account_record.category in ('credit-card', 'loan') then delta := -delta; end if;
          update accounts set balance = balance + delta, last_updated = p_today
          where id = schedule.account_id;
        end if;
      end if;

      schedule_generated := schedule_generated + 1;
      occurrence := case schedule.cadence
        when 'weekly' then occurrence + 7
        when 'biweekly' then occurrence + 14
        when 'monthly' then (occurrence + interval '1 month')::date
        when 'quarterly' then (occurrence + interval '3 months')::date
        when 'yearly' then (occurrence + interval '1 year')::date
      end;
    end loop;

    update recurring_schedules
    set next_date = occurrence, updated_at = now()
    where id = schedule.id;
  end loop;

  return generated;
end;
$$;
