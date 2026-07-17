/* PETATOE v6.4.52 Phase G2 - Smart Reports New Customers Real Extraction.
   Extracted from smart-reports-core.js without changing formulas, filters, or rendered markup. */
(function(){
  function serviceDisplay(v){try{var center=window.PETATOE_LOCALIZATION_CENTER;var value=center&&typeof center.business==='function'?center.business('service',v):v;return typeof htmlSafe==='function'?htmlSafe(value):String(value==null?'':value);}catch(_){return typeof htmlSafe==='function'?htmlSafe(v):String(v==null?'':v);}}
  function buildSmartReportsNewCustomersState(ctx){
    const records=ctx.records||[];
    const data=ctx.data||[];
    const y=ctx.y;
    const analysisNow=ctx.analysisNow||new Date();
const smartEngine=window.PETATOESmartDataEngine||null;
const smartEngineCustomerRows=(smartEngine&&smartEngine.getCustomerRowsByName)?smartEngine.getCustomerRowsByName(records):null;
// New customers during selected month - ACCURACY FIX
// العميل الجديد = أول معاملة حقيقية للعميل في كل قاعدة البيانات، وليس أول ظهور داخل السنة المختارة فقط.
const allDatedCustomerRows=(smartEngine&&smartEngine.getDatedCustomerRows)?smartEngine.getDatedCustomerRows(records):records.filter(r=>{
  const d=smartDateValue(r);
  return d && (r.client||'').trim();
});
const latestInvoiceRowForNewCustomers=allDatedCustomerRows.slice().sort((a,b)=>{
  const da=smartDateValue(a), db=smartDateValue(b);
  if((+db||0)!==(+da||0)) return (+db||0)-(+da||0);
  return invoiceNumValue(b.invoice)-invoiceNumValue(a.invoice);
})[0]||null;
const latestInvoiceDateForNewCustomers=latestInvoiceRowForNewCustomers?smartDateValue(latestInvoiceRowForNewCustomers):null;
const latestInvoicePeriodForNewCustomers=latestInvoiceDateForNewCustomers
  ? `${latestInvoiceDateForNewCustomers.getFullYear()}-${String(latestInvoiceDateForNewCustomers.getMonth()+1).padStart(2,'0')}`
  : '';
const latestInvoiceYearForNewCustomers=latestInvoiceDateForNewCustomers?String(latestInvoiceDateForNewCustomers.getFullYear()):'all';
const newCustAvailableYears=getYearButtonList(records);
const availableYearStrings=newCustAvailableYears.map(String);
const smartSelectedYear=String(y)==='all'?'all':String(+y||'all');
const nowForNewCustomerDefault=new Date();
const currentNewCustomerYear=String(nowForNewCustomerDefault.getFullYear());
const currentNewCustomerPeriod=`${nowForNewCustomerDefault.getFullYear()}-${String(nowForNewCustomerDefault.getMonth()+1).padStart(2,'0')}`;
const allNewCustPeriods=((smartEngine&&smartEngine.getCustomerPeriods)?smartEngine.getCustomerPeriods(records):[...new Set(allDatedCustomerRows.map(r=>{
  const d=smartDateValue(r);
  return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : '';
}).filter(Boolean))]).sort();
if(!window.smartNewCustomerManualSelection){
  // PETATOE v6.4.164: initialize data state with the real current month before rendering,
  // not only the visual active button. This prevents the weekly chart from showing all/old months
  // until the user clicks the current-month button manually.
  window.smartNewCustomerYear=availableYearStrings.includes(currentNewCustomerYear)
    ? currentNewCustomerYear
    : (latestInvoiceYearForNewCustomers || (smartSelectedYear==='all'?'all':smartSelectedYear));
  const defaultYearPeriods=allNewCustPeriods.filter(k=>String(window.smartNewCustomerYear)==='all' || k.startsWith(String(window.smartNewCustomerYear)+'-'));
  window.smartNewCustomerPeriod=defaultYearPeriods.includes(currentNewCustomerPeriod)
    ? currentNewCustomerPeriod
    : (defaultYearPeriods.slice(-1)[0] || latestInvoicePeriodForNewCustomers || '');
}
if(!window.smartNewCustomerYear){
  window.smartNewCustomerYear=availableYearStrings.includes(currentNewCustomerYear)
    ? currentNewCustomerYear
    : (latestInvoiceYearForNewCustomers || smartSelectedYear);
}
if(String(window.smartNewCustomerYear)!=='all' && !availableYearStrings.includes(String(window.smartNewCustomerYear))){
  window.smartNewCustomerYear=latestInvoiceYearForNewCustomers || (smartSelectedYear==='all'?'all':String(newCustAvailableYears.includes(+smartSelectedYear)?smartSelectedYear:(newCustAvailableYears.slice(-1)[0]||'all')));
  window.smartNewCustomerPeriod='';
}
let newCustSelectedYear=String(window.smartNewCustomerYear||'all');
const newCustPeriods=allNewCustPeriods.filter(k=>newCustSelectedYear==='all' || k.startsWith(newCustSelectedYear+'-'));
const latestNewCustPeriod=newCustPeriods.slice(-1)[0] || latestInvoicePeriodForNewCustomers || '';
if(!window.smartNewCustomerPeriod || !newCustPeriods.includes(window.smartNewCustomerPeriod)){
  window.smartNewCustomerPeriod=(newCustPeriods.includes(currentNewCustomerPeriod) && !window.smartNewCustomerManualSelection)
    ? currentNewCustomerPeriod
    : latestNewCustPeriod;
}
const newCustPeriod=window.smartNewCustomerPeriod || latestNewCustPeriod;
const [newCustPeriodYearStr,newCustPeriodMonthStr]=(newCustPeriod||'').split('-');
const newCustYear=+(newCustPeriodYearStr||new Date().getFullYear());
const newCustMonthIdx=Math.max(0,(+(newCustPeriodMonthStr||1))-1);
const newCustMonth=MONTHS[newCustMonthIdx]||'jan';
const newCustPeriodLabel=`${(window.PETATOE_GLOBAL_SCREEN_TRANSLATOR&&window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName)?window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName(MAR[newCustMonth]||newCustMonth):(MAR[newCustMonth]||newCustMonth)} ${newCustYear}`;
const sameNewCustPeriod=(r)=>{
  const d=smartDateValue(r);
  return d && d.getFullYear()===newCustYear && d.getMonth()===newCustMonthIdx;
};
const newCustMonthRows=(smartEngine&&smartEngine.getRowsByPeriod)?smartEngine.getRowsByPeriod(records,newCustYear,newCustMonthIdx):records.filter(sameNewCustPeriod);

const allCustomerFirstMap=(smartEngine&&smartEngine.getCustomerFirstMap)?smartEngine.getCustomerFirstMap(records):{};
if(!(smartEngine&&smartEngine.getCustomerFirstMap)){
allDatedCustomerRows.slice().sort((a,b)=>{
  const da=smartDateValue(a), db=smartDateValue(b);
  if(+da!==+db) return da-db;
  return invoiceNumValue(a.invoice)-invoiceNumValue(b.invoice);
}).forEach(r=>{
  const c=(r.client||'غير محدد').trim();
  if(!allCustomerFirstMap[c]) allCustomerFirstMap[c]=r;
});
}
const newCustomerNames=Object.entries(allCustomerFirstMap).filter(([name,first])=>sameNewCustPeriod(first)).map(x=>x[0]);
const newCustomerSet=new Set(newCustomerNames);
const periodEnd=makeLocalDate(newCustYear,newCustMonthIdx+1,new Date(newCustYear,newCustMonthIdx+1,0).getDate());
periodEnd.setHours(23,59,59,999);
const analysisNowForNewCust=maxInvoiceDateForYear(records,newCustYear) || analysisNow;
const newCustomerRows=newCustomerNames.map(name=>{
  const rows=newCustMonthRows.filter(r=>(r.client||'غير محدد').trim()===name).slice().sort((a,b)=>{
    const da=smartDateValue(a), db=smartDateValue(b);
    if((+da||0)!==(+db||0)) return (+da||0)-(+db||0);
    return invoiceNumValue(a.invoice)-invoiceNumValue(b.invoice);
  });
  const first=allCustomerFirstMap[name]||rows[0]||{};
  const sortedAll=((smartEngineCustomerRows&&smartEngineCustomerRows[name])?smartEngineCustomerRows[name]:records.filter(r=>(r.client||'غير محدد').trim()===name)).filter(r=>smartDateValue(r)).slice().sort((a,b)=>{
    const da=smartDateValue(a), db=smartDateValue(b);
    if((+db||0)!==(+da||0)) return (+db||0)-(+da||0);
    return invoiceNumValue(b.invoice)-invoiceNumValue(a.invoice);
  });
  const last=sortedAll[0]||rows[rows.length-1]||first;
  const invoicesForClient=[...new Set(rows.map(r=>String(r.invoice||'').trim()).filter(Boolean))];
  const transCount=invoicesForClient.length || rows.length;
  const totalValue=rows.reduce((s,r)=>s+parseNum(r.totalInc),0);
  const avgValue=safeDiv(totalValue,transCount);
  const lastDate=smartDateValue(last), firstDate=smartDateValue(first);
  const daysSince=lastDate?Math.max(0,Math.floor((analysisNowForNewCust-lastDate)/(24*60*60*1000))):0;
  const repeatedAfterFirst=sortedAll.filter(r=>{
    const d=smartDateValue(r);
    const fd=firstDate;
    if(!d||!fd)return false;
    return (+d>+fd) || (String(r.invoice||'').trim() && String(r.invoice||'').trim()!==String(first.invoice||'').trim());
  }).length>0;
  let tier='Bronze';
  if(totalValue>=10000) tier='VIP';
  else if(totalValue>=5000) tier='Gold';
  else if(totalValue>=1000) tier='Silver';
  const topPay=Object.entries(groupSum(rows,'pay')).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-';
  const topService=Object.entries(groupSum(rows,'item')).sort((a,b)=>b[1]-a[1])[0]?.[0]||'-';
  return {name,rows,first,last,firstDate,lastDate,transCount,totalValue,avgValue,daysSince,repeatedAfterFirst,tier,topPay,topService};
}).sort((a,b)=>b.totalValue-a.totalValue);
const newCustomersTotal=newCustomerRows.reduce((s,x)=>s+x.totalValue,0);
const newCustomersCount=newCustomerRows.length;
const newCustomersAvg=safeDiv(newCustomersTotal,newCustomersCount);
const newCustomersRepeatCount=newCustomerRows.filter(x=>x.repeatedAfterFirst || x.transCount>1).length;
const newCustomersConversion=safeDiv(newCustomersRepeatCount,newCustomersCount)*100;
const topNewCustomer=newCustomerRows[0]||{name:'-',totalValue:0};
const newCustWeekRows=[1,2,3,4,5].map(w=>{
  const cnt=newCustomerRows.filter(x=>x.firstDate && (Math.floor((x.firstDate.getDate()-1)/7)+1)===w).length;
  return {w,label:'الأسبوع '+w,count:cnt};
});
const newCustTierRows=['VIP','Gold','Silver','Bronze'].map(t=>({tier:t,count:newCustomerRows.filter(x=>x.tier===t).length}));
const firstCustomerPeriodCounts=Object.values(allCustomerFirstMap).reduce((a,first)=>{
  const fd=smartDateValue(first);
  if(!fd)return a;
  const k=`${fd.getFullYear()}-${String(fd.getMonth()+1).padStart(2,'0')}`;
  a[k]=(a[k]||0)+1;
  return a;
},{});
const newCustTrendRows=(newCustSelectedYear==='all'?newCustPeriods:newCustPeriods.filter(k=>k.startsWith(newCustSelectedYear+'-'))).map(k=>{
  const [yy,mm]=k.split('-');
  const mi=(+mm)-1;
  return {period:k,label:`${(window.PETATOE_GLOBAL_SCREEN_TRANSLATOR&&window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName)?window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName(MAR[MONTHS[mi]]||MONTHS[mi]):(MAR[MONTHS[mi]]||MONTHS[mi])} ${yy}`,count:firstCustomerPeriodCounts[k]||0};
});
const newCustTableLimit=Math.max(10,+(window.smartNewCustomerTableLimit||10));
const newCustomerDisplayedRows=newCustomerRows.slice(0,newCustTableLimit);
function newCustomerTierMeta(x){
  const t=x.tier;
  const icon=t==='VIP'?'👑':t==='Gold'?'🥇':t==='Silver'?'⭐':'🥉';
  const cls=t==='VIP'?'vip':t==='Gold'?'gold':t==='Silver'?'silver':'bronze';
  const rules=t==='VIP'
    ? ['إجمالي المشتريات لا يقل عن SAR 10,000.00','عدد المعاملات: '+fmt0(x.transCount),'آخر معاملة خلال '+fmt0(x.daysSince)+' يوم']
    : t==='Gold'
    ? ['إجمالي المشتريات لا يقل عن SAR 5,000.00','عدد المعاملات: '+fmt0(x.transCount),'آخر معاملة خلال '+fmt0(x.daysSince)+' يوم']
    : t==='Silver'
    ? ['إجمالي المشتريات لا يقل عن SAR 1,000.00','عدد المعاملات: '+fmt0(x.transCount),'آخر معاملة خلال '+fmt0(x.daysSince)+' يوم']
    : ['إجمالي المشتريات أقل من SAR 1,000.00','عدد المعاملات: '+fmt0(x.transCount),'آخر معاملة خلال '+fmt0(x.daysSince)+' يوم'];
  return {t,icon,cls,rules};
}
const newCustomerTableRows=newCustomerDisplayedRows.map((x,i)=>{const tm=newCustomerTierMeta(x);return `
  <tr>
    <td>${i+1}</td><td>${x.name}</td><td>${fmtDateAr(x.firstDate)}</td><td>${String(x.first.invoice||'-')}</td>
    <td>${serviceDisplay(x.topService)}</td><td>${x.topPay}</td><td>${fmt0(x.transCount)}</td><td>${money(x.totalValue)}</td>
    <td>${money(x.avgValue)}</td><td>${fmtDateAr(x.lastDate)}</td><td>${fmt0(x.daysSince)}</td>
    <td class="new-cust-tier-cell"><span class="new-cust-tier-wrap"><span class="new-cust-tier-icon ${tm.cls}">${tm.icon}</span><span class="new-cust-tier-label">${tm.t}</span><span class="new-cust-tier-tooltip"><b>سبب التصنيف: ${tm.t}</b><span>العميل مصنف ضمن هذا التصنيف بناءً على:</span>${tm.rules.map(r=>`<span class="ok">✓ ${r}</span>`).join('')}<span>يتم حساب التصنيف من بيانات الشهر المختار فقط بدون تغيير أي قيم أصلية.</span></span></span></td>
  </tr>`}).join('') || '<tr><td colspan="12">لا يوجد عملاء جدد في هذا الشهر حسب أول معاملة مسجلة في كل قاعدة البيانات.</td></tr>';
const newCustomerMoreButton=newCustomerRows.length>newCustTableLimit
  ? `<div class="new-cust-table-footer"><button class="new-cust-more-btn" data-smart-action="new-customer-more" data-limit="${newCustTableLimit+10}" onclick="return window.petatoeSmartNewCustomerFilterClick ? window.petatoeSmartNewCustomerFilterClick(this,event) : true">${smartReportHtml('common.loadMore','اضغط لعرض المزيد ⌄')}</button><span>${smartReportHtml('common.showingCustomers','عرض {shown} من أصل {total} عميل',{shown:fmt0(Math.min(newCustTableLimit,newCustomerRows.length)),total:fmt0(newCustomerRows.length)})}</span></div>`
  : `<div class="new-cust-table-footer"><span>${smartReportHtml('common.shownCustomers','تم عرض {shown} من أصل {total} عميل',{shown:fmt0(newCustomerRows.length),total:fmt0(newCustomerRows.length)})}</span></div>`;
const newCustomerInactiveRows=newCustomerRows.filter(x=>!x.repeatedAfterFirst && x.transCount<=1).sort((a,b)=>b.daysSince-a.daysSince).slice(0,12).map((x,i)=>`
  <tr><td>${i+1}</td><td>${x.name}</td><td>${fmtDateAr(x.firstDate)}</td><td>${String(x.first.invoice||'-')}</td><td>${money(x.totalValue)}</td><td>${fmt0(x.daysSince)}</td><td>${serviceDisplay(x.topService)}</td></tr>`).join('') || '<tr><td colspan="7">لا يوجد عملاء جدد غير نشطين في الفترة المختارة.</td></tr>';
const newCustYearButtons=`<button class="new-cust-year-btn ${newCustSelectedYear==='all'?'active':''}" data-smart-action="new-customer-year" data-year="all" onclick="return window.petatoeSmartNewCustomerFilterClick ? window.petatoeSmartNewCustomerFilterClick(this,event) : true">كل السنوات</button>`+newCustAvailableYears.slice().sort((a,b)=>b-a).map(yy=>`<button class="new-cust-year-btn ${String(newCustSelectedYear)===String(yy)?'active':''}" data-smart-action="new-customer-year" data-year="${yy}" onclick="return window.petatoeSmartNewCustomerFilterClick ? window.petatoeSmartNewCustomerFilterClick(this,event) : true">${yy}</button>`).join('');
const newCustMonthButtons=newCustPeriods.map(k=>{
  const [yy,mm]=k.split('-');
  const mi=(+mm)-1;
  return `<button class="new-cust-month-btn ${newCustPeriod===k?'active':''}" data-smart-action="new-customer-period" data-period="${k}" onclick="return window.petatoeSmartNewCustomerFilterClick ? window.petatoeSmartNewCustomerFilterClick(this,event) : true">${(window.PETATOE_GLOBAL_SCREEN_TRANSLATOR&&window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName)?window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName(MAR[MONTHS[mi]]||MONTHS[mi]):(MAR[MONTHS[mi]]||MONTHS[mi])} ${yy}</button>`;
}).join('') || '<span class="pill">لا توجد شهور متاحة</span>';


    return {
      newCustSelectedYear,
      newCustPeriods,
      newCustPeriod,
      newCustPeriodLabel,
      newCustomerRows,
      newCustomersTotal,
      newCustomersCount,
      newCustomersAvg,
      newCustomersConversion,
      topNewCustomer,
      newCustWeekRows,
      newCustTrendRows,
      newCustomerTableRows,
      newCustomerMoreButton,
      newCustomerInactiveRows,
      newCustYearButtons,
      newCustMonthButtons
    };
  }

  window.buildSmartReportsNewCustomersState=buildSmartReportsNewCustomersState;
})();
