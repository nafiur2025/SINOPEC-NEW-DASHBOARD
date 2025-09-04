
# FB Ads Expert Dashboard (CTR All ready)

White-background React dashboard that ingests **two daily files** (Meta Ads + Sales), stores them in **Supabase**, and shows KPIs, charts, and **expert alerts**. Timezone is **Asia/Dhaka** (no UTC shift). Currency is **BDT** with SGD→BDT conversion via env var.

## Stack
- Vite + React + Tailwind + Recharts
- PapaParse (CSV) + SheetJS (XLSX)
- Supabase (SQL + RLS policies)

## KPIs
- Revenue, Orders, Ad Spend, Blended CPA, ROAS (MER), Conversations, Conversation→Order %
- Charts: Revenue, ROAS, Conversation→Order %, Blended CPA
- Tabbed breakdown (campaign/ad set/ad): CPM, Cost/Click, Conversations, Frequency, **Unique CTR %**, **CTR (All) %**

## Alerts implemented
- **Rotate creative** if CTR ↓ ≥25% over 3 days **and** Frequency > 2.5
- **Rotate creative (prospecting)** if Cost per conversation ↑ ≥30% (3 vs previous 3 days)
- **Ride it out** if CPM ↑ ≥25% while CTR steady (±5%)

## CTR (All)
If your report includes **CTR (All)**, the app **prefers it** automatically and falls back to **Unique CTR** if missing.

### One-time Supabase migration (if you used an older schema)
```sql
alter table daily_ads add column if not exists ctr_all numeric;
```

## Deploy
1) Create Supabase project → run `/supabase/schema.sql` then `/supabase/policies.sql`  
2) Push this folder to GitHub  
3) Netlify → New site from Git  
   - Build: `npm run build`  
   - Publish: `dist`  
   - Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TZ=Asia/Dhaka`, `VITE_SGD_TO_BDT=95`

## Daily usage
Upload **Ads report** (CSV/XLSX) and **Sales report** (CSV), then click **Process files**.

---

## Idempotent re-uploads (Option A: UPSERT)
This build is **safe to re-upload the same file or corrected data**. The database stores a **row_key** per row and we UPSERT on that key, so matching rows are **overwritten** (no duplicates).

If you already created the tables before this build, run this migration:

```sql
-- Add row_key columns
alter table daily_ads   add column if not exists row_key text generated always as (
  coalesce(report_date::text,'') || '|' || coalesce(level,'') || '|' || coalesce(campaign_name,'') || '|' || coalesce(adset_name,'') || '|' || coalesce(ad_name,'')
) stored;
alter table daily_orders add column if not exists row_key text generated always as (
  coalesce(order_date::text,'') || '|' || coalesce(invoice_number,'')
) stored;

-- Remove duplicates (keep latest)
with t as (
  select id, row_number() over (partition by row_key order by created_at desc) rn from daily_ads
)
delete from daily_ads where id in (select id from t where rn>1);

with t as (
  select id, row_number() over (partition by row_key order by created_at desc) rn from daily_orders
)
delete from daily_orders where id in (select id from t where rn>1);

-- Unique indexes
create unique index if not exists ux_daily_ads_row_key    on daily_ads(row_key);
create unique index if not exists ux_daily_orders_row_key on daily_orders(row_key);

-- Allow updates during upsert (RLS)
create policy if not exists "anon update ads"    on daily_ads for update to anon using (true) with check (true);
create policy if not exists "anon update orders" on daily_orders for update to anon using (true) with check (true);
```

---

## Idempotent re-uploads without generated columns
This build uses **multi-column UNIQUE indexes** (no generated `row_key`) to make UPSERTs work on duplicate uploads/corrections.

**Fresh install**: just run `/supabase/schema.sql` and `/supabase/policies.sql`.

**If you installed a previous build with `row_key`:** run this one-time cleanup in Supabase:
```sql
-- Remove any old unique indexes on row_key (ignore errors if they don't exist)
drop index if exists ux_daily_ads_row_key;
drop index if exists ux_daily_orders_row_key;

-- Drop row_key columns if present
do $$ begin
  begin alter table daily_ads   drop column row_key; exception when undefined_column then null; end;
  begin alter table daily_orders drop column row_key; exception when undefined_column then null; end;
end $$;

-- Create the new multi-column unique indexes
create unique index if not exists ux_daily_ads_unique on daily_ads(report_date, level, campaign_name, adset_name, ad_name);
create unique index if not exists ux_daily_orders_unique on daily_orders(order_date, invoice_number);
```
