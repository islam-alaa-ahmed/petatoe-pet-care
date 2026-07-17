/* PETATOE v6.4.160 Phase 2 - Smart Reports Core extracted from index.html.
   Kept in global scope intentionally because existing inline handlers and legacy smart adapters call these functions by name. */


/* v6.4.48: Filter/vehicle-efficiency helpers moved to smart-reports-filters-real.js. */
/* v6.4.48: Export/PDF/Excel helpers moved to smart-reports-export-engine.js. */



function smartReportT(key, fallback, params){
  const fullKey='smartReportsSource.'+key;
  try{
    if(window.PETATOE_LOCALIZATION_CENTER&&typeof window.PETATOE_LOCALIZATION_CENTER.translate==='function'){
      const value=window.PETATOE_LOCALIZATION_CENTER.translate(fullKey,'');
      if(typeof value==='string'&&value.trim()&&value!==fullKey) return smartReportInterpolate(value,params);
    }
    if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.t==='function'){
      const value=window.PETATOE_I18N.t(fullKey,params||{});
      if(typeof value==='string'&&value.trim()&&value!==fullKey) return value;
    }
    const lang=(window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage)?window.PETATOE_I18N.getLanguage():(document.documentElement.lang||'ar');
    const pack=window.PETATOE_SMART_REPORTS_TRANSLATIONS;
    const packed=pack&&pack[lang]&&pack[lang][key];
    if(typeof packed==='string'&&packed.trim()) return smartReportInterpolate(packed,params);
    if(lang==='en'&&window.PETATOE_I18N&&typeof window.PETATOE_I18N.translateRuntime==='function'){
      const runtimeValue=window.PETATOE_I18N.translateRuntime(String(fallback==null?'':fallback));
      if(typeof runtimeValue==='string'&&runtimeValue!==fallback) return smartReportInterpolate(runtimeValue,params);
    }
  }catch(_){ }
  return smartReportInterpolate(String(fallback==null?'':fallback),params);
}
function smartReportInterpolate(value,params){
  let out=String(value==null?'':value);
  Object.keys(params||{}).forEach(k=>{out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});
  return out;
}
function smartReportHtml(key, fallback, params){
  return htmlSafe(smartReportT(key,fallback,params));
}

function smartSafeHTML(target, html, reason){
  const el=(typeof target==='string')?$(target):target;
  if(!el)return false;
  try{
    if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function'){
      return window.PETATOESafeRender.htmlTrusted(el,String(html==null?'':html),reason||'smart-reports-core trusted escaped template');
    }
  }catch(e){try{window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('smart/smart-reports-core.js smartSafeHTML',e);}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-core.js', _, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } } }
  el.textContent='';el.insertAdjacentHTML('beforeend',String(html==null?'':html));
  try{if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.applySubtree==='function')window.PETATOE_I18N.applySubtree(el);}catch(_){ }
  return true;
}

function renderSmartReports(){
  const __smartRenderPerfStart=(window.performance&&performance.now)?performance.now():Date.now();
  if(!$('smartReportsArea'))return;
  // Preserve the currently opened Smart Report tab when changing year or refreshing data
  const activeSmartBtn=document.querySelector('#smartTabs .smart-pill.active');
  const activeSmartSection=document.querySelector('.smart-tab-section.active[data-smart-section]');
  const preservedSmartTab=(activeSmartBtn&&activeSmartBtn.dataset.smartTab)||(activeSmartSection&&activeSmartSection.dataset.smartSection)||'overview';
  syncSmartGlobalFilterOptions();
  const y='all';
  let data=smartData();
  data=smartDataCutoff(data,y);
  data=smartApplyGlobalFilters(data);
  if(window.PETATOE_BUSINESS_DATA_I18N&&typeof window.PETATOE_BUSINESS_DATA_I18N.localizeRecord==='function'){
    data=data.map(function(row){return window.PETATOE_BUSINESS_DATA_I18N.localizeRecord(row);});
  }
  try{ if(window.PETATOESmartDataEngine) window.PETATOESmartDataEngine.buildSmartData(data||[]); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-core.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  if(!data.length){try{ if(window.__PETATOE_SMART_PERF__){ window.__PETATOE_SMART_PERF__.push({name:'SmartReports.fullRender.beforeDOM', ms:+(((window.performance&&performance.now)?performance.now():Date.now())-__smartRenderPerfStart).toFixed(2), at:Date.now(), records:data.length}); } }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-core.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  smartSafeHTML('smartReportsArea',`<div class="smart-empty">${smartReportHtml('empty.noData','لا توجد بيانات كافية لعرض التقارير الذكية. ارفع ملف Excel أو اختر سنة أخرى.')}</div>`,'smart empty state');return;}

  const total=data.reduce((s,r)=>s+parseNum(r.totalInc),0), count=data.length, avg=safeDiv(total,count);
  const smartEngineData=(window.PETATOESmartDataEngine&&window.PETATOESmartDataEngine.buildSmartData)?window.PETATOESmartDataEngine.buildSmartData(data):null;
  const smartEngineCustomerRows=(window.PETATOESmartDataEngine&&window.PETATOESmartDataEngine.getCustomerRowsByName)?window.PETATOESmartDataEngine.getCustomerRowsByName(data):null;
  const clients=[...new Set(data.map(r=>r.client).filter(Boolean))];
  const invoices=[...new Set(data.map(r=>r.invoice).filter(Boolean))];
  const serviceSum=(smartEngineData&&smartEngineData.indexes&&smartEngineData.indexes.services?smartEngineData.indexes.services.map(x=>[x.name,x.total]):Object.entries(groupSum(data,'item'))).filter(([name,val])=>String(name||'').trim() && String(name)!=='غير محدد').sort((a,b)=>b[1]-a[1]);
  const clientSum=(smartEngineData&&smartEngineData.indexes&&smartEngineData.indexes.customers?smartEngineData.indexes.customers.map(x=>[x.name,x.total]):Object.entries(groupSum(data,'client'))).sort((a,b)=>b[1]-a[1]);
  const vanSum=(smartEngineData&&smartEngineData.indexes&&smartEngineData.indexes.vehicles?smartEngineData.indexes.vehicles.map(x=>[x.name,x.total]):Object.entries(groupSum(data,'van'))).sort((a,b)=>b[1]-a[1]);
  const paySum=(smartEngineData&&smartEngineData.indexes&&smartEngineData.indexes.payments?smartEngineData.indexes.payments.map(x=>[x.name,x.total]):Object.entries(groupSum(data,'pay'))).sort((a,b)=>b[1]-a[1]);
  const topService=serviceSum[0]||['-',0], topClient=clientSum[0]||['-',0], topVan=vanSum[0]||['-',0], topPay=paySum[0]||['-',0];
  const dateRange=firstLastDates(data);
  const serviceTop5Share=safeDiv(serviceSum.slice(0,5).reduce((s,x)=>s+x[1],0),total)*100;
  const clientCounts=(smartEngineData&&smartEngineData.indexes&&smartEngineData.indexes.customers)?smartEngineData.indexes.customers.reduce((a,x)=>{a[x.name]=x.count||0;return a;},{}):groupCount(data,'client');
  const repeatClients=Object.values(clientCounts).filter(x=>x>1).length;
  const oneTimeClients=Object.values(clientCounts).filter(x=>x===1).length;
  const clientRetention=safeDiv(repeatClients,clients.length)*100;
  const dailyTotals=Object.entries(data.reduce((a,r)=>{let d=parseDate(r.date)||'غير محدد';a[d]=(a[d]||0)+parseNum(r.totalInc);return a},{})).sort((a,b)=>b[1]-a[1]);
  const bestDay=dailyTotals[0]||['-',0];
  const daysCount=[...new Set(data.map(r=>parseDate(r.date)).filter(Boolean))].length;
  const dailyAvg=safeDiv(total,daysCount);
  const smartEngineVehicleCounts=(smartEngineData&&smartEngineData.indexes&&smartEngineData.indexes.vehicles)?smartEngineData.indexes.vehicles.reduce((a,x)=>{a[x.name]=x.count||0;return a;},{}):null;
  const vanAvgRev=vanSum.map(v=>[v[0],v[1],smartEngineVehicleCounts?smartEngineVehicleCounts[v[0]]||0:data.filter(r=>(r.van||'غير محدد')===v[0]).length]).map(v=>[v[0],v[1],v[2],safeDiv(v[1],v[2])]).sort((a,b)=>b[3]-a[3]);
  const bestEffVan=vanAvgRev[0]||['-',0,0,0];

  // PETATOE v5.1.50: Smart Reports > Overview KPI cards have their own independent Year filter.
  // These values are used ONLY for the six top KPI cards; all other Smart Reports keep using `data` unchanged.
  const smartOverviewCardYears=getYearButtonList(data).filter(v=>v!=='all').map(Number).filter(Boolean).sort((a,b)=>b-a);
  const smartOverviewDefaultYear=smartOverviewCardYears[0] || defaultYear(data) || new Date().getFullYear();
  if(!window.smartOverviewCardsYear){
    window.smartOverviewCardsYear=smartOverviewDefaultYear;
  }
  const overviewCardsYearRaw=String(window.smartOverviewCardsYear);
  const overviewCardsYear=(overviewCardsYearRaw==='all')?'all':Number(window.smartOverviewCardsYear);
  if(overviewCardsYear!=='all' && !smartOverviewCardYears.includes(overviewCardsYear)){
    window.smartOverviewCardsYear=smartOverviewDefaultYear;
  }
  const overviewCardsSelected=String(window.smartOverviewCardsYear)==='all'?'all':Number(window.smartOverviewCardsYear);
  const overviewCardsYearLabel=overviewCardsSelected==='all'?smartReportT('filters.allYears','كل السنوات'):String(overviewCardsSelected);
  const overviewCardsData=overviewCardsSelected==='all'?data.slice():byYear(data,overviewCardsSelected);
  const overviewCardsYearOptions=[`<button type="button" class="smart-overview-card-year-btn ${overviewCardsSelected==='all'?'active':''}" data-smart-action="overview-year" data-year="all">${smartReportHtml('filters.allYears','كل السنوات')}</button>`]
    .concat(smartOverviewCardYears.map(yy=>`<button type="button" class="smart-overview-card-year-btn ${overviewCardsSelected===yy?'active':''}" data-smart-action="overview-year" data-year="${yy}">${yy}</button>`)).join('');
  const overviewCardsYearFilter=`<div class="smart-overview-card-year-filter"><span>${smartReportHtml('filters.year','السنة')}</span><div class="smart-overview-card-year-list">${overviewCardsYearOptions}</div></div>`;
  const cardTotal=overviewCardsData.reduce((s,r)=>s+parseNum(r.totalInc),0), cardCount=overviewCardsData.length, cardAvg=safeDiv(cardTotal,cardCount);
  const cardClients=[...new Set(overviewCardsData.map(r=>r.client).filter(Boolean))];
  const cardInvoices=[...new Set(overviewCardsData.map(r=>r.invoice).filter(Boolean))];
  const cardServiceSum=Object.entries(groupSum(overviewCardsData,'item')).sort((a,b)=>b[1]-a[1]);
  const cardClientSum=Object.entries(groupSum(overviewCardsData,'client')).sort((a,b)=>b[1]-a[1]);
  const cardVanSum=Object.entries(groupSum(overviewCardsData,'van')).sort((a,b)=>b[1]-a[1]);
  const cardTopService=cardServiceSum[0]||['-',0];
  const cardDateRange=firstLastDates(overviewCardsData);
  const cardServiceTop5Share=safeDiv(cardServiceSum.slice(0,5).reduce((s,x)=>s+x[1],0),cardTotal)*100;
  const cardClientCounts=groupCount(overviewCardsData,'client');
  const cardRepeatClients=Object.values(cardClientCounts).filter(x=>x>1).length;
  const cardOneTimeClients=Object.values(cardClientCounts).filter(x=>x===1).length;
  const cardClientRetention=safeDiv(cardRepeatClients,cardClients.length)*100;
  const cardDaysCount=[...new Set(overviewCardsData.map(r=>parseDate(r.date)).filter(Boolean))].length;
  const cardDailyAvg=safeDiv(cardTotal,cardDaysCount);
  const cardVehicleCounts=groupCount(overviewCardsData,'van');
  const cardVanAvgRev=cardVanSum.map(v=>[v[0],v[1],cardVehicleCounts[v[0]]||0]).map(v=>[v[0],v[1],v[2],safeDiv(v[1],v[2])]).sort((a,b)=>b[3]-a[3]);
  const cardBestEffVan=cardVanAvgRev[0]||['-',0,0,0];

  // Shared monthly / forecast values must be calculated before any Sales Intelligence blocks use them
  const monthly=MONTHS.map((m,idx)=>{
    const rows=data.filter(r=>normalizeMonth(r.month,r.date)===m);
    const sales=rows.reduce((s,r)=>s+parseNum(r.totalInc),0);
    return {m,idx,sales,count:rows.length,avg:safeDiv(sales,rows.length)};
  });
  const actualMonths=monthly.filter(x=>x.sales>0);
  const lastActual=actualMonths.length?actualMonths[actualMonths.length-1].idx:-1;
  const runRate=safeDiv(actualMonths.reduce((s,x)=>s+x.sales,0),actualMonths.length||1);
  const forecast=monthly.map(x=> x.idx<=lastActual ? x.sales : runRate);
  const aiForecast=buildPetatoeAIForecast(monthly,data,lastActual);
  window.petatoeAIForecastState=aiForecast;
  const aiModelCards=(aiForecast.models||[]).map((m,i)=>`<div class="ai-model-card ${i===0?'active':''}"><b>${i===0?'✅ ':''}${htmlSafe(m.displayName||m.name)}</b><span>${htmlSafe(m.desc)}</span><span>${smartReportHtml('labels.estimatedError','خطأ تقديري')}: ${Math.round((m.error||0)*100)}%</span></div>`).join('');
  const aiServiceRiskRows=(aiForecast.serviceRisk||[]).map(x=>`<div class="ai-risk-row"><div><strong>${htmlSafe(x.name)}</strong><small>${smartReportHtml('labels.estimatedDecline','تراجع تقديري')} ${fmt(Math.abs(x.change))}%</small></div><span class="risk-pill bad">${smartReportHtml('status.declineRisk','خطر هبوط')}</span></div>`).join('')||`<div class="ai-risk-row"><div><strong>${smartReportHtml('empty.noCriticalServices','لا توجد خدمات حرجة')}</strong><small>${smartReportHtml('empty.noClearServiceDecline','لم يظهر هبوط واضح في الخدمات الحالية')}</small></div><span class="risk-pill good">${smartReportHtml('status.reassuring','مطمئن')}</span></div>`;
  const aiServiceGrowthRows=(aiForecast.serviceGrowth||[]).map(x=>`<div class="ai-risk-row"><div><strong>${htmlSafe(x.name)}</strong><small>${smartReportHtml('labels.estimatedGrowth','نمو تقديري')} ${fmt(x.change)}%</small></div><span class="risk-pill good">${smartReportHtml('status.growthCandidate','مرشحة للنمو')}</span></div>`).join('')||`<div class="ai-risk-row"><div><strong>${smartReportHtml('empty.noExceptionalGrowth','لا يوجد نمو استثنائي')}</strong><small>${smartReportHtml('empty.balancedActivity','النشاط موزع بشكل متوازن')}</small></div><span class="risk-pill info">${smartReportHtml('status.neutral','محايد')}</span></div>`;
  const aiCustomerRiskRows=(aiForecast.customerRisk||[]).map(x=>`<div class="ai-risk-row" data-name="${htmlSafe(x.name)}" data-smart-action="open-customer360"><div><strong>${htmlSafe(x.name)}</strong><small>${fmt0(x.days)} ${smartReportHtml('labels.daysAbsent','يوم غياب')} — ${money(x.total)}</small></div><span class="risk-pill bad">${smartReportHtml('status.customerAtRisk','عميل معرض')}</span></div>`).join('')||`<div class="ai-risk-row"><div><strong>${smartReportHtml('empty.noCustomerRisks','لا توجد مخاطر عملاء واضحة')}</strong><small>${smartReportHtml('empty.noDormantMajorCustomers','لا يوجد عملاء كبار متوقفون لفترة طويلة')}</small></div><span class="risk-pill good">${smartReportHtml('status.reassuring','مطمئن')}</span></div>`;
  const analysisNow=String(y)==='all'
    ? (data.map(r=>smartDateValue(r)).filter(Boolean).sort((a,b)=>b-a)[0] || new Date())
    : (maxInvoiceDateForYear(records,y) || data.map(r=>smartDateValue(r)).filter(Boolean).sort((a,b)=>b-a)[0] || new Date());

  const smartNewCustomerState=window.buildSmartReportsNewCustomersState
    ? window.buildSmartReportsNewCustomersState({records,data,y,analysisNow})
    : {};
  const {
    newCustPeriodLabel='',
    newCustomerRows=[],
    newCustomersTotal=0,
    newCustomersCount=0,
    newCustomersAvg=0,
    newCustomersConversion=0,
    topNewCustomer={name:'-',totalValue:0},
    newCustWeekRows=[],
    newCustTrendRows=[],
    newCustomerTableRows='',
    newCustomerMoreButton='',
    newCustomerInactiveRows='',
    newCustYearButtons='',
    newCustMonthButtons=''
  }=smartNewCustomerState;

  // Sales Intelligence Center data - append-only, based only on original uploaded/input columns
  const salesTaxTotal=data.reduce((s,r)=>s+parseNum(r.tax),0);
  const salesNetTotal=data.reduce((s,r)=>s+parseNum(r.totalEx),0);
  const salesBuyerCount=clients.length;
  const salesGrowthBaseData=String(y)==='all'?[]:smartDataCutoff(smartData(), String((+y||0)-1));
  const salesPrevTotal=salesGrowthBaseData.reduce((s,r)=>s+parseNum(r.totalInc),0);
  const salesGrowthPct=salesPrevTotal?safeDiv(total-salesPrevTotal,salesPrevTotal)*100:0;
  const salesMonthsActive=monthly.filter(x=>x.sales>0);
  const salesLastMonth=salesMonthsActive[salesMonthsActive.length-1]||{m:'-',sales:0,count:0,avg:0};
  const salesPrevMonth=salesMonthsActive[salesMonthsActive.length-2]||{m:'-',sales:0,count:0,avg:0};
  const salesMonthDiff=salesLastMonth.sales-salesPrevMonth.sales;
  const salesMonthDiffPct=salesPrevMonth.sales?safeDiv(salesMonthDiff,salesPrevMonth.sales)*100:0;
  // مقارنة شهر بشهر: Rolling آخر 5 شهور حسب آخر شهر فعلي موجود في كل البيانات، ولا تعتمد على فلتر السنة.
  const salesComparisonSource=(smartDataCutoff(smartData(),'all')||[]).filter(r=>smartDateValue(r));
  const salesComparisonMonthMap=salesComparisonSource.reduce((a,r)=>{
    const d=smartDateValue(r);
    if(!d)return a;
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if(!a[key])a[key]={key,year:d.getFullYear(),monthIndex:d.getMonth(),sales:0,count:0};
    a[key].sales+=salesIntelMonthCompareValue(r);
    a[key].count+=1;
    return a;
  },{});
  function petatoeMonthKeyFromDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function petatoeShiftMonthKey(key,offset){
    const parts=String(key||'').split('-');
    const d=makeLocalDate(+parts[0]||2000,+parts[1]||1,1);
    d.setMonth(d.getMonth()+offset);
    return petatoeMonthKeyFromDate(d);
  }
  function petatoeMonthYearLabel(key){
    const parts=String(key||'').split('-');
    const yy=+parts[0]||'';
    const mi=(+parts[1]||1)-1;
    return `${MAR[MONTHS[mi]]||parts[1]} ${yy}`;
  }
  const salesComparisonLatestKey=Object.keys(salesComparisonMonthMap).sort().slice(-1)[0]||'';
  const salesComparisonKeys=salesComparisonLatestKey?[4,3,2,1,0].map(back=>petatoeShiftMonthKey(salesComparisonLatestKey,-back)):[];
  const salesComparisonRows=salesComparisonKeys.map(k=>{
    const cur=salesComparisonMonthMap[k]||{key:k,year:+String(k).split('-')[0],monthIndex:(+String(k).split('-')[1]||1)-1,sales:0,count:0};
    const prevKey=petatoeShiftMonthKey(k,-1);
    const prev=salesComparisonMonthMap[prevKey]||{key:prevKey,sales:0,count:0};
    const diff=cur.sales-prev.sales;
    return {
      key:k,
      previousKey:prevKey,
      label:[MAR[MONTHS[cur.monthIndex]]||String(k),String(cur.year||'')],
      tableLabel:petatoeMonthYearLabel(k),
      currentSubLabel:petatoeMonthYearLabel(k),
      previousSubLabel:petatoeMonthYearLabel(prevKey),
      current:cur.sales,
      previous:prev.sales,
      diff,
      pct:prev.sales?safeDiv(diff,prev.sales)*100:0,
      count:cur.count,
      avg:safeDiv(cur.sales,cur.count)
    };
  });
  const salesYearRows=records.slice(); // مهم: مقارنة سنة بسنة تقرأ كل السنوات من البيانات الأصلية، وليس السنة المختارة فقط في فلتر التقارير الذكية
  const salesAvailableYears=[...new Set(salesYearRows.map(r=>getYear(r)).filter(Boolean))].sort((a,b)=>a-b);
  const salesCalendarYear=new Date().getFullYear();
  const salesLatestYear=salesAvailableYears.slice(-1)[0]||(+y||defaultYear(records));
  if(!window.salesYoYSelectedYear || !salesAvailableYears.includes(+window.salesYoYSelectedYear)){
    window.salesYoYSelectedYear=salesAvailableYears.includes(salesCalendarYear)?salesCalendarYear:salesLatestYear;
  }
  window.salesYoYSelectedYear=+window.salesYoYSelectedYear;
  const salesYoYCustomMode=!!window.salesYoYCustomMode;
  const defaultBaseYear=salesAvailableYears.includes(window.salesYoYSelectedYear-1)?window.salesYoYSelectedYear-1:(salesAvailableYears.filter(yr=>yr<window.salesYoYSelectedYear).slice(-1)[0]||window.salesYoYSelectedYear);
  if(!window.salesYoYBaseYear || !salesAvailableYears.includes(+window.salesYoYBaseYear)){
    window.salesYoYBaseYear=defaultBaseYear;
  }
  if(!window.salesYoYCompareYear || !salesAvailableYears.includes(+window.salesYoYCompareYear)){
    window.salesYoYCompareYear=window.salesYoYSelectedYear;
  }
  window.salesYoYBaseYear=+window.salesYoYBaseYear;
  window.salesYoYCompareYear=+window.salesYoYCompareYear;
  if(window.salesYoYCustomJustToggled){
    if(window.salesYoYCustomMode){
      window.salesYoYCompareYear=window.salesYoYSelectedYear;
      window.salesYoYBaseYear=defaultBaseYear;
    }
    window.salesYoYCustomJustToggled=false;
  }
  const salesCurrentYear=salesYoYCustomMode?window.salesYoYCompareYear:window.salesYoYSelectedYear;
  const salesPrevYear=salesYoYCustomMode?window.salesYoYBaseYear:defaultBaseYear;
  const salesYoYMonths=MONTHS.map((m,idx)=>({m,cur:salesYearRows.filter(r=>getYear(r)===salesCurrentYear&&normalizeMonth(r.month,r.date)===m).reduce((s,r)=>s+parseNum(r.totalInc),0),prev:salesYearRows.filter(r=>getYear(r)===salesPrevYear&&normalizeMonth(r.month,r.date)===m).reduce((s,r)=>s+parseNum(r.totalInc),0)}));
  const salesYoYYearButtons=salesAvailableYears.map(yr=>`<button class="yoy-year-btn ${!salesYoYCustomMode && salesCurrentYear===yr?'active':''}" data-smart-action="sales-yoy-year" data-year="${yr}" data-base="${salesAvailableYears.includes(yr-1)?yr-1:(salesAvailableYears.filter(y=>y<yr).slice(-1)[0]||yr)}">📅 ${yr}</button>`).join('');
  const salesYoYOptions=salesAvailableYears.map(yr=>`<option value="${yr}">${yr}</option>`).join('');
  const salesPaymentRows=paySum.map(([name,val])=>({name,value:val,pct:safeDiv(val,total)*100})).sort((a,b)=>b.value-a.value);
  const smartEngineServiceCounts=(smartEngineData&&smartEngineData.indexes&&smartEngineData.indexes.services)?smartEngineData.indexes.services.reduce((a,x)=>{a[x.name]=x.count||0;return a;},{}):null;
  const salesServiceRows=serviceSum.slice(0,8).map(([name,val])=>({name,value:val,count:smartEngineServiceCounts?smartEngineServiceCounts[name]||0:data.filter(r=>(r.item||'غير محدد')===name).length,pct:safeDiv(val,total)*100}));
  const salesAtRiskRows=clientSum.map(([name,val])=>{const rows=((smartEngineCustomerRows&&smartEngineCustomerRows[name])?smartEngineCustomerRows[name]:data.filter(r=>(r.client||'غير محدد')===name)).slice().sort((a,b)=>(smartDateValue(b)?+smartDateValue(b):0)-(smartDateValue(a)?+smartDateValue(a):0));const last=smartDateValue(rows[0]||{});const days=last?Math.max(0,Math.floor((analysisNow-last)/(24*60*60*1000))):999;const invoices=[...new Set(rows.map(r=>String(r.invoice||'').trim()).filter(Boolean))];const vans=[...new Set(rows.map(r=>String(r.van||'غير محدد').trim()||'غير محدد'))];const pays=[...new Set(rows.map(r=>String(r.pay||'غير محدد').trim()||'غير محدد'))];return {name,value:val,visits:rows.length,invoices:invoices.length,last,days,vans:vans.join('، '),pays:pays.join('، ')};}).filter(x=>x.days>60).sort((a,b)=>b.days-a.days||b.value-a.value);
  window.smartAtRiskLimit=window.smartAtRiskLimit||10;
  window.PETATOEAtRiskClients=salesAtRiskRows;
  const newReturningClientRows=Object.entries(clientCounts).map(([name,cnt])=>{
    const rows=((smartEngineCustomerRows&&smartEngineCustomerRows[name])?smartEngineCustomerRows[name]:data.filter(r=>(r.client||'غير محدد')===name));
    const sorted=rows.slice().sort((a,b)=>(smartDateValue(a)?+smartDateValue(a):0)-(smartDateValue(b)?+smartDateValue(b):0));
    const first=smartDateValue(sorted[0]||{});
    const last=smartDateValue(sorted[sorted.length-1]||{});
    const totalValue=rows.reduce((s,r)=>s+parseNum(r.totalInc),0);
    const invoices=[...new Set(rows.map(r=>String(r.invoice||'').trim()).filter(Boolean))];
    const vans=[...new Set(rows.map(r=>String(r.van||'غير محدد').trim()||'غير محدد'))];
    const pays=[...new Set(rows.map(r=>String(r.pay||'غير محدد').trim()||'غير محدد'))];
    return {name,operations:cnt,invoices:invoices.length,totalValue,first,last,lastInvoice:String((sorted[sorted.length-1]||{}).invoice||'—'),vans:vans.join('، '),pays:pays.join('، ')};
  }).sort((a,b)=>b.operations-a.operations||b.totalValue-a.totalValue||String(a.name).localeCompare(String(b.name),'ar'));
  const oneTimeClientRows=newReturningClientRows.filter(x=>x.operations===1);
  const repeatClientRows=newReturningClientRows.filter(x=>x.operations>1);
  const salesNewReturning={new:oneTimeClientRows.length,returning:repeatClientRows.length};
  window.PETATOENewReturningDetails={oneTime:oneTimeClientRows,returning:repeatClientRows,updatedAt:new Date().toISOString()};
  // Monthly target report - editable and saved per month/year through Supabase system_settings.
  const salesTargetYears=getYearButtonList(records);
  const salesTargetDatedRows=records.filter(r=>smartDateValue(r)).slice().sort((a,b)=>+smartDateValue(b)-+smartDateValue(a));
  const salesTargetLatestDate=salesTargetDatedRows.length?smartDateValue(salesTargetDatedRows[0]):null;
  const salesTargetLatestYear=salesTargetLatestDate?salesTargetLatestDate.getFullYear():(salesTargetYears.slice(-1)[0] || new Date().getFullYear());
  const salesTargetLatestMonthIdx=salesTargetLatestDate?salesTargetLatestDate.getMonth():new Date().getMonth();
  const salesTargetLatestPeriod=`${salesTargetLatestYear}-${String(salesTargetLatestMonthIdx+1).padStart(2,'0')}`;
  const salesTargetDefaultYear=salesTargetLatestYear;
  // PETATOE v5.1.49: Monthly target gauge defaults to latest real data month, but year buttons stay manual.
  // If the user clicks a year, choose the latest month that has data inside that selected year.
  if(!window.smartTargetManualSelection){
    window.smartTargetYear=salesTargetDefaultYear;
    window.smartTargetPeriod=salesTargetLatestPeriod;
  }
  if(!window.smartTargetYear || !salesTargetYears.includes(+window.smartTargetYear)){
    window.smartTargetYear=salesTargetYears.includes(salesTargetDefaultYear)?salesTargetDefaultYear:salesTargetLatestYear;
    window.smartTargetPeriod=salesTargetLatestPeriod;
    window.smartTargetManualSelection=false;
  }
  window.smartTargetYear=+window.smartTargetYear;
  const targetYearRows=records.filter(r=>getYear(r)===window.smartTargetYear && smartDateValue(r));
  const targetMonthsWithData=[...new Set(targetYearRows.map(r=>smartDateValue(r).getMonth()))].sort((a,b)=>a-b);
  const targetDefaultMonth=(targetMonthsWithData.length?targetMonthsWithData[targetMonthsWithData.length-1]:(window.smartTargetYear===salesTargetLatestYear?salesTargetLatestMonthIdx:new Date().getMonth()));
  const targetAllPeriods=MONTHS.map((m,idx)=>`${window.smartTargetYear}-${String(idx+1).padStart(2,'0')}`);
  if(!window.smartTargetPeriod || !targetAllPeriods.includes(window.smartTargetPeriod)){
    window.smartTargetPeriod=`${window.smartTargetYear}-${String(targetDefaultMonth+1).padStart(2,'0')}`;
  }
  const salesTargetPeriod=window.smartTargetPeriod;
  const [salesTargetYearStr,salesTargetMonthStr]=salesTargetPeriod.split('-');
  const salesTargetYear=+salesTargetYearStr;
  const salesTargetMonthIdx=(+salesTargetMonthStr)-1;
  const salesTargetMonthName=MONTHS[salesTargetMonthIdx] || 'jan';
  const salesTargetRows=records.filter(r=>getYear(r)===salesTargetYear && normalizeMonth(r.month,r.date)===salesTargetMonthName);
  const salesTargetActual=salesTargetRows.reduce((s,r)=>s+parseNum(r.totalInc),0);
  const salesTargetTransactions=salesTargetRows.length;
  const salesTargetClients=new Set(salesTargetRows.map(r=>r.client).filter(Boolean)).size;
  const salesTargetAvg=safeDiv(salesTargetActual,salesTargetTransactions);
  let salesTargetStore=(typeof readSmartTargetStore==='function'?readSmartTargetStore():{rules:[],explicit:{}});
  const salesTarget=getSmartMonthlyTarget(salesTargetPeriod);
  const salesTargetPct=salesTarget?safeDiv(salesTargetActual,salesTarget)*100:0;
  const salesTargetGaugePct=Math.max(0,Math.min(100,salesTargetPct||0));
  const salesTargetNeedleAngle=(salesTargetGaugePct/100)*Math.PI;
  const salesTargetNeedleX=(160 - 86*Math.cos(salesTargetNeedleAngle)).toFixed(1);
  const salesTargetNeedleY=(150 - 86*Math.sin(salesTargetNeedleAngle)).toFixed(1);
  const salesTargetRemaining=Math.max(0,salesTarget-salesTargetActual);
  const salesTargetOver=Math.max(0,salesTargetActual-salesTarget);
  const salesTargetStatus=!salesTarget?smartReportT('status.notSpecified','غير محدد'):(salesTargetActual>=salesTarget?smartReportT('status.targetAchieved','تم تحقيق الهدف'):smartReportT('status.targetNotAchieved','لم يكتمل الهدف'));
  const salesTargetYearButtons=salesTargetYears.map(yy=>`<button type="button" class="sales-target-year-btn ${Number(window.smartTargetYear)===Number(yy)?'active':''}" data-smart-action="target-year" data-year="${Number(yy)}">${yy}</button>`).join('');
  const salesTargetMonthButtons=MONTHS.map((m,idx)=>{const key=`${window.smartTargetYear}-${String(idx+1).padStart(2,'0')}`;const hasData=targetMonthsWithData.includes(idx);return `<button type="button" class="sales-target-month-btn ${salesTargetPeriod===key?'active':''} ${hasData?'has-data':'no-data'}" data-smart-action="target-period" data-period="${key}">${smartReportHtml('calendar.months.'+m,MAR[m])} ${window.smartTargetYear}</button>`;}).join('');
  const salesForecastNext=runRate;
  const salesForecastQuarter=runRate*3;
  const salesForecastYearEnd=total + Math.max(0,12-(lastActual+1))*runRate;
  const alertDetailBox=(label,value)=>`<div class="tip-box"><small>${label}</small><strong>${value}</strong></div>`;
  const salesAlerts=[];
  const lastMonthLabel=salesLastMonth.m&&salesLastMonth.m!=='-'?smartReportT('calendar.months.'+salesLastMonth.m,MAR[salesLastMonth.m]):smartReportT('alerts.lastActiveMonth','آخر شهر نشط');
  const prevMonthLabel=salesPrevMonth.m&&salesPrevMonth.m!=='-'?smartReportT('calendar.months.'+salesPrevMonth.m,MAR[salesPrevMonth.m]):smartReportT('alerts.previousMonth','الشهر السابق');
  const monthTrendDetail=`<b>${smartReportHtml('alerts.monthTrendDetails','تفاصيل تغير المبيعات الشهرية')}</b><div class="tip-grid">${alertDetailBox(smartReportHtml('alerts.currentMonth','الشهر الحالي'),lastMonthLabel)}${alertDetailBox(smartReportHtml('alerts.currentMonthSales','مبيعات الشهر الحالي'),money(salesLastMonth.sales||0))}${alertDetailBox(smartReportHtml('alerts.previousMonth','الشهر السابق'),prevMonthLabel)}${alertDetailBox(smartReportHtml('alerts.previousMonthSales','مبيعات الشهر السابق'),money(salesPrevMonth.sales||0))}${alertDetailBox(smartReportHtml('table.difference','الفرق'),`${salesMonthDiff>=0?'+':'-'} ${money(Math.abs(salesMonthDiff))}`)}${alertDetailBox(smartReportHtml('alerts.changeRate','نسبة التغير'),`${salesMonthDiffPct.toFixed(1)}%`)}</div><span class="${salesMonthDiff>=0?'ok':'badline'}">${salesMonthDiff>=0?smartReportHtml('alerts.monthImproved','✓ يوجد تحسن عن الشهر السابق.'):smartReportHtml('alerts.monthDeclined','⚠ يوجد انخفاض عن الشهر السابق ويحتاج مراجعة.')}</span><span>${smartReportHtml('alerts.monthRecommendation','التوصية: راجع العملاء غير النشطين، الخدمات الأقل حركة، وأداء السيارات خلال الشهر الحالي مقارنة بالشهر السابق.')}</span>`;
  salesAlerts.push({type:salesMonthDiff>=0?'good':'bad',text:smartReportT(salesMonthDiff>=0?'alerts.monthIncreaseText':'alerts.monthDecreaseText',salesMonthDiff>=0?'ارتفاع آخر شهر نشط عن الشهر السابق بقيمة {value} ({percent}%).':'انخفاض آخر شهر نشط عن الشهر السابق بقيمة {value} ({percent}%).',{value:money(Math.abs(salesMonthDiff)),percent:salesMonthDiffPct.toFixed(1)}),detail:monthTrendDetail});
  if(bestEffVan[0]&&bestEffVan[0]!=='-'){
    const vanRank=vanAvgRev.findIndex(v=>v[0]===bestEffVan[0])+1;
    const vanDetail=`<b>${smartReportHtml('alerts.vehicleEfficiencyDetails','تفاصيل كفاءة السيارة')}</b><div class="tip-grid">${alertDetailBox(smartReportHtml('table.vehicle','السيارة'),htmlSafe(bestEffVan[0]))}${alertDetailBox(smartReportHtml('table.rank','الترتيب'),`#${fmt0(vanRank||1)} ${smartReportHtml('common.of','من')} ${fmt0(vanAvgRev.length)}`)}${alertDetailBox(smartReportHtml('overview.totalSales','إجمالي المبيعات'),money(bestEffVan[1]||0))}${alertDetailBox(smartReportHtml('table.operationsCount','عدد العمليات'),fmt0(bestEffVan[2]||0))}${alertDetailBox(smartReportHtml('table.averageTransaction','متوسط العملية'),money(bestEffVan[3]||0))}${alertDetailBox(smartReportHtml('table.contribution','المساهمة'),safeDiv(bestEffVan[1]||0,total).toLocaleString('en-US',{style:'percent',maximumFractionDigits:1}))}</div><span class="ok">${smartReportHtml('alerts.vehicleSelectionReason','✓ تم اختيار السيارة بناءً على أعلى متوسط إيراد لكل عملية.')}</span><span>${smartReportHtml('alerts.vehicleRecommendation','التوصية: استخدم نمط تشغيل هذه السيارة كمرجع لباقي السيارات الأقل كفاءة.')}</span>`;
    salesAlerts.push({type:'good',text:smartReportT('alerts.bestVehicleText','السيارة الأعلى كفاءة هي {vehicle} بمتوسط {average} لكل عملية.',{vehicle:bestEffVan[0],average:money(bestEffVan[3]||0)}),detail:vanDetail});
  }
  if(salesAtRiskRows.length){
    const riskRows=salesAtRiskRows.slice(0,8).map((r,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(r.name)}</td><td>${r.last?fmtDateAr(r.last):'—'}</td><td>${fmt0(r.days)} ${smartReportHtml('units.day','يوم')}</td><td>${money(r.value)}</td></tr>`).join('');
    const riskDetail=`<b>${smartReportHtml('alerts.inactiveHighValueDetails','تفاصيل العملاء الكبار غير النشطين')}</b><div class="tip-grid">${alertDetailBox(smartReportHtml('overview.customersCount','عدد العملاء'),fmt0(salesAtRiskRows.length))}${alertDetailBox(smartReportHtml('alerts.inclusionRule','شرط الإدراج'),smartReportHtml('alerts.moreThan60Days','أكثر من 60 يوم'))}${alertDetailBox(smartReportHtml('alerts.longestAbsence','أعلى مدة غياب'),fmt0(Math.max(...salesAtRiskRows.map(r=>r.days)))+' '+smartReportHtml('units.day','يوم'))}${alertDetailBox(smartReportHtml('alerts.totalSpending','إجمالي إنفاقهم'),money(salesAtRiskRows.reduce((sum,r)=>sum+(r.value||0),0)))}</div><span>${smartReportHtml('alerts.topAtRiskCustomers','أعلى العملاء المعرضين للفقد:')}</span><div class="sales-alert-risk-table-wrap"><table class="sales-alert-risk-table"><thead><tr><th>#</th><th>${smartReportHtml('table.customer','العميل')}</th><th>${smartReportHtml('table.lastVisit','آخر زيارة')}</th><th>${smartReportHtml('alerts.absenceDays','أيام الغياب')}</th><th>${smartReportHtml('alerts.totalSpending','إجمالي الإنفاق')}</th></tr></thead><tbody>${riskRows}</tbody></table></div><span class="ok">${smartReportHtml('alerts.atRiskRecommendation','✓ الأفضل مراجعة تقرير العملاء غير النشطين وفرص الاسترجاع وترتيب المتابعة حسب أعلى إنفاق وأطول غياب.')}</span>`;
    salesAlerts.push({type:'warn',text:smartReportT('alerts.atRiskCountText','يوجد {count} عميل من كبار العملاء لم يزوروا منذ أكثر من 60 يوم.',{count:fmt0(salesAtRiskRows.length)}),detail:riskDetail});
  }
  if(topService[0]&&topService[0]!=='-'){
    const topServiceOps=data.filter(r=>(r.item||'غير محدد')===topService[0]).length;
    const topServiceAvg=safeDiv(topService[1]||0,topServiceOps);
    const topServiceDetail=`<b>${smartReportHtml('alerts.topServiceDetails','تفاصيل أعلى خدمة قيمة')}</b><div class="tip-grid">${alertDetailBox(smartReportHtml('table.service','الخدمة'),htmlSafe(topService[0]))}${alertDetailBox(smartReportHtml('overview.totalSales','إجمالي المبيعات'),money(topService[1]||0))}${alertDetailBox(smartReportHtml('table.operationsCount','عدد العمليات'),fmt0(topServiceOps))}${alertDetailBox(smartReportHtml('table.averageTransaction','متوسط العملية'),money(topServiceAvg))}${alertDetailBox(smartReportHtml('alerts.serviceContribution','مساهمة الخدمة'),safeDiv(topService[1]||0,total).toLocaleString('en-US',{style:'percent',maximumFractionDigits:1}))}${alertDetailBox(smartReportHtml('alerts.top5ServicesContribution','مساهمة أعلى 5 خدمات'),`${serviceTop5Share.toFixed(1)}%`)}</div><span class="ok">${smartReportHtml('alerts.topServiceReason','✓ الخدمة الأعلى قيمة تم تحديدها من إجمالي مبيعات الخدمة في الفترة المختارة.')}</span><span>${smartReportHtml('alerts.topServiceRecommendation','التوصية: اعمل Bundle أو عرض مكمل لهذه الخدمة لرفع متوسط الفاتورة.')}</span>`;
    salesAlerts.push({type:'good',text:smartReportT('alerts.topServiceText','الخدمة الأعلى قيمة هي {service} بإجمالي {total}.',{service:topService[0],total:money(topService[1])}),detail:topServiceDetail});
  }

  const dayNames=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map(k=>smartReportT('calendar.days.'+k,k));
  const heatmapActiveYear=String(window.smartHeatmapYear||smartHeatmapDefaultYear());
  const heatmapActiveVan=String(window.smartHeatmapVan||'').trim();
  let heatData=smartApplyGlobalFilters(smartDataCutoff(smartData(),heatmapActiveYear));
  if(heatmapActiveVan) heatData=heatData.filter(r=>String(r.van||'').trim()===heatmapActiveVan);
  const heat={};
  heatData.forEach(r=>{const d=new Date(parseDate(r.date)); if(isNaN(d))return; const key=d.getDay()+'-'+d.getMonth(); heat[key]=(heat[key]||0)+parseNum(r.totalInc);});
  const heatCutoffDate=String(heatmapActiveYear)==='all'?null:maxInvoiceDateForYear(records,heatmapActiveYear);
  const heatCutoffMonth=heatCutoffDate?heatCutoffDate.getMonth():11;
  const isFutureHeatMonth=(mi)=>String(heatmapActiveYear)!=='all' && heatCutoffDate && mi>heatCutoffMonth;
  const heatMonthLabel=(m,mi)=> heatmapActiveYear==='all' ? `${smartReportHtml('calendar.months.'+m,MAR[m])}<small>${smartReportHtml('filters.allYears','كل السنوات')}</small>` : `${smartReportHtml('calendar.months.'+m,MAR[m])}<small>${heatmapActiveYear}${isFutureHeatMonth(mi)?' - '+smartReportHtml('heatmap.noInvoices','لا توجد فواتير'):''}</small>`;

  // PETATOE v5.1.21: Monthly heatmap palette.
  // Each month has a stable hue. Within the same month, the lowest day is lighter
  // and the highest day is darker using that same hue, so the heatmap remains readable
  // without mixing unrelated colors inside one month.
  const heatMonthPalettes=[
    {name:smartReportT('calendar.months.January','يناير'),   light:'#9ed8ff', dark:'#2458d6'},
    {name:smartReportT('calendar.months.February','فبراير'), light:'#92c9ff', dark:'#1d74c9'},
    {name:smartReportT('calendar.months.March','مارس'),   light:'#78e5df', dark:'#0b9ea6'},
    {name:smartReportT('calendar.months.April','أبريل'),  light:'#83e0b1', dark:'#15985a'},
    {name:smartReportT('calendar.months.May','مايو'),   light:'#c2e674', dark:'#73a728'},
    {name:smartReportT('calendar.months.June','يونيو'),  light:'#ffe174', dark:'#d6a514'},
    {name:smartReportT('calendar.months.July','يوليو'),  light:'#ffc06c', dark:'#e56f18'},
    {name:smartReportT('calendar.months.August','أغسطس'), light:'#ff9b65', dark:'#d9492c'},
    {name:smartReportT('calendar.months.September','سبتمبر'),light:'#ff91ad', dark:'#c43763'},
    {name:smartReportT('calendar.months.October','أكتوبر'), light:'#d596f1', dark:'#873ab6'},
    {name:smartReportT('calendar.months.November','نوفمبر'), light:'#b798ff', dark:'#5d3fb7'},
    {name:smartReportT('calendar.months.December','ديسمبر'),light:'#89aaf7', dark:'#2754b8'}
  ];
  const hexToRgb=(hex)=>{const h=String(hex||'#000000').replace('#','');const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);return [(n>>16)&255,(n>>8)&255,n&255];};
  const rgbToCss=(rgb,a=1)=>`rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${a})`;
  const mixRgb=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const monthVals=(mi)=>dayNames.map((_,di)=>heat[di+'-'+mi]||0).filter(v=>v>0);
  const monthRanges=MONTHS.map((_,mi)=>{const vals=monthVals(mi);return {min:vals.length?Math.min(...vals):0,max:vals.length?Math.max(...vals):0};});
  const heatCellStyle=(mi,val,disabled)=>{
    if(disabled || !val) return '';
    const pal=heatMonthPalettes[mi]||heatMonthPalettes[0];
    const range=monthRanges[mi]||{min:0,max:0};
    const t=range.max===range.min ? .72 : Math.max(.08,Math.min(1,(val-range.min)/(range.max-range.min)));
    const low=hexToRgb(pal.light), high=hexToRgb(pal.dark);
    const fill=mixRgb(low,high,t);
    const border=mixRgb(low,high,Math.min(1,t+.12));
    const glow=mixRgb(low,high,Math.min(1,t+.25));
    const textDark=t<.18 ? '#0f172a' : '#ffffff';
    return `--hm-bg:${rgbToCss(fill,.82)};--hm-bg2:${rgbToCss(fill,.58)};--hm-border:${rgbToCss(border,.92)};--hm-glow:${rgbToCss(glow,.28)};--hm-text:${textDark};`;
  };
  const heatLegendHtml=`<div class="heat-month-gradient-legend"><span>${smartReportHtml('heatmap.withinEachMonth','داخل كل شهر')}</span><b>${smartReportHtml('heatmap.lighterLower','أفتح = الأقل مبيعات')}</b><div class="heat-month-gradient-strip">${heatMonthPalettes.map((p,i)=>`<i style="--l:${p.light};--d:${p.dark}" title="${p.name}"></i>`).join('')}</div><b>${smartReportHtml('heatmap.darkerHigher','أغمق = الأكثر مبيعات')}</b></div>`;
  const heatHtml=`<div class="heatmap-control-row">${heatmapVehicleFilter()}${heatmapYearButtons(heatmapActiveYear)}</div><div class="smart-heatmap-scroll"><div class="heatmap-wrap heatmap-wrap-monthly"><div></div>${MONTHS.map((m,mi)=>`<div class="heatmap-head heatmap-month-${mi}" style="--month-light:${heatMonthPalettes[mi].light};--month-dark:${heatMonthPalettes[mi].dark}">${heatMonthButtonHtml(heatmapActiveYear,m,mi,isFutureHeatMonth(mi))}</div>`).join('')}${dayNames.map((dn,di)=>`<div class="heatmap-day">${dn}</div>${MONTHS.map((m,mi)=>{let disabled=isFutureHeatMonth(mi);let val=disabled?0:(heat[di+'-'+mi]||0);let title=disabled?`${dn} - ${smartReportT('calendar.months.'+m,MAR[m])} ${heatmapActiveYear}: ${smartReportT('heatmap.noInvoicesAfter','لا توجد فواتير بعد')} ${fmtDateAr(heatCutoffDate)}`:(heatmapActiveYear==='all'?`${dn} - ${smartReportT('calendar.months.'+m,MAR[m])} - ${smartReportT('filters.allYears','كل السنوات')}: ${money(val)}`:`${dn} - ${smartReportT('calendar.months.'+m,MAR[m])} ${heatmapActiveYear}: ${money(val)}`);return `<div class="heat-cell heat-month-cell${disabled?' heat-disabled':''}" style="${heatCellStyle(mi,val,disabled)}" title="${title}">${val?shortMoney(val):''}</div>`}).join('')}`).join('')}</div></div>${heatLegendHtml}`;


  const customerValueTierHtml=(cls,badgeClass,stats)=>{
    const icon=cls==='VIP'?'👑':cls==='At Risk'?'⚠️':'✅';
    const title=cls==='VIP'?'VIP':cls==='At Risk'?'At Risk':'Active';
    const reasons=[];
    if(cls==='VIP'){
      reasons.push(`عدد الزيارات ${fmt0(stats.visits)} زيارة، وهو أكبر من أو يساوي 5 زيارات`);
      reasons.push(`إجمالي الإنفاق ${money(stats.value)} يساوي أو يتجاوز متوسط النشاط المتوقع لهذا العميل`);
      reasons.push(`آخر زيارة منذ ${fmt0(stats.daysSince)} يوم، أي خلال آخر 45 يوم`);
    }else if(cls==='At Risk'){
      if(stats.daysSince>60) reasons.push(`آخر زيارة منذ ${fmt0(stats.daysSince)} يوم، أي أكثر من 60 يوم`);
      if(stats.visits<=1) reasons.push(`عدد الزيارات ${fmt0(stats.visits)} فقط، لذلك العميل لم يظهر عليه تكرار كافٍ`);
      if(stats.daysSince<=60 && stats.visits>1) reasons.push(`العميل يحتاج متابعة لأنه خارج شروط VIP / Active المثالية`);
    }else{
      reasons.push(`آخر زيارة منذ ${fmt0(stats.daysSince)} يوم، لذلك العميل ما زال نشطًا`);
      reasons.push(`عدد الزيارات ${fmt0(stats.visits)} زيارة بإجمالي إنفاق ${money(stats.value)}`);
      reasons.push(`العميل ليس ضمن At Risk، ولم يحقق كل شروط VIP الحالية`);
    }
    return `<span class="new-cust-tier-wrap cust-value-tier-wrap" tabindex="0"><span class="smart-tag ${badgeClass} cust-value-tier-badge">${title}</span><span class="cust-value-info-icon">ⓘ</span><span class="new-cust-tier-tooltip"><b>سبب تصنيف العميل: ${title}</b><span>تم تصنيف العميل بناءً على بيانات الفترة المختارة:</span>${reasons.map(r=>`<span class="ok">✓ ${r}</span>`).join('')}<span>المعادلة تستخدم نفس القيم الظاهرة في الجدول بدون تعديل أي رقم أو إجمالي.</span></span></span>`;
  };

  // CASH_CUSTOMER_EXCLUSION_PATCH:
  // Exclude only the generic cash customer ("نقدي") from Customer Value,
  // Inactive Customers and Recovery Opportunities reports.
  // All source records stay unchanged and all other dashboards continue to use the original data.
  const isGenericCashCustomer=(name)=>String(name||'').trim()==='نقدي';
  const customerReportNames=(smartEngineCustomerRows?Object.keys(smartEngineCustomerRows):[...new Set(data.map(r=>String(r.client||'غير محدد').trim()))])
    .map(name=>String(name||'غير محدد').trim())
    .filter(name=>name && !isGenericCashCustomer(name));
  const allCustomerValueRows=customerReportNames.map(name=>{
    const rows=((smartEngineCustomerRows&&smartEngineCustomerRows[name])?smartEngineCustomerRows[name]:data.filter(r=>String(r.client||'غير محدد').trim()===name)).slice().sort((a,b)=>{
      const da=smartDateValue(a), db=smartDateValue(b);
      if((db?+db:0)!==(da?+da:0)) return (db?+db:0)-(da?+da:0);
      return invoiceNumValue(b.invoice)-invoiceNumValue(a.invoice);
    });
    const visitModel=buildCustomerVisitModel(rows);
    const visits=visitModel.visits;
    const val=visitModel.activeValue;
    const lastActive=visitModel.lastActive;
    const lastDate=lastActive?lastActive.date:null;
    const lastInvoiceValue=lastActive?Math.abs(lastActive.signedValue||0):0;
    const visitMonths=visitModel.months;
    const daysSince=lastDate?Math.max(0,Math.floor((analysisNow-lastDate)/(24*60*60*1000))):999;
    const avgInvoice=safeDiv(val,visits);
    let cls='Active', badgeClass='info';
    if(visits>=5 && val>=avg*visits && daysSince<=45){cls='VIP';badgeClass='good';}
    else if(daysSince>60 || visits<=1){cls='At Risk';badgeClass='bad';}
    const tierHtml=customerValueTierHtml(cls,badgeClass,{visits,value:val,daysSince,avgInvoice,lastInvoiceValue,visitMonths:visitMonths.length});
    const visitsHtml=customerVisitsHtml(visitModel);
    const visitMonthsHtml=customerVisitMonthsHtml(visitModel);
    const monthlyAvg=safeDiv(val,Math.max(1,visitMonths.length));
    const missedMonths=Math.max(0,Math.floor(daysSince/30));
    const lostRevenue=monthlyAvg*missedMonths;
    let riskKey='low', riskCls='info';
    if(daysSince>120){riskKey='critical';riskCls='bad';}
    else if(daysSince>90){riskKey='high';riskCls='warn';}
    else if(daysSince>60){riskKey='medium';riskCls='warn';}
    let recoveryKey='medium';
    if((cls==='VIP'||val>=5000) && daysSince<=180) recoveryKey='high';
    else if(daysSince>180 || val<1000) recoveryKey='low';
    const risk=smartReportT('risk.'+riskKey,({low:'منخفض',medium:'متوسط',high:'مرتفع',critical:'حرج'})[riskKey]);
    const recovery=smartReportT('recovery.'+recoveryKey,({low:'منخفضة',medium:'متوسطة',high:'مرتفعة'})[recoveryKey]);
    return {name,val,visits,avgInvoice,lastDate,lastInvoiceValue,lastInvoiceNo:(lastActive?lastActive.invoice:'—'),visitMonths,visitMonthsHtml,daysSince,tierHtml,visitsHtml,cls,badgeClass,monthlyAvg,lostRevenue,risk,riskKey,riskCls,recovery,recoveryKey,visitModel};
  }).filter(x=>x.val>0 || x.visits>0).sort((a,b)=>b.val-a.val);

  const customerInsightLimit=Math.max(10, window.customerInsightTableLimit || 10);
  const customerInsightRows=allCustomerValueRows.slice(0,customerInsightLimit).map(x=>
    `<tr><td>${htmlSafe(x.name)}</td><td>${money(x.val)}</td><td>${x.visitsHtml}</td><td>${money(x.avgInvoice)}</td><td>${x.lastDate?fmtDateAr(x.lastDate):'—'}</td><td>${money(x.lastInvoiceValue)}</td><td>${x.visitMonthsHtml}</td><td>${fmt0(x.daysSince)}</td><td>${x.tierHtml}</td></tr>`
  ).join('') || `<tr><td colspan="9">${smartReportHtml('empty.noCustomerData','لا توجد بيانات عملاء للعرض.')}</td></tr>`;
  const customerInsightMoreButton=allCustomerValueRows.length>customerInsightLimit
    ? `<div class="new-cust-table-footer"><button class="new-cust-more-btn" data-smart-action="customer-insight-more" data-limit="${customerInsightLimit+10}">اضغط لعرض المزيد ⌄</button><span>عرض ${fmt0(Math.min(customerInsightLimit,allCustomerValueRows.length))} من أصل ${fmt0(allCustomerValueRows.length)} عميل</span></div>`
    : `<div class="new-cust-table-footer"><span>تم عرض ${fmt0(allCustomerValueRows.length)} من أصل ${fmt0(allCustomerValueRows.length)} عميل</span></div>`;

  // PETATOE v3.9.2B - Full Customer Two-Year Sales Comparison Report
  // Full data is calculated for all customers; every table shows 10 rows first and reveals more on demand.
  const customerCompareAvailableYears=[...new Set(records.map(r=>getYear(r)).filter(Boolean))].sort((a,b)=>a-b);
  window.PETATOECustomerCompareAvailableYears=customerCompareAvailableYears.slice();
  const customerCompareDefaultYear=customerCompareAvailableYears[customerCompareAvailableYears.length-1]||new Date().getFullYear();
  const customerCompareDefaultBase=customerCompareAvailableYears.includes(customerCompareDefaultYear-1)?customerCompareDefaultYear-1:(customerCompareAvailableYears.filter(y=>y<customerCompareDefaultYear).pop()||customerCompareDefaultYear);
  const customerCompareState=window.PETATOECustomerCompareState||{};
  const requestedTarget=+(window.customerCompareTargetYear||customerCompareState.targetYear);
  const customerCompareTargetYear=customerCompareAvailableYears.includes(requestedTarget)?requestedTarget:customerCompareDefaultYear;
  const requestedBase=+(window.customerCompareBaseYear||customerCompareState.baseYear);
  const customerCompareBaseYear=(customerCompareAvailableYears.includes(requestedBase) && requestedBase!==customerCompareTargetYear)?requestedBase:customerCompareDefaultBase;
  window.customerCompareTargetYear=customerCompareTargetYear;
  window.customerCompareBaseYear=customerCompareBaseYear;
  const customerCompareTaxMode=['gross','net','tax'].includes(window.customerCompareTaxMode||customerCompareState.tax)?(window.customerCompareTaxMode||customerCompareState.tax):'gross';
  const customerCompareTopFilter=['10','20','50','all'].includes(String(window.customerCompareTopFilter||customerCompareState.top))?String(window.customerCompareTopFilter||customerCompareState.top):'10';
  const customerComparePeriodMode=['ytd','full'].includes(String(window.customerComparePeriodMode||customerCompareState.periodMode))?String(window.customerComparePeriodMode||customerCompareState.periodMode):'full';
  window.customerComparePeriodMode=customerComparePeriodMode;
  // Sync sanitized values back to the persistent local state so every local filter keeps its selection after rerender.
  window.PETATOECustomerCompareState=window.PETATOECustomerCompareState||{};
  window.PETATOECustomerCompareState.baseYear=customerCompareBaseYear;
  window.PETATOECustomerCompareState.targetYear=customerCompareTargetYear;
  window.PETATOECustomerCompareState.tax=customerCompareTaxMode;
  window.PETATOECustomerCompareState.top=customerCompareTopFilter;
  window.PETATOECustomerCompareState.periodMode=customerComparePeriodMode;
  const requestedCarFilter=String(window.customerCompareCarFilter||customerCompareState.car||'all');
  const customerCompareLimitOf=function(k){const top=String(customerCompareTopFilter||'10'); const base=(top==='all')?999999:(parseInt(top,10)||10); return Math.max(10, parseInt(window[k]||base,10)||base)};
  const customerCompareResetLimits=function(){customerCompareResetAllLimits();};
  const customerCompareRowCar=function(r){return String(r.van||r.car||r.vehicle||r['السيارة']||'غير محدد').trim()||'غير محدد'};
  const customerCompareRowValue=function(r){if(customerCompareTaxMode==='net')return parseNum(r.totalEx);if(customerCompareTaxMode==='tax')return parseNum(r.tax);return parseNum(r.totalInc)};
  const customerCompareValueLabel=function(){return customerCompareTaxMode==='net'?'قبل الضريبة':(customerCompareTaxMode==='tax'?'الضريبة':'شامل الضريبة')};
  const customerCompareSourceAll=records.slice().filter(r=>!isGenericCashCustomer(String(r.client||'غير محدد').trim()));
  const customerCompareCars=['all',...[...new Set(customerCompareSourceAll.map(customerCompareRowCar).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ar'))];
  const customerCompareCarFilter=customerCompareCars.includes(requestedCarFilter)?requestedCarFilter:'all';
  window.customerCompareCarFilter=customerCompareCarFilter;
  window.PETATOECustomerCompareState.car=customerCompareCarFilter;
  const customerCompareSource=customerCompareSourceAll.filter(r=>customerCompareCarFilter==='all'||customerCompareRowCar(r)===customerCompareCarFilter);
  // PETATOE v3.9.2F - Fair YTD comparison logic.
  // Business rule: compare the target/current year only up to the latest uploaded invoice date,
  // and compare the base/previous year using the same month/day range.
  const customerCompareInvoiceRank=function(r){
    try{ return (typeof invoiceNumValue==='function') ? invoiceNumValue(r.invoice) : (parseFloat(String(r.invoice||'').replace(/[^0-9.]/g,''))||0); }
    catch(e){ return parseFloat(String((r||{}).invoice||'').replace(/[^0-9.]/g,''))||0; }
  };
  const customerCompareTargetDated=customerCompareSource
    .filter(r=>getYear(r)===customerCompareTargetYear && smartDateValue(r))
    .sort((a,b)=>{
      const ia=customerCompareInvoiceRank(a), ib=customerCompareInvoiceRank(b);
      if(ia!==ib) return ib-ia;
      return smartDateValue(b)-smartDateValue(a);
    });
  const customerCompareLatestRecord=customerCompareTargetDated[0]||null;
  const customerCompareLatestDate=customerCompareLatestRecord?smartDateValue(customerCompareLatestRecord):null;
  const customerCompareUseFullYear=customerComparePeriodMode==='full';
  const customerCompareCutoffMonth=customerCompareUseFullYear?11:(customerCompareLatestDate?customerCompareLatestDate.getMonth():11);
  const customerCompareCutoffDay=customerCompareUseFullYear?31:(customerCompareLatestDate?customerCompareLatestDate.getDate():31);
  const customerCompareTargetStart=new Date(customerCompareTargetYear,0,1,0,0,0,0);
  const customerCompareTargetEnd=new Date(customerCompareTargetYear,customerCompareCutoffMonth,customerCompareCutoffDay,23,59,59,999);
  const customerCompareBaseStart=new Date(customerCompareBaseYear,0,1,0,0,0,0);
  const customerCompareBaseEnd=new Date(customerCompareBaseYear,customerCompareCutoffMonth,customerCompareCutoffDay,23,59,59,999);
  const customerComparePeriodDays=Math.round((new Date(customerCompareTargetYear,customerCompareCutoffMonth,customerCompareCutoffDay)-new Date(customerCompareTargetYear,0,1))/86400000)+1;
  const customerComparePeriodModeLabel=customerCompareUseFullYear?'السنة كاملة':'حتى الفترة الحالية';
  const customerComparePeriodLabel=customerCompareUseFullYear
    ? `وضع المقارنة: السنة كاملة — من 01 يناير إلى 31 ديسمبر ${customerCompareTargetYear} مقابل نفس السنة كاملة ${customerCompareBaseYear}.`
    : (customerCompareLatestDate
      ? `وضع المقارنة: حتى الفترة الحالية — من 01 يناير ${customerCompareTargetYear} إلى ${fmtDateAr(customerCompareTargetEnd)} مقابل نفس الفترة من ${customerCompareBaseYear} حتى ${fmtDateAr(customerCompareBaseEnd)} — آخر فاتورة مرفوعة: ${htmlSafe(String(customerCompareLatestRecord.invoice||'—'))}`
      : `وضع المقارنة: حتى الفترة الحالية — لا توجد فواتير مؤرخة في سنة المقارنة ${customerCompareTargetYear} ضمن الفلتر الحالي.`);
  const customerCompareInSelectedPeriod=function(r,yy){
    const d=smartDateValue(r); if(!d) return false;
    if(yy===customerCompareTargetYear) return d>=customerCompareTargetStart && d<=customerCompareTargetEnd;
    if(yy===customerCompareBaseYear) return d>=customerCompareBaseStart && d<=customerCompareBaseEnd;
    return false;
  };
  const customerCompareYearItems=customerCompareAvailableYears.map(yy=>({value:String(yy),text:String(yy)}));
  const customerCompareCarItems=customerCompareCars.map(c=>({value:String(c),text:c==='all'?'كل السيارات':String(c)}));
  const customerCompareTopItems=['10','20','50','all'].map(v=>({value:v,text:v==='all'?'الكل':'أعلى '+v}));
  const customerComparePeriodItems=[{value:'ytd',text:'حتى الفترة الحالية'},{value:'full',text:'السنة كاملة'}];
  const customerCompareFilterDropdown=function(field,label,current,items){
    // PETATOE v5.1.79 - use native select controls for Customer Compare only.
    // Previous custom dropdown UI had no reliable scoped CSS/menu behavior, so values did not consistently update.
    const cur=String(current);
    return `<label class="customer-yoy-native-filter"><span>${htmlSafe(label)}</span><select data-customer-compare-filter="${htmlSafe(field)}" data-smart-action="customer-compare-filter">${items.map(it=>`<option value="${htmlSafe(it.value)}" ${String(it.value)===cur?'selected':''}>${htmlSafe(it.text)}</option>`).join('')}</select></label>`;
  };
  const customerCompareFiltersHtml=[
    customerCompareFilterDropdown('baseYear',smartReportT('compare.baseYear','سنة الأساس'),customerCompareBaseYear,customerCompareYearItems),
    customerCompareFilterDropdown('targetYear',smartReportT('compare.targetYear','سنة المقارنة'),customerCompareTargetYear,customerCompareYearItems),
    customerCompareFilterDropdown('car',smartReportT('compare.vehicle','السيارة'),customerCompareCarFilter,customerCompareCarItems),
    customerCompareFilterDropdown('periodMode',smartReportT('compare.comparisonType','نوع المقارنة'),customerComparePeriodMode,customerComparePeriodItems),
    customerCompareFilterDropdown('top',smartReportT('compare.display','عرض'),customerCompareTopFilter,customerCompareTopItems)
  ].join('');
  const customerCompareModeButtons=['gross','net','tax'].map(m=>`<button class="metric-chip ${customerCompareTaxMode===m?'active':''}" data-smart-action="customer-compare-tax" data-tax="${m}">${m==='gross'?smartReportHtml('metrics.gross','شامل الضريبة'):m==='net'?smartReportHtml('metrics.net','قبل الضريبة'):smartReportHtml('metrics.vat','الضريبة')}</button>`).join('');
  const customerCompareMonthNames=['January','February','March','April','May','June','July','August','September','October','November','December'].map(k=>smartReportT('calendar.months.'+k,k));
  const customerCompareMap={};
  customerCompareSource.forEach(r=>{
    const yy=getYear(r);
    if(yy!==customerCompareBaseYear && yy!==customerCompareTargetYear) return;
    if(!customerCompareInSelectedPeriod(r,yy)) return;
    const name=String(r.client||'غير محدد').trim();
    if(!name||isGenericCashCustomer(name))return;
    const inv=String(r.invoice||'').trim();
    const d=smartDateValue(r);
    const m=normalizeMonth(r.month,r.date);
    const mi=MONTHS.indexOf(m);
    customerCompareMap[name]=customerCompareMap[name]||{name,base:0,target:0,baseInvoices:new Set(),targetInvoices:new Set(),baseLast:null,targetLast:null,baseLastInvoice:'—',targetLastInvoice:'—',monthsBase:Array(12).fill(0),monthsTarget:Array(12).fill(0)};
    const val=customerCompareRowValue(r);
    if(yy===customerCompareBaseYear){customerCompareMap[name].base+=val;if(inv)customerCompareMap[name].baseInvoices.add(inv);if(mi>=0)customerCompareMap[name].monthsBase[mi]+=val;if(d&&(!customerCompareMap[name].baseLast||d>customerCompareMap[name].baseLast)){customerCompareMap[name].baseLast=d;customerCompareMap[name].baseLastInvoice=inv||'—';}}
    if(yy===customerCompareTargetYear){customerCompareMap[name].target+=val;if(inv)customerCompareMap[name].targetInvoices.add(inv);if(mi>=0)customerCompareMap[name].monthsTarget[mi]+=val;if(d&&(!customerCompareMap[name].targetLast||d>customerCompareMap[name].targetLast)){customerCompareMap[name].targetLast=d;customerCompareMap[name].targetLastInvoice=inv||'—';}}
  });
  const customerCompareRows=Object.values(customerCompareMap).map(x=>{
    const diff=x.target-x.base;
    const pct=x.base?safeDiv(diff,x.base)*100:(x.target>0?100:0);
    let status='ثابت', cls='info';
    if(x.base>0 && x.target<=0){status='مفقود';cls='bad';}
    else if(x.base<=0 && x.target>0){status='عميل جديد';cls='good';}
    else if(diff>0){status='نمو';cls='good';}
    else if(diff<0){status='تراجع';cls='warn';}
    const lastDate=x.targetLast||x.baseLast;
    const lastInvoice=x.targetLast?x.targetLastInvoice:x.baseLastInvoice;
    return {...x,diff,pct,status,cls,lastDate,lastInvoice,baseInv:x.baseInvoices.size,targetInv:x.targetInvoices.size};
  });
  const customerCompareRankBase=customerCompareRows.slice().filter(x=>x.base>0).sort((a,b)=>b.base-a.base).reduce((o,x,i)=>(o[x.name]=i+1,o),{});
  const customerCompareRankTarget=customerCompareRows.slice().filter(x=>x.target>0).sort((a,b)=>b.target-a.target).reduce((o,x,i)=>(o[x.name]=i+1,o),{});
  customerCompareRows.forEach(x=>{x.baseRank=customerCompareRankBase[x.name]||0;x.targetRank=customerCompareRankTarget[x.name]||0;x.rankShift=(x.baseRank&&x.targetRank)?x.baseRank-x.targetRank:0;});
  const customerCompareLimitList=function(arr){return arr};
  const customerCompareMainRows=customerCompareLimitList(customerCompareRows.slice().sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff)));
  const customerCompareGrowthRows=customerCompareLimitList(customerCompareRows.filter(x=>x.diff>0&&x.base>0).sort((a,b)=>b.diff-a.diff));
  const customerCompareDeclineRows=customerCompareLimitList(customerCompareRows.filter(x=>x.diff<0&&x.target>0).sort((a,b)=>a.diff-b.diff));
  const customerCompareLostRows=customerCompareLimitList(customerCompareRows.filter(x=>x.base>0&&x.target<=0).sort((a,b)=>b.base-a.base));
  const customerCompareRankRows=customerCompareLimitList(customerCompareRows.filter(x=>x.baseRank&&x.targetRank&&x.rankShift!==0).sort((a,b)=>Math.abs(b.rankShift)-Math.abs(a.rankShift)));
  const customerCompareHeatRows=customerCompareLimitList(customerCompareRows.filter(x=>x.base>0||x.target>0).sort((a,b)=>(b.base+b.target)-(a.base+a.target)));
  const customerCompareBaseTotal=customerCompareRows.reduce((s,x)=>s+x.base,0);
  const customerCompareTargetTotal=customerCompareRows.reduce((s,x)=>s+x.target,0);
  const customerCompareTotalDiff=customerCompareTargetTotal-customerCompareBaseTotal;
  const customerCompareActiveBoth=customerCompareRows.filter(x=>x.base>0&&x.target>0).length;
  const customerCompareGrowth=customerCompareRows.filter(x=>x.diff>0&&x.base>0).length;
  const customerCompareDecline=customerCompareRows.filter(x=>x.diff<0&&x.target>0).length;
  const customerCompareLost=customerCompareRows.filter(x=>x.base>0&&x.target<=0).length;
  const customerCompareNew=customerCompareRows.filter(x=>x.base<=0&&x.target>0).length;
  const customerComparePctHtml=function(x){return `<span class="${x.pct>=0?'metric-up':'metric-down'}">${x.pct>=0?'+':''}${x.pct.toFixed(1)}%</span>`};
  const customerCompareRankHtml=function(x){return x.rankShift>0?`<span class="metric-up">⬆️ صعد ${fmt0(x.rankShift)} مركز</span>`:x.rankShift<0?`<span class="metric-down">⬇️ هبط ${fmt0(Math.abs(x.rankShift))} مركز</span>`:'—'};
  const customerCompareMore=function(key,arr,label){const lim=customerCompareLimitOf(key);return arr.length>lim?`<div class="new-cust-table-footer"><button class="new-cust-more-btn" data-smart-action="customer-compare-more" data-key="${key}">اضغط لعرض المزيد ⌄</button><span>عرض ${fmt0(Math.min(lim,arr.length))} من أصل ${fmt0(arr.length)} ${label}</span></div>`:`<div class="new-cust-table-footer"><span>تم عرض ${fmt0(arr.length)} من أصل ${fmt0(arr.length)} ${label}</span></div>`};
  const customerCompareMainLimit=customerCompareLimitOf('customerCompareTableLimit');
  const customerCompareMainTable=customerCompareMainRows.slice(0,customerCompareMainLimit).map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td><td>${money(x.base)}</td><td>${money(x.target)}</td><td class="${x.diff>=0?'metric-up':'metric-down'}">${x.diff>=0?'+':''}${money(x.diff)}</td><td>${customerComparePctHtml(x)}</td><td>${fmt0(x.baseInv)}</td><td>${fmt0(x.targetInv)}</td><td>${x.lastDate?fmtDateAr(x.lastDate):'—'}</td><td>${customerCompareRankHtml(x)}</td><td><span class="smart-tag ${x.cls}">${x.status}</span></td></tr>`).join('') || `<tr><td colspan="11">${smartReportHtml('empty.noYearComparisonData','لا توجد بيانات كافية للمقارنة بين السنتين المختارتين.')}</td></tr>`;
  const customerCompareAllDetailedTableHtml=(function(){
    const shouldVirtualize=!!(window.PETATOETables && typeof window.PETATOETables.render==='function' && customerCompareMainRows.length>0 && customerCompareMainLimit>=customerCompareMainRows.length);
    if(!shouldVirtualize){
      return `<div class="smart-table-clean customer-yoy-table"><table><thead><tr><th>#</th><th>العميل</th><th>${customerCompareBaseYear}</th><th>${customerCompareTargetYear}</th><th>الفرق</th><th>النمو %</th><th>فواتير ${customerCompareBaseYear}</th><th>فواتير ${customerCompareTargetYear}</th><th>آخر تعامل</th><th>تغير الترتيب</th><th>الحالة</th></tr></thead><tbody>${customerCompareMainTable}</tbody></table></div>`;
    }
    const customerCompareMainVirtualRows=customerCompareMainRows.map(function(x,i){return Object.assign({__petIndex:i+1},x);});
    return window.PETATOETables.render({
      id:'customerCompareAllDetailedVirtualTable',
      rows:customerCompareMainVirtualRows,
      limit:'all',
      virtual:true,
      virtualThreshold:120,
      height:560,
      rowHeight:42,
      columns:[
        {label:'#', render:function(x){return fmt0(x.__petIndex||1);}},
        {label:'العميل', render:function(x){return htmlSafe(x.name);}},
        {label:String(customerCompareBaseYear), render:function(x){return money(x.base);}},
        {label:String(customerCompareTargetYear), render:function(x){return money(x.target);}},
        {label:'الفرق', render:function(x){return `<span class="${x.diff>=0?'metric-up':'metric-down'}">${x.diff>=0?'+':''}${money(x.diff)}</span>`;}},
        {label:'النمو %', render:function(x){return customerComparePctHtml(x);}},
        {label:`فواتير ${customerCompareBaseYear}`, render:function(x){return fmt0(x.baseInv);}},
        {label:`فواتير ${customerCompareTargetYear}`, render:function(x){return fmt0(x.targetInv);}},
        {label:'آخر تعامل', render:function(x){return x.lastDate?fmtDateAr(x.lastDate):'—';}},
        {label:'تغير الترتيب', render:function(x){return customerCompareRankHtml(x);}},
        {label:'الحالة', render:function(x){return `<span class="smart-tag ${x.cls}">${x.status}</span>`;}}
      ]
    });
  })();
  const customerCompareGrowthTable=customerCompareGrowthRows.slice(0,customerCompareLimitOf('customerCompareGrowthLimit')).map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td><td>${money(x.base)}</td><td>${money(x.target)}</td><td class="metric-up">+${money(x.diff)}</td><td>${customerComparePctHtml(x)}</td></tr>`).join('') || `<tr><td colspan="6">${smartReportHtml('empty.noGrowthData','لا توجد بيانات نمو في الفترة المختارة.')}</td></tr>`;
  const customerCompareDeclineTable=customerCompareDeclineRows.slice(0,customerCompareLimitOf('customerCompareDeclineLimit')).map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td><td>${money(x.base)}</td><td>${money(x.target)}</td><td class="metric-down">${money(x.diff)}</td><td>${customerComparePctHtml(x)}</td></tr>`).join('') || `<tr><td colspan="6">${smartReportHtml('empty.noDeclineData','لا توجد بيانات تراجع في الفترة المختارة.')}</td></tr>`;
  const customerCompareLostValueTotal=customerCompareLostRows.reduce((s,x)=>s+(x.base||0),0);
  const customerCompareLostInvoicesTotal=customerCompareLostRows.reduce((s,x)=>s+(x.baseInv||0),0);
  const customerCompareLostPct=safeDiv(customerCompareLostRows.length, Math.max(1, customerCompareRows.filter(x=>x.base>0).length))*100;
  const customerCompareLostRiskMeta=function(v){
    if(v>=20000) return {label:'مرتفع', cls:'bad', icon:'🔴'};
    if(v>=5000) return {label:'متوسط', cls:'warn', icon:'🟡'};
    return {label:'منخفض', cls:'good', icon:'🟢'};
  };
  const customerCompareLostDetailsButton=function(x){
    const risk=customerCompareLostRiskMeta(x.base||0);
    const payload={
      name:String(x.name||'—'),
      baseYear:String(customerCompareBaseYear||''),
      targetYear:String(customerCompareTargetYear||''),
      baseSales:money(x.base||0),
      invoices:fmt0(x.baseInv||0),
      lastInvoice:String(x.baseLastInvoice||'—'),
      lastVisit:x.baseLast?fmtDateAr(x.baseLast):'—',
      lostValue:money(x.base||0),
      riskLabel:String(risk.label||'—'),
      riskIcon:String(risk.icon||''),
      valueLabel:String(customerCompareValueLabel?customerCompareValueLabel():'')
    };
    const encoded=encodeURIComponent(JSON.stringify(payload));
    return `<button type="button" class="new-cust-more-btn customer-yoy-lost-details-btn" data-lost-details="${htmlSafe(encoded)}" onmouseenter="customerCompareShowLostDetailsBubble(this)" onfocus="customerCompareShowLostDetailsBubble(this)" onmouseleave="customerCompareScheduleLostDetailsHide()" onblur="customerCompareScheduleLostDetailsHide()">عرض التفاصيل 👁️</button>`;
  };
  const customerCompareRenderVirtualTable=(id,rows,limit,columns,fallbackHtml)=>{
    const shouldVirtualize=!!(window.PETATOETables && typeof window.PETATOETables.render==='function' && Array.isArray(rows) && rows.length>0 && limit>=rows.length);
    if(!shouldVirtualize) return fallbackHtml;
    return window.PETATOETables.render({
      id,
      rows,
      columns,
      limit:rows.length,
      virtual:true,
      virtualThreshold:120,
      height:520,
      rowHeight:38
    });
  };
  const customerCompareLostLimit=customerCompareLimitOf('customerCompareLostLimit');
  const customerCompareLostSimpleFallbackTable=`<div class="smart-table-clean customer-yoy-table"><table><thead><tr><th>#</th><th>العميل</th><th>آخر فاتورة</th><th>رقم آخر فاتورة</th><th>قيمة ${customerCompareBaseYear}</th></tr></thead><tbody>${customerCompareLostRows.slice(0,customerCompareLostLimit).map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td><td>${x.baseLast?fmtDateAr(x.baseLast):'—'}</td><td>${htmlSafe(x.baseLastInvoice||'—')}</td><td>${money(x.base)}</td></tr>`).join('') || '<tr><td colspan="5">لا توجد عملاء مفقودون في الفترة المختارة.</td></tr>'}</tbody></table></div>`;
  const customerCompareLostSimpleTableHtml=customerCompareRenderVirtualTable('customerCompareLostSimpleVirtualTable',customerCompareLostRows,customerCompareLostLimit,[
    {label:'#',render:(x)=>String((customerCompareLostRows.indexOf(x)||0)+1)},
    {label:'العميل',render:(x)=>htmlSafe(x.name)},
    {label:'آخر فاتورة',render:(x)=>x.baseLast?fmtDateAr(x.baseLast):'—'},
    {label:'رقم آخر فاتورة',render:(x)=>htmlSafe(x.baseLastInvoice||'—')},
    {label:`قيمة ${customerCompareBaseYear}`,render:(x)=>money(x.base)}
  ],customerCompareLostSimpleFallbackTable);
  const customerCompareLostFallbackTable=`<div class="smart-table-clean customer-yoy-table"><table><thead><tr><th>#</th><th>العميل</th><th>مبيعات السنة السابقة</th><th>عدد الفواتير</th><th>آخر فاتورة</th><th>آخر زيارة</th><th>القيمة المفقودة</th><th>تصنيف الخطورة</th><th>عرض التفاصيل</th></tr></thead><tbody>${customerCompareLostRows.slice(0,customerCompareLostLimit).map((x,i)=>{const risk=customerCompareLostRiskMeta(x.base||0);return `<tr><td>${i+1}</td><td><b>${htmlSafe(x.name)}</b></td><td>${money(x.base)}</td><td>${fmt0(x.baseInv)}</td><td>${htmlSafe(x.baseLastInvoice||'—')}</td><td>${x.baseLast?fmtDateAr(x.baseLast):'—'}</td><td>${money(x.base)}</td><td><span class="smart-tag ${risk.cls}">${risk.icon} ${risk.label}</span></td><td>${customerCompareLostDetailsButton(x)}</td></tr>`}).join('') || '<tr><td colspan="9">لا توجد عملاء ظهروا في سنة الأساس ولم يظهروا في سنة المقارنة.</td></tr>'}</tbody></table></div>`;
  const customerCompareLostTableHtml=customerCompareRenderVirtualTable('customerCompareLostDetailedVirtualTable',customerCompareLostRows,customerCompareLostLimit,[
    {label:'#',render:(x)=>String((customerCompareLostRows.indexOf(x)||0)+1)},
    {label:'العميل',render:(x)=>`<b>${htmlSafe(x.name)}</b>`},
    {label:'مبيعات السنة السابقة',render:(x)=>money(x.base)},
    {label:'عدد الفواتير',render:(x)=>fmt0(x.baseInv)},
    {label:'آخر فاتورة',render:(x)=>htmlSafe(x.baseLastInvoice||'—')},
    {label:'آخر زيارة',render:(x)=>x.baseLast?fmtDateAr(x.baseLast):'—'},
    {label:'القيمة المفقودة',render:(x)=>money(x.base)},
    {label:'تصنيف الخطورة',render:(x)=>{const risk=customerCompareLostRiskMeta(x.base||0);return `<span class="smart-tag ${risk.cls}">${risk.icon} ${risk.label}</span>`}},
    {label:'عرض التفاصيل',render:(x)=>customerCompareLostDetailsButton(x)}
  ],customerCompareLostFallbackTable);

  const customerCompareRankLimit=customerCompareLimitOf('customerCompareRankLimit');
  const customerCompareRankFallbackTable=`<div class="smart-table-clean customer-yoy-table"><table><thead><tr><th>#</th><th>العميل</th><th>ترتيب ${customerCompareBaseYear}</th><th>ترتيب ${customerCompareTargetYear}</th><th>التغير</th><th>فرق المبيعات</th></tr></thead><tbody>${customerCompareRankRows.slice(0,customerCompareRankLimit).map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td><td>#${fmt0(x.baseRank)}</td><td>#${fmt0(x.targetRank)}</td><td>${customerCompareRankHtml(x)}</td><td>${money(x.diff)}</td></tr>`).join('') || '<tr><td colspan="6">لا يوجد تغير واضح في ترتيب العملاء.</td></tr>'}</tbody></table></div>`;
  const customerCompareRankTableHtml=customerCompareRenderVirtualTable('customerCompareRankShiftVirtualTable',customerCompareRankRows,customerCompareRankLimit,[
    {label:'#',render:(x)=>String((customerCompareRankRows.indexOf(x)||0)+1)},
    {label:'العميل',render:(x)=>htmlSafe(x.name)},
    {label:`ترتيب ${customerCompareBaseYear}`,render:(x)=>'#'+fmt0(x.baseRank)},
    {label:`ترتيب ${customerCompareTargetYear}`,render:(x)=>'#'+fmt0(x.targetRank)},
    {label:'التغير',render:(x)=>customerCompareRankHtml(x)},
    {label:'فرق المبيعات',render:(x)=>money(x.diff)}
  ],customerCompareRankFallbackTable);
  const customerCompareHeatCell=function(v){const cls=v>0?'hot':(v<0?'cold':'flat');return `<td><span class="customer-yoy-heat-cell ${cls}" title="${money(v)}">${v>0?'🟩':v<0?'🟥':'⬜'}</span></td>`};
  const customerCompareHeatTable=customerCompareHeatRows.slice(0,customerCompareLimitOf('customerCompareHeatLimit')).map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td>${customerCompareMonthNames.map((m,mi)=>customerCompareHeatCell((x.monthsTarget[mi]||0)-(x.monthsBase[mi]||0))).join('')}</tr>`).join('') || `<tr><td colspan="14">${smartReportHtml('empty.noMonthlyComparisonData','لا توجد بيانات شهرية للمقارنة.')}</td></tr>`;
  const customerCompareTornadoMax=Math.max(1,...customerCompareGrowthRows.slice(0,10).map(x=>Math.abs(x.diff)),...customerCompareDeclineRows.slice(0,10).map(x=>Math.abs(x.diff)));
  const customerCompareTornadoItems=[...customerCompareDeclineRows.slice(0,10).map(x=>({...x,side:'decline'})),...customerCompareGrowthRows.slice(0,10).map(x=>({...x,side:'growth'}))].sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff)).slice(0,20);
  const customerCompareTornadoHtml=customerCompareTornadoItems.map(x=>`<div class="customer-yoy-tornado-row"><div class="customer-yoy-tornado-name">${htmlSafe(x.name)}</div><div class="customer-yoy-tornado-track ${x.side}"><span style="width:${Math.max(4,Math.abs(x.diff)/customerCompareTornadoMax*100)}%"></span></div><b class="${x.diff>=0?'metric-up':'metric-down'}">${x.diff>=0?'+':''}${money(x.diff)}</b></div>`).join('') || `<div class="smart-empty">${smartReportHtml('empty.noChartDifferences','لا توجد فروقات كافية للرسم.')}</div>`;
  const customerCompareTopGrowth=customerCompareGrowthRows[0];
  const customerCompareTopLost=customerCompareLostRows[0];
  const customerCompareExportBtn=function(kind){return `<button type="button" class="exp-btn exp-btn-excel customer-yoy-export-btn" data-smart-action="customer-compare-export" data-kind="${kind}">⬇️ ${smartReportHtml('export.excel','Excel')}</button>`};
  const customerCompareNum=function(v){return Number.isFinite(+v)?+v:0};
  const customerCompareDateText=function(d){return d?fmtDateAr(d):'—'};
  window.PETATOECustomerCompareExportData={
    meta:{baseYear:customerCompareBaseYear,targetYear:customerCompareTargetYear,periodMode:customerComparePeriodMode,periodModeLabel:customerComparePeriodModeLabel,car:customerCompareCarFilter==='all'?smartReportT('filters.allVehicles','كل السيارات'):customerCompareCarFilter,valueLabel:customerCompareValueLabel(),latestInvoice:customerCompareLatestRecord?String(customerCompareLatestRecord.invoice||'—'):'—'},
    growth:{title:'Top Growth Customers',sheetName:'Top Growth',fileName:'Customer_Compare_Top_Growth',headers:['#','العميل',String(customerCompareBaseYear),String(customerCompareTargetYear),'الفرق','النمو %','فواتير سنة الأساس','فواتير سنة المقارنة','آخر تعامل'],rows:customerCompareGrowthRows.map((x,i)=>[i+1,x.name,customerCompareNum(x.base),customerCompareNum(x.target),customerCompareNum(x.diff),Number(customerCompareNum(x.pct).toFixed(2)),x.baseInv,x.targetInv,customerCompareDateText(x.lastDate)])},
    decline:{title:'Top Declining Customers',sheetName:'Top Declining',fileName:'Customer_Compare_Top_Declining',headers:['#','العميل',String(customerCompareBaseYear),String(customerCompareTargetYear),'الفرق','التراجع %','فواتير سنة الأساس','فواتير سنة المقارنة','آخر تعامل'],rows:customerCompareDeclineRows.map((x,i)=>[i+1,x.name,customerCompareNum(x.base),customerCompareNum(x.target),customerCompareNum(x.diff),Number(customerCompareNum(x.pct).toFixed(2)),x.baseInv,x.targetInv,customerCompareDateText(x.lastDate)])},
    lostSimple:{title:smartReportT('export.lostCustomers','العملاء المفقودون'),sheetName:'Lost Customers',fileName:'Customer_Compare_Lost_Customers',headers:['#','العميل','آخر فاتورة','رقم آخر فاتورة','قيمة سنة الأساس','فواتير سنة الأساس'],rows:customerCompareLostRows.map((x,i)=>[i+1,x.name,customerCompareDateText(x.baseLast),x.baseLastInvoice||'—',customerCompareNum(x.base),x.baseInv])},
    lostDetailed:{title:smartReportT('export.lastYearOnly','ظهروا في العام الماضي ولم يظهروا هذا العام'),sheetName:'Last Year Only',fileName:'Customer_Compare_Last_Year_Only',headers:['#','العميل','مبيعات السنة السابقة','عدد الفواتير','آخر فاتورة','آخر زيارة','القيمة المفقودة','تصنيف الخطورة'],rows:customerCompareLostRows.map((x,i)=>{const risk=customerCompareLostRiskMeta(x.base||0);return [i+1,x.name,customerCompareNum(x.base),x.baseInv,x.baseLastInvoice||'—',customerCompareDateText(x.baseLast),customerCompareNum(x.base),risk.label];})},
    rank:{title:'Customer Ranking Shift',sheetName:'Ranking Shift',fileName:'Customer_Compare_Ranking_Shift',headers:['#','العميل','ترتيب '+customerCompareBaseYear,'ترتيب '+customerCompareTargetYear,'تغير الترتيب','فرق المبيعات'],rows:customerCompareRankRows.map((x,i)=>[i+1,x.name,x.baseRank?('#'+x.baseRank):'',x.targetRank?('#'+x.targetRank):'',x.rankShift,customerCompareNum(x.diff)])},
    all:{title:smartReportT('export.allCustomersDetailed','كل العملاء - مقارنة تفصيلية'),sheetName:'Detailed Compare',fileName:'Customer_Compare_All_Customers_Detailed',headers:['#','العميل',String(customerCompareBaseYear),String(customerCompareTargetYear),'الفرق','النمو %','فواتير '+customerCompareBaseYear,'فواتير '+customerCompareTargetYear,'آخر تعامل','تغير الترتيب','الحالة'],rows:customerCompareMainRows.map((x,i)=>[i+1,x.name,customerCompareNum(x.base),customerCompareNum(x.target),customerCompareNum(x.diff),Number(customerCompareNum(x.pct).toFixed(2)),x.baseInv,x.targetInv,customerCompareDateText(x.lastDate),x.rankShift,x.status])}
  };
  const customerCompareTopDecline=customerCompareDeclineRows[0];
  const customerCompareInsightsHtml=`<div class="customer-yoy-insights"><h4>🧠 Executive Insights</h4><div class="insights"><div class="insight good"><b>نمو العملاء</b><span>ارتفع إنفاق ${fmt0(customerCompareGrowth)} عميل مقارنة بسنة الأساس بإجمالي نمو ${money(customerCompareGrowthRows.reduce((s,x)=>s+x.diff,0))}.</span></div><div class="insight ${customerCompareLost?'bad':'good'}"><b>العملاء المفقودون</b><span>${fmt0(customerCompareLost)} عميل توقفوا بالكامل في سنة المقارنة بقيمة مبيعات مفقودة ${money(customerCompareLostRows.reduce((s,x)=>s+x.base,0))}${customerCompareTopLost?'، وأكبرهم '+htmlSafe(customerCompareTopLost.name):''}.</span></div><div class="insight ${customerCompareTotalDiff>=0?'good':'bad'}"><b>صافي الفرق</b><span>صافي فرق المبيعات بين فترتي ${customerCompareBaseYear} و ${customerCompareTargetYear} هو ${customerCompareTotalDiff>=0?'+':''}${money(customerCompareTotalDiff)} حسب وضع ${customerCompareValueLabel()}.</span></div><div class="insight info"><b>أكبر فرصة</b><span>${customerCompareTopGrowth?'أكبر عميل نمو هو '+htmlSafe(customerCompareTopGrowth.name)+' بنسبة '+customerCompareTopGrowth.pct.toFixed(1)+'%.':(customerCompareTopDecline?'أكبر تراجع يحتاج متابعة هو '+htmlSafe(customerCompareTopDecline.name)+'.':'لا توجد فرصة نمو واضحة في الفترة المختارة.')}</span></div></div></div>`;
  const customerCompareHtml=`
      <div class="smart-panel customer-yoy-panel">
        <div class="new-cust-report-head"><h3>🔁 مقارنة مبيعات العملاء خلال عامين</h3><div class="customer-yoy-controls">${customerCompareFiltersHtml}</div></div>
        <div class="advanced-tax-actions customer-yoy-tax-actions">${customerCompareModeButtons}<div class="advanced-tax-badge"><span>الوضع الحالي:</span><b>${customerCompareValueLabel()}</b></div></div>
        <div class="customer-yoy-period-banner"><b>📅 ${customerComparePeriodLabel}</b><span>نوع المقارنة الحالي: ${customerComparePeriodModeLabel} — يتم تطبيق نفس المنطق على الملخص التنفيذي، النمو، التراجع، العملاء المفقودين، ترتيب العملاء، Tornado Chart، وExecutive Insights.</span></div>
        <p>يقارن التقرير مبيعات كل عميل بين سنتين حتى تاريخ آخر فاتورة مرفوعة في سنة المقارنة، مع حساب كامل البيانات أولاً ثم عرض أول 10 صفوف في كل جدول مع زر عرض المزيد. الفلاتر مرتبطة بكل الأقسام: الملخص، النمو، التراجع، المفقودين، الترتيب، والرسم.</p>
        <div class="customer-yoy-kpis executive">
          <div class="new-cust-kpi"><span>العملاء النشطون في السنتين</span><b>${fmt0(customerCompareActiveBoth)}</b><small>${customerCompareBaseYear} و ${customerCompareTargetYear}</small></div>
          <div class="new-cust-kpi"><span>عملاء نمو</span><b>${fmt0(customerCompareGrowth)}</b><small>زادوا عن سنة الأساس</small></div>
          <div class="new-cust-kpi"><span>عملاء تراجع</span><b>${fmt0(customerCompareDecline)}</b><small>انخفضوا ومازالوا نشطين</small></div>
          <div class="new-cust-kpi"><span>عملاء مفقودون</span><b>${fmt0(customerCompareLost)}</b><small>اشتروا في فترة الأساس ولم يشتروا في نفس فترة المقارنة</small></div>
        </div>
        <div class="customer-yoy-kpis">
          <div class="new-cust-kpi"><span>إجمالي ${customerCompareBaseYear}</span><b>${money(customerCompareBaseTotal)}</b><small>${customerCompareValueLabel()}</small></div>
          <div class="new-cust-kpi"><span>إجمالي ${customerCompareTargetYear}</span><b>${money(customerCompareTargetTotal)}</b><small>${customerCompareValueLabel()}</small></div>
          <div class="new-cust-kpi"><span>فرق المبيعات</span><b class="${customerCompareTotalDiff>=0?'metric-up':'metric-down'}">${customerCompareTotalDiff>=0?'+':''}${money(customerCompareTotalDiff)}</b><small>حتى ${customerCompareLatestDate?fmtDateAr(customerCompareTargetEnd):'نهاية السنة'}</small></div>
          <div class="new-cust-kpi"><span>عملاء جدد</span><b>${fmt0(customerCompareNew)}</b><small>ظهروا في نفس فترة المقارنة</small></div>
        </div>
        <div class="customer-yoy-sections customer-yoy-stack">
          <div class="smart-panel"><h4>📈 Top Growth Customers ${customerCompareExportBtn('growth')}</h4><div class="smart-table-clean customer-yoy-table"><table><thead><tr><th>#</th><th>العميل</th><th>${customerCompareBaseYear}</th><th>${customerCompareTargetYear}</th><th>الفرق</th><th>النمو %</th></tr></thead><tbody>${customerCompareGrowthTable}</tbody></table></div>${customerCompareMore('customerCompareGrowthLimit',customerCompareGrowthRows,'عميل نمو')}</div>
          <div class="smart-panel"><h4>📉 Top Declining Customers ${customerCompareExportBtn('decline')}</h4><div class="smart-table-clean customer-yoy-table"><table><thead><tr><th>#</th><th>العميل</th><th>${customerCompareBaseYear}</th><th>${customerCompareTargetYear}</th><th>الفرق</th><th>التراجع %</th></tr></thead><tbody>${customerCompareDeclineTable}</tbody></table></div>${customerCompareMore('customerCompareDeclineLimit',customerCompareDeclineRows,'عميل تراجع')}</div>
        </div>
        <div class="smart-panel"><h4>🚨 العملاء المفقودون ${customerCompareExportBtn('lostSimple')}</h4><p>العملاء الذين اشتروا في سنة الأساس ولم يظهر لهم أي تعامل في سنة المقارنة طبقًا للفلاتر الحالية.</p>${customerCompareLostSimpleTableHtml}${customerCompareMore('customerCompareLostLimit',customerCompareLostRows,'عميل مفقود')}</div>
        <div class="smart-panel customer-yoy-lost-panel">
          <div class="new-cust-report-head"><div><h4>🔴 ظهروا في العام الماضي ولم يظهروا هذا العام ${customerCompareExportBtn('lostDetailed')}</h4><p>العملاء الذين كان لهم تعاملات في سنة الأساس ولم يقوموا بأي تعامل في سنة المقارنة الحالية، مع استبعاد العميل النقدي من الحساب.</p></div><span class="smart-tag bad">Lost Customers</span></div>
          <div class="customer-yoy-kpis executive">
            <div class="new-cust-kpi"><span>عدد العملاء المفقودين</span><b>${fmt0(customerCompareLostRows.length)}</b><small>من عملاء ${customerCompareBaseYear}</small></div>
            <div class="new-cust-kpi"><span>قيمة المبيعات المفقودة</span><b>${money(customerCompareLostValueTotal)}</b><small>${customerCompareValueLabel()}</small></div>
            <div class="new-cust-kpi"><span>عدد الفواتير المفقودة</span><b>${fmt0(customerCompareLostInvoicesTotal)}</b><small>فواتير سنة الأساس</small></div>
            <div class="new-cust-kpi"><span>نسبة الفقد</span><b class="metric-down">${customerCompareLostPct.toFixed(1)}%</b><small>من إجمالي عملاء سنة الأساس</small></div>
          </div>
          ${customerCompareLostTableHtml}${customerCompareMore('customerCompareLostLimit',customerCompareLostRows,'عميل مفقود')}
        </div>

        <div class="customer-yoy-sections customer-yoy-stack customer-yoy-rank-tornado-stack">
          <div class="smart-panel"><h4>🏆 Customer Ranking Shift ${customerCompareExportBtn('rank')}</h4>${customerCompareRankTableHtml}${customerCompareMore('customerCompareRankLimit',customerCompareRankRows,'عميل تغير ترتيبه')}</div>
          <div class="smart-panel"><h4>🌪️ Tornado Chart</h4><div class="customer-yoy-tornado">${customerCompareTornadoHtml}</div></div>
        </div>
        <div class="smart-panel"><h4>📋 كل العملاء - مقارنة تفصيلية ${customerCompareExportBtn('all')}</h4>${customerCompareAllDetailedTableHtml}${customerCompareMore('customerCompareTableLimit',customerCompareMainRows,'عميل')}</div>
        ${customerCompareInsightsHtml}
      </div>`;

  const inactiveCustomers=allCustomerValueRows.filter(x=>x.visits>0 && x.daysSince>60).sort((a,b)=>b.lostRevenue-a.lostRevenue || b.daysSince-a.daysSince);
  const inactiveTotal=inactiveCustomers.length;
  const inactiveAvgDays=safeDiv(inactiveCustomers.reduce((s,x)=>s+x.daysSince,0),inactiveTotal);
  const inactiveLostTotal=inactiveCustomers.reduce((s,x)=>s+x.lostRevenue,0);
  const inactiveCritical=inactiveCustomers.filter(x=>x.daysSince>120).length;
  const topInactive=inactiveCustomers[0]||{name:'—',lostRevenue:0,daysSince:0};
  const inactiveBuckets=[
    {label:'0-30 يوم',min:0,max:30},
    {label:'31-60 يوم',min:31,max:60},
    {label:'61-90 يوم',min:61,max:90},
    {label:'91-120 يوم',min:91,max:120},
    {label:'120+ يوم',min:121,max:99999}
  ].map(b=>({label:b.label,count:allCustomerValueRows.filter(x=>x.daysSince>=b.min && x.daysSince<=b.max).length}));
  const inactiveTrendMap={};
  inactiveCustomers.forEach(x=>{
    if(!x.lastDate)return;
    const k=`${x.lastDate.getFullYear()}-${String(x.lastDate.getMonth()+1).padStart(2,'0')}`;
    inactiveTrendMap[k]=(inactiveTrendMap[k]||0)+1;
  });
  const inactiveTrendRows=Object.entries(inactiveTrendMap).sort().slice(-12).map(([k,count])=>{const [yy,mm]=k.split('-');return {key:k,label:`${MAR[MONTHS[(+mm)-1]]} ${yy}`,count};});
  const inactiveLostTooltipHtml=(x)=>{
    const activeMonths=Math.max(1,(x.visitMonths||[]).length);
    const completedMissedMonths=Math.max(0,Math.floor(x.daysSince/30));
    return `<span class="new-cust-tier-wrap" tabindex="0"><span class="inactive-analysis-btn">${money(x.lostRevenue)} ⓘ</span><span class="new-cust-tier-tooltip"><b>تحليل القيمة المفقودة المتوقعة</b><span>العميل: ${htmlSafe(x.name)}</span><div class="inactive-tip-kpis"><div class="inactive-tip-kpi"><small>إجمالي الإنفاق الصافي</small><b>${money(x.val)}</b></div><div class="inactive-tip-kpi"><small>شهور النشاط الفعلية</small><b>${fmt0(activeMonths)}</b></div><div class="inactive-tip-kpi"><small>متوسط إنفاق العميل شهرياً</small><b>${money(x.monthlyAvg)}</b></div><div class="inactive-tip-kpi"><small>شهور الغياب المكتملة</small><b>${fmt0(completedMissedMonths)} شهر</b></div></div><span class="ok">✓ متوسط إنفاق العميل شهرياً = إجمالي إنفاقه الصافي ÷ عدد شهور الزيارة الفعلية</span><span class="ok">✓ القيمة المفقودة = متوسط إنفاق العميل شهرياً × عدد شهور الغياب المكتملة</span><span class="ok">✓ التطبيق: ${money(x.monthlyAvg)} × ${fmt0(completedMissedMonths)} شهر = ${money(x.lostRevenue)}</span><span>لا يتم احتساب كسر الشهر؛ عندما يكمل العميل شهر غياب كامل يتم اعتبار متوسط إنفاق شهر كامل كقيمة مفقودة متوقعة.</span></span></span>`;
  };
  const inactiveRecoveryTooltipHtml=(x)=>{
    const tips=[];
    if(x.recoveryKey==='high'){tips.push('ابدأ بتواصل مباشر وسريع لأن قيمة العميل عالية واحتمال استرجاعه أفضل.');tips.push('اعرض خصم عودة محدود المدة أو خدمة إضافية مجانية مرتبطة بآخر خدمة اشتراها.');}
    else if(x.recoveryKey==='medium'){tips.push('استخدم رسالة متابعة ودية مع عرض متوسط القيمة يناسب تاريخ إنفاق العميل.');tips.push('اقترح إعادة حجز أو تذكير بالخدمة السابقة بدل عرض خصم كبير من البداية.');}
    else{tips.push('استخدم حملة جماعية منخفضة التكلفة مثل رسالة واتساب أو SMS بدل متابعة فردية مكلفة.');tips.push('اختبر عرض بسيط لاستعادة النشاط قبل تخصيص خصم كبير.');}
    if(x.daysSince>120) tips.push('العميل غائب أكثر من 120 يوم، لذلك يفضل التواصل برسالة إعادة تنشيط واضحة وليست تذكير عادي.');
    if(x.cls==='At Risk') tips.push('ابدأ بسؤال قصير عن سبب التوقف لتحويل العميل من At Risk إلى Active.');
    return `<span class="new-cust-tier-wrap" tabindex="0"><span class="inactive-analysis-btn recovery">${x.recovery} ⓘ</span><span class="new-cust-tier-tooltip"><b>توصيات استرجاع العميل</b><span>العميل: ${htmlSafe(x.name)}</span><div class="inactive-tip-kpis"><div class="inactive-tip-kpi"><small>فرصة الاسترجاع</small><b>${x.recovery}</b></div><div class="inactive-tip-kpi"><small>أيام الغياب</small><b>${fmt0(x.daysSince)} يوم</b></div><div class="inactive-tip-kpi"><small>التصنيف</small><b>${x.cls}</b></div><div class="inactive-tip-kpi"><small>آخر فاتورة</small><b>${htmlSafe(x.lastInvoiceNo||'—')}</b></div></div><div class="inactive-tip-list">${tips.map(t=>`<span class="ok">✓ ${t}</span>`).join('')}</div><span>الأولوية مبنية على قيمة الإنفاق، مدة الغياب، وتصنيف العميل الحالي.</span></span></span>`;
  };
  const inactiveRecoveryTableLimit=Math.max(15, window.inactiveRecoveryTableLimit || 15);
  const recoveryDisplayedRows=inactiveCustomers.slice(0,inactiveRecoveryTableLimit);
  const recoveryRows=recoveryDisplayedRows.map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td><td>${x.lastDate?fmtDateAr(x.lastDate):'—'}</td><td>${htmlSafe(x.lastInvoiceNo||'—')}</td><td>${fmt0(x.daysSince)}</td><td>${money(x.monthlyAvg)}</td><td>${inactiveLostTooltipHtml(x)}</td><td><span class="smart-tag ${x.badgeClass}">${x.cls}</span></td><td>${inactiveRecoveryTooltipHtml(x)}</td></tr>`).join('') || '<tr><td colspan="9">لا توجد فرص استرجاع حسب شرط الغياب الحالي.</td></tr>';
  const recoveryMoreButton=inactiveCustomers.length>inactiveRecoveryTableLimit
    ? `<div class="new-cust-table-footer"><button class="new-cust-more-btn" data-smart-action="inactive-recovery-more" data-limit="${inactiveRecoveryTableLimit+15}">اضغط لعرض المزيد ⌄</button><span>عرض ${fmt0(Math.min(inactiveRecoveryTableLimit,inactiveCustomers.length))} من أصل ${fmt0(inactiveCustomers.length)} فرصة استرجاع</span></div>`
    : `<div class="new-cust-table-footer"><span>تم عرض ${fmt0(inactiveCustomers.length)} من أصل ${fmt0(inactiveCustomers.length)} فرصة استرجاع</span></div>`;
  const inactiveCustTableLimit=Math.max(15, window.inactiveCustTableLimit || 15);
  const inactiveCustomerSort=window.inactiveCustomerSort || 'spend';
  const inactiveRiskRank={"حرج":4,"مرتفع":3,"متوسط":2,"منخفض":1};
  const inactiveTierRank={"VIP":6,"Gold":5,"Silver":4,"Bronze":3,"Active":2,"At Risk":1};
  const inactiveSortLabel={spend:'إجمالي الإنفاق',tier:'تصنيف العميل',risk:'مستوى الخطورة',absence:'عدد أيام الغياب'}[inactiveCustomerSort] || 'إجمالي الإنفاق';
  const inactiveSortControls=`<div class="inactive-sort-actions">
    <button class="inactive-sort-btn ${inactiveCustomerSort==='spend'?'active':''}" data-smart-action="inactive-sort" data-sort="spend">ترتيب حسب إجمالي الإنفاق</button>
    <button class="inactive-sort-btn ${inactiveCustomerSort==='tier'?'active':''}" data-smart-action="inactive-sort" data-sort="tier">ترتيب حسب تصنيف العميل</button>
    <button class="inactive-sort-btn ${inactiveCustomerSort==='risk'?'active':''}" data-smart-action="inactive-sort" data-sort="risk">ترتيب حسب مستوى الخطورة</button>
    <button class="inactive-sort-btn ${inactiveCustomerSort==='absence'?'active':''}" data-smart-action="inactive-sort" data-sort="absence">ترتيب حسب عدد أيام الغياب</button>
  </div>`;
  const inactiveSortedForTable=inactiveCustomers.slice().sort((a,b)=>{
    if(inactiveCustomerSort==='tier'){
      return (inactiveTierRank[b.cls]||0)-(inactiveTierRank[a.cls]||0) || b.val-a.val || b.daysSince-a.daysSince;
    }
    if(inactiveCustomerSort==='risk'){
      return (inactiveRiskRank[b.risk]||0)-(inactiveRiskRank[a.risk]||0) || b.daysSince-a.daysSince || b.val-a.val;
    }
    if(inactiveCustomerSort==='absence'){
      return b.daysSince-a.daysSince || b.lostRevenue-a.lostRevenue || b.val-a.val;
    }
    return b.val-a.val || b.lostRevenue-a.lostRevenue || b.daysSince-a.daysSince;
  });
  const inactiveDisplayedRows=inactiveSortedForTable.slice(0,inactiveCustTableLimit);
  const inactiveTableRows=inactiveDisplayedRows.map((x,i)=>`<tr><td>${i+1}</td><td>${htmlSafe(x.name)}</td><td>${x.lastDate?fmtDateAr(x.lastDate):'—'}</td><td>${htmlSafe(x.lastInvoiceNo||'—')}</td><td>${fmt0(x.daysSince)}</td><td>${x.visitsHtml}</td><td>${money(x.val)}</td><td><span class="smart-tag ${x.riskCls}">${x.risk}</span></td><td>${x.tierHtml}</td></tr>`).join('') || '<tr><td colspan="9">لا يوجد عملاء غير نشطين حسب شرط أكثر من 60 يوم بدون زيارة صافية.</td></tr>';
  const inactiveMoreButton=inactiveSortedForTable.length>inactiveCustTableLimit
    ? `<div class="new-cust-table-footer"><button class="new-cust-more-btn" data-smart-action="inactive-more" data-limit="${inactiveCustTableLimit+15}">اضغط لعرض المزيد ⌄</button><span>عرض ${fmt0(Math.min(inactiveCustTableLimit,inactiveCustomers.length))} من أصل ${fmt0(inactiveCustomers.length)} عميل غير نشط</span></div>`
    : `<div class="new-cust-table-footer"><span>تم عرض ${fmt0(inactiveCustomers.length)} من أصل ${fmt0(inactiveCustomers.length)} عميل غير نشط</span></div>`;

  const inactiveActivityExportBtn=function(kind){
    return `<button type="button" class="exp-btn exp-btn-excel customer-activity-export-btn" data-smart-action="customer-activity-export" data-kind="${kind}">⬇️ Excel</button>`;
  };
  const inactiveActivityPanelHead=function(title, kind){
    return `<div class="customer-activity-panel-head"><h3>${title}</h3>${inactiveActivityExportBtn(kind)}</div>`;
  };
  window.PETATOECustomerActivityFollowupExportData={
    aging:{
      title:'توزيع العملاء حسب مدة الغياب',
      sheetName:'Inactive Aging',
      fileName:'Customer_Activity_Inactive_Aging',
      headers:['الفئة','عدد العملاء'],
      rows:inactiveBuckets.map(function(x){return [x.label, x.count];})
    },
    inactive:{
      title:'جدول العملاء غير النشطين',
      sheetName:'Inactive Customers',
      fileName:'Customer_Activity_Inactive_Customers',
      headers:['#','العميل','آخر زيارة صافية','رقم آخر فاتورة','أيام الغياب','عدد الزيارات','إجمالي الإنفاق','مستوى الخطورة','تصنيف العميل'],
      rows:inactiveSortedForTable.map(function(x,i){return [i+1,x.name,x.lastDate?fmtDateAr(x.lastDate):'—',x.lastInvoiceNo||'—',fmt0(x.daysSince),fmt0(x.visits),customerCompareNum?customerCompareNum(x.val):Number(x.val||0),x.risk,x.cls];})
    },
    recovery:{
      title:'فرص الاسترجاع Recovery Opportunities',
      sheetName:'Recovery Opportunities',
      fileName:'Customer_Activity_Recovery_Opportunities',
      headers:['#','العميل','آخر فاتورة','رقم آخر فاتورة','أيام الغياب','متوسط الإنفاق الشهري','القيمة المفقودة المتوقعة','التصنيف','فرصة الاسترجاع'],
      rows:inactiveCustomers.map(function(x,i){return [i+1,x.name,x.lastDate?fmtDateAr(x.lastDate):'—',x.lastInvoiceNo||'—',fmt0(x.daysSince),Number(x.monthlyAvg||0),Number(x.lostRevenue||0),x.cls,x.recovery];})
    }
  };

  // Contract Candidates Report - candidates for annual / periodic contracts inside Smart Reports > Customers.
  // Uses the same prepared Customer Value rows, but with adaptive scoring so the report always ranks the best real customers in the selected period.
  const contractCandidateLimit=Math.min(100, Math.max(10, Number(window.contractCandidateLimit || 10)));
  const contractScoreClass=(score)=>score>=80?'':(score>=60?'mid':'low');
  const contractRecommendationMeta=(score)=>{
    if(score>=80) return {label:'عقد سنوي',cls:'annual',ico:'⭐',desc:'أولوية عالية للتعاقد السنوي'};
    if(score>=60) return {label:'عقد توريد دوري',cls:'supply',ico:'🔵',desc:'مناسب لاتفاقية توريد شهرية أو ربع سنوية'};
    return {label:'متابعة للتعاقد',cls:'follow',ico:'🟠',desc:'مرشح للمتابعة قبل عرض عقد رسمي'};
  };
  const petatoeIsCashAggregateCustomer=(name)=>{
    const normalized=String(name||'').trim().replace(/[ً-ٰٟ]/g,'').replace(/ى/g,'ي').replace(/\s+/g,' ').toLowerCase();
    return normalized==='كاش' || normalized==='نقدي' || normalized==='عميل كاش' || normalized==='عميل نقدي';
  };
  const contractSourceRows=(allCustomerValueRows||[]).filter(x=>{
    if(petatoeIsCashAggregateCustomer(x && x.name)) return false;
    return Number(x.val||0)>0 || Number(x.visits||0)>0;
  });
  const contractMaxValue=Math.max(1,...contractSourceRows.map(x=>Number(x.val||0)));
  const contractMaxVisits=Math.max(1,...contractSourceRows.map(x=>Number(x.visits||0)));
  const contractMaxMonths=Math.max(1,...contractSourceRows.map(x=>(x.visitMonths||[]).length));
  const allContractCandidates=contractSourceRows.map(x=>{
    const visits=Number(x.visits||0);
    const val=Number(x.val||0);
    const months=(x.visitMonths||[]).length;
    const days=Number.isFinite(x.daysSince)?x.daysSince:999;

    // Adaptive score: compares the customer against the same report population and keeps the old business logic as a boost.
    const valueScore=Math.min(35,(val/contractMaxValue)*35) + (val>=50000?5:val>=25000?3:val>=10000?2:0);
    const invoiceScore=Math.min(25,(visits/contractMaxVisits)*25) + (visits>=50?5:visits>=30?3:visits>=15?2:0);
    const monthsScore=Math.min(20,(months/contractMaxMonths)*20) + (months>=8?3:months>=6?2:months>=4?1:0);
    const activityScore=days<=30?17:days<=45?15:days<=75?11:days<=120?7:days<=180?4:1;
    const tierBoost=x.cls==='VIP'?8:(x.cls==='Active'?4:0);
    const score=Math.max(0,Math.min(100,Math.round(valueScore+invoiceScore+monthsScore+activityScore+tierBoost)));
    const meta=contractRecommendationMeta(score);
    const reason=[
      `إجمالي إنفاق ${money(val)}`,
      `${fmt0(visits)} زيارة صافية`,
      `${fmt0(months)} شهر نشاط`,
      `آخر زيارة منذ ${fmt0(days)} يوم`,
      `التصنيف الحالي: ${htmlSafe(x.cls||'—')}`
    ].join(' — ');
    return {...x,contractScore:score,contractMeta:meta,contractReason:reason};
  }).sort((a,b)=>b.contractScore-a.contractScore || b.val-a.val || b.visits-a.visits).slice(0,100);
  const displayedContractCandidates=allContractCandidates.slice(0,contractCandidateLimit);
  window.__petatoeContractCandidateDetails=allContractCandidates.map(x=>({
    name:x.name||'—', value:x.val||0, visits:x.visits||0, months:(x.visitMonths||[]).length,
    lastDate:x.lastDate?fmtDateAr(x.lastDate):'—', days:x.daysSince||0, score:x.contractScore||0,
    recommendation:(x.contractMeta&&x.contractMeta.label)||'—', recommendationDesc:(x.contractMeta&&x.contractMeta.desc)||'—', tier:x.cls||'—',
    reason:x.contractReason||'', avgInvoice:x.avgInvoice||0, lastInvoiceValue:x.lastInvoiceValue||0
  }));
  const contractReasonHtml=(x,idx)=>{
    const chips=[];
    if((x.contractScore||0)>=80) chips.push('<span class="contract-reason-chip good">⭐ أولوية عالية</span>');
    if((x.val||0)>=contractMaxValue*.70) chips.push('<span class="contract-reason-chip good">💰 إنفاق قوي</span>');
    if((x.visits||0)>=contractMaxVisits*.55) chips.push('<span class="contract-reason-chip info">🔁 زيارات متكررة</span>');
    if(((x.visitMonths||[]).length)>=Math.max(3,Math.ceil(contractMaxMonths*.50))) chips.push('<span class="contract-reason-chip info">📅 نشاط منتظم</span>');
    if((x.daysSince||999)<=30) chips.push('<span class="contract-reason-chip good">🟢 زيارة قريبة</span>');
    if(String(x.cls||'').toUpperCase()==='VIP') chips.push('<span class="contract-reason-chip warn">👑 VIP</span>');
    if(!chips.length) chips.push('<span class="contract-reason-chip warn">🟠 قابل للمتابعة</span>');
    const summary=(x.contractScore||0)>=80?smartReportT('summary.strongSpend','إنفاق قوي + نشاط منتظم'):((x.contractScore||0)>=60?smartReportT('summary.goodActivity','نشاط جيد + فرصة توريد دوري'):smartReportT('summary.followUp','فرصة متابعة قبل التعاقد'));
    return `<div class="contract-reason-compact"><div class="contract-reason-chips">${chips.slice(0,4).join('')}</div><div class="contract-reason-summary">${summary}</div><button type="button" class="contract-reason-btn" data-contract-reason-index="${idx}" data-smart-action="contract-reason" data-index="${idx}">عرض التفاصيل 🔍</button></div>`;
  };
  const topContractCandidate=allContractCandidates[0] || {name:'—',contractScore:0,val:0,contractMeta:{label:'—',desc:'—',cls:'follow'}};
  const contractCandidatesCount=allContractCandidates.length;
  const contractPotentialSales=allContractCandidates.reduce((s,x)=>s+(x.val||0),0);
  const contractInvoicesCount=allContractCandidates.reduce((s,x)=>s+(x.visits||0),0);
  const contractAvgScore=safeDiv(allContractCandidates.reduce((s,x)=>s+(x.contractScore||0),0),contractCandidatesCount);
  const contractCandidateRows=displayedContractCandidates.map((x,i)=>{
    const scoreCls=contractScoreClass(x.contractScore);
    return `<tr>
      <td>${i+1}</td>
      <td>${htmlSafe(x.name)}</td>
      <td>${money(x.val)}</td>
      <td>${fmt0(x.visits)}</td>
      <td>${fmt0((x.visitMonths||[]).length)}</td>
      <td>${x.lastDate?fmtDateAr(x.lastDate):'—'}</td>
      <td>${fmt0(x.daysSince)}</td>
      <td><span class="contract-score ${scoreCls}">${fmt0(x.contractScore)}</span></td>
      <td><span class="contract-tag ${x.contractMeta.cls}">${x.contractMeta.ico} ${x.contractMeta.label}</span></td>
      <td class="contract-reason-cell">${contractReasonHtml(x,i)}</td>
      <td>${x.tierHtml||'<span class="smart-tag info">—</span>'}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="11">${smartReportHtml('empty.noContractCandidateData','لا توجد بيانات عملاء كافية داخل الفترة المختارة لاحتساب مرشحين للتعاقد.')}</td></tr>`;
  const contractCandidateMoreButton=allContractCandidates.length>contractCandidateLimit
    ? `<div class="new-cust-table-footer"><button class="new-cust-more-btn" data-smart-action="contract-candidate-more" data-limit="${Math.min(100, contractCandidateLimit+10)}">اضغط لعرض المزيد ⌄</button><span>عرض ${fmt0(Math.min(contractCandidateLimit,allContractCandidates.length))} من أصل ${fmt0(allContractCandidates.length)} عميل مرشح</span></div>`
    : `<div class="new-cust-table-footer"><span>تم عرض ${fmt0(allContractCandidates.length)} من أصل ${fmt0(allContractCandidates.length)} عميل مرشح</span></div>`;

  const vanRows=vanAvgRev.map(v=>`<tr><td>${v[0]}</td><td>${fmt0(v[2])}</td><td>${money(v[1])}</td><td>${money(v[3])}</td><td>${safeDiv(v[1],total)*100 .toFixed?'' : ''}</td></tr>`).join('');
  const vanRowsFixed=vanAvgRev.map(v=>`<tr><td>${v[0]}</td><td>${fmt0(v[2])}</td><td>${money(v[1])}</td><td>${money(v[3])}</td><td>${safeDiv(v[1],total).toLocaleString('en-US',{style:'percent',maximumFractionDigits:1})}</td></tr>`).join('');
  const weakServices=serviceSum.slice().reverse().slice(0,10);
  const servicesScopedData=smartServicesScopedData();
  const servicesScopedSum=Object.entries(groupSum(servicesScopedData,'item')).sort((a,b)=>b[1]-a[1]);
  const servicesWeakScoped=servicesScopedSum.slice().reverse().slice(0,10);
  const cashVal=(paySum.find(x=>String(x[0]).includes('نقد'))||['',0])[1];
  const networkVal=(paySum.find(x=>String(x[0]).includes('شبك'))||['',0])[1];


  // Advanced Smart Recommendations - dynamic, data-driven cards
  const recAtRiskCount=(typeof salesAtRiskRows!=='undefined' && salesAtRiskRows)?salesAtRiskRows.length:0;
  const recAtRiskValue=(typeof salesAtRiskRows!=='undefined' && salesAtRiskRows)?salesAtRiskRows.reduce((s,r)=>s+(r.value||0),0):0;
  const recWorstEffVan=(vanAvgRev||[]).filter(v=>(v[2]||0)>0).slice().sort((a,b)=>a[3]-b[3])[0]||['-',0,0,0];
  const recTopServiceOps=data.filter(r=>(r.item||'غير محدد')===topService[0]).length;
  const recTopServiceAvg=safeDiv(topService[1]||0,recTopServiceOps);
  const recAvgUpliftValue=(avg||0)*0.10*count;
  const recRetentionPotential=(oneTimeClients||0)*(avg||0)*0.35;
  const recForecastGap=Math.max(0,(aiForecast&&aiForecast.next?aiForecast.next:0)-runRate);
  const recBestDayLift=Math.max(0,(bestDay[1]||0)-dailyAvg);
  const recServiceConcentration=serviceTop5Share||0;
  const recLowRetention=clientRetention<45;
  const recPetFollowupCount=Math.max(0,oneTimeClients||0);
  const recDormantPetCareCount=(typeof inactiveCustomers!=='undefined' && inactiveCustomers)?inactiveCustomers.length:0;
  const recCapacityValue=Math.max(0,(bestDay[1]||0)-(dailyAvg||0));
  const recTopClientShare=safeDiv((topClient[1]||0),total||1)*100;
  const recGroomingLike=(serviceSum||[]).find(x=>/(groom|grooming|bath|باث|استحمام|جرو|تنظيف|قص|nail|اظافر|أظافر|تحميم)/i.test(String(x[0]||''))) || topService;
  const recGroomingOps=data.filter(r=>(r.item||'غير محدد')===recGroomingLike[0]).length;
  const recGroomingAvg=safeDiv(recGroomingLike[1]||0,recGroomingOps||1);
  const recWeakServiceName=(servicesWeakScoped&&servicesWeakScoped[0]?servicesWeakScoped[0][0]:(weakServices&&weakServices[0]?weakServices[0][0]:'خدمة منخفضة النشاط'));
  const recWeakServiceValue=(servicesWeakScoped&&servicesWeakScoped[0]?servicesWeakScoped[0][1]:(weakServices&&weakServices[0]?weakServices[0][1]:0));
  const recMonthlyRunway=Math.max(0,(aiForecast&&aiForecast.next?aiForecast.next:0)-(total||0));
  const recVipNearCount=Math.max(0,Math.round((clients.length||0)*0.08));
  const recExecutiveRisk=(recAtRiskCount>0 || recLowRetention || (aiForecast&&aiForecast.riskIndex>55));
  const smartRecommendations=[
    {cat:'management',tab:'advanced',prio:recExecutiveRisk?'عاجل':'متوسط',accent:'var(--cyan)',ico:'👑',title:'CEO Briefing يومي للإدارة',desc:`ابدأ يومك بأهم ${fmt0(Math.min(5,Math.max(1,recAtRiskCount||1)))} نقاط قرار: العملاء المعرضون للفقد، الخدمة الأعلى، والسيارة الأكثر كفاءة.`,impact:recExecutiveRisk?'قرار فوري':'متابعة',confidence:'93%',report:'Executive',detail:['راجع الكارت التنفيذي أعلى قسم التوصيات يوميًا.', 'ابدأ بالإجراء صاحب أعلى أثر مالي.', 'حوّل التوصيات الحرجة إلى مهام متابعة يومية.']},
    {cat:'pets',tab:'customers',prio:recPetFollowupCount>50?'عالي':'متوسط',accent:'var(--pink)',ico:'🐾',title:'برنامج متابعة أول زيارة للحيوان الأليف',desc:`يوجد ${fmt0(recPetFollowupCount)} عميل/حيوان أليف بزيارة واحدة فقط. المتابعة خلال 7-14 يوم ترفع فرصة العودة.`,impact:money((recPetFollowupCount||0)*(avg||0)*0.28),confidence:'87%',report:'تحليل العملاء',detail:['أرسل رسالة متابعة بعد أول زيارة تتضمن اسم الحيوان إن كان متاحًا.', 'اعرض باقة زيارة ثانية منخفضة الاحتكاك.', 'تابع نسبة العودة من أول زيارة إلى ثاني زيارة شهريًا.']},
    {cat:'pets',tab:'customers',prio:recDormantPetCareCount>20?'عالي':'متوسط',accent:'var(--pink)',ico:'🛁',title:'حيوانات تحتاج تذكير بدورة العناية',desc:`${fmt0(recDormantPetCareCount)} عميل غير نشط يمكن اعتباره فرصة تذكير بدورة Grooming / Bath / Care.`,impact:money((recDormantPetCareCount||0)*(avg||0)*0.22),confidence:'84%',report:'Customer 360',detail:['استهدف العملاء الغائبين أكثر من 60 يوم برسالة رعاية لا رسالة بيع مباشرة.', 'اربط التذكير بآخر خدمة حصل عليها الحيوان.', 'ابدأ بالعملاء الأعلى إنفاقًا ثم الأقل.']},
    {cat:'profit',tab:'services',prio:'عالي',accent:'var(--green)',ico:'💎',title:'تركيز التسويق على خدمة العناية الأعلى قيمة',desc:`${htmlSafe(recGroomingLike[0]||topService[0])} تحقق متوسط ${money(recGroomingAvg)} للعملية. دعمها بحملة موجهة قد يرفع الربحية.`,impact:money((recGroomingLike[1]||0)*0.12),confidence:'89%',report:'تحليل الخدمات',detail:['ضع الخدمة الأعلى في واجهة العروض.', 'اقترح Add-on مناسب وقت الحجز.', 'راقب هامش الخدمة وليس الإيراد فقط عند توفر التكلفة.']},
    {cat:'capacity',tab:'sales',prio:'متوسط',accent:'var(--orange)',ico:'⏱️',title:'إدارة الطاقة التشغيلية في أيام الذروة',desc:`أفضل يوم هو ${htmlSafe(bestDay[0])} بقيمة ${money(bestDay[1]||0)}. فرق الأداء عن المتوسط ${money(recCapacityValue)}.`,impact:money(recCapacityValue),confidence:'88%',report:'Heatmap',detail:['زود السعة التشغيلية في الأيام الأعلى طلبًا.', 'جهز عروض خفيفة للأيام الهادئة بدل الخصم العام.', 'قارن عدد العمليات مع متوسط الفاتورة لمعرفة سبب الذروة.']},
    {cat:'management',tab:'advanced',prio:recTopClientShare>12?'عالي':'متوسط',accent:'var(--cyan)',ico:'📌',title:'تركيز الإيراد على عميل رئيسي',desc:`أفضل عميل يمثل ${fmt(recTopClientShare)}% تقريبًا من إجمالي الإيراد. النسبة العالية تحتاج خطة حماية وولاء.`,impact:money((topClient[1]||0)*0.15),confidence:'81%',report:'Customer 360',detail:['افتح ملف أفضل العملاء في Customer 360.', 'صمم لهم مزايا VIP بدون خصم كبير.', 'راقب أي انخفاض مفاجئ في زياراتهم.']},
    {cat:'services',tab:'services',prio:'متوسط',accent:'var(--blue)',ico:'🧼',title:'إنعاش خدمة منخفضة النشاط',desc:`${htmlSafe(recWeakServiceName)} من أقل الخدمات نشاطًا بقيمة ${money(recWeakServiceValue||0)}. اختبر عرضًا محدودًا قبل إيقافها.`,impact:money((avg||0)*Math.max(5,Math.round(count*0.03))),confidence:'75%',report:'تحليل الخدمات',detail:['اختبر الخدمة ضمن Bundle بدل بيعها منفردة.', 'اسأل العملاء عن سبب ضعف الطلب عليها.', 'لو لم تتحسن خلال شهرين راجع تسعيرها أو طريقة عرضها.']},
    {cat:'forecast',tab:'forecast',prio:(aiForecast&&aiForecast.riskIndex>55)?'عالي':'متوسط',accent:'var(--red)',ico:'🔮',title:'تحذير مبكر من فجوة الشهر القادم',desc:`التوقع القادم ${money(aiForecast.next||0)} مع مؤشر مخاطر ${fmt0(aiForecast.riskIndex||0)}%.`,impact:money(recMonthlyRunway),confidence:`${fmt0(aiForecast.confidence||0)}%`,report:'التوقعات',detail:['راجع أول أسبوع من الشهر القادم مبكرًا.', 'فعّل عروض استرجاع العملاء قبل نهاية الشهر.', 'اربط الهدف الشهري بلوحة المتابعة اليومية.']},
    {cat:'customers',tab:'customers',prio:recVipNearCount>5?'عالي':'متوسط',accent:'var(--purple)',ico:'💎',title:'عملاء قريبون من VIP',desc:`يوجد تقريبًا ${fmt0(recVipNearCount)} عميل يمكن دفعهم لمستوى VIP عبر عرض ترقية أو باقة ولاء.`,impact:money(recVipNearCount*(avg||0)*0.45),confidence:'78%',report:'تحليل العملاء',detail:['حدد العملاء الأعلى إنفاقًا غير المصنفين VIP.', 'اعرض ترقية تعتمد على قيمة وليس خصم مباشر.', 'تابع التحول من Gold/Silver إلى VIP.']},
    {cat:'revenue',tab:'sales',prio:'عالي',accent:'var(--green)',ico:'💸',title:'زيادة الإيراد من أفضل يوم تشغيل',desc:`أفضل يوم تشغيل هو ${htmlSafe(bestDay[0])} بقيمة ${money(bestDay[1]||0)}. كرر نفس نمط التشغيل والعروض في الأيام القريبة.`,impact:money(recBestDayLift),confidence:'92%',report:'Heatmap',detail:['راجع عدد العمالة والسيارات في أفضل يوم.', 'كرر العرض أو الباقة الأكثر بيعًا في نفس اليوم.', 'قارن اليوم بأضعف يوم لمعرفة سبب الفرق.']},
    {cat:'customers',tab:'customers',prio:recAtRiskCount?'عاجل':'متوسط',accent:'var(--red)',ico:'⚠️',title:'استرجاع العملاء المعرضين للفقد',desc:recAtRiskCount?`يوجد ${fmt0(recAtRiskCount)} عميل عالي القيمة متوقف نسبيًا بإجمالي إنفاق ${money(recAtRiskValue)}.`:`لا توجد مخاطر كبيرة واضحة، لكن راقب العملاء قليلي التكرار.`,impact:money(recAtRiskValue*0.18),confidence:recAtRiskCount?'88%':'74%',report:'Customer 360',detail:['ابدأ بالأعلى إنفاقًا والأطول غيابًا.', 'اعرض كود خصم أو خدمة مجانية محدودة المدة.', 'سجل نتيجة التواصل لمتابعة معدل الاسترجاع.']},
    {cat:'customers',tab:'customers',prio:oneTimeClients>50?'عالي':'متوسط',accent:'var(--orange)',ico:'🎯',title:'تحويل عملاء المرة الواحدة إلى عملاء متكررين',desc:`${fmt0(oneTimeClients)} عميل قاموا بعملية واحدة فقط. استهدافهم بعرض Retention يمكن أن يرفع التكرار.`,impact:money(recRetentionPotential),confidence:'86%',report:'تحليل العملاء',detail:['أرسل عرض زيارة ثانية خلال 7-14 يوم.', 'افصل العملاء حسب قيمة أول فاتورة.', 'تابع نسبة الرجوع بعد الحملة.']},
    {cat:'services',tab:'services',prio:'عالي',accent:'var(--purple)',ico:'🐾',title:'تحويل الخدمة الأعلى إلى Bundle',desc:`${htmlSafe(topService[0])} تقود الإيراد بمتوسط ${money(recTopServiceAvg)} للعملية. اربطها بخدمة مكملة لرفع الفاتورة.`,impact:money(recTopServiceOps*recTopServiceAvg*0.12),confidence:'90%',report:'تحليل الخدمات',detail:['كوّن باقة من الخدمة الأعلى + خدمة مكملة.', 'اختبر سعرين مختلفين لمدة أسبوع.', 'راقب متوسط الفاتورة قبل وبعد الباقة.']},
    {cat:'vehicles',tab:'vehicles',prio:'متوسط',accent:'var(--blue)',ico:'🚐',title:'نسخ نمط أفضل سيارة على باقي الأسطول',desc:`${htmlSafe(bestEffVan[0])} تحقق أعلى متوسط عملية ${money(bestEffVan[3]||0)}. استخدمها كمرجع تشغيل.`,impact:`+${fmt(safeDiv((bestEffVan[3]||0)-(recWorstEffVan[3]||0),recWorstEffVan[3]||1)*100)}%`,confidence:'91%',report:'تحليل السيارات',detail:['قارن المنطقة والسائق والتوقيت مع أقل سيارة.', 'انقل جزء من نمط التوزيع للسيارات الضعيفة.', 'راقب التحسن أسبوعيًا وليس شهريًا فقط.']},
    {cat:'vehicles',tab:'vehicles',prio:(recWorstEffVan[0]&&recWorstEffVan[0]!=='-')?'عالي':'متوسط',accent:'var(--cyan)',ico:'🛠️',title:'معالجة السيارة الأقل كفاءة',desc:`${htmlSafe(recWorstEffVan[0])} أقل متوسط عملية ${money(recWorstEffVan[3]||0)}. راجع خط السير أو نوع الطلبات.`,impact:money(Math.max(0,(bestEffVan[3]||0)-(recWorstEffVan[3]||0))*(recWorstEffVan[2]||0)),confidence:'84%',report:'تحليل السيارات',detail:['افحص هل المشكلة من المنطقة أم وقت التشغيل.', 'راجع عدد العمليات مقابل قيمة العملية.', 'جرب إعادة توزيع مؤقت لمدة أسبوع.']},
    {cat:'revenue',tab:'sales',prio:'عالي',accent:'var(--pink)',ico:'📈',title:'رفع متوسط الفاتورة 10%',desc:`متوسط الفاتورة الحالي ${money(avg)}. رفعه بنسبة 10% يعطي فرصة إضافية تقريبية دون زيادة عدد العمليات.`,impact:money(recAvgUpliftValue),confidence:'82%',report:'تحليل المبيعات',detail:['اعرض Upsell وقت الدفع.', 'استخدم باقات ثابتة بدل بيع الخدمة منفردة.', 'راقب متوسط الفاتورة يوميًا بعد التطبيق.']},
    {cat:'profit',tab:'services',prio:recServiceConcentration>70?'عالي':'متوسط',accent:'var(--yellow)',ico:'🧩',title:'تقليل الاعتماد على أعلى 5 خدمات',desc:`أعلى 5 خدمات تمثل ${fmt(recServiceConcentration)}% من الإيراد. لو النسبة عالية، النشاط معرض لتذبذب الخدمة الواحدة.`,impact:`${fmt(recServiceConcentration)}%`,confidence:'79%',report:'تحليل الخدمات',detail:['روّج للخدمات الأقل ظهورًا ولكن ذات هامش جيد.', 'اعمل باقات Cross-sell.', 'تابع مساهمة كل خدمة شهريًا.']},
    {cat:'revenue',tab:'sales',prio:'متوسط',accent:'var(--green)',ico:'💳',title:'تعزيز طريقة الدفع الأعلى',desc:`طريقة الدفع الأعلى هي ${htmlSafe(topPay[0])} بقيمة ${money(topPay[1]||0)}. استخدمها في عروض أسرع تحصيلًا.`,impact:money((topPay[1]||0)*0.05),confidence:'76%',report:'طرق الدفع',detail:['اجعل عروض التحصيل الأسرع واضحة للعميل.', 'راقب طرق الدفع ذات التأخير أو الانخفاض.', 'قارن الإيراد حسب طريقة الدفع شهريًا.']},
    {cat:'customers',tab:'customers',prio:recLowRetention?'عالي':'متوسط',accent:'var(--orange)',ico:'🔁',title:'تحسين معدل الاحتفاظ بالعملاء',desc:`معدل الاحتفاظ الحالي ${fmt(clientRetention)}%. ${recLowRetention?'النسبة تحتاج حملة عودة واضحة.':'النسبة جيدة ويمكن تحسينها ببرنامج ولاء.'}`,impact:`${fmt(clientRetention)}%`,confidence:'85%',report:'تحليل العملاء',detail:['قسّم العملاء إلى VIP / Active / At Risk.', 'استخدم رسائل مختلفة لكل شريحة.', 'تابع معدل الرجوع خلال 30 يوم.']},
    {cat:'management',tab:'customers',prio:'متوسط',accent:'var(--blue)',ico:'🏆',title:'نموذج العميل المثالي',desc:`أفضل عميل هو ${htmlSafe(topClient[0])} وأفضل خدمة هي ${htmlSafe(topService[0])}. استخدم النمط لفهم العميل المثالي.`,impact:money((topClient[1]||0)*0.10),confidence:'80%',report:'Customer 360',detail:['افتح Customer 360 لأفضل العملاء.', 'استخرج الخدمات المشتركة بينهم.', 'حوّل النمط إلى عرض موجه لعملاء مشابهين.']}
  ];
  const ceoUrgentCount=smartRecommendations.filter(r=>String(r.prio).includes('عاجل')).length;
  const ceoHighCount=smartRecommendations.filter(r=>String(r.prio).includes('عالي')).length;
  const ceoGrowthCount=smartRecommendations.filter(r=>['revenue','profit','pets','services'].includes(r.cat)).length;
  const ceoBestAction=recAtRiskCount?`استرجاع ${fmt0(recAtRiskCount)} عميل عالي القيمة قد يحمي ${money(recAtRiskValue*0.18)} من الإيراد.`:`رفع متوسط الفاتورة 10% قد يضيف ${money(recAvgUpliftValue)} تقريبًا.`;
  const ceoOpportunity=`باقة ${htmlSafe(topService[0])} + خدمة مكملة قد ترفع الإيراد المتوقع ${money(recTopServiceOps*recTopServiceAvg*0.12)}.`;
  const ceoRisk=recLowRetention?`معدل الاحتفاظ ${fmt(clientRetention)}% ويحتاج حملة عودة.`:`مؤشر المخاطر المتوقع ${fmt0(aiForecast.riskIndex||0)}%.`;
  try{
    window.petatoeSmartRecommendationsCache=smartRecommendations;
  }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
  const ceoBriefHtml=`<div class="petatoe-ceo-brief">
    <div class="petatoe-ceo-head"><div><h4>👑 PETATOE CEO Briefing</h4><p>ملخص تنفيذي سريع مبني على بيانات العملاء والخدمات والإيرادات والتوقعات، بدون تغيير أي حسابات في التقارير القديمة.</p></div><span class="petatoe-ceo-badge">AI Decision Support</span></div>
    <div class="petatoe-ceo-grid"><div class="petatoe-ceo-kpi petatoe-ceo-hoverable" onmouseenter="petatoeShowCeoKpiTooltip(event,'growth')" onmouseleave="petatoeScheduleHideCeoKpiTooltip()"><span>فرص نمو</span><b>${fmt0(ceoGrowthCount)} توصيات</b><small>Revenue / Services / Pets</small></div><div class="petatoe-ceo-kpi petatoe-ceo-hoverable" onmouseenter="petatoeShowCeoKpiTooltip(event,'high')" onmouseleave="petatoeScheduleHideCeoKpiTooltip()"><span>أولوية عالية</span><b>${fmt0(ceoHighCount)} عناصر</b><small>تحتاج متابعة إدارية</small></div><div class="petatoe-ceo-kpi petatoe-ceo-hoverable" onmouseenter="petatoeShowCeoKpiTooltip(event,'urgent')" onmouseleave="petatoeScheduleHideCeoKpiTooltip()"><span>تدخل عاجل</span><b>${fmt0(ceoUrgentCount)} عنصر</b><small>${ceoUrgentCount?'ابدأ الآن':'لا يوجد عاجل واضح'}</small></div><div class="petatoe-ceo-kpi"><span>حجم البيانات</span><b>${fmt0(count)} ${smartReportHtml('summary.operation','عملية')}</b><small>${periodLabel(y)}</small></div></div>
    <div class="petatoe-ceo-actions"><div class="petatoe-ceo-action high"><b>أهم قرار اليوم</b><span>${ceoBestAction}</span></div><div class="petatoe-ceo-action good"><b>أكبر فرصة نمو</b><span>${ceoOpportunity}</span></div><div class="petatoe-ceo-action info"><b>أكبر نقطة متابعة</b><span>${ceoRisk}</span></div></div>
  </div>`;

  const smartRecCards=smartRecommendations.map((r,i)=>{
    const recTarget=petatoeResolveSmartRecTarget(r);
    const recReportName=String(r.report||'التقرير المرتبط').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<div class="smart-rec-pro-card" data-rec-cat="${r.cat}" data-rec-target="${recTarget}" style="--accent:${r.accent}">
    <div class="smart-rec-pro-top"><span class="smart-rec-pro-ico">${r.ico}</span><span class="smart-rec-priority">${r.prio}</span></div>
    <h4>${r.title}</h4><p>${r.desc}</p>
    <div class="smart-rec-metrics"><div class="smart-rec-metric"><small>الأثر المتوقع</small><b>${r.impact}</b></div><div class="smart-rec-metric"><small>درجة الثقة</small><b>${r.confidence}</b></div></div>
    <div class="smart-rec-actions"><button class="smart-rec-action-btn" data-smart-action="recommendation-toggle">عرض السبب</button><button class="smart-rec-action-btn smart-rec-open-btn" data-smart-action="recommendation-open" data-target="${recTarget}" data-report="${recReportName}">فتح التقرير</button><span class="smart-rec-priority">${r.report}</span></div>
    <div class="smart-rec-detail"><b>خطة التنفيذ السريعة:</b><ul>${r.detail.map(x=>`<li>${x}</li>`).join('')}</ul></div>
  </div>`;
  }).join('');

  smartSafeHTML('smartReportsArea',`
    <div class="smart-actions-row" id="smartTabs"><button class="smart-pill active" data-smart-tab="overview" data-smart-action="smart-tab" data-tab="overview">ملخص الأداء</button><button class="smart-pill" data-smart-tab="sales" data-smart-action="smart-tab" data-tab="sales">تحليل المبيعات</button><button class="smart-pill" data-smart-tab="vehicles" data-smart-action="smart-tab" data-tab="vehicles">تحليل السيارات</button><button class="smart-pill" data-smart-tab="customers" data-smart-action="smart-tab" data-tab="customers">تحليل العملاء</button><button class="smart-pill" data-smart-tab="services" data-smart-action="smart-tab" data-tab="services">تحليل الخدمات</button><button class="smart-pill" data-smart-tab="advanced" data-smart-action="smart-tab" data-tab="advanced">مركز التقارير المتقدمة</button><button class="smart-pill smart-pill-merged-ai" data-smart-tab="forecast" data-smart-action="smart-tab" data-tab="forecast">التوقعات وذكاء الأعمال</button><button class="smart-pill" data-smart-tab="recommendations" data-smart-action="smart-tab" data-tab="recommendations">التوصيات</button></div>
    <div class="smart-tab-section active" data-smart-section="overview">${overviewCardsYearFilter}<div class="smart-exec-grid">
      <div class="smart-exec-kpi" style="--accent:var(--purple)">
        <button class="kpi-info-btn" type="button" aria-label="تفاصيل إجمالي المبيعات">💰</button>
        <div class="kpi-tooltip"><div class="tip-head"><span class="tip-ico">💰</span><span>إجمالي المبيعات</span></div><div class="tip-desc">يعرض إجمالي قيمة المبيعات للفترة أو السنة المحددة داخل التقارير الذكية.</div><div class="tip-grid"><div class="tip-row"><span>الفترة</span><b>${overviewCardsYearLabel}</b></div><div class="tip-row"><span>عدد الفواتير</span><b>${fmt0(cardInvoices.length)}</b></div><div class="tip-row"><span>عدد العمليات</span><b>${fmt0(cardCount)}</b></div><div class="tip-row"><span>متوسط الفاتورة</span><b>${money(cardAvg)}</b></div></div></div>
        <span>إجمالي المبيعات</span><b>${money(cardTotal)}</b><small>${overviewCardsYearLabel}</small>
      </div>
      <div class="smart-exec-kpi" style="--accent:var(--cyan)">
        <button class="kpi-info-btn" type="button" aria-label="تفاصيل عدد الفواتير">🧾</button>
        <div class="kpi-tooltip"><div class="tip-head"><span class="tip-ico">🧾</span><span>عدد الفواتير</span></div><div class="tip-desc">يوضح عدد الفواتير الفريدة مقارنة بعدد العمليات الفعلية المسجلة في البيانات.</div><div class="tip-grid"><div class="tip-row"><span>عدد الفواتير</span><b>${fmt0(cardInvoices.length)}</b></div><div class="tip-row"><span>عدد العمليات</span><b>${fmt0(cardCount)}</b></div><div class="tip-row"><span>نطاق البيانات</span><b>${cardDateRange.first?fmtDateAr(cardDateRange.first):"—"} - ${cardDateRange.last?fmtDateAr(cardDateRange.last):"—"}</b></div></div></div>
        <span>عدد الفواتير</span><b>${fmt0(cardInvoices.length)}</b><small>${fmt0(cardCount)} عملية</small>
      </div>
      <div class="smart-exec-kpi" style="--accent:var(--green)">
        <button class="kpi-info-btn" type="button" aria-label="تفاصيل معدل الاحتفاظ بالعملاء">👥</button>
        <div class="kpi-tooltip"><div class="tip-head"><span class="tip-ico">👥</span><span>معدل الاحتفاظ بالعملاء</span></div><div class="tip-desc">يقيس نسبة العملاء المتكررين من إجمالي العملاء خلال الفترة المختارة.</div><div class="tip-grid"><div class="tip-row"><span>عملاء متكررون</span><b>${fmt0(cardRepeatClients)}</b></div><div class="tip-row"><span>عملاء مرة واحدة</span><b>${fmt0(cardOneTimeClients)}</b></div><div class="tip-row"><span>إجمالي العملاء</span><b>${fmt0(cardClients.length)}</b></div></div></div>
        <span>معدل الاحتفاظ بالعملاء</span><b>${cardClientRetention.toFixed(1)}%</b><small>${fmt0(cardRepeatClients)} عميل متكرر</small>
      </div>
      <div class="smart-exec-kpi" style="--accent:var(--orange)">
        <button class="kpi-info-btn" type="button" aria-label="تفاصيل متوسط الفاتورة">📋</button>
        <div class="kpi-tooltip"><div class="tip-head"><span class="tip-ico">📋</span><span>متوسط الفاتورة</span></div><div class="tip-desc">يعرض متوسط قيمة الفاتورة مع متوسط الإيراد اليومي حسب البيانات الحالية.</div><div class="tip-grid"><div class="tip-row"><span>متوسط الفاتورة</span><b>${money(cardAvg)}</b></div><div class="tip-row"><span>متوسط يومي</span><b>${money(cardDailyAvg)}</b></div><div class="tip-row"><span>أيام التشغيل</span><b>${fmt0(cardDaysCount)}</b></div></div></div>
        <span>متوسط الفاتورة</span><b>${money(cardAvg)}</b><small>متوسط يومي ${money(cardDailyAvg)}</small>
      </div>
      <div class="smart-exec-kpi" style="--accent:var(--blue)">
        <button class="kpi-info-btn" type="button" aria-label="${smartReportHtml('overview.bestVehicleDetails','تفاصيل أكفأ سيارة')}">🚐</button>
        <div class="kpi-tooltip"><div class="tip-head"><span class="tip-ico">🚐</span><span>${smartReportHtml('overview.bestVehicle','أكفأ سيارة')}</span></div><div class="tip-desc">${smartReportHtml('overview.bestVehicleDescription','ترتيب السيارة حسب متوسط الإيراد لكل عملية خلال الفترة المختارة.')}</div><div class="tip-grid"><div class="tip-row"><span>${smartReportHtml('table.vehicle','السيارة')}</span><b>${cardBestEffVan[0]}</b></div><div class="tip-row"><span>${smartReportHtml('table.revenue','الإيراد')}</span><b>${money(cardBestEffVan[1]||0)}</b></div><div class="tip-row"><span>${smartReportHtml('table.operations','العمليات')}</span><b>${fmt0(cardBestEffVan[2]||0)}</b></div><div class="tip-row"><span>${smartReportHtml('table.averageTransaction','متوسط العملية')}</span><b>${money(cardBestEffVan[3]||0)}</b></div></div></div>
        <span>${smartReportHtml('overview.bestVehicle','أكفأ سيارة')}</span><b>${cardBestEffVan[0]}</b><small>${money(cardBestEffVan[3])} / ${smartReportHtml('units.operation','عملية')}</small>
      </div>
      <div class="smart-exec-kpi" style="--accent:var(--pink)">
        <button class="kpi-info-btn" type="button" aria-label="تفاصيل أفضل خدمة">⭐</button>
        <div class="kpi-tooltip"><div class="tip-head"><span class="tip-ico">⭐</span><span>أفضل خدمة</span></div><div class="tip-desc">الخدمة الأعلى تحقيقًا للمبيعات في الفترة المختارة من واقع البيانات المرفوعة.</div><div class="tip-grid"><div class="tip-row"><span>الخدمة</span><b>${cardTopService[0]}</b></div><div class="tip-row"><span>إجمالي المبيعات</span><b>${money(cardTopService[1])}</b></div><div class="tip-row"><span>عدد العمليات</span><b>${fmt0(overviewCardsData.filter(r=>(r.item||'غير محدد')===cardTopService[0]).length)}</b></div><div class="tip-row"><span>مساهمة أعلى 5 خدمات</span><b>${cardServiceTop5Share.toFixed(1)}%</b></div></div></div>
        <span>أفضل خدمة</span><b>${cardTopService[0]}</b><small>${money(cardTopService[1])}</small>
      </div>
    </div>

    <div class="smart-dash-grid smart-overview-stacked">
      <!-- PETATOE v3.5 DUPLICATE HEATMAP REMOVAL: Removed duplicate "Heatmap أيام الضغط" from Performance Summary; kept "خريطة المبيعات Heatmap" below. -->
      <div class="smart-panel" id="smartVehicleEfficiencyPanel"><div class="smart-panel-head-with-filters"><div><h3>🚐 ${smartReportHtml('vehicleEfficiency.title','تحليل كفاءة السيارات')}</h3></div>${smartVehicleEfficiencyFilterHtml()}</div><div class="smart-table-clean"><table><thead><tr><th>${smartReportHtml('table.vehicle','السيارة')}</th><th>${smartReportHtml('table.operationsCount','عدد العمليات')}</th><th>${smartReportHtml('table.revenue','الإيراد')}</th><th>${smartReportHtml('table.averageTransaction','متوسط العملية')}</th><th>${smartReportHtml('table.contribution','المساهمة')}</th></tr></thead><tbody id="smartVehicleEfficiencyBody">${smartVehicleEfficiencyRowsHtml()}</tbody></table></div></div>
    </div>

    <div class="sales-intel-section">
      


      


      <div class="sales-intel-grid">
        <div class="sales-intel-panel"><div class="chart-head sales-intel-monthly-head" style="align-items:flex-start;gap:12px;flex-wrap:wrap"><div><h3>📈 اتجاه المبيعات الشهري</h3></div>${salesIntelMonthlyFilterHtml()}<div class="report-control-group sales-intel-monthly-modes" style="margin-inline-start:auto">${salesIntelMonthlyMetricButtons()}</div></div><div class="sales-intel-chart tall"><canvas id="salesIntelMonthly"></canvas></div></div>
        <div class="sales-intel-panel"><div class="chart-head sales-intel-month-compare-head" style="align-items:flex-start;gap:12px;flex-wrap:wrap"><div><h3>📊 مقارنة شهر بشهر</h3></div><div class="report-control-group sales-intel-month-compare-modes" style="margin-inline-start:auto">${salesIntelMonthCompareMetricButtons()}</div></div><div class="sales-intel-chart"><canvas id="salesIntelMonthCompare"></canvas></div><div class="sales-intel-table" style="margin-top:10px"><table><thead><tr><th>الفترة</th><th>الحالي</th><th>السابق</th><th>الفرق</th><th>%</th></tr></thead><tbody>${salesComparisonRows.map(r=>`<tr><td>${r.tableLabel}</td><td>${money(r.current)}</td><td>${money(r.previous)}</td><td>${money(r.diff)}</td><td class="${r.diff>=0?'metric-up':'metric-down'}" style="color:${r.diff>=0?'#22c55e':'#ef4444'};font-weight:900">${r.pct.toFixed(1)}%</td></tr>`).join('')}</tbody></table></div></div>
        <div class="sales-intel-panel">
          <h3>📅 مقارنة سنة بسنة</h3>
          <p>${salesPrevYear} مقابل ${salesCurrentYear} شهريًا.</p>
          <div class="yoy-control-panel">
            <div class="yoy-year-buttons">${salesYoYYearButtons}</div>
            <div class="yoy-custom-row">
              <label class="yoy-check" data-smart-action="sales-yoy-custom-toggle">
                <input id="salesYoYCustomCheck" type="checkbox" ${salesYoYCustomMode?'checked':''}>
                مقارنة مخصصة بين سنتين
              </label>
              <div class="yoy-selects ${salesYoYCustomMode?'show':''}">
                <label>سنة الأساس
                  <select data-smart-action="sales-yoy-base">${salesYoYOptions}</select>
                </label>
                <label>سنة المقارنة
                  <select data-smart-action="sales-yoy-compare">${salesYoYOptions}</select>
                </label>
              </div>
            </div>
            <div class="yoy-active-badge">المقارنة النشطة: ${salesPrevYear} ↔ ${salesCurrentYear}</div>
          </div>
          <div class="sales-intel-chart"><canvas id="salesIntelYoY"></canvas></div>
        </div>
      </div>
      <div class="sales-intel-grid" style="grid-template-columns:1fr">
        <div class="sales-intel-panel"><h3>🔥 ${smartReportHtml('heatmap.title','خريطة المبيعات Heatmap')}</h3>${heatHtml}</div>
      </div>
      <div class="sales-intel-grid four">
        <div class="sales-intel-panel"><h3>👥 ${smartReportHtml('customers.oneTimeVsRepeat','عملاء مرة واحدة مقابل المتكررين')}</h3><div class="sales-intel-chart sm"><canvas id="salesIntelNewReturning"></canvas></div><div id="newReturningSummary" class="liquid-summary-row"></div></div>
        <div class="sales-intel-panel"><div class="smart-report-head-actions"><div><h3>🚨 ${smartReportHtml('customers.atRiskTitle','العملاء المعرضين للفقد')}</h3><p>${smartReportHtml('customers.atRiskSubtitle','عملاء لم يزوروا منذ أكثر من 60 يوم.')}</p></div><div class="smart-report-head-buttons">${salesAtRiskRows.length?`<button type="button" class="btn btn-green" data-smart-action="export-at-risk-clients">⬇️ ${smartReportHtml('actions.exportExcel','تصدير Excel')}</button>`:''}</div></div><div class="sales-intel-table"><table><thead><tr><th>${smartReportHtml('table.customer','العميل')}</th><th>${smartReportHtml('table.lastVisit','آخر زيارة')}</th><th>${smartReportHtml('table.days','الأيام')}</th><th>${smartReportHtml('table.spending','الإنفاق')}</th></tr></thead><tbody>${salesAtRiskRows.length?salesAtRiskRows.slice(0,window.smartAtRiskLimit||10).map(r=>`<tr><td>${r.name}</td><td>${r.last?fmtDateAr(r.last):'—'}</td><td>${fmt0(r.days)}</td><td>${money(r.value)}</td></tr>`).join(''):`<tr><td colspan="4">${smartReportHtml('customers.noAtRisk','لا يوجد عملاء معرضون للفقد حسب شرط 60 يوم.')}</td></tr>`}</tbody></table></div><div class="smart-table-actions">${salesAtRiskRows.length>(window.smartAtRiskLimit||10)?`<button type="button" class="btn btn-ghost" data-smart-action="at-risk-more">${smartReportHtml('actions.showMore','عرض المزيد')} (${Math.min(salesAtRiskRows.length,(window.smartAtRiskLimit||10)+10)} / ${salesAtRiskRows.length})</button>`:''}</div></div>
        <div class="sales-intel-panel sales-target-active-panel"><h3>🎯 ${smartReportHtml('target.monthlyTitle','مؤشر تحقيق الهدف الشهري')}</h3><button class="sales-target-side-toggle" data-smart-action="sales-target-toggle">✏️ ${smartReportHtml('target.editOrAdd','تعديل / إضافة الهدف')}</button><div class="sales-target-control-box"><div class="sales-target-year-row">${salesTargetYearButtons}</div><div class="sales-target-month-row">${salesTargetMonthButtons}</div></div><div id="salesTargetEditorPanel" class="sales-target-editor-panel"><div class="sales-target-editor-head"><b>${smartReportHtml('target.editOrAdd','تعديل / إضافة الهدف')}</b><button data-smart-action="sales-target-toggle">×</button></div><div class="sales-target-input-row"><div><label>${smartReportHtml('target.monthlyGoalFor','الهدف الشهري لشهر')} ${smartReportHtml('calendar.months.'+salesTargetMonthName,MAR[salesTargetMonthName])} ${salesTargetYear}</label><input id="salesTargetInput" class="sales-target-ready" type="number" min="0" step="0.01" value="${salesTarget}" placeholder="${smartReportHtml('target.enterGoalPlaceholder','اكتب الهدف بالريال')}"></div><button class="sales-target-edit-btn" data-smart-action="sales-target-enable-edit">✏️ ${smartReportHtml('target.editGoal','تعديل الهدف')}</button><button class="sales-target-save-btn" data-smart-action="sales-target-save" data-clear="false">💾 ${smartReportHtml('target.saveGoal','حفظ الهدف')}</button><button class="sales-target-clear-btn" data-smart-action="sales-target-save" data-clear="true">${smartReportHtml('target.restoreDefault','إرجاع الافتراضي')}</button></div></div><div class="sales-target-gauge-wrap"><div class="sales-target-gauge-card"><div class="sales-target-gauge-title">${smartReportHtml('target.achievementIndicator','مؤشر تحقيق الهدف')}</div><div class="gauge-target-side">${smartReportHtml('target.monthlyGoal','الهدف الشهري')}<b>${salesTarget?fmt0(salesTarget):'—'}</b>${smartReportHtml('units.sar','ريال سعودي')}</div><svg class="sales-target-gauge-svg" viewBox="0 0 320 205" aria-label="${smartReportHtml('target.monthlyTitle','مؤشر تحقيق الهدف الشهري')}"><path class="gauge-track" d="M40 150 A120 120 0 0 1 280 150"/><path class="gauge-arc red" pathLength="100" stroke-dasharray="32 68" stroke-dashoffset="0" d="M40 150 A120 120 0 0 1 280 150"/><path class="gauge-arc orange" pathLength="100" stroke-dasharray="33 67" stroke-dashoffset="-32" d="M40 150 A120 120 0 0 1 280 150"/><path class="gauge-arc green" pathLength="100" stroke-dasharray="35 65" stroke-dashoffset="-65" d="M40 150 A120 120 0 0 1 280 150"/><line class="gauge-tick" x1="62" y1="133" x2="73" y2="137"/><line class="gauge-tick" x1="101" y1="72" x2="109" y2="82"/><line class="gauge-tick" x1="160" y1="48" x2="160" y2="61"/><line class="gauge-tick" x1="219" y1="72" x2="211" y2="82"/><line class="gauge-tick" x1="258" y1="133" x2="247" y2="137"/><line class="gauge-needle" x1="160" y1="150" x2="${salesTargetNeedleX}" y2="${salesTargetNeedleY}"/><circle class="gauge-needle-core" cx="160" cy="150" r="9"/></svg><div class="gauge-scale"><span>0%</span><span>100%</span></div><div class="gauge-actual">${salesTarget?fmt(salesTargetActual):smartReportHtml('status.notSpecified','غير محدد')}</div><div class="gauge-currency">${smartReportHtml('units.sar','ريال سعودي')}</div><div class="gauge-status-line">${salesTarget?`${salesTargetPct.toFixed(1)}% ${smartReportHtml('target.ofMonthlyGoal','من الهدف الشهري')}`:smartReportHtml('target.noGoal','لم يتم إدخال هدف لهذا الشهر')}</div></div></div><div class="sales-target-kpi-grid"><div class="sales-target-kpi"><span>${smartReportHtml('target.actualMonthSales','مبيعات الشهر الفعلية')}</span><b>${money(salesTargetActual)}</b></div><div class="sales-target-kpi"><span>${smartReportHtml('target.savedGoal','الهدف المحفوظ')}</span><b>${salesTarget?money(salesTarget):'—'}</b></div><div class="sales-target-kpi"><span>${salesTargetActual>=salesTarget&&salesTarget?smartReportHtml('target.goalExceeded','تجاوز الهدف'):smartReportHtml('target.remaining','المتبقي لتحقيق الهدف')}</span><b>${salesTarget?(salesTargetActual>=salesTarget?money(salesTargetOver):money(salesTargetRemaining)):'—'}</b></div><div class="sales-target-kpi"><span>${smartReportHtml('target.operationsCustomers','عدد العمليات / العملاء')}</span><b>${fmt0(salesTargetTransactions)} / ${fmt0(salesTargetClients)}</b></div></div><div class="sales-target-month-note"><b>${salesTargetStatus}</b> — ${smartReportHtml('target.calculationNote','يتم حساب المؤشر من مبيعات {month} {year} فقط، مع الاحتفاظ بتاريخ أهداف الشهور السابقة وتطبيق أي تعديل على الشهر المختار وما بعده فقط.',{month:smartReportT('calendar.months.'+salesTargetMonthName,MAR[salesTargetMonthName]),year:salesTargetYear})}</div></div>
        <div class="sales-intel-panel"><h3>🔮 ${smartReportHtml('forecast.title','توقعات المبيعات')}</h3><p>${smartReportHtml('forecast.subtitle','اعتمادًا على Run Rate للشهور الفعلية الحالية.')}</p><div class="sales-alert-list"><div class="sales-alert good">${smartReportHtml('forecast.nextMonth','الشهر القادم')}: ${money(salesForecastNext)}</div><div class="sales-alert warn">${smartReportHtml('forecast.nextQuarter','الربع القادم')}: ${money(salesForecastQuarter)}</div><div class="sales-alert good">${smartReportHtml('forecast.yearEnd','نهاية السنة')}: ${money(salesForecastYearEnd)}</div></div></div>
      </div>
      <div class="sales-intel-panel"><h3>🧠 ${smartReportHtml('alerts.title','التنبيهات الذكية')}</h3><p>${smartReportHtml('alerts.subtitle','ملخص تلقائي لأهم الملاحظات من بيانات المبيعات الحالية.')}</p><div class="sales-alert-list">${salesAlerts.map(a=>`<div class="sales-alert ${a.type}" tabindex="0"><span>${a.text}</span><span class="sales-alert-info">ⓘ</span><div class="sales-alert-tooltip">${a.detail||`<b>${smartReportHtml('alerts.details','تفاصيل التنبيه')}</b><span>${smartReportHtml('alerts.noMoreDetails','لا توجد تفاصيل إضافية.')}</span>`}</div></div>`).join('')}</div></div>
    </div>

    </div>

    <div class="smart-tab-section" data-smart-section="sales">
      <div class="card"><div class="chart-head"><div><b>Monthly Trend 🗓️</b></div><div><div class="year-strip" id="smartSalesYearBtns"></div><div class="report-control-group" id="smartSalesTaxBtns1" style="margin-top:10px"></div></div></div><div class="chart xl"><canvas id="smartSalesTrendChart"></canvas></div></div>
      <div class="card" style="margin-top:16px"><div class="chart-head" style="align-items:flex-start;gap:12px;flex-wrap:wrap"><div><b id="smartQuarterTitle">Quarterly Comparison 🗓️</b><div id="smartQuarterCompareControls" class="smart-quarter-control-panel"></div></div><div class="report-control-group" id="smartSalesTaxBtns2"></div></div><div class="chart xl"><canvas id="smartQuarterChart"></canvas></div></div>
      <div class="card" style="margin-top:16px"><div class="card-title"><b>📊 تفاصيل الأرباع</b><div class="report-control-group" id="smartSalesTaxBtns3"></div></div><div class="table-wrap compact-table"><table id="smartQuarterTable"></table></div></div>
    </div>

    <div class="smart-tab-section" data-smart-section="customers">
      <div class="customer-analysis-tabs" role="tablist" aria-label="تبويبات تحليل العملاء">
        <button type="button" class="customer-analysis-tab ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='overview'?'active':''}" data-customer-analysis-tab="overview" data-smart-action="customer-analysis-tab" data-tab="overview"><b>🆕 متابعة العملاء الجدد</b><small>العملاء الجدد وقيمة العملاء</small></button>
        <button type="button" class="customer-analysis-tab ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='contracts'?'active':''}" data-customer-analysis-tab="contracts" data-smart-action="customer-analysis-tab" data-tab="contracts"><b>⭐ العملاء المرشحون للعقود</b><small>Score، ترشيح، توصيات العقود</small></button>
        <button type="button" class="customer-analysis-tab ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='compare'?'active':''}" data-customer-analysis-tab="compare" data-smart-action="customer-analysis-tab" data-tab="compare"><b>🔁 مقارنة العملاء بين عامين</b><small>نمو، تراجع، مفقودون، ترتيب وتورنادو</small></button>
        <button type="button" class="customer-analysis-tab ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='ai'?'active':''}" data-customer-analysis-tab="ai" data-smart-action="customer-analysis-tab" data-tab="ai"><b>📌 متابعة نشاط العملاء</b><small>غير النشطين، مدة الغياب، فرص الاسترجاع والاتجاهات</small></button>
      </div>

      <div class="customer-analysis-pane ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='overview'?'active':''}" data-customer-analysis-pane="overview">
        <div class="smart-dash-grid two smart-customers-stack">
      <div class="smart-panel">
        <div class="new-cust-report-head"><h3>🆕 العملاء الجدد خلال الشهر</h3><div class="new-cust-year-controls">${newCustYearButtons}</div></div>
        <p>يعرض العملاء الذين ظهرت أول معاملة لهم فعليًا في الشهر المختار، مقارنة بكل البيانات التاريخية المتاحة. إذا كان الشهر فارغًا فهذا يعني أن العملاء الموجودين سبق ظهورهم قبل هذا الشهر.</p>
        <div class="new-cust-controls">${newCustMonthButtons}</div>
        <div class="new-cust-kpis">
          <div class="new-cust-kpi"><span>العملاء الجدد</span><b>${fmt0(newCustomersCount)}</b><small>${newCustPeriodLabel}</small></div>
          <div class="new-cust-kpi"><span>مبيعات العملاء الجدد</span><b>${money(newCustomersTotal)}</b><small>من نفس الشهر</small></div>
          <div class="new-cust-kpi"><span>متوسط العميل الجديد</span><b>${money(newCustomersAvg)}</b><small>إجمالي / عدد العملاء</small></div>
          <div class="new-cust-kpi"><span>معدل التحويل</span><b>${newCustomersConversion.toLocaleString('en-US',{maximumFractionDigits:1})}%</b><small>عادوا أو نفذوا أكثر من عملية</small></div>
          <div class="new-cust-kpi"><span>أعلى عميل جديد</span><b>${topNewCustomer.name}</b><small>${money(topNewCustomer.totalValue)}</small></div>
        </div>
        <div class="new-cust-logic-note"><b>طريقة احتساب العملاء الجدد:</b><br>يتم احتساب العميل الجديد عند تاريخ أول معاملة للعميل في كل قاعدة البيانات، ثم يُعرض فقط إذا كانت أول معاملة داخل الشهر والسنة المختارة. أي أن العميل لا يُحتسب كعميل جديد مرة أخرى إذا كان له أي معاملة أقدم.</div>
      </div>

      <div class="new-cust-grid">
        <div class="smart-panel"><h3>📈 توزيع العملاء الجدد أسبوعيًا</h3><p>عدد العملاء الجدد حسب أسبوع أول معاملة داخل الشهر.</p><div class="new-cust-chart sm"><canvas id="newCustomersWeeklyChart"></canvas></div></div>
        <div class="smart-panel"><h3>💰 أعلى 10 عملاء جدد قيمة</h3><p>ترتيب العملاء الجدد حسب إجمالي مبيعاتهم في الشهر المختار.</p><div class="new-cust-chart sm"><canvas id="newCustomersTopValueChart"></canvas></div></div>
      </div>

      <div class="new-cust-grid single">
        <div class="smart-panel"><h3>📅 مقارنة العملاء الجدد بالشهور</h3><p>اتجاه اكتساب العملاء الجدد خلال شهور السنة المختارة.</p><div class="new-cust-chart sm"><canvas id="newCustomersTrendChart"></canvas></div></div>
      </div>

      <div class="smart-panel"><h3>📋 تفاصيل العملاء الجدد والمعاملات</h3><p>العميل، تاريخ أول معاملة، رقم الفاتورة، الخدمة، طريقة الدفع، عدد العمليات، إجمالي المبيعات، وآخر زيارة.</p><div class="smart-table-clean new-cust-table"><table><thead><tr><th>#</th><th>العميل</th><th>أول معاملة</th><th>رقم الفاتورة</th><th>أهم خدمة</th><th>أهم طريقة دفع</th><th>عدد العمليات</th><th>إجمالي المبيعات</th><th>متوسط العملية</th><th>آخر معاملة</th><th>أيام منذ آخر زيارة</th><th>التصنيف</th></tr></thead><tbody>${newCustomerTableRows}</tbody></table></div>${newCustomerMoreButton}</div>

      <div class="smart-panel"><h3>🚨 العملاء الجدد غير النشطين</h3><p>عملاء قاموا بأول معاملة ولم يظهر لهم نشاط لاحق واضح حتى تاريخ آخر بيانات متاحة.</p><div class="smart-table-clean"><table><thead><tr><th>#</th><th>العميل</th><th>أول معاملة</th><th>رقم الفاتورة</th><th>قيمة المعاملة</th><th>أيام منذ آخر زيارة</th><th>الخدمة</th></tr></thead><tbody>${newCustomerInactiveRows}</tbody></table></div></div>

      <div class="smart-panel"><h3>🏆 تحليل قيمة العملاء</h3><p>أعلى العملاء حسب صافي الإنفاق بعد استبعاد فواتير البيع الملغاة بمرتجع كامل، مع تفاصيل الزيارات وتصنيف العميل.</p><div class="smart-table-clean"><table><thead><tr><th>العميل</th><th>إجمالي الإنفاق</th><th>عدد الزيارات</th><th>متوسط الفاتورة</th><th>تاريخ آخر زيارة</th><th>قيمة آخر فاتورة</th><th>شهور الزيارة</th><th>أيام منذ آخر زيارة</th><th>تصنيف العميل</th></tr></thead><tbody>${customerInsightRows}</tbody></table></div>${customerInsightMoreButton}</div>
      
        </div>
      </div>

      <div class="customer-analysis-pane ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='contracts'?'active':''}" data-customer-analysis-pane="contracts">
        <div class="smart-dash-grid smart-customers-stack">
      <div class="smart-panel contract-candidates-panel">
        <div class="new-cust-report-head"><h3>⭐ عملاء مرشحون لعمل عقود معهم</h3><div class="contract-actions"><button class="exp-btn exp-btn-excel" data-smart-action="contract-candidates-excel">⬇️ Excel</button><button class="exp-btn exp-btn-pdf" data-smart-action="contract-candidates-pdf">🖨️ PDF</button></div></div>
        <p>يرتب أفضل العملاء المرشحين لعقد سنوي أو توريد دوري بنفس منطق تحليل العملاء الحالي، مع Score تكيفي يعتمد على الإنفاق، الزيارات، شهور النشاط، حداثة آخر زيارة، وتصنيف العميل.</p>
        <div class="contract-kpis">
          <div class="contract-kpi" style="--accent:var(--purple)"><span>إجمالي العملاء المرشحين</span><b>${fmt0(contractCandidatesCount)}</b><small>عميل مرشح</small></div>
          <div class="contract-kpi" style="--accent:var(--green)"><span>إجمالي المبيعات المحتملة</span><b>${money(contractPotentialSales)}</b><small>من العملاء المرشحين</small></div>
          <div class="contract-kpi" style="--accent:var(--yellow)"><span>أفضل مرشح</span><b>${htmlSafe(topContractCandidate.name)}</b><small>Score ${fmt0(topContractCandidate.contractScore||0)}</small></div>
          <div class="contract-kpi" style="--accent:var(--blue)"><span>عدد الزيارات/الفواتير</span><b>${fmt0(contractInvoicesCount)}</b><small>للعملاء المرشحين</small></div>
          <div class="contract-kpi" style="--accent:var(--cyan)"><span>متوسط Score</span><b>${fmt0(contractAvgScore)}</b><small>درجة الترشيح</small></div>
        </div>
        <div class="smart-table-clean contract-table"><table id="contractCandidatesTable"><thead><tr><th>#</th><th>العميل</th><th>إجمالي الإنفاق</th><th>عدد الزيارات</th><th>شهور النشاط</th><th>آخر زيارة</th><th>أيام الغياب</th><th>Score</th><th>التوصية</th><th>ملخص الترشيح</th><th>تصنيف العميل</th></tr></thead><tbody>${contractCandidateRows}</tbody></table></div>${contractCandidateMoreButton}
        <div class="contract-rec-grid">
          <div class="contract-gauge"><div class="contract-gauge-ring" style="--p:${Math.max(0,Math.min(100,topContractCandidate.contractScore||0))}%"><div><b>${fmt0(topContractCandidate.contractScore||0)}</b><span>درجة الترشيح</span></div></div></div>
          <div class="contract-ai-card"><b>🤖 توصية الذكاء التجاري</b><span>أفضل مرشح حاليًا: <b>${htmlSafe(topContractCandidate.name)}</b> — ${htmlSafe(topContractCandidate.contractMeta.desc||'')}. يوصى بمراجعة آخر الخدمات والزيارات قبل التواصل، ثم عرض اتفاقية مناسبة لحجم تعامل العميل بدل خصم عام.</span><div class="contract-actions"><span class="smart-tag good">Score عالي</span><span class="smart-tag info">قرار مبيعات</span><span class="smart-tag warn">متابعة دورية</span></div></div>
        </div>
      </div>
        </div>
      </div>

      <div class="customer-analysis-pane ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='compare'?'active':''}" data-customer-analysis-pane="compare">
        <div class="smart-dash-grid smart-customers-stack">
          ${customerCompareHtml}
        </div>
      </div>

      <div class="customer-analysis-pane ${(['overview','contracts','compare','ai'].includes(window.customerAnalysisSubTab)?window.customerAnalysisSubTab:'overview')==='ai'?'active':''}" data-customer-analysis-pane="ai">
        <div class="smart-dash-grid smart-customers-stack customer-activity-followup-stack">
          <div class="inactive-cust-section customer-activity-followup-section">
        <div class="smart-panel">
          <h3>📉 تحليل العملاء غير النشطين</h3><p>يعتمد على الزيارات الصافية فقط: فاتورة البيع التي تم إلغاؤها بمرتجع كامل لا تُحسب زيارة، ولا تدخل في آخر زيارة.</p>
          <div class="inactive-cust-kpis">
            <div class="inactive-cust-kpi"><span>العملاء غير النشطين</span><b>${fmt0(inactiveTotal)}</b><small>أكثر من 60 يوم بدون زيارة صافية</small></div>
            <div class="inactive-cust-kpi"><span>عملاء حرجين</span><b>${fmt0(inactiveCritical)}</b><small>أكثر من 120 يوم</small></div>
            <div class="inactive-cust-kpi"><span>متوسط الغياب</span><b>${fmt0(inactiveAvgDays)} يوم</b><small>من آخر زيارة صافية</small></div>
            <div class="inactive-cust-kpi"><span>مبيعات مفقودة متوقعة</span><b>${money(inactiveLostTotal)}</b><small>تقدير حسب متوسط إنفاق العميل الشهري</small></div>
            <div class="inactive-cust-kpi"><span>أخطر عميل</span><b>${htmlSafe(topInactive.name)}</b><small>${money(topInactive.lostRevenue)} / ${fmt0(topInactive.daysSince)} يوم</small></div>
          </div>
        </div>
        <div class="smart-panel">${inactiveActivityPanelHead('📊 توزيع العملاء حسب مدة الغياب','aging')}<p>يوضح أين تتركز مخاطر فقد العملاء بناءً على تاريخ آخر زيارة صافية.</p><div class="inactive-cust-chart"><canvas id="inactiveAgingChart"></canvas></div></div>
        <div class="smart-panel"><h3>📈 اتجاه العملاء الذين أصبحوا غير نشطين</h3><p>حسب شهر آخر زيارة صافية للعملاء الذين تجاوزوا 60 يوم بدون عودة.</p><div class="inactive-cust-chart sm inactive-lost-trend-chart"><canvas id="inactiveLostTrendChart"></canvas></div></div>
        <div class="smart-panel">${inactiveActivityPanelHead('📋 جدول العملاء غير النشطين','inactive')}<p>الترتيب الحالي حسب: <b>${inactiveSortLabel}</b>. الأزرار تغير طريقة عرض الجدول فقط بدون تغيير أي قيم أو معادلات.</p>${inactiveSortControls}<div class="smart-table-clean"><table><thead><tr><th>#</th><th>العميل</th><th>آخر زيارة صافية</th><th>رقم آخر فاتورة</th><th>أيام الغياب</th><th>عدد الزيارات</th><th>إجمالي الإنفاق</th><th>مستوى الخطورة</th><th>تصنيف العميل</th></tr></thead><tbody>${inactiveTableRows}</tbody></table></div>${inactiveMoreButton}</div>
        <div class="smart-panel">${inactiveActivityPanelHead('💰 فرص الاسترجاع Recovery Opportunities','recovery')}<p>تحديد العملاء الأولى بالمتابعة حسب قيمة الإنفاق ومتوسط الإنفاق الشهري ومدة الغياب.</p><div class="smart-table-clean"><table><thead><tr><th>#</th><th>العميل</th><th>آخر فاتورة</th><th>رقم آخر فاتورة</th><th>أيام الغياب</th><th>متوسط الإنفاق الشهري</th><th>القيمة المفقودة المتوقعة</th><th>التصنيف</th><th>فرصة الاسترجاع</th></tr></thead><tbody>${recoveryRows}</tbody></table></div>${recoveryMoreButton}</div>
      </div>
        </div>
      </div>
    </div>

    <div class="smart-tab-section" data-smart-section="services" id="smartServicesLazySection">
      <div class="smart-panel smart-services-lazy-placeholder"><h3>📦 تحليل الخدمات</h3><p>اضغط على تبويب تحليل الخدمات لتحميل التقرير من بيانات الفواتير فقط.</p><div class="smart-empty-inline">جاهز للتحميل السريع.</div></div>
    </div>

    <div class="smart-tab-section" data-smart-section="vehicles">
      <div class="smart-vehicles-stack">
        <div class="card smart-vehicle-report smart-vehicle-details-report">
          <div class="chart-head"><div><b>تفاصيل السيارات</b></div><div class="year-strip" id="smartVanDetailsBtns"></div></div>
          <div class="table-wrap compact-table"><table id="smartVansTable"></table></div>
        </div>
        <div class="card smart-vehicle-report smart-vehicle-monthly-report">
          <div class="chart-head"><div><b>🚐 مبيعات السيارات شهرياً</b></div><div class="year-strip" id="smartVanBarBtns"></div></div>
          <div class="chart xl"><canvas id="smartVansMonthlyBars"></canvas></div>
          <div class="sar-note">جميع القيم بالريال السعودي وتشمل ضريبة القيمة المضافة</div>
        </div>
        <div class="card smart-vehicle-report smart-vehicle-distribution-report">
          <div class="chart-head"><div><b>🥧 توزيع مبيعات السيارات</b><br><small id="smartVansDistSub"></small></div><div class="year-strip" id="smartVanPieBtns"></div></div>
          <div class="grid smart-vehicle-distribution-grid"><div class="value-list" id="smartVanPieValues"></div><div class="chart"><canvas id="smartVansPieChart"></canvas></div></div>
        </div>
        <div class="card smart-vehicle-report smart-vehicle-performance-report">
          <div class="chart-head"><div><b>📈 أداء السيارات الشهري</b></div><div class="year-strip" id="smartVanLineBtns"></div></div>
          <div class="chart"><canvas id="smartVansCompareChart"></canvas></div>
        </div>
      </div>
    </div>


    <div class="smart-tab-section" data-smart-section="advanced">
      <div class="card" style="margin-top:16px" id="reportsCenter">
        <div class="section-head" style="margin-bottom:10px"><div><h2>📑 مركز التقارير المتقدمة</h2><p>مقارنات شاملة وبيانات تفصيلية تدعم قراراتك</p></div></div>
        <div class="report-tabs"><button class="chip active" id="tab_months" data-smart-action="report-mode" data-mode="months">مقارنة الشهور</button><button class="chip" id="tab_quarters" data-smart-action="report-mode" data-mode="quarters">مقارنة الأرباع</button><button class="chip" id="tab_payment" data-smart-action="report-mode" data-mode="payment">طرق الدفع شهرياً</button></div>
        <div id="reportDynamic"></div>
      </div>
    </div>

    <div class="smart-tab-section" data-smart-section="forecast">
      <div class="ai-forecast-hero"><div><h3>${smartReportHtml('ai.heroTitle','🤖 AI Forecasting داخل التقارير الذكية')}</h3><p>${smartReportHtml('ai.heroDescription','توقعات مطورة باستخدام نماذج إحصائية متعددة، اختيار تلقائي لأفضل نموذج، وشرح ذكي لمخاطر وفرص الفترة القادمة.')}</p></div><span class="ai-badge">AI-like Predictive Engine</span></div>
      <div class="ai-forecast-kpis">
        <div class="ai-forecast-kpi" style="--accent:var(--purple)"><span>${smartReportHtml('ai.nextMonthForecast','توقع الشهر القادم')}</span><b>${money(aiForecast.next)}</b><small>${smartReportHtml('ai.basedOnModel','حسب نموذج {model}',{model:aiForecast.best})}</small></div>
        <div class="ai-forecast-kpi" style="--accent:var(--green)"><span>${smartReportHtml('ai.nextQuarterForecast','توقع الربع القادم')}</span><b>${money(aiForecast.quarter)}</b><small>${smartReportHtml('ai.firstThreeFutureMonths','أول 3 شهور مستقبلية')}</small></div>
        <div class="ai-forecast-kpi" style="--accent:var(--blue)"><span>${smartReportHtml('ai.yearEndForecast','توقع نهاية السنة')}</span><b>${money(aiForecast.yearEnd)}</b><small>${smartReportHtml('ai.actualPlusForecast','فعلي + متوقع')}</small></div>
        <div class="ai-forecast-kpi" style="--accent:var(--cyan)"><span>${smartReportHtml('ai.confidenceScore','درجة الثقة')}</span><b>${fmt0(aiForecast.confidence)}%</b><small>${smartReportHtml('ai.backtestConfidence','Backtest Confidence')}</small></div>
        <div class="ai-forecast-kpi" style="--accent:var(--red)"><span>${smartReportHtml('ai.riskIndex','مؤشر المخاطر')}</span><b>${fmt0(aiForecast.riskIndex)}%</b><small>${smartReportHtml('ai.riskFollowUp','كلما زاد احتاج متابعة')}</small></div>
      </div>
      <div class="smart-panel" style="margin-top:16px"><h3>${smartReportHtml('ai.whatIfTitle','🧮 What If Analysis')}</h3><p>${smartReportHtml('ai.whatIfDescription','حرّك السيناريوهات وشوف تأثيرها فورًا على توقع الشهر القادم.')}</p><div class="ai-whatif-box"><div class="ai-whatif-controls"><div><label>${smartReportHtml('ai.salesChange','تغيير المبيعات')} <b id="whatIfSalesVal">0%</b></label><input id="whatIfSales" type="range" min="-30" max="50" value="0" data-smart-action="what-if-input"></div><div><label>${smartReportHtml('ai.customerChange','تغيير عدد العملاء')} <b id="whatIfCustomersVal">0%</b></label><input id="whatIfCustomers" type="range" min="-30" max="50" value="0" data-smart-action="what-if-input"></div><div><label>${smartReportHtml('ai.averageInvoiceChange','تغيير متوسط الفاتورة')} <b id="whatIfAvgVal">0%</b></label><input id="whatIfAvg" type="range" min="-30" max="50" value="0" data-smart-action="what-if-input"></div></div><div class="ai-whatif-result" id="aiWhatIfResult">${smartReportHtml('ai.adjustedNextMonth','التوقع المعدل للشهر القادم')}: <b>${money(aiForecast.next)}</b></div></div></div>
      <div class="merged-ai-divider"><span>${smartReportHtml('ai.executiveIntelligence','ذكاء الأعمال التنفيذي')}</span></div>
      <div id="biArea" class="merged-bi-area"></div>
    </div>

    <div class="smart-tab-section" data-smart-section="recommendations">
      <div class="smart-panel">
        <h3>🧠 التوصيات الذكية المتقدمة</h3>
        <p>Business Advisor تفاعلي مبني على بيانات المبيعات والعملاء والسيارات والخدمات داخل PETATOE.</p>
        ${ceoBriefHtml}
        <div class="smart-rec-pro-toolbar">
          <div class="smart-rec-filter-row">
            <button class="smart-rec-filter active" data-rec-filter="revenue" data-smart-action="recommendation-filter" data-filter="revenue">الإيرادات</button>
            <button class="smart-rec-filter" data-rec-filter="customers" data-smart-action="recommendation-filter" data-filter="customers">العملاء</button>
            <button class="smart-rec-filter" data-rec-filter="vehicles" data-smart-action="recommendation-filter" data-filter="vehicles">السيارات</button>
            <button class="smart-rec-filter" data-rec-filter="services" data-smart-action="recommendation-filter" data-filter="services">الخدمات</button>
            <button class="smart-rec-filter" data-rec-filter="pets" data-smart-action="recommendation-filter" data-filter="pets">الحيوانات الأليفة</button>
            <button class="smart-rec-filter" data-rec-filter="profit" data-smart-action="recommendation-filter" data-filter="profit">الربحية</button>
            <button class="smart-rec-filter" data-rec-filter="capacity" data-smart-action="recommendation-filter" data-filter="capacity">الطاقة التشغيلية</button>
            <button class="smart-rec-filter" data-rec-filter="management" data-smart-action="recommendation-filter" data-filter="management">إدارية</button>
            <button class="smart-rec-filter" data-rec-filter="forecast" data-smart-action="recommendation-filter" data-filter="forecast">التوقعات</button>
          </div>
          <div class="smart-rec-summary"><span>${smartReportHtml('summary.recommendationCount','عدد توصيات القسم:')}</span><b id="smartRecVisibleCount">${smartRecommendations.filter(r=>r.cat==='revenue').length}</b><span>${smartReportHtml('summary.basedOn','مبنية على:')}</span><b>${fmt0(count)} ${smartReportHtml('summary.operation','عملية')}</b></div>
        </div>
        <div class="smart-rec-pro-grid" id="smartRecommendationsGrid">${smartRecCards}</div>
      </div>
    </div>
  `,'smart reports main render');
  setTimeout(()=>{ try{ petatoeFilterSmartRecs(window.petatoeSmartRecActiveFilter||'revenue'); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);} },0);
  renderReportsCenter(data);

  const palette=[css('--purple'),css('--blue'),css('--cyan'),css('--green'),css('--yellow'),css('--orange'),css('--pink')];
  chart('smartForecastChart',{type:'line',data:{labels:MONTHS.map(m=>MAR[m]),datasets:[{label:'Actual',data:monthly.map(x=>x.idx<=lastActual?x.sales:null),borderColor:css('--green'),backgroundColor:'rgba(34,197,94,.18)',tension:.35,pointRadius:4,fill:false},{label:'Forecast',data:forecast,borderColor:css('--purple'),backgroundColor:'rgba(139,92,246,.16)',borderDash:[7,5],tension:.35,pointRadius:3,fill:false}]},options:{...baseOpts(),layout:{padding:{top:28}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:false,font:'900 10px Cairo'}}}});
  setTimeout(petatoeUpdateWhatIf,0);
  // v6.4.144: smartServiceDonut is rendered lazily by renderSmartServicesReport() only.

  const salesIntelMonthlyScopedRows=salesIntelMonthlyFilteredRows();
  const salesIntelMonthlyGross=MONTHS.map(m=>salesIntelMonthlyScopedRows.filter(r=>normalizeMonth(r.month,r.date)===m).reduce((s,r)=>s+parseNum(r.totalInc),0));
  const salesIntelMonthlyNet=MONTHS.map(m=>salesIntelMonthlyScopedRows.filter(r=>normalizeMonth(r.month,r.date)===m).reduce((s,r)=>s+parseNum(r.totalEx),0));
  const salesIntelMonthlyTax=MONTHS.map(m=>salesIntelMonthlyScopedRows.filter(r=>normalizeMonth(r.month,r.date)===m).reduce((s,r)=>s+parseNum(r.tax),0));
  const salesIntelMonthlyConfig={gross:{label:smartReportT('metrics.gross','شامل الضريبة'),data:salesIntelMonthlyGross,color:css('--purple'),bg:'rgba(139,92,246,.16)'},net:{label:smartReportT('metrics.net','قبل الضريبة'),data:salesIntelMonthlyNet,color:css('--blue'),bg:'rgba(59,130,246,.14)'},tax:{label:smartReportT('metrics.vat','الضريبة'),data:salesIntelMonthlyTax,color:css('--green'),bg:'rgba(34,197,94,.14)'}}[salesIntelMonthlyMode]||{label:smartReportT('metrics.gross','شامل الضريبة'),data:salesIntelMonthlyGross,color:css('--purple'),bg:'rgba(139,92,246,.16)'};
  chart('salesIntelMonthly',{type:'line',data:{labels:MONTHS.map(m=>MAR[m]),datasets:[{label:salesIntelMonthlyConfig.label,data:salesIntelMonthlyConfig.data,borderColor:salesIntelMonthlyConfig.color,backgroundColor:salesIntelMonthlyConfig.bg,tension:.35,pointRadius:5,pointHoverRadius:7,fill:false}]},options:{...baseOpts(),layout:{padding:{top:30,right:28,left:18,bottom:26}},plugins:{...baseOpts().plugins,legend:{display:false},petatoeLabels:{enabled:true,money:true,font:'900 11px Cairo'}},scales:{x:{ticks:{color:css('--text'),font:{family:'Cairo',weight:'900'},autoSkip:false,maxRotation:0,minRotation:0,padding:10},grid:{color:'rgba(148,163,184,.13)'}},y:{ticks:{color:css('--muted')},grid:{color:'rgba(148,163,184,.13)'}}}}});
  chart('salesIntelMonthCompare',{
    type:'bar',
    plugins:[{
      id:'salesIntelMonthCompareLegendSpacer',
      beforeInit(chart){
        if(!chart.legend || chart.legend.$petatoeSpacerApplied)return;
        const originalFit=chart.legend.fit;
        chart.legend.fit=function fitWithPetatoeSpacing(){
          originalFit.bind(this)();
          this.height += 34;
        };
        chart.legend.$petatoeSpacerApplied=true;
      },
      afterDatasetsDraw(chart){
        const ctx=chart.ctx;
        const area=chart.chartArea;
        const rows=salesComparisonRows||[];
        if(!ctx || !area || !rows.length)return;
        const currentMeta=chart.getDatasetMeta(0);
        const previousMeta=chart.getDatasetMeta(1);
        const yScale=chart.scales&&chart.scales.y;
        const zeroY=yScale&&typeof yScale.getPixelForValue==='function' ? yScale.getPixelForValue(0) : area.bottom-90;
        // PETATOE v5.1.37: ضع تسميات الحالي/السابق داخل المساحة الفارغة أسفل خط الصفر مباشرة، وليس أسفل محور الشهور.
        const yBase=Math.min(area.bottom-54, Math.max(area.top+18, zeroY+24));
        ctx.save();
        ctx.textAlign='center';
        ctx.textBaseline='top';
        rows.forEach(function(row,i){
          const c=currentMeta&&currentMeta.data&&currentMeta.data[i];
          const p=previousMeta&&previousMeta.data&&previousMeta.data[i];
          if(c){
            // PETATOE v5.1.38: removed navy label background/shadow blocks behind current/previous labels.
            ctx.fillStyle=css('--comparison-current')||css('--cyan')||'#22d3ee';
            ctx.font='900 10px Cairo';
            ctx.fillText(smartReportT('compare.current','الحالي'),c.x,yBase);
            ctx.font='800 9px Cairo';
            ctx.fillText(row.currentSubLabel,c.x,yBase+16);
          }
          if(p){
            // PETATOE v5.1.38: keep label text only with no dark rounded background.
            ctx.fillStyle=css('--comparison-previous')||css('--gold-bright')||'#facc15';
            ctx.font='900 10px Cairo';
            ctx.fillText(smartReportT('compare.previous','السابق'),p.x,yBase);
            ctx.font='800 9px Cairo';
            ctx.fillText(row.previousSubLabel,p.x,yBase+16);
          }
        });
        ctx.restore();
      }
    }],
    data:{labels:salesComparisonRows.map(r=>r.label),datasets:[
      {label:smartReportT('compare.current','الحالي'),data:salesComparisonRows.map(r=>r.current),backgroundColor:css('--comparison-current')||css('--cyan'),borderRadius:10},
      {label:smartReportT('compare.previous','السابق'),data:salesComparisonRows.map(r=>r.previous),backgroundColor:css('--comparison-previous')||css('--gold-bright'),borderRadius:10},
      {label:smartReportT('compare.difference','الفرق'),data:salesComparisonRows.map(r=>r.diff),backgroundColor:function(ctx){return (ctx.raw||0)<0?(css('--comparison-diff-negative')||'#FF5A7A'):(css('--comparison-diff-positive')||'#A855F7')},borderRadius:10}
    ]},
    options:{
      ...baseOpts(),
      layout:{padding:{top:10,bottom:30}},
      plugins:{
        ...baseOpts().plugins,
        tooltip:{enabled:false},
        legend:{
          ...baseOpts().plugins.legend,
          position:'top',
          align:'center',
          labels:{
            ...baseOpts().plugins.legend.labels,
            boxWidth:14,
            boxHeight:14,
            padding:18
          }
        },
        petatoeLabels:{enabled:true,money:true,font:'800 10px Cairo'}
      }
    }
  });
  chart('salesIntelYoY',{type:'bar',data:{labels:MONTHS.map(m=>MAR[m]),datasets:[{label:String(salesPrevYear),data:salesYoYMonths.map(x=>x.prev),backgroundColor:'#94a3b8',borderRadius:8},{label:String(salesCurrentYear),data:salesYoYMonths.map(x=>x.cur),backgroundColor:css('--purple'),borderRadius:8}]},options:{...baseOpts(),layout:{padding:{top:28}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:true,font:'800 10px Cairo'}}}});
  syncSalesYoYControls();
  // PETATOE v5.1.41: Smart Reports > Overview payment method report removed; no chart draw needed.
  chart('salesIntelNewReturning',{type:'doughnut',data:{labels:[smartReportT('customers.oneTime','عملاء مرة واحدة'),smartReportT('customers.returning','عملاء متكررون')],datasets:[{label:smartReportT('customers.classification','تصنيف العملاء'),data:[salesNewReturning.new,salesNewReturning.returning],backgroundColor:[css('--blue'),css('--gold')||'#FFD54A'],borderWidth:0}]},options:{...baseOpts('bottom'),cutout:'58%',plugins:{...baseOpts('bottom').plugins,tooltip:{enabled:false},legend:{position:'bottom',labels:{color:'#fff',font:{family:'Cairo',weight:'900'},generateLabels:function(chart){return [{text:smartReportT('customers.oneTime','عملاء مرة واحدة'),fillStyle:css('--blue')||'#18E7F9',strokeStyle:css('--blue')||'#18E7F9',fontColor:'#fff',hidden:false,index:0},{text:smartReportT('customers.returning','عملاء متكررون'),fillStyle:css('--gold')||'#FFD54A',strokeStyle:css('--gold')||'#FFD54A',fontColor:'#fff',hidden:false,index:1}];}}},petatoeLabels:{enabled:true,money:false,color:'#fff',font:'900 11px Cairo'}}}});
  
  document.getElementById('newReturningSummary')&&smartSafeHTML(document.getElementById('newReturningSummary'),`<button type="button" class="liquid-mini-card cyan petatoe-clickable-card smart-new-returning-card" data-client-kind="returning" data-smart-action="new-returning-list" data-kind="returning"><b>${smartReportHtml('customers.returning','العملاء المتكررون')}</b><span>${salesNewReturning.returning}</span></button><button type="button" class="liquid-mini-card gold petatoe-clickable-card smart-new-returning-card" data-client-kind="oneTime" data-smart-action="new-returning-list" data-kind="oneTime"><b>${smartReportHtml('customers.oneTime','عملاء مرة واحدة')}</b><span>${salesNewReturning.new}</span></button>`,'smart new returning summary');
  // PETATOE v6.4.148: Smart Customers charts are rendered lazily only when the Customers tab opens.
  // This follows the Advanced Center pattern and avoids drawing customer charts during Smart Reports startup.
  if(preservedSmartTab==='customers'){
    chart('newCustomersWeeklyChart',{type:'bar',data:{labels:newCustWeekRows.map(x=>x.label),datasets:[{label:smartReportT('customers.newCustomers','عملاء جدد'),data:newCustWeekRows.map(x=>x.count),backgroundColor:css('--purple'),borderRadius:10}]},options:{...baseOpts(),layout:{padding:{top:24}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}}}});
    chart('newCustomersTopValueChart',{type:'bar',data:{labels:newCustomerRows.slice(0,10).map(x=>x.name),datasets:[{label:smartReportT('metrics.sales','المبيعات'),data:newCustomerRows.slice(0,10).map(x=>x.totalValue),backgroundColor:css('--blue'),borderRadius:10}]},options:{...baseOpts(),indexAxis:'y',layout:{padding:{left:12,right:12}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,fullMoney:true,font:'900 10px Cairo'}}}});
    chart('newCustomersTrendChart',{type:'line',data:{labels:newCustTrendRows.map(x=>x.label),datasets:[{label:smartReportT('customers.newCustomers','عملاء جدد'),data:newCustTrendRows.map(x=>x.count),borderColor:css('--green'),backgroundColor:'rgba(34,197,94,.16)',tension:.35,pointRadius:4,fill:true}]},options:{...baseOpts(),layout:{padding:{top:24}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}}}});
    chart('inactiveAgingChart',{type:'bar',data:{labels:inactiveBuckets.map(x=>x.label),datasets:[{label:smartReportT('customers.customerCount','عدد العملاء'),data:inactiveBuckets.map(x=>x.count),backgroundColor:css('--orange'),borderRadius:10}]},options:{...baseOpts(),layout:{padding:{top:26}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}}}});
    chart('inactiveLostTrendChart',{type:'line',data:{labels:inactiveTrendRows.map(x=>x.label),datasets:[{label:smartReportT('customers.becameInactive','عملاء أصبحوا غير نشطين'),data:inactiveTrendRows.map(x=>x.count),borderColor:css('--red'),backgroundColor:'rgba(239,68,68,.16)',tension:.35,pointRadius:4,fill:true,clip:false}]},options:{...baseOpts(),layout:{padding:{top:28,right:54,left:54,bottom:34}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo',offset:12}},scales:{x:{offset:true,ticks:{color:css('--text'),font:{family:'Cairo',weight:'900'},autoSkip:false,maxRotation:0,minRotation:0,padding:14},grid:{color:'rgba(148,163,184,.12)'}},y:{ticks:{color:css('--muted'),font:{family:'Cairo',weight:'800'}},grid:{color:'rgba(148,163,184,.13)'}}}}});
    window.__petatoeSmartCustomersRendered=true;
  }

  renderSmartSales(data);
  // v6.4.145: Smart Reports > Vehicles is rendered lazily only when its tab opens.
  // This mirrors the Advanced Center pattern and avoids drawing vehicle charts during full dashboard startup.
  if(preservedSmartTab==='vehicles' && typeof renderSmartVans==='function'){
    try{ renderSmartVans(data); }catch(e){ console.error('PETATOE Smart Vehicles lazy initial render error', e); }
  }
  try{ if(window.injectBusinessIntelligence) window.injectBusinessIntelligence(preservedSmartTab); }catch(e){console.error('PETATOE BI inject error',e)}
  try{ if(window.injectSalesInvoiceReport) window.injectSalesInvoiceReport(preservedSmartTab); }catch(e){console.error('PETATOE sales invoice inject error',e)}
  const smartValidTabs=['overview','sales','vehicles','customers','services','advanced','forecast','recommendations','business','salesInvoices'];
  const normalizedSmartTab = preservedSmartTab==='business' ? 'forecast' : preservedSmartTab;
  try{ if(window.__PETATOE_SMART_PERF__){ window.__PETATOE_SMART_PERF__.push({name:'SmartReports.fullRender.total', ms:+(((window.performance&&performance.now)?performance.now():Date.now())-__smartRenderPerfStart).toFixed(2), at:Date.now(), records:data.length, tab:normalizedSmartTab}); } }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-reports-core.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  setSmartTab(smartValidTabs.includes(normalizedSmartTab)?normalizedSmartTab:'overview');
}

/* v6.4.51 G1: Smart interactions/search/bootstrap moved to smart-reports-interactions-real.js. */
