
import React from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// Robust numeric parser (handles 'S$54.58', 'SGD 54.58', '1,234.56')
const num = (v:any): number => {
  if (typeof v === 'number') return v;
  if (v == null) return 0;
  const s = String(v).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
import { parseLocalDate } from '../lib/date'
import { sgdToBdt } from '../lib/currency'
import type { AdRow, OrderRow } from '../lib/metrics'

function readFileAsync(file: File): Promise<ArrayBuffer | string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as any)
    reader.onerror = reject
    if (file.name.endsWith('.csv')) reader.readAsText(file)
    else reader.readAsArrayBuffer(file)
  })
}

function normalizeAdsFromSheet(sheetData: any[][]): AdRow[] {
  const headerRowIdx = sheetData.findIndex(r => r && r.includes('Campaign name'))
  if (headerRowIdx === -1) return []
  const header = sheetData[headerRowIdx]
  const rows = sheetData.slice(headerRowIdx + 1)

  const col = (name: string) => header.findIndex((h: any) => (h||'').toString().trim().toLowerCase() === name.toLowerCase())
    const findCol = (...names: string[]) => {
      for (const n of names) { const i = col(n); if (i >= 0) return i }
      return -1
    }

    const idxCampaign = col('Campaign name')
    const idxAdset = col('Ad Set Name') >= 0 ? col('Ad Set Name') : col('Ad set name')
    const idxAd = col('Ad name')
    const idxLevel = col('Delivery level')
    const idxReach = col('Reach')
    const idxImp = col('Impressions')
    const idxFreq = col('Frequency')
    const idxResultType = col('Result type')
    const idxResults = col('Results')
    const idxSpend = findCol('Amount spent (SGD)', 'Amount Spent (SGD)', 'Spend (SGD)')
    const idxMsgConv = col('Messaging conversations started')
    const idxUniqueCtr = col('Unique CTR (link click-through rate)')
    const idxCtrAll = col('CTR (All)') >= 0 ? col('CTR (All)') : col('Ctr (All)')
    const idxStart = col('Reporting starts')
    const idxEnd = col('Reporting ends')

  const out: AdRow[] = []
  for (const r of rows) {
    if (!r) continue
    const level = (r[idxLevel]||'').toString().toLowerCase() as any
    const dateStr = parseLocalDate(r[idxStart] || r[idxEnd])
    if (!dateStr) continue
    const impressions = num(r[idxImp])
    const spendSgd = num(r[idxSpend])
    const spendBdt = sgdToBdt(spendSgd)
    const cpm = impressions > 0 ? (spendBdt / impressions) * 1000 : null

    out.push({
      report_date: dateStr,
      campaign_name: r[idxCampaign] || '',
      adset_name: r[idxAdset] || '',
      ad_name: r[idxAd] || '',
      level: (level === 'campaign' || level === 'adset' || level === 'ad') ? level : 'campaign',
      reach: num(r[idxReach]),
      impressions,
      frequency: num(r[idxFreq]),
      results: num(r[idxResults]),
      result_type: String(r[idxResultType] || ''),
      conversations_started: num(r[idxMsgConv] || (String(r[idxResultType]||'').includes('Messaging conversations') ? r[idxResults] : 0)),
      unique_ctr: idxUniqueCtr>=0 && r[idxUniqueCtr]!=null ? Number(String(r[idxUniqueCtr]).toString().replace('%','')) : undefined,
      ctr_all: (idxCtrAll>=0 && r[idxCtrAll]!=null) ? Number(String(r[idxCtrAll]).toString().replace('%','')) : undefined,
      purchases: undefined,
      spend_sgd: spendSgd,
      spend_bdt: spendBdt,
      cpm_bdt: cpm || undefined,
      cpc_bdt: undefined
    })
  }
  return out
}

function normalizeAds(file: File, data: string | ArrayBuffer): AdRow[] {
  if (typeof data === 'string' && file.name.endsWith('.csv')) {
    const parsed = Papa.parse(data, { header: true })
    const rows = parsed.data as any[]
    const hdr = parsed.meta.fields || []
    const lc = (x:string) => (x||'').toLowerCase()
    const find = (name:string) => hdr.find(h => lc(h) === lc(name))

    const rStart = find('Reporting starts') || find('Report Start Date') || find('Date')
    const rEnd = find('Reporting ends') || find('Report End Date')
    const out: AdRow[] = []

    for (const r of rows) {
      if (!r) continue
      const dateStr = parseLocalDate(r[rStart] || r[rEnd])
      if (!dateStr) continue
      const impressions = num(r['Impressions'] || r['impressions'])
      const spendSgd = num(r['Amount spent (SGD)'] || r['Amount Spent (SGD)'] || r['Spend (SGD)'])
      const spendBdt = sgdToBdt(spendSgd)
      const cpm = impressions > 0 ? (spendBdt / impressions) * 1000 : null
      const convs = num(r['Messaging conversations started']) || (String(r['Result type']||'').includes('Messaging conversations') ? Number(r['Results']||0) : 0)
      const ctrAll = r['CTR (All)'] != null ? Number(String(r['CTR (All)']).replace('%','')) : undefined
      const uniqueCtr = r['Unique CTR (link click-through rate)'] ? Number(String(r['Unique CTR (link click-through rate)']).replace('%','')) : undefined

      out.push({
        report_date: dateStr,
        campaign_name: r['Campaign name'] || r['Campaign Name'],
        adset_name: r['Ad Set Name'] || r['Ad set name'],
        ad_name: r['Ad name'],
        level: (r['Delivery level'] || '').toLowerCase(),
        reach: num(r['Reach']),
        impressions,
        frequency: num(r['Frequency']),
        results: num(r['Results']),
        result_type: r['Result type'],
        conversations_started: convs,
        unique_ctr: uniqueCtr,
        ctr_all: ctrAll,
        purchases: Number(r['Purchases'] || 0),
        spend_sgd: spendSgd,
        spend_bdt: spendBdt,
        cpm_bdt: cpm || undefined,
        cpc_bdt: undefined
      })
    }
    return out
  } else {
    const wb = XLSX.read(data as ArrayBuffer, { type: 'array' })
    const first = wb.SheetNames[0]
    const sheet = wb.Sheets[first]
    const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header:1 })
    return normalizeAdsFromSheet(aoa)
  }
}

function normalizeOrders(file: File, data: string | ArrayBuffer): OrderRow[] {
  const text = typeof data === 'string' ? data : new TextDecoder('latin1').decode(data as ArrayBuffer)
  const parsed = Papa.parse(text, { header: true })
  const rows = parsed.data as any[]
  const out: OrderRow[] = []
  for (const r of rows) {
    const orderDate = parseLocalDate(r['Creation Date'])
    if (!orderDate) continue
    const total = Number(r['Total Price'] || r['Total amount'] || 0)
    out.push({
      order_date: orderDate,
      invoice_number: r['Invoice Number'],
      order_status: r['Order Status'],
      paid_amount: Number(r['Paid Amount'] || 0),
      due_amount: Number(r['Due Amount'] || 0),
      total_price: total,
      delivery_area: r['Delivery Area'],
      classification: (total ? (total >= 2000 ? 'PCMO' : (total >= 600 && total <= 1500 ? 'MCO' : null)) : null)
    })
  }
  return out
}

export type UploadResult = { ads: AdRow[], orders: OrderRow[] }
export default function FileUploader({ onData }:{ onData: (res: UploadResult) => void }) {
  const [adsFile, setAdsFile] = React.useState<File | null>(null)
  const [ordersFile, setOrdersFile] = React.useState<File | null>(null)
  const [busy, setBusy] = React.useState(false)

  const parseAndEmit = async () => {
    if (!adsFile || !ordersFile) return
    setBusy(true)
    try {
      const [adsBuf, ordBuf] = await Promise.all([readFileAsync(adsFile), readFileAsync(ordersFile)])
      const ads = normalizeAds(adsFile, adsBuf)
      const orders = normalizeOrders(ordersFile, ordBuf)
      onData({ ads, orders })
    } finally { setBusy(false) }
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="text-lg font-semibold">Upload daily files</div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <div className="text-sm font-medium mb-1">Ads report (CSV/XLSX)</div>
          <input type="file" accept=".csv,.xlsx" onChange={e=>setAdsFile(e.target.files?.[0] || null)} />
          {adsFile && <div className="text-xs text-gray-500 mt-1">{adsFile.name}</div>}
        </label>
        <label className="block">
          <div className="text-sm font-medium mb-1">Sales report (CSV)</div>
          <input type="file" accept=".csv" onChange={e=>setOrdersFile(e.target.files?.[0] || null)} />
          {ordersFile && <div className="text-xs text-gray-500 mt-1">{ordersFile.name}</div>}
        </label>
      </div>
      <button className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50" disabled={!adsFile || !ordersFile || busy} onClick={parseAndEmit}>
        {busy ? 'Processing…' : 'Process files'}
      </button>
      <p className="text-xs text-gray-500">Local date parsing (no UTC). Supports dd/mm/yyyy, dd.mm.yyyy, dd-MMM-yy, yyyy-mm-dd, Excel serial.</p>
    </div>
  )
}
