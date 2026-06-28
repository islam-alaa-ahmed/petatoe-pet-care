/* PETATOE v3.11.38 Phase 4 Cleanup: Warehouse inline modules extracted from index.html preserving original order. */



/* PETATOE v6.1.300 - Warehouse Safe Render boundary. */
(function(){
  'use strict';
  if(window.__PETATOE_WAREHOUSE_SAFE_RENDER_BOUND__) return;
  window.__PETATOE_WAREHOUSE_SAFE_RENDER_BOUND__ = true;
  function warn(e){try{window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-core.js', e);}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('warehouses/warehouse-core.js', _, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } } }
  function resolve(target){return (typeof target === 'string') ? document.getElementById(target) : target;}
  window.PETATOEWarehouseSafeRender = window.PETATOEWarehouseSafeRender || {
    html: function(target, html, reason){
      var el = resolve(target);
      if(!el) return;
      try{
        if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function'){
          window.PETATOESafeRender.htmlTrusted(el, html, reason || 'warehouse-core trusted legacy template');
        }else{
          window.PETATOESafeRender.htmlTrusted(el, html, reason || 'warehouse-core trusted legacy template');
        }
      }catch(e){warn(e); try{window.PETATOESafeRender.htmlTrusted(el, html, reason || 'warehouse-core trusted legacy template');}catch(e2){warn(e2);} }
    }
  };
}());

/* Extracted script: petatoe-v359-car-warehouses-js */
(function(){
  'use strict';
  if(window.__PETATOE_WAREHOUSE_CORE_MAIN_RUNTIME_BOUND__) return;
  window.__PETATOE_WAREHOUSE_CORE_MAIN_RUNTIME_BOUND__ = true;

  /* PETATOE v6.1.217 - Warehouse performance guard: avoid heavy background renders when warehouse panel is closed. */
  window.PETATOEWarehousePerf = window.PETATOEWarehousePerf || (function(){
    var timers = {};
    function isActive(){
      try{var p=document.getElementById('warehouses');return !!(p && p.classList && p.classList.contains('active'));}
      catch(e){return false;}
    }
    function debounce(key, fn, delay){
      try{clearTimeout(timers[key]);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
      timers[key]=setTimeout(function(){
        try{fn&&fn();}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-core.js',e);}
      }, delay || 80);
    }
    var boundDocEvents = {};
    function runWhenActive(key, fn, delay){
      debounce(key, function(){if(isActive())fn&&fn();}, delay || 80);
    }
    function bindDocumentOnce(key, type, handler, options){
      try{
        key = String(key || type || 'event');
        if(boundDocEvents[key]) return false;
        boundDocEvents[key] = true;
        document.addEventListener(type, handler, options);
        return true;
      }catch(e){
        try{window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-core.js',e);}catch(_e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",_e);}
        return false;
      }
    }
    function isWarehouseTarget(target){
      try{return !!(target && target.closest && target.closest('#warehouses'));}
      catch(e){return false;}
    }
    return {isActive:isActive, debounce:debounce, runWhenActive:runWhenActive, bindDocumentOnce:bindDocumentOnce, isWarehouseTarget:isWarehouseTarget};
  })();
  var MAIN='المخزن الرئيسي';
  var ALLOWED_STORES=[MAIN,'VAN A - AXB 2558','VAN B - SXB 6066'];
  var STORE_ALLOWED_MAP={'المخزن الرئيسي':1,'VAN A - AXB 2558':1,'VAN B - SXB 6066':1};
  function cleanStoreName(v,fallback){v=String(v||'').trim();return STORE_ALLOWED_MAP[v]?v:(fallback||MAIN)}
  var TX_KEY='warehouseTransactions';
  var ITEM_KEY='warehouseItems';
  function petStorageReadJSON(key,fallback){try{if(window.PETATOEStorage&&typeof window.PETATOEStorage.readJSON==='function')return window.PETATOEStorage.readJSON(key,fallback);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}return fallback}
  function petStorageWriteJSON(key,value){try{if(window.PETATOEStorage&&typeof window.PETATOEStorage.writeJSON==='function')return window.PETATOEStorage.writeJSON(key,value);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}return false}
  function petStorageGet(key,fallback){try{if(window.PETATOEStorage&&typeof window.PETATOEStorage.get==='function')return window.PETATOEStorage.get(key,fallback);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}return fallback}
  function petStorageSet(key,value){try{if(window.PETATOEStorage&&typeof window.PETATOEStorage.set==='function')return window.PETATOEStorage.set(key,value);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}return false}
  /* PETATOE v3.11.13 - Single source for warehouse items */
  window.PETATOEWarehouseItems = window.PETATOEWarehouseItems || {
    key: ITEM_KEY,
    read: function(){try{var a=petStorageReadJSON(ITEM_KEY,[]);return Array.isArray(a)?a:[]}catch(e){return[]}},
    write: function(a){try{petStorageWriteJSON(ITEM_KEY,Array.isArray(a)?a:[])}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}},
    getAll: function(){return this.read()},
    setAll: function(a){return this.write(a)}
  };

  function getItemsMaster(){return window.PETATOEWarehouseItems.getAll()}
  function setItemsMaster(a){return window.PETATOEWarehouseItems.setAll(a)}
  function itemType(name){var n=String(name||'').trim();var it=getItemsMaster().find(function(x){return String(x.name||'').trim()===n});return it?(it.type||'stock'):'stock'}
  function stockItemNames(){var s={};getItemsMaster().forEach(function(x){if((x.status||'active')!=='inactive'&&(x.type||'stock')==='stock'&&String(x.name||'').trim())s[String(x.name).trim()]=1});petBlock6693_getTx().forEach(function(t){if(t.item&&itemType(t.item)==='stock')s[t.item]=1});(cachedRows||[]).forEach(function(r){var it=rowItem(r);if(it&&itemType(it)==='stock')s[it]=1});return Object.keys(s).filter(Boolean).sort()}
  var statementSource='';
  /* v3.11.10: using global byId */
  function openPrintHtml(html, features){try{var blob=new Blob([String(html||'')],{type:'text/html;charset=utf-8'});var url=URL.createObjectURL(blob);var w=window.open(url,'_blank',features||'width=1100,height=800');if(w)setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('warehouses/warehouse-core.js', _e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }},60000);return w;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('warehouses/warehouse-core.js',e);return null;}}
  function petatoe_v359_car_warehouses_js_esc(v){return window.PETATOESecurity?PETATOESecurity.escapeHtml(v):String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function num(v){return window.PETATOENumber?PETATOENumber.num(v):(parseFloat(String(v==null?'':v).replace(/,/g,''))||0)}
  function fmtQty(n){return window.PETATOENumber?PETATOENumber.qty(n):(function(x){x=num(x); if(Math.abs(x)<0.000001)x=0; return x.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})})(n)}
  function toastSafe(m){try{if(typeof window.toast==='function')window.toast(m);else alert(m)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function petBlock6693_getTx(){try{var a=petStorageReadJSON(TX_KEY,[]);return Array.isArray(a)?a:[]}catch(e){return[]}}
  function setTx(a){petStorageWriteJSON(TX_KEY,a||[])}
  function readFallback(){try{return (window.PETATOEDataSource.getRecordsSync())||[]}catch(e){return[]}}
  function loadRows(cb){
    try{if(typeof window.loadRecords==='function'){var p=window.loadRecords(); if(p&&typeof p.then==='function'){p.then(function(r){cb(Array.isArray(r)?r:readFallback())}).catch(function(){cb(readFallback())}); return;}}
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
    cb(readFallback());
  }
  var cachedRows=[];
  function refreshRows(cb){loadRows(function(r){cachedRows=r||[]; if(cb)cb()})}
  function rowItem(r){return String((r&&(r.item||r['اسم الصنف']||r.description||r.service))||'').trim()}
  function rowVan(r){return String((r&&(r.van||r.vehicle||r['السيارة']))||'').trim()}
  function stores(){return ALLOWED_STORES.slice()}
  function items(){return stockItemNames()}
  function warehouseCarAppendOption(el,value,label){var opt=document.createElement('option');opt.value=String(value==null?'':value);opt.textContent=String(label==null?value:label);el.appendChild(opt)}
  function warehouseCarFillSelect(el,arr,allLabel){if(!el)return;var cur=el.value;el.textContent='';if(allLabel)warehouseCarAppendOption(el,'all',allLabel);(arr||[]).forEach(function(v){warehouseCarAppendOption(el,v,v)}); if((arr||[]).indexOf(cur)>-1||cur==='all')el.value=cur}
  function normalizeType(t){if(t==='in')return 'وارد'; if(t==='transfer')return 'تحويل'; if(t==='return')return 'مرتجع'; if(t==='adjust_plus')return 'تسوية زيادة'; if(t==='adjust_minus')return 'تسوية نقص'; if(t==='sale_out')return 'صرف فاتورة'; return t||'-'}
  function rowClass(t){if(t==='in'||t==='adjust_plus')return 'in'; if(t==='adjust_minus'||t==='sale_out')return 'out'; if(t==='transfer'||t==='return')return 'move'; return 'adj'}
  function signedRows(){var out=[]; petBlock6693_getTx().forEach(function(t){var q=num(t.qty), type=t.type; if(type==='in'||type==='adjust_plus'){out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.to,MAIN),from:cleanStoreName(t.from,'-'),to:cleanStoreName(t.to,MAIN),inQty:q,outQty:0,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}
    else if(type==='adjust_minus'||type==='sale_out'){out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.from,MAIN),from:cleanStoreName(t.from,MAIN),to:cleanStoreName(t.to,'-'),inQty:0,outQty:q,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}
    else if(type==='transfer'||type==='return'){out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.from,MAIN),from:cleanStoreName(t.from,MAIN),to:cleanStoreName(t.to,MAIN),inQty:0,outQty:q,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''}); out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.to,MAIN),from:cleanStoreName(t.from,MAIN),to:cleanStoreName(t.to,MAIN),inQty:q,outQty:0,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}
  }); return out.sort(function(a,b){return String(a.time||'').localeCompare(String(b.time||''))})}
  function balance(store,item){var b=0; signedRows().forEach(function(r){if(r.store===store && (!item||r.item===item))b += num(r.inQty)-num(r.outQty)}); if(Math.abs(b)<0.000001)b=0; return b}
  function stockRows(){var map={}; stores().forEach(function(st){items().forEach(function(it){map[st+'||'+it]={store:st,item:it,balance:0,last:''}})}); signedRows().forEach(function(r){var k=r.store+'||'+r.item; if(!map[k])map[k]={store:r.store,item:r.item,balance:0,last:''}; map[k].balance+=num(r.inQty)-num(r.outQty); map[k].last=r.time||map[k].last}); return Object.keys(map).map(function(k){var x=map[k]; if(Math.abs(x.balance)<0.000001)x.balance=0; return x})}
  function movementRows(){return petBlock6693_getTx().slice().sort(function(a,b){return String(b.time||'').localeCompare(String(a.time||''))})}
  function renderSelects(){var st=stores(), its=items(); warehouseCarFillSelect(byId('whFrom'),st); warehouseCarFillSelect(byId('whTo'),st); warehouseCarFillSelect(byId('whStockStore'),st,'كل المخازن'); warehouseCarFillSelect(byId('whMoveStore'),st,'كل المخازن'); warehouseCarFillSelect(byId('whStatementItem'),its,'كل الأصناف'); var dl=byId('whItemsList'); if(dl){dl.textContent='';its.forEach(function(v){var opt=document.createElement('option');opt.value=String(v==null?'':v);dl.appendChild(opt);});}}
  function renderWarehouseCoreKpis(){var st=stores(), its=items(), rows=stockRows(); var mainItems=rows.filter(function(r){return r.store===MAIN&&r.balance>0}).length; var carQty=rows.filter(function(r){return r.store!==MAIN}).reduce(function(s,r){return s+Math.max(0,num(r.balance))},0); var mainQty=rows.filter(function(r){return r.store===MAIN}).reduce(function(s,r){return s+Math.max(0,num(r.balance))},0); var mov=petBlock6693_getTx().length; var el=byId('whKpis'); if(el)window.PETATOEWarehouseSafeRender.html(el, '<div class="wh-kpi" style="--accent:var(--green)"><span>إجمالي رصيد المخزن الرئيسي</span><b>'+fmtQty(mainQty)+'</b><small>'+mainItems+' صنف متاح</small></div><div class="wh-kpi" style="--accent:var(--blue)"><span>إجمالي أرصدة السيارات</span><b>'+fmtQty(carQty)+'</b><small>كل مخازن السيارات</small></div><div class="wh-kpi" style="--accent:var(--purple)"><span>عدد الأصناف</span><b>'+its.length+'</b><small>من البيانات والحركات</small></div><div class="wh-kpi" style="--accent:var(--yellow)"><span>حركات المخازن</span><b>'+mov+'</b><small>حركات مستقلة</small></div>', 'warehouse-core render');}
  function renderStoreCards(){
    var main=byId('whMainStoreCard'), veh=byId('whVehicleStores'), rows=stockRows();
    var mainQty=rows.filter(function(r){return r.store===MAIN}).reduce(function(s,r){return s+Math.max(0,num(r.balance))},0);
    var mainCount=rows.filter(function(r){return r.store===MAIN&&r.balance>0}).length;
    if(main){
      window.PETATOEWarehouseSafeRender.html(main, '<div class="wh-store"><div><b>'+petatoe_v359_car_warehouses_js_esc(MAIN)+'</b><span>'+mainCount+' صنف متاح</span><strong>'+fmtQty(mainQty)+'</strong></div><button type="button" class="wh-store-ico wh-statement-open" data-wh-store="'+petatoe_v359_car_warehouses_js_esc(MAIN)+'" title="كشف حساب المخزن الرئيسي">🏬</button></div>', 'warehouse-core render');
    }
    if(veh){
      var arr=stores().filter(function(st){return st!==MAIN});
      window.PETATOEWarehouseSafeRender.html(veh, arr.map(function(st){
        var qty=rows.filter(function(r){return r.store===st}).reduce(function(a,r){return a+Math.max(0,num(r.balance))},0);
        var cnt=rows.filter(function(r){return r.store===st&&r.balance>0}).length;
        return '<div class="wh-store"><div><b>'+petatoe_v359_car_warehouses_js_esc(st)+'</b><span>'+cnt+' صنف متاح</span><strong>'+fmtQty(qty)+'</strong></div><button type="button" class="wh-store-ico wh-statement-open" data-wh-store="'+petatoe_v359_car_warehouses_js_esc(st)+'" title="كشف حساب '+petatoe_v359_car_warehouses_js_esc(st)+'">🚐</button></div>';
      }).join('')||'<div class="wh-note">لا توجد سيارات في البيانات الحالية.</div>', 'warehouse-core render');
    }
  }
  function updateMoveForm(){var type=(byId('whMoveType')||{}).value||'in', from=byId('whFrom'), to=byId('whTo'); if(!from||!to)return; if(type==='in'){from.value=MAIN;to.value=MAIN;from.disabled=true;to.disabled=true;} else if(type==='transfer'){from.disabled=false;to.disabled=false;} else if(type==='return'){from.disabled=false;to.disabled=true;to.value=MAIN;} else if(type==='adjust_plus'){from.disabled=true;to.disabled=false;from.value=MAIN;} else if(type==='adjust_minus'){from.disabled=false;to.disabled=true;to.value=MAIN;} updateAvailableBox();}
  function updateAvailableBox(){var item=String((byId('whItem')||{}).value||'').trim(), from=(byId('whFrom')||{}).value||MAIN, type=(byId('whMoveType')||{}).value||'in'; var box=byId('whAvailableBox'); var b=(type==='in'||type==='adjust_plus')?0:balance(from,item); if(box)window.PETATOEWarehouseSafeRender.html(box, 'المتاح من المصدر <b>'+fmtQty(b)+'</b>', 'warehouse-core render');}
  function warehouseDispatch(name,detail,cancelable){try{return document.dispatchEvent(new CustomEvent(name,{detail:detail||{},cancelable:!!cancelable}))}catch(e){return true}}
  function saveMovement(){var type=(byId('whMoveType')||{}).value||'in', from=(byId('whFrom')||{}).value||MAIN, to=(byId('whTo')||{}).value||MAIN, item=String((byId('whItem')||{}).value||'').trim(), qty=num((byId('whQty')||{}).value), person=String((byId('whPerson')||{}).value||'').trim(), ref=String((byId('whRef')||{}).value||'').trim(); if(!item){alert('اختر أو اكتب اسم الصنف');return} if(itemType(item)==='service'){alert('هذا صنف خدمي ولا يتم استخدامه في حركات المخازن');return} if(!warehouseDispatch('petatoe:warehouse:before-save-movement',{type:type,from:from,to:to,item:item,qty:qty,person:person,ref:ref},true))return; if(qty<=0){alert('اكتب كمية صحيحة');return} if(!person){alert('اكتب اسم المسؤول');return} if((type==='transfer'||type==='return'||type==='adjust_minus') && qty>balance(from,item)+0.000001){alert('الكمية أكبر من الرصيد المتاح في المخزن المصدر');return} if(type==='transfer'&&from===to){alert('لا يمكن التحويل لنفس المخزن');return} var a=petBlock6693_getTx(); a.push({id:'WH-'+Date.now(),type:type,from:from,to:to,item:item,qty:qty,person:person,ref:ref||('WH-'+Date.now()),notes:'',time:new Date().toISOString()}); setTx(a); clearForm(); render(); warehouseDispatch('petatoe:warehouse:movement-saved',{type:type,from:from,to:to,item:item,qty:qty,person:person,ref:ref}); toastSafe('تم حفظ حركة المخزن');}
  function clearForm(){['whItem','whQty','whPerson','whRef'].forEach(function(id){var e=byId(id);if(e)e.value=''}); updateMoveForm();}
  function resetFilters(){['whStockSearch','whMoveSearch'].forEach(function(id){var e=byId(id);if(e)e.value=''}); ['whStockStore','whMoveStore','whStockStatus','whMoveTypeFilter'].forEach(function(id){var e=byId(id);if(e)e.value='all'}); render();}
  function renderStock(){
    var body=byId('whStockBody'); if(!body)return;
    var q=String((byId('whStockSearch')||{}).value||'').toLowerCase(), store=(byId('whStockStore')||{}).value||'all', status=(byId('whStockStatus')||{}).value||'all';
    var rows=stockRows().filter(function(r){var txt=(r.store+' '+r.item).toLowerCase(); return (!q||txt.indexOf(q)>-1)&&(store==='all'||r.store===store)&&(status==='all'||(status==='positive'?r.balance>0:r.balance===0));});
    window.PETATOEWarehouseSafeRender.html(body, rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.store)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.item)+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(r.balance)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.last?new Date(r.last).toLocaleString('ar-EG'):'-')+'</td><td><button type="button" class="btn btn-ghost wh-statement-open" data-wh-store="'+petatoe_v359_car_warehouses_js_esc(r.store)+'">كشف</button></td></tr>'}).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:22px">لا توجد أرصدة مطابقة.</td></tr>', 'warehouse-core render');
  }
  function renderMovements(){var body=byId('whMovementBody'); if(!body)return; var q=String((byId('whMoveSearch')||{}).value||'').toLowerCase(), store=(byId('whMoveStore')||{}).value||'all', typ=(byId('whMoveTypeFilter')||{}).value||'all'; var rows=movementRows().filter(function(t){var cls=rowClass(t.type), txt=(t.item+' '+t.from+' '+t.to+' '+t.person+' '+t.ref).toLowerCase(); return (!q||txt.indexOf(q)>-1)&&(store==='all'||t.from===store||t.to===store)&&(typ==='all'||cls===typ);}); window.PETATOEWarehouseSafeRender.html(body, rows.map(function(t,i){var cls=rowClass(t.type); return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(t.time?new Date(t.time).toLocaleString('ar-EG'):'-')+'</td><td><span class="wh-badge '+cls+'">'+petatoe_v359_car_warehouses_js_esc(normalizeType(t.type))+'</span></td><td>'+petatoe_v359_car_warehouses_js_esc(t.item)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(t.from||'-')+'</td><td>'+petatoe_v359_car_warehouses_js_esc(t.to||'-')+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(t.qty)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(t.person||'-')+'</td><td>'+petatoe_v359_car_warehouses_js_esc(t.ref||'-')+'</td><td>'+petatoe_v359_car_warehouses_js_esc(t.notes||'')+'</td></tr>'}).join('')||'<tr><td colspan="10" style="text-align:center;color:var(--muted);padding:22px">لا توجد حركات مطابقة.</td></tr>', 'warehouse-core render');}
  function statementRows(src){var rows=signedRows().filter(function(r){return r.store===src}); var bal=0; rows.forEach(function(r){bal += num(r.inQty)-num(r.outQty); r.balance=bal;}); return rows.sort(function(a,b){return String(b.time||'').localeCompare(String(a.time||''))})}
  function filteredStatementRows(){var q=String((byId('whStatementSearch')||{}).value||'').toLowerCase(), item=(byId('whStatementItem')||{}).value||'all', typ=(byId('whStatementType')||{}).value||'all'; return statementRows(statementSource).filter(function(r){var cls=rowClass(r.type), txt=(r.item+' '+r.from+' '+r.to+' '+r.person+' '+r.ref+' '+r.notes).toLowerCase(); return (!q||txt.indexOf(q)>-1)&&(item==='all'||r.item===item)&&(typ==='all'||cls===typ);});}
  function openStatement(src){statementSource=String(src||''); var c=byId('whStatementCard'); if(c)c.classList.add('show'); renderStatement(); try{c&&c.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function closeStatement(){statementSource=''; var c=byId('whStatementCard'); if(c)c.classList.remove('show')}
  function clearStatementFilters(){['whStatementSearch'].forEach(function(id){var e=byId(id);if(e)e.value=''}); ['whStatementItem','whStatementType'].forEach(function(id){var e=byId(id);if(e)e.value='all'}); renderStatement();}
  function renderStatement(){var body=byId('whStatementBody'), title=byId('whStatementTitle'), sub=byId('whStatementSub'), kpis=byId('whStatementKpis'); if(!body)return; if(!statementSource){window.PETATOEWarehouseSafeRender.html(body, '<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:22px">اضغط على أيقونة أي مخزن لعرض كشف الحساب.</td></tr>', 'warehouse-core render');return} var rows=filteredStatementRows(); if(title)title.textContent='📒 كشف حساب: '+statementSource; if(sub)sub.textContent='حركات تفصيلية للوارد والصادر والرصيد بعد كل حركة.'; var totalIn=rows.reduce(function(s,r){return s+num(r.inQty)},0), totalOut=rows.reduce(function(s,r){return s+num(r.outQty)},0); if(kpis)window.PETATOEWarehouseSafeRender.html(kpis, '<div class="wh-statement-kpi"><span>عدد الحركات</span><b>'+rows.length+'</b></div><div class="wh-statement-kpi"><span>إجمالي الوارد</span><b>'+fmtQty(totalIn)+'</b></div><div class="wh-statement-kpi"><span>إجمالي الصادر</span><b>'+fmtQty(totalOut)+'</b></div><div class="wh-statement-kpi"><span>إجمالي الرصيد</span><b>'+fmtQty(stockRows().filter(function(r){return r.store===statementSource}).reduce(function(s,r){return s+Math.max(0,num(r.balance))},0))+'</b></div>', 'warehouse-core render'); window.PETATOEWarehouseSafeRender.html(body, rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.time?new Date(r.time).toLocaleString('ar-EG'):'-')+'</td><td>'+petatoe_v359_car_warehouses_js_esc(normalizeType(r.type))+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.item)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.from)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.to)+'</td><td class="tr-in">'+(r.inQty?fmtQty(r.inQty):'-')+'</td><td class="tr-out">'+(r.outQty?fmtQty(r.outQty):'-')+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(r.balance)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.person)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.ref)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.notes)+'</td></tr>'}).join('')||'<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:22px">لا توجد حركات مطابقة.</td></tr>', 'warehouse-core render');}
  function exportStatementCsv(){if(!statementSource){alert('افتح كشف حساب أولاً');return} var rows=filteredStatementRows(), header=['المخزن','التاريخ','نوع الحركة','الصنف','من','إلى','وارد','صادر','الرصيد','المسؤول','المرجع','ملاحظات']; downloadCsv('PETATOE_Warehouse_Statement_'+statementSource+'.csv',[header].concat(rows.map(function(r){return[statementSource,r.time,normalizeType(r.type),r.item,r.from,r.to,r.inQty,r.outQty,r.balance,r.person,r.ref,r.notes]})));}
  function exportMovementsCsv(){var header=['التاريخ','نوع الحركة','الصنف','من','إلى','الكمية','المسؤول','المرجع','ملاحظات']; downloadCsv('PETATOE_Warehouse_Movements.csv',[header].concat(movementRows().map(function(r){return[r.time,normalizeType(r.type),r.item,r.from,r.to,r.qty,r.person,r.ref,r.notes]})));}
  function downloadCsv(name,rows){
    var lines=rows.map(function(row){return row.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'}).join(',')});
    var blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name.replace(/[\/:*?"<>|]/g,'_'); a.click(); setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  }
  function printStatement(){
    if(!statementSource){alert('افتح كشف حساب أولاً');return}
    var rows=filteredStatementRows();
    var html='<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>كشف حساب المخزن</title><style>body{font-family:Cairo,Arial,sans-serif;color:#111827;padding:18px}h2{text-align:center}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#2563eb;color:#fff;padding:7px}td{border:1px solid #ddd;padding:6px;text-align:center}.in{color:#15803d;font-weight:bold}.out{color:#dc2626;font-weight:bold}</style></head><body><h2>كشف حساب: '+petatoe_v359_car_warehouses_js_esc(statementSource)+'</h2><table><thead><tr><th>#</th><th>التاريخ</th><th>الحركة</th><th>الصنف</th><th>من</th><th>إلى</th><th>وارد</th><th>صادر</th><th>الرصيد</th><th>المسؤول</th><th>المرجع</th></tr></thead><tbody>'+rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.time?new Date(r.time).toLocaleString('ar-EG'):'-')+'</td><td>'+petatoe_v359_car_warehouses_js_esc(normalizeType(r.type))+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.item)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.from)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.to)+'</td><td class="in">'+(r.inQty?fmtQty(r.inQty):'-')+'</td><td class="out">'+(r.outQty?fmtQty(r.outQty):'-')+'</td><td>'+fmtQty(r.balance)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.person)+'</td><td>'+petatoe_v359_car_warehouses_js_esc(r.ref)+'</td></tr>'}).join('')+'</tbody></table></bo'+'dy></html>';
    html=html.replace('</bo'+'dy></html>','<scr'+'ipt>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},300);});<\/scr'+'ipt></bo'+'dy></html>'); var w=openPrintHtml(html,'width=1100,height=800'); if(!w){alert('المتصفح منع نافذة الطباعة');return}
  }
  var __warehouseMainRenderBusy=false, __warehouseMainRenderQueued=false;
  function render(){
    if(window.PETATOEWarehousePerf && !window.PETATOEWarehousePerf.isActive()) return;
    if(__warehouseMainRenderBusy){__warehouseMainRenderQueued=true;return;}
    __warehouseMainRenderBusy=true;
    refreshRows(function(){
      try{renderSelects();renderWarehouseCoreKpis();renderStoreCards();renderStock();renderMovements();updateMoveForm();if(statementSource)renderStatement();try{window.PETATOEWarehouseUI&&window.PETATOEWarehouseUI.renderAll&&window.PETATOEWarehouseUI.renderAll()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);} warehouseDispatch('petatoe:warehouse:rendered',{});}
      finally{__warehouseMainRenderBusy=false;if(__warehouseMainRenderQueued){__warehouseMainRenderQueued=false;window.PETATOEWarehousePerf.debounce('main-render-queued',render,80);}}
    });
  }
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-statement-open-click','click',function(e){
    if(!window.PETATOEWarehousePerf.isActive() && !window.PETATOEWarehousePerf.isWarehouseTarget(e.target)) return;
    var btn=e.target&&e.target.closest?e.target.closest('.wh-statement-open'):null;
    if(btn){e.preventDefault();openStatement(btn.getAttribute('data-wh-store')||'');}
  });
  window.PETATOEWarehouses={render:render,updateMoveForm:updateMoveForm,updateAvailableBox:updateAvailableBox,saveMovement:saveMovement,clearForm:clearForm,resetFilters:resetFilters,openStatement:openStatement,closeStatement:closeStatement,renderStatement:renderStatement,clearStatementFilters:clearStatementFilters,exportStatementCsv:exportStatementCsv,exportMovementsCsv:exportMovementsCsv,printStatement:printStatement};
  function safeTab(name, smartOpen){
    var panels=document.querySelectorAll('.panel');
    var target=byId(name);
    if(target){panels.forEach(function(p){p.classList.remove('active')});target.classList.add('active');document.querySelectorAll('#nav button[data-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.tab===name)});try{if(typeof window.closeSidebar==='function')window.closeSidebar()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);} if(name==='warehouses')window.PETATOEWarehousePerf.debounce('main-render',render,30); return true;}
    return false;
  }
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-main-tabchange-render','petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='warehouses')window.PETATOEWarehousePerf.debounce('main-tabchange-render',render,60)});
  function bindNav(){document.querySelectorAll('#nav button[data-tab="warehouses"]').forEach(function(b){if(b.__whBound)return;b.__whBound=true;b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();window.PETATOERouter.openTab('warehouses')});});}
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-main-domready-bindnav','DOMContentLoaded',function(){bindNav();});
  setTimeout(function(){bindNav(); window.PETATOEWarehousePerf.runWhenActive('main-startup-render',render,120);},500);
})();

/* Extracted script: petatoe-v364-warehouse-tabs-items-js */
(function(){
  'use strict';
  if(window.__PETATOE_WH_V364__) return; window.__PETATOE_WH_V364__=true;
  var MAIN='المخزن الرئيسي';
  var ALLOWED_STORES=[MAIN,'VAN A - AXB 2558','VAN B - SXB 6066'];
  var STORE_ALLOWED_MAP={'المخزن الرئيسي':1,'VAN A - AXB 2558':1,'VAN B - SXB 6066':1};
  function cleanStoreName(v,fallback){v=String(v||'').trim();return STORE_ALLOWED_MAP[v]?v:(fallback||MAIN)}
  var TX_KEY='warehouseTransactions';
  var ITEM_KEY='warehouseItems';
  var editItemId='';
  /* v3.11.10: using global byId */
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function petatoe_v364_warehouse_tabs_items_js_esc(v){return window.PETATOESecurity?PETATOESecurity.escapeHtml(v):String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function num(v){return window.PETATOENumber?PETATOENumber.num(v):(parseFloat(String(v==null?'':v).replace(/,/g,''))||0)}
  function fmtQty(n){return window.PETATOENumber?PETATOENumber.qty(n):(function(x){x=num(x); if(Math.abs(x)<0.000001)x=0; return x.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})})(n)}
  function toast(m){try{if(typeof window.toast==='function')window.toast(m);else alert(m)}catch(e){alert(m)}}
  function petBlock6857_getTx(){try{var a=petStorageReadJSON(TX_KEY,[]);return Array.isArray(a)?a:[]}catch(e){return[]}}
  function warehouseUiGetItems(){return window.PETATOEWarehouseItems.getAll()}
  function warehouseUiSetItems(a){return window.PETATOEWarehouseItems.setAll(a)}
  function itemByName(name){var n=String(name||'').trim();return warehouseUiGetItems().find(function(x){return String(x.name||'').trim()===n})}
  function isStock(name){var it=itemByName(name);return it?((it.type||'stock')==='stock'&&(it.status||'active')!=='inactive'):true}
  function stockNames(){var s={};warehouseUiGetItems().forEach(function(x){if((x.type||'stock')==='stock'&&(x.status||'active')!=='inactive'&&String(x.name||'').trim())s[String(x.name).trim()]=1});petBlock6857_getTx().forEach(function(t){if(t.item&&isStock(t.item))s[t.item]=1});invoiceRows().forEach(function(r){var it=invoiceItemName(r);if(it&&isStock(it))s[it]=1});return Object.keys(s).sort()}
  function readRows(){try{return (window.PETATOEDataSource.getRecordsSync())||[]}catch(e){return[]}}
  function invoiceRows(){try{return window.PETATOEDataSource.getRecordsSync()||[]}catch(e){return readRows()||[]}}
  function invoiceItemName(r){return String((r&&(r.item||r['اسم الصنف']||r.description||r.service||r['الوصف']||r['الخدمة']))||'').trim()}
  function rowVan(r){return String((r&&(r.van||r.vehicle||r['السيارة']))||'').trim()}
  function stores(){return ALLOWED_STORES.slice()}
  function signedRows(){var out=[];petBlock6857_getTx().forEach(function(t){if(!isStock(t.item))return;var q=num(t.qty),type=t.type;if(type==='in'||type==='adjust_plus'){out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.to,MAIN),from:cleanStoreName(t.from,'-'),to:cleanStoreName(t.to,MAIN),inQty:q,outQty:0,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}else if(type==='adjust_minus'||type==='sale_out'){out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.from,MAIN),from:cleanStoreName(t.from,MAIN),to:cleanStoreName(t.to,'-'),inQty:0,outQty:q,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}else if(type==='transfer'||type==='return'){out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.from,MAIN),from:cleanStoreName(t.from,MAIN),to:cleanStoreName(t.to,'-'),inQty:0,outQty:q,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''});out.push({time:t.time,type:type,item:t.item,store:cleanStoreName(t.to,MAIN),from:cleanStoreName(t.from,'-'),to:cleanStoreName(t.to,MAIN),inQty:q,outQty:0,qty:q,person:t.person||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}});return out.sort(function(a,b){return String(a.time||'').localeCompare(String(b.time||''))})}
  function stockRows(){var map={};stores().forEach(function(st){stockNames().forEach(function(it){map[st+'||'+it]={store:st,item:it,balance:0,last:''}})});signedRows().forEach(function(r){var k=r.store+'||'+r.item;if(!map[k])map[k]={store:r.store,item:r.item,balance:0,last:''};map[k].balance+=num(r.inQty)-num(r.outQty);map[k].last=r.time||map[k].last});return Object.keys(map).map(function(k){var x=map[k];if(Math.abs(x.balance)<0.000001)x.balance=0;return x})}
  function movementRows(){return petBlock6857_getTx().filter(function(t){return isStock(t.item)}).slice().sort(function(a,b){return String(b.time||'').localeCompare(String(a.time||''))})}
  function normalizeType(t){if(t==='in')return 'وارد'; if(t==='transfer')return 'تحويل'; if(t==='return')return 'مرتجع'; if(t==='adjust_plus')return 'تسوية زيادة'; if(t==='adjust_minus')return 'تسوية نقص'; if(t==='sale_out')return 'صرف فاتورة'; return t||'-'}
  function warehouseUiAppendOption(el,value,label){var opt=document.createElement('option');opt.value=String(value==null?'':value);opt.textContent=String(label==null?value:label);el.appendChild(opt)}
  function warehouseUiFillSelect(el,arr,allLabel){if(!el)return;var cur=el.value;el.textContent='';if(allLabel)warehouseUiAppendOption(el,'all',allLabel);(arr||[]).forEach(function(v){warehouseUiAppendOption(el,v,v)});if(cur&&(cur==='all'||(arr||[]).indexOf(cur)>-1))el.value=cur}
  function downloadCsv(name,rows){var lines=rows.map(function(row){return row.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'}).join(',')});var blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name.replace(/[\\/:*?"<>|]/g,'_');a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
  function openWarehouseTab(name){qsa('#warehouses .wh-tabs button').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-wh-tab')===name)});qsa('#warehouses .wh-tab-panel').forEach(function(p){p.classList.toggle('active',p.getAttribute('data-wh-tab-panel')===name)});renderWarehouseUIAll();try{document.dispatchEvent(new CustomEvent('petatoe:warehouse:tabchange',{detail:{tab:name}}))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}try{document.querySelector('#warehouses .wh-tabs').scrollIntoView({behavior:'smooth',block:'start'})}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function ensureItemDefaults(){var a=warehouseUiGetItems(), existing={};a.forEach(function(x){if(String(x.name||'').trim())existing[String(x.name).trim()]=1});var m={};petBlock6857_getTx().forEach(function(t){if(t.item)m[String(t.item).trim()]=1});invoiceRows().forEach(function(r){var it=invoiceItemName(r);if(it)m[it]=1});var names=Object.keys(m).filter(function(n){return n&&!existing[n]});if(!names.length)return;var start=0;a.forEach(function(x){var mm=String(x.code||x.id||'').match(/(\d+)/);if(mm)start=Math.max(start,parseInt(mm[1],10)||0)});names.sort().forEach(function(n,i){var code='ITM-'+String(start+i+1).padStart(4,'0');a.push({id:'ITM-AUTO-'+Date.now()+'-'+i,code:code,name:n,type:'service',category:'من الفواتير',unit:'خدمة',min:0,notes:'تم إنشاؤه تلقائياً من الفواتير المرفوعة مسبقاً - افتراضي خدمي ويمكن تحويله إلى مخزني من دليل الأصناف',status:'active',createdAt:new Date().toISOString()})});warehouseUiSetItems(a)}
  function nextCode(){var max=0;warehouseUiGetItems().forEach(function(x){var m=String(x.code||x.id||'').match(/(\d+)/);if(m)max=Math.max(max,parseInt(m[1],10)||0)});return 'ITM-'+String(max+1).padStart(4,'0')}
  function clearItemForm(){editItemId='';try{window.PETATOEWarehouseUI&&(window.PETATOEWarehouseUI.__editingItemId=false)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}['whItemCode','whItemName','whItemCategory','whItemUnit','whItemMin','whItemNotes'].forEach(function(id){var e=byId(id);if(e)e.value=''});var t=byId('whItemType');if(t)t.value='service';var c=byId('whItemCode');if(c)c.value=nextCode();try{document.dispatchEvent(new CustomEvent('petatoe:warehouse:item-form-cleared'))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function saveItem(){var code=String((byId('whItemCode')||{}).value||'').trim()||nextCode(),name=String((byId('whItemName')||{}).value||'').trim(),type=(byId('whItemType')||{}).value||'service',cat=String((byId('whItemCategory')||{}).value||'').trim(),unit=String((byId('whItemUnit')||{}).value||'').trim(),min=num((byId('whItemMin')||{}).value),notes=String((byId('whItemNotes')||{}).value||'').trim();if(!name){alert('اكتب اسم الصنف');return}var a=warehouseUiGetItems();var dup=a.find(function(x){return String(x.name||'').trim()===name&&x.id!==editItemId});if(dup){alert('اسم الصنف موجود بالفعل');return}if(editItemId){a=a.map(function(x){return x.id===editItemId?Object.assign({},x,{code:code,name:name,type:type,category:cat,unit:unit,min:min,notes:notes,updatedAt:new Date().toISOString()}):x})}else{code=nextCode();a.push({id:'ITM-'+Date.now(),code:code,name:name,type:type,category:cat,unit:unit,min:min,notes:notes,status:'active',createdAt:new Date().toISOString()})}warehouseUiSetItems(a);clearItemForm();renderWarehouseUIAll();try{document.dispatchEvent(new CustomEvent('petatoe:warehouse:item-saved',{detail:{name:name,code:code,type:type}}))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}try{window.PETATOEWarehouses&&window.PETATOEWarehouses.render&&window.PETATOEWarehouses.render()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}toast('تم حفظ الصنف')}
  function editItem(id){var x=warehouseUiGetItems().find(function(i){return i.id===id});if(!x)return;editItemId=id;try{window.PETATOEWarehouseUI&&(window.PETATOEWarehouseUI.__editingItemId=true)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}var set=function(id,v){var e=byId(id);if(e)e.value=v==null?'':v};set('whItemCode',x.code||x.id);set('whItemName',x.name);set('whItemType',x.type||'service');set('whItemCategory',x.category);set('whItemUnit',x.unit);set('whItemMin',x.min||0);set('whItemNotes',x.notes);try{document.dispatchEvent(new CustomEvent('petatoe:warehouse:item-edit',{detail:{id:id}}))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}openWarehouseTab('items');}
  function toggleItem(id){var a=warehouseUiGetItems().map(function(x){return x.id===id?Object.assign({},x,{status:(x.status||'active')==='active'?'inactive':'active'}):x});warehouseUiSetItems(a);renderWarehouseUIAll();try{document.dispatchEvent(new CustomEvent('petatoe:warehouse:item-changed',{detail:{id:id,action:'toggle'}}))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}try{window.PETATOEWarehouses&&window.PETATOEWarehouses.render&&window.PETATOEWarehouses.render()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function deleteItem(id){var x=warehouseUiGetItems().find(function(i){return i.id===id});if(!x)return;if(petBlock6857_getTx().some(function(t){return t.item===x.name})){alert('لا يمكن حذف صنف عليه حركات مخزنية. يمكن إيقافه بدل الحذف.');return}if(!confirm('حذف الصنف؟'))return;warehouseUiSetItems(warehouseUiGetItems().filter(function(i){return i.id!==id}));renderWarehouseUIAll();try{document.dispatchEvent(new CustomEvent('petatoe:warehouse:item-changed',{detail:{id:id,action:'delete'}}))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function renderItems(){var body=byId('whItemsBody');if(!body)return;ensureItemDefaults();var q=String((byId('whItemSearch')||{}).value||'').toLowerCase(),typ=(byId('whItemTypeFilter')||{}).value||'all',st=(byId('whItemStatusFilter')||{}).value||'all';var rows=warehouseUiGetItems().filter(function(x){var txt=(x.code+' '+x.name+' '+x.category+' '+x.unit).toLowerCase();return(!q||txt.indexOf(q)>-1)&&(typ==='all'||(x.type||'stock')===typ)&&(st==='all'||(x.status||'active')===st)});window.PETATOEWarehouseSafeRender.html(body, rows.map(function(x,i){var type=x.type||'stock',status=x.status||'active';return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(x.code||x.id)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(x.name)+'</td><td><span class="wh-type-pill '+(type==='service'?'service':'stock')+'">'+(type==='service'?'خدمي':'مخزني')+'</span></td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(x.category||'-')+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(x.unit||'-')+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(x.min||0)+'</td><td><span class="wh-status-pill '+(status==='inactive'?'inactive':'active')+'">'+(status==='inactive'?'متوقف':'نشط')+'</span></td><td><button class="btn btn-ghost" type="button" data-wh-item-action="edit" data-wh-item-id="'+petatoe_v364_warehouse_tabs_items_js_esc(x.id)+'">تعديل</button> <button class="btn btn-ghost" type="button" data-wh-item-action="toggle" data-wh-item-id="'+petatoe_v364_warehouse_tabs_items_js_esc(x.id)+'">'+(status==='inactive'?'تفعيل':'إيقاف')+'</button> <button class="btn btn-danger" type="button" data-wh-item-action="delete" data-wh-item-id="'+petatoe_v364_warehouse_tabs_items_js_esc(x.id)+'">حذف</button></td></tr>'}).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:22px">لا توجد أصناف مطابقة.</td></tr>', 'warehouse-core render');}
  function renderRecent(){var body=byId('whRecentBody');if(!body)return;var rows=movementRows().slice(0,10);window.PETATOEWarehouseSafeRender.html(body, rows.map(function(t,i){return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(t.time?new Date(t.time).toLocaleString('ar-EG'):'-')+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(normalizeType(t.type))+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(t.item)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(t.from||'-')+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(t.to||'-')+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(t.qty)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(t.person||'-')+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(t.ref||'-')+'</td></tr>'}).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:22px">لا توجد حركات بعد.</td></tr>', 'warehouse-core render')}
  function renderReportSelects(){var st=stores();warehouseUiFillSelect(byId('whStatementStoreSelect'),st,'اختر المخزن');warehouseUiFillSelect(byId('whInventoryStore'),st,'كل المخازن');warehouseUiFillSelect(byId('whSlowStore'),st,'كل المخازن');warehouseUiFillSelect(byId('whFastStore'),st,'كل المخازن');var dl=byId('whItemsList');if(dl)window.PETATOEWarehouseSafeRender.html(dl, stockNames().map(function(v){return '<option value="'+petatoe_v364_warehouse_tabs_items_js_esc(v)+'"></option>'}).join(''), 'warehouse datalist render')}
  function openStatementFromSelect(){var s=byId('whStatementStoreSelect');var v=s?s.value:'all';if(!v||v==='all'){alert('اختر المخزن أولاً');return}try{PETATOEWarehouses.openStatement(v)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}openWarehouseTab('statement')}
  function inventoryRows(){var st=(byId('whInventoryStore')||{}).value||'all',q=String((byId('whInventorySearch')||{}).value||'').toLowerCase();return stockRows().filter(function(r){return (st==='all'||r.store===st)&&(!q||r.item.toLowerCase().indexOf(q)>-1)})}
  function renderInventory(){var body=byId('whInventoryBody');if(!body)return;var rows=inventoryRows();window.PETATOEWarehouseSafeRender.html(body, rows.map(function(r,i){var actual=r.balance,diff=actual-r.balance,cls=diff>0?'wh-diff-plus':diff<0?'wh-diff-minus':'wh-diff-zero';return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(r.store)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(r.item)+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(r.balance)+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(actual)+'</td><td class="'+cls+'">'+fmtQty(diff)+'</td><td>مطابق</td></tr>'}).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:22px">لا توجد أرصدة للجرد.</td></tr>', 'warehouse inventory render')}
  function slowRows(){var st=(byId('whSlowStore')||{}).value||'all',days=num((byId('whSlowDays')||{}).value||60),q=String((byId('whSlowSearch')||{}).value||'').toLowerCase(),now=Date.now();return stockRows().filter(function(r){if(r.balance<=0)return false;if(st!=='all'&&r.store!==st)return false;if(q&&r.item.toLowerCase().indexOf(q)<0)return false;var age=r.last?Math.floor((now-new Date(r.last).getTime())/86400000):9999;return age>=days}).map(function(r){r.age=r.last?Math.floor((now-new Date(r.last).getTime())/86400000):9999;return r}).sort(function(a,b){return b.age-a.age})}
  function renderSlowItems(){var body=byId('whSlowBody');if(!body)return;var rows=slowRows();window.PETATOEWarehouseSafeRender.html(body, rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(r.store)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(r.item)+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(r.balance)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(r.last?new Date(r.last).toLocaleString('ar-EG'):'لا توجد حركة')+'</td><td style="font-weight:950">'+(r.age===9999?'بدون حركة':r.age+' يوم')+'</td></tr>'}).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:22px">لا توجد أصناف راكدة حسب الفلتر.</td></tr>', 'warehouse slow items render')}
  function fastRows(){var st=(byId('whFastStore')||{}).value||'all',days=num((byId('whFastDays')||{}).value||90),q=String((byId('whFastSearch')||{}).value||'').toLowerCase(),limit=Date.now()-days*86400000,map={};signedRows().forEach(function(r){var t=r.time?new Date(r.time).getTime():0;if(t<limit)return;if(st!=='all'&&r.store!==st)return;if(q&&r.item.toLowerCase().indexOf(q)<0)return;var m=map[r.item]||(map[r.item]={item:r.item,count:0,qty:0,last:''});m.count++;m.qty+=num(r.inQty)+num(r.outQty);if(!m.last||String(r.time)>String(m.last))m.last=r.time});return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return b.qty-a.qty})}
  function renderFastItems(){var body=byId('whFastBody');if(!body)return;var rows=fastRows();window.PETATOEWarehouseSafeRender.html(body, rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(r.item)+'</td><td>'+r.count+'</td><td style="direction:ltr;font-weight:950">'+fmtQty(r.qty)+'</td><td>'+petatoe_v364_warehouse_tabs_items_js_esc(r.last?new Date(r.last).toLocaleString('ar-EG'):'-')+'</td><td><span class="wh-fast-rank">'+(i<3?'سريع جدًا':'نشط')+'</span></td></tr>'}).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:22px">لا توجد أصناف سريعة الحركة حسب الفلتر.</td></tr>', 'warehouse fast items render')}
  function exportItemsCsv(){downloadCsv('PETATOE_Warehouse_Items.csv',[['الكود','الاسم','النوع','التصنيف','الوحدة','الحد الأدنى','الحالة','ملاحظات']].concat(warehouseUiGetItems().map(function(x){return[x.code,x.name,x.type==='service'?'خدمي':'مخزني',x.category,x.unit,x.min,x.status,x.notes]})))}
  function exportInventoryCsv(){downloadCsv('PETATOE_Warehouse_Inventory.csv',[['المخزن','الصنف','الرصيد الدفتري','الرصيد الفعلي','فرق الجرد']].concat(inventoryRows().map(function(r){return[r.store,r.item,r.balance,r.balance,0]})))}
  function exportSlowCsv(){downloadCsv('PETATOE_Warehouse_Slow_Items.csv',[['المخزن','الصنف','الرصيد','آخر حركة','أيام بدون حركة']].concat(slowRows().map(function(r){return[r.store,r.item,r.balance,r.last,r.age]})))}
  function exportFastCsv(){downloadCsv('PETATOE_Warehouse_Fast_Items.csv',[['الصنف','عدد الحركات','إجمالي الكمية','آخر حركة']].concat(fastRows().map(function(r){return[r.item,r.count,r.qty,r.last]})))}
  function refreshAll(){try{window.PETATOEWarehouses&&window.PETATOEWarehouses.render&&window.PETATOEWarehouses.render()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}renderWarehouseUIAll()}
  function renderWarehouseUIAllNow(){ensureItemDefaults();renderReportSelects();renderItems();renderRecent();renderInventory();renderSlowItems();renderFastItems();var c=byId('whItemCode');if(c&&!editItemId)c.value=nextCode();try{document.dispatchEvent(new CustomEvent('petatoe:warehouse:ui-rendered'))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function renderWarehouseUIAll(){window.PETATOEWarehousePerf.runWhenActive('ui-render-all',renderWarehouseUIAllNow,90)}
  document.addEventListener('petatoe:warehouse:before-save-movement',function(e){var item=String((e.detail&&e.detail.item)||'').trim();var it=itemByName(item);if(it&&(it.type||'stock')==='service'){alert('هذا صنف خدمي ولا يتم خصمه أو تحريكه داخل المخازن');e.preventDefault();return}if(it&&(it.status||'active')==='inactive'){alert('هذا الصنف متوقف، فعّله أولاً من دليل الأصناف');e.preventDefault();return}});
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('.wh-statement-open'):null;if(b){openWarehouseTab('statement')}});
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest?e.target.closest('[data-wh-item-action]'):null;
    if(!btn)return;
    var body=byId('whItemsBody');
    if(body&&!body.contains(btn))return;
    e.preventDefault();
    var id=btn.getAttribute('data-wh-item-id')||'';
    var action=btn.getAttribute('data-wh-item-action')||'';
    if(!id)return;
    if(action==='edit')editItem(id);
    else if(action==='toggle')toggleItem(id);
    else if(action==='delete')deleteItem(id);
  });
  window.PETATOEWarehouseUI={openTab:openWarehouseTab,renderAll:renderWarehouseUIAll,refreshAll:refreshAll,saveItem:saveItem,clearItemForm:clearItemForm,editItem:editItem,toggleItem:toggleItem,deleteItem:deleteItem,renderItems:renderItems,exportItemsCsv:exportItemsCsv,openStatementFromSelect:openStatementFromSelect,renderInventory:renderInventory,exportInventoryCsv:exportInventoryCsv,renderSlowItems:renderSlowItems,exportSlowCsv:exportSlowCsv,renderFastItems:renderFastItems,exportFastCsv:exportFastCsv};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){window.PETATOEWarehousePerf.runWhenActive('ui-startup-render',renderWarehouseUIAllNow,300);});else{window.PETATOEWarehousePerf.runWhenActive('ui-startup-render',renderWarehouseUIAllNow,300)}
})();

/* Extracted script: petatoe-v369-warehouse-invoice-items-visible-edit-fixed */
(function(){
  'use strict';
  if(window.__PETATOE_WH_V369_ITEMS_VISIBLE_EDIT_FIXED__) return;
  window.__PETATOE_WH_V369_ITEMS_VISIBLE_EDIT_FIXED__ = true;

  var ITEM_KEY='warehouseItems';
  var ITEM_KEYS=['item','service','description','product','productName','itemName','name','اسم الصنف','الصنف','الخدمة','الخدمه','اسم الخدمة','الوصف','البيان'];

  function readJson(k,fb){try{var v=petStorageReadJSON(k,fb); return Array.isArray(v)?v:fb;}catch(e){return fb}}
  function writeJson(k,v){try{petStorageWriteJSON(k,v||[]);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  function whInvoiceItemsNorm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function low(v){return whInvoiceItemsNorm(v).toLowerCase()}
  /* v3.11.10: using global byId */
  function cleanBadTextNodes(){
    try{
      var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null);
      var del=[], n;
      while((n=walker.nextNode())){
        var t=String(n.nodeValue||'').trim();
        if(t.indexOf('win.document.open()')>-1 || t.indexOf('petatoeClosePdfModal')>-1 || t.indexOf('keyboard shortcut: Ctrl+Shift+P')>-1){del.push(n)}
      }
      del.forEach(function(x){if(x&&x.parentNode)x.parentNode.removeChild(x)});
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
  }
  function petatoe_v369_warehouse_invoice_items_vis_getItems(){return readJson(ITEM_KEY,[])}
  function warehouseInvoiceItemsSetItems(a){return window.PETATOEWarehouseItems.setAll(a)}
  function directRows(){
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getInvoiceRowsSync==='function'){
        return window.PETATOEDataSource.getInvoiceRowsSync({includeImport:true});
      }
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync==='function'){
        var out=(window.PETATOEDataSource.getRecordsSync()||[]).slice();
        try{if(Array.isArray(window.importData)) out=out.concat(window.importData)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
        return out.filter(Boolean);
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
    try{return ((window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync&&window.PETATOEDataSource.getRecordsSync())||[]).concat(Array.isArray(window.importData)?window.importData:[]).filter(Boolean)}catch(e){return []}
  }
  function asyncRows(cb){
    var done=false;
    function finish(r){if(done)return;done=true;cb(Array.isArray(r)?r:directRows())}
    try{
      if(typeof window.loadRecords==='function'){
        var p=window.loadRecords();
        if(p && typeof p.then==='function'){
          p.then(function(r){
            var rows=Array.isArray(r)?r:[];
            finish(rows.concat(directRows()));
          }).catch(function(){finish(directRows())});
          return;
        }
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
    finish(directRows());
  }
  function addName(map,v){
    v=whInvoiceItemsNorm(v);
    if(!v) return;
    if(/^(undefined|null|غير محدد|-|0)$/i.test(v)) return;
    if(v.length>120) return;
    map[low(v)]=v;
  }
  function extractNamesFromRows(rows){
    var map={};
    (rows||[]).forEach(function(r){
      if(!r || typeof r!=='object') return;
      ITEM_KEYS.forEach(function(k){addName(map,r[k]);});
      ['items','lines','invoiceItems','details','services','rows'].forEach(function(k){
        var a=r[k]; if(!Array.isArray(a)) return;
        a.forEach(function(x){
          if(typeof x==='string') addName(map,x);
          else if(x && typeof x==='object') ITEM_KEYS.forEach(function(kk){addName(map,x[kk]);});
        });
      });
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return a.localeCompare(b,'ar')});
  }
  function codeGenerator(items){
    var max=0;
    (items||[]).forEach(function(x){var m=String((x&&x.code)||(x&&x.id)||'').match(/(\d+)/); if(m) max=Math.max(max,parseInt(m[1],10)||0);});
    return function(){max++; return 'ITM-'+String(max).padStart(4,'0')};
  }
  function syncInvoiceItems(rows){
    var names=extractNamesFromRows(rows);
    var items=petatoe_v369_warehouse_invoice_items_vis_getItems();
    var gen=codeGenerator(items);
    var byName={};
    items.forEach(function(x){var k=low(x&&x.name); if(k) byName[k]=x;});
    var changed=false;
    names.forEach(function(n){
      var k=low(n);
      if(!byName[k]){
        var obj={
          id:'ITM-INVOICE-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
          code:gen(),
          name:n,
          type:'service',
          category:'من الفواتير',
          unit:'خدمة',
          min:0,
          notes:'تم إنشاؤه تلقائياً من الفواتير المرفوعة مسبقاً - افتراضي خدمي ويمكن تحويله إلى مخزني من زر تعديل',
          status:'active',
          source:'invoice',
          createdAt:new Date().toISOString()
        };
        items.push(obj); byName[k]=obj; changed=true;
      }else{
        var it=byName[k];
        if((it.source==='invoice' || it.category==='من الفواتير' || /^ITM-INVOICE-|^ITM-AUTO-/.test(String(it.id||''))) && !it.userClassified){
          if(it.type!=='service'){it.type='service';changed=true;}
          if(!it.source){it.source='invoice';changed=true;}
          if(!it.category){it.category='من الفواتير';changed=true;}
          if(!it.unit){it.unit='خدمة';changed=true;}
          if((it.status||'')===''){it.status='active';changed=true;}
        }
      }
    });
    if(changed) warehouseInvoiceItemsSetItems(items);
    return names.length;
  }
  function markClassified(name,code){
    name=low(name); code=low(code);
    if(!name && !code) return;
    var items=petatoe_v369_warehouse_invoice_items_vis_getItems(), changed=false;
    items.forEach(function(x){
      if((name && low(x.name)===name) || (code && low(x.code)===code)){
        if(!x.userClassified){x.userClassified=true; changed=true;}
      }
    });
    if(changed) warehouseInvoiceItemsSetItems(items);
  }
  function forceShowAllFilters(){
    ['whItemTypeFilter','whItemStatusFilter'].forEach(function(id){var el=byId(id); if(el) el.value='all'});
  }
  function renderWarehouseItems(){
    try{forceShowAllFilters();}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
    try{if(window.PETATOEWarehouseUI && typeof window.PETATOEWarehouseUI.renderItems==='function') window.PETATOEWarehouseUI.renderItems();}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
    try{if(window.PETATOEWarehouseUI && typeof window.PETATOEWarehouseUI.renderAll==='function') window.PETATOEWarehouseUI.renderAll();}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
  }
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-invoice-item-saved','petatoe:warehouse:item-saved',function(e){try{var d=e.detail||{};markClassified(d.name||'',d.code||'');window.PETATOEWarehousePerf.runWhenActive('invoice-item-saved-render',renderWarehouseItems,120);}catch(_e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",_e);}});
  function addManualSyncButton(){
    try{
      var toolbar=byId('whItemSearch');
      if(!toolbar) return;
      var wrap=toolbar.closest('.wh-filter');
      if(!wrap || byId('whSyncInvoiceItemsBtn')) return;
      var btn=document.createElement('button');
      btn.type='button';
      btn.id='whSyncInvoiceItemsBtn';
      btn.className='btn btn-ghost';
      btn.textContent='🔄 تحديث الأصناف من الفواتير';
      btn.onclick=function(){run(true)};
      wrap.appendChild(btn);
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
  }
  function run(showMsg){
    cleanBadTextNodes();
    addManualSyncButton();
    asyncRows(function(rows){
      var count=syncInvoiceItems(rows);
      renderWarehouseItems();
      cleanBadTextNodes();
      if(showMsg){try{(window.toast||alert)('تم تحديث دليل الأصناف من الفواتير: '+count+' صنف')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
    });
  }
  window.PETATOESyncInvoiceItemsAsServices=run;
  var __warehouseInvoiceAutoSyncRan=false;
  function runAutoOnce(){
    if(__warehouseInvoiceAutoSyncRan) return;
    __warehouseInvoiceAutoSyncRan=true;
    window.PETATOEWarehousePerf.runWhenActive('invoice-items-auto-sync-once',function(){run(false);},700);
  }
  if(document.readyState==='loading'){
    window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-invoice-sync-domready','DOMContentLoaded',runAutoOnce);
  }else{
    runAutoOnce();
  }
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-invoice-sync-tabchange','petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='warehouses')runAutoOnce();});
})();

/* Extracted script: petatoe-v370-warehouse-item-serial-safe */
(function(){
  'use strict';
  if(window.__PETATOE_WH_V370_SERIAL_SAFE__) return;
  window.__PETATOE_WH_V370_SERIAL_SAFE__=true;
  var ITEM_KEY='warehouseItems';
  /* v3.11.10: using global byId */
  function petatoe_v370_warehouse_item_serial_safe_getItems(){try{var a=petStorageReadJSON(ITEM_KEY,[]);return Array.isArray(a)?a:[]}catch(e){return[]}}
  function maxItemNo(){var max=0;petatoe_v370_warehouse_item_serial_safe_getItems().forEach(function(x){var m=String((x&&x.code)||(x&&x.id)||'').match(/ITM-(\d+)/i)||String((x&&x.code)||(x&&x.id)||'').match(/(\d+)/);if(m)max=Math.max(max,parseInt(m[1],10)||0)});return max}
  function nextCode(){return 'ITM-'+String(maxItemNo()+1).padStart(4,'0')}
  function updateDisplayedCode(force){
    var c=byId('whItemCode'); if(!c) return;
    var isEditing=false;
    try{isEditing=!!(window.PETATOEWarehouseUI&&window.PETATOEWarehouseUI.__editingItemId)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
    if(force || (!isEditing && !String(c.value||'').trim())) c.value=nextCode();
  }
  function patchUI(){try{if(window.PETATOEWarehouseUI)window.PETATOEWarehouseUI.nextItemCode=nextCode;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}
  ['petatoe:warehouse:item-form-cleared','petatoe:warehouse:item-changed','petatoe:warehouse:ui-rendered'].forEach(function(evt){window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-serial-'+evt,evt,function(){window.PETATOEWarehousePerf.runWhenActive('item-code-update',function(){updateDisplayedCode(true)},80)})});
  function tick(){patchUI();updateDisplayedCode(false)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){window.PETATOEWarehousePerf.runWhenActive('item-code-startup',tick,300)});
  else{window.PETATOEWarehousePerf.runWhenActive('item-code-startup',tick,300)}
})();

/* Extracted script: petatoe-v372-warehouse-stock-search-excel-import-fixed-safe */
(function(){
  'use strict';
  if(window.__PETATOE_WH_V372_STOCK_SEARCH_EXCEL__) return;
  window.__PETATOE_WH_V372_STOCK_SEARCH_EXCEL__ = true;

  var ITEM_KEY = 'warehouseItems';
  var XLS_INPUT_ID = 'whExcelItemsImportInput';
  var XLS_BTN_ID = 'whExcelItemsImportBtn';
  var XLS_TEMPLATE_BTN_ID = 'whExcelItemsTemplateBtn';
  var ITEM_KEYS = ['اسم الصنف','الصنف','الخدمة','الخدمه','اسم الخدمة','الوصف','البيان','item','Item','ITEM','service','Service','description','Description','product','Product','productName','itemName','name','Name'];
  var TYPE_KEYS = ['نوع الصنف','النوع','type','Type','itemType','Item Type'];
  var CAT_KEYS = ['التصنيف','الفئة','category','Category','group','Group'];
  var UNIT_KEYS = ['الوحدة','unit','Unit','uom','UOM'];
  var MIN_KEYS = ['الحد الأدنى','حد أدنى','min','Min','minimum','Minimum'];
  var NOTES_KEYS = ['ملاحظات','notes','Notes','note','Note'];

  /* v3.11.10: using global byId */
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function whInvoiceItemsNorm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function low(v){return whInvoiceItemsNorm(v).toLowerCase()}
  function num(v){return window.PETATOENumber?PETATOENumber.num(v):(parseFloat(String(v==null?'':v).replace(/,/g,''))||0)}
  function petatoe_v372_warehouse_stock_search_exce_esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function toast(m){try{(window.toast||alert)(m)}catch(e){alert(m)}}
  function petatoe_v372_warehouse_stock_search_exce_getItems(){try{var a=petStorageReadJSON(ITEM_KEY,[]);return Array.isArray(a)?a:[]}catch(e){return[]}}
  function warehouseStockSearchSetItems(a){return window.PETATOEWarehouseItems.setAll(a)}
  function getVal(row,keys){for(var i=0;i<keys.length;i++){var k=keys[i];if(row&&row[k]!=null&&whInvoiceItemsNorm(row[k])!=='')return row[k]}return ''}
  function maxItemNo(items){var max=0;(items||petatoe_v372_warehouse_stock_search_exce_getItems()).forEach(function(x){var raw=String((x&&x.code)||(x&&x.id)||'');var m=raw.match(/ITM-(\d+)/i)||raw.match(/(\d+)/);if(m)max=Math.max(max,parseInt(m[1],10)||0)});return max}
  function nextCode(items){return 'ITM-'+String(maxItemNo(items)+1).padStart(4,'0')}
  function classifyType(v){v=low(v);if(!v)return 'service';if(v.indexOf('مخز')>-1||v==='stock'||v==='inventory'||v==='stored'||v==='warehouse')return 'stock';return 'service'}
  function stockItems(){return petatoe_v372_warehouse_stock_search_exce_getItems().filter(function(x){return x&&x.name&&(x.status||'active')!=='inactive'&&(x.type||'service')==='stock'})}

  function refreshStockDatalist(){var inp=byId('whItem'); if(!inp)return; inp.removeAttribute('list'); inp.setAttribute('autocomplete','off'); var dl=byId('whItemsList'); if(dl&&dl.parentNode)dl.parentNode.removeChild(dl)}

  function enhanceStockSearch(){
    var inp=byId('whItem');
    if(!inp) return;
    inp.removeAttribute('list');
    inp.setAttribute('autocomplete','off');
    inp.placeholder='اكتب أو اختر من الأصناف المخزنية فقط';
    if(!inp.__v372Bound){
      inp.__v372Bound=true;
      inp.addEventListener('focus',refreshStockDatalist);
      inp.addEventListener('input',function(){refreshStockDatalist();try{window.PETATOEWarehouses&&window.PETATOEWarehouses.updateAvailableBox&&window.PETATOEWarehouses.updateAvailableBox()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}});
      inp.addEventListener('change',function(){
        var v=low(inp.value);
        if(v && !stockItems().some(function(x){return low(x.name)===v;})){
          inp.setCustomValidity('الصنف غير موجود ضمن الأصناف المخزنية أو مازال خدمي.');
        }else{
          inp.setCustomValidity('');
        }
      });
    }
  }

  function createExcelControls(){
    var itemsPanel=document.querySelector('#warehouses [data-wh-tab-panel="items"]');
    if(!itemsPanel) return;
    var firstActions=itemsPanel.querySelector('.wh-item-form .wh-actions');
    var filter=itemsPanel.querySelector('.wh-filter');
    var host=firstActions || filter;
    if(!host || byId(XLS_BTN_ID)) return;

    var input=document.createElement('input');
    input.type='file';
    input.accept='.xlsx,.xls,.csv';
    input.id=XLS_INPUT_ID;
    input.style.display='none';
    input.addEventListener('change',handleExcelFile);
    host.appendChild(input);

    var btn=document.createElement('button');
    btn.type='button';
    btn.id=XLS_BTN_ID;
    btn.className='btn btn-primary';
    btn.textContent='📥 إضافة أصناف من Excel';
    btn.onclick=function(){byId(XLS_INPUT_ID).click()};
    host.appendChild(btn);

    var tmpl=document.createElement('button');
    tmpl.type='button';
    tmpl.id=XLS_TEMPLATE_BTN_ID;
    tmpl.className='btn btn-ghost';
    tmpl.textContent='📄 قالب الأصناف';
    tmpl.onclick=downloadTemplate;
    host.appendChild(tmpl);
  }

  function downloadTemplate(){
    var rows=[
      ['اسم الصنف','نوع الصنف','التصنيف','الوحدة','الحد الأدنى','ملاحظات'],
      ['شامبو عناية','مخزني','عناية','عبوة','5','مثال صنف مخزني'],
      ['قص شعر كلب','خدمي','خدمات','خدمة','0','الخدمي لا يدخل المخزون']
    ];
    if(window.XLSX){
      var wb=XLSX.utils.book_new();
      var ws=XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb,ws,'Items');
      XLSX.writeFile(wb,'PETATOE_Warehouse_Items_Template.xlsx');
    }else{
      var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
      var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}));a.download='PETATOE_Warehouse_Items_Template.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},500);
    }
  }

  function rowsFromWorkbook(wb){
    var sh=wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sh,{defval:''});
  }
  function handleExcelFile(e){
    var file=e.target.files&&e.target.files[0];
    e.target.value='';
    if(!file) return;
    if(!window.XLSX){alert('مكتبة Excel غير محملة. افتح الصفحة بالإنترنت أو استخدم القالب CSV لاحقاً.');return}
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var wb=XLSX.read(new Uint8Array(ev.target.result),{type:'array'});
        importRows(rowsFromWorkbook(wb));
      }catch(err){console.error(err);alert('تعذر قراءة ملف Excel. تأكد من صيغة الملف.');}
    };
    reader.readAsArrayBuffer(file);
  }
  function importRows(rows){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length){alert('ملف Excel لا يحتوي على بيانات.');return}
    var items=petatoe_v372_warehouse_stock_search_exce_getItems();
    var byName={};
    items.forEach(function(x){var k=low(x&&x.name);if(k)byName[k]=x});
    var added=0, updated=0, skipped=0;
    rows.forEach(function(r){
      var name=whInvoiceItemsNorm(getVal(r,ITEM_KEYS));
      if(!name){skipped++;return}
      var key=low(name);
      var type=classifyType(getVal(r,TYPE_KEYS));
      var cat=whInvoiceItemsNorm(getVal(r,CAT_KEYS)) || (type==='stock'?'مخزني':'خدمي');
      var unit=whInvoiceItemsNorm(getVal(r,UNIT_KEYS)) || (type==='stock'?'قطعة':'خدمة');
      var min=num(getVal(r,MIN_KEYS));
      var notes=whInvoiceItemsNorm(getVal(r,NOTES_KEYS));
      if(byName[key]){
        var x=byName[key];
        x.type=type;
        x.category=cat||x.category||'';
        x.unit=unit||x.unit||'';
        x.min=min;
        x.notes=notes||x.notes||'';
        x.status=x.status||'active';
        x.userClassified=true;
        updated++;
      }else{
        var obj={id:'ITM-EXCEL-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),code:nextCode(items),name:name,type:type,category:cat,unit:unit,min:min,notes:notes,status:'active',source:'excel',userClassified:true,createdAt:new Date().toISOString()};
        items.push(obj);byName[key]=obj;added++;
      }
    });
    warehouseStockSearchSetItems(items);
    refreshAllSafe();
    toast('تم استيراد الأصناف: جديد '+added+' / تحديث '+updated+' / متروك '+skipped);
  }

  function bindWarehouseEvents(){
    if(window.__PETATOE_V372_WAREHOUSE_EVENTS_BOUND__)return;
    window.__PETATOE_V372_WAREHOUSE_EVENTS_BOUND__=true;
    window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-stock-before-save','petatoe:warehouse:before-save-movement',function(e){
      var inp=byId('whItem');
      var name=whInvoiceItemsNorm((e.detail&&e.detail.item)||(inp&&inp.value));
      if(!name){alert('اختر صنف مخزني أولاً');e.preventDefault();return}
      if(!stockItems().some(function(x){return low(x.name)===low(name)})){
        alert('هذا الصنف غير موجود ضمن الأصناف المخزنية. حوّله إلى مخزني من دليل الأصناف أو أضفه من Excel.');
        if(inp) inp.focus();
        e.preventDefault();
      }
    });
    ['petatoe:warehouse:ui-rendered','petatoe:warehouse:rendered','petatoe:warehouse:item-saved','petatoe:warehouse:item-changed','petatoe:warehouse:item-form-cleared'].forEach(function(evt){
      window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-stock-refresh-'+evt,evt,function(){window.PETATOEWarehousePerf.runWhenActive('stock-datalist-refresh',refreshStockDatalist,120)});
    });
  }
  function refreshAllSafe(){
    enhanceStockSearch();
    refreshStockDatalist();
    createExcelControls();
    bindWarehouseEvents();
    try{if(window.PETATOEWarehousePerf&&window.PETATOEWarehousePerf.isActive()&&window.PETATOEWarehouseUI&&window.PETATOEWarehouseUI.renderAll)window.PETATOEWarehouseUI.renderAll()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
    try{window.PETATOEWarehouses&&window.PETATOEWarehouses.updateAvailableBox&&window.PETATOEWarehouses.updateAvailableBox()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){window.PETATOEWarehousePerf.runWhenActive('stock-search-startup',refreshAllSafe,500)});
  }else{
    window.PETATOEWarehousePerf.runWhenActive('stock-search-startup',refreshAllSafe,500);
  }
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-stock-tabchange','petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='warehouses')window.PETATOEWarehousePerf.debounce('stock-search-tabchange',refreshAllSafe,220)});
  window.PETATOEWarehouseStockSearchRefreshAll = refreshAllSafe;
})();

/* Extracted script: petatoe-v377-warehouse-search-final-js */
(function(){
  'use strict';
  if(window.__PETATOE_V377_WAREHOUSE_SEARCH_FINAL__) return;
  window.__PETATOE_V377_WAREHOUSE_SEARCH_FINAL__=true;
  var ITEM_KEY='warehouseItems';
  /* v3.11.10: using global byId */
  function whInvoiceItemsNorm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function low(v){return whInvoiceItemsNorm(v).toLowerCase()}
  function petatoe_v377_warehouse_search_final_js_esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function petatoe_v377_warehouse_search_final_js_getItems(){try{var a=petStorageReadJSON(ITEM_KEY,[]);return Array.isArray(a)?a:[]}catch(e){return []}}
  function stockItems(){return petatoe_v377_warehouse_search_final_js_getItems().filter(function(x){return x&&whInvoiceItemsNorm(x.name)&&String(x.status||'active')!=='inactive'&&String(x.type||'service')==='stock'})}
  function matchItems(q){q=low(q);var a=stockItems();if(!q)return a.slice(0,12);return a.filter(function(x){return low((x.name||'')+' '+(x.code||x.id||'')+' '+(x.category||'')+' '+(x.unit||'')).indexOf(q)>-1}).slice(0,18)}
  function removeNative(){var inp=byId('whItem');if(inp){inp.removeAttribute('list');inp.setAttribute('autocomplete','off');inp.placeholder='اكتب أو اختر من الأصناف المخزنية فقط'}var dl=byId('whItemsList');if(dl&&dl.parentNode)dl.parentNode.removeChild(dl)}
  function wrapInput(){
    var inp=byId('whItem'); if(!inp) return null;
    removeNative();
    var parent=inp.parentNode;
    if(!parent) return inp;
    if(!inp.closest('.wh-stock-search-wrap')){
      var wrap=document.createElement('div');wrap.className='wh-stock-search-wrap';
      parent.insertBefore(wrap,inp);wrap.appendChild(inp);
      var menu=document.createElement('div');menu.id='whStockSearchMenu';menu.className='wh-stock-search-menu';wrap.appendChild(menu);
    }else if(!byId('whStockSearchMenu')){
      var menu2=document.createElement('div');menu2.id='whStockSearchMenu';menu2.className='wh-stock-search-menu';inp.closest('.wh-stock-search-wrap').appendChild(menu2);
    }
    return inp;
  }
  function renderMenu(show){
    var inp=wrapInput(), menu=byId('whStockSearchMenu'); if(!inp||!menu)return;
    var rows=matchItems(inp.value);
    if(!rows.length){window.PETATOEWarehouseSafeRender.html(menu, '<div class="wh-stock-search-empty">لا توجد أصناف مخزنية مطابقة. حوّل الصنف إلى مخزني من دليل الأصناف أولاً.</div>', 'warehouse-core search empty');}
    else{window.PETATOEWarehouseSafeRender.html(menu, rows.map(function(x,i){return '<button type="button" class="wh-stock-search-option" data-wh-stock-name="'+petatoe_v377_warehouse_search_final_js_esc(x.name)+'" data-wh-stock-index="'+i+'"><span><b>'+petatoe_v377_warehouse_search_final_js_esc(x.name)+'</b><small>'+petatoe_v377_warehouse_search_final_js_esc((x.category||'مخزني')+' - '+(x.unit||'وحدة'))+'</small></span><code>'+petatoe_v377_warehouse_search_final_js_esc(x.code||x.id||'')+'</code></button>'}).join(''), 'warehouse-core search options');}
    if(show)menu.classList.add('show');
  }
  function hideMenu(){var m=byId('whStockSearchMenu');if(m)m.classList.remove('show')}
  function choose(name){var inp=byId('whItem');if(inp){inp.value=name;inp.setCustomValidity('');try{window.PETATOEWarehouses&&window.PETATOEWarehouses.updateAvailableBox&&window.PETATOEWarehouses.updateAvailableBox()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}}hideMenu()}
  function validate(){var inp=byId('whItem');if(!inp)return true;var v=low(inp.value);if(!v){inp.setCustomValidity('');return true}var ok=stockItems().some(function(x){return low(x.name)===v || low(x.code||x.id)===v});inp.setCustomValidity(ok?'':'الصنف غير موجود ضمن الأصناف المخزنية');return ok}
  function bind(){
    var inp=wrapInput(); if(!inp||inp.__v377Bound)return; inp.__v377Bound=true;
    inp.addEventListener('focus',function(){renderMenu(true)},true);
    inp.addEventListener('click',function(){renderMenu(true)},true);
    inp.addEventListener('input',function(){removeNative();renderMenu(true);validate();try{window.PETATOEWarehouses&&window.PETATOEWarehouses.updateAvailableBox&&window.PETATOEWarehouses.updateAvailableBox()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("warehouses/warehouse-core.js",e);}},true);
    inp.addEventListener('change',validate,true);
    inp.addEventListener('keydown',function(e){
      var menu=byId('whStockSearchMenu'); if(!menu)return;
      if(e.key==='Escape'){hideMenu();return}
      if(e.key==='Enter'){
        var first=menu.querySelector('.wh-stock-search-option');
        if(first&&menu.classList.contains('show')){e.preventDefault();choose(first.getAttribute('data-wh-stock-name')||'')}
      }
    },true);
  }
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-stock-menu-mousedown','mousedown',function(e){if(!window.PETATOEWarehousePerf.isActive() && !window.PETATOEWarehousePerf.isWarehouseTarget(e.target)) return;var w=e.target&&e.target.closest&&e.target.closest('.wh-stock-search-wrap');if(!w)hideMenu()},true);
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-stock-menu-click','click',function(e){if(!window.PETATOEWarehousePerf.isActive() && !window.PETATOEWarehousePerf.isWarehouseTarget(e.target)) return;var btn=e.target&&e.target.closest&&e.target.closest('.wh-stock-search-option');if(btn){e.preventDefault();choose(btn.getAttribute('data-wh-stock-name')||'')}},true);
  function bindSaveValidation(){
    if(window.__PETATOE_V377_WAREHOUSE_VALIDATION_BOUND__)return;
    window.__PETATOE_V377_WAREHOUSE_VALIDATION_BOUND__=true;
    window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-stock-menu-before-save','petatoe:warehouse:before-save-movement',function(e){if(!validate()){var inp=byId('whItem');if(inp)inp.focus();alert('اختر صنف مخزني صحيح من القائمة.');e.preventDefault();}});
  }
  function refresh(){removeNative();bind();renderMenu(false);bindSaveValidation()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){window.PETATOEWarehousePerf.runWhenActive('stock-search-menu-startup',refresh,500)});else{window.PETATOEWarehousePerf.runWhenActive('stock-search-menu-startup',refresh,500)}
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-stock-menu-tabchange','petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='warehouses')window.PETATOEWarehousePerf.debounce('stock-search-menu-tabchange',refresh,220)});
  window.PETATOERefreshWarehouseStockSearch=refresh;
})();

/* Extracted script: petatoe-v380-warehouse-alerts-clean-final */
(function(){
  'use strict';
  if(window.__PETATOE_V380_WAREHOUSE_ALERTS_CLEAN_FINAL__) return;
  window.__PETATOE_V380_WAREHOUSE_ALERTS_CLEAN_FINAL__=true;
  var ITEM_KEY='warehouseItems';
  var TX_KEY='warehouseTransactions';
  var LOW_KEY='warehouseLowLimit';
  var DEFAULT_LIMIT=5;
  var STORES=['المخزن الرئيسي','VAN A - AXB 2558','VAN B - SXB 6066'];
  var ALLOWED={'المخزن الرئيسي':1,'VAN A - AXB 2558':1,'VAN B - SXB 6066':1};
  /* v3.11.10: using global byId */
  function petatoe_v380_warehouse_alerts_clean_fina_esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function whInvoiceItemsNorm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
  function low(v){return whInvoiceItemsNorm(v).toLowerCase()}
  function num(v){return window.PETATOENumber?PETATOENumber.num(v):(parseFloat(String(v==null?'':v).replace(/,/g,''))||0)}
  function fmt(v){return window.PETATOENumber?PETATOENumber.qty(v):(function(n){if(Math.abs(n)<0.000001)n=0; return n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})})(num(v))}
  function warehouseAlertsReadArray(key){try{var a=petStorageReadJSON(key,[]);return Array.isArray(a)?a:[]}catch(e){return[]}}
  function petatoe_v380_warehouse_alerts_clean_fina_getItems(){return window.PETATOEWarehouseItems.getAll()}
  function petBlock7434_getTx(){return warehouseAlertsReadArray(TX_KEY)}
  function limit(){var n=num(petStorageGet(LOW_KEY,'')); if(n<=0)n=DEFAULT_LIMIT; return Math.max(0,Math.round(n))}
  function setLimit(v){var n=Math.max(0,Math.round(num(v))); if(n<=0)n=DEFAULT_LIMIT; petStorageSet(LOW_KEY,String(n)); var inp=byId('whLowAlertLimit'); if(inp)inp.value=n; render(); return n}
  function isStockItem(x){return x&&whInvoiceItemsNorm(x.name)&&String(x.status||'active')!=='inactive'&&String(x.type||'service')==='stock'}
  function stockItems(){
    var seen={};
    return petatoe_v380_warehouse_alerts_clean_fina_getItems().filter(isStockItem).filter(function(x){var k=low(x.name); if(!k||seen[k])return false; seen[k]=1; return true;}).sort(function(a,b){return whInvoiceItemsNorm(a.name).localeCompare(whInvoiceItemsNorm(b.name),'ar')});
  }
  function storeName(v,fallback){v=whInvoiceItemsNorm(v); return ALLOWED[v]?v:(fallback||'المخزن الرئيسي')}
  function effect(t,store,item){
    if(low(t.item)!==low(item))return 0;
    var q=num(t.qty), type=String(t.type||''), from=storeName(t.from,'-'), to=storeName(t.to,'المخزن الرئيسي');
    if(type==='in'||type==='adjust_plus') return to===store?q:0;
    if(type==='adjust_minus'||type==='sale_out') return from===store?-q:0;
    if(type==='transfer'||type==='return') return (to===store?q:0)-(from===store?q:0);
    return 0;
  }
  function balance(store,item){var b=0; petBlock7434_getTx().forEach(function(t){b+=effect(t,store,item)}); if(Math.abs(b)<0.000001)b=0; return b}
  function lastMove(store,item){var last=''; petBlock7434_getTx().forEach(function(t){if(low(t.item)!==low(item))return; var f=storeName(t.from,'-'), to=storeName(t.to,'المخزن الرئيسي'); if(f===store||to===store){if(!last||String(t.time||'')>String(last))last=t.time||''}}); return last}
  function rowsAll(){
    var lim=limit(), out=[];
    stockItems().forEach(function(it){STORES.forEach(function(st){var b=balance(st,it.name); if(b<lim){out.push({store:st,code:it.code||it.id||'',item:it.name,balance:b,min:lim,last:lastMove(st,it.name)})}})});
    return out.sort(function(a,b){return num(a.balance)-num(b.balance)||whInvoiceItemsNorm(a.store).localeCompare(whInvoiceItemsNorm(b.store),'ar')||whInvoiceItemsNorm(a.item).localeCompare(whInvoiceItemsNorm(b.item),'ar')});
  }
  function fillStores(){var el=byId('whLowAlertStore'); if(!el)return; var cur=el.value||'all'; el.textContent=''; var all=document.createElement('option'); all.value='all'; all.textContent='كل المخازن'; el.appendChild(all); STORES.forEach(function(st){var opt=document.createElement('option'); opt.value=String(st||''); opt.textContent=String(st||''); el.appendChild(opt)}); el.value=(cur==='all'||ALLOWED[cur])?cur:'all'}
  function render(){
    var body=byId('whLowAlertBody'); if(!body)return;
    fillStores();
    var limInp=byId('whLowAlertLimit'); if(limInp)limInp.value=limit();
    var q=low((byId('whLowAlertSearch')||{}).value), st=(byId('whLowAlertStore')||{}).value||'all', lv=(byId('whLowAlertLevel')||{}).value||'all';
    var rows=rowsAll().filter(function(r){
      if(st!=='all'&&r.store!==st)return false;
      if(lv==='zero'&&num(r.balance)!==0)return false;
      if(lv==='below5'&&!(num(r.balance)>0&&num(r.balance)<limit()))return false;
      if(q&&low(r.store+' '+r.item+' '+r.code).indexOf(q)<0)return false;
      return true;
    });
    window.PETATOEWarehouseSafeRender.html(body, rows.map(function(r,i){var z=num(r.balance)===0; return '<tr><td>'+(i+1)+'</td><td>'+petatoe_v380_warehouse_alerts_clean_fina_esc(r.store)+'</td><td>'+petatoe_v380_warehouse_alerts_clean_fina_esc(r.code||'-')+'</td><td>'+petatoe_v380_warehouse_alerts_clean_fina_esc(r.item)+'</td><td class="'+(z?'wh-low-zero':'wh-low-warn')+'">'+fmt(r.balance)+'</td><td>'+fmt(r.min)+'</td><td>'+petatoe_v380_warehouse_alerts_clean_fina_esc(r.last?new Date(r.last).toLocaleString('ar-EG'):'لا توجد حركة')+'</td><td><span class="wh-status-pill inactive">'+(z?'نفد الرصيد':'أقل من الحد')+'</span></td></tr>'}).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:22px">لا توجد أصناف مخزنية أقل من حد التنبيه الحالي.</td></tr>', 'warehouse-core render');
  }
  function exportCsv(){var data=rowsAll(); var csv=[['المخزن','كود الصنف','الصنف','الرصيد الحالي','حد التنبيه','آخر حركة']].concat(data.map(function(r){return [r.store,r.code,r.item,r.balance,r.min,r.last||'']})).map(function(row){return row.map(function(c){return '"'+String(c==null?'':c).replace(/"/g,'""')+'"'}).join(',')}).join('\n'); var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); a.download='PETATOE_Warehouse_Low_Stock_Alerts.csv'; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href)},700)}
  function bindEvents(){
    if(window.__PETATOE_V380_WAREHOUSE_ALERTS_EVENTS_BOUND__)return;
    window.__PETATOE_V380_WAREHOUSE_ALERTS_EVENTS_BOUND__=true;
    function lowAlertsPanelActive(){try{var p=document.querySelector('#warehouses [data-wh-tab-panel="lowalerts"]');return !!(p&&p.classList.contains('active'));}catch(e){return false;}}
    window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-lowalerts-tabchange','petatoe:warehouse:tabchange',function(e){if(e.detail&&e.detail.tab==='lowalerts')window.PETATOEWarehousePerf.runWhenActive('lowalerts-tab-render',render,120)});
    window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-lowalerts-rendered','petatoe:warehouse:rendered',function(){if(lowAlertsPanelActive())window.PETATOEWarehousePerf.runWhenActive('lowalerts-rendered',render,220)});
    window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-lowalerts-movement','petatoe:warehouse:movement-saved',function(){if(lowAlertsPanelActive())window.PETATOEWarehousePerf.runWhenActive('lowalerts-movement',render,180)});
  }
  function warehouseAlertsInit(){fillStores();render();bindEvents()}
  window.PETATOEWarehouseAlerts={render:render,exportCsv:exportCsv,setLimit:setLimit,refresh:warehouseAlertsInit,getRows:rowsAll};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){window.PETATOEWarehousePerf.runWhenActive('lowalerts-startup',warehouseAlertsInit,500)}); else {window.PETATOEWarehousePerf.runWhenActive('lowalerts-startup',warehouseAlertsInit,500)}
  window.PETATOEWarehousePerf.bindDocumentOnce('warehouse-lowalerts-main-tabchange','petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='warehouses')window.PETATOEWarehousePerf.debounce('lowalerts-tabchange-init',warehouseAlertsInit,300)});
})();
