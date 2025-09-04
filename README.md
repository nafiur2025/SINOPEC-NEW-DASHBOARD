
# FB Ads Expert Dashboard (No‑code friendly)

A sleek, white‑background web app that ingests **two daily files** (Meta Ads report + Sales CSV), stores them in **Supabase**, and visualizes KPIs with **color‑coded tiles, charts, and expert alerts**.

- Frontend: **Vite + React + Tailwind + Recharts**
- File parsing: **PapaParse (CSV), SheetJS (XLSX)**
- Storage: **Supabase** (SQL + RLS policies provided)
- Deploy: **Netlify** (connect GitHub; zero server maintenance)
- Timezone: **Asia/Dhaka** (no UTC shifts; no `toISOString()` used)
- Currency: **BDT**, with automatic conversion from SGD using `VITE_SGD_TO_BDT` (default 95)

---

## 1) What you’ll upload every day

- **Ads report**: Meta daily report (CSV or XLSX). The template we support includes these columns (auto‑detected):
  - `Campaign name`, `Ad Set Name`, `Ad name`, `Delivery level`, `Reach`, `Impressions`, `Frequency`,
    `Result type`, `Results`, `Amount spent (SGD)`, `Messaging conversations started`,
    `Unique CTR (link click-through rate)`, `Reporting starts`, `Reporting ends`.
  - If `Messaging conversations started` is missing but `Result type` is *Messaging conversations started*,
    we fall back to `Results`.
  - If **CTR (All)** is missing, we **fall back to Unique CTR**.
- **Sales report (CSV)**: Must include at least
  - `Creation Date`, `Invoice Number`, `Paid Amount`, `Due Amount`, `Total Price`, `Delivery Area`, `Order Status`.
  - We count **orders** only if `Order Status` is one of:
    `Delivered, Confirmed, Delivered & Paid, Delivered and Paid, Complete, Completed, Paid, Fulfilled, Pending, In Transit, Delivered Payment Collected`.

> Based on your **02-Sep-2025** sample files, the exact detected headers match the lists above.
> If your exports change names, the app tries common alternatives automatically.

---

## 2) KPIs & formulas (implemented)

- **Revenue (BDT)** = Σ (`Paid Amount` + `Due Amount`) for allowed statuses
- **Orders** = count of rows with allowed statuses
- **Ad Spend (BDT)** = Σ `Amount spent (SGD)` × `VITE_SGD_TO_BDT`
- **Blended CPA (BDT/order)** = `Ad Spend` ÷ `Orders`  
  - Tile coloring: ≤ 300 (green), 301–500 (yellow), > 500 (red)
- **MER / ROAS** = `Revenue` ÷ `Ad Spend`
- **Conversations** = Σ `Messaging conversations started` (or `Results` when applicable)
- **Cost per Conversation (BDT)** = `Ad Spend` ÷ `Conversations`
- **Conversation → Order %** = `Orders` ÷ `Conversations` × 100
- **Frequency trend, CTR trend** for creative fatigue

Charts under the tiles:
- Revenue (BDT), ROAS, Conversation→Order %, Blended CPA
- Tabbed breakdown per **campaign/ad set/ad** with: Cost/Click, **CPM**, Conversations, **Frequency**, **Unique CTR %**

---

## 3) Alert rules (implemented)

Per **ad** level:
- **Rotate creative** if **CTR** ↓ ≥ **25%** over 3 days **AND** **Frequency > 2.5**
- **Rotate creative (prospecting)** if **Cost per conversation** ↑ ≥ **30%** (avg of last 3 days vs previous 3)
- **Ride it out** if **CPM** ↑ ≥ **25%** but **CTR steady** (±5%) → smooth budgets/daypart; rotate only if persistent 5–7 days

(You can extend these in `src/lib/alerts.ts` — see comments.)

---

## 4) Timezone bug: the fix (shipped)

CSV `Creation Date` and report dates are parsed **locally** and formatted as `YYYY-MM-DD` using local calendar components.
We **never** convert to UTC or use `toISOString()` — preventing 31 Aug → 30 Aug shifts for **Asia/Dhaka**.

See `src/lib/date.ts`:
- Parses: `dd/mm/yyyy`, `dd.mm.yyyy`, `dd-mm-yyyy`, `yyyy-mm-dd`, `dd-MMM-yy`, datetimes, and **Excel serial numbers**
- Extracts **date part only** for datetimes

---

## 5) One‑time setup (step‑by‑step)

### A) Create Supabase (free)
1. Go to **supabase.com** → New Project
2. In the SQL editor, run both files in `/supabase`:
   - `schema.sql` → creates tables `daily_ads`, `daily_orders`, and view `v_daily_rollup`
   - `policies.sql` → quick‑start RLS (anon insert/select). _Tighten later for production._
3. Copy your **Project URL** and **anon key**.

### B) Get the code live
1. Upload this folder to **GitHub** (e.g., repo `fb-ads-expert-dashboard`).
2. On **Netlify** → `New site from Git` → connect the repo.
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Environment variables** (Netlify → Site settings → Environment):
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `VITE_TZ` = `Asia/Dhaka`
   - `VITE_SGD_TO_BDT` = `95` (change if your bank rate changes)

Netlify will run `npm install` and build automatically.

### C) Use it (daily)
1. Open your site → **Upload Ads report** and **Sales report** (yesterday).
2. Hit **Process files** → charts, tiles, and alerts will refresh instantly.
3. Data is stored in Supabase (so your historical charts keep growing).

---

## 6) Files you’ll likely edit later

- **Alert logic**: `src/lib/alerts.ts` (extend remaining rules in your spec)
- **Tile thresholds**: `src/components/TopTiles.tsx`
- **Currency rate**: `.env / Netlify env` → `VITE_SGD_TO_BDT`
- **Extra charts/metrics**: add keys in `TimeSeriesChart` and `TabbedBreakdown`

---

## 7) FAQ / Troubleshooting

- **Where is CTR (All)?**  
  Your sample Meta export contains **Unique CTR (link)**. The app uses that when CTR (All) is not present.
- **My dates show under the wrong day**  
  Ensure you use the included uploader. We never call `toISOString()`; dates stay in **local time**.
- **Supabase security**  
  The provided policies are for quick start. Add Auth and tighten RLS before sharing widely.

---

## 8) Tech notes

- Dependencies are split into chunks (see `vite.config.ts`) to avoid Netlify build warnings about 500kB bundles.
- All charts use **Recharts** for reliability and ease of use.
- Styling is **Tailwind**; the UI is intentionally clean and white‑on‑gray to highlight color‑coded tiles and balloons.
