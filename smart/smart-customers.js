/* PETATOE v6.4.173 - Smart Customers Module Extraction (B4)
   Owns customer analytics fast render, new customer filters, activity/inactive customer actions.
   Extracted from smart-tabs.js without changing behavior or data source. */

/* PETATOE v6.4.154 - Smart Customers Fast Renderer
   Converts Customer Analytics tab to the same lightweight local-render pattern used by
   Smart Vehicles. It renders only the customer charts from the invoice Smart Data Engine
   and does not rebuild the whole Smart Reports dashboard. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_CUSTOMERS_FAST_RENDER_V154__) return;
  window.__PETATOE_SMART_CUSTOMERS_FAST_RENDER_V154__ = true;

  function reportSmartCustomersSilentCatch(scope, error, meta){
    try{
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('smart-customers.' + scope, error, meta || {});
      }
    }catch(_diag){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-customers.js', _diag, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }

  function petatoeSmartCustomersEscHTML(value){
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.escapeHTML === 'function') return window.PETATOESafeRender.escapeHTML(value);
    if(typeof window.htmlSafe === 'function') return window.htmlSafe(value);
    return String(value == null ? '' : value).replace(/[&<>\"'`]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;','`':'&#96;'}[ch]||ch;});
  }
  function perfNow(){ try{ return (window.performance && performance.now) ? performance.now() : Date.now(); }catch(e){ return Date.now(); } }
  function perfPush(name, start, meta){
    try{
      window.__PETATOE_SMART_PERF__ = window.__PETATOE_SMART_PERF__ || [];
      window.__PETATOE_SMART_PERF__.push(Object.assign({name:name, ms:+(perfNow()-start).toFixed(2), at:Date.now()}, meta||{}));
      if(window.__PETATOE_SMART_PERF__.length > 140) window.__PETATOE_SMART_PERF__.shift();
    }catch(e){ reportSmartCustomersSilentCatch('perfPush', e); }
  }
  function arr(x){ return Array.isArray(x) ? x : []; }
  function num(x){
    if(typeof window.parseNum === 'function') return window.parseNum(x);
    var n = Number(String(x||0).replace(/[,"]+/g,''));
    return isFinite(n) ? n : 0;
  }
  function htmlMonthLabel(y,m){
    var names = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return (names[m-1] || String(m)) + ' ' + y;
  }
  function isoDate(d){ return d && !isNaN(d) ? d.toISOString().slice(0,10) : ''; }
  function getInvoiceDate(inv){
    if(inv && inv.date instanceof Date && !isNaN(inv.date)) return inv.date;
    var row = inv && inv.row ? inv.row : inv;
    try{ if(typeof window.smartDateValue === 'function'){ var sd = window.smartDateValue(row); if(sd) return sd; } }catch(e){ reportSmartCustomersSilentCatch('getInvoiceDate.smartDateValue', e); }
    try{ if(typeof window.parseDate === 'function'){ var p = window.parseDate(row && row.date); if(p) return new Date(p+'T12:00:00'); } }catch(e){ reportSmartCustomersSilentCatch('getInvoiceDate.parseDate', e); }
    var d = new Date(row && row.date || '');
    return isNaN(d) ? null : d;
  }
  function baseOptions(axis){
    try{ return typeof window.baseOpts === 'function' ? window.baseOpts(axis) : {responsive:true,maintainAspectRatio:false}; }
    catch(e){ return {responsive:true,maintainAspectRatio:false}; }
  }
  function cssVar(name, fallback){
    try{ return typeof window.css === 'function' ? (window.css(name) || fallback) : fallback; }catch(e){ reportSmartCustomersSilentCatch('cssVar', e, {name:name}); return fallback; }
  }
  function drawChart(id, config){
    try{ if(typeof window.chart === 'function') window.chart(id, config); }catch(e){ console.warn('[PETATOE Smart Customers]', id, e); }
  }

  function buildCustomerFastModel(records){
    var data;
    try{
      data = window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.buildSmartData === 'function'
        ? window.PETATOESmartDataEngine.buildSmartData(records || [])
        : null;
    }catch(e){ reportSmartCustomersSilentCatch('buildCustomerFastModel', e); data = null; }
    var invoices = data && Array.isArray(data.invoices) ? data.invoices : [];
    var byCustomer = Object.create(null);
    invoices.forEach(function(inv){
      var name = String(inv.customer || (inv.row && (inv.row.client || inv.row.customer)) || 'غير محدد').trim() || 'غير محدد';
      if(name === 'نقدي') return;
      var d = getInvoiceDate(inv);
      var amount = num(inv.amount || (inv.row && (inv.row.totalInc || inv.row.total || inv.row.amount)) || 0);
      if(!byCustomer[name]) byCustomer[name] = {name:name,total:0,count:0,first:null,last:null,rows:[]};
      var c = byCustomer[name];
      c.total += amount;
      c.count += 1;
      c.rows.push(inv);
      if(d){ if(!c.first || d < c.first) c.first = d; if(!c.last || d > c.last) c.last = d; }
    });
    var customers = Object.keys(byCustomer).map(function(k){return byCustomer[k];});
    return {customers:customers, invoices:invoices};
  }

  function renderSmartCustomers(records){
    var start = perfNow();
    records = arr(records && records.length ? records : (window.PETATOEDataSource && window.PETATOEDataSource.getRecordsSync ? window.PETATOEDataSource.getRecordsSync() : window.records));
    var model = buildCustomerFastModel(records);
    var customers = model.customers;
    var now = new Date();

    // New customers by first invoice date: weekly + trend.
    var firstDated = customers.filter(function(c){return c.first;});
    var weekIndex = Object.create(null);
    var monthIndex = Object.create(null);
    firstDated.forEach(function(c){
      var d = c.first;
      var weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      var wk = isoDate(weekStart);
      weekIndex[wk] = (weekIndex[wk] || 0) + 1;
      var mk = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      monthIndex[mk] = (monthIndex[mk] || 0) + 1;
    });
    var weekRows = Object.keys(weekIndex).sort().slice(-12).map(function(k){return {label:k, count:weekIndex[k]};});
    var trendRows = Object.keys(monthIndex).sort().slice(-12).map(function(k){
      var parts = k.split('-'); return {label:htmlMonthLabel(parts[0], Number(parts[1])), count:monthIndex[k]};
    });
    var topNewValue = firstDated.slice().sort(function(a,b){return (b.total||0)-(a.total||0);}).slice(0,10);

    var inactiveBuckets = [
      {label:'0-30 يوم', min:0, max:30, count:0},
      {label:'31-60 يوم', min:31, max:60, count:0},
      {label:'61-90 يوم', min:61, max:90, count:0},
      {label:'91-180 يوم', min:91, max:180, count:0},
      {label:'+180 يوم', min:181, max:99999, count:0}
    ];
    customers.forEach(function(c){
      var days = c.last ? Math.max(0, Math.floor((now - c.last) / 86400000)) : 99999;
      inactiveBuckets.some(function(b){ if(days >= b.min && days <= b.max){ b.count++; return true; } return false; });
    });
    var inactiveByMonth = Object.create(null);
    customers.forEach(function(c){
      if(!c.last) return;
      var lost = new Date(c.last.getFullYear(), c.last.getMonth()+2, 1); // roughly after 60 days.
      var key = lost.getFullYear() + '-' + String(lost.getMonth()+1).padStart(2,'0');
      inactiveByMonth[key] = (inactiveByMonth[key] || 0) + 1;
    });
    var inactiveTrend = Object.keys(inactiveByMonth).sort().slice(-12).map(function(k){
      var parts = k.split('-'); return {label:htmlMonthLabel(parts[0], Number(parts[1])), count:inactiveByMonth[k]};
    });

    drawChart('newCustomersWeeklyChart',{type:'bar',data:{labels:weekRows.map(function(x){return x.label;}),datasets:[{label:'عملاء جدد',data:weekRows.map(function(x){return x.count;}),backgroundColor:cssVar('--purple','#8b5cf6'),borderRadius:10}]},options:Object.assign(baseOptions(),{layout:{padding:{top:24}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}})})});
    drawChart('newCustomersTopValueChart',{type:'bar',data:{labels:topNewValue.map(function(x){return x.name;}),datasets:[{label:'المبيعات',data:topNewValue.map(function(x){return x.total;}),backgroundColor:cssVar('--blue','#3b82f6'),borderRadius:10}]},options:Object.assign(baseOptions(),{indexAxis:'y',layout:{padding:{left:12,right:12}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,fullMoney:true,font:'900 10px Cairo'}})})});
    drawChart('newCustomersTrendChart',{type:'line',data:{labels:trendRows.map(function(x){return x.label;}),datasets:[{label:'عملاء جدد',data:trendRows.map(function(x){return x.count;}),borderColor:cssVar('--green','#22c55e'),backgroundColor:'rgba(34,197,94,.16)',tension:.35,pointRadius:4,fill:true}]},options:Object.assign(baseOptions(),{layout:{padding:{top:24}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}})})});
    drawChart('inactiveAgingChart',{type:'bar',data:{labels:inactiveBuckets.map(function(x){return x.label;}),datasets:[{label:'عدد العملاء',data:inactiveBuckets.map(function(x){return x.count;}),backgroundColor:cssVar('--orange','#f97316'),borderRadius:10}]},options:Object.assign(baseOptions(),{layout:{padding:{top:26}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}})})});
    drawChart('inactiveLostTrendChart',{type:'line',data:{labels:inactiveTrend.map(function(x){return x.label;}),datasets:[{label:'عملاء أصبحوا غير نشطين',data:inactiveTrend.map(function(x){return x.count;}),borderColor:cssVar('--red','#ef4444'),backgroundColor:'rgba(239,68,68,.16)',tension:.35,pointRadius:4,fill:true,clip:false}]},options:Object.assign(baseOptions(),{layout:{padding:{top:28,right:54,left:54,bottom:34}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo',offset:12}})})});

    // PETATOE v6.4.165 - New Customers initial month execution-order fix.
    // The customers fast renderer used to redraw the New Customers charts from all customer
    // history after the full report had already applied the default current-month state.
    // That made the May/Current month button look active while the weekly chart showed all
    // months until the user clicked the month manually. Re-apply the same local renderer that
    // is used by the month buttons at the end of the fast render so the first visible chart
    // is built from the active month state, not from the all-history fallback model.
    if(!window.__petatoeSmartCustomersFastSyncingNewCustomers){
      try{
        window.__petatoeSmartCustomersFastSyncingNewCustomers = true;
        if(typeof window.renderSmartCustomersNewCustomersLocal === 'function'){
          window.renderSmartCustomersNewCustomersLocal();
        }
      }catch(e){
        console.error('PETATOE new customers default-month sync failed', e);
      }finally{
        window.__petatoeSmartCustomersFastSyncingNewCustomers = false;
      }
    }

    window.__petatoeSmartCustomersRendered = true;
    perfPush('SmartReports.customers.fastRender', start, {records:records.length, customers:customers.length});
    return true;
  }


  // PETATOE v6.4.158 - New Customers filter binding hard fix.
  // Root cause: this fast-filter IIFE was calling invoiceRows(), but invoiceRows
  // is scoped inside the Smart Reports Router IIFE and is not visible here.
  // That ReferenceError stopped every year/month/more click before the local
  // renderer could rebuild the New Customers pane, so buttons looked inactive.
  function getSmartCustomerLocalInvoiceRows(){
    try{
      if(typeof window.petatoeSmartReportsRows === 'function'){
        var r0 = window.petatoeSmartReportsRows();
        return Array.isArray(r0) ? r0 : [];
      }
    }catch(e){ reportSmartCustomersSilentCatch('getLocalInvoiceRows.legacyRows', e); }
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){
        var r1 = window.PETATOEDataSource.getRecordsSync();
        return Array.isArray(r1) ? r1 : [];
      }
    }catch(e){ reportSmartCustomersSilentCatch('getLocalInvoiceRows.dataSource', e); }
    return Array.isArray(window.records) ? window.records : [];
  }


  // PETATOE v6.4.162 - Smart Reports DOM Optimization (A5.4)
  // Avoid re-parsing/replacing unchanged DOM blocks during local customer report
  // refreshes. This keeps the same UI/data but reduces table reflow after filters,
  // repeated tab opens, and chart-only updates.
  function petatoeSmartSetHtmlIfChanged(el, html){
    if(!el) return false;
    html = String(html == null ? '' : html);
    if(el.__petatoeSmartLastHtml === html) return false;
    el.__petatoeSmartLastHtml = html;
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function'){
      window.PETATOESafeRender.htmlSanitized(el, html, 'smart customers cached render');
    }else{
      el.replaceChildren(document.createRange().createContextualFragment(html));
    }
    return true;
  }
  function petatoeSmartReplaceWithHtmlIfChanged(el, html){
    if(!el) return false;
    html = String(html == null ? '' : html);
    if(el.__petatoeSmartLastHtml === html) return false;
    var frag = document.createRange().createContextualFragment(html);
    var next = frag.firstElementChild;
    if(!next) return false;
    next.__petatoeSmartLastHtml = html;
    el.replaceWith(next);
    return true;
  }
  try{
    window.petatoeSmartSetHtmlIfChanged = window.petatoeSmartSetHtmlIfChanged || petatoeSmartSetHtmlIfChanged;
    window.petatoeSmartReplaceWithHtmlIfChanged = window.petatoeSmartReplaceWithHtmlIfChanged || petatoeSmartReplaceWithHtmlIfChanged;
  }catch(e){ reportSmartCustomersSilentCatch('exportDomOptimizers', e); }

  function renderSmartCustomersNewCustomersLocal(){
    var start = perfNow();
    var rows = getSmartCustomerLocalInvoiceRows();
    var state = null;
    try{
      if(typeof window.buildSmartReportsNewCustomersState === 'function'){
        var yy = (typeof defaultYear === 'function') ? defaultYear(rows) : (new Date().getFullYear());
        state = window.buildSmartReportsNewCustomersState({records:rows, data:rows, y:yy, analysisNow:new Date()});
      }
    }catch(e){
      console.error('PETATOE customers local filter state failed', e);
      return false;
    }
    if(!state) return false;
    var pane = document.querySelector('[data-customer-analysis-pane="overview"]');
    if(!pane) return false;
    var yearControls = pane.querySelector('.new-cust-year-controls');
    if(yearControls) petatoeSmartSetHtmlIfChanged(yearControls, state.newCustYearButtons || '');
    var monthControls = pane.querySelector('.new-cust-controls');
    if(monthControls) petatoeSmartSetHtmlIfChanged(monthControls, state.newCustMonthButtons || '');
    var kpis = pane.querySelector('.new-cust-kpis');
    if(kpis){
      petatoeSmartSetHtmlIfChanged(kpis, [
        '<div class="new-cust-kpi"><span>العملاء الجدد</span><b>'+fmt0(state.newCustomersCount||0)+'</b><small>'+petatoeSmartCustomersEscHTML(state.newCustPeriodLabel||'-')+'</small></div>',
        '<div class="new-cust-kpi"><span>مبيعات العملاء الجدد</span><b>'+money(state.newCustomersTotal||0)+'</b><small>من نفس الشهر</small></div>',
        '<div class="new-cust-kpi"><span>متوسط العميل الجديد</span><b>'+money(state.newCustomersAvg||0)+'</b><small>إجمالي / عدد العملاء</small></div>',
        '<div class="new-cust-kpi"><span>معدل التحويل</span><b>'+Number(state.newCustomersConversion||0).toLocaleString('en-US',{maximumFractionDigits:1})+'%</b><small>عادوا أو نفذوا أكثر من عملية</small></div>',
        '<div class="new-cust-kpi"><span>أعلى عميل جديد</span><b>'+petatoeSmartCustomersEscHTML((state.topNewCustomer&&state.topNewCustomer.name)||'-')+'</b><small>'+money((state.topNewCustomer&&state.topNewCustomer.totalValue)||0)+'</small></div>'
      ].join(''));
    }
    var tableBody = pane.querySelector('.new-cust-table tbody');
    if(tableBody) petatoeSmartSetHtmlIfChanged(tableBody, state.newCustomerTableRows || '<tr><td colspan="12">لا توجد بيانات.</td></tr>');
    var oldFooter = pane.querySelector('.new-cust-table-footer');
    if(oldFooter){
      petatoeSmartReplaceWithHtmlIfChanged(oldFooter, state.newCustomerMoreButton || '');
    }
    var panels = pane.querySelectorAll('.smart-panel');
    if(panels && panels.length >= 5){
      var inactiveBody = panels[4].querySelector('tbody');
      if(inactiveBody) petatoeSmartSetHtmlIfChanged(inactiveBody, state.newCustomerInactiveRows || '<tr><td colspan="7">لا توجد بيانات.</td></tr>');
    }
    try{
      drawChart('newCustomersWeeklyChart',{type:'bar',data:{labels:(state.newCustWeekRows||[]).map(function(x){return x.label;}),datasets:[{label:'عملاء جدد',data:(state.newCustWeekRows||[]).map(function(x){return x.count;}),backgroundColor:cssVar('--purple','#8b5cf6'),borderRadius:10}]},options:Object.assign(baseOptions(),{layout:{padding:{top:24}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}})})});
      drawChart('newCustomersTopValueChart',{type:'bar',data:{labels:(state.newCustomerRows||[]).slice(0,10).map(function(x){return x.name;}),datasets:[{label:'المبيعات',data:(state.newCustomerRows||[]).slice(0,10).map(function(x){return x.totalValue;}),backgroundColor:cssVar('--blue','#3b82f6'),borderRadius:10}]},options:Object.assign(baseOptions(),{indexAxis:'y',layout:{padding:{left:12,right:12}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,fullMoney:true,font:'900 10px Cairo'}})})});
      drawChart('newCustomersTrendChart',{type:'line',data:{labels:(state.newCustTrendRows||[]).map(function(x){return x.label;}),datasets:[{label:'عملاء جدد',data:(state.newCustTrendRows||[]).map(function(x){return x.count;}),borderColor:cssVar('--green','#22c55e'),backgroundColor:'rgba(34,197,94,.16)',tension:.35,pointRadius:4,fill:true}]},options:Object.assign(baseOptions(),{layout:{padding:{top:24}},plugins:Object.assign((baseOptions().plugins||{}),{petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}})})});
    }catch(e){ console.error('PETATOE customers local charts failed', e); }
    perfPush('SmartReports.customers.newCustomers.localFilters', start, {rows:rows.length, customers:(state.newCustomerRows||[]).length});
    return true;
  }

  window.renderSmartCustomersNewCustomersLocal = renderSmartCustomersNewCustomersLocal;

  // PETATOE v6.4.157 - Smart Customers filters hard binding fix.
  // Root cause: v6.4.153 filters worked because they triggered the legacy full render.
  // After the customer tab was moved to a local fast renderer, some buttons were still
  // passing through old delegated paths or did not call the local renderer. This handler
  // is the single direct route for New Customers filters and it is also used by inline
  // onclick attributes generated in smart-reports-new-customers-real.js.
  function petatoeSmartCustomersHandleLocalFilter(el, ev){
    if(!el || !el.dataset) return false;
    var action = el.dataset.smartAction || '';
    if(action !== 'new-customer-year' && action !== 'new-customer-period' && action !== 'new-customer-more') return false;

    if(ev){
      try{ ev.preventDefault(); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-customers.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
      try{ ev.stopPropagation(); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-customers.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
      try{ ev.stopImmediatePropagation(); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-customers.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    }

    if(action === 'new-customer-year'){
      window.smartNewCustomerManualSelection = true;
      window.smartNewCustomerYear = el.dataset.year || 'all';
      window.smartNewCustomerPeriod = '';
      window.smartNewCustomerTableLimit = 10;
    } else if(action === 'new-customer-period'){
      window.smartNewCustomerManualSelection = true;
      window.smartNewCustomerPeriod = el.dataset.period || '';
      window.smartNewCustomerTableLimit = 10;
    } else if(action === 'new-customer-more'){
      window.smartNewCustomerTableLimit = Math.max(10, Number(el.dataset.limit || 10) || 10);
    }

    var ok = false;
    try{
      if(typeof renderSmartCustomersNewCustomersLocal === 'function'){
        ok = !!renderSmartCustomersNewCustomersLocal();
      }
    }catch(e){
      ok = false;
      console.error('PETATOE customers local filter render failed', e);
    }

    // Safe fallback: keep v6.4.153 working behavior if the local pane is not available yet.
    // Use the legacy full renderer directly; calling window.renderSmartReports after A4 may route
    // back to the fast customers renderer and skip rebuilding the New Customers filter pane.
    if(!ok){
      try{
        if(typeof window.__petatoeLegacyRenderSmartReports === 'function') window.__petatoeLegacyRenderSmartReports();
        else if(typeof window.renderSmartReports === 'function') window.renderSmartReports();
        if(typeof window.setSmartTab === 'function') window.setSmartTab('customers');
        if(typeof window.setCustomerAnalysisTab === 'function') window.setCustomerAnalysisTab('overview');
        ok = true;
      }catch(e){ console.error('PETATOE customers filter fallback render failed', e); }
    } else {
      try{
        if(typeof window.setCustomerAnalysisTab === 'function') window.setCustomerAnalysisTab('overview');
        var customersSection = document.querySelector('.smart-tab-section[data-smart-section="customers"]');
        var customersBtn = document.querySelector('[data-smart-tab="customers"]');
        if(customersSection){
          document.querySelectorAll('.smart-tab-section[data-smart-section]').forEach(function(sec){sec.classList.toggle('active', sec === customersSection);});
        }
        if(customersBtn){
          document.querySelectorAll('[data-smart-tab]').forEach(function(btn){btn.classList.toggle('active', btn === customersBtn);});
        }
      }catch(e){ reportSmartCustomersSilentCatch('localFilter.activateCustomersTab', e); }
    }
    return false;
  }
  window.petatoeSmartCustomersHandleLocalFilter = petatoeSmartCustomersHandleLocalFilter;
  window.petatoeSmartNewCustomerFilterClick = function(el, ev){ return petatoeSmartCustomersHandleLocalFilter(el, ev); };

  // Capture phase + inline onclick: both route to the same handler. stopImmediatePropagation
  // prevents the old v6.4.153 full-render delegated handler from taking over afterward.
  if(!window.__petatoeSmartCustomersFilterCaptureBoundV157){
    window.__petatoeSmartCustomersFilterCaptureBoundV157 = true;
    document.addEventListener('click', function(ev){
      var el = ev.target && ev.target.closest ? ev.target.closest('[data-smart-action="new-customer-year"],[data-smart-action="new-customer-period"],[data-smart-action="new-customer-more"]') : null;
      if(el){ petatoeSmartCustomersHandleLocalFilter(el, ev); }
    }, true);
  }

  window.renderSmartCustomers = renderSmartCustomers;
})();

/* PETATOE v6.4.159 - Smart Customers full filter binding fix
   Root cause: after v6.4.154 customers moved to fast local render, several customer
   report buttons still depended on renderSmartReports(). A4 routes that call to the
   fast customer renderer, which only redraws charts, so table filters/more/sort looked
   inactive. This binding handles every Customer Analytics table/filter action as one
   module and uses the stable legacy customer render only for those customer panes. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_CUSTOMERS_ALL_FILTERS_V159__) return;
  window.__PETATOE_SMART_CUSTOMERS_ALL_FILTERS_V159__ = true;

  var CUSTOMER_ACTIONS = {
    'customer-insight-more': true,
    'inactive-recovery-more': true,
    'inactive-sort': true,
    'inactive-more': true
  };

  function activateSmartCustomersPane(subtab){
    try{
      document.querySelectorAll('#smartTabs .smart-pill,[data-smart-tab]').forEach(function(btn){
        var t = btn.dataset ? (btn.dataset.smartTab || btn.getAttribute('data-smart-tab')) : btn.getAttribute('data-smart-tab');
        if(t) btn.classList.toggle('active', t === 'customers');
      });
      document.querySelectorAll('[data-smart-section]').forEach(function(sec){
        var s = sec.dataset ? (sec.dataset.smartSection || sec.getAttribute('data-smart-section')) : sec.getAttribute('data-smart-section');
        sec.classList.toggle('active', s === 'customers');
      });
      if(subtab) window.customerAnalysisSubTab = subtab;
      if(typeof window.setCustomerAnalysisTab === 'function'){
        window.setCustomerAnalysisTab(window.customerAnalysisSubTab || subtab || 'overview');
      }
    }catch(e){
      if(window.console && console.warn) console.warn('[PETATOE Smart Customers] activate pane skipped', e);
    }
  }

  function stableCustomerRender(subtab){
    var ok = false;
    try{
      if(typeof window.__petatoeLegacyRenderSmartReports === 'function'){
        window.__petatoeLegacyRenderSmartReports();
        ok = true;
      }else if(typeof window.renderSmartReports === 'function'){
        // Last fallback only. In normal v6.4.159 runtime this should not be used
        // because A4 router may local-route and skip table rebuilds.
        window.renderSmartReports('customers');
        ok = true;
      }
    }catch(e){
      console.error('[PETATOE Smart Customers] stable customer render failed', e);
      ok = false;
    }
    activateSmartCustomersPane(subtab || window.customerAnalysisSubTab || 'overview');
    try{
      if(window.PETATOESmartTabs && typeof window.PETATOESmartTabs.clearCaches === 'function'){
        // Do not clear invoice cache; only mark customer local charts to resize/update after DOM refresh.
      }
      setTimeout(function(){
        try{ Object.values(window.charts||{}).forEach(function(c){ try{ c.resize(); c.update('none'); }catch(_e){ reportSmartCustomersSilentCatch('chartResize.single', _e); } }); }catch(_e){ reportSmartCustomersSilentCatch('chartResize.batch', _e); }
      },60);
    }catch(e){ reportSmartCustomersSilentCatch('stableCustomerRender.resizeSchedule', e); }
    return ok;
  }

  function handleCustomerAction(el, ev){
    if(!el || !el.dataset) return true;
    var action = el.dataset.smartAction || '';
    if(!CUSTOMER_ACTIONS[action]) return true;

    if(ev){
      try{ ev.preventDefault(); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-customers.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
      try{ ev.stopPropagation(); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-customers.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
      try{ ev.stopImmediatePropagation(); }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-customers.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    }

    var subtab = 'overview';
    if(action === 'customer-insight-more'){
      window.customerInsightTableLimit = Number(el.dataset.limit || 10) || 10;
      subtab = 'overview';
    }else if(action === 'inactive-recovery-more'){
      window.inactiveRecoveryTableLimit = Number(el.dataset.limit || 15) || 15;
      subtab = 'ai';
    }else if(action === 'inactive-sort'){
      window.inactiveCustomerSort = el.dataset.sort || 'spend';
      window.inactiveCustTableLimit = 15;
      subtab = 'ai';
    }else if(action === 'inactive-more'){
      window.inactiveCustTableLimit = Number(el.dataset.limit || 15) || 15;
      subtab = 'ai';
    }

    stableCustomerRender(subtab);
    return false;
  }

  window.petatoeSmartCustomersHandleAllFilterActions = handleCustomerAction;

  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest ? ev.target.closest([
      '[data-smart-action="customer-insight-more"]',
      '[data-smart-action="inactive-recovery-more"]',
      '[data-smart-action="inactive-sort"]',
      '[data-smart-action="inactive-more"]'
    ].join(',')) : null;
    if(el) handleCustomerAction(el, ev);
  }, true);
})();
