/* PETATOE v6.4.48 - Smart Reports Real Extraction: filters and vehicle efficiency helpers.
   Extracted from smart-reports-core.js without behavior changes. */

function smartSafeHtml(target, html, reason){
  const el=(typeof target==='string')?document.getElementById(target):target;
  if(!el)return false;
  try{if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function')return window.PETATOESafeRender.htmlTrusted(el,String(html==null?'':html),reason||'smart reports trusted escaped template');}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('smart reports safe render fallback',e);}
  el.textContent='';el.insertAdjacentHTML('beforeend',String(html==null?'':html));return true;
}

function smartVehicleEfficiencyT(key,fallback){
  try{if(typeof smartReportT==='function')return smartReportT('vehicleEfficiency.'+key,fallback);}catch(_){ }
  return String(fallback==null?'':fallback);
}
function smartGlobalFilterValue(id){
  const el=$(id);
  const v=el ? String(el.value||'all') : 'all';
  return v || 'all';
}
function smartScopedYearData(){
  return (records||[]).slice();
}
function syncSmartGlobalFilterOptions(){
  // v5.1.29: global Smart header filters were removed from UI and data flow.
  return;
}
function smartApplyGlobalFilters(data){
  // v5.1.29: no global Smart header filters should affect report data.
  return (data||[]).slice();
}


// PETATOE v5.1.30
// Independent filters for one report only: Smart Reports > ملخص الأداء > تحليل كفاءة السيارات.
// These filters do not change global Smart Reports data, KPI cards, other tables, charts, PDF, or export logic.
window.smartVehicleEfficiencyFilters = window.smartVehicleEfficiencyFilters || {year:String(defaultYear(records)),month:'all',van:'all',pay:'all'};
function smartFilterEsc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function smartUniqueSorted(rows,field){
  return [...new Set((rows||[]).map(function(r){return String(r&&r[field]!=null?r[field]:'').trim()}).filter(Boolean))].sort(function(a,b){return a.localeCompare(b,'ar')});
}
function smartVehicleEfficiencyState(){
  const st=window.smartVehicleEfficiencyFilters || {};
  return {year:String(st.year||'all'),month:String(st.month||'all'),van:String(st.van||'all'),pay:String(st.pay||'all')};
}
function smartVehicleEfficiencyOptions(kind,current){
  const rows=(records||[]).slice();
  let vals=[];
  if(kind==='year') vals=['all'].concat(getYearButtonList(rows).map(String));
  if(kind==='month') vals=['all'].concat(MONTHS.filter(function(m){return rows.some(function(r){return normalizeMonth(r.month,r.date)===m})}));
  if(kind==='van') vals=['all'].concat(smartUniqueSorted(rows,'van'));
  if(kind==='pay') vals=['all'].concat(smartUniqueSorted(rows,'pay'));
  const labels={year:{all:smartVehicleEfficiencyT('allYears','كل السنوات')},month:{all:smartVehicleEfficiencyT('allMonths','كل الشهور')},van:{all:smartVehicleEfficiencyT('allVehicles','كل السيارات')},pay:{all:smartVehicleEfficiencyT('allPayments','كل طرق الدفع')}};
  return vals.map(function(v){
    let txt=v;
    if(v==='all') txt=labels[kind].all;
    else if(kind==='month'){
      try{
        const idx=MONTHS.indexOf(v);
        const lang=(window.PETATOE_I18N&&typeof window.PETATOE_I18N.getLanguage==='function')?window.PETATOE_I18N.getLanguage():(document.documentElement.lang||'ar');
        if(idx>=0) txt=new Intl.DateTimeFormat(lang==='en'?'en-US':'ar-SA',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2024,idx,1)));
        else txt=MAR[v]||v;
      }catch(_){txt=MAR[v]||v;}
    }
    return '<option value="'+smartFilterEsc(v)+'" '+(String(current)===String(v)?'selected':'')+'>'+smartFilterEsc(txt)+'</option>';
  }).join('');
}
function smartVehicleEfficiencyRows(){
  const st=smartVehicleEfficiencyState();
  let rows=(records||[]).slice().filter(function(r){
    if(st.year!=='all' && String(getYear(r))!==String(st.year)) return false;
    if(st.month!=='all' && String(normalizeMonth(r.month,r.date))!==String(st.month)) return false;
    if(st.van!=='all' && String(r.van||'').trim()!==String(st.van)) return false;
    if(st.pay!=='all' && String(r.pay||'').trim()!==String(st.pay)) return false;
    return true;
  });
  return rows;
}
function smartVehicleEfficiencyRowsHtml(){
  const rows=smartVehicleEfficiencyRows();
  const totalRows=rows.reduce(function(s,r){return s+parseNum(r.totalInc)},0);
  const totalCount=rows.length;
  const vt=groupSum(rows,'van');
  const out=Object.entries(vt).map(function(v){
    const c=rows.filter(function(r){return (r.van||'غير محدد')===v[0]}).length;
    const avg=safeDiv(v[1],c||1);
    const share=safeDiv(v[1],totalRows).toLocaleString('en-US',{style:'percent',maximumFractionDigits:1});
    return '<tr><td>'+smartFilterEsc(v[0])+'</td><td>'+fmt0(c)+'</td><td>'+money(v[1])+'</td><td>'+money(avg)+'</td><td>'+share+'</td></tr>';
  }).join('');
  if(!out) return '<tr><td colspan="5">'+smartFilterEsc(smartVehicleEfficiencyT('noData','لا توجد بيانات مطابقة لفلاتر تحليل كفاءة السيارات.'))+'</td></tr>';
  const totalAvg=safeDiv(totalRows,totalCount||1);
  return out + '<tr class="smart-total-row"><td>'+smartFilterEsc(smartVehicleEfficiencyT('total','الإجمالي'))+'</td><td>'+fmt0(totalCount)+'</td><td>'+money(totalRows)+'</td><td>'+money(totalAvg)+'</td><td>100%</td></tr>';
}
function smartVehicleEfficiencyFilterHtml(){
  const st=smartVehicleEfficiencyState();
  return '<div class="smart-local-filter-row" data-report-filter="vehicle-efficiency">'
    +'<select id="smartVehicleEffYear" data-smart-action="vehicle-efficiency-filter" data-smart-key="year">'+smartVehicleEfficiencyOptions('year',st.year)+'</select>'
    +'<select id="smartVehicleEffMonth" data-smart-action="vehicle-efficiency-filter" data-smart-key="month">'+smartVehicleEfficiencyOptions('month',st.month)+'</select>'
    +'<select id="smartVehicleEffVan" data-smart-action="vehicle-efficiency-filter" data-smart-key="van">'+smartVehicleEfficiencyOptions('van',st.van)+'</select>'
    +'<select id="smartVehicleEffPay" data-smart-action="vehicle-efficiency-filter" data-smart-key="pay">'+smartVehicleEfficiencyOptions('pay',st.pay)+'</select>'
    +'<button type="button" class="btn btn-ghost smart-local-reset" data-smart-action="vehicle-efficiency-reset">'+smartFilterEsc(smartVehicleEfficiencyT('reset','إعادة تعيين'))+'</button>'
    +'</div>';
}
function setSmartVehicleEfficiencyFilter(key,value){
  const st=smartVehicleEfficiencyState();
  st[key]=value||'all';
  window.smartVehicleEfficiencyFilters=st;
  const body=document.getElementById('smartVehicleEfficiencyBody');
  if(body) window.PETATOESafeRender.setHTML(body,smartVehicleEfficiencyRowsHtml());
}
function resetSmartVehicleEfficiencyFilters(){
  const years=getYearButtonList(records).filter(function(v){return v!=='all'}).map(Number).filter(Boolean).sort(function(a,b){return b-a});
  const defaultYear=String(years[0] || new Date().getFullYear());
  window.smartVehicleEfficiencyFilters={year:defaultYear,month:'all',van:'all',pay:'all'};
  const controls=document.querySelector('#smartVehicleEfficiencyPanel .smart-panel-head-with-filters');
  if(controls){
    window.PETATOESafeRender.setHTML(controls,'<div><h3>🚐 '+smartFilterEsc(smartVehicleEfficiencyT('title','تحليل كفاءة السيارات'))+'</h3></div>'+smartVehicleEfficiencyFilterHtml());
  }
  const body=document.getElementById('smartVehicleEfficiencyBody');
  if(body) window.PETATOESafeRender.setHTML(body,smartVehicleEfficiencyRowsHtml());
}
