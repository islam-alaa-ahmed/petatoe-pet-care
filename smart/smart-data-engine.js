/* PETATOE v6.4.153 - Smart Reports Performance Profiling Phase A5.1
   SAFE BASELINE:
   - Creates a central read-only invoice aggregation engine.
   - Adds shared customer grouping helpers for remaining Smart Reports.
   - Keeps invoice/manual sales records as the only source of Smart Reports data.
*/
(function(){
  'use strict';

  const ENGINE_VERSION = 'v6.4.163-A5.5';
  let cacheKey = '';
  let cacheValue = null;
  let derivedCache = Object.create(null);


  function perfNow(){
    try{ return (window.performance && performance.now) ? performance.now() : Date.now(); }catch(e){ return Date.now(); }
  }

  function smartPerfMeasure(name, start, meta){
    try{
      const end = perfNow();
      const item = Object.assign({ name, ms: +(end-start).toFixed(2), at: Date.now() }, meta || {});
      window.__PETATOE_SMART_PERF__ = window.__PETATOE_SMART_PERF__ || [];
      window.__PETATOE_SMART_PERF__.push(item);
      if(window.__PETATOE_SMART_PERF__.length > 120) window.__PETATOE_SMART_PERF__.shift();
      if(window.__PETATOE_SMART_PERF_DEBUG__) window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-data-engine.js",value:'[PETATOE SmartPerf]', item});
      return item;
    }catch(e){ return null; }
  }

  function smartPerfReport(){
    const rows = (window.__PETATOE_SMART_PERF__ || []).slice();
    try{ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("console.table",{source:"smart/smart-data-engine.js",value:rows}); }catch(e){ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-data-engine.js",value:rows}); }
    return rows;
  }

  function getDerivedCache(ns){
    if(!derivedCache[ns]) derivedCache[ns] = Object.create(null);
    return derivedCache[ns];
  }

  function memoizeSmart(ns, key, factory){
    const bucket = getDerivedCache(ns);
    const k = String(key || 'default');
    if(Object.prototype.hasOwnProperty.call(bucket, k)){
      return bucket[k];
    }
    const start = perfNow();
    const value = factory();
    bucket[k] = value;
    smartPerfMeasure('SmartDataEngine.memoBuild.' + ns, start, {key:k});
    return value;
  }

  window.__PETATOE_SMART_PERF__ = window.__PETATOE_SMART_PERF__ || [];
  window.petatoeSmartPerfReport = window.petatoeSmartPerfReport || smartPerfReport;
  window.petatoeSmartPerfClear = window.petatoeSmartPerfClear || function(){ window.__PETATOE_SMART_PERF__ = []; return true; };

  function asArray(records){
    return Array.isArray(records) ? records : [];
  }

  function toNumber(value){
    if(value === null || value === undefined || value === '') return 0;
    if(typeof value === 'number') return isFinite(value) ? value : 0;
    const cleaned = String(value).replace(/[,\s]/g,'').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const n = Number(cleaned);
    return isFinite(n) ? n : 0;
  }

  function text(value, fallback){
    const v = String(value === null || value === undefined ? '' : value).trim();
    return v || (fallback || 'غير محدد');
  }

  function pick(row, keys, fallback){
    for(const key of keys){
      if(row && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
    }
    return fallback;
  }

  function parseRecordDate(row){
    const value = pick(row, ['date','invoiceDate','createdAt','created_at','التاريخ','Date'], '');
    if(!value) return null;
    if(value instanceof Date && !isNaN(value)) return value;
    const raw = String(value).trim();
    let m = raw.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
    m = raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if(m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  }

  function monthName(date){
    if(!date) return 'غير محدد';
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return months[date.getMonth()] || 'غير محدد';
  }

  function addSum(index, key, amount, countInc){
    const name = text(key);
    if(!index[name]) index[name] = {name, count:0, total:0};
    index[name].count += countInc === false ? 0 : 1;
    index[name].total += amount;
    return index[name];
  }

  function addCustomer(index, key, amount, date, row){
    const name = text(key);
    if(!index[name]){
      index[name] = {
        name,
        count:0,
        total:0,
        invoices:new Set(),
        firstDate:null,
        lastDate:null,
        phone:text(pick(row, ['phone','mobile','clientPhone','customerPhone','جوال','الهاتف'], ''), ''),
        address:text(pick(row, ['address','clientAddress','customerAddress','العنوان'], ''), '')
      };
    }
    const item = index[name];
    item.count += 1;
    item.total += amount;
    const invoice = text(pick(row, ['invoice','invoiceNo','invoiceNumber','رقم الفاتورة'], ''), '');
    if(invoice) item.invoices.add(invoice);
    if(date){
      if(!item.firstDate || date < item.firstDate) item.firstDate = date;
      if(!item.lastDate || date > item.lastDate) item.lastDate = date;
    }
    return item;
  }

  function stableRecordsKey(records){
    const arr = asArray(records);
    if(!arr.length) return 'empty';
    const first = arr[0] || {};
    const last = arr[arr.length-1] || {};
    return [
      arr.length,
      pick(first, ['invoice','invoiceNo','date','item','totalInc'], ''),
      pick(last, ['invoice','invoiceNo','date','item','totalInc'], ''),
      String(window.__PETATOE_SMART_DATA_VERSION__ || '')
    ].join('|');
  }



  function invoiceNumValue(value){
    const m = String(value || '').match(/\d+/g);
    return m ? Number(m.join('')) || 0 : 0;
  }

  function sortRowsByDateAsc(rows){
    return asArray(rows).slice().sort((a,b)=>{
      const da = parseRecordDate(a), db = parseRecordDate(b);
      const ta = da ? +da : 0, tb = db ? +db : 0;
      if(ta !== tb) return ta - tb;
      return invoiceNumValue(pick(a, ['invoice','invoiceNo','invoiceNumber','رقم الفاتورة'], '')) - invoiceNumValue(pick(b, ['invoice','invoiceNo','invoiceNumber','رقم الفاتورة'], ''));
    });
  }

  function sortRowsByDateDesc(rows){
    return asArray(rows).slice().sort((a,b)=>{
      const da = parseRecordDate(a), db = parseRecordDate(b);
      const ta = da ? +da : 0, tb = db ? +db : 0;
      if(tb !== ta) return tb - ta;
      return invoiceNumValue(pick(b, ['invoice','invoiceNo','invoiceNumber','رقم الفاتورة'], '')) - invoiceNumValue(pick(a, ['invoice','invoiceNo','invoiceNumber','رقم الفاتورة'], ''));
    });
  }

  function finalizeCustomerGroups(customerRowsIndex){
    const byName = Object.create(null);
    Object.keys(customerRowsIndex || {}).forEach(name => {
      byName[name] = sortRowsByDateDesc(customerRowsIndex[name]);
    });
    return byName;
  }

  function finalizeIndex(index){
    return Object.values(index).map(item => {
      const out = Object.assign({}, item);
      if(out.invoices instanceof Set){
        out.invoiceCount = out.invoices.size;
        delete out.invoices;
      }
      if(out.firstDate instanceof Date) out.firstDateISO = out.firstDate.toISOString().slice(0,10);
      if(out.lastDate instanceof Date) out.lastDateISO = out.lastDate.toISOString().slice(0,10);
      return out;
    }).sort((a,b)=>(b.total||0)-(a.total||0));
  }

  function buildSmartData(records, options){
    const __perfStart = perfNow();
    const source = asArray(records);
    const key = stableRecordsKey(source);
    if(!options || !options.force){
      if(cacheValue && cacheKey === key){
        smartPerfMeasure('SmartDataEngine.cacheHit', __perfStart, {records: source.length});
        return cacheValue;
      }
    }

    const servicesIndex = Object.create(null);
    const vehiclesIndex = Object.create(null);
    const customersIndex = Object.create(null);
    const paymentIndex = Object.create(null);
    const yearlyIndex = Object.create(null);
    const monthlyIndex = Object.create(null);
    const customerRowsIndex = Object.create(null);
    const customerInvoicesIndex = Object.create(null);

    let total = 0;
    let validDates = 0;

    const invoices = source.map((row, idx) => {
      const date = parseRecordDate(row);
      const year = date ? date.getFullYear() : text(pick(row, ['year','السنة'], 'غير محدد'));
      const month = date ? (date.getMonth()+1) : text(pick(row, ['month','الشهر'], 'غير محدد'));
      const service = text(pick(row, ['item','service','serviceName','product','description','الصنف','الخدمة'], 'غير محدد'));
      const vehicle = text(pick(row, ['van','vehicle','car','السيارة'], 'غير محدد'));
      const customer = text(pick(row, ['client','customer','customerName','اسم العميل','العميل'], 'غير محدد'));
      const payment = text(pick(row, ['pay','payment','paymentMethod','طريقة الدفع'], 'غير محدد'));
      const amount = toNumber(pick(row, ['totalInc','total','amount','net','value','الإجمالي'], 0));

      total += amount;
      if(date) validDates += 1;

      addSum(servicesIndex, service, amount);
      addSum(vehiclesIndex, vehicle, amount);
      addSum(paymentIndex, payment, amount);
      addCustomer(customersIndex, customer, amount, date, row);
      if(!customerRowsIndex[customer]) customerRowsIndex[customer] = [];
      customerRowsIndex[customer].push(row);
      if(!customerInvoicesIndex[customer]) customerInvoicesIndex[customer] = [];
      customerInvoicesIndex[customer].push({row, date, invoice:text(pick(row, ['invoice','invoiceNo','invoiceNumber','رقم الفاتورة'], ''), ''), amount, service, vehicle, payment, customer});
      addSum(yearlyIndex, year, amount);
      addSum(monthlyIndex, `${year}-${String(month).padStart(2,'0')}`, amount);

      return {idx,row,date,year,month,monthName:monthName(date),service,vehicle,customer,payment,amount};
    });

    cacheKey = key;
    derivedCache = Object.create(null);
    cacheValue = {
      version: ENGINE_VERSION,
      builtAt: Date.now(),
      sourceCount: source.length,
      validDates,
      total,
      invoices,
      indexes: {
        services: finalizeIndex(servicesIndex),
        vehicles: finalizeIndex(vehiclesIndex),
        customers: finalizeIndex(customersIndex),
        payments: finalizeIndex(paymentIndex),
        years: finalizeIndex(yearlyIndex),
        months: finalizeIndex(monthlyIndex)
      },
      groups: {
        customersByName: finalizeCustomerGroups(customerRowsIndex)
      }
    };
    smartPerfMeasure('SmartDataEngine.build', __perfStart, {
      records: source.length,
      invoices: invoices.length,
      services: cacheValue.indexes.services.length,
      vehicles: cacheValue.indexes.vehicles.length,
      customers: cacheValue.indexes.customers.length
    });
    return cacheValue;
  }


  function filterInvoicesByYear(records, year){
    const data = buildSmartData(records || []);
    const y = String(year || 'all');
    return memoizeSmart('filterYear', y, function(){
      if(y === 'all') return data.invoices.slice();
      return data.invoices.filter(inv => String(inv.year) === y);
    });
  }

  function aggregateInvoices(invoices, field){
    const index = Object.create(null);
    asArray(invoices).forEach(inv => {
      const key = text(inv && inv[field], 'غير محدد');
      if(!index[key]) index[key] = {name:key, count:0, total:0};
      index[key].count += 1;
      index[key].total += toNumber(inv && inv.amount);
    });
    return Object.values(index).sort((a,b)=>(b.total||0)-(a.total||0));
  }

  function monthVehicleMatrix(records, year){
    const y = String(year || 'all');
    return memoizeSmart('monthVehicleMatrix', y, function(){
      const rows = filterInvoicesByYear(records || [], y);
      const matrix = Object.create(null);
      const vehicles = Object.create(null);
      rows.forEach(inv => {
        const month = String(inv.month || '').padStart(2,'0');
        const matrixYear = String(inv.year || 'غير محدد');
        const key = (y==='all' ? matrixYear + '-' : '') + month;
        const vehicle = text(inv.vehicle, 'غير محدد');
        vehicles[vehicle] = true;
        if(!matrix[key]) matrix[key] = {key, year:inv.year, month:inv.month, label:(inv.monthName || key), total:0, byVehicle:Object.create(null)};
        matrix[key].total += toNumber(inv.amount);
        matrix[key].byVehicle[vehicle] = (matrix[key].byVehicle[vehicle] || 0) + toNumber(inv.amount);
      });
      return {
        rows,
        vehicles:Object.keys(vehicles),
        months:Object.values(matrix).sort((a,b)=>{
          const ay=Number(a.year)||0, by=Number(b.year)||0;
          if(ay!==by) return ay-by;
          return (Number(a.month)||0)-(Number(b.month)||0);
        })
      };
    });
  }



  function getCustomerRowsByName(records){
    const data = buildSmartData(records || []);
    return (data.groups && data.groups.customersByName) || Object.create(null);
  }

  function getDatedCustomerRows(records){
    buildSmartData(records || []);
    return memoizeSmart('datedCustomerRows', 'all', function(){
      const data = cacheValue || buildSmartData(records || []);
      return asArray(data.invoices).filter(inv => inv && inv.date && inv.customer && String(inv.customer).trim()).map(inv => inv.row);
    });
  }

  function getCustomerFirstMap(records){
    buildSmartData(records || []);
    return memoizeSmart('customerFirstMap', 'all', function(){
      const rowsByName = getCustomerRowsByName(records || []);
      const firstMap = Object.create(null);
      Object.keys(rowsByName).forEach(name => {
        const asc = sortRowsByDateAsc(rowsByName[name]).filter(r => parseRecordDate(r));
        if(asc.length) firstMap[name] = asc[0];
      });
      return firstMap;
    });
  }

  function getRowsByPeriod(records, year, monthIndex){
    const y = Number(year);
    const mi = Number(monthIndex);
    buildSmartData(records || []);
    return memoizeSmart('rowsByPeriod', `${y}-${mi}`, function(){
      return getDatedCustomerRows(records || []).filter(row => {
        const d = parseRecordDate(row);
        return d && d.getFullYear() === y && d.getMonth() === mi;
      });
    });
  }

  function getCustomerPeriods(records){
    buildSmartData(records || []);
    return memoizeSmart('customerPeriods', 'all', function(){
      const set = Object.create(null);
      getDatedCustomerRows(records || []).forEach(row => {
        const d = parseRecordDate(row);
        if(d) set[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = true;
      });
      return Object.keys(set).sort();
    });
  }



  function aggregateInvoicesSorted(invoices, field, sortMode){
    const rows = aggregateInvoices(invoices, field).map(item => {
      const count = Number(item.count || 0);
      const total = Number(item.total || 0);
      return Object.assign({}, item, {value: total, avg: count ? total / count : 0});
    });
    const byValue = (a,b)=>(a.total||0)-(b.total||0);
    const byCount = (a,b)=>(a.count||0)-(b.count||0) || (a.total||0)-(b.total||0);
    if(sortMode === 'valueAsc') rows.sort(byValue);
    else if(sortMode === 'countDesc') rows.sort((a,b)=>byCount(b,a));
    else if(sortMode === 'countAsc') rows.sort(byCount);
    else rows.sort((a,b)=>byValue(b,a));
    return rows;
  }

  function sortPreparedRows(rows, sortMode){
    const out = asArray(rows).map(item => {
      const count = Number(item.count || 0);
      const total = Number(item.total || item.value || 0);
      return Object.assign({}, item, {value: total, avg: count ? total / count : 0});
    });
    const byValue = (a,b)=>(a.total||0)-(b.total||0);
    const byCount = (a,b)=>(a.count||0)-(b.count||0) || (a.total||0)-(b.total||0);
    if(sortMode === 'valueAsc') out.sort(byValue);
    else if(sortMode === 'countDesc') out.sort((a,b)=>byCount(b,a));
    else if(sortMode === 'countAsc') out.sort(byCount);
    else out.sort((a,b)=>byValue(b,a));
    return out;
  }

  function aggregateByYearField(records, year, field, sortMode, excludeUnknown){
    const y = String(year || 'all');
    const sm = sortMode || 'valueDesc';
    buildSmartData(records || []);
    return memoizeSmart('aggregateByYearField', `${field}|${y}|${sm}|${excludeUnknown?'clean':'all'}`, function(){
      if(y === 'all' && cacheValue && cacheValue.indexes){
        const sourceMap = {service:'services', vehicle:'vehicles', customer:'customers', payment:'payments'};
        const source = cacheValue.indexes[sourceMap[field]];
        if(source){
          const rows = excludeUnknown ? source.filter(x => String(x.name || '').trim() && String(x.name) !== 'غير محدد') : source;
          return sortPreparedRows(rows, sm);
        }
      }
      const rows = filterInvoicesByYear(records || [], y);
      const cleanRows = excludeUnknown ? rows.filter(inv => String(inv && inv[field] || '').trim() && String(inv[field]) !== 'غير محدد') : rows;
      return aggregateInvoicesSorted(cleanRows, field, sm);
    });
  }

  function aggregateServices(records, year, sortMode){
    return aggregateByYearField(records || [], year || 'all', 'service', sortMode || 'valueDesc', true);
  }

  function aggregateVehicles(records, year, sortMode){
    return aggregateByYearField(records || [], year || 'all', 'vehicle', sortMode || 'valueDesc', false);
  }

  function aggregateCustomers(records, year, sortMode){
    return aggregateByYearField(records || [], year || 'all', 'customer', sortMode || 'valueDesc', false);
  }

  function availableYears(records){
    buildSmartData(records || []);
    return memoizeSmart('availableYears', 'all', function(){
      const data = cacheValue || buildSmartData(records || []);
      const years = Object.create(null);
      asArray(data.invoices).forEach(inv => {
        const y = Number(inv && inv.year);
        if(y) years[String(y)] = true;
      });
      return Object.keys(years).sort((a,b)=>Number(b)-Number(a));
    });
  }

  function getSmartDataCacheStats(){
    const stats = {};
    Object.keys(derivedCache || {}).forEach(ns => {
      stats[ns] = Object.keys(derivedCache[ns] || {}).length;
    });
    return {engineVersion:ENGINE_VERSION, cacheKey, hasBaseCache:!!cacheValue, derived:stats};
  }

  function resetSmartDataEngine(){
    cacheKey = '';
    cacheValue = null;
    derivedCache = Object.create(null);
  }

  window.PETATOESmartDataEngine = {
    version: ENGINE_VERSION,
    buildSmartData,
    filterInvoicesByYear,
    aggregateInvoices,
    monthVehicleMatrix,
    aggregateServices,
    aggregateVehicles,
    aggregateCustomers,
    availableYears,
    getCustomerRowsByName,
    getDatedCustomerRows,
    getCustomerFirstMap,
    getRowsByPeriod,
    getCustomerPeriods,
    getCacheStats: getSmartDataCacheStats,
    reset: resetSmartDataEngine
  };
  window.buildSmartData = buildSmartData;
  window.smartEngineFilterInvoicesByYear = filterInvoicesByYear;
  window.smartEngineAggregateInvoices = aggregateInvoices;
  window.smartEngineMonthVehicleMatrix = monthVehicleMatrix;
  window.smartEngineAggregateServices = aggregateServices;
  window.smartEngineAggregateVehicles = aggregateVehicles;
  window.smartEngineAggregateCustomers = aggregateCustomers;
  window.smartEngineAvailableYears = availableYears;
  window.smartEngineGetCustomerRowsByName = getCustomerRowsByName;
  window.smartEngineGetDatedCustomerRows = getDatedCustomerRows;
  window.smartEngineGetCustomerFirstMap = getCustomerFirstMap;
  window.smartEngineGetRowsByPeriod = getRowsByPeriod;
  window.smartEngineGetCustomerPeriods = getCustomerPeriods;
  window.petatoeSmartDataEngineCacheStats = getSmartDataCacheStats;
  window.resetSmartDataEngine = resetSmartDataEngine;
})();
