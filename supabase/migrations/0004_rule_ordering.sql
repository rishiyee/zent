-- Explicit priority order for category_rules, editable via drag-and-drop
-- on the Settings > Rules page (rules apply top to bottom).

alter table category_rules add column sort_order integer not null default 0;

with ordered as (
  select id, row_number() over (partition by user_id order by created_at asc) - 1 as rn
  from category_rules
)
update category_rules
set sort_order = ordered.rn
from ordered
where category_rules.id = ordered.id;

create index category_rules_user_order_idx on category_rules (user_id, sort_order);
