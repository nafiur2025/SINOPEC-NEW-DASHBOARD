
import React from 'react'
import { fmtBDT } from '../lib/currency'
import clsx from 'clsx'

type KPI = {
  label: string, value: number | null, fmt?: (n:number|null)=>string, help?: string, badge?: {text:string, tone:'green'|'yellow'|'red'}
}

function fmtNum(n: number | null) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n)
}

export default function TopTiles({ data }:{ data: any[] }) {
  const last = data[data.length-1] || {}
  const kpis: KPI[] = [
    { label: 'Revenue', value: last.revenue_bdt ?? null, fmt: (n)=>fmtBDT(n||0) },
    { label: 'Orders', value: last.orders ?? null },
    { label: 'Ad Spend', value: last.ad_spend_bdt ?? null, fmt: (n)=>fmtBDT(n||0) },
    { label: 'Blended CPA', value: last.blended_cpa_bdt ?? null, fmt: (n)=>fmtBDT(n||0), badge: badgeCPA(last.blended_cpa_bdt) },
    { label: 'ROAS', value: last.roas ?? null },
    { label: 'Conversations', value: last.conversations ?? null },
    { label: 'Conv → Order %', value: last.conv_to_order_rate ?? null }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k)=> (
        <div key={k.label} className="tile">
          <div className="text-sm text-gray-500">{k.label}</div>
          <div className="mt-1 text-2xl font-semibold">
            {k.fmt ? k.fmt(k.value) : fmtNum(k.value)}
          </div>
          {k.badge && (
            <div className={clsx('inline-flex items-center mt-2 badge', {
              'border-green-600 text-green-700': k.badge.tone==='green',
              'border-yellow-600 text-yellow-700': k.badge.tone==='yellow',
              'border-red-600 text-red-700': k.badge.tone==='red',
            })}>
              {k.badge.text}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function badgeCPA(cpa?: number | null) {
  if (cpa == null) return undefined
  if (cpa <= 300) return { text: '≤ 300: Scale', tone: 'green' as const }
  if (cpa <= 500) return { text: '301–500: Watch', tone: 'yellow' as const }
  return { text: '> 500: Fix', tone: 'red' as const }
}
