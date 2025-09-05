
import React from 'react'
import FileUploader from '../components/FileUploader'
import TopTiles from '../components/TopTiles'
import TimeSeriesChart from '../components/TimeSeriesChart'
import TabbedBreakdown from '../components/TabbedBreakdown'
import { computeDailyKpis, AdRow, OrderRow } from '../lib/metrics'
import AlertsPanel from '../components/AlertsPanel'
import { generateAlerts } from '../lib/alerts'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const [ads, setAds] = React.useState<AdRow[]>([]);
  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [daily, setDaily] = React.useState<any[]>([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);

  const fetchHistory = React.useCallback(async () => {
    if (!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)) return;
    const since = new Date(); since.setDate(since.getDate()-180);
    const iso = since.toISOString().slice(0,10);
    const [adsRes, ordersRes] = await Promise.all([
      supabase.from('daily_ads').select('*').gte('report_date', iso).order('report_date', { ascending: true }),
      supabase.from('daily_orders').select('*').gte('order_date', iso).order('order_date', { ascending: true })
    ]);
    const adsRows = (adsRes.data || []) as AdRow[];
    const orderRows = (ordersRes.data || []) as OrderRow[];
    setAds(adsRows);
    setOrders(orderRows);
    setDaily(computeDailyKpis(adsRows, orderRows));
    setAlerts(generateAlerts(adsRows));
  }, []);

  React.useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onData = async ({ ads, orders }: { ads: AdRow[]; orders: OrderRow[] }) => {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      if (ads.length) {
        await supabase
          .from('daily_ads')
          .upsert(
            ads.map((a) => ({
              report_date: a.report_date,
              campaign_name: a.campaign_name,
              adset_name: a.adset_name,
              ad_name: a.ad_name,
              level: a.level,
              reach: a.reach,
              impressions: a.impressions,
              frequency: a.frequency,
              results: a.results,
              result_type: a.result_type,
              conversations_started: a.conversations_started,
              unique_ctr: a.unique_ctr,
              ctr_all: a.ctr_all,
              purchases: a.purchases,
              spend_sgd: a.spend_sgd,
              spend_bdt: a.spend_bdt,
              cpm_bdt: a.cpm_bdt,
              cpc_bdt: a.cpc_bdt
            })),
            { onConflict: 'report_date,level,campaign_name,adset_name,ad_name' }
          )
          .select();
      }
      if (orders.length) {
        await supabase
          .from('daily_orders')
          .upsert(
            orders.map((o) => ({
              order_date: o.order_date,
              invoice_number: o.invoice_number,
              order_status: o.order_status,
              paid_amount: o.paid_amount,
              due_amount: o.due_amount,
              total_price: o.total_price,
              delivery_area: o.delivery_area,
              classification: o.classification
            })),
            { onConflict: 'order_date,invoice_number' }
          )
          .select();
      }
      await fetchHistory();
    } else {
      setAds(ads);
      setOrders(orders);
      setDaily(computeDailyKpis(ads, orders));
      setAlerts(generateAlerts(ads));
    }
  };

  const alertDots = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of alerts) {
      map[a.date] = map[a.date] || [];
      map[a.date].push(a.title);
    }
    return map;
  }, [alerts]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold">FB Ads Expert Dashboard</div>
        <div className="text-xs text-gray-500">BDT currency • Local date parsing (no UTC shift) • Asia/Dhaka</div>
      </div>

      <FileUploader onData={onData} />

      {daily.length > 0 ? (
        <>
          <TopTiles data={daily} />
          <div className="grid gap-4 md:grid-cols-2">
            <TimeSeriesChart data={daily} metric="revenue_bdt" title="Revenue (BDT)" alerts={alertDots} />
            <TimeSeriesChart data={daily} metric="roas" title="ROAS (MER)" alerts={alertDots} />
            <TimeSeriesChart data={daily} metric="blended_cpa_bdt" title="Blended CPA (BDT)" alerts={alertDots} />
          </div>
          <TabbedBreakdown ads={ads} />
          <AlertsPanel alerts={alerts} />
        </>
      ) : (
        <div className="text-sm text-gray-500">Upload your files or connect to Supabase to see history.</div>
      )}
    </div>
  );
}
