
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
  ctr_all numeric,
  purchases numeric,
  spend_sgd numeric,
  spend_bdt numeric,
  cpm_bdt numeric,
  cpc_bdt numeric,
  created_at timestamp with time zone default now()
);
create index if not exists idx_daily_ads_report_date on daily_ads(report_date);
create index if not exists idx_daily_ads_level on daily_ads(level);
create unique index if not exists ux_daily_ads_unique on daily_ads(report_date, level, campaign_name, adset_name, ad_name);

create table if not exists daily_orders (
  id bigserial primary key,
  order_date date not null,
  invoice_number text,
  order_status text,
  paid_amount numeric,
  due_amount numeric,
  total_price numeric,
  delivery_area text,
  classification text,
  created_at timestamp with time zone default now()
);
create index if not exists idx_daily_orders_order_date on daily_orders(order_date);
create unique index if not exists ux_daily_orders_unique on daily_orders(order_date, invoice_number);
