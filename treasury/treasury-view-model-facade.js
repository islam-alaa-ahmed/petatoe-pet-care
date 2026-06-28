/*
 * PETATOE v6.2.35 - Phase 8D SAFE Treasury View-Model Facade
 * Scope: read-only presentation view-models for treasury data.
 * Guarantees:
 * - No DOM writes
 * - No event listeners
 * - No storage writes
 * - No treasury-core.js modification required
 * - No takeover of window.PETATOETreasury runtime API
 */
(function(){
  'use strict';
  if (window.PETATOETreasuryViewModelFacade && window.PETATOETreasuryViewModelFacade.__phase8dSafe) return;

  var OWNER = 'الخزنة الرئيسية للمالك';

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('treasury/treasury-view-model-facade.js', e);
      }
    }catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('treasury/treasury-view-model-facade.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('treasury/treasury-view-model-facade.js',_petatoeSilentCatch);}}
  }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function num(v){
    try{
      if(window.PETATOENumber && typeof window.PETATOENumber.num === 'function') return window.PETATOENumber.num(v);
    }catch(e){ warn(e); }
    var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g,''));
    return isNaN(n) ? 0 : n;
  }
  function visibleNum(v){ var n = num(v); return Math.abs(n) < 0.005 ? 0 : n; }
  function money(v){
    var n = visibleNum(v);
    try{
      if(window.PETATOENumber && typeof window.PETATOENumber.formatMoney === 'function') return window.PETATOENumber.formatMoney(n);
    }catch(e){ warn(e); }
    try{ return n.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' SAR'; }
    catch(_e){ return String(n.toFixed ? n.toFixed(2) : n) + ' SAR'; }
  }
  function clone(v){ try{ return JSON.parse(JSON.stringify(v)); }catch(e){ warn(e); return v; } }
  function computed(){ return window.PETATOETreasuryComputedFacade || null; }
  function read(){ return window.PETATOETreasuryReadFacade || null; }
  function call(obj, fn){
    var args = Array.prototype.slice.call(arguments, 2);
    try{ if(obj && typeof obj[fn] === 'function') return obj[fn].apply(obj, args); }
    catch(e){ warn(e); }
    return undefined;
  }
  function arr(v){ return Array.isArray(v) ? v : []; }
  function directionClass(v){
    v = visibleNum(v);
    if(v > 0) return 'positive';
    if(v < 0) return 'negative';
    return 'neutral';
  }
  function typeLabel(type){
    type = clean(type);
    if(type === 'handover') return 'تسليم نقدية';
    if(type === 'expense') return 'مصروف';
    if(type === 'adjustment') return 'تسوية';
    return type || 'غير محدد';
  }
  function sourceTypeLabel(type){
    type = clean(type);
    if(type === 'owner') return 'الخزنة الرئيسية';
    if(type === 'vehicle') return 'سيارة';
    return type || 'مصدر';
  }

  function summaryCards(){
    var cf = computed();
    var snap = call(cf, 'dashboardSnapshot') || {};
    return [
      { id:'main-balance', title:'رصيد الخزنة الرئيسية', value:money(snap.mainBalance), raw:visibleNum(snap.mainBalance), tone:directionClass(snap.mainBalance) },
      { id:'main-received', title:'إجمالي التسليمات', value:money(snap.mainReceived), raw:visibleNum(snap.mainReceived), tone:'positive' },
      { id:'main-spent', title:'إجمالي المصروفات', value:money(snap.mainSpent), raw:visibleNum(snap.mainSpent), tone:'negative' },
      { id:'treasury-transactions', title:'عدد الحركات', value:String(snap.transactionCount || 0), raw:Number(snap.transactionCount || 0), tone:'neutral' }
    ];
  }

  function vaultBalanceRows(){
    var cf = computed();
    return arr(call(cf, 'vaultBalances')).map(function(r, idx){
      var balance = visibleNum(r && r.balance);
      return {
        index: idx + 1,
        source: clean(r && r.source) || OWNER,
        type: clean(r && r.type) || 'source',
        typeLabel: sourceTypeLabel(r && r.type),
        balance: balance,
        balanceText: money(balance),
        tone: directionClass(balance)
      };
    });
  }

  function typeRows(){
    var cf = computed();
    var totals = call(cf, 'totalsByType') || {};
    return ['handover','expense','adjustment','other'].map(function(type){
      var value = visibleNum(totals[type] || 0);
      return {
        type: type,
        label: typeLabel(type),
        amount: value,
        amountText: money(value),
        count: totals.count || 0,
        tone: type === 'expense' ? 'negative' : (value > 0 ? 'positive' : 'neutral')
      };
    });
  }

  function sourceRows(){
    var cf = computed();
    return arr(call(cf, 'totalsBySource')).map(function(r, idx){
      var net = visibleNum(r && r.net);
      return {
        index: idx + 1,
        source: clean(r && r.source) || OWNER,
        handover: visibleNum(r && r.handover),
        handoverText: money(r && r.handover),
        expense: visibleNum(r && r.expense),
        expenseText: money(r && r.expense),
        adjustment: visibleNum(r && r.adjustment),
        adjustmentText: money(r && r.adjustment),
        net: net,
        netText: money(net),
        count: Number((r && r.count) || 0),
        tone: directionClass(net)
      };
    });
  }

  function dailyRows(limit){
    var cf = computed();
    var rows = arr(call(cf, 'dailyTotals')).slice().reverse();
    if(limit && limit > 0) rows = rows.slice(0, limit);
    return rows.map(function(r, idx){
      var net = visibleNum(r && r.net);
      return {
        index: idx + 1,
        date: clean(r && r.date) || 'غير محدد',
        handover: visibleNum(r && r.handover),
        handoverText: money(r && r.handover),
        expense: visibleNum(r && r.expense),
        expenseText: money(r && r.expense),
        adjustment: visibleNum(r && r.adjustment),
        adjustmentText: money(r && r.adjustment),
        net: net,
        netText: money(net),
        count: Number((r && r.count) || 0),
        tone: directionClass(net)
      };
    });
  }

  function integrityCards(){
    var cf = computed();
    var i = call(cf, 'integritySnapshot') || {};
    return [
      { id:'tx-count', title:'حركات الخزنة', value:String(i.transactionCount || 0), raw:Number(i.transactionCount || 0), tone:'neutral' },
      { id:'audit-count', title:'سجل المراجعة', value:String(i.auditCount || 0), raw:Number(i.auditCount || 0), tone:'neutral' },
      { id:'missing-type', title:'حركات بدون نوع', value:String(i.missingType || 0), raw:Number(i.missingType || 0), tone:(i.missingType ? 'warning' : 'positive') },
      { id:'missing-amount', title:'حركات بدون مبلغ', value:String(i.missingAmount || 0), raw:Number(i.missingAmount || 0), tone:(i.missingAmount ? 'warning' : 'positive') }
    ];
  }

  function dashboardViewModel(){
    return {
      __readOnly: true,
      owner: OWNER,
      generatedAt: new Date().toISOString(),
      cards: summaryCards(),
      vaultBalances: vaultBalanceRows(),
      totalsByType: typeRows(),
      totalsBySource: sourceRows(),
      recentDailyTotals: dailyRows(12),
      integrity: integrityCards()
    };
  }

  var api = {
    __phase8dSafe: true,
    __readOnly: true,
    owner: OWNER,
    money: money,
    summaryCards: summaryCards,
    vaultBalanceRows: vaultBalanceRows,
    typeRows: typeRows,
    sourceRows: sourceRows,
    dailyRows: dailyRows,
    integrityCards: integrityCards,
    dashboardViewModel: dashboardViewModel,
    clone: clone
  };

  try{ window.PETATOETreasuryViewModelFacade = Object.freeze(api); }
  catch(e){ window.PETATOETreasuryViewModelFacade = api; }
})();
