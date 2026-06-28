/* PETATOE v3.10.1 - Filters Adapters
   Central place for report-specific bridges. Does not alter calculations; it only calls existing report functions safely. */
(function(){
  'use strict';
  if(window.PETATOEFiltersAdapters && window.PETATOEFiltersAdapters.__v3101) return;
  function call(fnName){
    try{ if(typeof window[fnName] === 'function') return window[fnName].apply(window, Array.prototype.slice.call(arguments,1)); }catch(e){ console.error('PETATOE filter adapter call failed:', fnName, e); }
  }
  function renderSalesInvoices(focusId){
    var mod=window.PETATOESalesInvoiceReport;
    try{ if(mod&&typeof mod.render==='function') return mod.render(focusId); }catch(e){ console.error('PETATOE sales invoice adapter failed', e); }
  }
  function registerSalesInvoice(){
    if(!window.PETATOEFiltersEvents) return false;
    // Non-exclusive: lets original inline onchange run. Fallback runs only if report did not update.
    window.PETATOEFiltersEvents.register({
      root:'#salesInvoiceReportArea', event:'change', ids:['sir_year','sir_month','sir_day','sir_client','sir_van','sir_service','sir_pay'], exclusive:false,
      handler:function(el){
        if(!window.petSalesInvoiceReportState) window.petSalesInvoiceReportState = {};
        var key = String(el.id||'').replace(/^sir_/,'');
        window.petSalesInvoiceReportState[key] = el.value || '';
        if(key==='year'){ window.petSalesInvoiceReportState.month=''; window.petSalesInvoiceReportState.day=''; }
        if(key==='month'){ window.petSalesInvoiceReportState.day=''; }
        window.petSalesInvoiceReportState.page = 1;
        window.petSalesInvoiceReportState.selected = '';
        window.petSalesInvoiceReportState.previewOpen = false;
        window.PETATOEFiltersEvents.debounce('sir_render_'+key, function(){ renderSalesInvoices(); }, 30);
      }
    });
    window.PETATOEFiltersEvents.register({
      root:'#salesInvoiceReportArea', event:'input', ids:['sir_q'], exclusive:false,
      handler:function(el){
        if(!window.petSalesInvoiceReportState) window.petSalesInvoiceReportState = {};
        window.petSalesInvoiceReportState.q = el.value || '';
        window.petSalesInvoiceReportState.page = 1;
        window.PETATOEFiltersEvents.debounce('sir_q_render', function(){ renderSalesInvoices('sir_q'); }, 220);
      }
    });
    return true;
  }
  function boot(){
    if(!window.PETATOEFiltersEvents){ setTimeout(boot,80); return; }
    registerSalesInvoice();
    if(window.PETATOEFiltersRender) window.PETATOEFiltersRender.normalize(document);
  }
  boot();
  window.PETATOEFiltersAdapters = {__v3101:true, call:call, registerSalesInvoice:registerSalesInvoice};
})();
