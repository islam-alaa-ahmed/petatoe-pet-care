(function(window){
  'use strict';

  if(window.__PETATOE_REPORT_ADAPTERS_READY__ && window.PETATOEReportAdapters){
    return;
  }
  window.__PETATOE_REPORT_ADAPTERS_READY__ = true;

  var Adapters = window.PETATOEReportAdapters || {};

  function normalizeRows(rows){
    return Array.isArray(rows) ? rows : [];
  }

  function salesInvoiceModule(){
    return window.PETATOESalesInvoiceReport || null;
  }

  Adapters.normalizeRows = Adapters.normalizeRows || normalizeRows;
  Adapters.salesInvoices = {
    name: 'sales-invoices',
    normalizeRows: normalizeRows,
    render: function(){
      var mod = salesInvoiceModule();
      if(mod && typeof mod.render === 'function') return mod.render();
    },
    getFilteredData: function(){
      var mod = salesInvoiceModule();
      return mod && typeof mod.getFilteredData === 'function' ? mod.getFilteredData() : [];
    },
    getExportRows: function(){
      var mod = salesInvoiceModule();
      return mod && typeof mod.getFilteredRows === 'function' ? mod.getFilteredRows() : [];
    }
  };
  Adapters.customerCompare = Adapters.customerCompare || {
    name: 'customer-compare',
    normalizeRows: normalizeRows
  };

  window.PETATOEReportAdapters = Adapters;
})(window);
