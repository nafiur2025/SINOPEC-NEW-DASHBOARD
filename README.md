
# FB Ads Expert Dashboard — UPSERT (multi-column) — Fixed

Clean React + Vite + Tailwind dashboard for your Meta ads + sales files.  
- **CTR (All)** is preferred over Unique CTR.  
- **Idempotent re-uploads:** UPSERT on **(report_date, level, campaign_name, adset_name, ad_name)** for ads, and **(order_date, invoice_number)** for orders.  
- RLS policies for **INSERT/SELECT/UPDATE** are provided.

## Deploy (Netlify)
Build: `npm run build` • Publish: `dist`  
Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TZ=Asia/Dhaka`, `VITE_SGD_TO_BDT=95`

## Supabase (SQL)
Run `/supabase/schema.sql` then `/supabase/policies.sql`.
