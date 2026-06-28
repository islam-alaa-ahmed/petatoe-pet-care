/* PETATOE v3.11.26 Phase 4: Filters Finalization
   Central event delegation for critical report filters.
   This module replaces inline onchange/oninput filter wiring for Dashboard,
   Smart Reports, Executive Dashboard, Customer 360, Treasury, PDF period,
   Obligations and Sales Invoice Report filters.
*/
(function(){
  'use strict';
  if(window.PETATOEFiltersFinalization && window.PETATOEFiltersFinalization.__ready) return;

  function safe(fn){ try{ if(typeof fn==='function') return fn(); }catch(e){ console.error('[PETATOE Filters]', e); } }
  function byId(id){ return document.getElementById(id); }
  function call(name){ var args=Array.prototype.slice.call(arguments,1); return safe(function(){ var fn=window[name]; if(typeof fn==='function') return fn.apply(window,args); }); }
  function treasury(){ return window.PETATOETreasury || {}; }
  function warehouse(){ return window.PETATOEWarehouses || {}; }
  function warehouseUI(){ return window.PETATOEWarehouseUI || {}; }
  function warehouseAlerts(){ return window.PETATOEWarehouseAlerts || {}; }
  function resetCurrentPage(){ try{ if(typeof window.currentPage !== 'undefined') window.currentPage=1; }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-finalization.js",e);} }

  var invoiceTypingTimer=null;
  function salesInvoiceApply(kind, value){
    if(kind==='q'){
      clearTimeout(invoiceTypingTimer);
      invoiceTypingTimer=setTimeout(function(){ var m=window.PETATOESalesInvoiceReport; if(m&&typeof m.typeFilter==='function') m.typeFilter({value:value}); },160);
      return;
    }
    if(kind==='size'){
      var m=window.PETATOESalesInvoiceReport; if(m&&typeof m.setPageSize==='function') return m.setPageSize(value);
      return;
    }
    var m=window.PETATOESalesInvoiceReport; if(m&&typeof m.applyFilter==='function') m.applyFilter(kind);
  }

  var handlers={
    'dashboard': function(){ call('renderDashboardAll'); },
    'smart': function(){ call('renderSmartReports'); },
    'executive': function(){ call('renderExecutiveDashboard'); },
    'customer360-search': function(el){ call('renderCustomer360Panel', el.value || ''); },
    'obligations': function(){ call('renderObligationsPanel'); },
    'treasury-statement': function(){ var t=treasury(); safe(function(){ if(typeof t.renderStatement==='function') t.renderStatement(); }); },
    'treasury-balance': function(){ var t=treasury(); safe(function(){ if(typeof t.updateBalanceBox==='function') t.updateBalanceBox(); }); },
    'treasury-expense-balance': function(){ var t=treasury(); safe(function(){ if(typeof t.updateExpenseBalanceBox==='function') t.updateExpenseBalanceBox(); }); },
    'treasury-render': function(){ var t=treasury(); safe(function(){ if(typeof t.render==='function') t.render(); }); },
    'pdf-year': function(){ call('petatoePdfPeriodChanged','year'); },
    'pdf-month': function(){ call('petatoePdfPeriodChanged','month'); },
    'pdf-refresh': function(){ call('petatoeRefreshPdfReport'); },
    'sales-invoice-q': function(el){ salesInvoiceApply('q', el.value || ''); },
    'sales-invoice-year': function(){ salesInvoiceApply('year'); },
    'sales-invoice-month': function(){ salesInvoiceApply('month'); },
    'sales-invoice-day': function(){ salesInvoiceApply('day'); },
    'sales-invoice-client': function(){ salesInvoiceApply('client'); },
    'sales-invoice-van': function(){ salesInvoiceApply('van'); },
    'sales-invoice-service': function(){ salesInvoiceApply('service'); },
    'sales-invoice-pay': function(){ salesInvoiceApply('pay'); },
    'sales-invoice-size': function(el){ salesInvoiceApply('size', el.value); },
    'records': function(){ resetCurrentPage(); call('renderRecords'); },
    'records-size': function(){ resetCurrentPage(); call('renderRecords'); },
    'records-date': function(){ resetCurrentPage(); call('petRecordsReset'); },
    'warehouse-items': function(){ var u=warehouseUI(); safe(function(){ if(typeof u.renderItems==='function') u.renderItems(); }); },
    'warehouse-render': function(){ var w=warehouse(); safe(function(){ if(typeof w.render==='function') w.render(); }); },
    'warehouse-alerts': function(){ var a=warehouseAlerts(); safe(function(){ if(typeof a.render==='function') a.render(); }); },
    'warehouse-alert-limit': function(el){ var a=warehouseAlerts(); safe(function(){ if(typeof a.setLimit==='function') a.setLimit(el.value); }); },
    'warehouse-move-form': function(){ var w=warehouse(); safe(function(){ if(typeof w.updateMoveForm==='function') w.updateMoveForm(); }); },
    'warehouse-available': function(){ var w=warehouse(); safe(function(){ if(typeof w.updateAvailableBox==='function') w.updateAvailableBox(); }); },
    'warehouse-statement-open': function(){ var u=warehouseUI(); safe(function(){ if(typeof u.openStatementFromSelect==='function') u.openStatementFromSelect(); }); },
    'warehouse-statement': function(){ var w=warehouse(); safe(function(){ if(typeof w.renderStatement==='function') w.renderStatement(); }); }
  };
  var actions={
    'dashboard-refresh': function(){ call('renderDashboardAll'); },
    'dashboard-reset': function(){ call('resetFilters'); },
    'smart-refresh': function(){ call('renderSmartReports'); },
    'executive-refresh': function(){ call('renderExecutiveDashboard'); },
    'customer360-clear': function(){ var el=byId('customer360Search'); if(el) el.value=''; call('renderCustomer360Panel',''); },
    'treasury-reset': function(){ var t=treasury(); safe(function(){ if(typeof t.resetFilters==='function') t.resetFilters(); }); },
    'treasury-statement-clear': function(){ var t=treasury(); safe(function(){ if(typeof t.clearStatementFilters==='function') t.clearStatementFilters(); }); },
    'records-date-reset': function(){ call('petResetRecordDateFilters'); },
    'warehouse-reset': function(){ var w=warehouse(); safe(function(){ if(typeof w.resetFilters==='function') w.resetFilters(); }); }
  };

  function onInputChange(e){
    var el=e.target && e.target.closest && e.target.closest('[data-pet-filter]');
    if(!el) return;
    var key=el.getAttribute('data-pet-filter');
    var handler=handlers[key];
    if(!handler) return;
    handler(el,e);
  }
  function onClick(e){
    var el=e.target && e.target.closest && e.target.closest('[data-pet-action]');
    if(!el) return;
    var key=el.getAttribute('data-pet-action');
    var handler=actions[key];
    if(!handler) return;
    e.preventDefault();
    handler(el,e);
  }

  document.addEventListener('change', onInputChange, true);
  document.addEventListener('input', onInputChange, true);
  document.addEventListener('click', onClick, true);

  window.PETATOEFiltersFinalization={__ready:true, handlers:handlers, actions:actions};
})();
