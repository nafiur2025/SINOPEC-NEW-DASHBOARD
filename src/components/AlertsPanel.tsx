
  import React from 'react'
  export default function AlertsPanel({ alerts }){
    if(!alerts?.length) return (<div className="card"><div className="card-header">Alerts</div><div className="card-body text-sm text-gray-500">No alerts yet. Keep feeding daily data.</div></div>);
    return (<div className="card"><div className="card-header">Alerts</div><div className="card-body space-y-3">{alerts.map(a=>(<div key={a.key} className="balloon"><div className="font-medium">{a.title}</div><div className="text-xs text-gray-600">{a.date} • {a.scope}</div><div className="mt-1">{a.message}</div></div>))}</div></div>)
  }
