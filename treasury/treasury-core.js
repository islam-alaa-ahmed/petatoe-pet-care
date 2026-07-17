(function(){
  'use strict';
  if(window.__PETATOE_V38101_TREASURY_SINGLE_SOURCE__) return;
  window.__PETATOE_V38101_TREASURY_SINGLE_SOURCE__ = true;

  var TX_TABLE='treasury_transactions';
  var MASTER_TABLE='treasury_master_data';
  var CAT_ROW_ID='treasury_categories';
  var AUDIT_ROW_ID='treasury_audit';
  var txCache=[];
  var catCache=[];
  var auditCache=[];
  var treasuryLoaded=false;
  var treasuryLoading=false;
  var treasuryLoadPromise=null;
  function repo(){return window.PETATOESupabaseRepository||null}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(_e){return v}}
  function asArray(v){return Array.isArray(v)?v:[]}
  function publishTreasuryStore(){
    window.PETATOETreasuryDataStore={
      transactions:txCache,
      categories:catCache,
      audit:auditCache,
      loaded:treasuryLoaded,
      updatedAt:new Date().toISOString()
    };
    try{document.dispatchEvent(new CustomEvent('petatoe:treasury-data-ready',{detail:{transactions:txCache.length,categories:catCache.length,audit:auditCache.length}}));}catch(_e){}
  }
  function normalizeTxRow(row){
    row=row||{};
    var data=row&&row.data&&typeof row.data==='object'?clone(row.data):{};
    if((!data||Object.keys(data).length===0) && row.legacy_payload&&typeof row.legacy_payload==='object') data=clone(row.legacy_payload);
    data=data&&typeof data==='object'?data:{};
    data.supabase_id=row.id||data.supabase_id||'';
    data.id=data.id||row.legacy_id||'';
    data.type=data.type||String(row.tx_type||row.transaction_type||'');
    if(row.amount!=null)data.amount=num(row.amount);
    if(row.category&&!data.category)data.category=row.category;
    if(row.payment_method&&!data.method)data.method=row.payment_method;
    if(row.description&&!data.notes)data.notes=row.description;
    if(row.tx_date&&!data.date)data.date=row.tx_date;
    if(row.transaction_date&&!data.date)data.date=row.transaction_date;
    if(row.created_at&&!data.time)data.time=row.created_at;
    return data;
  }
  async function loadTreasuryFromSupabase(force){
    if(treasuryLoaded&&!force)return true;
    if(treasuryLoading&&treasuryLoadPromise)return treasuryLoadPromise;
    treasuryLoading=true;
    treasuryLoadPromise=(async function(){
      var r=repo();
      if(!r||!r.hasClient||!r.hasClient()){treasuryLoading=false;publishTreasuryStore();return false;}
      try{
        var c=window.supabase||window.PETATOE_SUPABASE_CLIENT||null;
        var rows=[];
        if(c&&typeof c.from==='function'){
          var txRes=await c.from(TX_TABLE).select('*').order('created_at',{ascending:true});
          if(txRes.error) throw new Error(txRes.error.message||JSON.stringify(txRes.error));
          rows=Array.isArray(txRes.data)?txRes.data:[];
        }else{
          rows=await r.listJsonRows(TX_TABLE,{order:'created_at',ascending:true});
        }
        txCache=asArray(rows).map(normalizeTxRow).filter(function(x){return x&&x.id});
        var cats=await r.getSingleton(MASTER_TABLE,CAT_ROW_ID,{items:[]});
        catCache=Array.from(new Set(asArray(cats.items||cats.categories||cats).map(clean).filter(Boolean)));
        var audit=await r.getSingleton(MASTER_TABLE,AUDIT_ROW_ID,{items:[]});
        auditCache=asArray(audit.items||audit.audit||audit).filter(function(x){return x&&typeof x==='object'});
        treasuryLoaded=true;
        publishTreasuryStore();
        return true;
      }catch(e){
        window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('treasury/treasury-core.js',e);
        publishTreasuryStore();
        return false;
      }finally{treasuryLoading=false;}
    })();
    return treasuryLoadPromise;
  }
  async function saveTxToSupabase(tx){
    var c=window.supabase||window.PETATOE_SUPABASE_CLIENT||null;
    if(!c||typeof c.from!=='function')return {ok:false,error:'Supabase client not ready'};
    var d=clone(tx||{});
    var legacyId=clean(d.id||d.legacy_id);
    if(!legacyId)return {ok:false,error:'Missing treasury transaction id'};
    d.id=legacyId;
    var payload={
      legacy_id:legacyId,
      data:d,
      legacy_payload:d,
      tx_date:clean(d.time||d.date).slice(0,10)||null,
      transaction_date:clean(d.time||d.date).slice(0,10)||null,
      tx_type:clean(d.type),
      transaction_type:clean(d.type),
      category:clean(d.category||''),
      amount:num(d.amount),
      payment_method:clean(d.method||''),
      description:clean(d.notes||d.ref||''),
      status:'active',
      updated_at:new Date().toISOString()
    };
    var res=await c.from(TX_TABLE).upsert(payload,{onConflict:'legacy_id'});
    if(res.error){console.warn('PETATOE Treasury upsert failed',res.error.message||res.error);return {ok:false,error:res.error.message||JSON.stringify(res.error)}}
    return {ok:true,data:res.data};
  }
  async function deleteTxFromSupabase(id){
    var c=window.supabase||window.PETATOE_SUPABASE_CLIENT||null;
    if(!id)return {ok:false,error:'Missing id'};
    if(!c||typeof c.from!=='function')return {ok:false,error:'Supabase client not ready'};
    var res=await c.from(TX_TABLE).delete().eq('legacy_id',String(id));
    if(res.error){console.warn('PETATOE Treasury delete failed',res.error.message||res.error);return {ok:false,error:res.error.message||JSON.stringify(res.error)}}
    return {ok:true,data:res.data};
  }
  async function saveCatsToSupabase(){var r=repo();return (r&&r.saveSingleton)?r.saveSingleton(MASTER_TABLE,CAT_ROW_ID,{items:catCache,updatedAt:new Date().toISOString()}):{ok:false,error:'Supabase repository not ready'}}
  async function saveAuditToSupabase(){var r=repo();return (r&&r.saveSingleton)?r.saveSingleton(MASTER_TABLE,AUDIT_ROW_ID,{items:auditCache.slice(-2000),updatedAt:new Date().toISOString()}):{ok:false,error:'Supabase repository not ready'}}
  var OWNER='الخزنة الرئيسية للمالك';
  var METHODS=['نقداً','تحويل بنكي','إيداع بنكي','شيك','بطاقة بنكية','أخرى'];
  var activeStatementVault='';
  var rendering=false;

  function byId(id){return document.getElementById(id)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function clean(v){return String(v==null?'':v).trim()}
  function esc(v){return window.PETATOESecurity?PETATOESecurity.escapeHtml(clean(v)):clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function num(v){return window.PETATOENumber?PETATOENumber.num(v):(parseFloat(String(v==null?'':v).replace(/[^0-9.\-]/g,''))||0)}
  function visibleNum(v){var n=num(v); if(Math.abs(n)<0.005)n=0; return n}
  function availNum(v){var n=visibleNum(v); return n<0?0:n}
  function fmt(v){return window.PETATOENumber?PETATOENumber.money(v,'SAR'):((Number(v)||0).toFixed(2)+' SAR')}
  function fmtAvail(v){return fmt(availNum(v))}

  function treasurySafeHtml(target, html, reason){
    try{
      if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function'){
        return window.PETATOESafeRender.htmlTrusted(target, html, reason || 'treasury trusted template');
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("treasury/treasury-core.js",e);}
    try{ if(target){ target.textContent=''; target.insertAdjacentHTML('beforeend', String(html==null?'':html)); return true; } }catch(e2){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("treasury/treasury-core.js",e2);}
    return false;
  }
  window.PETATOETreasurySafeRender = window.PETATOETreasurySafeRender || { html: treasurySafeHtml };
  function toastMsg(msg){try{if(typeof toast==='function')toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function now(){return new Date().toISOString()}
  function todayId(prefix){return prefix+'-'+Date.now()+'-'+Math.random().toString(16).slice(2,7)}
  function getTx(){return txCache}
  function setTx(a){txCache=asArray(a);publishTreasuryStore()}
  function getCats(){return catCache}
  function setCats(a){catCache=Array.from(new Set((a||[]).map(clean).filter(Boolean)));publishTreasuryStore();saveCatsToSupabase()}
  function addAudit(action,before,after,reason){
    auditCache.push({id:todayId('AUD'),time:now(),user:(function(){try{return window.PETATOEDataSource.getCurrentUserName('مستخدم النظام')}catch(e){return 'مستخدم النظام'}})(),action:action,before:before||null,after:after||null,reason:reason||''});
    auditCache=auditCache.slice(-2000);
    publishTreasuryStore();
    saveAuditToSupabase();
  }

  function dataRows(){
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync==='function'){
        var arr=window.PETATOEDataSource.getRecordsSync();
        return Array.isArray(arr)?arr:[];
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("treasury/treasury-core.js",e);}
    return [];
  }
  function val(r,keys){for(var i=0;i<keys.length;i++){if(r && r[keys[i]]!=null && clean(r[keys[i]])!=='')return r[keys[i]]}return ''}
  function rowVehicle(r){return clean(val(r,['van','vehicle','car','truck','السيارة','العربة']))}
  function rowPay(r){return clean(val(r,['pay','payment','paymentMethod','payMethod','طريقة الدفع','طريقة السداد']))}
  function rowClient(r){return clean(val(r,['client','customer','customerName','العميل']))||'عميل'}
  function rowInvoice(r){return clean(val(r,['invoice','invoiceNo','invoiceNumber','رقم الفاتورة','فاتورة']))}
  function rowDate(r){var d=val(r,['date','invoiceDate','التاريخ']); try{if(typeof parseDate==='function'){var x=parseDate(d); if(x&&!isNaN(x))return x}}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("treasury/treasury-core.js",e);} var dt=new Date(d); return isNaN(dt)?null:dt}
  function dateIso(d){if(!d)return '';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function rowAmount(r){var a=val(r,['totalInc','totalWithVat','gross','total','amount','الإجمالي','الاجمالي']); var n=num(a); return n}
  function isReturnRow(r){var txt=[rowInvoice(r),val(r,['item','service','desc','description']),rowAmount(r)].join(' ').toLowerCase();return rowAmount(r)<0 || /مرتجع|استرجاع|رجيع|return|refund|credit/.test(txt)}
  function isCash(p){p=clean(p).toLowerCase();return !!p && (/نقد|كاش|cash/.test(p))}

  function rawVehicleList(){
    var s={};
    dataRows().forEach(function(r){var v=rowVehicle(r); if(v)s[v]=1});
    getTx().forEach(function(t){var v=clean(t.vehicle||t.source); if(v && v!==OWNER)s[v]=1});
    return Object.keys(s).filter(Boolean).sort();
  }
  function currentTreasuryUser(){
    try{if(window.PETATOEPermissionEngine&&typeof window.PETATOEPermissionEngine.currentUser==='function')return window.PETATOEPermissionEngine.currentUser();}catch(_e){}
    try{if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function')return window.PETATOEAuth.currentUser();}catch(_e2){}
    try{return window.__PETATOE_ACTIVE_USER__||window.currentUser||'';}catch(_e3){return ''}
  }
  function normVehicleKey(v){return clean(v).toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,' ')}
  function scopeVehicleKeys(){
    try{
      if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.getVehicleScope==='function'){
        var sc=window.PETATOEPermissions.getVehicleScope(currentTreasuryUser())||{};
        return {allVehicles:!!sc.allVehicles,vehicles:Array.isArray(sc.vehicles)?sc.vehicles.map(clean).filter(Boolean):[]};
      }
    }catch(_e){}
    return {allVehicles:false,vehicles:[]};
  }
  function masterVehicles(){
    var out=[];
    function pushAll(arr){if(Array.isArray(arr))arr.forEach(function(v){if(v)out.push(v)});}
    try{if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.getVehicleList==='function')pushAll(window.PETATOEPermissions.getVehicleList()||[]);}catch(_e){}
    try{if(window.PETATOEReferenceRegistry&&typeof window.PETATOEReferenceRegistry.getVehicles==='function')pushAll(window.PETATOEReferenceRegistry.getVehicles()||[]);}catch(_e2){}
    try{if(window.PETATOESetup&&typeof window.PETATOESetup.masterData==='function'){var md=window.PETATOESetup.masterData(false)||{};pushAll(md.cars||[]);}}catch(_e3){}
    var seen={};
    return out.filter(function(v){var k=normVehicleKey(v&&typeof v==='object'?(v.name||v.vehicle||v.car||v.plate||v.id):v);if(!k||seen[k])return false;seen[k]=1;return true;});
  }
  function vehicleAliases(v){
    var a=[];
    if(v&&typeof v==='object'){a.push(v.id,v.vehicle,v.name,v.car,v.plate,v.code,v.meta)}
    else a.push(v);
    return a.map(clean).filter(Boolean);
  }
  function sameVehicle(a,b){
    var aa=vehicleAliases(a).map(normVehicleKey), bb=vehicleAliases(b).map(normVehicleKey);
    return aa.some(function(x){return x&&bb.indexOf(x)>-1});
  }
  function resolvedVehicleName(token){
    token=clean(token); if(!token)return '';
    var masters=masterVehicles();
    var found=masters.find(function(m){return sameVehicle(token,m)});
    if(found)return clean(found.name||found.vehicle||found.car||found.plate||found.id||token);
    // Never expose internal setup ids to users; if unresolved, ignore the token instead of rendering auto_cars_* as a vault.
    if(/^auto[_-]?cars[_-]/i.test(token))return '';
    return token;
  }
  function scopedVehicleNames(){
    var sc=scopeVehicleKeys(), masters=masterVehicles(), out=[], seen={};
    function add(v){v=resolvedVehicleName(v);var k=normVehicleKey(v);if(v&&k&&!seen[k]){seen[k]=1;out.push(v)}}
    if(sc.allVehicles){
      masters.forEach(function(m){add(m.name||m.vehicle||m.car||m.plate||m.id)});
      rawVehicleList().forEach(add);
      return out.sort();
    }
    sc.vehicles.forEach(add);
    return out.sort();
  }
  function canScreen(screen,action){
    try{if(window.PETATOEPermissionEngine&&typeof window.PETATOEPermissionEngine.can==='function')return !!window.PETATOEPermissionEngine.can(currentTreasuryUser(),screen,action||'view');}catch(_e){}
    try{if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.can==='function')return !!window.PETATOEPermissions.can(currentTreasuryUser(),screen,action||'view');}catch(_e2){}
    return false;
  }
  function canSpecial(key){
    try{if(window.PETATOEPermissionEngine&&typeof window.PETATOEPermissionEngine.canSpecial==='function')return !!window.PETATOEPermissionEngine.canSpecial(currentTreasuryUser(),key);}catch(_e){}
    try{if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.canSpecial==='function')return !!window.PETATOEPermissions.canSpecial(currentTreasuryUser(),key);}catch(_e2){}
    return false;
  }
  function canAccessVehicle(v){
    if(!canScreen('treasury','view')||!clean(v))return false;
    try{if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.canAccessVehicle==='function'&&window.PETATOEPermissions.canAccessVehicle(currentTreasuryUser(),v))return true;}catch(_e){}
    var sc=scopeVehicleKeys();
    if(sc.allVehicles)return true;
    if(!sc.vehicles.length)return false;
    var masters=masterVehicles();
    return sc.vehicles.some(function(token){
      if(sameVehicle(token,v))return true;
      var m=masters.find(function(x){return sameVehicle(token,x)});
      return !!(m&&sameVehicle(v,m));
    });
  }
  function canAccessOwnerVault(){
    if(!canScreen('treasury','view'))return false;
    try{
      if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.getVehicleScope==='function'){
        var sc=window.PETATOEPermissions.getVehicleScope(currentTreasuryUser())||{};
        return !!sc.allVehicles;
      }
    }catch(_e){}
    return false;
  }
  function canAccessVault(src){src=clean(src)||OWNER;return src===OWNER?canAccessOwnerVault():canAccessVehicle(src)}
  function vehicleList(){
    var seen={}, out=[];
    function add(v){v=clean(v);var k=normVehicleKey(v);if(v&&k&&!seen[k]&&canAccessVehicle(v)){seen[k]=1;out.push(v)}}
    // Phase 21: the allowed vehicle vaults must come from vehicleScope, not only from existing cash rows/transactions.
    // This lets a linked Driver/Groomer see the vehicle vault even when the current balance is 0.00 SAR.
    scopedVehicleNames().forEach(add);
    rawVehicleList().forEach(add);
    return out.sort();
  }
  function cashRows(){return dataRows().filter(function(r){var v=rowVehicle(r);return v && canAccessVehicle(v) && isCash(rowPay(r))})}
  function txRows(){return getTx().filter(function(t){
    if(!t)return false;
    if(t.type==='handover')return canAccessVehicle(t.vehicle)||canAccessOwnerVault();
    if(t.type==='expense'){var src=clean(t.source||t.vehicle||OWNER);return canAccessVault(src);}
    var v=clean(t.vehicle||t.source);return v?canAccessVault(v):canAccessOwnerVault();
  })}
  function cashByVehicle(){var m={};cashRows().forEach(function(r){var v=rowVehicle(r), a=rowAmount(r);m[v]=(m[v]||0)+a});return m}
  function vehicleDelivered(ignoreId){var m={};txRows().forEach(function(t){if(clean(t.id)===clean(ignoreId))return; if(t&&t.type==='handover'){var v=clean(t.vehicle);m[v]=(m[v]||0)+num(t.amount)}});return m}
  function expenseBySource(ignoreId){var m={};txRows().forEach(function(t){if(clean(t.id)===clean(ignoreId))return; if(t&&t.type==='expense'){var src=clean(t.source||t.vehicle||OWNER);m[src]=(m[src]||0)+num(t.amount)}});return m}
  function vehicleBalanceRaw(v,ignoreId){v=resolvedVehicleName(v)||v;var c=cashByVehicle(),d=vehicleDelivered(ignoreId),e=expenseBySource(ignoreId);return (c[v]||0)-(d[v]||0)-(e[v]||0)}
  function vehicleBalance(v,ignoreId){return availNum(vehicleBalanceRaw(v,ignoreId))}
  function mainReceived(ignoreId){return txRows().reduce(function(s,t){return s+((t&&t.type==='handover'&&clean(t.id)!==clean(ignoreId))?num(t.amount):0)},0)}
  function mainSpent(ignoreId){return txRows().reduce(function(s,t){return s+((t&&t.type==='expense'&&clean(t.id)!==clean(ignoreId)&&clean(t.source||OWNER)===OWNER)?num(t.amount):0)},0)}
  function mainBalanceRaw(ignoreId){return mainReceived(ignoreId)-mainSpent(ignoreId)}
  function mainBalance(ignoreId){return availNum(mainBalanceRaw(ignoreId))}
  function vaultBalance(src,ignoreId){src=clean(src)||OWNER;return src===OWNER?mainBalance(ignoreId):vehicleBalance(src,ignoreId)}

  function setOptions(sel,vals,placeholder,prefer){
    if(!sel)return;
    var old=clean(sel.value);
    sel.textContent='';
    if(placeholder){var ph=document.createElement('option');ph.value='';ph.textContent=clean(placeholder);sel.appendChild(ph);}
    vals.forEach(function(v){var opt=document.createElement('option');opt.value=clean(v);opt.textContent=clean(v);sel.appendChild(opt);});
    if(old && vals.indexOf(old)>-1) sel.value=old;
    else if(prefer && vals.indexOf(prefer)>-1) sel.value=prefer;
    else if(!placeholder && vals.length) sel.value=vals[0];
  }
  function ensureStatementSelector(){
    var card=byId('treasuryStatementCard'); if(!card)return;
    var selects=qa('select[id="trStatementVaultSelectV82"]',card);
    if(selects.length>1){
      var keep=selects[0];
      selects.slice(1).forEach(function(sel){
        var row=sel.closest && sel.closest('.tr-statement-vault-row-v82');
        if(row && row.parentNode) row.parentNode.removeChild(row);
        else if(sel.parentNode) sel.parentNode.removeChild(sel);
      });
      keep.id='trStatementVaultSelectV82';
      return;
    }
    if(selects.length===1){
      var k=selects[0], row=k.closest&&k.closest('.tr-statement-vault-row-v82');
      if(row) return;
      var wrap=document.createElement('div'); wrap.className='tr-statement-vault-row-v82';
      var left=document.createElement('div'); var label=document.createElement('label'); label.textContent='اختر الخزنة'; left.appendChild(label);
      var right=document.createElement('div'); wrap.appendChild(left); wrap.appendChild(right);
      left.appendChild(k);
      var head=card.querySelector('.tr-statement-head');
      if(head&&head.nextSibling)card.insertBefore(wrap,head.nextSibling); else card.insertBefore(wrap,card.firstChild);
      return;
    }
    var row2=document.createElement('div'); row2.className='tr-statement-vault-row-v82';
    var left2=document.createElement('div'); var label2=document.createElement('label'); label2.textContent='اختر الخزنة'; var select2=document.createElement('select'); select2.id='trStatementVaultSelectV82'; var opt2=document.createElement('option'); opt2.value=''; opt2.textContent='اختر الخزنة لعرض كشف الحساب'; select2.appendChild(opt2); left2.appendChild(label2); left2.appendChild(select2); row2.appendChild(left2); row2.appendChild(document.createElement('div'));
    var head2=card.querySelector('.tr-statement-head'); if(head2&&head2.nextSibling)card.insertBefore(row2,head2.nextSibling); else card.insertBefore(row2,card.firstChild);
  }
  function fillSelects(){
    var vs=vehicleList();
    setOptions(byId('trVehicle'),vs,vs.length?'':'لا توجد سيارات',clean((byId('trVehicle')||{}).value)||vs[0]);
    setOptions(byId('trMethod'),METHODS,'',clean((byId('trMethod')||{}).value)||METHODS[0]);
    setOptions(byId('trFilterVehicle'),vs,'كل السيارات',clean((byId('trFilterVehicle')||{}).value));
    var vaults=(canAccessOwnerVault()?[OWNER]:[]).concat(vs);
    setOptions(byId('trExpenseSource'),vaults,'',clean((byId('trExpenseSource')||{}).value)||vaults[0]||'');
    ensureStatementSelector();
    setOptions(byId('trStatementVaultSelectV82'),vaults,'اختر الخزنة لعرض كشف الحساب',activeStatementVault||clean((byId('trStatementVaultSelectV82')||{}).value));
    var dl=byId('trExpenseCategoryList'); if(dl){dl.textContent='';getCats().forEach(function(c){var opt=document.createElement('option');opt.value=clean(c);dl.appendChild(opt);});}
  }
  function updateBalanceBoxes(){
    var v=clean((byId('trVehicle')||{}).value), b=byId('trVehicleBalanceBox');
    if(b)treasurySafeHtml(b,'الرصيد المتاح في '+esc(v||'-')+'<b>'+fmtAvail(v?vaultBalance(v):0)+'</b>','treasury balance hint');
    var src=clean((byId('trExpenseSource')||{}).value)||OWNER, ex=byId('trExpenseBalanceBox');
    if(ex)treasurySafeHtml(ex,'الرصيد المتاح في '+esc(src)+'<b>'+fmtAvail(vaultBalance(src))+'</b>','treasury expense balance hint');
    qa('#treasury b,#treasury strong,#treasury td,#treasury span').forEach(function(el){if(el.children.length)return;var t=el.textContent||'';if(t.indexOf('-0.00')>-1)el.textContent=t.replace(/-0\.00/g,'0.00')});
  }
  function renderKpis(){
    var el=byId('treasuryKpis'); if(!el)return;
    var vs=vehicleList(); var totalCars=vs.reduce(function(s,v){return s+vehicleBalance(v)},0);
    var today=dateIso(new Date());
    var todayCash=cashRows().filter(function(r){var d=rowDate(r);return d&&dateIso(d)===today}).reduce(function(s,r){return s+rowAmount(r)},0);
    var todayHand=txRows().filter(function(t){return t.type==='handover'&&clean(t.time).slice(0,10)===today}).reduce(function(s,t){return s+num(t.amount)},0);
    treasurySafeHtml(el,'<div class="tr-kpi" style="--accent:var(--green)"><span>إجمالي خزائن السيارات</span><b>'+fmtAvail(totalCars)+'</b><small>رصيد كاش متاح</small></div><div class="tr-kpi" style="--accent:var(--blue)"><span>الخزنة الرئيسية (المالك)</span><b>'+fmtAvail(mainBalance())+'</b><small>بعد خصم المصروفات</small></div><div class="tr-kpi" style="--accent:var(--yellow)"><span>تحصيلات اليوم النقدية</span><b>'+fmt(todayCash)+'</b><small>من فواتير نقدية بتاريخ اليوم</small></div><div class="tr-kpi" style="--accent:var(--purple)"><span>تسليمات اليوم</span><b>'+fmt(todayHand)+'</b><small>تحويل للخزنة الرئيسية</small></div>','treasury dashboard kpis');
  }
  function renderVaults(){
    var owner=byId('treasuryOwnerVaultCard');
    if(owner){
      if(canAccessOwnerVault()){owner.style.display='';treasurySafeHtml(owner,'<div class="tr-owner-card"><button type="button" class="vico tr-statement-open" data-vault="'+esc(OWNER)+'" title="كشف حساب الخزنة الرئيسية">🏦</button><div class="tr-owner-content"><span class="tr-owner-title">الخزنة الرئيسية للمالك</span><div class="tr-owner-metrics"><div class="tr-owner-metric"><span>إجمالي المستلم</span><b>'+fmt(mainReceived())+'</b></div><div class="tr-owner-metric"><span>إجمالي المصروف</span><b>'+fmt(mainSpent())+'</b></div><div class="tr-owner-metric"><span>الرصيد الحالي</span><b>'+fmtAvail(mainBalance())+'</b></div></div></div></div>','treasury owner card');}
      else{owner.style.setProperty('display','none','important');}
    }
    var box=byId('treasuryVaultCards'); if(!box)return;
    var vs=vehicleList(), c=cashByVehicle();
    treasurySafeHtml(box,vs.length?vs.map(function(v){return '<div class="tr-vault"><div><b>'+esc(v)+'</b><span>تحصيل نقدي: '+fmt(c[v]||0)+'</span><strong>'+fmtAvail(vehicleBalance(v))+'</strong></div><button type="button" class="vico tr-statement-open" data-vault="'+esc(v)+'" title="كشف حساب '+esc(v)+'">🚐</button></div>'}).join(''):'<div class="tr-note">لا توجد سيارات مصرح بها لهذا المستخدم.</div>','treasury vehicle balances');
  }
  function allMovements(){
    var list=[];
    cashRows().forEach(function(r){var d=rowDate(r),v=rowVehicle(r);list.push({type:'cash',id:'INV-'+rowInvoice(r),time:d?d.toISOString():'',date:d?dateIso(d):'',vehicle:v,from:rowClient(r),to:'خزنة السيارة',amount:rowAmount(r),person:'-',ref:rowInvoice(r)||'-',notes:isReturnRow(r)?'مرتجع / تسوية فاتورة':'تحصيل نقدي من فاتورة',locked:true});});
    txRows().forEach(function(t){if(!t)return; if(t.type==='expense'){var src=clean(t.source||t.vehicle||OWNER);list.push({type:'expense',id:t.id,time:t.time||'',date:clean(t.time).slice(0,10),vehicle:src,from:src,to:t.category||'مصروف',amount:num(t.amount),person:t.receiver||'-',ref:t.ref||t.id,notes:t.notes||'',locked:false});} else if(t.type==='handover'){list.push({type:'handover',id:t.id,time:t.time||'',date:clean(t.time).slice(0,10),vehicle:t.vehicle||'-',from:'خزنة '+(t.vehicle||'-'),to:OWNER,amount:num(t.amount),person:t.receiver||'-',ref:t.id,notes:t.notes||t.method||'',locked:false});}});
    return list.sort(function(a,b){return clean(b.time||b.date).localeCompare(clean(a.time||a.date))});
  }
  function typeLabel(t){return t==='cash'?'تحصيل كاش':(t==='expense'?'صرف / تحويل':'تسليم كاش')}
  function typeClass(t){return t==='cash'?'cash':(t==='expense'?'expense':'handover')}
  function renderTable(){
    var body=byId('treasuryMovementBody'); if(!body)return;
    var table=body.closest('table'); if(table&&table.tHead&&table.tHead.rows[0]){var hr=table.tHead.rows[0]; if(hr.children.length<11){var th=document.createElement('th'); th.textContent='إجراءات'; hr.appendChild(th);}}
    var q=clean((byId('trSearch')||{}).value).toLowerCase(); var fv=clean((byId('trFilterVehicle')||{}).value); var ft=clean((byId('trFilterType')||{}).value)||'all';
    var rows=allMovements().filter(function(x){var txt=[x.vehicle,x.person,x.from,x.to,x.ref,x.notes,typeLabel(x.type)].join(' ').toLowerCase();return (!fv||x.vehicle===fv)&&(ft==='all'||x.type===ft)&&(!q||txt.indexOf(q)>-1)}).slice(0,500);
    treasurySafeHtml(body,rows.length?rows.map(function(x,i){var actions=x.locked?'<span style="color:var(--muted);font-weight:900">فاتورة</span>':'<div class="tr-move-actions"><button type="button" class="tr-mini-btn real-edit" data-tr-edit="'+esc(x.id)+'">تعديل</button><button type="button" class="tr-mini-btn real-delete danger" data-tr-delete="'+esc(x.id)+'">حذف</button></div>';return '<tr><td>'+(i+1)+'</td><td>'+esc(x.time?new Date(x.time).toLocaleString('ar-EG'):(x.date||'-'))+'</td><td><span class="tr-badge '+typeClass(x.type)+'">'+typeLabel(x.type)+'</span></td><td>'+esc(x.vehicle)+'</td><td>'+esc(x.from)+'</td><td>'+esc(x.to)+'</td><td style="direction:ltr;font-weight:950">'+fmt(x.amount)+'</td><td>'+esc(x.person)+'</td><td>'+esc(x.ref)+'</td><td>'+esc(x.notes)+'</td><td class="tr-actions-cell">'+actions+'</td></tr>'}).join(''):'<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:22px">لا توجد حركات مطابقة.</td></tr>','treasury movement log');
  }
  function statementRows(src){
    src=clean(src); if(!src)return [];
    var rows=[];
    cashRows().forEach(function(r){var v=rowVehicle(r); if(src!==v)return; var d=rowDate(r), amt=rowAmount(r); rows.push({time:d?d.toISOString():'',kind:'وارد تحصيل كاش',from:rowClient(r),to:'خزنة '+v,inAmt:amt>0?amt:0,outAmt:amt<0?Math.abs(amt):0,person:'-',ref:rowInvoice(r)||'-',notes:isReturnRow(r)?'مرتجع / تسوية فاتورة':'تحصيل نقدي من فاتورة'});});
    txRows().forEach(function(t){if(!t)return; var a=num(t.amount); if(src===OWNER){if(t.type==='handover')rows.push({time:t.time||'',kind:'وارد من سيارة',from:'خزنة '+(t.vehicle||'-'),to:OWNER,inAmt:a,outAmt:0,person:t.receiver||'-',ref:t.id||'-',notes:t.notes||t.method||''}); if(t.type==='expense'&&clean(t.source||OWNER)===OWNER)rows.push({time:t.time||'',kind:'منصرف',from:OWNER,to:t.category||'مصروف',inAmt:0,outAmt:a,person:t.receiver||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}else{if(t.type==='handover'&&clean(t.vehicle)===src)rows.push({time:t.time||'',kind:'منصرف تسليم',from:'خزنة '+src,to:OWNER,inAmt:0,outAmt:a,person:t.receiver||'-',ref:t.id||'-',notes:t.notes||t.method||''}); if(t.type==='expense'&&(clean(t.source)===src||clean(t.vehicle)===src))rows.push({time:t.time||'',kind:'منصرف',from:src,to:t.category||'مصروف',inAmt:0,outAmt:a,person:t.receiver||'-',ref:t.ref||t.id||'-',notes:t.notes||''});}});
    rows.sort(function(a,b){return clean(a.time).localeCompare(clean(b.time))});
    var bal=0; rows.forEach(function(r){bal+=num(r.inAmt)-num(r.outAmt); if(Math.abs(bal)<0.005)bal=0; r.balance=bal<0?0:bal;});
    return rows.reverse();
  }
  function renderStatement(){
    var body=byId('trStatementBody'),title=byId('trStatementTitle'),sub=byId('trStatementSub'),kpis=byId('trStatementKpis'); if(!body)return;
    var src=activeStatementVault||clean((byId('trStatementVaultSelectV82')||{}).value);
    if(!src){treasurySafeHtml(body,'<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:22px">اختر الخزنة لعرض كشف الحساب.</td></tr>','treasury statement empty'); if(kpis)treasurySafeHtml(kpis,'','treasury statement kpis clear'); return;}
    if(!canAccessVault(src)){treasurySafeHtml(body,'<tr><td colspan="11" style="text-align:center;color:var(--danger);padding:22px">غير متاح للصلاحية الحالية.</td></tr>','treasury statement denied'); if(kpis)treasurySafeHtml(kpis,'','treasury statement kpis denied'); return;}
    if(title)title.textContent='📒 كشف حساب: '+src; if(sub)sub.textContent='حركات تفصيلية للوارد والمنصرف والرصيد بعد كل حركة.';
    var from=clean((byId('trStatementFrom')||{}).value),to=clean((byId('trStatementTo')||{}).value),q=clean((byId('trStatementSearch')||{}).value).toLowerCase();
    var rows=statementRows(src).filter(function(r){var iso=clean(r.time).slice(0,10),txt=[r.kind,r.from,r.to,r.person,r.ref,r.notes].join(' ').toLowerCase();return (!from||iso>=from)&&(!to||iso<=to)&&(!q||txt.indexOf(q)>-1)});
    var tin=rows.reduce(function(s,r){return s+num(r.inAmt)},0),tout=rows.reduce(function(s,r){return s+num(r.outAmt)},0);
    if(kpis)treasurySafeHtml(kpis,'<div class="tr-statement-kpi"><span>عدد الحركات</span><b>'+rows.length+'</b></div><div class="tr-statement-kpi"><span>إجمالي الوارد</span><b>'+fmt(tin)+'</b></div><div class="tr-statement-kpi"><span>إجمالي المنصرف</span><b>'+fmt(tout)+'</b></div><div class="tr-statement-kpi"><span>الرصيد الحالي</span><b>'+fmtAvail(vaultBalance(src))+'</b></div>','treasury statement kpis');
    treasurySafeHtml(body,rows.length?rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.time?new Date(r.time).toLocaleString('ar-EG'):'-')+'</td><td>'+esc(r.kind)+'</td><td>'+esc(r.from)+'</td><td>'+esc(r.to)+'</td><td class="tr-in">'+(r.inAmt?fmt(r.inAmt):'-')+'</td><td class="tr-out">'+(r.outAmt?fmt(r.outAmt):'-')+'</td><td style="direction:ltr;font-weight:950">'+fmtAvail(r.balance)+'</td><td>'+esc(r.person)+'</td><td>'+esc(r.ref)+'</td><td>'+esc(r.notes)+'</td></tr>'}).join(''):'<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:22px">لا توجد حركات مطابقة لكشف الحساب.</td></tr>','treasury statement rows');
  }
  function openStatement(src){src=clean(src)||OWNER;if(!canAccessVault(src))return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('غير متاح للصلاحية الحالية'):'غير متاح للصلاحية الحالية');activeStatementVault=src;ensureStatementSelector();var sel=byId('trStatementVaultSelectV82');if(sel)sel.value=activeStatementVault;try{window.PETATOETreasuryTabsV82&&window.PETATOETreasuryTabsV82.open&&window.PETATOETreasuryTabsV82.open('statement')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("treasury/treasury-core.js",e);}var c=byId('treasuryStatementCard');if(c)c.classList.add('show');renderStatement();}
  function closeStatement(){activeStatementVault='';var c=byId('treasuryStatementCard');if(c)c.classList.remove('show')}
  function clearStatementFilters(){['trStatementFrom','trStatementTo','trStatementSearch'].forEach(function(id){var e=byId(id);if(e)e.value=''});renderStatement()}
  function clearForm(){['trAmount','trReceiver','trNotes'].forEach(function(id){var e=byId(id);if(e)e.value=''});fillSelects();updateBalanceBoxes()}
  function clearExpenseForm(){['trExpenseCategory','trExpenseAmount','trExpenseReceiver','trExpenseRef','trExpenseNotes'].forEach(function(id){var e=byId(id);if(e)e.value=''});fillSelects();updateBalanceBoxes()}
  function resetFilters(){['trSearch','trFilterVehicle'].forEach(function(id){var e=byId(id);if(e)e.value=''});var t=byId('trFilterType');if(t)t.value='all';renderAll()}
  async function handover(){
    fillSelects(); var v=clean((byId('trVehicle')||{}).value), amt=num((byId('trAmount')||{}).value), rec=clean((byId('trReceiver')||{}).value), method=clean((byId('trMethod')||{}).value)||METHODS[0], notes=clean((byId('trNotes')||{}).value);
    if(!v)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اختر السيارة أولاً'):'اختر السيارة أولاً'); if(amt<=0)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اكتب مبلغ صحيح أكبر من صفر'):'اكتب مبلغ صحيح أكبر من صفر'); if(!rec)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اكتب اسم المسؤول المستلم'):'اكتب اسم المسؤول المستلم'); if(amt>vehicleBalance(v)+0.0001)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المبلغ أكبر من رصيد خزنة السيارة المتاح'):'المبلغ أكبر من رصيد خزنة السيارة المتاح');
    var tx={id:todayId('TR'),type:'handover',vehicle:v,amount:amt,receiver:rec,method:method,notes:notes,time:now()}; var saved=await saveTxToSupabase(tx); if(!saved.ok)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('فشل حفظ حركة الخزينة في Supabase: '):'فشل حفظ حركة الخزينة في Supabase: '+(saved.error||'')); var a=getTx();a.push(tx);setTx(a);addAudit('تسليم كاش',null,tx,'إنشاء حركة تسليم');clearForm();renderAll();toastMsg('تم تسليم الكاش وتحويله للخزنة الرئيسية');
  }
  async function expense(){
    fillSelects(); var src=clean((byId('trExpenseSource')||{}).value)||OWNER, cat=clean((byId('trExpenseCategory')||{}).value), amt=num((byId('trExpenseAmount')||{}).value), rec=clean((byId('trExpenseReceiver')||{}).value), ref=clean((byId('trExpenseRef')||{}).value), notes=clean((byId('trExpenseNotes')||{}).value);
    if(!cat)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اكتب أو اختر جهة / بند الصرف'):'اكتب أو اختر جهة / بند الصرف'); if(!rec)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اكتب المسؤول أو المستلم'):'اكتب المسؤول أو المستلم'); if(!ref)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اكتب مرجع حركة الصرف'):'اكتب مرجع حركة الصرف'); if(amt<=0)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اكتب مبلغ صحيح أكبر من صفر'):'اكتب مبلغ صحيح أكبر من صفر'); if(amt>vaultBalance(src)+0.0001)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المبلغ أكبر من رصيد الخزنة المحددة'):'المبلغ أكبر من رصيد الخزنة المحددة');
    var tx={id:todayId('EX'),type:'expense',source:src,vehicle:src===OWNER?'':src,category:cat,amount:amt,receiver:rec,ref:ref,notes:notes,time:now()}; var saved=await saveTxToSupabase(tx); if(!saved.ok)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('فشل حفظ حركة الخزينة في Supabase: '):'فشل حفظ حركة الخزينة في Supabase: '+(saved.error||'')); var a=getTx();a.push(tx);setTx(a);var cc=getCats();cc.push(cat);setCats(cc);addAudit('صرف خزينة',null,tx,'إنشاء حركة صرف');clearExpenseForm();renderAll();toastMsg('تم تسجيل حركة الصرف');
  }
  function findTx(id){var a=getTx();for(var i=0;i<a.length;i++){if(clean(a[i]&&a[i].id)===clean(id))return {arr:a,index:i,tx:a[i]}}return null}
  async function editTx(id){
    var h=findTx(id); if(!h)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('لم يتم العثور على الحركة'):'لم يتم العثور على الحركة'); var t=Object.assign({},h.tx); if(t.type!=='handover'&&t.type!=='expense')return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('هذه حركة فاتورة ولا يتم تعديلها من الخزينة'):'هذه حركة فاتورة ولا يتم تعديلها من الخزينة');
    var reason=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('سبب التعديل'):'سبب التعديل'); if(reason===null)return; reason=clean(reason); if(!reason)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('سبب التعديل مطلوب'):'سبب التعديل مطلوب');
    var amt=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المبلغ الجديد'):'المبلغ الجديد',String(num(t.amount).toFixed(2))); if(amt===null)return; amt=num(amt); if(amt<=0)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اكتب مبلغ صحيح'):'اكتب مبلغ صحيح');
    var rec=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المسؤول / المستلم'):'المسؤول / المستلم',clean(t.receiver)); if(rec===null)return; rec=clean(rec); if(!rec)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المسؤول مطلوب'):'المسؤول مطلوب');
    var notes=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('ملاحظات'):'ملاحظات',clean(t.notes)); if(notes===null)return; notes=clean(notes);
    if(t.type==='handover'){var method=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('طريقة التسليم'):'طريقة التسليم',clean(t.method)||METHODS[0]); if(method===null)return; if(amt>vehicleBalance(clean(t.vehicle),id)+0.0001)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المبلغ أكبر من الرصيد المتاح بعد استبعاد الحركة الحالية'):'المبلغ أكبر من الرصيد المتاح بعد استبعاد الحركة الحالية'); t.method=clean(method)||METHODS[0]; t.receiver=rec; t.notes=notes;}
    if(t.type==='expense'){var cat=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('جهة / بند الصرف'):'جهة / بند الصرف',clean(t.category)); if(cat===null)return; cat=clean(cat); if(!cat)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('البند مطلوب'):'البند مطلوب'); var ref=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المرجع'):'المرجع',clean(t.ref)); if(ref===null)return; ref=clean(ref); if(!ref)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المرجع مطلوب'):'المرجع مطلوب'); var src=clean(t.source||t.vehicle||OWNER); if(amt>vaultBalance(src,id)+0.0001)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المبلغ أكبر من الرصيد المتاح بعد استبعاد الحركة الحالية'):'المبلغ أكبر من الرصيد المتاح بعد استبعاد الحركة الحالية'); t.category=cat;t.ref=ref;t.receiver=rec;t.notes=notes;}
    var before=Object.assign({},h.tx); t.amount=amt;t.updatedAt=now(); var saved=await saveTxToSupabase(t); if(!saved.ok)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('فشل تحديث حركة الخزينة في Supabase: '):'فشل تحديث حركة الخزينة في Supabase: '+(saved.error||'')); h.arr[h.index]=t; setTx(h.arr); addAudit('تعديل حركة خزينة',before,t,reason); renderAll(); toastMsg('تم تعديل الحركة');
  }
  async function deleteTx(id){var h=findTx(id); if(!h)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('لم يتم العثور على الحركة'):'لم يتم العثور على الحركة'); if(h.tx.type!=='handover'&&h.tx.type!=='expense')return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('هذه حركة فاتورة ولا يتم حذفها من الخزينة'):'هذه حركة فاتورة ولا يتم حذفها من الخزينة'); var reason=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('سبب الحذف'):'سبب الحذف'); if(reason===null)return; reason=clean(reason); if(!reason)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('سبب الحذف مطلوب'):'سبب الحذف مطلوب'); if(!confirm(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تأكيد حذف الحركة؟'):'تأكيد حذف الحركة؟'))return; var removed=await deleteTxFromSupabase(id); if(!removed.ok)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('فشل حذف حركة الخزينة من Supabase: '):'فشل حذف حركة الخزينة من Supabase: '+(removed.error||'')); var before=Object.assign({},h.tx); h.arr.splice(h.index,1); setTx(h.arr); addAudit('حذف حركة خزينة',before,null,reason); renderAll(); toastMsg('تم حذف الحركة');}
  function exportCsv(){var rows=allMovements(),header=['التاريخ','النوع','السيارة/الخزنة','من','إلى','المبلغ','المسؤول','المرجع','ملاحظات'];var lines=[header.join(',')].concat(rows.map(function(x){return [x.time||x.date,typeLabel(x.type),x.vehicle,x.from,x.to,x.amount,x.person,x.ref,x.notes].map(function(v){return '"'+clean(v).replace(/"/g,'""')+'"'}).join(',')}));var blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PETATOE_Treasury_Movements.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
  function exportStatementCsv(){var src=activeStatementVault||clean((byId('trStatementVaultSelectV82')||{}).value); if(!src)return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('افتح كشف حساب أولاً'):'افتح كشف حساب أولاً'); var rows=statementRows(src),header=['الخزنة','التاريخ','نوع الحركة','من','إلى','وارد','منصرف','الرصيد','المسؤول','المرجع','ملاحظات'];var lines=[header.join(',')].concat(rows.map(function(r){return [src,r.time,r.kind,r.from,r.to,r.inAmt,r.outAmt,r.balance,r.person,r.ref,r.notes].map(function(v){return '"'+clean(v).replace(/"/g,'""')+'"'}).join(',')}));var blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PETATOE_Treasury_Statement_'+src.replace(/[\\/:*?"<>|]/g,'_')+'.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
  function printStatement(){window.print()}


  /* ===== PETATOE Treasury consolidated tabs/audit layer (single-source, no wrappers) ===== */
  var activeTreasuryTab='home';
  var TREASURY_TABS=[
    ['home','🏠 الواجهة الرئيسية','treasury_tab_home'],
    ['balances','💰 الأرصدة','treasury_tab_balances'],
    ['movements','🤝 التسليمات','treasury_tab_movements'],
    ['expenses','💸 المصروفات','treasury_tab_expenses'],
    ['statement','📜 كشف الحساب','treasury_tab_statement'],
    ['log','📜 سجل الحركات','treasury_tab_log'],
    ['audit','🧾 سجل التدقيق','treasury_tab_audit'],
    ['reports','📊 التقارير','treasury_tab_reports']
  ];
  function treasuryTabMeta(id){for(var i=0;i<TREASURY_TABS.length;i++){if(TREASURY_TABS[i][0]===id)return TREASURY_TABS[i]}return null}
  function canTreasuryTab(id){var m=treasuryTabMeta(id);return !!(m&&canScreen('treasury','view')&&canSpecial(m[2]))}
  function allowedTreasuryTabs(){return TREASURY_TABS.filter(function(t){return canTreasuryTab(t[0])})}
  function firstAllowedTreasuryTab(){var a=allowedTreasuryTabs();return (a[0]&&a[0][0])||''}
  function qs(sel,root){return (root||document).querySelector(sel)}
  function ensureSection(pg,id){
    var sec=qs('.treasury-section-v82[data-tr-section="'+id+'"]',pg);
    if(!sec){sec=document.createElement('div');sec.className='treasury-section-v82';sec.setAttribute('data-tr-section',id);pg.appendChild(sec)}
    return sec;
  }
  function moveInto(sec,el){if(el&&sec&&el.parentNode!==sec)sec.appendChild(el)}
  function ensureTabs(){
    var panel=byId('treasury'); if(!panel)return;
    var pg=qs('.treasury-page',panel)||panel;
    var hero=qs('.treasury-hero',pg);
    var tabs=byId('treasuryTabsV82');
    if(!tabs){
      tabs=document.createElement('div');tabs.id='treasuryTabsV82';tabs.className='treasury-tabs-v82';
      if(hero)hero.insertAdjacentElement('afterend',tabs); else pg.insertBefore(tabs,pg.firstChild);
      tabs.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-tr-tab]');if(!b)return;openTreasuryTab(b.getAttribute('data-tr-tab'));});
    }
    var allowed=allowedTreasuryTabs();
    treasurySafeHtml(tabs,allowed.length?allowed.map(function(t){return '<button type="button" class="treasury-tab-btn-v82" data-tr-tab="'+t[0]+'" data-pet-treasury-tab="'+t[0]+'" data-pet-permission-special="'+t[2]+'">'+t[1]+'</button>'}).join(''):'<div class="tr-note" style="padding:12px 18px">لا توجد تبويبات خزينة مصرح بها للمستخدم الحالي.</div>','treasury permitted tabs');
    var home=ensureSection(pg,'home'), balances=ensureSection(pg,'balances'), movements=ensureSection(pg,'movements'), expenses=ensureSection(pg,'expenses'), statement=ensureSection(pg,'statement'), log=ensureSection(pg,'log'), audit=ensureSection(pg,'audit'), reports=ensureSection(pg,'reports');
    qa('#treasury .treasury-section-v82').forEach(function(sec){var id=sec.getAttribute('data-tr-section');if(treasuryTabMeta(id)){if(canTreasuryTab(id))sec.style.removeProperty('display');else sec.style.setProperty('display','none','important');}});
    var kpis=byId('treasuryKpis'); if(kpis&&!kpis.closest('.tr-card')){var kcard=byId('treasuryKpisCardV31120'); if(!kcard){kcard=document.createElement('div');kcard.id='treasuryKpisCardV31120';kcard.className='tr-card';kpis.parentNode.insertBefore(kcard,kpis);kcard.appendChild(kpis);} }
    moveInto(home,byId('treasuryKpisCardV31120'));
    var owner=byId('treasuryOwnerVaultCard'); moveInto(balances,owner&&owner.closest('.tr-card'));
    var vault=byId('treasuryVaultCards'); moveInto(balances,vault&&vault.closest('.tr-card'));
    moveInto(movements,qs('.treasury-handover-card',pg));
    moveInto(expenses,qs('.treasury-expense-card',pg));
    moveInto(statement,byId('treasuryStatementCard'));
    moveInto(log,qs('.treasury-movements-card',pg));
    ensureAuditCard(audit); renderAudit(); renderReports(reports); renderHome(home);
    openTreasuryTab(activeTreasuryTab||'home',true);
  }
  function openTreasuryTab(tab,silent){
    tab=tab||firstAllowedTreasuryTab()||'home';
    if(!canTreasuryTab(tab)){var fb=firstAllowedTreasuryTab(); if(!fb){activeTreasuryTab='';return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('غير متاح للصلاحية الحالية'):'غير متاح للصلاحية الحالية');} tab=fb;}
    activeTreasuryTab=tab;
    qa('#treasury .treasury-tab-btn-v82').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-tr-tab')===activeTreasuryTab)});
    qa('#treasury .treasury-section-v82').forEach(function(s){var id=s.getAttribute('data-tr-section');var allowed=!treasuryTabMeta(id)||canTreasuryTab(id);s.style[allowed?'removeProperty':'setProperty']&& (allowed?s.style.removeProperty('display'):s.style.setProperty('display','none','important'));s.classList.toggle('active',allowed&&id===activeTreasuryTab)});
    if(!silent){setTimeout(function(){fillSelects();updateBalanceBoxes();renderTable();renderStatement();renderAudit();renderHome();},20)}
  }
  function renderHome(home){
    home=home||qs('#treasury .treasury-section-v82[data-tr-section="home"]'); if(!home)return;
    var vs=vehicleList(), total=vs.reduce(function(s,v){return s+vehicleBalance(v)},0), rows=allMovements().length;
    var old=byId('treasuryHomeCardsV31120'); if(!old){old=document.createElement('div');old.id='treasuryHomeCardsV31120';old.className='treasury-home-v82';home.appendChild(old)}
    var cards=[];
    if(canTreasuryTab('balances'))cards.push('<div class="tr-home-card-v82" role="button" tabindex="0" data-tr-open-tab="balances"><b>💰 إجمالي أرصدة الخزن</b><span>'+fmtAvail(total+(canAccessOwnerVault()?mainBalance():0))+' • عدد الخزن: '+(vs.length+(canAccessOwnerVault()?1:0))+'</span></div>');
    if(canTreasuryTab('log'))cards.push('<div class="tr-home-card-v82" role="button" tabindex="0" data-tr-open-tab="log"><b>🔄 الحركات المالية</b><span>عدد الحركات الحالية: '+rows+' • تحصيل / تسليم / صرف</span></div>');
    if(canTreasuryTab('statement'))cards.push('<div class="tr-home-card-v82" role="button" tabindex="0" data-tr-open-tab="statement"><b>📜 كشف الحساب</b><span>اختر أي خزنة واعرض الوارد والمنصرف والرصيد التفصيلي.</span></div>');
    treasurySafeHtml(old,cards.length?cards.join(''):'<div class="tr-note">لا توجد اختصارات خزينة مصرح بها للمستخدم الحالي.</div>','treasury home cards');
  }
  function renderReports(reports){
    reports=reports||qs('#treasury .treasury-section-v82[data-tr-section="reports"]'); if(!reports)return;
    if(byId('treasuryReportsV31120'))return;
    var box=document.createElement('div');box.id='treasuryReportsV31120';box.className='treasury-reports-v82';
    var reportCards=[];
    if(canTreasuryTab('statement'))reportCards.push('<div class="tr-report-card-v82"><b>📊 تقرير الرصيد اليومي</b><span>افتح كشف الحساب واختر الخزنة والفترة المطلوبة.</span><button class="btn btn-ghost" type="button" data-tr-open-tab="statement">فتح كشف الحساب</button></div>');
    if(canTreasuryTab('balances'))reportCards.push('<div class="tr-report-card-v82"><b>🚐 مقارنة الخزن</b><span>مراجعة أرصدة الخزائن المصرح بها فقط.</span><button class="btn btn-ghost" type="button" data-tr-open-tab="balances">فتح الأرصدة</button></div>');
    if(canTreasuryTab('log'))reportCards.push('<div class="tr-report-card-v82"><b>⬇️ تصدير الحركات</b><span>تصدير سجل الحركات المصرح به Excel.</span><button class="btn btn-green" type="button" data-tr-export-csv="movements">Excel</button></div>');
    treasurySafeHtml(box,reportCards.length?reportCards.join(''):'<div class="tr-note">لا توجد تقارير خزينة مصرح بها.</div>','treasury reports cards');
    reports.appendChild(box);
  }
  function getAudit(){return auditCache}
  function ensureAuditCard(auditSec){
    if(byId('treasuryAuditTrailCard'))return;
    var card=document.createElement('div');card.id='treasuryAuditTrailCard';card.className='tr-card tr-audit-card';card.setAttribute('data-tr-section-inner','audit-table');
    treasurySafeHtml(card,'<h3>🧾 Audit Trail — سجل تدقيق الخزينة</h3><p>كل إضافة أو تعديل أو حذف يدوي في الخزينة يُسجل بتاريخ ووقت ومستخدم وسبب، مع حفظ القيم قبل وبعد التغيير.</p><div class="tr-audit-toolbar"><div class="left"><input id="trAuditSearch" class="tr-audit-search" placeholder="بحث في السجل: مستخدم / إجراء / مرجع / سبب"><button class="btn btn-ghost" type="button" id="trAuditClearBtn">مسح</button></div><button class="btn btn-green" type="button" id="trAuditExportBtn">⬇️ Excel</button></div><div class="tr-audit-table"><table><thead><tr><th>#</th><th>التاريخ والوقت</th><th>المستخدم</th><th>الإجراء</th><th>القيمة قبل</th><th>القيمة بعد</th><th>السبب</th></tr></thead><tbody id="trAuditBody"></tbody></table></div>','treasury audit card');
    auditSec.appendChild(card);
    var s=byId('trAuditSearch'); if(s)s.addEventListener('input',renderAudit);
    var c=byId('trAuditClearBtn'); if(c)c.addEventListener('click',function(){var s=byId('trAuditSearch');if(s)s.value='';renderAudit()});
    var x=byId('trAuditExportBtn'); if(x)x.addEventListener('click',exportAuditCsv);
  }
  function briefObj(o){try{return o?JSON.stringify(o):'-'}catch(e){return '-'}}
  function renderAudit(){var body=byId('trAuditBody'); if(!body)return; var q=clean((byId('trAuditSearch')||{}).value).toLowerCase(); var rows=getAudit().slice().reverse().filter(function(a){return !q||[a.user,a.action,a.reason,briefObj(a.before),briefObj(a.after)].join(' ').toLowerCase().indexOf(q)>-1}).slice(0,500); treasurySafeHtml(body,rows.length?rows.map(function(a,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(a.time?new Date(a.time).toLocaleString('ar-EG'):'-')+'</td><td>'+esc(a.user||'-')+'</td><td>'+esc(a.action||'-')+'</td><td style="direction:ltr;text-align:left;max-width:260px;white-space:normal">'+esc(briefObj(a.before))+'</td><td style="direction:ltr;text-align:left;max-width:260px;white-space:normal">'+esc(briefObj(a.after))+'</td><td>'+esc(a.reason||'-')+'</td></tr>'}).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:22px">لا توجد حركات تدقيق.</td></tr>','treasury audit rows')}
  function exportAuditCsv(){var rows=getAudit(), header=['time','user','action','before','after','reason'];var lines=[header.join(',')].concat(rows.map(function(a){return [a.time,a.user,a.action,briefObj(a.before),briefObj(a.after),a.reason].map(function(v){return '"'+clean(v).replace(/"/g,'""')+'"'}).join(',')}));var blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PETATOE_Treasury_Audit.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}

  function renderAll(){
    if(rendering)return; rendering=true;
    try{patchApi();ensureTabs();fillSelects();renderKpis();renderVaults();updateBalanceBoxes();renderTable();if(activeStatementVault||clean((byId('trStatementVaultSelectV82')||{}).value))renderStatement();renderAudit();renderHome();}
    finally{rendering=false;}
  }
  function patchApi(){
    window.PETATOETreasury={render:renderAll,updateBalanceBox:updateBalanceBoxes,updateExpenseBalanceBox:updateBalanceBoxes,handover:handover,expense:expense,clearForm:clearForm,clearExpenseForm:clearExpenseForm,resetFilters:resetFilters,exportCsv:exportCsv,openStatement:openStatement,closeStatement:closeStatement,renderStatement:renderStatement,clearStatementFilters:clearStatementFilters,exportStatementCsv:exportStatementCsv,printStatement:printStatement,editTx:editTx,deleteTx:deleteTx,renderAudit:renderAudit,exportAuditCsv:exportAuditCsv,__singleSourceV31120:true};
    window.PETATOETreasuryTabsV82={open:openTreasuryTab,renderAlerts:function(){},renderReports:function(){renderReports();},setAlertLimit:function(){}};
    window.PETATOETreasuryAudit={render:renderAudit,exportCsv:exportAuditCsv,clearSearch:function(){var s=byId('trAuditSearch');if(s)s.value='';renderAudit();},log:addAudit};
  }
  function bind(){
    if(bind.done)return; bind.done=true;
    document.addEventListener('pointerdown',function(e){var id=e.target&&e.target.id;if(['trVehicle','trMethod','trExpenseSource','trFilterVehicle','trStatementVaultSelectV82'].indexOf(id)>-1){updateBalanceBoxes();}},true);
    document.addEventListener('focusin',function(e){var id=e.target&&e.target.id;if(['trVehicle','trMethod','trExpenseSource','trFilterVehicle','trStatementVaultSelectV82'].indexOf(id)>-1){setTimeout(updateBalanceBoxes,0)}},true);
    document.addEventListener('change',function(e){var id=e.target&&e.target.id;if(id==='trVehicle'||id==='trExpenseSource')updateBalanceBoxes(); if(id==='trStatementVaultSelectV82'){activeStatementVault=clean(e.target.value); if(activeStatementVault)openStatement(activeStatementVault); else renderStatement();} if(id==='trFilterVehicle'||id==='trFilterType')renderTable();},true);
    document.addEventListener('input',function(e){var id=e.target&&e.target.id;if(id==='trSearch')renderTable(); if(['trStatementFrom','trStatementTo','trStatementSearch'].indexOf(id)>-1)renderStatement();},true);
    document.addEventListener('click',function(e){var edit=e.target&&e.target.closest&&e.target.closest('#treasury [data-tr-edit]'); if(edit){e.preventDefault();e.stopImmediatePropagation();editTx(edit.getAttribute('data-tr-edit'));return false} var del=e.target&&e.target.closest&&e.target.closest('#treasury [data-tr-delete]'); if(del){e.preventDefault();e.stopImmediatePropagation();deleteTx(del.getAttribute('data-tr-delete'));return false} var st=e.target&&e.target.closest&&e.target.closest('#treasury .tr-statement-open'); if(st){e.preventDefault();e.stopImmediatePropagation();openStatement(st.getAttribute('data-vault')||OWNER);return false} var tab=e.target&&e.target.closest&&e.target.closest('#treasury [data-tr-open-tab]'); if(tab){e.preventDefault();e.stopImmediatePropagation();openTreasuryTab(tab.getAttribute('data-tr-open-tab')||'home');return false} var exp=e.target&&e.target.closest&&e.target.closest('#treasury [data-tr-export-csv]'); if(exp){e.preventDefault();e.stopImmediatePropagation(); if(!canTreasuryTab('log')&&!canTreasuryTab('reports'))return alert(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('غير متاح للصلاحية الحالية'):'غير متاح للصلاحية الحالية'); exportCsv();return false}},true);
    document.addEventListener('keydown',function(e){var tab=e.target&&e.target.closest&&e.target.closest('#treasury [data-tr-open-tab]'); if(!tab)return; if(e.key!=='Enter'&&e.key!==' ')return; e.preventDefault();openTreasuryTab(tab.getAttribute('data-tr-open-tab')||'home');},true);
    document.addEventListener('petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='treasury')setTimeout(renderAll,20)});
  }
  function boot(){
    bind();
    patchApi();
    loadTreasuryFromSupabase(false).then(function(){
      if(!byId('treasury'))return;
      var t=Date.now();
      if(boot.lastRenderAt && (t-boot.lastRenderAt)<180)return;
      boot.lastRenderAt=t;
      renderAll();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  [80,300].forEach(function(ms){setTimeout(boot,ms)});
  /* PETATOE v3.8.103: disabled treasury self-mutation rerender; it was causing slow selects and action rebinding issues. */
})();
