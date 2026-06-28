(function(){
  'use strict';

  /**
   * PETATOE Operations Shared Context / Utilities Layer
   *
   * Phase OPS-11: provides one safe access point for shared operations
   * dependencies before deep extraction starts. This file does not change
   * business rules, UI, storage keys, rendering, or legacy execution flow.
   */
  if(window.PETATOEOperationsContext) return;

  var VERSION = 'OPS-12-utilities-extraction';

  function legacy(){
    return window.__PETATOEAppointmentsLegacyEngine || null;
  }

  function storage(){
    return window.PETATOEOperationsStorage || null;
  }

  function permissions(){
    return window.PETATOEPermissions || null;
  }

  function dataSource(){
    return window.PETATOEDataSource || null;
  }

  function settingsApi(){
    return window.__PETATOE_SETTINGS_API__ || null;
  }

  function currentUser(){
    return window.petCurrentUser || null;
  }

  function safeToast(message, type){
    try{
      if(typeof window.toastSafe === 'function') return window.toastSafe(message, type);
      if(typeof window.toast === 'function') return window.toast(message, type);
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-context.js",e);}
    return undefined;
  }

  function byId(id){
    return document.getElementById(id);
  }

  function valueOf(id, fallback){
    var el = byId(id);
    if(!el) return fallback == null ? '' : fallback;
    return el.value == null ? (fallback == null ? '' : fallback) : el.value;
  }

  function setValue(id, value){
    var el = byId(id);
    if(!el) return false;
    el.value = value == null ? '' : value;
    return true;
  }

  function textOf(id, fallback){
    var el = byId(id);
    if(!el) return fallback == null ? '' : fallback;
    return el.textContent == null ? (fallback == null ? '' : fallback) : el.textContent;
  }

  function setText(id, value){
    var el = byId(id);
    if(!el) return false;
    el.textContent = value == null ? '' : String(value);
    return true;
  }

  function normalizeId(value){
    return String(value == null ? '' : value);
  }

  function clone(value){
    if(value == null) return value;
    try{
      if(typeof structuredClone === 'function') return structuredClone(value);
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-context.js",e);}
    try{
      return JSON.parse(JSON.stringify(value));
    }catch(e){
      return value;
    }
  }

  function toArray(value){
    return Array.isArray(value) ? value : [];
  }


  function htmlEscape(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function formatMoney(value){
    var n = Number(value || 0);
    return n.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:2}) + ' SAR';
  }

  function pad2(value){
    return String(value).padStart(2, '0');
  }

  function dateKey(date){
    var d = date instanceof Date ? date : new Date(date);
    if(isNaN(d.getTime())) d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function todayKey(){
    return dateKey(new Date());
  }

  function addDays(base, days){
    var source = base instanceof Date ? base : new Date(base || Date.now());
    if(isNaN(source.getTime())) source = new Date();
    var d = new Date(source.getFullYear(), source.getMonth(), source.getDate());
    d.setDate(d.getDate() + Number(days || 0));
    return d;
  }

  function monthStart(date){
    var d = date instanceof Date ? date : new Date(date || Date.now());
    if(isNaN(d.getTime())) d = new Date();
    return dateKey(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function monthEnd(date){
    var d = date instanceof Date ? date : new Date(date || Date.now());
    if(isNaN(d.getTime())) d = new Date();
    return dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  }

  function weekRange(date){
    var d = date instanceof Date ? date : new Date(date || Date.now());
    if(isNaN(d.getTime())) d = new Date();
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = x.getDay();
    var diff = (day === 6 ? 0 : day + 1);
    var start = addDays(x, -diff);
    var end = addDays(start, 6);
    return {from: dateKey(start), to: dateKey(end)};
  }

  function appointmentDateTime(row){
    var d = String((row && row.date) || '');
    if(!d) return null;
    var t = String((row && row.start) || '00:00');
    var dt = new Date(d + 'T' + (t || '00:00'));
    return isNaN(dt.getTime()) ? null : dt;
  }

  function minutesUntil(row){
    var dt = appointmentDateTime(row);
    return dt ? Math.round((dt.getTime() - Date.now()) / 60000) : null;
  }

  function calcFinancials(base){
    base = base || {};
    var price = Number(base.sessionPrice || 0);
    var discount = Number(base.discount || 0);
    var paid = Number(base.paidAmount || 0);
    var total = Math.max(0, price - discount);
    var remaining = Math.max(0, total - paid);
    var collectionStatus = base.collectionStatus || '';
    if(!collectionStatus){
      collectionStatus = paid <= 0 ? 'غير محصل' : (remaining > 0 ? 'محصل جزئي' : 'محصل بالكامل');
    }
    return Object.assign({}, base, {
      sessionPrice: price,
      discount: discount,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      collectionStatus: collectionStatus
    });
  }

  function uniqueSorted(list){
    var out = [];
    (list || []).forEach(function(item){
      var value = String(item || '').trim();
      if(value && out.indexOf(value) === -1) out.push(value);
    });
    return out.sort(function(a,b){ return a.localeCompare(b, 'ar'); });
  }

  function callLegacy(method, args){
    var api = legacy();
    if(!api || typeof api[method] !== 'function') return undefined;
    return api[method].apply(api, args || []);
  }

  window.PETATOEOperationsContext = {
    version: VERSION,
    legacy: legacy,
    storage: storage,
    permissions: permissions,
    dataSource: dataSource,
    settingsApi: settingsApi,
    currentUser: currentUser,
    toast: safeToast,
    byId: byId,
    valueOf: valueOf,
    setValue: setValue,
    textOf: textOf,
    setText: setText,
    normalizeId: normalizeId,
    clone: clone,
    toArray: toArray,
    callLegacy: callLegacy,
    htmlEscape: htmlEscape,
    formatMoney: formatMoney,
    pad2: pad2,
    dateKey: dateKey,
    todayKey: todayKey,
    addDays: addDays,
    monthStart: monthStart,
    monthEnd: monthEnd,
    weekRange: weekRange,
    appointmentDateTime: appointmentDateTime,
    minutesUntil: minutesUntil,
    calcFinancials: calcFinancials,
    uniqueSorted: uniqueSorted
  };
})();
