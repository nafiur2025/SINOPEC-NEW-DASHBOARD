
export type AdRow = {
  report_date: string;
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  level?: 'campaign'|'adset'|'ad';
  reach?: number;
  impressions?: number;
  frequency?: number;
  results?: number;
  result_type?: string;
  conversations_started?: number;
  unique_ctr?: number;
  ctr_all?: number;
  purchases?: number;
  spend_sgd?: number;
  spend_bdt?: number;
  cpm_bdt?: number;
  cpc_bdt?: number;
};

export type OrderRow = {
  order_date: string;
  invoice_number?: string;
  order_status?: string;
  paid_amount?: number;
  due_amount?: number;
  total_price?: number;
  delivery_area?: string;
  classification?: 'PCMO'|'MCO'|null;
};

export const VALID_ORDER_STATUSES = new Set([
  'Delivered','Confirmed','Delivered & Paid','Delivered and Paid','Complete','Completed','Paid','Fulfilled','Pending','In Transit','Delivered Payment Collected'
]);

export function classifyOrder(total?: number | null): 'PCMO'|'MCO'|null {
  if (total == null) return null;
  if (total >= 2000) return 'PCMO';
  if (total >= 600 && total <= 1500) return 'MCO';
  return null;
}

export function safeNumber(n: any): number {
  const x = Number(String(n).replace(/,/g,''));
  return isNaN(x) ? 0 : x;
}

export function computeDailyKpis(ads: AdRow[], orders: OrderRow[]) {
  const byDay: Record<string, any> = {};

  const addDay = (d: string) => {
    if (!byDay[d]) {
      byDay[d] = {
        date: d,
        revenue_bdt: 0,
        orders: 0,
        ad_spend_bdt: 0,
        conversations: 0,
        blended_cpa_bdt: null as number|null,
        roas: null as number|null,
        conv_to_order_rate: null as number|null,
        cpm_bdt: null as number|null,
        frequency: null as number|null
      };
    }
  };

  for (const a of ads) {
    const d = a.report_date;
    if (!d) continue;
    addDay(d);
    byDay[d].ad_spend_bdt += a.spend_bdt || 0;
    byDay[d].conversations += a.conversations_started || 0;
    if (a.cpm_bdt) {
      byDay[d].cpm_bdt = (byDay[d].cpm_bdt == null) ? a.cpm_bdt : (byDay[d].cpm_bdt + a.cpm_bdt)/2;
    }
    if (a.frequency) {
      byDay[d].frequency = (byDay[d].frequency == null) ? a.frequency : (byDay[d].frequency + a.frequency)/2;
    }
  }

  for (const o of orders) {
    const d = o.order_date;
    if (!d) continue;
    addDay(d);
    const allowed = VALID_ORDER_STATUSES.has(o.order_status || '');
    if (allowed) {
      byDay[d].revenue_bdt += (o.paid_amount || 0) + (o.due_amount || 0);
      byDay[d].orders += 1;
    }
  }

  const out = Object.values(byDay).sort((a: any,b: any) => a.date.localeCompare(b.date));
  for (const row of out) {
    const spend = row.ad_spend_bdt || 0;
    const ordersCount = row.orders || 0;
    const convs = row.conversations || 0;
    row.blended_cpa_bdt = ordersCount > 0 ? spend / ordersCount : null;
    row.roas = spend > 0 ? row.revenue_bdt / spend : null;
    row.conv_to_order_rate = convs > 0 ? (ordersCount / convs) * 100 : null;
  }
  return out;
}

export function movingAverage(values: (number|null|undefined)[], window: number): number | null {
  const arr = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (arr.length < window) return null;
  const slice = arr.slice(-window);
  if (slice.length < window) return null;
  const sum = slice.reduce((a,b)=>a+b,0);
  return sum / slice.length;
}
