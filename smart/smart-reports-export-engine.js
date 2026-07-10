/* PETATOE v6.4.48 - Smart Reports Real Extraction: export and print engine.
   Extracted from smart-reports-core.js without behavior changes. */

function smartExportT(key, fallback, params){
  try{
    if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.t==='function'){
      const value=window.PETATOE_I18N.t('smartReportsSource.export.'+key,params||{});
      if(typeof value==='string'&&value.trim()) return value;
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
    <div class="pz-meta">${smartExportT('printedAt','طُبع')}: ${_expNow()}<br>PETATOE v2.2</div>
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
  return `<div class="pz-footer">${smartExportT('footer','PETATOE Analytics System v2.2 — تقرير تلقائي — جميع القيم بالريال السعودي (SAR)')}</div>`;
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
  if(!pz){toast(smartExportT('printZoneError','تعذر تجهيز منطقة الطباعة'));return;}
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
    .then(()=>toast(smartExportT('copySuccess','✅ تم نسخ البيانات إلى الحافظة')))
    .catch(()=>toast(smartExportT('copyError','❌ فشل النسخ — حاول مرة أخرى')));
}

/* ---- Generic export toolbar builder ---- */
function exportToolbar(reportId, pdfFn, excelFn, copyFn){ return ``; }

/* ================================================================
   1. DASHBOARD — exportDashPdf / exportDashExcel
   ================================================================ */
function exportDashPdf(){
  const data=filtered();
  const y=selectedDashboardYear();
  const label=y==='all'?smartExportT('allYears','كل السنوات'):y;
  const total=data.reduce((s,r)=>s+parseNum(r.totalInc),0);
  const avg=data.length?total/data.length:0;
  const vans=Object.entries(groupSum(data,'van')).sort((a,b)=>b[1]-a[1]);
  const clients=Object.entries(groupSum(data,'client')).sort((a,b)=>b[1]-a[1]);
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  _printZone(
    _pzHeader(smartExportT('dashboardTitle','لوحة التحكم'),smartExportT('dashboardSubtitle','ملخص المبيعات الكلي'))+
    _pzKpis([
      [smartExportT('year','السنة'),label],[smartExportT('totalSales','إجمالي المبيعات'),money(total)],
      [smartExportT('invoiceCount','عدد الفواتير'),fmt0(data.length)],[smartExportT('averageInvoice','متوسط الفاتورة'),money(avg)],
      [smartExportT('customerCount','عدد العملاء'),fmt0(new Set(data.map(r=>r.client)).size)],
      [smartExportT('vehicleCount','عدد السيارات'),fmt0(new Set(data.map(r=>r.van)).size)]
    ])+
    '<div class="pz-section">'+smartExportT('vehiclePerformance','أداء السيارات')+'</div>'+
    _pzTable([smartExportT('vehicle','السيارة'),smartExportT('salesSar','المبيعات (SAR)'),smartExportT('operationCount','عدد العمليات'),smartExportT('contribution','المساهمة %')],
      vans.map(([v,s])=>[v,fmt(s),fmt0(data.filter(r=>r.van===v).length),(total?s/total*100:0).toFixed(2)+'%'])
    )+
    '<div class="pz-section">'+smartExportT('topCustomers','أفضل 10 عملاء')+'</div>'+
    _pzTable([smartExportT('customer','العميل'),smartExportT('salesSar','المبيعات (SAR)')],clients.slice(0,10).map(([c,s])=>[c,fmt(s)]))+
    '<div class="pz-section">'+smartExportT('topServices','أفضل 10 خدمات')+'</div>'+
    _pzTable([smartExportT('service','الخدمة'),smartExportT('salesSar','المبيعات (SAR)')],svcs.slice(0,10).map(([s,v])=>[s,fmt(v)]))+
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
  addSh(smartExportT('monthlySummary','ملخص شهري'),[smartExportT('month','الشهر'),smartExportT('salesSar','المبيعات SAR'),smartExportT('operationCount','عدد العمليات'),smartExportT('averageInvoice','متوسط الفاتورة')],months.map(m=>[m.label,m.total,m.count,m.avg.toFixed(2)]));
  addSh(smartExportT('vehicles','السيارات'),[smartExportT('vehicle','السيارة'),smartExportT('salesSar','المبيعات SAR'),smartExportT('operationCount','عدد العمليات')],vans.map(([v,s])=>[v,s,data.filter(r=>r.van===v).length]));
  addSh(smartExportT('customers','العملاء'),[smartExportT('customer','العميل'),smartExportT('salesSar','المبيعات SAR')],clients.map(([c,s])=>[c,s]));
  addSh(smartExportT('services','الخدمات'),[smartExportT('service','الخدمة'),smartExportT('salesSar','المبيعات SAR')],svcs.map(([s,v])=>[s,v]));
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
    _pzHeader('تقرير المبيعات الشهري','تحليل المبيعات الشهرية والربعية')+
    _pzKpis([
      ['السنة',y==='all'?'كل السنوات':y],
      ['إجمالي المبيعات',money(data.reduce((s,r)=>s+parseNum(r.totalInc),0))],
      ['عدد الفواتير',fmt0(data.length)],
      ['أفضل شهر',(months.slice().sort((a,b)=>b.total-a.total)[0]||{}).label||'-'],
      ['أعلى ربع',qs.map(q=>([q,qSum(records,y,q)])).sort((a,b)=>b[1]-a[1])[0][0]]
    ])+
    '<div class="pz-section">المبيعات الشهرية</div>'+
    _pzTable(['الشهر','المبيعات SAR','عدد العمليات','متوسط الفاتورة SAR'],
      months.map(m=>[m.label,fmt(m.total),fmt0(m.count),fmt(m.avg)]))+
    '<div class="pz-section">المقارنة الربعية</div>'+
    (()=>{const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; return _pzTable(['الربع',y1+' (SAR)',y2+' (SAR)','الفرق','النمو %'], qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q),d=b-a,g=a?d/a*100:0; return[q,fmt(a),fmt(b),(d>=0?'+':'')+fmt(d),g.toFixed(2)+'%']}))})()+
    _pzFooter()
  );
}
function exportSalesExcel(){
  const y=reportYear==='all'?'all':(+reportYear||defaultYear(records));
  const months=monthAgg(records,y);
  const qs=['Q1','Q2','Q3','Q4'];
  const wb=XLSX.utils.book_new();
  const addSh=(name,hdr,rows)=>{const ws=XLSX.utils.aoa_to_sheet([hdr,...rows]);ws['!cols']=hdr.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,name)};
  addSh('شهري',['الشهر','المبيعات SAR','عدد العمليات','متوسط الفاتورة'],months.map(m=>[m.label,m.total,m.count,+m.avg.toFixed(2)]));
  {const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; addSh('ربعي',['الربع',String(y1),String(y2),'الفرق','النمو%'],qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q);return[q,a,b,b-a,a?(((b-a)/a)*100).toFixed(2)+'%':'—']}));}
  addSh('طرق الدفع',['طريقة الدفع','المبيعات SAR'],Object.entries(groupSum(byYear(records,y),'pay')).sort((a,b)=>b[1]-a[1]).map(([p,s])=>[p,s]));
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
    _pzHeader('أداء السيارات','تحليل مبيعات وأداء كل سيارة')+
    _pzKpis([
      ['السنة',y==='all'?'كل السنوات':y],
      ['إجمالي المبيعات',money(total)],
      ['عدد السيارات',fmt0(vans.length)],
      ['أفضل سيارة',vans[0]?vans[0][0]:'-'],
      ['إجمالي العمليات',fmt0(data.length)]
    ])+
    '<div class="pz-section">تفاصيل كل سيارة</div>'+
    _pzTable(['السيارة','المبيعات SAR','العمليات','متوسط العملية SAR','المساهمة %'],
      vans.map(([v,s])=>{const cnt=data.filter(r=>r.van===v).length;return[v,fmt(s),fmt0(cnt),fmt(cnt?s/cnt:0),(total?s/total*100:0).toFixed(2)+'%']}))+
    '<div class="pz-section">مبيعات السيارات شهرياً</div>'+
    (()=>{const months=monthAgg(data,y),vanNames=vans.map(([v])=>v);
      return _pzTable(['الشهر',...vanNames.map(v=>v+' (SAR)')],
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
  addSh('ملخص السيارات',['السيارة','المبيعات SAR','عدد العمليات','متوسط العملية SAR'],vans.map(([v,s])=>{const c=data.filter(r=>r.van===v).length;return[v,s,c,+(c?s/c:0).toFixed(2)]}));
  const vanNames=vans.map(([v])=>v);
  addSh('شهري لكل سيارة',['الشهر',...vanNames],months.map(m=>[m.label,...vanNames.map(v=>+data.filter(r=>r.van===v&&normalizeMonth(r.month,r.date)===m.month).reduce((s,r)=>s+parseNum(r.totalInc),0).toFixed(2))]));
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
    _pzHeader('تحليل الخدمات','أكثر الخدمات طلباً وأعلاها قيمة')+
    _pzKpis([
      ['إجمالي المبيعات',money(total)],
      ['عدد الخدمات',fmt0(svcs.length)],
      ['أعلى خدمة قيمة',svcs[0]?svcs[0][0]:'-'],
      ['إجمالي العمليات',fmt0(data.length)]
    ])+
    '<div class="pz-section">ترتيب الخدمات</div>'+
    _pzTable(['#','الخدمة','المبيعات SAR','عدد العمليات','متوسط SAR','المساهمة %'],
      svcs.map(([s,v],i)=>{const c=data.filter(r=>r.item===s).length;return[i+1,s,fmt(v),fmt0(c),fmt(c?v/c:0),(total?v/total*100:0).toFixed(2)+'%']}))+
    _pzFooter()
  );
}
function exportServicesExcel(){
  const data=filtered();
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  const total=svcs.reduce((s,[,v])=>s+v,0);
  _toExcel('الخدمات',
    ['#','الخدمة','المبيعات SAR','عدد العمليات','متوسط SAR','المساهمة %'],
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
    _pzHeader('ملخص الأداء الشامل','نظرة عامة على كل السنوات')+
    _pzKpis([
      ['إجمالي كل السنوات',money(total)],
      ['عدد السجلات',fmt0(data.length)],
      ['عدد السنوات',fmt0(ys.length)],
      [smartExportT('customerCount','عدد العملاء'),fmt0(new Set(data.map(r=>r.client)).size)],
      ['عدد الخدمات',fmt0(new Set(data.map(r=>r.item)).size)]
    ])+
    '<div class="pz-section">مقارنة الأداء السنوي</div>'+
    _pzTable(['السنة','المبيعات SAR','عدد الفواتير','متوسط الفاتورة SAR'],rows)+
    _pzFooter()
  );
}
function exportOverviewExcel(){
  const ys=years(records);
  const wb=XLSX.utils.book_new();
  const addSh=(n,h,r)=>{const ws=XLSX.utils.aoa_to_sheet([h,...r]);ws['!cols']=h.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,n)};
  addSh('سنوي',['السنة','المبيعات SAR','الفواتير','متوسط SAR'],ys.map(y=>{const d=byYear(records,y),t=d.reduce((s,r)=>s+parseNum(r.totalInc),0);return[y,+t.toFixed(2),d.length,+(d.length?t/d.length:0).toFixed(2)]}));
  addSh('شهري كل السنوات',['الشهر/السنة','المبيعات SAR','الفواتير'],monthAgg(records,'all').map(m=>[m.label,+m.total.toFixed(2),m.count]));
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
  const modeLabel=isTax?'بدون ضريبة':'شامل الضريبة';
  _printZone(
    _pzHeader('تحليل المبيعات الذكي',`السنة: ${y==='all'?'كل السنوات':y} — ${modeLabel}`)+
    _pzKpis([
      ['إجمالي المبيعات',money(data.reduce((s,r)=>s+val(r),0))],
      ['عدد الفواتير',fmt0(data.length)],
      ['أعلى شهر',(months.slice().sort((a,b)=>b.total-a.total)[0]||{}).label||'-'],
      ['وضع الضريبة',modeLabel]
    ])+
    '<div class="pz-section">المبيعات الشهرية</div>'+
    _pzTable(['الشهر','القيمة SAR','الفواتير','المتوسط SAR'],
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
  addSh('شهري',['الشهر','المبيعات SAR','الفواتير','المتوسط'],months.map(m=>[m.label,+m.total.toFixed(2),m.count,+m.avg.toFixed(2)]));
  addSh(smartExportT('customers','العملاء'),[smartExportT('customer','العميل'),smartExportT('salesSar','المبيعات SAR')],clients.map(([c,s])=>[c,+s.toFixed(2)]));
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
    _pzHeader('تحليل السيارات الذكي',`السنة: ${y==='all'?'كل السنوات':y}`)+
    _pzKpis([
      ['الإجمالي',money(total)],['عدد السيارات',fmt0(vans.length)],['الأفضل',vans[0]?vans[0][0]:'-']
    ])+
    '<div class="pz-section">أداء كل سيارة</div>'+
    _pzTable(['السيارة','المبيعات SAR','العمليات','المتوسط SAR','المساهمة %'],
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
  addSh('ملخص السيارات',['السيارة','المبيعات SAR','عدد العمليات','متوسط العملية SAR'],vans.map(([v,s])=>{const c=data.filter(r=>r.van===v).length;return[v,+s.toFixed(2),c,+(c?s/c:0).toFixed(2)]}));
  const vanNames=vans.map(([v])=>v);
  addSh('شهري لكل سيارة',['الشهر',...vanNames],months.map(m=>[m.label,...vanNames.map(v=>+data.filter(r=>r.van===v&&normalizeMonth(r.month,r.date)===m.month).reduce((s,r)=>s+parseNum(r.totalInc),0).toFixed(2))]));
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
    _pzHeader('تحليل العملاء','تصنيف العملاء وقيمتهم')+
    _pzKpis([
      ['إجمالي العملاء',fmt0(model.length)],
      ['VIP',fmt0(model.filter(c=>c.tier==='VIP').length)],
      ['نشط',fmt0(model.filter(c=>c.tier==='Active').length)],
      ['غير نشط',fmt0(model.filter(c=>c.tier==='At Risk'||c.tier==='Inactive').length)]
    ])+
    '<div class="pz-section">قائمة العملاء (أعلى 100)</div>'+
    _pzTable(['العميل','التصنيف','الإجمالي SAR','الزيارات','متوسط SAR','آخر زيارة'],rows)+
    _pzFooter()
  );
}
function exportCustomersExcel(){
  const model=typeof buildCustomerVisitModel==='function'?buildCustomerVisitModel(records):[];
  _toExcel('العملاء',
    ['العميل','التصنيف','الإجمالي SAR','الزيارات','متوسط SAR','آخر زيارة'],
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
    _pzHeader('تحليل الخدمات الذكي',`السنة: ${y==='all'?'كل السنوات':y}`)+
    _pzKpis([
      ['إجمالي',money(total)],['عدد الخدمات',fmt0(svcs.length)],
      ['الأعلى قيمة',svcs[0]?svcs[0][0]:'-'],['عدد العمليات',fmt0(data.length)]
    ])+
    '<div class="pz-section">الخدمات</div>'+
    _pzTable(['#','الخدمة','المبيعات SAR','العمليات','المتوسط SAR','المساهمة %'],
      svcs.map(([s,v],i)=>{const c=data.filter(r=>r.item===s).length;return[i+1,s,fmt(v),fmt0(c),fmt(c?v/c:0),(total?v/total*100:0).toFixed(2)+'%']}))+
    _pzFooter()
  );
}
function exportSmartServicesExcel(){
  const y=smartServicesYear==='all'?'all':(+smartServicesYear||defaultYear(records));
  const data=byYear(records,y);
  const svcs=Object.entries(groupSum(data,'item')).sort((a,b)=>b[1]-a[1]);
  const total=svcs.reduce((s,[,v])=>s+v,0);
  _toExcel('الخدمات',
    ['#','الخدمة','المبيعات SAR','عدد العمليات','متوسط SAR','المساهمة %'],
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
    body='<div class="pz-section">المبيعات الشهرية</div>'+
      _pzTable(['الشهر','المبيعات SAR','الفواتير','المتوسط SAR'],months.map(m=>[m.label,fmt(m.total),fmt0(m.count),fmt(m.avg)]));
  } else if(mode==='quarters'){
    body='<div class="pz-section">الأرباع</div>'+
      _pzTable(['الربع','المبيعات SAR','الفواتير'],qs.map(q=>[q,fmt(qSum(records,y,q)),fmt0(qCount(records,y,q))]));
  } else if(mode==='yoyq'){
    {const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; body='<div class="pz-section">مقارنة '+y1+' vs '+y2+'</div>'+
      _pzTable(['الربع',y1+' SAR',y2+' SAR','الفرق','النمو %'],qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q),d=b-a,g=a?d/a*100:0;return[q,fmt(a),fmt(b),(d>=0?'+':'')+fmt(d),g.toFixed(2)+'%']}));}
  } else if(mode==='payment'){
    const pays=Object.entries(groupSum(data,'pay')).sort((a,b)=>b[1]-a[1]);
    body='<div class="pz-section">طرق الدفع</div>'+
      _pzTable(['طريقة الدفع','المبيعات SAR','المساهمة %'],pays.map(([p,s])=>{const t=pays.reduce((x,[,v])=>x+v,0);return[p,fmt(s),(t?s/t*100:0).toFixed(2)+'%']}));
  }
  const modeNames={months:'شهري',quarters:'ربعي',yoyq:'مقارنة سنوية',payment:'طرق الدفع'};
  _printZone(
    _pzHeader('مركز التقارير المتقدمة',`الوضع: ${modeNames[mode]||mode} — السنة: ${y==='all'?'كل السنوات':y}`)+
    _pzKpis([
      ['الإجمالي',money(data.reduce((s,r)=>s+parseNum(r.totalInc),0))],
      ['الفواتير',fmt0(data.length)],
      ['النمو Q1',`${(()=>{const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; const a=qSum(records,y1,'Q1'),b=qSum(records,y2,'Q1');return a?(((b-a)/a)*100).toFixed(2)+'%':'—'})()}`]
    ])+body+_pzFooter()
  );
}
function exportAdvancedExcel(){
  const y=reportYear==='all'?'all':(+reportYear||defaultYear(records));
  const months=monthAgg(records,y);
  const qs=['Q1','Q2','Q3','Q4'];
  const wb=XLSX.utils.book_new();
  const addSh=(n,h,r)=>{const ws=XLSX.utils.aoa_to_sheet([h,...r]);ws['!cols']=h.map(()=>({wch:20}));XLSX.utils.book_append_sheet(wb,ws,n)};
  addSh('شهري',['الشهر','SAR','الفواتير','المتوسط'],months.map(m=>[m.label,+m.total.toFixed(2),m.count,+m.avg.toFixed(2)]));
  addSh('ربعي',['الربع','SAR','الفواتير'],qs.map(q=>[q,+qSum(records,y,q).toFixed(2),qCount(records,y,q)]));
  {const dy=reportQuarterDynamicYears(records), y1=dy.previous, y2=dy.current; addSh('YoY',['الربع',String(y1),String(y2),'الفرق','%'],qs.map(q=>{const a=qSum(records,y1,q),b=qSum(records,y2,q);return[q,+a.toFixed(2),+b.toFixed(2),+(b-a).toFixed(2),(a?((b-a)/a*100).toFixed(2)+'%':'—')]}));}
  addSh('الدفع',['طريقة الدفع','SAR'],Object.entries(groupSum(byYear(records,y),'pay')).sort((a,b)=>b[1]-a[1]).map(([p,s])=>[p,+s.toFixed(2)]));
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
