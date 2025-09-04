
-- Enable RLS and allow anon insert/select (for quick start).
-- For production, tighten with auth policies.
alter table daily_ads enable row level security;
alter table daily_orders enable row level security;

drop policy if exists "anon insert ads" on daily_ads;
drop policy if exists "anon select ads" on daily_ads;
drop policy if exists "anon insert orders" on daily_orders;
drop policy if exists "anon select orders" on daily_orders;

create policy "anon insert ads" on daily_ads for insert to anon using (true) with check (true);
create policy "anon select ads" on daily_ads for select to anon using (true);

create policy "anon insert orders" on daily_orders for insert to anon using (true) with check (true);
create policy "anon select orders" on daily_orders for select to anon using (true);
