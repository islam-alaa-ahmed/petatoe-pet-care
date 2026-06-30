/*
 * PETATOE v6.2.33 - Phase 8B SAFE Treasury Read-Only Facade
 * Scope: read-only facade for treasury data.
 * Guarantees:
 * - No DOM writes
 * - No event listeners
 * - No storage writes
 * - No treasury-core.js modification required
 * - No takeover of window.PETATOETreasury runtime API
 */
(function(){
  'use strict';
  if (window.PETATOETreasuryReadFacade && window.PETATOETreasuryReadFacade.__phase8bSafe) return;

  var TX_KEY = 'treasury_transactions';
  var AUDIT_KEY = 'treasury_audit';
  var CAT_KEY = 'treasury_categories';
  var OWNER = 'الخزنة الرئيسية للمالك';

  function warn(e){
    try{
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('treasury/treasury-read-facade.js', e);
      }
    }catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('treasury/treasury-read-facade.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('treasury/treasury-read-facade.js',_petatoeSilentCatch);}}
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
  function availNum(v){ var n = visibleNum(v); return n < 0 ? 0 : n; }
  function cloneArray(arr){
    try{ return JSON.parse(JSON.stringify(Array.isArray(arr) ? arr : [])); }
    catch(e){ warn(e); return Array.isArray(arr) ? arr.slice() : []; }
  }
  function treasuryStore(){ return window.PETATOETreasuryDataStore || { transactions:[], audit:[], categories:[] }; }
  function readArray(key){
    var store = treasuryStore();
    if(key === TX_KEY) return cloneArray(store.transactions);
    if(key === AUDIT_KEY) return cloneArray(store.audit);
    if(key === CAT_KEY) return cloneArray(store.categories);
    return [];
  }
  function records(){
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){
        var a = window.PETATOEDataSource.getRecordsSync();
        return Array.isArray(a) ? cloneArray(a) : [];
      }
    }catch(e){ warn(e); }
    return [];
  }
  function val(r, keys){
    for(var i=0;i<keys.length;i++){
      if(r && r[keys[i]] != null && clean(r[keys[i]]) !== '') return r[keys[i]];
    }
    return '';
  }
  function rowVehicle(r){ return clean(val(r,['van','vehicle','car','truck','السيارة','العربة'])); }
  function rowPay(r){ return clean(val(r,['pay','payment','paymentMethod','payMethod','طريقة الدفع','طريقة السداد'])); }
  function rowAmount(r){ return num(val(r,['totalInc','totalWithVat','gross','total','amount','الإجمالي','الاجمالي'])); }
  function isCash(p){ p = clean(p).toLowerCase(); return !!p && (/نقد|كاش|cash/.test(p)); }

  function getTransactions(){ return cloneArray(treasuryStore().transactions); }
  function getAudit(){ return cloneArray(treasuryStore().audit); }
  function getCategories(){ return cloneArray(treasuryStore().categories); }

  function getCashRows(){
    return records().filter(function(r){ return rowVehicle(r) && isCash(rowPay(r)); });
  }
  function getCashByVehicle(){
    var m = {};
    getCashRows().forEach(function(r){ var v = rowVehicle(r); m[v] = (m[v] || 0) + rowAmount(r); });
    return m;
  }
  function getVehicleList(){
    var s = {};
    records().forEach(function(r){ var v = rowVehicle(r); if(v) s[v] = 1; });
    getTransactions().forEach(function(t){ var v = clean(t && (t.vehicle || t.source)); if(v && v !== OWNER) s[v] = 1; });
    return Object.keys(s).filter(Boolean).sort();
  }
  function deliveredByVehicle(ignoreId){
    var m = {};
    getTransactions().forEach(function(t){
      if(clean(t && t.id) === clean(ignoreId)) return;
      if(t && t.type === 'handover'){
        var v = clean(t.vehicle);
        m[v] = (m[v] || 0) + num(t.amount);
      }
    });
    return m;
  }
  function expensesBySource(ignoreId){
    var m = {};
    getTransactions().forEach(function(t){
      if(clean(t && t.id) === clean(ignoreId)) return;
      if(t && t.type === 'expense'){
        var src = clean(t.source || t.vehicle || OWNER);
        m[src] = (m[src] || 0) + num(t.amount);
      }
    });
    return m;
  }
  function vehicleBalanceRaw(vehicle, ignoreId){
    vehicle = clean(vehicle);
    var cash = getCashByVehicle();
    var delivered = deliveredByVehicle(ignoreId);
    var expenses = expensesBySource(ignoreId);
    return (cash[vehicle] || 0) - (delivered[vehicle] || 0) - (expenses[vehicle] || 0);
  }
  function vehicleBalance(vehicle, ignoreId){ return availNum(vehicleBalanceRaw(vehicle, ignoreId)); }
  function mainReceived(ignoreId){
    return getTransactions().reduce(function(s,t){
      return s + ((t && t.type === 'handover' && clean(t.id) !== clean(ignoreId)) ? num(t.amount) : 0);
    }, 0);
  }
  function mainSpent(ignoreId){
    return getTransactions().reduce(function(s,t){
      return s + ((t && t.type === 'expense' && clean(t.id) !== clean(ignoreId) && clean(t.source || OWNER) === OWNER) ? num(t.amount) : 0);
    }, 0);
  }
  function mainBalanceRaw(ignoreId){ return mainReceived(ignoreId) - mainSpent(ignoreId); }
  function mainBalance(ignoreId){ return availNum(mainBalanceRaw(ignoreId)); }
  function vaultBalance(source, ignoreId){ source = clean(source) || OWNER; return source === OWNER ? mainBalance(ignoreId) : vehicleBalance(source, ignoreId); }

  function summary(){
    var vehicles = getVehicleList();
    var cash = getCashByVehicle();
    var tx = getTransactions();
    var vehicleBalances = vehicles.map(function(v){ return { vehicle:v, cash: visibleNum(cash[v] || 0), balance: vehicleBalance(v) }; });
    return {
      owner: OWNER,
      vehicleCount: vehicles.length,
      transactionCount: tx.length,
      auditCount: getAudit().length,
      categoryCount: getCategories().length,
      mainReceived: visibleNum(mainReceived()),
      mainSpent: visibleNum(mainSpent()),
      mainBalance: mainBalance(),
      vehicleBalances: vehicleBalances
    };
  }

  var api = {
    __phase8bSafe: true,
    __readOnly: true,
    owner: OWNER,
    keys: Object.freeze({ transactions: TX_KEY, audit: AUDIT_KEY, categories: CAT_KEY }),
    transactions: getTransactions,
    audit: getAudit,
    categories: getCategories,
    records: records,
    cashRows: getCashRows,
    cashByVehicle: getCashByVehicle,
    vehicleList: getVehicleList,
    vehicleBalanceRaw: vehicleBalanceRaw,
    vehicleBalance: vehicleBalance,
    mainReceived: mainReceived,
    mainSpent: mainSpent,
    mainBalanceRaw: mainBalanceRaw,
    mainBalance: mainBalance,
    vaultBalance: vaultBalance,
    summary: summary
  };

  try{ window.PETATOETreasuryReadFacade = Object.freeze(api); }
  catch(e){ window.PETATOETreasuryReadFacade = api; }
})();
