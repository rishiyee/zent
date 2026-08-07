-- Link each card payment to a ledger transaction. The transaction keeps the
-- paying account/date/amount visible in the ledger; reporting excludes linked
-- rows because they move money between accounts rather than create spending.
alter table credit_card_payments
  add column transaction_id uuid unique references transactions(id) on delete set null;

do $$
declare
  payment record;
  ledger_id uuid;
begin
  for payment in
    select
      p.id,
      p.user_id,
      p.source_account_id,
      p.amount,
      p.paid_on,
      p.notes,
      a.name as card_name
    from credit_card_payments p
    join credit_cards c on c.id = p.credit_card_id
    join accounts a on a.id = c.account_id
    where p.transaction_id is null
  loop
    insert into transactions (
      user_id, date, description, category, account_id, type, amount,
      status, source, notes
    ) values (
      payment.user_id,
      payment.paid_on,
      'Payment to ' || payment.card_name,
      'Credit card payment',
      payment.source_account_id,
      'expense',
      payment.amount,
      'reviewed',
      'manual',
      payment.notes
    )
    returning id into ledger_id;

    update credit_card_payments
    set transaction_id = ledger_id
    where id = payment.id;
  end loop;
end
$$;

create index credit_card_payments_transaction_idx
  on credit_card_payments (transaction_id);
