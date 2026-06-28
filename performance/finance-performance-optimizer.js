/*
 * PETATOE v6.4.68 - PHASE P4 Finance Performance Optimizer
 * Scope: Payroll / Commission / Treasury only.
 * Safe external optimizer: no Router, Navigation, Storage, or Protected Operations changes.
 */
(function(){
  'use strict';
  if(window.__PETATOE_FINANCE_PERFORMANCE_OPTIMIZER__) return;
  window.__PETATOE_FINANCE_PERFORMANCE_OPTIMIZER__ = true;

  var stats = {
    version: 'v6.4.68',
    payrollWrapped: false,
    treasuryWrapped: false,
    commissionWrapped: false,
    callsCollapsed: 0,
    lastWrapAt: null
  };

  function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function warn(label, err){ try{ console.warn('[PETATOE Finance Performance]', label, err); }catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('performance/finance-performance-optimizer.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('performance/finance-performance-optimizer.js',_petatoeSilentCatch);}} }
  function debounce(fn, wait, label){
    var timer = null;
    var lastArgs = null;
    var lastThis = null;
    return function(){
      lastArgs = arguments;
      lastThis = this;
      if(timer){
        clearTimeout(timer);
        stats.callsCollapsed++;
      }
      timer = setTimeout(function(){
        timer = null;
        try{ fn.apply(lastThis, lastArgs); }
        catch(e){ warn(label || 'debounced call failed', e); }
      }, wait || 60);
    };
  }
  function safeWrap(obj, name, wait, label){
    if(!obj || typeof obj[name] !== 'function' || obj[name].__petatoeFinanceOptimized) return false;
    var original = obj[name];
    var wrapped = debounce(original, wait, label || name);
    wrapped.__petatoeFinanceOptimized = true;
    wrapped.__petatoeOriginal = original;
    obj[name] = wrapped;
    return true;
  }
  function safeWrapWindow(name, wait, label){
    if(typeof window[name] !== 'function' || window[name].__petatoeFinanceOptimized) return false;
    var original = window[name];
    var wrapped = debounce(original, wait, label || name);
    wrapped.__petatoeFinanceOptimized = true;
    wrapped.__petatoeOriginal = original;
    window[name] = wrapped;
    return true;
  }

  function wrapPayroll(){
    var P = window.PETATOEPayroll;
    if(!P || P.__financePerformanceWrapped) return !!(P && P.__financePerformanceWrapped);
    var changed = false;
    /* Filter/report render paths only. Mutating actions remain immediate. */
    changed = safeWrap(P, 'render', 70, 'payroll.render') || changed;
    changed = safeWrap(P, 'renderSalarySlip', 70, 'payroll.renderSalarySlip') || changed;
    changed = safeWrap(P, 'setArchiveFilter', 90, 'payroll.setArchiveFilter') || changed;
    changed = safeWrap(P, 'setMonthlyReportFilter', 90, 'payroll.setMonthlyReportFilter') || changed;
    if(changed){
      P.__financePerformanceWrapped = true;
      stats.payrollWrapped = true;
      stats.lastWrapAt = new Date().toISOString();
    }
    return changed;
  }

  function wrapTreasury(){
    var T = window.PETATOETreasury;
    if(!T || T.__financePerformanceWrapped) return !!(T && T.__financePerformanceWrapped);
    var changed = false;
    /* Heavy render/update paths only. Handover/expense/edit/delete stay immediate. */
    changed = safeWrap(T, 'render', 90, 'treasury.render') || changed;
    changed = safeWrap(T, 'renderStatement', 90, 'treasury.renderStatement') || changed;
    changed = safeWrap(T, 'renderAudit', 110, 'treasury.renderAudit') || changed;
    changed = safeWrap(T, 'updateBalanceBox', 70, 'treasury.updateBalanceBox') || changed;
    changed = safeWrap(T, 'updateExpenseBalanceBox', 70, 'treasury.updateExpenseBalanceBox') || changed;
    if(window.PETATOETreasuryTabsV82 && !window.PETATOETreasuryTabsV82.__financePerformanceWrapped){
      changed = safeWrap(window.PETATOETreasuryTabsV82, 'renderReports', 120, 'treasury.tabs.renderReports') || changed;
      window.PETATOETreasuryTabsV82.__financePerformanceWrapped = true;
    }
    if(changed){
      T.__financePerformanceWrapped = true;
      stats.treasuryWrapped = true;
      stats.lastWrapAt = new Date().toISOString();
    }
    return changed;
  }

  function wrapCommission(){
    if(window.__PETATOE_COMMISSION_PERFORMANCE_WRAPPED__) return true;
    var changed = false;
    changed = safeWrapWindow('renderCommissionSystem', 80, 'commission.renderCommissionSystem') || changed;
    changed = safeWrapWindow('renderCommissionStatementPage', 80, 'commission.renderCommissionStatementPage') || changed;
    if(changed){
      window.__PETATOE_COMMISSION_PERFORMANCE_WRAPPED__ = true;
      stats.commissionWrapped = true;
      stats.lastWrapAt = new Date().toISOString();
    }
    return changed;
  }

  function apply(){
    try{ wrapPayroll(); }catch(e){ warn('wrapPayroll', e); }
    try{ wrapTreasury(); }catch(e){ warn('wrapTreasury', e); }
    try{ wrapCommission(); }catch(e){ warn('wrapCommission', e); }
    return status();
  }

  function status(){
    return {
      version: stats.version,
      payrollWrapped: !!stats.payrollWrapped,
      treasuryWrapped: !!stats.treasuryWrapped,
      commissionWrapped: !!stats.commissionWrapped,
      callsCollapsed: stats.callsCollapsed,
      lastWrapAt: stats.lastWrapAt,
      scope: 'Payroll / Commission / Treasury render throttling only'
    };
  }

  window.PETATOEFinancePerformanceOptimizer = {
    apply: apply,
    status: status
  };

  function scheduleApply(){
    [0, 120, 350, 800, 1500].forEach(function(ms){ setTimeout(apply, ms); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleApply);
  else scheduleApply();
  document.addEventListener('petatoe:tabchange', function(e){
    var tab = e && e.detail && e.detail.tabId;
    if(['payroll','salarySlip','commissionStatement','commissions','treasury'].indexOf(tab) > -1){
      setTimeout(apply, 0);
    }
  });
})();
