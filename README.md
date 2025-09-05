
# FB Ads Expert Dashboard — 'cancelled' filter

This build adjusts revenue & order counting to **exclude only statuses that include “cancelled”** (case-insensitive).

- **Revenue** = Σ (Paid Amount + Due Amount) on valid orders (status does **not** include “cancelled”).
- **Ad Spend (BDT)** = Σ (Amount spent (SGD) × 95) on ingest.
- **Historical charts**: loads last 180 days from Supabase; after upload, upserts and re-fetches to refresh trends.
- **UPSERT keys**:
  - Ads: (report_date, level, campaign_name, adset_name, ad_name)
  - Orders: (order_date, invoice_number)

## Deploy
- Build: `npm run build` • Publish: `dist`
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TZ=Asia/Dhaka`, `VITE_SGD_TO_BDT=95`
- Supabase: run `/supabase/schema.sql` then `/supabase/policies.sql`
