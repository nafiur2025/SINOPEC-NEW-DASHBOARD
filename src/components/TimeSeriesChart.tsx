
  import React from 'react'
  import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts'
  import { fmtBDT } from '../lib/currency'
  export default function TimeSeriesChart({ data, metric, title, alerts }){
    const fmt = (v)=>{
      if(metric==='revenue_bdt' || metric==='blended_cpa_bdt') return fmtBDT(v||0)
      if(metric==='roas') return v==null?'—':Number(v).toFixed(2)
      if(metric==='conv_to_order_rate') return v==null?'—':Number(v).toFixed(1)+'%'
      return v
    }
    const dots=[]; if(alerts){ for(const d of Object.keys(alerts)){ dots.push({date:d, value:(data.find(x=>x.date===d)?.[metric])||0}) } }
    return (<div className="card"><div className="card-header">{title}</div><div className="card-body"><div style={{width:'100%',height:260}}><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis tickFormatter={fmt}/><Tooltip formatter={(v)=>[fmt(v), metric]}/><Line type="monotone" dataKey={metric} dot={false}/>{dots.map((d,i)=><ReferenceDot key={i} x={d.date} y={d.value} r={5}/>)}</LineChart></ResponsiveContainer></div></div></div>)
  }
