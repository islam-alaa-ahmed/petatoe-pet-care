/* PETATOE v6.4.171 - Smart Services Module Extraction (Phase B2)
   Owns Smart Reports > Services rendering, filters, table, chart, and helpers.
   Source of truth remains invoice/manual sales records only. */


function petatoeSmartServicesEscHTML(value){
  if(window.PETATOESafeRender && typeof window.PETATOESafeRender.escapeHTML === 'function') return window.PETATOESafeRender.escapeHTML(value);
  if(typeof window.htmlSafe === 'function') return window.htmlSafe(value);
  return String(value == null ? '' : value).replace(/[&<>\"'`]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;','`':'&#96;'}[ch]||ch;});
}

function petatoeSmartServicesSetHTML(el, html, reason){
  if(!el) return false;
  html = String(html == null ? '' : html);
  if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function'){
    window.PETATOESafeRender.htmlSanitized(el, html, reason || 'smart-services render');
  }else{
    el.replaceChildren(document.createRange().createContextualFragment(html));
  }
  return true;
}

function smartServiceCleanName(v){
  v=String(v==null?'':v).trim();
  return v || 'غير محدد';
}
function smartServiceNumericValue(v){
  var n=(typeof parseNum==='function')?parseNum(v):Number(String(v||'').replace(/[^0-9.\-]/g,''));
  return isFinite(n)?n:0;
}
function smartServiceFirstValue(obj, keys){
  obj=obj&&typeof obj==='object'?obj:{};
  for(var i=0;i<keys.length;i++){
    var k=keys[i];
    if(obj[k]!=null && String(obj[k]).trim()!=='') return obj[k];
  }
  return '';
}
function smartServiceNameFromObject(s){
  s=s&&typeof s==='object'?s:{};
  return smartServiceCleanName(smartServiceFirstValue(s,[
    'item','اسم الصنف','الصنف','الخدمة','الخدمه','اسم الخدمة','service','serviceName','itemName','product','productName','name','title','label','description','الوصف','البيان'
  ]));
}
function smartServiceValueFromObject(s, fallbackTotal){
  s=s&&typeof s==='object'?s:{};
  var explicit=smartServiceNumericValue(s.net||s.netTotal||s.total||s.amount||s.value||s.lineTotal||s.finalPrice||s.finalTotal);
  if(explicit>0) return explicit;
  var price=smartServiceNumericValue(s.unitPrice||s.basePrice||s.price||s.unit_price||s.rate||s.servicePrice);
  var qty=smartServiceNumericValue(s.qty||s.quantity||s.count||s.animalsCount||s.appliedCount||s.animalCount);
  if(!qty && Array.isArray(s.targets)) qty=s.targets.length;
  if(!qty && Array.isArray(s.animalTargets) && s.animalTargets.indexOf('__all__')<0) qty=s.animalTargets.length;
  if(!qty && Array.isArray(s.animals)) qty=s.animals.length;
  if(!qty) qty=1;
  var discount=smartServiceNumericValue(s.discount||s.discountValue||s.serviceDiscount);
  var calc=(price*qty)-discount;
  if(calc>0) return calc;
  return smartServiceNumericValue(fallbackTotal);
}
function smartServiceRowsFromRecord(r){
  // v6.4.136: Smart Reports services report is invoice-only.
  // Source of truth is the normalized invoice/manual sales records row itself.
  // No appointment data, no appointment services, no operational master-data bridge.
  r=r&&typeof r==='object'?r:{};
  var name=smartServiceCleanName(smartServiceFirstValue(r,[
    'item','اسم الصنف','الصنف','الخدمة','الخدمه','اسم الخدمة','service','serviceName','itemName','product','productName','name','title','label','description','الوصف','البيان'
  ]));
  if(!name || name==='غير محدد') return [];
  var total=smartServiceNumericValue(smartServiceFirstValue(r,[
    'totalInc','الإجمالي شامل الضريبة','المبيعات شامل الضريبة','الإجمالي','اجمالي','totalWithVat','total','amount','value','net','grandTotal','lineTotal','totalEx','المبيعات قبل الضريبة'
  ]));
  return [Object.assign({},r,{item:name,totalInc:total,__serviceSource:'invoice-record-only'})];
}
function smartServiceRows(source){
  var out=[];
  (Array.isArray(source)?source:[]).forEach(function(r){out=out.concat(smartServiceRowsFromRecord(r));});
  return out;
}
function smartServiceReadJSONSafe(key, fallback){
  try{
    if(window.PETATOEStorage && typeof window.PETATOEStorage.readJSON==='function'){
      var v=window.PETATOEStorage.readJSON(key, fallback);
      return v==null?fallback:v;
    }
  }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-services.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  try{
    var raw=(window.PETATOEStorage&&window.PETATOEStorage.get)?window.PETATOEStorage.get(key,null):(window['localStorage']?window['localStorage'].getItem(key):null);
    return raw?JSON.parse(raw):fallback;
  }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-services.js', e, {phase:'v6.5.8-security-gate'}); }catch(_){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('smart/smart-services.js',_,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('smart/smart-services.js',_petatoeSilentCatch);}} return fallback;}
}
function smartAppointmentRowsForServices(){return [];}
function smartServiceGroupSum(source){
  // Keep old callers safe, but aggregate only invoice/manual sales records.
  return groupSum(smartServiceRows(source),'item');
}
function smartServiceCount(source,name){
  name=String(name||'غير محدد');
  return smartServiceRows(source).filter(function(r){return String(r.item||'غير محدد')===name;}).length;
}
function smartServicesSelectedYear(){
  var currentYear=(new Date()).getFullYear();
  return smartServicesYear==='all'?'all':(+smartServicesYear||defaultYear(records)||currentYear);
}
function smartServicesScopedData(){
  var selected=smartServicesSelectedYear();
  var rows=[];
  try{
    if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.filterInvoicesByYear==='function'){
      rows=window.PETATOESmartDataEngine.filterInvoicesByYear(records||[], selected).map(function(inv){
        return {id:inv.idx, invoice:(inv.row&&inv.row.invoice)||'', date:(inv.row&&inv.row.date)||'', item:inv.service, totalInc:inv.amount, client:inv.customer, van:inv.vehicle, pay:inv.payment, month:inv.month, year:inv.year, __serviceSource:'smart-data-engine'};
      });
    }else{
      var base=selected==='all'?(records||[]).slice():byYear((records||[]),+selected);
      rows=smartServiceRows(smartDataCutoff(base,selected));
    }
  }catch(e){
    var base=selected==='all'?(records||[]).slice():byYear((records||[]),+selected);
    rows=smartServiceRows(smartDataCutoff(base,selected));
  }
  rows=rows.filter(function(r){return String(r.item||'').trim() && String(r.item)!=='غير محدد';});
  var seen={};
  return rows.filter(function(r){
    var k=[r.id||'',r.invoice||'',r.date||'',r.item||'',r.totalInc||0].join('|');
    if(seen[k])return false; seen[k]=true; return true;
  });
}
window.PETATOESmartServicesAudit=function(){
  var raw=(records||[]).slice();
  var scoped=smartServicesScopedData();
  return {
    source:'invoice/manual sales records only',
    records:raw.length,
    recordsWithItem:raw.filter(function(r){return String((r&&r.item)||'').trim();}).length,
    appointmentsIgnored:true,
    serviceRows:scoped.length,
    year:smartServicesYear,
    sample:scoped.slice(0,10).map(function(r){return {date:r.date,item:r.item,total:r.totalInc,invoice:r.invoice,source:r.__serviceSource};})
  };
};

function smartServicesSortLabel(){
  return smartServicesSort==='valueAsc'?'المبيعات الأقل قيمة':smartServicesSort==='countDesc'?'الخدمات الأكثر استخدامًا':smartServicesSort==='countAsc'?'الخدمات الأقل استخدامًا':'المبيعات الأعلى قيمة';
}
function smartServicesYearButtons(){
  var years=[];
  try{
    if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.availableYears==='function') years=window.PETATOESmartDataEngine.availableYears(records||[]);
  }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-services.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  if(!years.length){
    var serviceYears={};
    try{getYearButtonList(records||[]).forEach(function(y){if(String(y)!=='all')serviceYears[String(y)]=true;});}catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-services.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    years=Object.keys(serviceYears).sort(function(a,b){return Number(b)-Number(a);});
  }
  if(!years.length) years=[String((new Date()).getFullYear())];
  var y=smartServicesYear==='all'?'all':String(+smartServicesYear||years[0]);
  return `<div class="year-strip" style="margin-bottom:12px">${years.map(yy=>`<button type="button" class="year-chip ${String(y)===String(yy)?'active':''}" data-smart-action="service-year" data-year="${yy}">📅 ${yy}</button>`).join('')}<button type="button" class="year-chip ${y==='all'?'active':''}" data-smart-action="service-year" data-year="all">كل السنوات 🌐</button></div>`;
}
function smartServicesSortButtons(){
  const btns=[['valueDesc','المبيعات الأعلى قيمة'],['valueAsc','المبيعات الأقل قيمة'],['countDesc','الخدمات الأكثر استخدامًا'],['countAsc','الخدمات الأقل استخدامًا']];
  return `<div class="report-control-group" style="margin-bottom:12px">${btns.map(([k,t])=>`<button type="button" class="metric-chip ${smartServicesSort===k?'active':''}" data-smart-action="service-sort" data-sort="${k}">${t}</button>`).join('')}</div>`;
}
function smartServicesAggregates(source){
  try{
    if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.aggregateServices==='function'){
      return window.PETATOESmartDataEngine.aggregateServices(records||[], smartServicesSelectedYear(), smartServicesSort).map(function(x){
        return {name:x.name,value:x.total||x.value||0,count:x.count||0,avg:x.avg||safeDiv((x.total||x.value||0),(x.count||0))};
      });
    }
  }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-services.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  var idx={};
  (source||[]).forEach(function(r){
    var name=String((r&&r.item)||'غير محدد');
    if(!idx[name]) idx[name]={name:name,value:0,count:0,avg:0};
    idx[name].value += parseNum((r&&r.totalInc)||0);
    idx[name].count += 1;
  });
  let rows=Object.keys(idx).map(function(k){idx[k].avg=safeDiv(idx[k].value,idx[k].count);return idx[k];});
  const byValue=(a,b)=>a.value-b.value;
  const byCount=(a,b)=>a.count-b.count || a.value-b.value;
  if(smartServicesSort==='valueAsc') rows.sort(byValue);
  else if(smartServicesSort==='countDesc') rows.sort((a,b)=>byCount(b,a));
  else if(smartServicesSort==='countAsc') rows.sort(byCount);
  else rows.sort((a,b)=>byValue(b,a));
  return rows;
}
function smartServicesTableRows(source){
  const rows=smartServicesAggregates(source);
  const visibleRows=smartServicesShowAll?rows:rows.slice(0,10);
  if(!visibleRows.length)return '<tr><td colspan="4" class="muted">لا توجد بيانات خدمات مطابقة للفترة المختارة.</td></tr>';
  return visibleRows.map((x,i)=>`<tr><td>${i+1}</td><td>${petatoeSmartServicesEscHTML(x.name)}</td><td>${money(x.value)}</td><td>${fmt0(x.count)}</td></tr>`).join('');
}
function smartServicesMoreButton(source){
  const total=smartServicesAggregates(source).length;
  if(total<=10)return '';
  const shown=smartServicesShowAll?total:10;
  return `<div class="pager" style="justify-content:center;margin-top:14px"><button type="button" class="btn btn-ghost" data-smart-action="service-more">${smartServicesShowAll?'عرض أول 10 خدمات':'المزيد لعرض باقي الخدمات'}</button><span>عرض ${fmt0(shown)} من ${fmt0(total)} خدمة</span></div>`;
}


/* PETATOE v6.4.144 - Lazy renderer for Smart Reports > Services.
   Mirrors the Advanced Reports Center pattern: render one report only, from invoice/manual sales records only. */
function renderSmartServicesReport(){
  var holder=document.querySelector('[data-smart-section="services"]') || document.getElementById('smartServicesLazySection');
  if(!holder) return false;
  var scoped=smartServicesScopedData();
  var aggRows=smartServicesAggregates(scoped);
  var sum=aggRows.map(function(x){return [x.name,x.value,x.count,x.avg];});
  var weak=aggRows.slice().sort(function(a,b){return (a.value||0)-(b.value||0);}).slice(0,10);
  petatoeSmartServicesSetHTML(holder, `<div class="smart-dash-grid smart-services-stack">
      <div class="smart-panel"><h3>📦 تحليل الخدمات</h3><p>نصيب كل خدمة من الإيراد، مع تحديد الخدمات الأكثر تأثيرًا.</p>${smartServicesYearButtons()}<div class="smart-chart-md smart-service-cylinder-chart"><canvas id="smartServiceDonut"></canvas></div>${sum.length?'':'<div class="smart-empty-inline">لا توجد بيانات خدمات للفترة المختارة.</div>'}</div>
      <div class="smart-panel"><h3>🧩 Top Services</h3>${smartServicesYearButtons()}${smartServicesSortButtons()}<div class="smart-table-clean"><table id="smartServicesTable"><thead><tr><th>#</th><th>الخدمة</th><th>المبيعات</th><th>العمليات</th></tr></thead><tbody>${smartServicesTableRows(scoped)}</tbody></table></div>${smartServicesMoreButton(scoped)}</div>
      <div class="smart-panel"><h3>📉 خدمات تحتاج متابعة</h3><p>أقل الخدمات من حيث الإيراد لمراجعة التسعير أو العروض.</p>${smartServicesYearButtons()}<div class="smart-table-clean"><table><thead><tr><th>الخدمة</th><th>الإيراد</th><th>عدد العمليات</th><th>متوسط العملية</th></tr></thead><tbody>${weak.length?weak.map(function(x){var name=x.name,val=x.value,c=x.count;return `<tr><td>${petatoeSmartServicesEscHTML(name)}</td><td>${money(val)}</td><td>${fmt0(c)}</td><td>${money(x.avg||safeDiv(val,c))}</td></tr>`;}).join(''):'<tr><td colspan="4" class="muted">لا توجد بيانات خدمات مطابقة.</td></tr>'}</tbody></table></div></div>
    </div>`, 'smart services report');
  var palette=[css('--purple'),css('--blue'),css('--cyan'),css('--green'),css('--yellow'),css('--orange'),css('--pink')];
  try{
    chart('smartServiceDonut',{type:'bar',data:{labels:sum.slice(0,8).map(function(x){return String(x[0]).replace(/\s*-\s*/g,'\n');}),datasets:[{label:'الإيراد (SAR)',data:sum.slice(0,8).map(function(x){return x[1];}),backgroundColor:palette,borderColor:palette,borderWidth:0,borderRadius:18,barPercentage:.62,categoryPercentage:.78,cylinder:true}]},options:{...baseOpts(),layout:{padding:{top:44,right:18,left:18,bottom:8}},plugins:{...baseOpts().plugins,legend:{labels:{color:css('--text'),font:{family:'Cairo',weight:'900'}}},petatoeLabels:{enabled:true,fullMoney:true,color:css('--text'),font:'900 12px Cairo',offset:16,strokeWidth:4}},scales:{x:{ticks:{color:css('--text'),font:{family:'Cairo',weight:'900'},maxRotation:0,minRotation:0},grid:{display:false}},y:{title:{display:true,text:'الإيراد (SAR)',color:css('--muted'),font:{family:'Cairo',weight:'900'}},ticks:{color:css('--muted'),callback:function(v){return Number(v)>=1000?(Number(v)/1000)+'K':v;}},grid:{color:'rgba(148,163,184,.13)'}}}}});
  }catch(e){ if(window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch) window.PETATOEUtils.warnSilentCatch('renderSmartServicesReport',e); }
  window.__petatoeSmartServicesRendered=true;
  return true;
}
function toggleSmartServicesMore(){smartServicesShowAll=!smartServicesShowAll;renderSmartServicesReport();setSmartTab('services')}
function setSmartServicesYear(y){smartServicesYear=y;smartServicesShowAll=false;renderSmartServicesReport();setSmartTab('services')}
function setSmartServicesSort(mode){smartServicesSort=mode;smartServicesShowAll=false;renderSmartServicesReport();setSmartTab('services')}
