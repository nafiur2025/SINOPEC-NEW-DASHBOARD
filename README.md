
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
