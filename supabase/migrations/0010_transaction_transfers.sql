-- Support transfers between accounts: account_id remains the source account,
-- transfer_to_account_id (when set) holds the destination account.
alter table transactions
  add column transfer_to_account_id uuid references accounts(id) on delete set null;

alter table transactions
  add constraint transactions_transfer_distinct_accounts
  check (transfer_to_account_id is null or transfer_to_account_id <> account_id);
