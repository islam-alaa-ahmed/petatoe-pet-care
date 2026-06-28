/*
 * PETATOE v6.2.34 - Phase 8C SAFE Treasury Computed Read Facade
 * Scope: computed read-only facade for treasury data.
 * Guarantees:
 * - No DOM writes
 * - No event listeners
 * - No storage writes
 * - No treasury-core.js modification required
 * - No takeover of window.PETATOETreasury runtime API
 */
(function(){
  'use strict';
  if (window.PETATOETreasuryComputedFacade && window.PETATOETreasuryComputedFacade.__phase8cSafe) return;

  var OWNER = 'الخزنة الرئيسية للمالك';

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('treasury/treasury-computed-facade.js', e);
      }
    }catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('treasury/treasury-computed-facade.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('treasury/treasury-computed-facade.js',_petatoeSilentCatch);}}
  }
  function readFacade(){ return window.PETATOETreasuryReadFacade || null; }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function num(v){
    try{
      if(window.PETATOENumber && typeof window.PETATOENumber.num === 'function') return window.PETATOENumber.num(v);
    }catch(e){ warn(e); }
    var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g,''));
    return isNaN(n) ? 0 : n;
  }
  function visibleNum(v){ var n = num(v); return Math.abs(n) < 0.005 ? 0 : n; }
  function clone(v){
    try{ return JSON.parse(JSON.stringify(v)); }
    catch(e){ warn(e); return v; }
  }
  function list(fn){
    var rf = readFacade();
    try{
      if(rf && typeof rf[fn] === 'function'){
        var a = rf[fn]();
        return Array.isArray(a) ? a : [];
      }
    }catch(e){ warn(e); }
    return [];
  }
  function call(fn){
    var rf = readFacade();
    var args = Array.prototype.slice.call(arguments, 1);
    try{
      if(rf && typeof rf[fn] === 'function') return rf[fn].apply(rf, args);
    }catch(e){ warn(e); }
    return undefined;
  }
  function transactionType(t){ return clean(t && t.type); }
  function txAmount(t){ return visibleNum(t && t.amount); }
  function txSource(t){ return clean(t && (t.source || t.vehicle || OWNER)) || OWNER; }
  function txVehicle(t){ return clean(t && t.vehicle); }
  function txDate(t){
    var raw = t && (t.time || t.date || t.createdAt);
    var d = raw ? new Date(raw) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }
  function dateKey(d){
    if(!d) return '';
    var y = d.getFullYear();
    var m = String(d.getMonth()+1).padStart(2,'0');
    var day = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }
  function todayKey(){ return dateKey(new Date()); }

  function totalsByType(){
    var tx = list('transactions');
    var out = { handover:0, expense:0, adjustment:0, other:0, count: tx.length };
    tx.forEach(function(t){
      var type = transactionType(t);
      if(type === 'handover') out.handover += txAmount(t);
      else if(type === 'expense') out.expense += txAmount(t);
      else if(type === 'adjustment') out.adjustment += txAmount(t);
      else out.other += txAmount(t);
    });
    Object.keys(out).forEach(function(k){ if(k !== 'count') out[k] = visibleNum(out[k]); });
    return out;
  }

  function totalsBySource(){
    var tx = list('transactions');
    var out = {};
    tx.forEach(function(t){
      var src = txSource(t);
      if(!out[src]) out[src] = { source:src, handover:0, expense:0, adjustment:0, net:0, count:0 };
      var amount = txAmount(t);
      var type = transactionType(t);
      out[src].count += 1;
      if(type === 'handover') out[src].handover += amount;
      else if(type === 'expense') out[src].expense += amount;
      else if(type === 'adjustment') out[src].adjustment += amount;
      out[src].net = out[src].handover - out[src].expense + out[src].adjustment;
    });
    return Object.keys(out).sort().map(function(k){
      var r = out[k];
      r.handover = visibleNum(r.handover);
      r.expense = visibleNum(r.expense);
      r.adjustment = visibleNum(r.adjustment);
      r.net = visibleNum(r.net);
      return r;
    });
  }

  function dailyTotals(){
    var tx = list('transactions');
    var out = {};
    tx.forEach(function(t){
      var k = dateKey(txDate(t)) || 'غير محدد';
      if(!out[k]) out[k] = { date:k, handover:0, expense:0, adjustment:0, net:0, count:0 };
      var amount = txAmount(t);
      var type = transactionType(t);
      out[k].count += 1;
      if(type === 'handover') out[k].handover += amount;
      else if(type === 'expense') out[k].expense += amount;
      else if(type === 'adjustment') out[k].adjustment += amount;
      out[k].net = out[k].handover - out[k].expense + out[k].adjustment;
    });
    return Object.keys(out).sort().map(function(k){
      var r = out[k];
      r.handover = visibleNum(r.handover);
      r.expense = visibleNum(r.expense);
      r.adjustment = visibleNum(r.adjustment);
      r.net = visibleNum(r.net);
      return r;
    });
  }

  function todaySnapshot(){
    var k = todayKey();
    var row = dailyTotals().filter(function(r){ return r.date === k; })[0] || { date:k, handover:0, expense:0, adjustment:0, net:0, count:0 };
    return clone(row);
  }

  function vaultBalances(){
    var rf = readFacade();
    var vehicles = list('vehicleList');
    var rows = [{ source: OWNER, type:'owner', balance: visibleNum(call('mainBalance') || 0) }];
    vehicles.forEach(function(v){ rows.push({ source:v, type:'vehicle', balance: visibleNum(call('vehicleBalance', v) || 0) }); });
    if(!rf) return rows;
    return rows;
  }

  function integritySnapshot(){
    var tx = list('transactions');
    var missingAmount = 0;
    var missingType = 0;
    var negativeAmount = 0;
    tx.forEach(function(t){
      if(!transactionType(t)) missingType += 1;
      if(clean(t && t.amount) === '') missingAmount += 1;
      if(txAmount(t) < 0) negativeAmount += 1;
    });
    return {
      transactionCount: tx.length,
      auditCount: list('audit').length,
      categoryCount: list('categories').length,
      missingType: missingType,
      missingAmount: missingAmount,
      negativeAmount: negativeAmount
    };
  }

  function dashboardSnapshot(){
    var summary = call('summary') || {};
    return {
      owner: OWNER,
      mainBalance: visibleNum(summary.mainBalance || call('mainBalance') || 0),
      mainReceived: visibleNum(summary.mainReceived || call('mainReceived') || 0),
      mainSpent: visibleNum(summary.mainSpent || call('mainSpent') || 0),
      vehicleCount: summary.vehicleCount || list('vehicleList').length,
      transactionCount: summary.transactionCount || list('transactions').length,
      totalsByType: totalsByType(),
      today: todaySnapshot(),
      vaultBalances: vaultBalances(),
      integrity: integritySnapshot()
    };
  }

  var api = {
    __phase8cSafe: true,
    __readOnly: true,
    owner: OWNER,
    totalsByType: totalsByType,
    totalsBySource: totalsBySource,
    dailyTotals: dailyTotals,
    todaySnapshot: todaySnapshot,
    vaultBalances: vaultBalances,
    integritySnapshot: integritySnapshot,
    dashboardSnapshot: dashboardSnapshot
  };

  try{ window.PETATOETreasuryComputedFacade = Object.freeze(api); }
  catch(e){ window.PETATOETreasuryComputedFacade = api; }
})();
