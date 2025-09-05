
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

/** Valid order = any status that does NOT contain 'cancelled' (case-insensitive) */
export function isValidOrderStatus(status?: string | null): boolean {
  if (!status) return true;
  return !status.toLowerCase().includes('cancelled');
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
    if (isValidOrderStatus(o.order_status)) {
      byDay[d].revenue_bdt += (o.paid_amount || 0) + (o.due_amount || 0);
      byDay[d].orders += 1;
    }
  }

  const out = Object.values(byDay).sort((a: any,b: any) => a.date.localeCompare(b.date));
  for (const row of out) {
    const spend = row.ad_spend_bdt || 0;
    const ordersCount = row.orders || 0;
    row.blended_cpa_bdt = ordersCount > 0 ? spend / ordersCount : null;
    row.roas = spend > 0 ? row.revenue_bdt / spend : null;
    row.conv_to_order_rate = null;
  }
  return out;
}
