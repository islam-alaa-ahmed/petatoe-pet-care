(function(){
'use strict';
const COMM_KEY='commissions';
const COMM_SNAPSHOT_KEY='commissionSnapshots';
const COMM_REMOTE_STORE_ID='commission_reference_data';
const COMM_REMOTE_SNAPSHOT_ID='commission_monthly_snapshots';
let commissionStoreCache=null;
let commissionSnapsCache=null;
let commissionRemoteLoaded=false;
let commissionRemoteLoading=false;
let commissionRemotePromise=null;
const DEFAULT_CONFIG={
  rules:[{from:'2026-01',config:{
    groomer:[{target:40000,rate:3},{target:55000,rate:4},{target:70000,rate:5}],
    driver:[{target:40000,rate:1.06},{target:55000,rate:1.57},{target:70000,rate:1.82}],
    sales:[{target:40000,rate:.5},{target:55000,rate:.75},{target:70000,rate:1}]
  }}],
  employees:{groomers:[],drivers:[],sales:[]},
  identity:{schemaVersion:'commission-identity-v1',vehicleAliases:{},employeeAliases:{}}
};
let comTab='overview';
function petBlock5568_q(id){return document.getElementById(id)}
function petBlock5568_replaceOptions(select, items, selectedValue){
  if(!select)return;
  while(select.firstChild)select.removeChild(select.firstChild);
  (items||[]).forEach(function(item){
    var opt=document.createElement('option');
    opt.value=String(item&&item.value!=null?item.value:'');
    opt.textContent=String(item&&item.label!=null?item.label:opt.value);
    select.appendChild(opt);
  });
  if(selectedValue!=null)select.value=String(selectedValue);
}
function safe(v){return String(v??'').replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}

function comSafeHtml(target, html, reason){
  const el=(typeof target==='string')?petBlock5568_q(target):target;
  if(!el)return false;
  try{if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function')return window.PETATOESafeRender.htmlTrusted(el,String(html==null?'':html),reason||'commission trusted escaped template');}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission safe render fallback',e);}
  el.textContent='';el.insertAdjacentHTML('beforeend',String(html==null?'':html));return true;
}
function clone(o){return JSON.parse(JSON.stringify(o||{}))}
function ym(y,m){return String(y||'').padStart(4,'0')+'-'+String(m||'').padStart(2,'0')}
function currentPeriod(){return ym(petBlock5568_q('comYear')?.value||new Date().getFullYear(), petBlock5568_q('comMonth')?.value||String(new Date().getMonth()+1).padStart(2,'0'))}
function validCommissionStore(s){return !!(s&&typeof s==='object'&&s.rules&&s.employees)}
function validCommissionSnaps(s){return !!(s&&typeof s==='object'&&!Array.isArray(s))}
function mergeCommissionStore(remote,local){
  const base=clone(DEFAULT_CONFIG);
  const out=validCommissionStore(remote)?clone(remote):(validCommissionStore(local)?clone(local):base);
  out.rules=Array.isArray(out.rules)?out.rules:base.rules;
  out.employees=out.employees&&typeof out.employees==='object'?out.employees:base.employees;
  ['groomers','drivers','sales'].forEach(function(k){out.employees[k]=Array.isArray(out.employees[k])?out.employees[k]:[];});
  out.identity=out.identity&&typeof out.identity==='object'?out.identity:clone(base.identity);
  out.identity.schemaVersion='commission-identity-v1';
  out.identity.vehicleAliases=out.identity.vehicleAliases&&typeof out.identity.vehicleAliases==='object'?out.identity.vehicleAliases:{};
  out.identity.employeeAliases=out.identity.employeeAliases&&typeof out.identity.employeeAliases==='object'?out.identity.employeeAliases:{};
  return normalizeCommissionStoreIdentities(out);
}
function repository(){return window.PETATOESupabaseRepository||null}
async function readRemoteCommissionPayload(id,def){
  const repo=repository();
  if(!repo||!repo.hasClient||!repo.hasClient())return clone(def||{});
  try{
    if(typeof repo.getSingleton==='function'){
      const got=await repo.getSingleton('payroll_master_data',id,null);
      if(got&&typeof got==='object')return got;
    }
    if(typeof repo.listJsonRows==='function'){
      const rows=await repo.listJsonRows('payroll_master_data');
      const hit=(rows||[]).find(function(r){return String((r&&r.id)||'')===String(id)});
      if(hit&&typeof hit==='object')return hit;
    }
  }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission remote read',e);}
  return clone(def||{});
}
async function writeRemoteCommissionPayload(id,data){
  const repo=repository();
  if(!repo||!repo.hasClient||!repo.hasClient())return false;
  try{
    if(typeof repo.saveSingleton==='function'){
      const res=await repo.saveSingleton('payroll_master_data',id,data&&typeof data==='object'?data:{});
      return !!(res&&res.ok!==false);
    }
    if(typeof repo.upsertJsonRow==='function'){
      const res=await repo.upsertJsonRow('payroll_master_data',id,data&&typeof data==='object'?data:{},{});
      return !!(res&&res.ok!==false);
    }
  }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission remote write',e);}
  return false;
}
function readStore(){
  if(validCommissionStore(commissionStoreCache))return clone(commissionStoreCache);
  commissionStoreCache=mergeCommissionStore(null,null);
  hydrateCommissionRemoteOnce();
  return clone(commissionStoreCache);
}
async function writeStore(s){
  const previous=validCommissionStore(commissionStoreCache)?clone(commissionStoreCache):mergeCommissionStore(null,null);
  const next=mergeCommissionStore(s,null);
  commissionStoreCache=next;
  const ok=await writeRemoteCommissionPayload(COMM_REMOTE_STORE_ID,next);
  if(!ok){commissionStoreCache=previous;throw new Error('Commission settings save failed');}
  try{document.dispatchEvent(new CustomEvent('petatoe:commission-settings-updated',{detail:{sourceId:COMM_REMOTE_STORE_ID}}));}catch(_e){}
  return {ok:true,sourceId:COMM_REMOTE_STORE_ID};
}
function readSnaps(){
  if(validCommissionSnaps(commissionSnapsCache))return clone(commissionSnapsCache);
  commissionSnapsCache={};
  hydrateCommissionRemoteOnce();
  return clone(commissionSnapsCache);
}
async function writeSnaps(s){
  const next=validCommissionSnaps(s)?clone(s):{};
  const previous=validCommissionSnaps(commissionSnapsCache)?clone(commissionSnapsCache):{};
  const ok=await writeRemoteCommissionPayload(COMM_REMOTE_SNAPSHOT_ID,next);
  if(!ok){
    commissionSnapsCache=previous;
    throw new Error('Commission snapshot save failed');
  }
  commissionSnapsCache=next;
  try{document.dispatchEvent(new CustomEvent('petatoe:commission-snapshots-updated',{detail:{sourceId:COMM_REMOTE_SNAPSHOT_ID,periods:Object.keys(next)}}));}catch(_e){}
  try{if(window.PETATOEPayrollReadFacade&&typeof window.PETATOEPayrollReadFacade.refresh==='function')window.PETATOEPayrollReadFacade.refresh();}catch(_e){}
  return {ok:true,sourceId:COMM_REMOTE_SNAPSHOT_ID};
}
async function hydrateCommissionRemoteOnce(){
  if(commissionRemoteLoaded)return true;
  if(commissionRemotePromise)return commissionRemotePromise;
  commissionRemoteLoading=true;
  commissionRemotePromise=(async function(){
    try{
      const remoteStore=await readRemoteCommissionPayload(COMM_REMOTE_STORE_ID,null);
      commissionStoreCache=mergeCommissionStore(remoteStore,null);
      if(validCommissionStore(remoteStore)&&JSON.stringify(remoteStore)!==JSON.stringify(commissionStoreCache)){
        await writeRemoteCommissionPayload(COMM_REMOTE_STORE_ID,commissionStoreCache);
      }

      const remoteSnaps=await readRemoteCommissionPayload(COMM_REMOTE_SNAPSHOT_ID,null);
      commissionSnapsCache=validCommissionSnaps(remoteSnaps)?remoteSnaps:{};
      commissionRemoteLoaded=true;
      if(document.getElementById('commissions')&&window.renderCommissionSystem)window.renderCommissionSystem();
      return true;
    }catch(e){
      window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission remote hydrate',e);
      return false;
    }finally{
      commissionRemoteLoading=false;
      commissionRemotePromise=null;
    }
  })();
  return commissionRemotePromise;
}
function commissionDigits(v){return String(v==null?'':v).replace(/[٠-٩]/g,function(d){return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d));}).replace(/[۰-۹]/g,function(d){return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));});}
function commissionRowPeriod(row){
  row=row||{};
  var direct=commissionDigits(row.period||row.month||row.invoice_month||row.invoiceMonth||'').trim();
  var match=direct.match(/^(\d{4})[-\/](\d{1,2})$/);
  if(match)return match[1]+'-'+String(match[2]).padStart(2,'0');
  var raw=commissionDigits(row.date||row.invoice_date||row.invoiceDate||row.createdAt||'').trim();
  var iso=raw.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if(iso)return iso[1]+'-'+String(iso[2]).padStart(2,'0');
  var dmy=raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if(dmy)return dmy[3]+'-'+String(dmy[2]).padStart(2,'0');
  var parsed=new Date(raw);
  if(!isNaN(parsed.getTime()))return parsed.getFullYear()+'-'+String(parsed.getMonth()+1).padStart(2,'0');
  return '';
}
async function commissionLockedPeriods(){
  var ready=await hydrateCommissionRemoteOnce();
  if(!ready)return {ok:false,lockedPeriods:[],error:'COMMISSION_SNAPSHOT_UNAVAILABLE'};
  var snaps=readSnaps();
  return {ok:true,lockedPeriods:Object.keys(snaps).filter(function(k){return !!snaps[k];}).sort()};
}
window.PETATOECommissionPeriodGuard={
  version:'1.0.0',
  normalizePeriod:commissionRowPeriod,
  getLockedPeriods:commissionLockedPeriods,
  isLocked:async function(period){var state=await commissionLockedPeriods();if(!state.ok)return state;period=commissionRowPeriod({period:period});return {ok:true,locked:state.lockedPeriods.indexOf(period)>=0,period:period,lockedPeriods:state.lockedPeriods};},
  assertRowsUnlocked:async function(rows){
    var state=await commissionLockedPeriods();
    if(!state.ok)return state;
    var periods=Array.from(new Set((Array.isArray(rows)?rows:[]).map(commissionRowPeriod).filter(Boolean)));
    var blocked=periods.filter(function(period){return state.lockedPeriods.indexOf(period)>=0;});
    return {ok:blocked.length===0,lockedPeriods:blocked,affectedPeriods:periods,error:blocked.length?'COMMISSION_PERIOD_LOCKED':''};
  },
  assertReplaceAllowed:async function(){var state=await commissionLockedPeriods();if(!state.ok)return state;return {ok:state.lockedPeriods.length===0,lockedPeriods:state.lockedPeriods,error:state.lockedPeriods.length?'COMMISSION_REPLACE_BLOCKED_BY_LOCKED_PERIODS':''};}
};
function dataRows(){
  try{return window.PETATOEDataSource.getRecordsSync()||[]}catch(e){return []}
}
function comParseNum(v){
  try{ if(typeof parseNum==='function') return parseNum(v); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/commission-inline.js",e);}
  if(v==null||v==='')return 0;
  if(typeof v==='number')return isFinite(v)?v:0;
  let n=parseFloat(String(v).replace(/,/g,'').replace(/SAR|sar|ريال|ر\.س|EGP|egp|جنيه/gi,'').trim());
  return isNaN(n)?0:n;
}
function comDateISO(v){
  try{ if(typeof parseDate==='function') return String(parseDate(v)||''); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/commission-inline.js",e);}
  if(!v)return'';
  if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);
  return String(v||'');
}
function commissionIdentityNorm(v){
  return commissionDigits(v).toLowerCase().trim().replace(/[\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^a-z0-9\u0600-\u06ff]+/g,' ').replace(/\s+/g,' ').trim();
}
function commissionIdentityHash(v){
  var text=commissionIdentityNorm(v)||'unknown',h=2166136261;
  for(var i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(36);
}
function commissionVehicleMasters(){
  var out=[],seen={};
  function add(v){v=v||{};var id=String(v.id||v.vehicleId||v.vehicle_id||v.code||v.plate||v.name||'').trim(),name=String(v.name||v.vehicle||v.car||v.plate||id).trim();if(!id||!name)return;var k=commissionIdentityNorm(id);if(seen[k])return;seen[k]=1;out.push({id:id,name:name,aliases:[id,name,v.code,v.plate,v.meta].concat(v.aliases||[]).filter(Boolean)});}
  try{var p=window.PETATOEPermissions;if(p&&typeof p.getVehicleList==='function')(p.getVehicleList()||[]).forEach(add);}catch(_e){}
  try{var r=window.PETATOEReferenceRegistry;if(r&&typeof r.getVehicles==='function')(r.getVehicles()||[]).forEach(add);}catch(_e2){}
  try{var f=window.PETATOERepositories&&window.PETATOERepositories.Fleet;if(f&&typeof f.getSync==='function'){var fs=f.getSync()||{};(fs.vehicles||[]).forEach(add);}}catch(_e3){}
  return out;
}
function commissionUserMasters(){
  var out=[],seen={};
  function add(u){u=u||{};var id=String(u.supabase_id||u.user_id||u.userId||u.id||u.uid||'').trim(),name=String(u.fullName||u.full_name||u.name||u.username||id).trim();if(!id||!name)return;var k=commissionIdentityNorm(id);if(seen[k])return;seen[k]=1;out.push({id:id,name:name,aliases:[id,name,u.username,u.fullName,u.full_name,u.email].filter(Boolean)});}
  try{var a=window.__PETATOE_SETTINGS_API__;if(a&&typeof a.users==='function')(a.users()||[]).forEach(add);}catch(_e){}
  try{var p=window.PETATOEPermissions;if(p&&typeof p.getUsers==='function')(p.getUsers()||[]).forEach(add);}catch(_e2){}
  try{var f=window.PETATOEPayrollReadFacade;if(f&&typeof f.employees==='function')(f.employees()||[]).forEach(add);}catch(_e3){}
  return out;
}
function commissionResolveIdentity(kind,input,store){
  input=input||{};store=store||commissionStoreCache||{};
  var isVehicle=kind==='vehicle', aliases=store.identity&&store.identity[isVehicle?'vehicleAliases':'employeeAliases']||{};
  var explicit=String(isVehicle?(input.vehicleId||input.vehicle_id||input.carId||input.car_id||input.vanId||input.van_id||''):(input.employeeId||input.employee_id||input.personId||input.person_id||input.userId||input.user_id||input.id||'')).trim();
  var display=String(isVehicle?(input.van??input.car??input.vehicle??input['السيارة']??input.name??input.plate??''):(input.person??input.employee??input.name??input.fullName??input.full_name??input.username??'')).trim();
  var masters=isVehicle?commissionVehicleMasters():commissionUserMasters(), tokens=[explicit,display].filter(Boolean).map(commissionIdentityNorm);
  var resolvedId='';
  tokens.some(function(t){if(aliases[t]){resolvedId=String(aliases[t]);return true;}return false;});
  var master=null;
  if(resolvedId)master=masters.find(function(m){return String(m.id)===resolvedId;})||null;
  if(!master){master=masters.find(function(m){return m.aliases.some(function(a){return tokens.indexOf(commissionIdentityNorm(a))>=0;});})||null;if(master)resolvedId=String(master.id);}
  if(!resolvedId)resolvedId=(isVehicle?'legacy-vehicle-':'legacy-employee-')+commissionIdentityHash(explicit||display||'unknown');
  var resolvedName=String((master&&master.name)||display||(isVehicle?'غير محدد':'غير محدد')).trim()||'غير محدد';
  if(store.identity){tokens.forEach(function(t){if(t)aliases[t]=resolvedId;});aliases[commissionIdentityNorm(resolvedId)]=resolvedId;}
  return {id:resolvedId,name:resolvedName,source:master?'master':(explicit?'explicit':'legacy')};
}
function normalizeCommissionStoreIdentities(store){
  store=store||{};store.identity=store.identity||{schemaVersion:'commission-identity-v1',vehicleAliases:{},employeeAliases:{}};
  ['groomers','drivers','sales'].forEach(function(type){(store.employees[type]||[]).forEach(function(e){
    var emp=commissionResolveIdentity('employee',e,store);e.employeeId=emp.id;e.name=e.name||emp.name;
    if(e.vehicleId||e.carId||e.car){var veh=commissionResolveIdentity('vehicle',{vehicleId:e.vehicleId||e.carId,car:e.car},store);e.vehicleId=veh.id;e.car=e.car||veh.name;}
    if(type==='sales'&&!e.vehicleId)e.assignmentStatus='legacy_unassigned';
  });});
  return store;
}
function rowVehicleIdentity(r){return commissionResolveIdentity('vehicle',r||{},commissionStoreCache||readStore())}
function rowCar(r){return rowVehicleIdentity(r).name}
function rowVehicleId(r){return rowVehicleIdentity(r).id}
function commissionEmployeeIdentity(e){return commissionResolveIdentity('employee',e||{},commissionStoreCache||readStore())}
window.PETATOECommissionIdentity={version:'1.0.0',normalize:commissionIdentityNorm,resolveVehicle:function(v){return commissionResolveIdentity('vehicle',typeof v==='object'?v:{car:v},commissionStoreCache||readStore())},resolveEmployee:function(v){return commissionResolveIdentity('employee',typeof v==='object'?v:{name:v},commissionStoreCache||readStore())},vehicles:commissionVehicleMasters,employees:commissionUserMasters};
function rowNetSales(r){
  // Preserve explicit zero and negative values. Falling back merely because totalEx is 0
  // made the same invoice line produce different results depending on which amount field was filled.
  if(r&&r.totalEx!==undefined&&r.totalEx!==null&&String(r.totalEx).trim()!=='') return comParseNum(r.totalEx);
  if(r&&r.totalInc!==undefined&&r.totalInc!==null&&String(r.totalInc).trim()!=='') return comParseNum(r.totalInc)-comParseNum(r.tax);
  const price=comParseNum(r&&r.price), qty=comParseNum(r&&r.qty), disc=Math.abs(comParseNum(r&&r.disc));
  return (price*qty)-disc;
}
function commissionEligibilityNorm(v){
  return commissionDigits(v).toLowerCase().trim().replace(/[\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[_\-\/]+/g,' ').replace(/\s+/g,' ');
}
function commissionEligibilityText(row){
  row=row||{};
  return [row.status,row.invoiceStatus,row.invoice_status,row.state,row.transactionType,row.transaction_type,row.documentType,row.document_type,row.entryType,row.entry_type,row.recordType,row.record_type,row.movementType,row.movement_type,row.operationType,row.operation_type]
    .map(commissionEligibilityNorm).filter(Boolean).join(' | ');
}
function commissionHasEligibilityToken(text,tokens){
  text=' '+String(text||'')+' ';
  return (tokens||[]).some(function(token){token=commissionEligibilityNorm(token);return token&&text.indexOf(' '+token+' ')>=0;});
}
function classifyCommissionRow(row){
  row=row||{};
  const rawAmount=rowNetSales(row);
  const text=commissionEligibilityText(row);
  const cancelled=!!(row.cancelled===true||row.canceled===true||row.isCancelled===true||row.isCanceled===true||row.voided===true||row.isVoid===true||row.reversed===true||row.isReversed===true)||commissionHasEligibilityToken(text,['cancelled','canceled','cancel','void','voided','reversed','reversal','ملغي','ملغاه','الغاء','مبطل']);
  if(cancelled)return {eligible:false,kind:'excluded',reason:'cancelled_or_void',amount:0,rawAmount:rawAmount};
  const adjustment=!!(row.refund===true||row.isRefund===true||row.returned===true||row.isReturn===true||row.creditNote===true||row.isCreditNote===true)||commissionHasEligibilityToken(text,['refund','refunded','return','returned','credit note','creditnote','credit memo','مرتجع','مرتجعه','اشعار دائن','مردود']);
  if(adjustment){
    const adjusted=rawAmount===0?0:-Math.abs(rawAmount);
    return {eligible:adjusted!==0,kind:'adjustment',reason:adjusted===0?'zero_adjustment':'refund_or_credit',amount:adjusted,rawAmount:rawAmount};
  }
  if(rawAmount===0)return {eligible:false,kind:'excluded',reason:'zero_value',amount:0,rawAmount:rawAmount};
  if(rawAmount<0)return {eligible:true,kind:'adjustment',reason:'negative_value',amount:rawAmount,rawAmount:rawAmount};
  return {eligible:true,kind:'sale',reason:'eligible_sale',amount:rawAmount,rawAmount:rawAmount};
}
function commissionEligibleRows(rows){
  return (rows||[]).map(function(row){
    const eligibility=classifyCommissionRow(row);
    return Object.assign({},row,{__commissionEligibility:eligibility,__commissionAmount:eligibility.amount});
  }).filter(function(row){return row.__commissionEligibility.eligible;});
}
function commissionEligibilitySummary(rows){
  const summary={total:0,eligible:0,excluded:0,sales:0,adjustments:0,eligibleAmount:0,excludedReasons:{}};
  (rows||[]).forEach(function(row){
    const c=classifyCommissionRow(row);summary.total++;
    if(c.eligible){summary.eligible++;summary.eligibleAmount+=c.amount;if(c.kind==='adjustment')summary.adjustments++;else summary.sales++;}
    else{summary.excluded++;summary.excludedReasons[c.reason]=(summary.excludedReasons[c.reason]||0)+1;}
  });
  summary.eligibleAmount=Math.round((summary.eligibleAmount+Number.EPSILON)*100)/100;
  return summary;
}
window.PETATOECommissionEligibility={classify:classifyCommissionRow,eligibleRows:commissionEligibleRows,summary:commissionEligibilitySummary,netAmount:rowNetSales};
function commissionTraceNorm(v){return commissionEligibilityNorm(v==null?'':v)}
function commissionTraceHash(v){
  var str=String(v==null?'':v),h=2166136261;
  for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
  return ('00000000'+(h>>>0).toString(16)).slice(-8);
}
function commissionInvoiceRef(row,index){
  row=row||{};
  var explicit=row.invoiceId||row.invoice_id||row.salesInvoiceId||row.sales_invoice_id||row.documentId||row.document_id||'';
  var number=row.invoice||row.invoiceNo||row.invoice_no||row.invoiceNumber||row.invoice_number||row.documentNo||row.document_no||'';
  var date=comDateISO(row.date||row.invoiceDate||row.invoice_date||row.createdAt||'');
  var customer=row.customerId||row.customer_id||row.customer||row.customerName||row.customer_name||'';
  var seed=[explicit,number,date,customer].map(commissionTraceNorm).join('|');
  return {id:String(explicit||('invoice-'+commissionTraceHash(seed||('row-'+index)))),number:String(number||''),date:String(date||''),customerId:String(row.customerId||row.customer_id||''),customer:String(row.customer||row.customerName||row.customer_name||'')};
}
function commissionLineRef(row,index,invoice){
  row=row||{};invoice=invoice||commissionInvoiceRef(row,index);
  var explicit=row.id||row.lineId||row.line_id||row.salesRecordId||row.sales_record_id||row.recordId||row.record_id||'';
  var item=row.serviceId||row.service_id||row.itemId||row.item_id||row.materialId||row.material_id||row.service||row.item||row.material||row.description||'';
  var qty=row.qty||row.quantity||'';
  var seed=[invoice.id,explicit,item,qty,rowNetSales(row),index].map(commissionTraceNorm).join('|');
  return {id:String(explicit||('line-'+commissionTraceHash(seed))),itemId:String(row.serviceId||row.service_id||row.itemId||row.item_id||row.materialId||row.material_id||''),item:String(row.service||row.item||row.material||row.description||''),quantity:comParseNum(qty)};
}
function commissionTraceEntry(row,index,period){
  var eligibility=classifyCommissionRow(row),vehicle=rowVehicleIdentity(row),invoice=commissionInvoiceRef(row,index),line=commissionLineRef(row,index,invoice);
  var seed=[period,invoice.id,line.id,vehicle.id,eligibility.reason,eligibility.amount].join('|');
  return {traceId:'ctr-'+commissionTraceHash(seed),period:String(period||commissionPeriodFromRow(row)||''),invoiceId:invoice.id,invoiceNumber:invoice.number,invoiceDate:invoice.date,invoiceCustomerId:invoice.customerId,invoiceCustomer:invoice.customer,lineId:line.id,itemId:line.itemId,item:line.item,quantity:line.quantity,vehicleId:vehicle.id,vehicle:vehicle.name,eligible:!!eligibility.eligible,eligibilityKind:eligibility.kind,eligibilityReason:eligibility.reason,rawAmount:Math.round((eligibility.rawAmount+Number.EPSILON)*100)/100,eligibleAmount:Math.round((eligibility.amount+Number.EPSILON)*100)/100};
}
function buildCommissionTrace(rows,period){return (rows||[]).map(function(row,index){return commissionTraceEntry(row,index,period)});}
function commissionTraceForResult(baseTrace,result){
  var rate=comParseNum(result&&result.rate),employeeId=String(result&&result.employeeId||result&&result.personId||''),vehicleId=String(result&&result.vehicleId||'');
  return (baseTrace||[]).filter(function(t){return t.eligible&&String(t.vehicleId)===vehicleId}).map(function(t){var contribution=Math.round((t.eligibleAmount*(rate/100)+Number.EPSILON)*100)/100;return Object.assign({},t,{employeeId:employeeId,personId:employeeId,employee:String(result&&result.person||''),commissionType:String(result&&result.type||''),rate:rate,commissionContribution:contribution,assignmentSource:String(result&&result.assignmentSource||''),assignmentStatus:String(result&&result.assignmentStatus||'')});});
}
function commissionTraceSummary(trace){
  var out={version:'commission-trace-v1',totalRows:0,eligibleRows:0,excludedRows:0,invoiceCount:0,lineCount:0,eligibleAmount:0,commissionContribution:0,reasons:{}};var invoices={};
  (trace||[]).forEach(function(t){out.totalRows++;out.lineCount++;if(t.invoiceId)invoices[t.invoiceId]=1;if(t.eligible){out.eligibleRows++;out.eligibleAmount+=comParseNum(t.eligibleAmount);out.commissionContribution+=comParseNum(t.commissionContribution)}else{out.excludedRows++;out.reasons[t.eligibilityReason]=(out.reasons[t.eligibilityReason]||0)+1}});
  out.invoiceCount=Object.keys(invoices).length;out.eligibleAmount=Math.round((out.eligibleAmount+Number.EPSILON)*100)/100;out.commissionContribution=Math.round((out.commissionContribution+Number.EPSILON)*100)/100;return out;
}
window.PETATOECommissionTraceability={version:'1.0.0',build:buildCommissionTrace,forResult:commissionTraceForResult,summary:commissionTraceSummary,getSnapshotTrace:function(period){var snap=readSnaps()[String(period||'')];return snap&&snap.traceability?clone(snap.traceability):null;}};
function getConfig(period){const st=readStore();let cfg=clone(DEFAULT_CONFIG.rules[0].config);(st.rules||[]).sort((a,b)=>String(a.from).localeCompare(String(b.from))).forEach(r=>{if(String(r.from)<=String(period))cfg=clone(r.config)});return cfg}
function getCars(){const arr=[...new Set(dataRows().map(r=>rowCar(r)).filter(Boolean))].sort();return arr}
function dataPeriods(){return [...new Set(dataRows().map(r=>String(comDateISO(r.date)).slice(0,7)).filter(p=>/^\d{4}-\d{2}$/.test(p)))].sort()}
function latestPeriod(){const ps=dataPeriods();return ps.length?ps[ps.length-1]:ym(new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'))}
function periodRows(){const p=currentPeriod(), car=petBlock5568_q('comCar')?.value||'';return periodRowsFor(p,car)}
function periodRowsFor(period, carFilter){
  period=String(period||'').trim();
  carFilter=String(carFilter||'').trim();
  return dataRows().filter(function(r){
    var d=comDateISO(r.date);
    var ok=String(d).slice(0,7)===period;
    var vehicle=rowVehicleIdentity(r);
    return ok&&(!carFilter||vehicle.name===carFilter||vehicle.id===carFilter);
  });
}
function sumNetByCar(rows){const map={};rows.forEach(function(r){const vehicle=rowVehicleIdentity(r),amount=(r&&r.__commissionAmount!==undefined)?comParseNum(r.__commissionAmount):classifyCommissionRow(r).amount;if(!map[vehicle.id])map[vehicle.id]={vehicleId:vehicle.id,car:vehicle.name,amount:0};map[vehicle.id].amount+=amount;});Object.keys(map).forEach(function(id){map[id].amount=Math.round((map[id].amount+Number.EPSILON)*100)/100;});return map}
function invoiceCountByCar(rows){const map={},fallback={};(rows||[]).forEach(function(r){const id=rowVehicleId(r);if(!map[id])map[id]=new Set();fallback[id]=(fallback[id]||0)+1;const inv=String(r.invoice||'').trim();if(inv)map[id].add(inv);});const out={};Object.keys(fallback).forEach(function(id){out[id]=(map[id]&&map[id].size)?map[id].size:fallback[id];});return out}
function carCellHtml(car,count){return `<div class="com-car-cell"><span class="com-car-name">${safe(car)}</span><span class="com-invoice-count">عدد الفواتير: <b>${fmt0(count||0)}</b></span></div>`}
function activeEmployee(type,car,period,vehicleId){const st=readStore();const arr=(st.employees&&st.employees[type])||[];const wantedId=String(vehicleId||commissionResolveIdentity('vehicle',{car:car},st).id);const hit=arr.find(function(e){const eid=String(e.vehicleId||commissionResolveIdentity('vehicle',{car:e.car},st).id);return e.active!==false&&(eid===wantedId||String(e.car||'')===String(car))&&String(e.from||'0000-00')<=period&&(!e.to||String(e.to)>=period);});if(!hit)return {id:'unassigned-'+type+'-'+wantedId,name:'غير محدد',assigned:false,assignmentSource:'none'};const emp=commissionResolveIdentity('employee',hit,st);return {id:emp.id,name:hit.name||emp.name,assigned:true,assignmentSource:'vehicle_period_registry'}}
function commissionRowSalesIdentity(row,store){
  row=row||{};store=store||readStore();
  var explicitId=row.salespersonId||row.salesPersonId||row.salesperson_id||row.sales_person_id||row.salesRepId||row.sales_rep_id||row.salesEmployeeId||row.sales_employee_id||row.representativeId||row.representative_id||'';
  var explicitName=row.salesperson||row.salesPerson||row.sales_rep||row.salesRep||row.salesman||row.representative||row['مندوب']||row['مسؤول المبيعات']||'';
  if(!String(explicitId||'').trim()&&!String(explicitName||'').trim())return null;
  return commissionResolveIdentity('employee',{employeeId:explicitId,name:explicitName},store);
}
function salesEmployeeForVehicle(vehicleId,car,period,rows){
  const st=readStore(),wantedId=String(vehicleId||commissionResolveIdentity('vehicle',{car:car},st).id),invoicePeople={};
  (rows||[]).forEach(function(row){if(rowVehicleId(row)!==wantedId)return;var emp=commissionRowSalesIdentity(row,st);if(emp)invoicePeople[emp.id]=emp;});
  const invoiceIds=Object.keys(invoicePeople);
  if(invoiceIds.length===1){var invoiceEmp=invoicePeople[invoiceIds[0]];return {id:invoiceEmp.id,name:invoiceEmp.name,assigned:true,assignmentSource:'invoice_rows',assignmentStatus:'assigned'};}
  if(invoiceIds.length>1)return {id:'unassigned-sales-'+wantedId,name:'غير محدد',assigned:false,assignmentSource:'invoice_rows',assignmentStatus:'ambiguous_invoice_assignment',conflictingEmployeeIds:invoiceIds};
  const arr=(st.employees&&st.employees.sales)||[];
  const matches=arr.filter(function(e){
    if(e.active===false||!e.vehicleId&&!e.car)return false;
    const eid=String(e.vehicleId||commissionResolveIdentity('vehicle',{car:e.car},st).id);
    return (eid===wantedId||String(e.car||'')===String(car))&&String(e.from||'0000-00')<=period&&(!e.to||String(e.to)>=period);
  });
  if(matches.length===1){const emp=commissionResolveIdentity('employee',matches[0],st);return {id:emp.id,name:matches[0].name||emp.name,assigned:true,assignmentSource:'vehicle_period_registry',assignmentStatus:'assigned'};}
  if(matches.length>1)return {id:'unassigned-sales-'+wantedId,name:'غير محدد',assigned:false,assignmentSource:'vehicle_period_registry',assignmentStatus:'ambiguous_registry_assignment',conflictingEmployeeIds:matches.map(function(e){return commissionResolveIdentity('employee',e,st).id;})};
  return {id:'unassigned-sales-'+wantedId,name:'غير محدد',assigned:false,assignmentSource:'none',assignmentStatus:'unassigned'};
}
window.PETATOECommissionSalesAssignment={version:'1.0.0',resolve:function(vehicleId,car,period,rows){return clone(salesEmployeeForVehicle(vehicleId,car,period,rows));},rowIdentity:function(row){var emp=commissionRowSalesIdentity(row,readStore());return emp?clone(emp):null;}};
function segmentFor(amount,tiers){
  tiers=(tiers||[]).slice().sort((a,b)=>(+a.target||0)-(+b.target||0));
  amount=+amount||0;
  if(!tiers.length) return {idx:0,target:0,rate:0};
  // منطق الشرائح الصحيح: الشريحة الأولى من 0 حتى أول حد، ثم الثانية حتى الحد الثاني، ثم الثالثة لأي مبلغ أعلى.
  // العمولة تظل Flat Tier: النسبة المختارة تطبق على إجمالي مبيعات السيارة قبل الضريبة بالكامل.
  if(tiers.length===1 || amount <= (+tiers[0].target||0)) return {idx:1,target:+tiers[0].target||0,rate:+tiers[0].rate||0,from:0,to:+tiers[0].target||0};
  if(tiers.length===2 || amount <= (+tiers[1].target||0)) return {idx:2,target:+tiers[1].target||0,rate:+tiers[1].rate||0,from:+tiers[0].target||0,to:+tiers[1].target||0};
  return {idx:3,target:+tiers[2].target||0,rate:+tiers[2].rate||0,from:+tiers[1].target||0,to:null};
}
function segLabel(seg){return seg.idx===3?'الشريحة الثالثة':seg.idx===2?'الشريحة الثانية':seg.idx===1?'الشريحة الأولى':'غير مستحق'}
function segCls(seg){return seg.idx===3?'third':seg.idx===2?'second':seg.idx===1?'first':'none'}
function buildCalc(){
  return buildCalcForPeriod(currentPeriod(), petBlock5568_q('comCar')?.value||'');
};
function buildCalcForPeriod(p, carFilter){
  p=String(p||currentPeriod()).trim();
  carFilter=String(carFilter||'').trim();
  const sourceRows=periodRowsFor(p,carFilter), rowsForInvoice=commissionEligibleRows(sourceRows), invByCar=invoiceCountByCar(rowsForInvoice), eligibilitySummary=commissionEligibilitySummary(sourceRows), baseTrace=buildCommissionTrace(sourceRows,p);
  const snap=readSnaps()[p];
  if(snap && Array.isArray(snap.groomer) && Array.isArray(snap.driver) && Array.isArray(snap.sales)){
    const filterCar=arr=>(arr||[]).filter(function(x){const vehicle=commissionResolveIdentity('vehicle',{vehicleId:x.vehicleId,car:x.car},readStore());return !carFilter || String(x.car||'')===carFilter || vehicle.id===carFilter;});
    const addInv=arr=>filterCar(arr).map(function(x){const vehicle=commissionResolveIdentity('vehicle',{vehicleId:x.vehicleId,car:x.car},readStore());return Object.assign({},x,{invoiceCount:invByCar[vehicle.id]||x.invoiceCount||0});});
    const enrichIdentity=function(arr,type){return addInv(arr).map(function(x){const vehicle=commissionResolveIdentity('vehicle',{vehicleId:x.vehicleId,car:x.car},readStore()),employee=commissionResolveIdentity('employee',{employeeId:x.employeeId||x.personId,name:x.person},readStore());return Object.assign({},x,{car:x.car||vehicle.name,vehicleId:x.vehicleId||vehicle.id,person:x.person||employee.name,personId:x.personId||x.employeeId||employee.id,employeeId:x.employeeId||x.personId||employee.id,type:x.type||type});});};const g=enrichIdentity(snap.groomer,'groomer'), d=enrichIdentity(snap.driver,'driver'), sl=enrichIdentity(snap.sales,'sales');
    return {period:p,rows:rowsForInvoice,eligibilitySummary:snap.eligibilitySummary||eligibilitySummary,traceability:snap.traceability||{version:'commission-trace-v1',source:baseTrace,summary:commissionTraceSummary(baseTrace)},cfg:snap.config||getConfig(p),cars:[...new Set([...(g||[]),...(d||[]),...(sl||[])].map(x=>x.car).filter(Boolean))],groomer:g,driver:d,sales:sl,locked:true};
  }
  const rows=rowsForInvoice, cfg=getConfig(p), by=sumNetByCar(rows), vehicleIds=Object.keys(by).sort(function(a,b){return String(by[a].car).localeCompare(String(by[b].car),'ar');});
  function table(type){return vehicleIds.map(function(vehicleId){
    const car=by[vehicleId].car, amount=by[vehicleId].amount||0;
    const tiers=(cfg[type]||[]).slice().sort((a,b)=>(+a.target||0)-(+b.target||0));
    let sg=segmentFor(amount,tiers);

    // PETATOE v3.5 SALES COMMISSION THRESHOLD FIX:
    // مسؤول المبيعات لا يستحق أي عمولة إذا كانت مبيعات السيارة أقل من أول حد للشريحة.
    // عند الوصول إلى 40,000 أو أكثر، يدخل في الشريحة الأولى وتُحسب العمولة على كامل مبيعات السيارة.
    if(type==='sales'){
      const firstTarget=tiers.length?(+tiers[0].target||0):0;
      if(firstTarget>0 && amount < firstTarget){
        sg={idx:0,target:firstTarget,rate:0,from:0,to:firstTarget,notEligible:true};
      }
    }

    const vehicle=commissionResolveIdentity('vehicle',{vehicleId:vehicleId,car:car},readStore()), employee=type==='sales'?salesEmployeeForVehicle(vehicle.id,car,p,rows):activeEmployee(type==='groomer'?'groomers':'drivers',car,p,vehicle.id);
    if(type==='sales'&&!employee.assigned)sg=Object.assign({},sg,{rate:0,notEligible:true,assignmentBlocked:true});
    const commission=amount*((+sg.rate||0)/100);
    const result={type,person:employee.name,personId:employee.id,employeeId:employee.id,car:vehicle.name,vehicleId:vehicle.id,invoiceCount:invByCar[vehicle.id]||0,amount,seg:sg,rate:sg.rate,commission:Math.round((commission+Number.EPSILON)*100)/100,target:sg.target,ach:sg.target?amount/sg.target*100:0,assignmentSource:employee.assignmentSource||'',assignmentStatus:employee.assignmentStatus||(employee.assigned===false?'unassigned':'assigned')};result.trace=commissionTraceForResult(baseTrace,result);result.traceSummary=commissionTraceSummary(result.trace);return result
  })}
  const cars=vehicleIds.map(function(id){return by[id].car;});
  const groomer=table('groomer'),driver=table('driver'),sales=table('sales');const allResultTrace=[].concat.apply([],groomer.concat(driver,sales).map(function(r){return r.trace||[]}));return {period:p,rows,eligibilitySummary,traceability:{version:'commission-trace-v1',source:baseTrace,results:allResultTrace,summary:commissionTraceSummary(allResultTrace)},cfg,cars:cars,groomer:groomer,driver:driver,sales:sales,locked:false}
};
function total(rows){return rows.reduce((s,r)=>s+(+r.commission||0),0)}
function fmt(n){return window.PETATOENumber?PETATOENumber.fmt(n):(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function fmt0(n){return window.PETATOENumber?PETATOENumber.fmt0(n):(+n||0).toLocaleString('en-US')}
function petBlock5568_money(n){return fmt(n)+' SAR'}
function fillFilters(){
  const y=petBlock5568_q('comYear');
  let yearList=[];
  try{
    if(typeof years==='function') yearList=years(dataRows());
  }catch(e){yearList=[]}
  if(!Array.isArray(yearList) || !yearList.length){
    const nowY=new Date().getFullYear();
    yearList=[nowY-1,nowY,nowY+1];
  }
  yearList=[...new Set(yearList.map(v=>String(v).trim()).filter(Boolean))].sort();
  if(y){
    const oldVal=y.value;
    const preferred=(function(){
      try{const lp=latestPeriod();return lp?lp.slice(0,4):((typeof defaultYear==='function')?String(defaultYear(dataRows())):'')}catch(e){return ''}
    })();
    const nextYear=yearList.includes(oldVal)?oldVal:(yearList.includes(preferred)?preferred:yearList[yearList.length-1]);
    petBlock5568_replaceOptions(y, yearList.map(v=>({value:v,label:v})), nextYear);
  }
  const m=petBlock5568_q('comMonth');
  if(m){
    const oldM=m.value;
    const monthKeys=['january','february','march','april','may','june','july','august','september','october','november','december'];
    const arMonths=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const monthOptions=monthKeys.map((mm,i)=>{
      const val=String(i+1).padStart(2,'0');
      let label=arMonths[i];
      try{ if(window.MAR && window.MAR[mm]) label=(window.PETATOE_GLOBAL_SCREEN_TRANSLATOR&&window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName)?window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName(window.MAR[mm]):window.MAR[mm]; }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/commission-inline.js",e);}
      return {value:val,label:label};
    });
    const lp=latestPeriod();
    const preferredMonth=(petBlock5568_q('comYear')&&lp.slice(0,4)===String(petBlock5568_q('comYear').value))?lp.slice(5,7):String(new Date().getMonth()+1).padStart(2,'0');
    petBlock5568_replaceOptions(m, monthOptions, oldM || preferredMonth);
  }
  const car=petBlock5568_q('comCar');
  if(car){
    const val=car.value;
    const cars=getCars();
    petBlock5568_replaceOptions(car, [{value:'',label:'كل السيارات'}].concat(cars.map(c=>({value:c,label:c}))), cars.includes(val)?val:'');
  }
}
function renderCommissionKpis(calc){const g=total(calc.groomer), d=total(calc.driver), s=total(calc.sales), all=g+d+s;const el=petBlock5568_q('comKpis');if(!el)return;comSafeHtml(el,`<div class="com-kpi" style="--accent:var(--purple)"><span>إجمالي عمولات الجرومرز</span><b>${petBlock5568_money(g)}</b><small>${fmt0(calc.groomer.filter(x=>x.commission>0).length)} سيارة مستحقة</small></div><div class="com-kpi" style="--accent:var(--blue)"><span>إجمالي عمولات السائقين</span><b>${petBlock5568_money(d)}</b><small>${fmt0(calc.driver.filter(x=>x.commission>0).length)} سيارة مستحقة</small></div><div class="com-kpi" style="--accent:var(--cyan)"><span>عمولة مسؤول المبيعات</span><b>${petBlock5568_money(s)}</b><small>محسوبة لكل سيارة منفصلة</small></div><div class="com-kpi" style="--accent:var(--yellow)"><span>إجمالي تكلفة العمولات</span><b>${petBlock5568_money(all)}</b><small>على المبيعات قبل الضريبة</small></div>`,'commission kpis')}
function rowsHtml(rows,kind){if(!rows.length)return `<div class="com-empty">لا توجد بيانات مبيعات في هذا الشهر حسب فلتر السنة/الشهر/السيارة.<br><small>إجمالي السجلات المحملة: ${fmt0(dataRows().length)} — آخر شهر بيانات: ${safe(latestPeriod())}</small></div>`;let personHead=kind==='sales'?'مسؤول المبيعات':kind==='driver'?'السائق':'الجرومر';let body=rows.map((r,i)=>`<tr data-commission-select-row="${i}" data-commission-kind="${safe(kind)}" tabindex="0"><td>${i+1}</td><td>${safe(r.person)}</td><td>${carCellHtml(r.car,r.invoiceCount)}</td><td>${petBlock5568_money(r.amount)}</td><td><div class="com-progress"><i style="width:${Math.min(100,Math.max(0,r.ach)).toFixed(0)}%"></i></div><small>${fmt(r.ach)}%</small></td><td><span class="com-pill ${segCls(r.seg)}">${segLabel(r.seg)}</span></td><td>${fmt(r.rate)}%</td><td>${petBlock5568_money(r.commission)}</td></tr>`).join('');let t=total(rows);return `<div class="com-table"><table><thead><tr><th>#</th><th>${personHead}</th><th>السيارة</th><th>المبيعات قبل الضريبة</th><th>تحقيق الهدف</th><th>الشريحة</th><th>النسبة</th><th>العمولة</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="3">الإجمالي</td><td>${petBlock5568_money(rows.reduce((a,b)=>a+b.amount,0))}</td><td colspan="3"></td><td>${petBlock5568_money(t)}</td></tr></tfoot></table></div>`}
function renderSide(calc){const all=[...calc.groomer,...calc.driver,...calc.sales].sort((a,b)=>b.commission-a.commission);const top=all[0];const el=petBlock5568_q('comSide');if(!el)return;comSafeHtml(el,`<div class="com-detail-box com-tiers-box"><h3>الشرائح الحالية</h3>${['groomer','driver','sales'].map(type=>`<div class="row"><span>${type==='groomer'?'Groomer':type==='driver'?'Driver':'Sales'}</span><b>${calc.cfg[type].map(t=>fmt0(t.target)+' / '+fmt(t.rate)+'%').join(' | ')}</b></div>`).join('')}</div><div class="com-detail-box"><h3>تفاصيل سريعة</h3><div class="row"><span>الفترة</span><b>${calc.period}</b></div><div class="row"><span>عدد السيارات</span><b>${fmt0(calc.cars.length)}</b></div><div class="row"><span>مبيعات قبل الضريبة</span><b>${petBlock5568_money(calc.groomer.reduce((s,r)=>s+r.amount,0))}</b></div><div class="row"><span>أفضل عمولة</span><b>${top?petBlock5568_money(top.commission):petBlock5568_money(0)}</b></div><div class="row"><span>صاحب أفضل عمولة</span><b>${top?safe(top.person):'—'}</b></div></div>`,'commission side summary')}
function renderOverview(calc){
  const byCar={};
  (calc.groomer||[]).forEach(r=>{byCar[r.car]=byCar[r.car]||{};byCar[r.car].groomer=r});
  (calc.driver||[]).forEach(r=>{byCar[r.car]=byCar[r.car]||{};byCar[r.car].driver=r});
  (calc.sales||[]).forEach(r=>{byCar[r.car]=byCar[r.car]||{};byCar[r.car].sales=r});
  const cars=Object.keys(byCar).sort();
  const body=cars.map((car,i)=>{
    const g=byCar[car].groomer||{}, d=byCar[car].driver||{}, sl=byCar[car].sales||{};
    const amount=+((g.amount||d.amount||sl.amount)||0);
    const rowTotal=(+g.commission||0)+(+d.commission||0)+(+sl.commission||0);
    const rows=[
      {role:'المندوب',roleEn:'Sales',data:sl,cls:'sales'},
      {role:'السائق',roleEn:'Driver',data:d,cls:'driver'},
      {role:'الجرومر',roleEn:'Groomer',data:g,cls:'groomer'}
    ];
    return rows.map((r,idx)=>{
      const x=r.data||{};
      const invCount=idx===0?((sl.invoiceCount||d.invoiceCount||g.invoiceCount)||0):0;
      const main=idx===0?`<td rowspan="3">${i+1}</td><td rowspan="3">${carCellHtml(car,invCount)}</td><td rowspan="3">${petBlock5568_money(amount)}</td>`:'';
      const totalCell=idx===0?`<td rowspan="3">${petBlock5568_money(rowTotal)}</td>`:'';
      return `<tr class="com-overview-role-row ${r.cls}">${main}<td><span class="com-role-badge ${r.cls}">${r.role}<small>${r.roleEn}</small></span></td><td>${safe(x.person||'—')}</td><td><span class="com-pill ${segCls(x.seg||{})}">${segLabel(x.seg||{})}</span></td><td>${fmt(x.rate||0)}%</td><td>${petBlock5568_money(x.commission||0)}</td>${totalCell}</tr>`;
    }).join('');
  }).join('');
  const totals={amount:calc.groomer.reduce((a,b)=>a+(+b.amount||0),0),g:total(calc.groomer),d:total(calc.driver),s:total(calc.sales)};
  const empty=`<div class="com-empty">لا توجد بيانات مبيعات في هذا الشهر حسب فلتر السنة/الشهر/السيارة.<br><small>إجمالي السجلات المحملة: ${fmt0(dataRows().length)} — آخر شهر بيانات: ${safe(latestPeriod())}</small></div>`;
  const table=cars.length?`<div class="com-table"><table class="com-overview-stacked-table"><thead><tr><th>#</th><th>السيارة</th><th>المبيعات قبل الضريبة</th><th>القسم</th><th>الاسم</th><th>الشريحة</th><th>النسبة</th><th>العمولة</th><th>إجمالي عمولات السيارة</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="2">الإجمالي</td><td>${petBlock5568_money(totals.amount)}</td><td>المندوب</td><td colspan="3"></td><td>${petBlock5568_money(totals.s)}</td><td rowspan="3">${petBlock5568_money(totals.g+totals.d+totals.s)}</td></tr><tr><td colspan="3"></td><td>السائق</td><td colspan="3"></td><td>${petBlock5568_money(totals.d)}</td></tr><tr><td colspan="3"></td><td>الجرومر</td><td colspan="3"></td><td>${petBlock5568_money(totals.g)}</td></tr></tfoot></table></div>`:empty;
  return `<div class="com-overview-layout"><div class="com-overview-top"><div class="com-side" id="comSide"></div></div><div class="com-card com-overview-report"><h3>💰 نظرة عامة شاملة للعمولات</h3><p>تقرير بعرض الشاشة بالكامل يجمع كل السيارات، ويعرض المندوب والسائق والجرومر تحت بعض لكل سيارة بدل عرضهم جنب بعض. الشريحة الأولى محسوبة من 0 حتى أول حد، والعمولة Flat Tier على إجمالي مبيعات السيارة قبل الضريبة.</p>${table}</div></div>`;
}
function renderEmployees(){const st=readStore();const cars=getCars().map(function(name){return commissionResolveIdentity('vehicle',{car:name},st);});function table(type,label){const arr=st.employees[type]||[];return `<div class="com-card"><h3>${label}</h3><div class="com-form-grid"><div><label>الاسم</label><input id="${type}Name" placeholder="اسم الموظف"></div><div><label>السيارة</label><select id="${type}Car">${cars.map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('')}</select></div><div><label>من شهر</label><input id="${type}From" type="month" value="${currentPeriod()}"></div><div><label>إلى شهر</label><input id="${type}To" type="month"></div></div><div class="com-actions"><button class="btn btn-primary" data-commission-add-employee="${safe(type)}">➕ إضافة</button></div><div class="com-table"><table><thead><tr><th>#</th><th>الاسم</th><th>السيارة</th><th>من</th><th>إلى</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${arr.map((e,i)=>`<tr><td>${i+1}</td><td>${safe(e.name)}</td><td>${safe(e.car||'غير مرتبط')}</td><td>${safe(e.from||'—')}</td><td>${safe(e.to||'مستمر')}</td><td>${safe(e.assignmentStatus==='legacy_unassigned'?'يتطلب ربطًا':(e.active===false?'غير نشط':'نشط'))}</td><td><button class="btn btn-danger" data-commission-delete-employee="${safe(type)}" data-commission-index="${i}">حذف</button></td></tr>`).join('')||`<tr><td colspan="7">لا توجد أسماء محفوظة بعد.</td></tr>`}</tbody></table></div></div>`}return `<div class="com-note">الربط المالي يتم حسب السيارة والفترة. مسؤول المبيعات غير المرتبط بسيارة وفترة لا تُحتسب له عمولة، ولا يوجد اسم افتراضي أو تعيين عام.</div><div class="com-grid" style="grid-template-columns:1fr;gap:14px">${table('groomers','🐾 إدارة الجرومرز')}${table('drivers','🚚 إدارة السائقين')}${table('sales','📈 إدارة مسؤولي المبيعات')}</div>`}
function renderSettings(){const p=currentPeriod(), cfg=getConfig(p);function card(type,title){return `<div class="com-tier-card"><h4>${title}</h4>${[0,1,2].map(i=>`<div class="com-tier-row"><input id="${type}Target${i}" type="number" value="${cfg[type][i].target}" placeholder="Target"><input id="${type}Rate${i}" type="number" step="0.01" value="${cfg[type][i].rate}" placeholder="%"></div>`).join('')}</div>`}return `<div class="com-note">أي تعديل للشرائح يتم تطبيقه من الشهر المختار وما بعده فقط. الشهور السابقة تظل على إعداداتها القديمة أو Snapshot المقفل.</div><div class="com-settings-grid">${card('groomer','🐾 شرائح الجرومر')}${card('driver','🚚 شرائح السائق')}${card('sales','📈 شرائح مسؤول المبيعات')}</div><div class="com-actions"><button class="btn btn-green" data-commission-save-settings="1">💾 حفظ الشرائح من هذا الشهر وما بعده</button></div>`}

function commissionCurrentUser(){
  try{
    var eng=window.PETATOEPermissionEngine;
    if(eng&&typeof eng.currentUser==='function'){
      var ref=eng.currentUser();
      var resolved=(eng.resolveUser&&ref)?eng.resolveUser(ref):null;
      if(resolved&&(resolved.id||resolved.username||resolved.email)) return resolved;
      if(ref&&(ref.id||ref.username||ref.email)) return ref;
    }
  }catch(e){}
  try{
    if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function'){
      var au=window.PETATOEAuth.currentUser();
      if(au&&(au.id||au.username||au.email)) return au;
    }
  }catch(e){}
  try{
    if(window.__PETATOE_ACTIVE_USER__&&(window.__PETATOE_ACTIVE_USER__.id||window.__PETATOE_ACTIVE_USER__.username||window.__PETATOE_ACTIVE_USER__.email)) return window.__PETATOE_ACTIVE_USER__;
  }catch(e){}
  try{
    if(window.currentUser&&(window.currentUser.id||window.currentUser.username||window.currentUser.email)) return window.currentUser;
  }catch(e){}
  return {username:'Guest',fullName:'Guest',role:'guest'};
}
function commissionStableCanonical(value){
  if(value===null||value===undefined)return value===undefined?null:value;
  if(typeof value==='number')return Number.isFinite(value)?Number(value.toFixed(6)):null;
  if(typeof value==='string'||typeof value==='boolean')return value;
  if(Array.isArray(value)){
    return value.map(commissionStableCanonical).sort(function(a,b){
      var sa=JSON.stringify(a),sb=JSON.stringify(b);return sa<sb?-1:sa>sb?1:0;
    });
  }
  if(typeof value==='object'){
    var out={};Object.keys(value).sort().forEach(function(k){out[k]=commissionStableCanonical(value[k]);});return out;
  }
  return String(value);
}
function commissionStableStringify(value){return JSON.stringify(commissionStableCanonical(value));}
async function commissionSha256(value){
  var text=typeof value==='string'?value:commissionStableStringify(value);
  if(!(window.crypto&&window.crypto.subtle&&typeof TextEncoder!=='undefined'))throw new Error('SHA-256 unavailable');
  var digest=await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
}
function commissionSnapshotFinancialMaterial(snapshot){
  snapshot=snapshot||{};
  return {
    schemaVersion:'commission-snapshot-v4',period:String(snapshot.period||''),cars:Number(snapshot.cars||0),
    groomerTotal:Number(snapshot.groomerTotal||0),driverTotal:Number(snapshot.driverTotal||0),salesTotal:Number(snapshot.salesTotal||0),total:Number(snapshot.total||0),
    config:clone(snapshot.config||{}),groomer:clone(snapshot.groomer||[]),driver:clone(snapshot.driver||[]),sales:clone(snapshot.sales||[]),
    eligibilitySummary:clone(snapshot.eligibilitySummary||{}),traceability:clone(snapshot.traceability||{}),
    traceabilitySchemaVersion:String(snapshot.traceabilitySchemaVersion||'commission-trace-v1'),identitySchemaVersion:String(snapshot.identitySchemaVersion||'commission-identity-v1')
  };
}
function commissionSnapshotFromCalc(calc){
  var trace=calc.traceability||{version:'commission-trace-v1',source:buildCommissionTrace(calc.rows||[],calc.period),summary:commissionTraceSummary(buildCommissionTrace(calc.rows||[],calc.period))};
  return {schemaVersion:'commission-snapshot-v4',status:'locked',period:calc.period,cars:calc.cars.length,
    groomerTotal:total(calc.groomer),driverTotal:total(calc.driver),salesTotal:total(calc.sales),total:total(calc.groomer)+total(calc.driver)+total(calc.sales),
    config:clone(calc.cfg),groomer:clone(calc.groomer),driver:clone(calc.driver),sales:clone(calc.sales),
    eligibilitySummary:clone(calc.eligibilitySummary||commissionEligibilitySummary(calc.rows||[])),traceability:clone(trace),
    traceabilitySchemaVersion:'commission-trace-v1',identitySchemaVersion:'commission-identity-v1'};
}
function commissionSnapshotActor(){
  var u=commissionCurrentUser();return {id:String(u.id||u.user_id||''),username:String(u.username||''),name:String(u.fullName||u.name||u.username||''),email:String(u.email||'')};
}
async function commissionCertifySnapshot(calc,previous,replacementReason){
  var now=new Date(),snap=commissionSnapshotFromCalc(calc),prev=previous&&typeof previous==='object'?previous:null;
  var revision=prev?Math.max(1,Number(prev.revisionNumber||1)+1):1;
  var previousHistory=prev&&Array.isArray(prev.revisionHistory)?clone(prev.revisionHistory):[];
  if(prev&&prev.snapshotHash){previousHistory.push({snapshotId:String(prev.snapshotId||''),revisionNumber:Number(prev.revisionNumber||1),snapshotHash:String(prev.snapshotHash),previousSnapshotHash:String(prev.previousSnapshotHash||''),createdAt:String(prev.createdAt||prev.lockedAt||''),createdBy:clone(prev.createdBy||{})});}
  snap.revisionNumber=revision;snap.previousSnapshotHash=prev?String(prev.snapshotHash||''):'';snap.revisionHistory=previousHistory;
  snap.createdAt=now.toISOString();snap.createdBy=commissionSnapshotActor();snap.lockedAt=now.toISOString();snap.savedAt=now.toLocaleString('ar-EG');snap.replacementReason=prev?String(replacementReason||'').trim():'';
  snap.engineVersion='commission-engine-v4';snap.hashAlgorithm='SHA-256';
  snap.financialAudit={invoiceCount:Number((snap.traceability.summary&&snap.traceability.summary.invoiceCount)||0),lineCount:Number((snap.traceability.summary&&snap.traceability.summary.lineCount)||0),eligibleLineCount:Number((snap.eligibilitySummary&&snap.eligibilitySummary.eligibleRows)||0),excludedLineCount:Number((snap.eligibilitySummary&&snap.eligibilitySummary.excludedRows)||0),eligibleNet:Number((snap.eligibilitySummary&&snap.eligibilitySummary.eligibleNet)||0),commissionTotal:Number(snap.total||0)};
  snap.snapshotHash=await commissionSha256(commissionSnapshotFinancialMaterial(snap));
  snap.snapshotId='commission-'+String(snap.period||'unknown')+'-r'+revision+'-'+snap.snapshotHash.slice(0,12);
  snap.certification={version:'commission-certification-v1',status:'certified',verifiedAt:now.toISOString(),replacementReason:snap.replacementReason||''};
  return snap;
}
async function commissionVerifySnapshot(snapshotOrPeriod){
  var snap=typeof snapshotOrPeriod==='string'?readSnaps()[snapshotOrPeriod]:snapshotOrPeriod;
  if(!snap)return {ok:false,valid:false,error:'SNAPSHOT_NOT_FOUND'};
  if(!snap.snapshotHash)return {ok:false,valid:false,error:'SNAPSHOT_HASH_MISSING',period:snap.period||''};
  var actual=await commissionSha256(commissionSnapshotFinancialMaterial(snap));
  return {ok:true,valid:actual===String(snap.snapshotHash),period:snap.period||'',snapshotId:snap.snapshotId||'',revisionNumber:Number(snap.revisionNumber||1),expectedHash:String(snap.snapshotHash),actualHash:actual};
}
async function commissionCompareSnapshots(a,b){
  var left=typeof a==='string'?readSnaps()[a]:a,right=typeof b==='string'?readSnaps()[b]:b;
  if(!left||!right)return {ok:false,equal:false,error:'SNAPSHOT_NOT_FOUND'};
  var lh=await commissionSha256(commissionSnapshotFinancialMaterial(left)),rh=await commissionSha256(commissionSnapshotFinancialMaterial(right));
  return {ok:true,equal:lh===rh,leftHash:lh,rightHash:rh,leftPeriod:left.period||'',rightPeriod:right.period||''};
}
async function commissionReproduceSnapshot(period){
  period=String(period||currentPeriod());var snap=readSnaps()[period];if(!snap)return {ok:false,reproducible:false,error:'SNAPSHOT_NOT_FOUND',period:period};
  var oldYear=petBlock5568_q('comYear')&&petBlock5568_q('comYear').value,oldMonth=petBlock5568_q('comMonth')&&petBlock5568_q('comMonth').value;
  var parts=period.split('-');if(petBlock5568_q('comYear'))petBlock5568_q('comYear').value=parts[0]||'';if(petBlock5568_q('comMonth'))petBlock5568_q('comMonth').value=parts[1]||'';
  try{var calc=buildCalc(),candidate=commissionSnapshotFromCalc(calc);var expected=await commissionSha256(commissionSnapshotFinancialMaterial(snap)),actual=await commissionSha256(commissionSnapshotFinancialMaterial(candidate));return {ok:true,reproducible:expected===actual,period:period,snapshotHash:expected,reproducedHash:actual};}
  finally{if(petBlock5568_q('comYear'))petBlock5568_q('comYear').value=oldYear;if(petBlock5568_q('comMonth'))petBlock5568_q('comMonth').value=oldMonth;}
}
window.PETATOECommissionSnapshotCertification={version:'1.0.0',hashSnapshot:async function(s){return commissionSha256(commissionSnapshotFinancialMaterial(s));},verifySnapshot:commissionVerifySnapshot,compareSnapshots:commissionCompareSnapshots,reproduceSnapshot:commissionReproduceSnapshot,financialMaterial:function(s){return clone(commissionSnapshotFinancialMaterial(s));}};
function commissionIsAdminUser(u){
  u=u||commissionCurrentUser();
  var role=String(u.role||'').toLowerCase();
  var name=String(u.username||'').toLowerCase();
  return role==='superadmin'||role==='admin'||name==='admin'||u.id==='u_admin';
}
function commissionCanManageFinancial(){
  var user=commissionCurrentUser();
  if(commissionIsAdminUser(user))return true;
  try{var p=window.PETATOEPermissions;if(p&&typeof p.can==='function'&&p.can(user,'commissions','edit'))return true;}catch(_e){}
  return false;
}
function commissionRequireFinancialPermission(){
  if(commissionCanManageFinancial())return true;
  toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('ليس لديك صلاحية لتنفيذ هذا الإجراء'):'ليس لديك صلاحية لتنفيذ هذا الإجراء');
  return false;
}
function commissionNormName(v){return String(v||'').trim().replace(/\s+/g,' ').toLowerCase();}
function commissionKindLabel(kind){return kind==='groomer'?'حلاق':kind==='driver'?'سائق':kind==='sales'?'مندوب':'غير محدد';}
function commissionPayrollEmployees(){
  try{
    var f=window.PETATOEPayrollReadFacade;
    if(f&&typeof f.employees==='function'){var a=f.employees()||[];if(a.length)return a;}
  }catch(e){}
  return [];
}
function commissionUserKeys(u){
  u=u||commissionCurrentUser();
  return [u.id,u.userId,u.uid,u.supabase_id,u.username,u.login,u.email,u.phone,u.fullName,u.name,u.userKey]
    .map(function(x){return String(x||'').trim().toLowerCase();}).filter(Boolean);
}
function commissionEmployeeAliasesForUser(user){
  user=user||commissionCurrentUser();
  var keys=commissionUserKeys(user), out=[];
  function add(v){v=String(v||'').trim();if(v)out.push(v)}
  [user.fullName,user.username,user.name,user.commissionOwner,user.commissionEmployeeName,user.email].forEach(add);
  commissionPayrollEmployees().forEach(function(e){
    var empKeys=[e.userId,e.user_id,e.userKey,e.username,e.login,e.email,e.phone,e.linkedUserId,e.linked_user_id]
      .map(function(x){return String(x||'').trim().toLowerCase();}).filter(Boolean);
    var hit=empKeys.some(function(k){return keys.indexOf(k)>-1;});
    if(hit){
      [e.name,e.employeeName,e.fullName,e.commissionEmployeeName,e.userKey,e.username].forEach(add);
    }
  });
  var seen={};
  return out.map(commissionNormName).filter(function(x){if(!x||seen[x])return false;seen[x]=1;return true;});
}
function commissionCanAccessCar(user,car){
  if(commissionIsAdminUser(user))return true;
  try{
    var p=window.PETATOEPermissions;
    if(p&&typeof p.canAccessVehicle==='function')return !!p.canAccessVehicle(user,car);
  }catch(e){}
  return false;
}
function commissionAllowedCars(){
  var user=commissionCurrentUser();
  var cars=getCars();
  if(commissionIsAdminUser(user))return cars;
  return cars.filter(function(c){return commissionCanAccessCar(user,c);});
}
function commissionApplyDataScope(rows,user){
  user=user||commissionCurrentUser();
  if(commissionIsAdminUser(user))return rows||[];
  var aliases=commissionEmployeeAliasesForUser(user);
  return (rows||[]).filter(function(r){
    return aliases.indexOf(commissionNormName(r.person))>-1 && commissionCanAccessCar(user,r.car);
  });
}

function commissionStatementFilters(){
  var now=new Date();
  var yEl=petBlock5568_q('comStatementYear');
  var mEl=petBlock5568_q('comStatementMonth');
  var cEl=petBlock5568_q('comStatementCar');
  var pEl=petBlock5568_q('comStatementPerson');
  var y=String((yEl&&yEl.value)||now.getFullYear()).trim();
  var m=String((mEl&&mEl.value)||String(now.getMonth()+1).padStart(2,'0')).trim();
  var car=String((cEl&&cEl.value)||'').trim();
  var person=String((pEl&&pEl.value)||'').trim();
  if(y!=='all' && !/^\d{4}$/.test(y)) y=String(now.getFullYear());
  if(m!=='all'){
    m=String(m).padStart(2,'0');
    if(!/^\d{2}$/.test(m) || +m<1 || +m>12) m=String(now.getMonth()+1).padStart(2,'0');
  }
  return {year:y,month:m,car:car,person:person};
}
function commissionStatementPeriod(){
  var f=commissionStatementFilters();
  if(f.year==='all' && f.month==='all') return 'all';
  if(f.year==='all') return 'كل السنوات-'+f.month;
  if(f.month==='all') return f.year+'-كل الشهور';
  return f.year+'-'+f.month;
}
function commissionStatementPeriods(){
  var f=commissionStatementFilters();
  var periods=[];
  try{ periods=dataPeriods(); }catch(e){ periods=[]; }
  var nowYm=ym(new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'));
  periods.push(nowYm);
  periods=[...new Set(periods.filter(function(p){return /^\d{4}-\d{2}$/.test(String(p));}))].sort();
  var out=periods.filter(function(p){
    p=String(p);
    var okY=(f.year==='all'||p.slice(0,4)===f.year);
    var okM=(f.month==='all'||p.slice(5,7)===f.month);
    return okY&&okM;
  });
  if(!out.length && f.year!=='all' && f.month!=='all') out=[f.year+'-'+f.month];
  return out;
}
function buildCommissionStatementCalc(){
  var f=commissionStatementFilters();
  var periods=commissionStatementPeriods();
  return periods.map(function(p){return buildCalcForPeriod(p,f.car);});
}
function commissionStatementOptions(calc){
  var all=commissionStatementAllRows(calc||buildCommissionStatementCalc());
  var seen={}, out=[];
  all.forEach(function(r){
    var name=String((r&&r.person)||'').trim();
    if(!name || name==='غير محدد') return;
    var key=commissionNormName(name);
    if(seen[key]) return;
    seen[key]=true;
    out.push(name);
  });
  return out.sort(function(a,b){return String(a).localeCompare(String(b),'ar');});
}
function fillStatementFilters(calc, preserve){
  var now=new Date();
  var yEl=petBlock5568_q('comStatementYear');
  var mEl=petBlock5568_q('comStatementMonth');
  var cEl=petBlock5568_q('comStatementCar');
  var pEl=petBlock5568_q('comStatementPerson');
  var currentY=String(now.getFullYear());
  var currentM=String(now.getMonth()+1).padStart(2,'0');
  if(yEl){
    var oldY=String((preserve&&preserve.year)||yEl.value||currentY);
    var ys=[];
    try{ ys=dataPeriods().map(function(p){return String(p).slice(0,4);}); }catch(e){ys=[];}
    ys.push(currentY);
    ys=[...new Set(ys.filter(Boolean))].sort();
    var yOpts=[{value:'all',label:'كل السنوات'}].concat(ys.map(function(y){return {value:y,label:y};}));
    var yExists=oldY==='all'||ys.indexOf(oldY)>-1;
    petBlock5568_replaceOptions(yEl, yOpts, yExists?oldY:currentY);
  }
  if(mEl){
    var oldM=String((preserve&&preserve.month)||mEl.value||currentM);
    if(oldM!=='all') oldM=oldM.padStart(2,'0');
    var arMonths=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var opts=[{value:'all',label:'كل الشهور'}].concat(arMonths.map(function(lbl,i){var val=String(i+1).padStart(2,'0');return {value:val,label:lbl};}));
    var mExists=oldM==='all'||/^\d{2}$/.test(oldM);
    petBlock5568_replaceOptions(mEl, opts, mExists?oldM:currentM);
  }
  if(cEl){
    var oldC=String((preserve&&preserve.car)||cEl.value||'');
    var cars=[];
    try{ cars=commissionAllowedCars(); }catch(e){cars=[];}
    var isAdmin=commissionIsAdminUser(commissionCurrentUser());
    var cOpts=(isAdmin?[{value:'',label:'كل السيارات'}]:[]).concat(cars.map(function(c){return {value:c,label:c};}));
    var cExists=!oldC || cars.indexOf(oldC)>-1;
    petBlock5568_replaceOptions(cEl, cOpts, cExists?(oldC||(!isAdmin&&cars.length===1?cars[0]:'')):(!isAdmin&&cars.length===1?cars[0]:''));
  }
  if(pEl){
    var oldP=String((preserve&&preserve.person)||pEl.value||'');
    var people=commissionStatementOptions(calc||buildCommissionStatementCalc());
    var optsP=[{value:'',label:'كل الموظفين'}].concat(people.map(function(n){return {value:n,label:n};}));
    var exists=!oldP || people.some(function(n){return commissionNormName(n)===commissionNormName(oldP);});
    petBlock5568_replaceOptions(pEl, optsP, exists?oldP:'');
  }
}

function commissionStatementAllRows(calc){
  var out=[];
  var calcs=Array.isArray(calc)?calc:[calc];
  calcs.filter(Boolean).forEach(function(c){
    function push(kind,arr){
      (arr||[]).forEach(function(r){
        var commission=+r.commission||0;
        out.push({kind:kind,type:commissionKindLabel(kind),person:r.person||'غير محدد',car:r.car||'',invoiceCount:+r.invoiceCount||0,amount:+r.amount||0,rate:+r.rate||0,commission:commission,segment:segLabel(r.seg||{}),period:(c&&c.period)||currentPeriod()});
      });
    }
    push('groomer',c.groomer);push('driver',c.driver);push('sales',c.sales);
  });
  return out;
}
function commissionStatementVisibleRows(calc){
  var user=commissionCurrentUser(), admin=commissionIsAdminUser(user), all=commissionStatementAllRows(calc), personVal=(petBlock5568_q('comStatementPerson')&&petBlock5568_q('comStatementPerson').value)||'';
  if(!admin){
    return commissionApplyDataScope(all,user);
  }
  return all.filter(function(r){return !personVal||commissionNormName(r.person)===commissionNormName(personVal);});
}

function renderCommissionStatement(calc){
  var user=commissionCurrentUser(), admin=commissionIsAdminUser(user), rows=commissionStatementVisibleRows(calc), totalAmount=rows.reduce(function(s,r){return s+r.amount;},0), totalCommission=rows.reduce(function(s,r){return s+r.commission;},0), avgRate=totalAmount?((totalCommission/totalAmount)*100):0;
  var f=commissionStatementFilters();
  var selectedPerson=f.person||'';
  var yearLabel=f.year==='all'?'كل السنوات':f.year;
  var monthNames={'all':'كل الشهور','01':'يناير','02':'فبراير','03':'مارس','04':'أبريل','05':'مايو','06':'يونيو','07':'يوليو','08':'أغسطس','09':'سبتمبر','10':'أكتوبر','11':'نوفمبر','12':'ديسمبر'};
  var monthLabel=monthNames[f.month]||f.month;
  var carLabel=f.car||'كل السيارات';
  var filters=`<div class="com-toolbar com-statement-toolbar"><label>السنة</label><select id="comStatementYear" data-commission-statement="year"></select><label>الشهر</label><select id="comStatementMonth" data-commission-statement="month"></select><label>السيارة</label><select id="comStatementCar" data-commission-statement="car"></select>${admin?`<label>الموظف</label><select id="comStatementPerson" data-commission-statement="person"><option value="">كل الموظفين</option></select>`:''}</div>`;
  var body=rows.map(function(r,i){return `<tr><td>${i+1}</td><td>${safe(r.period)}</td><td>${safe(r.person)}</td><td>${carCellHtml(r.car,r.invoiceCount)}</td><td>${safe(r.segment)}</td><td>${petBlock5568_money(r.amount)}</td><td>${fmt(r.rate)}%</td><td>${petBlock5568_money(r.commission)}</td></tr>`}).join('')||`<tr><td colspan="8">لا توجد عمولات مطابقة للفلاتر الحالية أو للمستخدم الحالي.</td></tr>`;
  return `<div class="com-card com-statement-card com-statement-print" id="commissionStatementExportArea" data-commission-print="1"><div class="com-statement-print-head"><h3>📄 كشف العمولة</h3><div class="com-statement-print-meta"><span>السنة: ${safe(yearLabel)}</span><span>الشهر: ${safe(monthLabel)}</span><span>السيارة: ${safe(carLabel)}</span>${selectedPerson?`<span>الموظف: ${safe(selectedPerson)}</span>`:''}</div></div>${filters}<div class="com-kpis com-statement-kpis"><div class="com-kpi" style="--accent:var(--blue)"><span>إجمالي المبيعات / الخدمات</span><b>${petBlock5568_money(totalAmount)}</b><small>${fmt0(rows.length)} بند عمولة</small></div><div class="com-kpi" style="--accent:var(--yellow)"><span>متوسط نسبة العمولة</span><b>${fmt(avgRate)}%</b><small>حسب إجمالي العمولة إلى المبيعات</small></div><div class="com-kpi" style="--accent:var(--cyan)"><span>إجمالي العمولة</span><b>${petBlock5568_money(totalCommission)}</b><small>إجمالي العمولة المحسوبة</small></div></div><div class="com-actions"><button class="btn btn-green" data-export-type="excel" data-export-target="#commissionStatementExportArea" data-export-filename="PETATOE_commission_statement" data-export-title="كشف العمولة">📊 Excel</button><button class="btn btn-danger" data-export-type="pdf" data-export-target="#commissionStatementExportArea" data-export-filename="PETATOE_commission_statement" data-export-title="كشف العمولة">📄 PDF</button><button class="btn btn-ghost" data-export-type="print" data-export-target="#commissionStatementExportArea" data-export-title="كشف العمولة">🖨️ طباعة</button></div><div class="com-table"><table><thead><tr><th>#</th><th>الفترة</th><th>الموظف</th><th>السيارة</th><th>الشريحة</th><th>المبيعات قبل الضريبة</th><th>النسبة</th><th>العمولة</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="5">الإجمالي</td><td>${petBlock5568_money(totalAmount)}</td><td>${fmt(avgRate)}%</td><td>${petBlock5568_money(totalCommission)}</td></tr></tfoot></table></div></div>`;
}

function renderArchive(){const snaps=readSnaps();const keys=Object.keys(snaps).sort().reverse();return `<div class="com-card"><h3>📚 أرشيف العمولات الشهرية</h3><p>كل شهر مقفل يحتفظ بالأرقام والإعدادات كما كانت وقت القفل.</p><div class="com-table"><table><thead><tr><th>الشهر</th><th>السيارات</th><th>Groomers</th><th>Drivers</th><th>Sales</th><th>الإجمالي</th><th>تاريخ الحفظ</th><th>إجراء</th></tr></thead><tbody>${keys.map(k=>{const s=snaps[k];return `<tr><td>${k}</td><td>${fmt0(s.cars||0)}</td><td>${petBlock5568_money(s.groomerTotal||0)}</td><td>${petBlock5568_money(s.driverTotal||0)}</td><td>${petBlock5568_money(s.salesTotal||0)}</td><td>${petBlock5568_money(s.total||0)}</td><td>${safe(s.savedAt||'')}</td><td><button type="button" class="btn btn-danger" data-commission-action="unlock" data-commission-period="${safe(k)}">🔓 إلغاء قفل الشهر</button></td></tr>`}).join('')||'<tr><td colspan="8">لا توجد شهور مقفلة بعد.</td></tr>'}</tbody></table></div></div>`}
window.renderCommissionSystem=function(){hydrateCommissionRemoteOnce();fillFilters();const calc=buildCalc();renderCommissionKpis(calc);document.querySelectorAll('.com-tab').forEach(b=>b.classList.toggle('active',b.dataset.comTab===comTab));let body='';if(comTab==='overview')body=renderOverview(calc);if(comTab==='groomer')body=`<div class="com-card"><h3>🐾 تقرير عمولات الجرومرز</h3><p>لكل سيارة حسب مبيعاتها قبل الضريبة.</p>${rowsHtml(calc.groomer,'groomer')}</div>`;if(comTab==='driver')body=`<div class="com-card"><h3>🚚 تقرير عمولات السائقين</h3><p>لكل سيارة حسب مبيعاتها قبل الضريبة.</p>${rowsHtml(calc.driver,'driver')}</div>`;if(comTab==='sales')body=`<div class="com-card"><h3>📈 تقرير عمولة مسؤول المبيعات</h3><p>يتم حساب كل سيارة منفصلة: أقل من 40,000 لا يستحق عمولة، ومن 40,000 فأكثر تُحسب الشريحة على كامل مبيعات السيارة.</p>${rowsHtml(calc.sales,'sales')}</div>`;if(comTab==='employees')body=renderEmployees();if(comTab==='settings')body=renderSettings();if(comTab==='archive')body=renderArchive();const area=petBlock5568_q('comArea');if(area)comSafeHtml(area,body,'commission tab body');renderSide(calc)};
window.setCommissionTab=function(t){comTab=t;renderCommissionSystem()};
window.commissionSelectRow=function(i,kind){const calc=buildCalc();const arr=kind==='groomer'?calc.groomer:kind==='driver'?calc.driver:calc.sales;const r=arr[i];if(!r)return;const side=petBlock5568_q('comSide');if(side){comSafeHtml(side,`<div class="com-detail-box"><h3>📌 تفاصيل السيارة</h3><div class="row"><span>السيارة</span><b>${safe(r.car)}</b></div><div class="row"><span>عدد الفواتير</span><b>${fmt0(r.invoiceCount||0)}</b></div><div class="row"><span>الموظف</span><b>${safe(r.person)}</b></div><div class="row"><span>المبيعات قبل الضريبة</span><b>${petBlock5568_money(r.amount)}</b></div><div class="row"><span>الهدف الحالي</span><b>${petBlock5568_money(r.target)}</b></div><div class="row"><span>تحقيق الهدف</span><b>${fmt(r.ach)}%</b></div><div class="row"><span>الشريحة</span><b>${segLabel(r.seg)}</b></div><div class="row"><span>النسبة</span><b>${fmt(r.rate)}%</b></div><div class="row"><span>العمولة</span><b>${petBlock5568_money(r.commission)}</b></div></div>`,'commission selected row')}}
window.commissionAddEmployee=async function(type){if(!commissionRequireFinancialPermission())return;const st=readStore();st.employees=st.employees||{groomers:[],drivers:[],sales:[]};st.employees[type]=st.employees[type]||[];const name=petBlock5568_q(type+'Name')?.value?.trim();if(!name){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('اكتب الاسم أولاً'):'اكتب الاسم أولاً');return}const carId=petBlock5568_q(type+'Car')?.value,vehicle=commissionResolveIdentity('vehicle',{vehicleId:carId},st),car=vehicle.name,from=petBlock5568_q(type+'From')?.value||currentPeriod(),to=petBlock5568_q(type+'To')?.value||'';if(!carId){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('اختر السيارة'):'اختر السيارة');return}const overlaps=st.employees[type].some(function(e){if(e.active===false)return false;const eid=String(e.vehicleId||commissionResolveIdentity('vehicle',{car:e.car},st).id);if(eid!==String(vehicle.id))return false;const eFrom=String(e.from||'0000-00'),eTo=String(e.to||'9999-99'),nTo=String(to||'9999-99');return eFrom<=nTo&&from<=eTo;});if(overlaps){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('يوجد موظف مرتبط بنفس السيارة في فترة متداخلة'):'يوجد موظف مرتبط بنفس السيارة في فترة متداخلة');return}const employee=commissionResolveIdentity('employee',{name:name},st);st.employees[type].push({name:name,employeeId:employee.id,car:car,vehicleId:vehicle.id,from:from,to:to,active:true,assignmentStatus:'assigned'});try{await writeStore(st);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم حفظ الاسم'):'تم حفظ الاسم')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission employee save failed',e);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر حفظ إعدادات العمولات في Supabase'):'تعذر حفظ إعدادات العمولات في Supabase')}renderCommissionSystem()}
window.commissionDeleteEmployee=async function(type,i){if(!commissionRequireFinancialPermission())return;const st=readStore();if(st.employees&&st.employees[type]){st.employees[type].splice(i,1);try{await writeStore(st);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم الحذف'):'تم الحذف')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission employee delete failed',e);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر حفظ إعدادات العمولات في Supabase'):'تعذر حفظ إعدادات العمولات في Supabase')}renderCommissionSystem()}}
window.commissionSaveSettings=async function(){if(!commissionRequireFinancialPermission())return;const st=readStore(), p=currentPeriod();function get(type){return [0,1,2].map(i=>({target:parseNum(petBlock5568_q(type+'Target'+i)?.value),rate:parseNum(petBlock5568_q(type+'Rate'+i)?.value)})).filter(x=>x.target>0).sort((a,b)=>a.target-b.target)}const cfg={groomer:get('groomer'),driver:get('driver'),sales:get('sales')};if(cfg.groomer.length<3||cfg.driver.length<3||cfg.sales.length<3){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('يجب إدخال 3 شرائح لكل فئة'):'يجب إدخال 3 شرائح لكل فئة');return}st.rules=(st.rules||[]).filter(r=>r.from!==p);st.rules.push({from:p,config:cfg,savedAt:new Date().toISOString()});try{await writeStore(st);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم حفظ الشرائح من الشهر المختار وما بعده'):'تم حفظ الشرائح من الشهر المختار وما بعده')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission settings save failed',e);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر حفظ إعدادات العمولات في Supabase'):'تعذر حفظ إعدادات العمولات في Supabase')}renderCommissionSystem()}
window.commissionLockMonth=async function(){if(!commissionRequireFinancialPermission())return;const calc=buildCalc(),snaps=readSnaps(),previous=snaps[calc.period]||null;let replacementReason='';if(previous){if(!confirm(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('الشهر مقفول بالفعل. هل تريد استبدال Snapshot المحفوظ؟'):'الشهر مقفول بالفعل. هل تريد استبدال Snapshot المحفوظ؟'))return;replacementReason=String(prompt(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('اكتب سبب استبدال Snapshot المحفوظ'):'اكتب سبب استبدال Snapshot المحفوظ','')||'').trim();if(!replacementReason){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('سبب الاستبدال مطلوب'):'سبب الاستبدال مطلوب');return}}try{const certified=await commissionCertifySnapshot(calc,previous,replacementReason);snaps[calc.period]=certified;await writeSnaps(snaps);const verification=await commissionVerifySnapshot(certified);if(!verification.valid)throw new Error('Commission snapshot verification failed');toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم قفل الشهر وحفظ Snapshot'):'تم قفل الشهر وحفظ Snapshot');renderCommissionSystem()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission snapshot lock failed',e);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر حفظ قفل الشهر في Supabase'):'تعذر حفظ قفل الشهر في Supabase')} }
window.commissionUnlockMonth=async function(period){if(!commissionRequireFinancialPermission())return;period=String(period||'').trim();if(!period){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لم يتم تحديد الشهر'):'لم يتم تحديد الشهر');return}const snaps=readSnaps();if(!snaps[period]){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('الشهر غير موجود في الأرشيف'):'الشهر غير موجود في الأرشيف');renderCommissionSystem();return}if(!confirm(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('هل تريد إلغاء قفل شهر '):'هل تريد إلغاء قفل شهر '+period+'؟ سيتم حذف Snapshot المحفوظ فقط، ويمكنك إعادة احتسابه وقفله من البيانات الحالية.'))return;const removed=snaps[period];delete snaps[period];try{await writeSnaps(snaps);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم إلغاء قفل الشهر من الأرشيف'):'تم إلغاء قفل الشهر من الأرشيف');renderCommissionSystem()}catch(e){snaps[period]=removed;window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('commission snapshot unlock failed',e);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر إلغاء قفل الشهر في Supabase'):'تعذر إلغاء قفل الشهر في Supabase')} }
window.commissionRecalcMonth=function(){toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم إعادة احتساب الشهر من البيانات الحالية بدون تغيير أي تقرير قديم'):'تم إعادة احتساب الشهر من البيانات الحالية بدون تغيير أي تقرير قديم');renderCommissionSystem()}
function injectPanel(){if(petBlock5568_q('commissions'))return;const page=document.querySelector('section.page');if(!page)return;const panel=document.createElement('div');panel.id='commissions';panel.className='panel';comSafeHtml(panel,`<div class="com-page"><div class="com-hero"><div><h2>💰 نظام العمولات</h2><p>إدارة وحساب عمولات الجرومرز والسائقين ومسؤول المبيعات على مبيعات السيارات قبل الضريبة، مع حفظ شهري مستقل.</p></div><div class="com-icon">💰</div></div><div class="com-toolbar"><label>السنة</label><select id="comYear" data-commission-render="1"></select><label>الشهر</label><select id="comMonth" data-commission-render="1"></select><label>السيارة</label><select id="comCar" data-commission-render="1"><option value="">كل السيارات</option></select><button class="btn btn-primary" data-commission-action="recalc">🔄 إعادة احتساب الشهر</button><button class="btn btn-green" data-commission-action="lock">🔒 قفل الشهر</button></div><div class="com-kpis" id="comKpis"></div><div class="com-tabs"><button class="com-tab active" data-com-tab="overview">نظرة عامة</button><button class="com-tab" data-com-tab="groomer">عمولات الجرومرز</button><button class="com-tab" data-com-tab="driver">عمولات السائقين</button><button class="com-tab" data-com-tab="sales">مسؤول المبيعات</button><button class="com-tab" data-com-tab="employees">إدارة الأسماء</button><button class="com-tab" data-com-tab="settings">إعدادات الشرائح</button><button class="com-tab" data-com-tab="archive">الأرشيف</button></div><div id="comArea"></div></div>`,'commission panel shell');page.appendChild(panel)}
function injectNav(){
  const nav=petBlock5568_q('nav');
  if(!nav) return;
  let comBtn=nav.querySelector('[data-tab="commissions"]');
  if(!comBtn){
    comBtn=document.createElement('button');
    comBtn.dataset.tab='commissions';
    comBtn.textContent='💰 نظام العمولات';
    nav.insertBefore(comBtn, nav.querySelector('[data-tab="records"]')||null);
  }
  if(!nav.querySelector('[data-tab="commissionStatement"]')){
    const stmt=document.createElement('button');
    stmt.dataset.tab='commissionStatement';
    stmt.textContent='📄 كشف العمولة';
    if(comBtn.parentNode) comBtn.parentNode.insertBefore(stmt, comBtn.nextSibling);
    else nav.insertBefore(stmt, nav.querySelector('[data-tab="fleet"]')||null);
  }
}
function renderCommissionStatementPage(){
  injectCommissionStatementPanel();
  fillStatementFilters();
  var preserve=commissionStatementFilters();
  var calc=buildCommissionStatementCalc();
  var area=petBlock5568_q('commissionStatementArea');
  if(area) comSafeHtml(area, renderCommissionStatement(calc), 'commission statement render');
  fillStatementFilters(calc, preserve);
}
window.renderCommissionStatementPage=renderCommissionStatementPage;
function injectCommissionStatementPanel(){
  if(petBlock5568_q('commissionStatement')) return;
  const page=document.querySelector('section.page');
  if(!page) return;
  const panel=document.createElement('div');
  panel.id='commissionStatement';
  panel.className='panel';
  comSafeHtml(panel,`<div class="section-head"><div><h2>📄 كشف العمولة</h2></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="window.renderCommissionStatementPage&&window.renderCommissionStatementPage()">🔄 تحديث</button></div></div><div id="commissionStatementArea"></div>`,'commission statement shell');
  page.appendChild(panel);
}
function patchTab(){document.addEventListener('petatoe:tabchange',function(e){
  var tab=e.detail&&e.detail.tabId;
  if(tab==='commissions'){injectPanel();renderCommissionSystem();}
  if(tab==='commissionStatement'){renderCommissionStatementPage();}
})}

function ensureCommissionDelegation(){
  if(window.__PETATOE_COMMISSION_DELEGATION__) return;
  window.__PETATOE_COMMISSION_DELEGATION__=true;
  document.addEventListener('change',function(e){
    var t=e.target;
    if(!t||!t.closest) return;
    if(t.closest('#commissionStatement')&&t.matches('[data-commission-statement]')){ window.renderCommissionStatementPage&&window.renderCommissionStatementPage(); return; }
    if(t.closest('#commissions')&&t.matches('[data-commission-render]')) window.renderCommissionSystem&&window.renderCommissionSystem();
  });
  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target.closest('[data-com-tab],[data-commission-action],[data-commission-add-employee],[data-commission-delete-employee],[data-commission-save-settings],[data-commission-select-row]'):null;
    if(!el||!el.closest('#commissions,#commissionStatement')) return;
    var tab=el.getAttribute('data-com-tab');
    if(tab){window.setCommissionTab&&window.setCommissionTab(tab);return;}
    var action=el.getAttribute('data-commission-action');
    if(action==='recalc'){window.commissionRecalcMonth&&window.commissionRecalcMonth();return;}
    if(action==='lock'){window.commissionLockMonth&&window.commissionLockMonth();return;}
    if(action==='unlock'){window.commissionUnlockMonth&&window.commissionUnlockMonth(el.getAttribute('data-commission-period')||'');return;}
    var add=el.getAttribute('data-commission-add-employee');
    if(add){window.commissionAddEmployee&&window.commissionAddEmployee(add);return;}
    var del=el.getAttribute('data-commission-delete-employee');
    if(del){window.commissionDeleteEmployee&&window.commissionDeleteEmployee(del,parseInt(el.getAttribute('data-commission-index')||'0',10));return;}
    if(el.hasAttribute('data-commission-save-settings')){window.commissionSaveSettings&&window.commissionSaveSettings();return;}
    if(el.hasAttribute('data-commission-select-row')){window.commissionSelectRow&&window.commissionSelectRow(parseInt(el.getAttribute('data-commission-select-row')||'0',10),el.getAttribute('data-commission-kind')||'');}
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ') return;
    var el=e.target&&e.target.closest?e.target.closest('[data-commission-select-row]'):null;
    if(!el||!el.closest('#commissions,#commissionStatement')) return;
    e.preventDefault();
    window.commissionSelectRow&&window.commissionSelectRow(parseInt(el.getAttribute('data-commission-select-row')||'0',10),el.getAttribute('data-commission-kind')||'');
  });
}
function commissionsInit(){ensureCommissionDelegation();injectPanel();injectCommissionStatementPanel();injectNav();patchTab();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',commissionsInit);else commissionsInit();
})();