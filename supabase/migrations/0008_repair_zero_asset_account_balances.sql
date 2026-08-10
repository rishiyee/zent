-- Repair asset accounts whose transactions were saved before account-balance
-- synchronization was enforced. Restricting this to zero balances avoids
-- changing accounts that already include an opening balance or applied ledger
-- activity. Liabilities are excluded because card payments have their own flow.
with ledger_balances as (
  select
    a.id,
    coalesce(
      sum(
        case
          when t.type = 'income' then t.amount
          when t.type = 'expense' then -t.amount
          else 0
        end
      ),
      0
    ) as ledger_balance,
    max(t.date) as latest_transaction_date
  from accounts a
  join transactions t on t.account_id = a.id
  where a.balance = 0
    and a.category not in ('credit-card', 'loan')
  group by a.id
)
update accounts a
set
  balance = ledger_balances.ledger_balance,
  last_updated = coalesce(
    ledger_balances.latest_transaction_date,
    a.last_updated
  )
from ledger_balances
where a.id = ledger_balances.id
  and ledger_balances.ledger_balance <> 0;
