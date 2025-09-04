
import type { AdRow } from './metrics'

type Alert = {
  date: string;
  level: 'info'|'warn'|'danger';
  scope: 'ad'|'adset'|'campaign';
  key: string; // unique id
  title: string;
  message: string;
};

function pctChange(newVal: number, oldVal: number) {
  if (oldVal === 0) return null;
  return (newVal - oldVal) / oldVal;
}

// Group by (date, ad_name) to compute per-ad metrics by day
function groupByAdDaily(rows: AdRow[]) {
  const map = new Map<string, {date:string, name:string, ctr?:number, freq?:number, cpc?:number, cpm?:number, costPerConv?:number, convs?:number, spend?:number}>();
  for (const r of rows) {
    const date = r.report_date;
    const name = r.ad_name || r.adset_name || r.campaign_name || 'unknown';
    const key = `${date}|${name}`;
    const obj = map.get(key) || { date, name };
    const impressions = r.impressions || 0;
    const clicks = (r.unique_ctr || 0) * impressions / 100;
    obj.ctr = r.unique_ctr ?? obj.ctr;
    obj.freq = r.frequency ?? obj.freq;
    obj.spend = (obj.spend || 0) + (r.spend_bdt || 0);
    obj.convs = (obj.convs || 0) + (r.conversations_started || 0);
    obj.cpm = impressions > 0 ? ( (r.spend_bdt || 0) / impressions ) * 1000 : obj.cpm;
    obj.cpc = clicks > 0 ? (r.spend_bdt || 0) / clicks : obj.cpc;
    obj.costPerConv = (obj.convs||0) > 0 ? (obj.spend||0) / (obj.convs||0) : obj.costPerConv;
    map.set(key, obj);
  }
  // group by ad name
  const byAd = new Map<string, any[]>();
  for (const row of map.values()) {
    const arr = byAd.get(row.name) || [];
    arr.push(row);
    byAd.set(row.name, arr);
  }
  for (const arr of byAd.values()) arr.sort((a,b)=>a.date.localeCompare(b.date));
  return byAd;
}

export function generateAlerts(adRows: AdRow[]) {
  const alerts: Alert[] = [];
  const byAd = groupByAdDaily(adRows);

  const today = new Date();
  const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  for (const [ad, series] of byAd.entries()) {
    const dates = series.map(s=>s.date);
    const ctrSeries = series.map(s=>s.ctr ?? null);
    const freqSeries = series.map(s=>s.freq ?? null);
    const cpcSeries = series.map(s=>s.cpc ?? null);
    const cpmSeries = series.map(s=>s.cpm ?? null);
    const costPerConvSeries = series.map(s=>s.costPerConv ?? null);

    // Helper: avg over last N and previous N
    const avgN = (arr:(number|null)[], n:number) => {
      const cleaned = arr.filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (cleaned.length < n*2) return { curr:null, prev:null };
      const curr = cleaned.slice(-n).reduce((a,b)=>a+b,0)/n;
      const prev = cleaned.slice(-2*n, -n).reduce((a,b)=>a+b,0)/n;
      return { curr, prev };
    };

    // 1) CTR drop >=25% over 3 days AND Frequency > 2.5 -> rotate creative
    {
      const { curr, prev } = avgN(ctrSeries, 3);
      const lastFreq = freqSeries.filter((v): v is number => typeof v === 'number').slice(-1)[0];
      if (curr != null && prev != null && lastFreq != null) {
        const change = pctChange(curr, prev);
        if (change != null && change <= -0.25 && lastFreq > 2.5) {
          alerts.push({
            date: dates[dates.length-1],
            level: 'warn',
            scope: 'ad',
            key: `${ad}|ctr_drop`,
            title: 'Rotate creative',
            message: `CTR fell ${(Math.abs(change)*100).toFixed(0)}% over the last 3 days and frequency is ${lastFreq.toFixed(2)} (>2.5).`
          });
        }
      }
    }

    // 2) Cost per conversation up >=30% for 3 days
    {
      const { curr, prev } = avgN(costPerConvSeries, 3);
      if (curr != null && prev != null) {
        const change = pctChange(curr, prev);
        if (change != null && change >= 0.30) {
          alerts.push({
            date: dates[dates.length-1],
            level: 'warn',
            scope: 'ad',
            key: `${ad}|cpcnv_up`,
            title: 'Rotate creative (prospecting)',
            message: `Cost per conversation up ${(change*100).toFixed(0)}% vs previous 3 days.`
          });
        }
      }
    }

    // 3) CPM up >=25% but CTR steady ([-5%, +5%]) -> ride it out
    {
      const { curr: cpmCurr, prev: cpmPrev } = avgN(cpmSeries, 3);
      const { curr: ctrCurr, prev: ctrPrev } = avgN(ctrSeries, 3);
      if (cpmCurr != null && cpmPrev != null && ctrCurr != null && ctrPrev != null) {
        const cpmChange = pctChange(cpmCurr, cpmPrev);
        const ctrChange = pctChange(ctrCurr, ctrPrev);
        if (cpmChange != null && cpmChange >= 0.25 && ctrChange != null && Math.abs(ctrChange) <= 0.05) {
          alerts.push({
            date: dates[dates.length-1],
            level: 'info',
            scope: 'ad',
            key: `${ad}|cpm_up_ctr_steady`,
            title: 'Ride out CPM rise',
            message: 'CPM up ≥25% with steady CTR. Smooth budgets/daypart; rotate only if persists 5–7 days.'
          });
        }
      }
    }
  }
  return alerts;
}
