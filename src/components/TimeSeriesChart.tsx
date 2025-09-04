
import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts'
import { fmtBDT } from '../lib/currency'

type Props = {
  data: any[],
  metric: 'revenue_bdt'|'roas'|'conv_to_order_rate'|'blended_cpa_bdt',
  title: string,
  alerts?: Record<string, string[]>
}

function labelFmt(metric: Props['metric']) {
  switch (metric) {
    case 'revenue_bdt': return (v:any)=>fmtBDT(v||0)
    case 'blended_cpa_bdt': return (v:any)=>fmtBDT(v||0)
    case 'roas': return (v:any)=> (v==null?'—': Number(v).toFixed(2))
    case 'conv_to_order_rate': return (v:any)=> (v==null?'—': Number(v).toFixed(1)+'%')
  }
}

export default function TimeSeriesChart({ data, metric, title, alerts }: Props) {
  const fmt = labelFmt(metric)
  const dots:any[] = []
  if (alerts) {
    for (const d of Object.keys(alerts)) {
      dots.push({ date: d, value: (data.find(x=>x.date===d)?.[metric]) || 0, label: alerts[d].join('\n') })
    }
  }
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={fmt as any} />
              <Tooltip formatter={(value)=>[fmt(value as any), metric]} />
              <Line type="monotone" dataKey={metric} dot={false} />
              {dots.map((d,i)=> <ReferenceDot key={i} x={d.date} y={d.value} r={5} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
