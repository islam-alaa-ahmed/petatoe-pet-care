/* PETATOE Phase 5 — deprecated root compatibility loader.
   Canonical owner: sales/invoice-manual-multi-items.js via salesManualItems. */
(function(){
  'use strict';
  if(window.__PETATOE_ROOT_INVOICE_MANUAL_COMPAT__) return;
  window.__PETATOE_ROOT_INVOICE_MANUAL_COMPAT__ = true;
  var gate = window.PETATOEMobileStartupGate;
  if(gate && typeof gate.ensureGroup === 'function'){
    gate.ensureGroup('salesManualItems').catch(function(error){
      if(window.console && console.warn) console.warn('[PETATOE] canonical manual invoice runtime failed', error);
    });
  }else if(window.console && console.warn){
    console.warn('[PETATOE] deprecated invoice-manual-multi-items.js loaded; canonical runtime was not available.');
  }
})();
