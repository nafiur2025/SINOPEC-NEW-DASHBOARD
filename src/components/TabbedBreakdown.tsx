
  import React from 'react'
  export default function TabbedBreakdown({ ads }){
    const [level,setLevel]=React.useState('campaign'); const [metric,setMetric]=React.useState('cpm_bdt');
    const metrics=[{key:'cpc_bdt',label:'Cost per Click (BDT)'},{key:'cpm_bdt',label:'CPM (BDT)'},{key:'conversations_started',label:'Conversations Started'},{key:'frequency',label:'Frequency'},{key:'unique_ctr',label:'Unique CTR %'},{key:'ctr_all',label:'CTR (All) %'}];
    const filtered=(ads||[]).filter(a=>a.level===level);
    const groups=new Map(); for(const r of filtered){ const key=(level==='campaign'?r.campaign_name:level==='adset'?r.adset_name:r.ad_name)||'Unknown'; const arr=groups.get(key)||[]; arr.push(r); groups.set(key,arr); }
    return (<div className="card"><div className="card-header">Breakdown by {level}</div><div className="card-body space-y-4">
      <div className="flex flex-wrap gap-2">{['campaign','adset','ad'].map(l=>(<button key={l} className={"px-3 py-1 rounded-full border text-sm "+(level===l?"bg-black text-white":"")} onClick={()=>setLevel(l)}>{l}</button>))}
      <select className="border rounded-lg px-3 py-1 text-sm ml-auto" value={metric} onChange={e=>setMetric(e.target.value)}>{metrics.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</select></div>
      <div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="p-2">Name</th><th className="p-2">Date</th><th className="p-2">Value</th></tr></thead><tbody>
      {Array.from(groups.entries()).flatMap(([name,rows])=>rows.sort((a,b)=>a.report_date.localeCompare(b.report_date)).map((r,i)=>(<tr key={name+i} className="border-t"><td className="p-2">{name}</td><td className="p-2">{r.report_date}</td><td className="p-2">{r[metric]??'—'}</td></tr>)))}
      </tbody></table></div></div></div>)
  }
