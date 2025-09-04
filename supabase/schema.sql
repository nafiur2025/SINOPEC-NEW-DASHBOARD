
-- Tables
create table if not exists daily_ads (
  id bigserial primary key,
  report_date date not null,
  campaign_name text,
  adset_name text,
  ad_name text,
  level text check (level in ('campaign','adset','ad')),
  reach bigint,
  impressions bigint,
  frequency numeric,
  results numeric,
  result_type text,
  conversations_started numeric,
  unique_ctr numeric,
  purchases numeric,
  spend_sgd numeric,
  spend_bdt numeric,
  cpm_bdt numeric,
  cpc_bdt numeric,
  created_at timestamp with time zone default now()
);

create index if not exists idx_daily_ads_report_date on daily_ads(report_date);
create index if not exists idx_daily_ads_level on daily_ads(level);

create table if not exists daily_orders (
  id bigserial primary key,
  order_date date not null,
  invoice_number text,
  order_status text,
  paid_amount numeric,
  due_amount numeric,
  total_price numeric,
  delivery_area text,
  classification text, -- 'PCMO' or 'MCO'
  created_at timestamp with time zone default now()
);

create index if not exists idx_daily_orders_order_date on daily_orders(order_date);

-- Simple view for daily rollups
create or replace view v_daily_rollup as
select
  d::date as day,
  coalesce(sum(o.paid_amount + o.due_amount),0) as revenue_bdt,
  count(*) filter (where o.order_status in (
    'Delivered','Confirmed','Delivered & Paid','Delivered and Paid','Complete','Completed','Paid','Fulfilled','Pending','In Transit','Delivered Payment Collected'
  )) as orders,
  coalesce(sum(a.spend_bdt),0) as ad_spend_bdt,
  coalesce(sum(a.conversations_started),0) as conversations,
  case when count(*) filter (where o.order_status in (
    'Delivered','Confirmed','Delivered & Paid','Delivered and Paid','Complete','Completed','Paid','Fulfilled','Pending','In Transit','Delivered Payment Collected'
  )) > 0
    then coalesce(sum(a.spend_bdt),0) / nullif(count(*) filter (where o.order_status in (
      'Delivered','Confirmed','Delivered & Paid','Delivered and Paid','Complete','Completed','Paid','Fulfilled','Pending','In Transit','Delivered Payment Collected'
    )),0) else null end as blended_cpa_bdt
from generate_series((now() - interval '120 days')::date, now()::date, '1 day') g(d)
left join daily_orders o on o.order_date = g.d
left join daily_ads a on a.report_date = g.d
group by d
order by d;
