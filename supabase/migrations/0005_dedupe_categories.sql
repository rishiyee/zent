-- The lazy default-category seeding in getCategoryGroups() used a
-- check-then-insert pattern with no DB-level guard, so concurrent page loads
-- could each see zero groups and independently reseed the full default set,
-- producing many duplicate (user_id, type, name) groups. Clean up the
-- duplicates (keeping the earliest row per name) and add unique constraints
-- so this can't recur even if the seeding path races again.

-- Reassign any categories on duplicate groups to the earliest ("keeper")
-- group for that (user_id, type, name).
with keepers as (
  select distinct on (user_id, type, name) id, user_id, type, name
  from category_groups
  order by user_id, type, name, created_at asc, id asc
),
dupes as (
  select cg.id as dupe_id, k.id as keeper_id
  from category_groups cg
  join keepers k
    on k.user_id = cg.user_id and k.type = cg.type and k.name = cg.name
  where cg.id <> k.id
)
update categories c
set group_id = d.keeper_id
from dupes d
where c.group_id = d.dupe_id;

-- Now that categories are consolidated onto the keeper groups, remove
-- duplicate categories that collide on (group_id, name), keeping the
-- earliest.
with ranked as (
  select id, row_number() over (
    partition by group_id, name order by created_at asc, id asc
  ) as rn
  from categories
)
delete from categories
where id in (select id from ranked where rn > 1);

-- Delete the now-empty duplicate groups (their categories were already
-- moved to the keeper above).
with keepers as (
  select distinct on (user_id, type, name) id
  from category_groups
  order by user_id, type, name, created_at asc, id asc
)
delete from category_groups
where id not in (select id from keepers);

-- Prevent this from recurring: uniqueness at the DB level makes seeding
-- idempotent regardless of request concurrency.
alter table category_groups
  add constraint category_groups_user_type_name_key unique (user_id, type, name);

alter table categories
  add constraint categories_group_name_key unique (group_id, name);
