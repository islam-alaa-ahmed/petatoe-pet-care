/* PETATOE v6.4.48 - Smart Reports Real Extraction: export and print engine.
   Extracted from smart-reports-core.js without behavior changes. */

function smartExportT(key, fallback, params){
  try{
    var center=window.PETATOE_LOCALIZATION_CENTER;
    if(center&&typeof center.t==='function'){
      return center.t('smartReportsSource.export.'+key,params||{},{fallback:fallback,allowKeyFallback:true});
    }
  }catch(_){ }
  let out=String(fallback==null?'':fallback);
  Object.keys(params||{}).forEach(k=>{out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});
  return out;
}

function _expNow(){
  const d=new Date();
  return d.toLocaleDateString((document.documentElement.lang||'ar').startsWith('en')?'en-SA':'ar-SA',{year:'numeric',month:'long',day:'numeric'})
        +' — '+d.toLocaleTimeString((document.documentElement.lang||'ar').startsWith('en')?'en-SA':'ar-SA',{hour:'2-digit',minute:'2-digit'});
}
function _pzHeader(title,subtitle){
  return `<div class="pz-header">
    <div class="pz-logo">🐾</div>
    <div style="flex:1;padding:0 16px">
      <div class="pz-title">PETATOE Analytics — ${title}</div>
      <div style="font-size:12px;color:#6d28d9;margin-top:2px">${subtitle||''}</div>
    </div>
    <div class="pz-meta">${smartExportT('printedAt','Printed')}: ${_expNow()}<br>PETATOE v2.2</div>
  </div>`;
}
function _pzKpis(pairs){
  return `<div class="pz-kpi-row">${pairs.map(([l,v])=>`<div class="pz-kpi"><div class="pk-label">${l}</div><div class="pk-value">${v}</div></div>`).join('')}</div>`;
}
function _pzTable(headers, rows){
  return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c??''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function _pzFooter(){
  return `<div class="pz-footer">${smartExportT('footer','PETATOE Analytics System v2.2 — Automated Report — All values are in Saudi Riyals (SAR)')}</div>`;
}
function _pzSafeRender(target, markup, reason){
  try{ if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted==='function') return window.PETATOESafeRender.htmlTrusted(target, String(markup==null?'':markup), reason||'smart print trusted template'); }catch(e){ if(window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch) window.PETATOEUtils.warnSilentCatch('smart export safe render fallback', e); }
  if(!target) return false;
  target.textContent='';
  target.insertAdjacentHTML('beforeend', String(markup==null?'':markup));
  return true;
}
function _pzClear(target){
  try{ if(window.PETATOESafeRender && typeof window.PETATOESafeRender.clear==='function') return window.PETATOESafeRender.clear(target); }catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('smart/smart-reports-export-engine.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('smart/smart-reports-export-engine.js',_petatoeSilentCatch);}}
  if(target) target.textContent='';
  return true;
}
function _printZone(html){
  const pz=document.getElementById('printZone');
  if(!pz){toast(smartExportT('printZoneError','Unable to prepare the print area'));return;}
  const theme=(document.documentElement.getAttribute('data-theme')||'dark').toLowerCase()==='light'?'light':'dark';
  _pzSafeRender(pz,'<div class="pz-sheet pz-theme-'+theme+'" data-print-theme="'+theme+'">'+(html||'')+'</div>','smart reports print zone');
  document.body.classList.add('petatoe-simple-print','pet-print-theme-'+theme);
  document.body.classList.remove('pet-print-theme-'+(theme==='dark'?'light':'dark'));
  const cleanupPrintZone=function(){
    _pzClear(pz);
    document.body.classList.remove('petatoe-simple-print','pet-print-theme-dark','pet-print-theme-light');
    window.removeEventListener('afterprint', cleanupPrintZone);
  };
  window.addEventListener('afterprint', cleanupPrintZone);
  setTimeout(()=>{
    window.print();
    // Fallback cleanup only if afterprint is not fired by the browser.
    setTimeout(()=>{ if(document.body.classList.contains('petatoe-simple-print')) cleanupPrintZone(); }, 15000);
  },120);
}
function _toExcel(sheetName, headers, rows, filename){
  const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);
  // column widths
  ws['!cols']=headers.map(()=>({wch:18}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,sheetName.slice(0,31));
  XLSX.writeFile(wb,filename);
}
function _copyTableText(headers, rows){
  const lines=[headers.join('\t'),...rows.map(r=>r.join('\t'))];
  navigator.clipboard.writeText(lines.join('\n'))
    .then(()=>toast(smartExportT('copySuccess','✅ Data copied to the clipboard')))
    .catch(()=>toast(smartExportT('copyError','❌ Copy failed — please try again')));
}

/* ---- Generic export toolbar builder ---- */
function exportToolbar(reportId, pdfFn, excelFn, copyFn){ return ``; }

/* ================================================================
   1. DASHBOARD — exportDashPdf / exportDashExcel
   ================================================================ */
function exportDashPdf(){
  const data=filtered();
  const y=selectedDashboardYear();
  const label=y==='all'?smartExportT('allYears',smartExportT('allYears','All Years')):y;
  const total=data.reduce((s,r)=>s+parseNum(r.totalInc),0);
  const avg=data.length?total/data.length:0;
  const vans=Object.entries(groupSum(data,'van')).sort((a,b)=>b[1]-a[1]);
  const clients=Object.entries(groupSum(data,'client')).sort((a,b)=>b[1]-a[1]);
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  _printZone(
    _pzHeader(smartExportT('dashboardTitle','Dashboard'),smartExportT('dashboardSubtitle','Overall Sales Summary'))+
    _pzKpis([
      [smartExportT('year',smartExportT('year','Year')),label],[smartExportT('totalSales',smartExportT('totalSales','Total Sales')),money(total)],
      [smartExportT('invoiceCount',smartExportT('invoiceCount','Invoice Count')),fmt0(data.length)],[smartExportT('averageInvoice',smartExportT('averageInvoice','Average Invoice')),money(avg)],
      [smartExportT('customerCount','Customer Count'),fmt0(new Set(data.map(r=>r.client)).size)],
      [smartExportT('vehicleCount',smartExportT('vehicleCount','Vehicle Count')),fmt0(new Set(data.map(r=>r.van)).size)]
    ])+
    '<div class="pz-section">'+smartExportT('vehiclePerformance',smartExportT('vehiclePerformance','Vehicle Performance'))+'</div>'+
    _pzTable([smartExportT('vehicle',smartExportT('vehicle','Vehicle')),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount',smartExportT('operationCount','Operations Count')),smartExportT('contribution',smartExportT('contribution','Contribution %'))],
      vans.map(([v,s])=>[v,fmt(s),fmt0(data.filter(r=>r.van===v).length),(total?s/total*100:0).toFixed(2)+'%'])
    )+
    '<div class="pz-section">'+smartExportT('topCustomers','Top 10 Customers')+'</div>'+
    _pzTable([smartExportT('customer',smartExportT('customer','Customer')),smartExportT('salesSar','Sales (SAR)')],clients.slice(0,10).map(([c,s])=>[c,fmt(s)]))+
    '<div class="pz-section">'+smartExportT('topServices','Top 10 Services')+'</div>'+
    _pzTable([smartExportT('service',smartExportT('service','Service')),smartExportT('salesSar','Sales (SAR)')],svcs.slice(0,10).map(([s,v])=>[s,fmt(v)]))+
    _pzFooter()
  );
}
function exportDashExcel(){
  const data=filtered();
  const y=selectedDashboardYear();
  const vans=Object.entries(groupSum(data,'van')).sort((a,b)=>b[1]-a[1]);
  const clients=Object.entries(groupSum(data,'client')).sort((a,b)=>b[1]-a[1]);
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  const months=monthAgg(data,y);
  const wb=XLSX.utils.book_new();
  const addSh=(name,hdr,rows)=>{const ws=XLSX.utils.aoa_to_sheet([hdr,...rows]);ws['!cols']=hdr.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,name)};
  addSh(smartExportT('monthlySummary','Monthly Summary'),[smartExportT('month',smartExportT('month','Month')),smartExportT('salesSar',smartExportT('salesSar','Sales (SAR)')),smartExportT('operationCount',smartExportT('operationCount','Operations Count')),smartExportT('averageInvoice',smartExportT('averageInvoice','Average Invoice'))],months.map(m=>[m.label,m.total,m.count,m.avg.toFixed(2)]));
  addSh(smartExportT('vehicles','Vehicles'),[smartExportT('vehicle',smartExportT('vehicle','Vehicle')),smartExportT('salesSar',smartExportT('salesSar','Sales (SAR)')),smartExportT('operationCount',smartExportT('operationCount','Operations Count'))],vans.map(([v,s])=>[v,s,data.filter(r=>r.van===v).length]));
  addSh(smartExportT('customers',smartExportT('customers','Customers')),[smartExportT('customer',smartExportT('customer','Customer')),smartExportT('salesSar',smartExportT('salesSar','Sales (SAR)'))],clients.map(([c,s])=>[c,s]));
  addSh(smartExportT('services',smartExportT('services','Services')),[smartExportT('service',smartExportT('service','Service')),smartExportT('salesSar',smartExportT('salesSar','Sales (SAR)'))],svcs.map(([s,v])=>[s,v]));
  XLSX.writeFile(wb,`PETATOE_Dashboard_${y}.xlsx`);
}
window.exportDashPdf=exportDashPdf; window.exportDashExcel=exportDashExcel;

/* ================================================================
   2. SALES ANALYTICS — exportSalesPdf / exportSalesExcel
   ================================================================ */
function exportSalesPdf(){
  const y=reportYear==='all'?'all':(+reportYear||defaultYear(records));
  const data=byYear(records,y);
  const months=monthAgg(records,y);
  const qs=['Q1','Q2','Q3','Q4'];
  _printZone(
    _pzHeader(smartExportT('monthlySalesReport','Monthly Sales Report'),smartExportT('monthlyQuarterlyAnalysis','Monthly and Quarterly Sales Analysis'))+
    _pzKpis([
      [smartExportT('year','Year'),y==='all'?smartExportT('allYears','All Years'):y],
      [smartExportT('totalSales','Total Sales'),money(data.reduce((s,r)=>s+parseNum(r.totalInc),0))],
      [smartExportT('invoiceCount','Invoice Count'),fmt0(data.length)],
      [smartExportT('bestMonth','Best Month'),(months.slice().sort((a,b)=>b.total-a.total)[0]||{}).label||'-'],
      [smartExportT('topQuarter','Top Quarter'),qs.map(q=>([q,qSum(records,y,q)])).sort((a,b)=>b[1]-a[1])[0][0]]
    ])+
    '<div class="pz-section">'+smartExportT('monthlySales','Monthly Sales')+'</div>'+
    _pzTable([smartExportT('month','Month'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount','Operations Count'),smartExportT('averageInvoiceSar','Average Invoice (SAR)')],
      months.map(m=>[m.label,fmt(m.total),fmt0(m.count),fmt(m.avg)]))+
    '<div class="pz-section">'+smartExportT('quarterlyComparison','Quarterly Comparison')+'</div>'+
    (()=>{const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; return _pzTable([smartExportT('quarter','Quarter'),y1+' (SAR)',y2+' (SAR)',smartExportT('difference','Difference'),smartExportT('growthPercent','Growth %')], qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q),d=b-a,g=a?d/a*100:0; return[q,fmt(a),fmt(b),(d>=0?'+':'')+fmt(d),g.toFixed(2)+'%']}))})()+
    _pzFooter()
  );
}
function exportSalesExcel(){
  const y=reportYear==='all'?'all':(+reportYear||defaultYear(records));
  const months=monthAgg(records,y);
  const qs=['Q1','Q2','Q3','Q4'];
  const wb=XLSX.utils.book_new();
  const addSh=(name,hdr,rows)=>{const ws=XLSX.utils.aoa_to_sheet([hdr,...rows]);ws['!cols']=hdr.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,name)};
  addSh(smartExportT('monthly','Monthly'),[smartExportT('month','Month'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount','Operations Count'),smartExportT('averageInvoice','Average Invoice')],months.map(m=>[m.label,m.total,m.count,+m.avg.toFixed(2)]));
  {const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; addSh(smartExportT('quarterly','Quarterly'),[smartExportT('quarter','Quarter'),String(y1),String(y2),smartExportT('difference','Difference'),smartExportT('growthPercentCompact','Growth %')],qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q);return[q,a,b,b-a,a?(((b-a)/a)*100).toFixed(2)+'%':'—']}));}
  addSh(smartExportT('paymentMethods','Payment Methods'),[smartExportT('paymentMethod','Payment Method'),smartExportT('salesSar','Sales (SAR)')],Object.entries(groupSum(byYear(records,y),'pay')).sort((a,b)=>b[1]-a[1]).map(([p,s])=>[p,s]));
  XLSX.writeFile(wb,`PETATOE_Sales_${y}.xlsx`);
}
window.exportSalesPdf=exportSalesPdf; window.exportSalesExcel=exportSalesExcel;

/* ================================================================
   3. VANS PERFORMANCE — exportVansPdf / exportVansExcel
   ================================================================ */
function exportVansPdf(){
  const y=vanYear==='all'?'all':(+vanYear||defaultYear(records));
  const data=byYear(records,y);
  const vans=Object.entries(groupSum(data,'van')).sort((a,b)=>b[1]-a[1]);
  const total=vans.reduce((s,[,v])=>s+v,0);
  _printZone(
    _pzHeader(smartExportT('vehiclePerformance','Vehicle Performance'),smartExportT('vehicleSalesPerformanceAnalysis','Sales and Performance Analysis by Vehicle'))+
    _pzKpis([
      [smartExportT('year','Year'),y==='all'?smartExportT('allYears','All Years'):y],
      [smartExportT('totalSales','Total Sales'),money(total)],
      [smartExportT('vehicleCount','Vehicle Count'),fmt0(vans.length)],
      [smartExportT('bestVehicle','Best Vehicle'),vans[0]?vans[0][0]:'-'],
      [smartExportT('totalOperations','Total Operations'),fmt0(data.length)]
    ])+
    '<div class="pz-section">'+smartExportT('vehicleDetails','Vehicle Details')+'</div>'+
    _pzTable([smartExportT('vehicle','Vehicle'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operations','Operations'),smartExportT('averageOperationSar','Average Operation (SAR)'),smartExportT('contribution','Contribution %')],
      vans.map(([v,s])=>{const cnt=data.filter(r=>r.van===v).length;return[v,fmt(s),fmt0(cnt),fmt(cnt?s/cnt:0),(total?s/total*100:0).toFixed(2)+'%']}))+
    '<div class="pz-section">'+smartExportT('monthlyVehicleSales','Monthly Vehicle Sales')+'</div>'+
    (()=>{const months=monthAgg(data,y),vanNames=vans.map(([v])=>v);
      return _pzTable([smartExportT('month','Month'),...vanNames.map(v=>v+' (SAR)')],
        months.map(m=>[m.label,...vanNames.map(v=>fmt(data.filter(r=>r.van===v&&normalizeMonth(r.month,r.date)===m.month).reduce((s,r)=>s+parseNum(r.totalInc),0)))]))
    })()+
    _pzFooter()
  );
}
function exportVansExcel(){
  const y=vanYear==='all'?'all':(+vanYear||defaultYear(records));
  const data=byYear(records,y);
  const vans=Object.entries(groupSum(data,'van')).sort((a,b)=>b[1]-a[1]);
  const months=monthAgg(data,y);
  const wb=XLSX.utils.book_new();
  const addSh=(n,h,r)=>{const ws=XLSX.utils.aoa_to_sheet([h,...r]);ws['!cols']=h.map(()=>({wch:18}));XLSX.utils.book_append_sheet(wb,ws,n)};
  addSh(smartExportT('vehicleSummary','Vehicle Summary'),[smartExportT('vehicle','Vehicle'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount','Operations Count'),smartExportT('averageOperationSar','Average Operation (SAR)')],vans.map(([v,s])=>{const c=data.filter(r=>r.van===v).length;return[v,s,c,+(c?s/c:0).toFixed(2)]}));
  const vanNames=vans.map(([v])=>v);
  addSh(smartExportT('monthlyPerVehicle','Monthly by Vehicle'),[smartExportT('month','Month'),...vanNames],months.map(m=>[m.label,...vanNames.map(v=>+data.filter(r=>r.van===v&&normalizeMonth(r.month,r.date)===m.month).reduce((s,r)=>s+parseNum(r.totalInc),0).toFixed(2))]));
  XLSX.writeFile(wb,`PETATOE_Vans_${y}.xlsx`);
}
window.exportVansPdf=exportVansPdf; window.exportVansExcel=exportVansExcel;

/* ================================================================
   4. SERVICES ANALYSIS — exportServicesPdf / exportServicesExcel
   ================================================================ */
function exportServicesPdf(){
  const data=filtered();
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  const total=svcs.reduce((s,[,v])=>s+v,0);
  _printZone(
    _pzHeader(smartExportT('servicesAnalysis','Services Analysis'),smartExportT('servicesAnalysisSubtitle','Most Requested and Highest-Value Services'))+
    _pzKpis([
      [smartExportT('totalSales','Total Sales'),money(total)],
      [smartExportT('serviceCount','Service Count'),fmt0(svcs.length)],
      [smartExportT('topValueService','Top-Value Service'),svcs[0]?svcs[0][0]:'-'],
      [smartExportT('totalOperations','Total Operations'),fmt0(data.length)]
    ])+
    '<div class="pz-section">'+smartExportT('servicesRanking','Services Ranking')+'</div>'+
    _pzTable(['#',smartExportT('service','Service'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount','Operations Count'),smartExportT('averageSar','Average (SAR)'),smartExportT('contribution','Contribution %')],
      svcs.map(([s,v],i)=>{const c=data.filter(r=>r.item===s).length;return[i+1,s,fmt(v),fmt0(c),fmt(c?v/c:0),(total?v/total*100:0).toFixed(2)+'%']}))+
    _pzFooter()
  );
}
function exportServicesExcel(){
  const data=filtered();
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  const total=svcs.reduce((s,[,v])=>s+v,0);
  _toExcel(smartExportT('services','Services'),
    ['#',smartExportT('service','Service'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount','Operations Count'),smartExportT('averageSar','Average (SAR)'),smartExportT('contribution','Contribution %')],
    svcs.map(([s,v],i)=>{const c=data.filter(r=>r.item===s).length;return[i+1,s,+v.toFixed(2),c,+(c?v/c:0).toFixed(2),(total?v/total*100:0).toFixed(2)+'%']}),
    'PETATOE_Services.xlsx'
  );
}
window.exportServicesPdf=exportServicesPdf; window.exportServicesExcel=exportServicesExcel;

/* ================================================================
   5. SMART — OVERVIEW — exportOverviewPdf / exportOverviewExcel
   ================================================================ */
function exportOverviewPdf(){
  const data=records;
  const total=data.reduce((s,r)=>s+parseNum(r.totalInc),0);
  const ys=years(data);
  const rows=ys.map(y=>{const d=byYear(data,y),t=d.reduce((s,r)=>s+parseNum(r.totalInc),0);return[y,fmt(t),fmt0(d.length),fmt(d.length?t/d.length:0)]});
  _printZone(
    _pzHeader(smartExportT('overallPerformanceSummary','Overall Performance Summary'),smartExportT('allYearsOverview','Overview Across All Years'))+
    _pzKpis([
      [smartExportT('allYearsTotal','All-Years Total'),money(total)],
      [smartExportT('recordCount','Record Count'),fmt0(data.length)],
      [smartExportT('yearCount','Year Count'),fmt0(ys.length)],
      [smartExportT('customerCount','Customer Count'),fmt0(new Set(data.map(r=>r.client)).size)],
      [smartExportT('serviceCount','Service Count'),fmt0(new Set(data.map(r=>r.item)).size)]
    ])+
    '<div class="pz-section">'+smartExportT('annualPerformanceComparison','Annual Performance Comparison')+'</div>'+
    _pzTable([smartExportT('year','Year'),smartExportT('salesSar','Sales (SAR)'),smartExportT('invoiceCount','Invoice Count'),smartExportT('averageInvoiceSar','Average Invoice (SAR)')],rows)+
    _pzFooter()
  );
}
function exportOverviewExcel(){
  const ys=years(records);
  const wb=XLSX.utils.book_new();
  const addSh=(n,h,r)=>{const ws=XLSX.utils.aoa_to_sheet([h,...r]);ws['!cols']=h.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,n)};
  addSh(smartExportT('annual','Annual'),[smartExportT('year','Year'),smartExportT('salesSar','Sales (SAR)'),smartExportT('invoices','Invoices'),smartExportT('averageSar','Average (SAR)')],ys.map(y=>{const d=byYear(records,y),t=d.reduce((s,r)=>s+parseNum(r.totalInc),0);return[y,+t.toFixed(2),d.length,+(d.length?t/d.length:0).toFixed(2)]}));
  addSh(smartExportT('monthlyAllYears','Monthly Across All Years'),[smartExportT('monthYear','Month/Year'),smartExportT('salesSar','Sales (SAR)'),smartExportT('invoices','Invoices')],monthAgg(records,'all').map(m=>[m.label,+m.total.toFixed(2),m.count]));
  XLSX.writeFile(wb,'PETATOE_Overview_AllYears.xlsx');
}
window.exportOverviewPdf=exportOverviewPdf; window.exportOverviewExcel=exportOverviewExcel;

/* ================================================================
   6. SMART — SALES INTELLIGENCE — exportSmartSalesPdf / exportSmartSalesExcel
   ================================================================ */
function exportSmartSalesPdf(){
  const y=smartSalesYear==='all'?'all':(+smartSalesYear||defaultYear(records));
  const data=byYear(records,y);
  const months=monthAgg(records,y);
  const isTax=smartSalesTaxMode==='net';
  const val=r=>isTax?parseNum(r.totalEx):parseNum(r.totalInc);
  const modeLabel=isTax?smartExportT('excludingVat','Excluding VAT'):smartExportT('includingVat','Including VAT');
  _printZone(
    _pzHeader(smartExportT('smartSalesAnalysis','Smart Sales Analysis'),smartExportT('yearVatMode','Year: {year} — {mode}',{year:y==='all'?smartExportT('allYears','All Years'):y,mode:modeLabel}))+
    _pzKpis([
      [smartExportT('totalSales','Total Sales'),money(data.reduce((s,r)=>s+val(r),0))],
      [smartExportT('invoiceCount','Invoice Count'),fmt0(data.length)],
      [smartExportT('topMonth','Top Month'),(months.slice().sort((a,b)=>b.total-a.total)[0]||{}).label||'-'],
      [smartExportT('vatMode','VAT Mode'),modeLabel]
    ])+
    '<div class="pz-section">'+smartExportT('monthlySales','Monthly Sales')+'</div>'+
    _pzTable([smartExportT('month','Month'),smartExportT('valueSar','Value (SAR)'),smartExportT('invoices','Invoices'),smartExportT('averageSar','Average (SAR)')],
      months.map(m=>[m.label,fmt(m.total),fmt0(m.count),fmt(m.avg)]))+
    _pzFooter()
  );
}
function exportSmartSalesExcel(){
  const y=smartSalesYear==='all'?'all':(+smartSalesYear||defaultYear(records));
  const months=monthAgg(records,y);
  const clients=Object.entries(groupSum(byYear(records,y),'client')).sort((a,b)=>b[1]-a[1]);
  const wb=XLSX.utils.book_new();
  const addSh=(n,h,r)=>{const ws=XLSX.utils.aoa_to_sheet([h,...r]);ws['!cols']=h.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,n)};
  addSh(smartExportT('monthly','Monthly'),[smartExportT('month','Month'),smartExportT('salesSar','Sales (SAR)'),smartExportT('invoices','Invoices'),smartExportT('averageInvoice','Average Invoice')],months.map(m=>[m.label,+m.total.toFixed(2),m.count,+m.avg.toFixed(2)]));
  addSh(smartExportT('customers',smartExportT('customers','Customers')),[smartExportT('customer',smartExportT('customer','Customer')),smartExportT('salesSar',smartExportT('salesSar','Sales (SAR)'))],clients.map(([c,s])=>[c,+s.toFixed(2)]));
  XLSX.writeFile(wb,`PETATOE_SmartSales_${y}.xlsx`);
}
window.exportSmartSalesPdf=exportSmartSalesPdf; window.exportSmartSalesExcel=exportSmartSalesExcel;

/* ================================================================
   7. SMART — VEHICLES — exportSmartVansPdf / exportSmartVansExcel
   ================================================================ */
function exportSmartVansPdf(){
  const y=smartVehicleYear==='all'?'all':(+smartVehicleYear||defaultYear(records));
  const data=byYear(records,y);
  const vans=Object.entries(groupSum(data,'van')).sort((a,b)=>b[1]-a[1]);
  const total=vans.reduce((s,[,v])=>s+v,0);
  _printZone(
    _pzHeader(smartExportT('smartVehicleAnalysis','Smart Vehicle Analysis'),smartExportT('yearLabel','Year: {year}',{year:y==='all'?smartExportT('allYears','All Years'):y}))+
    _pzKpis([
      [smartExportT('total','Total'),money(total)],[smartExportT('vehicleCount','Vehicle Count'),fmt0(vans.length)],[smartExportT('best','Best'),vans[0]?vans[0][0]:'-']
    ])+
    '<div class="pz-section">'+smartExportT('performanceByVehicle','Performance by Vehicle')+'</div>'+
    _pzTable([smartExportT('vehicle','Vehicle'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operations','Operations'),smartExportT('averageSar','Average (SAR)'),smartExportT('contribution','Contribution %')],
      vans.map(([v,s])=>{const c=data.filter(r=>r.van===v).length;return[v,fmt(s),fmt0(c),fmt(c?s/c:0),(total?s/total*100:0).toFixed(2)+'%']}))+
    _pzFooter()
  );
}
function exportSmartVansExcel(){
  const y=smartVehicleYear==='all'?'all':(+smartVehicleYear||defaultYear(records));
  const data=byYear(records,y);
  const vans=Object.entries(groupSum(data,'van')).sort((a,b)=>b[1]-a[1]);
  const months=monthAgg(data,y);
  const wb=XLSX.utils.book_new();
  const addSh=(n,h,r)=>{const ws=XLSX.utils.aoa_to_sheet([h,...r]);ws['!cols']=h.map(()=>({wch:18}));XLSX.utils.book_append_sheet(wb,ws,n)};
  addSh(smartExportT('vehicleSummary','Vehicle Summary'),[smartExportT('vehicle','Vehicle'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount','Operations Count'),smartExportT('averageOperationSar','Average Operation (SAR)')],vans.map(([v,s])=>{const c=data.filter(r=>r.van===v).length;return[v,+s.toFixed(2),c,+(c?s/c:0).toFixed(2)]}));
  const vanNames=vans.map(([v])=>v);
  addSh(smartExportT('monthlyPerVehicle','Monthly by Vehicle'),[smartExportT('month','Month'),...vanNames],months.map(m=>[m.label,...vanNames.map(v=>+data.filter(r=>r.van===v&&normalizeMonth(r.month,r.date)===m.month).reduce((s,r)=>s+parseNum(r.totalInc),0).toFixed(2))]));
  XLSX.writeFile(wb,`PETATOE_SmartVans_${y}.xlsx`);
}
window.exportSmartVansPdf=exportSmartVansPdf; window.exportSmartVansExcel=exportSmartVansExcel;

/* ================================================================
   8. SMART — CUSTOMERS — exportCustomersPdf / exportCustomersExcel
   ================================================================ */
function exportCustomersPdf(){
  const data=records;
  const model=typeof buildCustomerVisitModel==='function'?buildCustomerVisitModel(data):[];
  const rows=model.slice(0,100).map(c=>[c.client,c.tier||'-',fmt(c.totalSpend||0),fmt0(c.visits||0),fmt(c.avgSpend||0),c.lastVisitLabel||'-']);
  _printZone(
    _pzHeader(smartExportT('customersAnalysis','Customer Analysis'),smartExportT('customersAnalysisSubtitle','Customer Classification and Value'))+
    _pzKpis([
      [smartExportT('totalCustomers','Total Customers'),fmt0(model.length)],
      ['VIP',fmt0(model.filter(c=>c.tier==='VIP').length)],
      [smartExportT('active','Active'),fmt0(model.filter(c=>c.tier==='Active').length)],
      [smartExportT('inactive','Inactive'),fmt0(model.filter(c=>c.tier==='At Risk'||c.tier==='Inactive').length)]
    ])+
    '<div class="pz-section">'+smartExportT('top100Customers','Customer List (Top 100)')+'</div>'+
    _pzTable([smartExportT('customer','Customer'),smartExportT('classification','Classification'),smartExportT('totalSar','Total (SAR)'),smartExportT('visits','Visits'),smartExportT('averageSar','Average (SAR)'),smartExportT('lastVisit','Last Visit')],rows)+
    _pzFooter()
  );
}
function exportCustomersExcel(){
  const model=typeof buildCustomerVisitModel==='function'?buildCustomerVisitModel(records):[];
  _toExcel(smartExportT('customers','Customers'),
    [smartExportT('customer','Customer'),smartExportT('classification','Classification'),smartExportT('totalSar','Total (SAR)'),smartExportT('visits','Visits'),smartExportT('averageSar','Average (SAR)'),smartExportT('lastVisit','Last Visit')],
    model.map(c=>[c.client,c.tier||'-',+(c.totalSpend||0).toFixed(2),c.visits||0,+(c.avgSpend||0).toFixed(2),c.lastVisitLabel||'-']),
    'PETATOE_Customers.xlsx'
  );
}
window.exportCustomersPdf=exportCustomersPdf; window.exportCustomersExcel=exportCustomersExcel;

/* ================================================================
   9. SMART — SERVICES (Smart tab) — exportSmartServicesPdf / Excel
   ================================================================ */
function exportSmartServicesPdf(){
  const y=smartServicesYear==='all'?'all':(+smartServicesYear||defaultYear(records));
  const data=byYear(records,y);
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  const total=svcs.reduce((s,[,v])=>s+v,0);
  _printZone(
    _pzHeader(smartExportT('smartServicesAnalysis','Smart Services Analysis'),smartExportT('yearLabel','Year: {year}',{year:y==='all'?smartExportT('allYears','All Years'):y}))+
    _pzKpis([
      [smartExportT('total','Total'),money(total)],[smartExportT('serviceCount','Service Count'),fmt0(svcs.length)],
      [smartExportT('highestValue','Highest Value'),svcs[0]?svcs[0][0]:'-'],[smartExportT('operationCount','Operations Count'),fmt0(data.length)]
    ])+
    '<div class="pz-section">'+smartExportT('services','Services')+'</div>'+
    _pzTable(['#',smartExportT('service','Service'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operations','Operations'),smartExportT('averageSar','Average (SAR)'),smartExportT('contribution','Contribution %')],
      svcs.map(([s,v],i)=>{const c=data.filter(r=>r.item===s).length;return[i+1,s,fmt(v),fmt0(c),fmt(c?v/c:0),(total?v/total*100:0).toFixed(2)+'%']}))+
    _pzFooter()
  );
}
function exportSmartServicesExcel(){
  const y=smartServicesYear==='all'?'all':(+smartServicesYear||defaultYear(records));
  const data=byYear(records,y);
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  const total=svcs.reduce((s,[,v])=>s+v,0);
  _toExcel(smartExportT('services','Services'),
    ['#',smartExportT('service','Service'),smartExportT('salesSar','Sales (SAR)'),smartExportT('operationCount','Operations Count'),smartExportT('averageSar','Average (SAR)'),smartExportT('contribution','Contribution %')],
    svcs.map(([s,v],i)=>{const c=data.filter(r=>r.item===s).length;return[i+1,s,+v.toFixed(2),c,+(c?v/c:0).toFixed(2),(total?v/total*100:0).toFixed(2)+'%']}),
    `PETATOE_SmartServices_${y}.xlsx`
  );
}
window.exportSmartServicesPdf=exportSmartServicesPdf; window.exportSmartServicesExcel=exportSmartServicesExcel;

/* ================================================================
   10. SMART — ADVANCED REPORTS CENTER — exportAdvancedPdf / Excel
   ================================================================ */
function exportAdvancedPdf(){
  const mode=reportMode||'months';
  const y=reportYear==='all'?'all':(+reportYear||defaultYear(records));
  const data=byYear(records,y);
  const months=monthAgg(records,y);
  const qs=['Q1','Q2','Q3','Q4'];
  let body='';
  if(mode==='months'){
    body='<div class="pz-section">'+smartExportT('monthlySales','Monthly Sales')+'</div>'+
      _pzTable([smartExportT('month','Month'),smartExportT('salesSar','Sales (SAR)'),smartExportT('invoices','Invoices'),smartExportT('averageSar','Average (SAR)')],months.map(m=>[m.label,fmt(m.total),fmt0(m.count),fmt(m.avg)]));
  } else if(mode==='quarters'){
    body='<div class="pz-section">'+smartExportT('quarters','Quarters')+'</div>'+
      _pzTable([smartExportT('quarter','Quarter'),smartExportT('salesSar','Sales (SAR)'),smartExportT('invoices','Invoices')],qs.map(q=>[q,fmt(qSum(records,y,q)),fmt0(qCount(records,y,q))]));
  } else if(mode==='yoyq'){
    {const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; body='<div class="pz-section">'+smartExportT('comparisonBetween','Comparison {first} vs {second}',{first:y1,second:y2})+'</div>'+
      _pzTable([smartExportT('quarter','Quarter'),y1+' SAR',y2+' SAR',smartExportT('difference','Difference'),smartExportT('growthPercent','Growth %')],qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q),d=b-a,g=a?d/a*100:0;return[q,fmt(a),fmt(b),(d>=0?'+':'')+fmt(d),g.toFixed(2)+'%']}));}
  } else if(mode==='payment'){
    const pays=Object.entries(groupSum(data,'pay')).sort((a,b)=>b[1]-a[1]);
    body='<div class="pz-section">'+smartExportT('paymentMethods','Payment Methods')+'</div>'+
      _pzTable([smartExportT('paymentMethod','Payment Method'),smartExportT('salesSar','Sales (SAR)'),smartExportT('contribution','Contribution %')],pays.map(([p,s])=>{const t=pays.reduce((x,[,v])=>x+v,0);return[p,fmt(s),(t?s/t*100:0).toFixed(2)+'%']}));
  }
  const modeNames={months:smartExportT('monthly','Monthly'),quarters:smartExportT('quarterly','Quarterly'),yoyq:smartExportT('annualComparison','Annual Comparison'),payment:smartExportT('paymentMethods','Payment Methods')};
  _printZone(
    _pzHeader(smartExportT('advancedReportsCenter','Advanced Reports Center'),smartExportT('modeYearLabel','Mode: {mode} — Year: {year}',{mode:modeNames[mode]||mode,year:y==='all'?smartExportT('allYears','All Years'):y}))+
    _pzKpis([
      [smartExportT('total','Total'),money(data.reduce((s,r)=>s+parseNum(r.totalInc),0))],
      [smartExportT('invoices','Invoices'),fmt0(data.length)],
      [smartExportT('q1Growth','Q1 Growth'),`${(()=>{const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; const a=qSum(records,y1,'Q1'),b=qSum(records,y2,'Q1');return a?(((b-a)/a)*100).toFixed(2)+'%':'—'})()}`]
    ])+body+_pzFooter()
  );
}
function exportAdvancedExcel(){
  const y=reportYear==='all'?'all':(+reportYear||defaultYear(records));
  const months=monthAgg(records,y);
  const qs=['Q1','Q2','Q3','Q4'];
  const wb=XLSX.utils.book_new();
  const addSh=(n,h,r)=>{const ws=XLSX.utils.aoa_to_sheet([h,...r]);ws['!cols']=h.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,n)};
  addSh(smartExportT('monthly','Monthly'),[smartExportT('month','Month'),'SAR',smartExportT('invoices','Invoices'),smartExportT('averageInvoice','Average Invoice')],months.map(m=>[m.label,+m.total.toFixed(2),m.count,+m.avg.toFixed(2)]));
  addSh(smartExportT('quarterly','Quarterly'),[smartExportT('quarter','Quarter'),'SAR',smartExportT('invoices','Invoices')],qs.map(q=>[q,+qSum(records,y,q).toFixed(2),qCount(records,y,q)]));
  {const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; addSh('YoY',[smartExportT('quarter','Quarter'),String(y1),String(y2),smartExportT('difference','Difference'),'%'],qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q);return[q,+a.toFixed(2),+b.toFixed(2),+(b-a).toFixed(2),(a?((b-a)/a*100).toFixed(2)+'%':'—')]}));}
  addSh(smartExportT('payments','Payments'),[smartExportT('paymentMethod','Payment Method'),'SAR'],Object.entries(groupSum(byYear(records,y),'pay')).sort((a,b)=>b[1]-a[1]).map(([p,s])=>[p,+s.toFixed(2)]));
  XLSX.writeFile(wb,`PETATOE_Advanced_${y}.xlsx`);
}
window.exportAdvancedPdf=exportAdvancedPdf; window.exportAdvancedExcel=exportAdvancedExcel;

/* ================================================================
   11. RECORDS — filtered Excel export (replaces raw exportExcel for current view)
   ================================================================ */
function exportRecordsFilteredExcel(){
  const q=($('recordSearch').value||'').toLowerCase();
  const arr=records.filter(r=>!q||fields.some(f=>String(r[f]||'').toLowerCase().includes(q)));
  const ws=XLSX.utils.aoa_to_sheet([HEADERS,...arr.map(r=>fields.map(f=>r[f]))]);
  ws['!cols']=HEADERS.map(()=>({wch:18}));
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'PETATOE Records');
  XLSX.writeFile(wb,`PETATOE_Records_Filtered_${arr.length}rows.xlsx`);
}
window.exportRecordsFilteredExcel=exportRecordsFilteredExcel;

/* ===== PETATOE v2 - NEW FEATURES ===== */

/* --- Global Search System --- */
let _searchDebounce=null;
