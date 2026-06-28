/* PETATOE v7.0.18 — Customer 360 Runtime Data Binding Fix
   Purpose: make Customer 360 read from the real runtime data source and render with DOM-safe APIs.
   Scope: Customer 360 only. No visual/layout changes. */
(function(window, document){
  'use strict';
  if(window.__PETATOE_CUSTOMER360_RUNTIME_FIX_V7018__) return;
  window.__PETATOE_CUSTOMER360_RUNTIME_FIX_V7018__ = true;

  function warn(label, err){
    try{ if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function') window.PETATOEUtils.warnSilentCatch(label, err); }
    catch(_){ try{ console.warn(label, err); }catch(__){} }
  }
  function byId(id){ return document.getElementById(id); }
  function text(v){ return String(v == null ? '' : v).trim(); }
  function lower(v){ return text(v).toLowerCase(); }
  function num(v){
    if(typeof window.parseNum === 'function') return window.parseNum(v);
    var n = parseFloat(String(v == null ? '' : v).replace(/,/g,'').replace(/[^0-9.\-]/g,''));
    return isFinite(n) ? n : 0;
  }
  function money(v){ return (typeof window.money === 'function') ? window.money(v) : (Number(num(v)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' SAR'); }
  function fmt0(v){ return (typeof window.fmt0 === 'function') ? window.fmt0(v) : Math.round(num(v)).toLocaleString('en-US'); }
  function parseDateSafe(v){
    try{ if(typeof window.parseDate === 'function') return window.parseDate(v); }catch(e){ warn('customer360 parseDate fallback', e); }
    return text(v);
  }
  function monthKeySafe(r){
    try{ if(typeof window.monthKey === 'function') return window.monthKey(r); }catch(e){ warn('customer360 monthKey fallback', e); }
    var d = parseDateSafe(r && r.date); return text(d).slice(0,7) || '-';
  }
  function rowTime(r){
    var d = parseDateSafe(r && r.date);
    var t = Date.parse(d);
    return isFinite(t) ? t : 0;
  }
  function clientName(r){ return text((r && (r.client || r.customer || r.customerName)) || 'غير محدد') || 'غير محدد'; }
  function serviceName(r){ return text((r && (r.item || r.service || r.serviceName || r.product)) || 'غير محدد') || 'غير محدد'; }
  function invoiceNo(r){ return text((r && (r.invoice || r.invoiceNo || r.billNo || r.number)) || '-'); }
  function vehicleName(r){ return text((r && (r.van || r.vehicle || r.car || r.carName)) || '-'); }
  function payName(r){ return text((r && (r.pay || r.payment || r.paymentMethod)) || '-'); }
  function totalInc(r){ return num(r && (r.totalInc != null ? r.totalInc : r.total)); }
  function totalEx(r){ return num(r && r.totalEx); }
  function tax(r){ return num(r && r.tax); }
  function qty(r){ return num(r && (r.qty != null ? r.qty : r.quantity)); }
  function clear(el){ if(el) el.replaceChildren(); }
  function div(cls, txt){ var el=document.createElement('div'); if(cls) el.className=cls; if(txt!=null) el.textContent=txt; return el; }
  function span(cls, txt){ var el=document.createElement('span'); if(cls) el.className=cls; if(txt!=null) el.textContent=txt; return el; }
  function b(txt){ var el=document.createElement('b'); el.textContent=text(txt); return el; }
  function h3(txt){ var el=document.createElement('h3'); el.textContent=text(txt); return el; }
  function p(txt){ var el=document.createElement('p'); el.textContent=text(txt); return el; }
  function smartEmpty(txt){ return div('smart-empty', txt); }

  function readStorageJSON(key){
    try{ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
  }
  function candidateRows(value){
    if(!value) return [];
    if(Array.isArray(value)) return value;
    if(value && Array.isArray(value.value)) return value.value;
    if(value && Array.isArray(value.records)) return value.records;
    if(value && Array.isArray(value.data)) return value.data;
    return [];
  }
  function getRuntimeRows(){
    var sources = [];
    try{ if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function') sources.push(window.PETATOEDataSource.getRecordsSync()); }catch(e){ warn('customer360 datasource read failed', e); }
    try{ if(window.PETATOEStorage && typeof window.PETATOEStorage.getRecords === 'function') sources.push(window.PETATOEStorage.getRecords()); }catch(e){ warn('customer360 storage getRecords failed', e); }
    try{ if(Array.isArray(window.records)) sources.push(window.records); }catch(e){ warn('customer360 window.records read failed', e); }
    try{ sources.push(candidateRows(readStorageJSON('PETATOE_FALLBACK'))); }catch(e){}
    try{ sources.push(candidateRows(readStorageJSON('records'))); }catch(e){}
    try{ if(window.PETATOEStorage && typeof window.PETATOEStorage.readJSON === 'function') sources.push(window.PETATOEStorage.readJSON('records', [])); }catch(e){}

    for(var i=0;i<sources.length;i++){
      var rows = candidateRows(sources[i]).filter(function(r){ return r && typeof r === 'object'; });
      if(rows.length) return rows;
    }
    return [];
  }
  function syncIndexedDBThenRender(query, attempt){
    if(attempt > 2) return;
    try{
      if(!window.indexedDB) return;
      var req = indexedDB.open('PETATOE_DB', 1);
      req.onsuccess = function(e){
        try{
          var db = e.target.result;
          if(!db.objectStoreNames.contains('petatoe')) return;
          var tx = db.transaction('petatoe','readonly');
          var st = tx.objectStore('petatoe');
          var rq = st.get('records');
          rq.onsuccess = function(){
            var out = rq.result && Array.isArray(rq.result.value) ? rq.result.value : [];
            if(out.length && window.PETATOEDataSource && typeof window.PETATOEDataSource.syncRecordsCache === 'function'){
              window.PETATOEDataSource.syncRecordsCache(out);
            }
            setTimeout(function(){ renderPanel(query, (attempt||0)+1); }, 60);
          };
        }catch(err){ warn('customer360 indexedDB sync failed', err); }
      };
    }catch(e){ warn('customer360 indexedDB open failed', e); }
  }
  function groupCustomers(rows){
    var map = Object.create(null);
    rows.forEach(function(r){ var k = clientName(r); if(!map[k]) map[k] = []; map[k].push(r); });
    return Object.keys(map).map(function(name){
      var cr = map[name].slice().sort(function(a,b){ return rowTime(b)-rowTime(a); });
      var total = cr.reduce(function(s,r){ return s + totalInc(r); }, 0);
      var invSet = new Set(cr.map(invoiceNo).filter(function(x){ return x && x !== '-'; }));
      return { name:name, rows:cr, total:total, invoices:invSet.size, ops:cr.length, last:cr[0] ? parseDateSafe(cr[0].date) : '', avg:invSet.size ? total/invSet.size : 0 };
    }).sort(function(a,b){ return b.total-a.total; });
  }
  function renderList(list, customers){
    clear(list);
    if(!customers.length){ list.appendChild(smartEmpty('لا يوجد عملاء مطابقين')); return; }
    customers.slice(0,250).forEach(function(c){
      var card = div('customer360-card');
      card.setAttribute('data-customer360-name', c.name);
      card.setAttribute('tabindex','0');
      card.setAttribute('role','button');
      card.appendChild(b(c.name));
      card.appendChild(span('', money(c.total) + ' | ' + fmt0(c.invoices) + ' فاتورة | آخر تعامل: ' + (c.last || '-')));
      list.appendChild(card);
    });
  }
  function mini(label, value){ var el=div('cust360-mini'); el.appendChild(span('', label)); el.appendChild(b(value)); return el; }
  function table(headers, rows){
    var wrap=div('smart-table-clean'); var tbl=document.createElement('table'); var thead=document.createElement('thead'); var tr=document.createElement('tr');
    headers.forEach(function(h){ var th=document.createElement('th'); th.textContent=h; tr.appendChild(th); });
    thead.appendChild(tr); tbl.appendChild(thead);
    var tbody=document.createElement('tbody');
    rows.forEach(function(cells){ var r=document.createElement('tr'); cells.forEach(function(cell){ var td=document.createElement('td'); td.textContent=text(cell); r.appendChild(td); }); tbody.appendChild(r); });
    tbl.appendChild(tbody); wrap.appendChild(tbl); return wrap;
  }
  function renderRecentInvoices(rows){
    var wrap=div('pet-dd-table'); var tbl=document.createElement('table'); tbl.id='petDrillTable';
    var headers=['التاريخ','الفاتورة','العميل','الخدمة','السيارة','طريقة الدفع','الكمية','قبل الضريبة','الضريبة','شامل الضريبة'];
    tbl.appendChild(table(headers, []).querySelector('thead'));
    var tbody=document.createElement('tbody');
    rows.slice().sort(function(a,b){return rowTime(b)-rowTime(a);}).slice(0,60).forEach(function(r){
      var values=[parseDateSafe(r.date),invoiceNo(r),clientName(r),serviceName(r),vehicleName(r),payName(r),fmt0(qty(r)),money(totalEx(r)),money(tax(r)),money(totalInc(r))];
      var tr=document.createElement('tr'); values.forEach(function(v){ var td=document.createElement('td'); td.textContent=v; tr.appendChild(td); }); tbody.appendChild(tr);
    });
    tbl.appendChild(tbody); wrap.appendChild(tbl); return wrap;
  }
  function renderDetail(name){
    var rows = getRuntimeRows().filter(function(r){ return clientName(r) === String(name); });
    var detail = byId('customer360Detail'); if(!detail) return;
    detail.dataset.loaded = '1'; clear(detail);
    document.querySelectorAll('.customer360-card').forEach(function(card){ card.classList.toggle('active', card.getAttribute('data-customer360-name') === String(name)); });
    if(!rows.length){ detail.appendChild(smartEmpty('لا توجد بيانات للعميل: ' + (name || '-'))); return; }
    rows = rows.slice().sort(function(a,b){ return rowTime(b)-rowTime(a); });
    var first = rows[rows.length-1], last = rows[0];
    var total = rows.reduce(function(s,r){ return s + totalInc(r); }, 0);
    var invSet = new Set(rows.map(invoiceNo).filter(function(x){ return x && x !== '-'; }));
    var head = div('cust360-head-card'); head.appendChild(h3('👤 ' + name)); head.appendChild(p('أول تعامل: ' + (first ? parseDateSafe(first.date) : '-') + ' | آخر تعامل: ' + (last ? parseDateSafe(last.date) : '-') + ' | عدد العمليات: ' + fmt0(rows.length))); detail.appendChild(head);
    var minis=div('cust360-mini-grid'); minis.appendChild(mini('إجمالي الإنفاق', money(total))); minis.appendChild(mini('عدد الفواتير', fmt0(invSet.size))); minis.appendChild(mini('متوسط الفاتورة', money(invSet.size ? total/invSet.size : 0))); minis.appendChild(mini('آخر فاتورة', last ? invoiceNo(last) : '-')); detail.appendChild(minis);
    var serviceMap=Object.create(null), monthMap=Object.create(null);
    rows.forEach(function(r){ serviceMap[serviceName(r)] = (serviceMap[serviceName(r)]||0)+totalInc(r); var mk=monthKeySafe(r); monthMap[mk]=(monthMap[mk]||0)+totalInc(r); });
    var services=Object.keys(serviceMap).map(function(k){ return [k, serviceMap[k], rows.filter(function(r){return serviceName(r)===k;}).length]; }).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
    var months=Object.keys(monthMap).sort().map(function(k){ return [k, monthMap[k]]; });
    var grid=div('cust360-section-grid');
    var p1=div('smart-panel'); p1.appendChild(h3('🧩 أعلى الخدمات')); p1.appendChild(table(['الخدمة','المبيعات','العمليات'], services.map(function(s){ return [s[0], money(s[1]), fmt0(s[2])]; }))); grid.appendChild(p1);
    var p2=div('smart-panel'); p2.appendChild(h3('📅 تطور شهري')); p2.appendChild(table(['الشهر','المبيعات'], months.map(function(m){ return [m[0], money(m[1])]; }))); grid.appendChild(p2);
    detail.appendChild(grid);
    var invPanel=div('smart-panel'); invPanel.style.marginTop='14px'; invPanel.appendChild(h3('🧾 آخر الفواتير')); invPanel.appendChild(renderRecentInvoices(rows)); detail.appendChild(invPanel);
    detail.appendChild(div('cust360-note','كل أرقام Customer 360 مبنية من نفس البيانات الأصلية بدون تغيير أو إعادة حساب للتقارير القديمة.'));
  }
  function renderPanel(query, attempt){
    var list = byId('customer360List'), detail = byId('customer360Detail');
    if(!list) return false;
    var input = byId('customer360Search');
    var q = lower(query != null ? query : (input ? input.value : ''));
    var rows = getRuntimeRows();
    if(!rows.length){
      clear(list); list.appendChild(smartEmpty('جارٍ تحميل بيانات العملاء...'));
      if((attempt||0) < 3){ setTimeout(function(){ renderPanel(q, (attempt||0)+1); }, 350); syncIndexedDBThenRender(q, attempt||0); }
      return false;
    }
    var customers = groupCustomers(rows).filter(function(c){ return !q || lower(c.name).indexOf(q) >= 0; });
    renderList(list, customers);
    if(detail && !detail.dataset.loaded){ clear(detail); detail.appendChild(smartEmpty('اختر عميل من القائمة لعرض ملفه الكامل.')); }
    return true;
  }
  function exportExcel(){
    try{
      var q=lower((byId('customer360Search')||{}).value||'');
      var rows=getRuntimeRows();
      var customers=groupCustomers(rows).filter(function(c){ return !q || lower(c.name).indexOf(q)>=0; });
      if(!window.XLSX){ if(typeof window.toast==='function') window.toast('XLSX غير متاح حاليًا'); return; }
      var wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['العميل','إجمالي الإنفاق','الفواتير','العمليات','متوسط الفاتورة','آخر تعامل']].concat(customers.map(function(c){return [c.name,c.total,c.invoices,c.ops,c.avg,c.last];}))), 'Customer 360 Summary');
      XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Customer Records');
      XLSX.writeFile(wb,'PETATOE_Customer360.xlsx');
    }catch(e){ warn('customer360 excel export failed',e); if(typeof window.toast==='function') window.toast('تعذر تصدير Customer 360'); }
  }
  function bind(){
    if(window.__PETATOE_CUSTOMER360_RUNTIME_FIX_BOUND__) return;
    window.__PETATOE_CUSTOMER360_RUNTIME_FIX_BOUND__=true;
    document.addEventListener('input', function(e){ if(e.target && e.target.id === 'customer360Search') renderPanel(e.target.value); }, true);
    document.addEventListener('click', function(e){
      var clearBtn=e.target.closest && e.target.closest('[data-pet-action="customer360-clear"]');
      if(clearBtn){ var inp=byId('customer360Search'); if(inp) inp.value=''; renderPanel(''); return; }
      var refresh=e.target.closest && e.target.closest('#safeCustomer360RefreshBtn');
      if(refresh){ renderPanel(); return; }
      var excel=e.target.closest && e.target.closest('#safeCustomer360ExcelBtn');
      if(excel){ exportExcel(); return; }
      var card=e.target.closest && e.target.closest('.customer360-card');
      if(card){ renderDetail(card.getAttribute('data-customer360-name') || (card.querySelector('b')||{}).textContent || ''); return; }
    }, true);
    document.addEventListener('keydown', function(e){ var card=e.target.closest && e.target.closest('.customer360-card'); if(card && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); renderDetail(card.getAttribute('data-customer360-name') || ''); } }, true);
    document.addEventListener('petatoe:tabchange', function(e){ var d=e.detail||{}; if(d.tabId==='customer360') setTimeout(function(){ renderPanel(); }, 80); }, true);
    window.addEventListener('petatoe:records-changed', function(){ var tab=byId('customer360'); if(tab && tab.classList.contains('active')) renderPanel(); });
  }

  window.renderCustomer360Panel = renderPanel;
  window.showCustomer360 = renderDetail;
  window.exportCustomer360Excel = exportExcel;
  window.openCustomer360 = function(name){
    try{ if(typeof window.showTab === 'function') window.showTab('customer360'); }catch(e){ warn('customer360 showTab failed', e); }
    setTimeout(function(){ renderPanel(name || ''); if(name){ var inp=byId('customer360Search'); if(inp) inp.value=name; renderDetail(name); } }, 120);
  };
  bind();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ renderPanel(); });
  else setTimeout(function(){ renderPanel(); }, 60);
})(window, document);
