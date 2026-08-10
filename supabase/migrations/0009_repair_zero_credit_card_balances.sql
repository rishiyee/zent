-- Rebuild credit-card balances from their ledger activity. Charges increase
-- the amount owed, refunds reduce it, and recorded payments reduce it.
with transaction_totals as (
  select
    account_id,
    sum(
      case
        when type = 'expense' then amount
        when type = 'income' then -amount
        else 0
      end
    ) as net_charges,
    max(date) as latest_transaction_date
  from transactions
  where account_id is not null
  group by account_id
),
payment_totals as (
  select
    credit_card_id,
    sum(amount) as total_payments,
    max(paid_on) as latest_payment_date
  from credit_card_payments
  group by credit_card_id
),
repaired_balances as (
  select
    a.id as account_id,
    greatest(
      0,
      coalesce(t.net_charges, 0) - coalesce(p.total_payments, 0)
    ) as calculated_balance,
    greatest(t.latest_transaction_date, p.latest_payment_date) as latest_activity_date
  from accounts a
  join credit_cards c on c.account_id = a.id
  left join transaction_totals t on t.account_id = a.id
  left join payment_totals p on p.credit_card_id = c.id
  where t.account_id is not null or p.credit_card_id is not null
)
update accounts a
set
  balance = repaired_balances.calculated_balance,
  last_updated = coalesce(repaired_balances.latest_activity_date, a.last_updated)
from repaired_balances
where a.id = repaired_balances.account_id
  and a.balance is distinct from repaired_balances.calculated_balance;
