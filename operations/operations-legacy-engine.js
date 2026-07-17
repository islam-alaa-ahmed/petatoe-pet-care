/**
 * PETATOE Protected Legacy Module
 * Module: Operations Legacy Engine
 * Protection Phase: G7 Operations Protected Legacy Module
 *
 * Reason:
 * G6 audit confirmed that appointments tab actions, operations render chain,
 * vehicle execution, reports, and KPI runtime share hidden dependencies through
 * setTab()/render() and shared state. Previous direct extraction in G3/G4 caused
 * appointments tab regression.
 *
 * Rule:
 * Do not extract, split, rewrite, or migrate this file directly before building
 * a Shadow Harness and passing appointments + vehicle execution regression tests.
 * Comment-only protection marker; no runtime behavior change.
 */

(function(){
  'use strict';
  function opT(key,params){var c=window.PETATOE_LOCALIZATION_CENTER;return c&&c.t?c.t('operationsSource.'+key,params,{fallback:key}):key;}
  function opStatusT(status){var map={'مجدول':'statusScheduled','في الطريق':'statusOnTheWay','وصل العميل':'statusArrived','بدأت الجلسة':'statusStarted','تمت الجلسة':'statusCompleted','تم التحصيل':'statusCollected','مغلق':'statusClosed','مؤكد':'statusConfirmed','غير مكتملة':'statusIncomplete','مؤجل':'statusPostponed','ملغي':'statusCancelled','تم':'statusCompleted'};return opT(map[String(status||'')]||'statusUnknown');}
  if(window.PETATOEAppointments) return;
  var KEY='petatoe_appointments_v1';
  var MASTER_KEY='petatoe_appointments_master_data_v1';
  var DEFAULT_MASTER={animalTypes:['كلب','قط','طائر','أرنب','أخرى'],sizes:['Small','Medium','Large','XL'],services:[],breeds:{'كلب':['Husky','Golden Retriever','Pomeranian','German Shepherd','Shih Tzu'],'قط':['Persian','Siamese','Scottish','British Shorthair'],'طائر':['Parrot','Canary'],'أرنب':['Rabbit']},customers:[],vehicles:[],drivers:[],groomers:[],vehicleAssignments:[]};
  var LEGACY_DEFAULT_SERVICES=['Grooming','Bath','Nail Cut','Teeth Cleaning','Hotel','Training','Vet Visit','Transportation'];
  var currentTab='add';
  var currentMasterSection='animalTypes';
  var currentEditingServiceKey='';
  var quickRange='all';
  var calendarView='day';
  var vehicleOpsSelectedId='';
  var vehicleOpsViewTab='day';
  var appointmentLocalReportFilters={};
  var appointmentLocalReportVisibleLimits={};
  var financeReportFilters=null;
  var financeReportVisibleLimit=10;
  var STATUS_FLOW=['مجدول','في الطريق','وصل العميل','بدأت الجلسة','تمت الجلسة','تم التحصيل','مغلق','مؤكد','غير مكتملة','مؤجل','ملغي'];
  var LEGACY_STATUS_MAP={'تم':'تمت الجلسة'};
  function opsCtx(){return window.PETATOEOperationsContext||null}
  function byId(id){var ctx=opsCtx();return ctx&&ctx.byId?ctx.byId(id):document.getElementById(id)}
  function esc(s){var ctx=opsCtx();return ctx&&ctx.htmlEscape?ctx.htmlEscape(s):String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function safeHtml(target, html, reason){
    var el=target&&target.nodeType?target:null;
    if(!el)return false;
    try{
      if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function')return window.PETATOESafeRender.htmlTrusted(el,html,reason||'operations-legacy-engine trusted legacy template');
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations/operations-legacy-engine.js safeHtml',e);}
    el.textContent = '';
    el.insertAdjacentHTML('beforeend', String(html==null?'':html));
    return true;
  }
  function safeAppend(target, html, reason){
    var el=target&&target.nodeType?target:null;
    if(!el)return false;
    try{
      if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.appendTrusted==='function')return window.PETATOESafeRender.appendTrusted(el,html,reason||'operations-legacy-engine trusted legacy append');
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations/operations-legacy-engine.js safeAppend',e);}
    el.insertAdjacentHTML('beforeend',String(html==null?'':html));
    return true;
  }
  function money(n){var ctx=opsCtx();return ctx&&ctx.formatMoney?ctx.formatMoney(n):(Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})+' SAR')}
  function appointmentDateTime(row){var ctx=opsCtx();if(ctx&&ctx.appointmentDateTime)return ctx.appointmentDateTime(row);var d=String((row&&row.date)||'');if(!d)return null;var t=String((row&&row.start)||'00:00');var dt=new Date(d+'T'+(t||'00:00'));return isNaN(dt.getTime())?null:dt}
  function minutesUntil(row){var ctx=opsCtx();if(ctx&&ctx.minutesUntil)return ctx.minutesUntil(row);var dt=appointmentDateTime(row);return dt?Math.round((dt.getTime()-Date.now())/60000):null}
  function numVal(id){var x=String(val(id)||'').replace(/,/g,'');var n=Number(x);return isFinite(n)?n:0}
  function calcFinancials(base){var ctx=opsCtx();if(ctx&&ctx.calcFinancials)return ctx.calcFinancials(base);base=base||{};var price=Number(base.sessionPrice||0), discount=Number(base.discount||0), paid=Number(base.paidAmount||0);var total=Math.max(0,price-discount);var remaining=Math.max(0,total-paid);var collectionStatus=base.collectionStatus||'';if(!collectionStatus){collectionStatus=paid<=0?'غير محصل':(remaining>0?'محصل جزئي':'محصل بالكامل')}return Object.assign({},base,{sessionPrice:price,discount:discount,totalAmount:total,paidAmount:paid,remainingAmount:remaining,collectionStatus:collectionStatus});}
  function pad(n){var ctx=opsCtx();return ctx&&ctx.pad2?ctx.pad2(n):String(n).padStart(2,'0')}
  function dateKey(d){var ctx=opsCtx();return ctx&&ctx.dateKey?ctx.dateKey(d):(d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()))}
  function today(){var ctx=opsCtx();return ctx&&ctx.todayKey?ctx.todayKey():dateKey(new Date())}
  function addDays(base,n){var ctx=opsCtx();if(ctx&&ctx.addDays)return ctx.addDays(base,n);var d=new Date(base.getFullYear(),base.getMonth(),base.getDate());d.setDate(d.getDate()+n);return d}
  function monthStart(d){var ctx=opsCtx();return ctx&&ctx.monthStart?ctx.monthStart(d):dateKey(new Date(d.getFullYear(),d.getMonth(),1))}
  function monthEnd(d){var ctx=opsCtx();return ctx&&ctx.monthEnd?ctx.monthEnd(d):dateKey(new Date(d.getFullYear(),d.getMonth()+1,0))}
  function weekRange(d){var ctx=opsCtx();if(ctx&&ctx.weekRange)return ctx.weekRange(d);var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());var day=x.getDay();var diff=(day===6?0:day+1);var start=addDays(x,-diff);var end=addDays(start,6);return {from:dateKey(start),to:dateKey(end)}}
  function read(){
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.readAppointments==='function')return window.PETATOEOperationsStorage.readAppointments()}
    catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    return [];
  }
  function write(rows){
    rows=Array.isArray(rows)?rows:[];
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.writeAppointments==='function'){window.PETATOEOperationsStorage.writeAppointments(rows);return}}
    catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
  }
  function val(id){var el=byId(id);return el?String(el.value||'').trim():''}
  function setVal(id,v){var el=byId(id);if(el)el.value=v==null?'':v}
  function storageNameForKey(key){
    if(key===KEY)return 'appointments';
    if(key===MASTER_KEY)return 'appointmentsMasterData';
    return key;
  }
  function readKey(key,def){
    var name=storageNameForKey(key);
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.readJSON==='function')return window.PETATOEOperationsStorage.readJSON(name,def)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    return def;
  }
  function uniqueSorted(list){var ctx=opsCtx();if(ctx&&ctx.uniqueSorted)return ctx.uniqueSorted(list);var out=[];(list||[]).forEach(function(x){x=String(x||'').trim();if(x&&out.indexOf(x)===-1)out.push(x)});return out.sort(function(a,b){return a.localeCompare(b,'ar')})}

  function cloneDefaultMaster(){
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.cloneDefaultMaster==='function')return window.PETATOEOperationsStorage.cloneDefaultMaster()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    return JSON.parse(JSON.stringify(DEFAULT_MASTER));
  }
  function writeKey(key,value){
    var name=storageNameForKey(key);
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.writeJSON==='function')return window.PETATOEOperationsStorage.writeJSON(name,value)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    return false;
  }
  function normalizeGoogleMapUrl(v){
    v=String(v||'').trim();
    if(!v)return '';
    if(!/^https?:\/\//i.test(v))return '';
    if(/^javascript:/i.test(v))return '';
    return v;
  }
  function googleMapUrlStatus(v){
    var url=normalizeGoogleMapUrl(v);
    if(!url)return {ok:false,empty:true,url:'',message:opT('noSavedLocation')};
    var a=null, host='', path='';
    try{
      a=document.createElement('a');
      a.href=url;
      host=String(a.hostname||'').toLowerCase();
      path=String(a.pathname||'').toLowerCase();
    }catch(e){
      return {ok:false,empty:false,url:url,message:opT('invalidMapsLink')};
    }
    var isMapsApp=host==='maps.app.goo.gl';
    var isGoogleMaps=(host==='google.com'||host==='www.google.com')&&path.indexOf('/maps')===0;
    var isMapsGoogle=host==='maps.google.com';
    var isGooMaps=host==='goo.gl'&&path.indexOf('/maps')===0;
    if(isMapsApp||isGoogleMaps||isMapsGoogle||isGooMaps)return {ok:true,empty:false,url:url,message:''};
    return {ok:false,empty:false,url:url,message:opT('invalidMapsLinkHint')};
  }
  function appointmentMapUrl(row){
    row=row&&typeof row==='object'?row:{};
    return normalizeGoogleMapUrl(row.googleMapUrl||row.customerMapLink||row.mapUrl||row.locationUrl||'');
  }
  function vehicleDirectionHtml(row,compact){
    row=row&&typeof row==='object'?row:{};
    var status=googleMapUrlStatus(row.googleMapUrl||row.customerMapLink||row.mapUrl||row.locationUrl||'');
    var label=compact?'Get Direction':'📍 Get Direction';
    if(status.ok){
      return '<button class="vehicle-ops-direction-link '+(compact?'compact':'')+'" type="button" data-op-click="openVehicleDirectionById" data-op-arg1="'+esc(row.id||'')+'" title="'+opT('openDirectionsTitle')+'">'+label+'</button>';
    }
    if(status.empty){
      return compact?'':'<div class="vehicle-ops-direction empty"><button type="button" class="vehicle-ops-direction-link disabled" disabled>📍 Get Direction</button><span>'+opT('noSavedLocation')+'</span></div>';
    }
    return compact?'':'<div class="vehicle-ops-direction warning"><button type="button" class="vehicle-ops-direction-link warning" data-op-click="openVehicleDirectionById" data-op-arg1="'+esc(row.id||'')+'">📍 Get Direction</button><span>'+opT('invalidMapsLink')+'</span></div>';
  }
  function openVehicleDirectionById(id){
    var rows=read();
    var row=null;
    id=String(id||'');
    rows.some(function(r){if(String(r&&r.id||'')===id){row=r;return true}return false});
    if(!row&&vehicleOpsSelectedId){rows.some(function(r){if(String(r&&r.id||'')===String(vehicleOpsSelectedId)){row=r;return true}return false})}
    var status=googleMapUrlStatus(row?(row.googleMapUrl||row.customerMapLink||row.mapUrl||row.locationUrl||''):'');
    if(!status.ok){toast(status.message||opT('invalidMapsLink'));return false}
    try{window.open(status.url,'_blank','noopener,noreferrer');}
    catch(e){toast(opT('mapsOpenFailed'));return false}
    try{if(window.PETATOEDiagnostics&&typeof window.PETATOEDiagnostics.capture==='function')window.PETATOEDiagnostics.capture('info','vehicle-operations.get-direction','Google Maps direction opened',{appointmentId:id});}catch(e2){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations/operations-legacy-engine.js',e2);}
    return true;
  }
  window.PETATOEMaps=window.PETATOEMaps||{};
  window.PETATOEMaps.validateCustomerMapUrl=googleMapUrlStatus;
  window.PETATOEMaps.openCustomerLocation=function(appointment){
    appointment=appointment&&typeof appointment==='object'?appointment:{};
    var status=googleMapUrlStatus(appointment.googleMapUrl||appointment.customerMapLink||appointment.mapUrl||appointment.locationUrl||'');
    if(!status.ok)return false;
    window.open(status.url,'_blank','noopener,noreferrer');
    return true;
  };
  function cleanMasterCustomer(c){
    c=c&&typeof c==='object'?c:{};
    var code=String(c.code||c.customerId||c.key||'').trim();
    var name=String(c.name||c.client||'').trim();
    var phone=String(c.phone||c.mobile||c.jawal||'').trim();
    var address=String(c.address||'').trim();
    var googleMapUrl=normalizeGoogleMapUrl(c.googleMapUrl||c.customerMapLink||c.mapUrl||c.locationUrl||'');
    if(!code){code=phone?('phone:'+phone.replace(/\s+/g,'')):(name?('name:'+name.toLowerCase()):'');}
    if(!code&&!name&&!phone&&!address&&!googleMapUrl)return null;
    return {code:code,name:name,address:address,phone:phone,googleMapUrl:googleMapUrl,updatedAt:c.updatedAt||''};
  }
  function normalizeMasterCustomers(list){
    var map={};
    (Array.isArray(list)?list:[]).forEach(function(c){
      c=cleanMasterCustomer(c); if(!c)return;
      var key=String(c.code||c.phone||c.name||'').toLowerCase();
      if(!map[key])map[key]=c; else map[key]=Object.assign({},map[key],c);
    });
    (readMasterData().customers||[]).forEach(function(mc){
      mc=cleanMasterCustomer(mc); if(!mc)return;
      var key=mc.code||mc.phone||mc.name; if(!key)return;
      if(!map[key])map[key]={key:key,client:mc.name||'عميل غير محدد',phone:mc.phone||'',address:mc.address||'',googleMapUrl:mc.googleMapUrl||'',notes:'',appointments:[],pets:{},total:0,paid:0,remaining:0,lastVisit:'',firstVisit:''};
      if(mc.name)map[key].client=mc.name; if(mc.phone)map[key].phone=mc.phone; if(mc.address)map[key].address=mc.address; if(mc.googleMapUrl)map[key].googleMapUrl=mc.googleMapUrl;
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return String(a.name||a.code).localeCompare(String(b.name||b.code),'ar')});
  }
  function isOnlyLegacyDefaultServices(list){
    var names=(Array.isArray(list)?list:[]).map(function(x){var row=typeof x==='string'?{name:x}:x;return String((row&&row.name)||'').trim();}).filter(Boolean).sort();
    var legacy=LEGACY_DEFAULT_SERVICES.slice().sort();
    return names.length===legacy.length&&names.every(function(x,i){return x===legacy[i]});
  }
  function cleanMasterService(s){
    if(typeof s==='string')s={name:s,price:''};
    s=s&&typeof s==='object'?s:{};
    var name=String(s.name||s.service||s.title||s.serviceName||s['الخدمة']||s['اسم الخدمة']||'').trim();
    var code=String(s.code||s.serviceCode||s.id||s['الكود']||s['كود']||'').trim();
    var priceRaw=String(s.price||s.amount||s.value||s['السعر']||'').replace(/,/g,'').trim();
    var price=priceRaw===''?'':Number(priceRaw);
    if(price!==''&&!isFinite(price))price='';
    if(!name)return null;
    return {code:code,name:name,price:price,updatedAt:s.updatedAt||''};
  }
  function masterServiceSort(a,b){
    a=cleanMasterService(a)||{}; b=cleanMasterService(b)||{};
    var ac=String(a.code||''), bc=String(b.code||'');
    var an=/^\d+$/.test(ac)?Number(ac):NaN, bn=/^\d+$/.test(bc)?Number(bc):NaN;
    if(isFinite(an)&&isFinite(bn)&&an!==bn)return an-bn;
    var codeCompare=ac.localeCompare(bc,'ar',{numeric:true,sensitivity:'base'});
    if(codeCompare)return codeCompare;
    return String(a.name||'').localeCompare(String(b.name||''),'ar',{numeric:true,sensitivity:'base'});
  }
  function nextMasterServiceCode(list){
    var max=0;
    (Array.isArray(list)?list:[]).forEach(function(s){s=cleanMasterService(s);var n=s&&/^\d+$/.test(String(s.code||''))?Number(s.code):0;if(n>max)max=n;});
    return max?String(max+1):'';
  }
  function normalizeMasterServices(list){
    var map={};
    (Array.isArray(list)?list:[]).forEach(function(s){
      var row=cleanMasterService(s); if(!row)return;
      map[String(row.code||row.name).toLowerCase()]=row;
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(masterServiceSort);
  }
  function serviceNames(list){
    return uniqueSorted((Array.isArray(list)?list:[]).map(function(s){var row=cleanMasterService(s);return row?row.name:''}).filter(Boolean));
  }
  function cleanVehicleAssignment(v){
    v=v&&typeof v==='object'?v:{};
    var vehicle=String(v.vehicle||v.car||'').trim();
    var groomer=String(v.groomer||'').trim();
    var driver=String(v.driver||'').trim();
    if(!vehicle&&!groomer&&!driver)return null;
    return {vehicle:vehicle,groomer:groomer,driver:driver,disabled:!!v.disabled,updatedAt:v.updatedAt||''};
  }
  function normalizeVehicleAssignments(list){
    var map={};
    (Array.isArray(list)?list:[]).forEach(function(v){
      v=cleanVehicleAssignment(v); if(!v||!v.vehicle)return;
      map[v.vehicle]=v;
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return String(a.vehicle).localeCompare(String(b.vehicle),'ar')});
  }

  function normalizeNamedList(list){
    var map={};
    (Array.isArray(list)?list:[]).forEach(function(x){
      var name=typeof x==='object'?String(x.name||x.title||x.label||x.vehicle||x.driver||x.groomer||'').trim():String(x||'').trim();
      if(name)map[name]=name;
    });
    return Object.keys(map).sort(function(a,b){return a.localeCompare(b,'ar',{numeric:true,sensitivity:'base'})});
  }
  function addNamedMasterValue(field,inputId,label){
    var name=String(val(inputId)||'').trim();
    if(!name){alert(opT('enterNamedValue',{label:label}));return;}
    var master=readMasterData();
    master[field]=normalizeNamedList((master[field]||[]).concat([name]));
    writeMasterData(master);
    setVal(inputId,'');
    renderMasterData();
    refreshLookupSelects();
    toast(opT('namedValueAdded',{label:label}));
  }
  function removeNamedMasterValue(field,name,label){
    name=String(name||'').trim(); if(!name)return;
    if(!confirm(opT('confirmDeleteNamedValue',{label:label})))return;
    var master=readMasterData();
    master[field]=normalizeNamedList(master[field]||[]).filter(function(x){return String(x)!==name});
    if(field==='vehicles'){master.vehicleAssignments=(master.vehicleAssignments||[]).filter(function(v){return String(v.vehicle)!==name});}
    if(field==='groomers'){master.vehicleAssignments=(master.vehicleAssignments||[]).map(function(v){if(String(v.groomer)===name)v.groomer='';return v;});}
    if(field==='drivers'){master.vehicleAssignments=(master.vehicleAssignments||[]).map(function(v){if(String(v.driver)===name)v.driver='';return v;});}
    writeMasterData(master);
    renderMasterData();
    refreshLookupSelects();
    toast(opT('deleted'));
  }
  function addOperationsVehicle(){addNamedMasterValue('vehicles','appointmentNewOperationVehicle','سيارة')}
  function addOperationsDriver(){addNamedMasterValue('drivers','appointmentNewOperationDriver','سائق')}
  function addOperationsGroomer(){addNamedMasterValue('groomers','appointmentNewOperationGroomer','جرومر')}
  function removeOperationsVehicle(name){removeNamedMasterValue('vehicles',name,'السيارة')}
  function removeOperationsDriver(name){removeNamedMasterValue('drivers',name,'السائق')}
  function removeOperationsGroomer(name){removeNamedMasterValue('groomers',name,'الجرومر')}
  function normalizeMasterData(data){
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.normalizeMasterData==='function')return window.PETATOEOperationsStorage.normalizeMasterData(data)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    data=data&&typeof data==='object'?data:{};
    var serviceSource=isOnlyLegacyDefaultServices(data.services||[])?[]:(data.services||[]);
    var out={animalTypes:uniqueSorted(data.animalTypes||[]),sizes:uniqueSorted(data.sizes||[]),services:normalizeMasterServices(serviceSource),breeds:{},customers:normalizeMasterCustomers(data.customers||[]),vehicles:normalizeNamedList(data.vehicles||[]),drivers:normalizeNamedList(data.drivers||[]),groomers:normalizeNamedList(data.groomers||[]),vehicleAssignments:normalizeVehicleAssignments(data.vehicleAssignments||[])};
    var breedSource=data.breeds||{};
    Object.keys(breedSource).forEach(function(type){var t=String(type||'').trim();if(!t)return;out.breeds[t]=uniqueSorted(breedSource[type]||[]);if(out.animalTypes.indexOf(t)===-1)out.animalTypes.push(t)});
    out.animalTypes=uniqueSorted(out.animalTypes);
    return out;
  }
  function readMasterData(){
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.readNormalizedMasterData==='function')return window.PETATOEOperationsStorage.readNormalizedMasterData()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    var raw=readKey(MASTER_KEY,null);return normalizeMasterData(raw||cloneDefaultMaster())
  }
  function writeMasterData(data){
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.writeNormalizedMasterData==='function')window.PETATOEOperationsStorage.writeNormalizedMasterData(data);else writeKey(MASTER_KEY,normalizeMasterData(data));}catch(e){writeKey(MASTER_KEY,normalizeMasterData(data));}
    refreshMasterDrivenSelects();renderMasterData();
  }
  function addUnique(list,value){value=String(value||'').trim();if(!value)return false;if(list.indexOf(value)===-1)list.push(value);return true}
  function masterSelectHtml(items,placeholder,selected){return optionList(uniqueSorted(items||[]),placeholder,selected)}
  function refreshMasterDrivenSelects(){
    var master=readMasterData();
    var animal=byId('appointmentAnimalType'), breed=byId('appointmentBreed'), size=byId('appointmentSize'), service=byId('appointmentService'), breedType=byId('appointmentBreedAnimalType');
    if(animal){var old=animal.value;safeHtml(animal,masterSelectHtml(master.animalTypes,opT('selectType'),old),'operations master animal select')}
    if(size){var oldSize=size.value;safeHtml(size,masterSelectHtml(master.sizes,opT('selectSize'),oldSize),'operations master size select')}
    if(service){var oldService=service.value;safeHtml(service,masterSelectHtml(serviceNames(master.services),opT('selectService'),oldService),'operations master service hidden select')}
    refreshAppointmentServiceSelects();
    if(breedType){var oldType=breedType.value;safeHtml(breedType,masterSelectHtml(master.animalTypes,opT('selectAnimalType'),oldType),'operations breed type select')}
    refreshBreedOptions();
  }
  function refreshBreedOptions(){
    var sel=byId('appointmentBreed'); if(!sel)return;
    var master=readMasterData(), type=val('appointmentAnimalType'), old=sel.value;
    var items=type?(master.breeds[type]||[]):Object.keys(master.breeds||{}).reduce(function(a,k){return a.concat(master.breeds[k]||[])},[]);
    safeHtml(sel, masterSelectHtml(items,opT('selectBreed'),old), 'operations legacy render');
  }
  function masterInputId(type){return type==='animalTypes'?'appointmentNewAnimalType':(type==='sizes'?'appointmentNewSize':'appointmentNewService')}
  function addMasterItem(type){
    var id=masterInputId(type), value=val(id), master=readMasterData();
    if(type==='services'){
      return addMasterService();
    }
    if(!value){alert(opT('enterValue'));return}
    addUnique(master[type],value);
    if(type==='animalTypes'&&!master.breeds[value])master.breeds[value]=[];
    writeMasterData(master);setVal(id,'');toast(opT('added'));
  }
  function addMasterService(){
    var master=readMasterData();
    var code=val('appointmentNewServiceCode'), name=val('appointmentNewService'), priceRaw=val('appointmentNewServicePrice'), price=priceRaw===''?'':Number(String(priceRaw).replace(/,/g,''));
    if(!name){alert(opT('enterServiceName'));return;}
    if(price!==''&&!isFinite(price)){alert(opT('validPrice'));return;}
    if(!code&&currentEditingServiceKey){
      var existing=(master.services||[]).map(cleanMasterService).filter(Boolean).find(function(s){return String(s.code||s.name)===String(currentEditingServiceKey)});
      if(existing&&existing.code)code=existing.code;
    }
    if(!code)code=nextMasterServiceCode(master.services||[]);
    var row=cleanMasterService({code:code,name:name,price:price,updatedAt:new Date().toISOString()});
    if(!row){alert(opT('enterServiceName'));return;}
    var done=false, editKey=String(currentEditingServiceKey||'').toLowerCase();
    master.services=(master.services||[]).map(function(s){
      var old=cleanMasterService(s); if(!old)return null;
      var oldKey=String(old.code||old.name).toLowerCase();
      var codeMatch=row.code&&String(old.code||'').toLowerCase()===String(row.code).toLowerCase();
      var nameMatch=String(old.name||'').toLowerCase()===String(row.name||'').toLowerCase();
      if((editKey&&oldKey===editKey)||codeMatch||nameMatch){done=true;return Object.assign({},old,row);}
      return old;
    }).filter(Boolean);
    if(!done)master.services.push(row);
    currentEditingServiceKey='';
    writeMasterData(master);setVal('appointmentNewServiceCode','');setVal('appointmentNewService','');setVal('appointmentNewServicePrice','');toast(opT('serviceSaved'));
  }
  function addBreed(){
    var type=val('appointmentBreedAnimalType'), breed=val('appointmentNewBreed'), master=readMasterData();
    if(!type||!breed){alert(opT('selectAnimalAndBreed'));return}
    if(master.animalTypes.indexOf(type)===-1)master.animalTypes.push(type);
    master.breeds[type]=master.breeds[type]||[];addUnique(master.breeds[type],breed);
    writeMasterData(master);setVal('appointmentNewBreed','');toast(opT('breedAdded'));
  }
  function removeMasterItem(type,value,animalType){
    if(!confirm(opT('confirmDeleteReferenceItem')))return;
    var master=readMasterData();
    value=String(value||'');
    if(type==='breeds'&&animalType){master.breeds[animalType]=(master.breeds[animalType]||[]).filter(function(x){return x!==value})}
    else if(type==='services'){master.services=(master.services||[]).filter(function(x){x=cleanMasterService(x);return x&&x.name!==value&&x.code!==value});}
    else{master[type]=(master[type]||[]).filter(function(x){return x!==value}); if(type==='animalTypes')delete master.breeds[value];}
    writeMasterData(master);toast(opT('deleted'));
  }
  function editMasterItem(type,value,animalType){
    var master=readMasterData();
    if(type==='services'){
      var svc=(master.services||[]).map(cleanMasterService).filter(Boolean).find(function(x){return x.name===value||x.code===value||String(x.code||x.name)===String(value)});
      if(!svc){alert(opT('serviceNotFound'));return;}
      currentEditingServiceKey=String(svc.code||svc.name);
      setVal('appointmentNewServiceCode',svc.code||'');
      setVal('appointmentNewService',svc.name||'');
      setVal('appointmentNewServicePrice',svc.price===''?'':svc.price);
      var input=byId('appointmentNewService'); if(input&&input.focus)input.focus();
      toast(opT('serviceLoadedForEdit'));
      return;
    }
    var next=prompt(opT('enterNewName'),value); if(next==null)return; next=String(next).trim(); if(!next)return;
    if(type==='breeds'&&animalType){master.breeds[animalType]=(master.breeds[animalType]||[]).map(function(x){return x===value?next:x})}
    else if(type==='animalTypes'){
      master.animalTypes=(master.animalTypes||[]).map(function(x){return x===value?next:x});
      if(master.breeds[value]){master.breeds[next]=master.breeds[value];delete master.breeds[value];}
    }
    else {master[type]=(master[type]||[]).map(function(x){return x===value?next:x})}
    writeMasterData(master);toast(opT('updated'));
  }
  function resetMasterData(){if(confirm(opT('confirmRestoreDefaults'))){writeMasterData(cloneDefaultMaster());toast(opT('restored'))}}
  function renderMasterPills(list,type,animalType){
    list=uniqueSorted(list||[]);
    return list.length?list.map(function(x){return '<span class="appointments-master-pill"><b>'+esc(x)+'</b><button type="button" data-op-click="editMasterItem" data-op-arg1="'+esc(type)+'" data-op-arg2="'+esc(x)+'" data-op-arg3="'+esc(animalType||'')+'">'+esc(opT('edit'))+'</button><button type="button" data-op-click="removeMasterItem" data-op-arg1="'+esc(type)+'" data-op-arg2="'+esc(x)+'" data-op-arg3="'+esc(animalType||'')+'">'+esc(opT('delete'))+'</button></span>'}).join(''):'<div class="appointments-empty appointments-master-empty">لا توجد بيانات</div>';
  }
  function setMasterSection(section){
    currentMasterSection=String(section||val('appointmentMasterSection')||'animalTypes');
    var sel=byId('appointmentMasterSection'); if(sel&&sel.value!==currentMasterSection)sel.value=currentMasterSection;
    document.querySelectorAll('[data-master-panel]').forEach(function(p){p.classList.toggle('active',p.getAttribute('data-master-panel')===currentMasterSection)});
    renderMasterData();
  }
  function appointmentMasterSectionValue(){return val('appointmentMasterSection')||currentMasterSection||'animalTypes'}
  function masterCustomerRows(){
    var master=readMasterData(), map={};
    (master.customers||[]).forEach(function(c){c=cleanMasterCustomer(c); if(c)map[String(c.code||c.phone||c.name).toLowerCase()]=c;});
    buildCustomerProfiles().forEach(function(p){
      var c=cleanMasterCustomer({code:p.key,name:p.client,phone:p.phone,address:p.address}); if(!c)return;
      var key=String(c.code||c.phone||c.name).toLowerCase();
      map[key]=Object.assign({},c,map[key]||{});
    });
    (readMasterData().customers||[]).forEach(function(mc){
      mc=cleanMasterCustomer(mc); if(!mc)return;
      var key=mc.code||mc.phone||mc.name; if(!key)return;
      if(!map[key])map[key]={key:key,client:mc.name||'عميل غير محدد',phone:mc.phone||'',address:mc.address||'',notes:'',appointments:[],pets:{},total:0,paid:0,remaining:0,lastVisit:'',firstVisit:''};
      if(mc.name)map[key].client=mc.name; if(mc.phone)map[key].phone=mc.phone; if(mc.address)map[key].address=mc.address;
    });
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){return String(a.name||a.code).localeCompare(String(b.name||b.code),'ar')});
  }
  function upsertMasterCustomer(c){
    c=cleanMasterCustomer(c); if(!c)return false;
    var master=readMasterData(), key=String(c.code||c.phone||c.name).toLowerCase(), done=false;
    master.customers=(master.customers||[]).map(function(x){var cx=cleanMasterCustomer(x); if(cx&&String(cx.code||cx.phone||cx.name).toLowerCase()===key){done=true;return Object.assign({},cx,c,{updatedAt:new Date().toISOString()});} return cx||x;}).filter(Boolean);
    if(!done)master.customers.push(Object.assign({},c,{updatedAt:new Date().toISOString()}));
    writeMasterData(master); return true;
  }
  function addMasterCustomer(){
    var c={code:val('appointmentMasterCustomerCode'),name:val('appointmentMasterCustomerName'),address:val('appointmentMasterCustomerAddress'),phone:val('appointmentMasterCustomerPhone')};
    if(!c.name&&!c.phone){alert(opT('enterCustomerOrPhone'));return;}
    upsertMasterCustomer(c);
    ['appointmentMasterCustomerCode','appointmentMasterCustomerName','appointmentMasterCustomerAddress','appointmentMasterCustomerPhone'].forEach(function(id){setVal(id,'')});
    toast(opT('customerSaved'));
  }
  function editMasterCustomer(code){
    var row=masterCustomerRows().find(function(c){return String(c.code)===String(code)}); if(!row)return;
    var name=prompt(opT('customerName'),row.name||''); if(name==null)return;
    var phone=prompt(opT('mobile'),row.phone||''); if(phone==null)return;
    var address=prompt(opT('address'),row.address||''); if(address==null)return;
    upsertMasterCustomer({code:row.code,name:name,phone:phone,address:address});
  }
  function removeMasterCustomer(code){
    if(!confirm(opT('confirmDeleteCustomer')))return;
    var master=readMasterData();
    master.customers=(master.customers||[]).filter(function(c){c=cleanMasterCustomer(c);return c&&String(c.code)!==String(code)});
    writeMasterData(master);toast(opT('customerDeleted'));
  }
  function masterCustomersExportRows(){
    return [[opT('code'),opT('name'),opT('address'),opT('mobile')]].concat(masterCustomerRows().map(function(c){
      return [c.code||'',c.name||'',c.address||'',c.phone||''];
    }));
  }
  function exportMasterCustomersExcel(){
    var rows=masterCustomersExportRows();
    if(window.PETATOEExport&&typeof window.PETATOEExport.excelRows==='function'){
      window.PETATOEExport.excelRows(rows,'PETATOE_Operation_Customers','Operation Customers');
      return;
    }
    if(window.XLSX&&XLSX.utils&&!window.__PETATOE_XLSX_STUB__){
      var wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Operation Customers');
      XLSX.writeFile(wb,'PETATOE_Operation_Customers.xlsx');
      return;
    }
    var csv=rows.map(function(r){return r.map(function(x){return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
    var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='PETATOE_Operation_Customers.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},0);
  }
  function triggerMasterCustomersExcelImport(){
    var input=byId('appointmentMasterCustomersExcelInput');
    if(input)input.click();
  }
  function masterCustomerHeaderKey(v){
    v=String(v||'').replace(/\s+/g,'').toLowerCase();
    if(['الكود','كود','code','customercode','customerid','id'].indexOf(v)>-1)return 'code';
    if(['الاسم','اسم','name','customername','client','clientname'].indexOf(v)>-1)return 'name';
    if(['العنوان','عنوان','address','location'].indexOf(v)>-1)return 'address';
    if(['الجوال','جوال','الموبايل','موبايل','الهاتف','هاتف','phone','mobile','jawal','tel'].indexOf(v)>-1)return 'phone';
    return '';
  }
  function parseMasterCustomersSheetRows(data){
    data=Array.isArray(data)?data:[];
    var rows=data.filter(function(r){return Array.isArray(r)&&r.some(function(x){return String(x||'').trim()!==''})});
    if(!rows.length)return [];
    var header=rows[0]||[], map={}, known=0;
    header.forEach(function(h,i){var k=masterCustomerHeaderKey(h); if(k){map[k]=i; known++;}});
    var start=known>=2?1:0;
    if(known<2)map={code:0,name:1,address:2,phone:3};
    return rows.slice(start).map(function(r){
      return cleanMasterCustomer({
        code:r[map.code],
        name:r[map.name],
        address:r[map.address],
        phone:r[map.phone]
      });
    }).filter(Boolean);
  }
  function handleMasterCustomersExcelImport(input){
    input=(input&&input.target&&input.target.files)?input.target:input;
    var file=input&&input.files&&input.files[0];
    if(!file)return;
    var finish=function(list){
      if(!list.length){alert(opT('noValidCustomersInFile'));return;}
      list.forEach(upsertMasterCustomer);
      renderMasterData();
      toast(opT('customersImported',{count:list.length}));
      alert(opT('customersImportedSuccess',{count:list.length}));
    };
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var ext=String(file.name||'').toLowerCase();
        if(ext.endsWith('.csv')){
          var text=new TextDecoder('utf-8').decode(new Uint8Array(e.target.result));
          var rows=text.split(/\r?\n/).map(function(line){return line.split(',').map(function(x){return String(x||'').replace(/^"|"$/g,'').replace(/""/g,'"').trim()})});
          finish(parseMasterCustomersSheetRows(rows));
          return;
        }
        if(!window.XLSX||!XLSX.read||window.__PETATOE_XLSX_STUB__){alert(opT('excelUnavailable'));return;}
        var wb=XLSX.read(e.target.result,{type:'array',cellDates:false});
        var ws=wb.Sheets[wb.SheetNames[0]];
        var data=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        finish(parseMasterCustomersSheetRows(data));
      }catch(err){console.error(err);alert(opT('customersFileReadFailed'));}
      finally{if(input)input.value='';}
    };
    reader.readAsArrayBuffer(file);
  }
  function activeVehicleAssignments(){return (readMasterData().vehicleAssignments||[]).map(cleanVehicleAssignment).filter(function(v){return v&&v.vehicle&&!v.disabled&&v.groomer&&v.driver})}
  function vehicleAssignmentMap(){var m={};activeVehicleAssignments().forEach(function(v){if(v&&v.vehicle)m[v.vehicle]=v});return m}
  function applyVehicleStaffAssignment(){
    var v=val('appointmentVehicle');
    if(!v){setVal('appointmentGroomer','');setVal('appointmentDriver','');return;}
    var row=vehicleAssignmentMap()[v];
    if(!row){setVal('appointmentGroomer','');setVal('appointmentDriver','');return;}
    setVal('appointmentGroomer',row.groomer||'');
    setVal('appointmentDriver',row.driver||'');
  }
  function saveVehicleAssignment(){
    var vehicle=val('appointmentMasterVehicle'), groomer=val('appointmentMasterGroomer'), driver=val('appointmentMasterDriver');
    if(!vehicle){alert(opT('selectVehicle'));return;}
    if(!groomer){alert(opT('selectGroomer'));return;}
    if(!driver){alert(opT('selectDriver'));return;}
    var master=readMasterData(), done=false, previousDisabled=false;
    master.vehicles=normalizeNamedList((master.vehicles||[]).concat([vehicle]));
    master.groomers=normalizeNamedList((master.groomers||[]).concat([groomer]));
    master.drivers=normalizeNamedList((master.drivers||[]).concat([driver]));
    master.vehicleAssignments=(master.vehicleAssignments||[]).map(function(v){
      if(String(v.vehicle)===String(vehicle)){
        done=true; previousDisabled=!!v.disabled;
        return {vehicle:vehicle,groomer:groomer,driver:driver,disabled:previousDisabled,updatedAt:new Date().toISOString()};
      }
      return v;
    });
    if(!done)master.vehicleAssignments.push({vehicle:vehicle,groomer:groomer,driver:driver,disabled:false,updatedAt:new Date().toISOString()});
    writeMasterData(master);renderMasterData();refreshLookupSelects();toast(opT('assignmentSaved'));
  }
  function editVehicleAssignment(vehicle){
    vehicle=String(vehicle||'').trim(); if(!vehicle)return;
    var row=(readMasterData().vehicleAssignments||[]).map(cleanVehicleAssignment).filter(function(v){return v&&String(v.vehicle)===vehicle})[0];
    if(!row){toast(opT('assignmentNotFound'));return;}
    setVal('appointmentMasterVehicle',row.vehicle||'');
    setVal('appointmentMasterGroomer',row.groomer||'');
    setVal('appointmentMasterDriver',row.driver||'');
    toast(opT('assignmentLoaded'));
  }
  function toggleVehicleAssignment(vehicle){
    vehicle=String(vehicle||'').trim(); if(!vehicle)return;
    var master=readMasterData(), found=false, disabled=false;
    master.vehicleAssignments=(master.vehicleAssignments||[]).map(function(v){
      v=cleanVehicleAssignment(v);
      if(v&&String(v.vehicle)===vehicle){found=true;v.disabled=!v.disabled;disabled=!!v.disabled;v.updatedAt=new Date().toISOString();}
      return v;
    }).filter(Boolean);
    if(!found){toast(opT('assignmentNotFound'));return;}
    writeMasterData(master);renderMasterData();refreshLookupSelects();toast(disabled?opT('assignmentDisabled'):opT('assignmentEnabled'));
  }
  function removeVehicleAssignment(vehicle){
    if(!confirm(opT('confirmDeleteAssignment')))return;
    var master=readMasterData();master.vehicleAssignments=(master.vehicleAssignments||[]).filter(function(v){return String(v.vehicle)!==String(vehicle)});
    writeMasterData(master);renderMasterData();refreshLookupSelects();toast(opT('assignmentDeleted'));
  }
  function masterServicesExportRows(){
    var rows=(readMasterData().services||[]).map(function(s){s=cleanMasterService(s);return s?[s.code||'',s.name,s.price===''?'' : s.price]:null}).filter(Boolean);
    return [[opT('code'),opT('serviceName'),opT('price')]].concat(rows);
  }
  function exportMasterServicesExcel(){
    var rows=masterServicesExportRows();
    if(window.PETATOEExport&&typeof window.PETATOEExport.excelRows==='function'){
      window.PETATOEExport.excelRows(rows,'PETATOE_Operation_Services','Operation Services');return;
    }
    if(window.XLSX&&XLSX.utils&&!window.__PETATOE_XLSX_STUB__){
      var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Operation Services');XLSX.writeFile(wb,'PETATOE_Operation_Services.xlsx');return;
    }
    var csv=rows.map(function(r){return r.map(function(x){return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
    var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='PETATOE_Operation_Services.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},0);
  }
  function triggerMasterServicesExcelImport(){var input=byId('appointmentMasterServicesExcelInput');if(input)input.click();}
  function masterServiceHeaderKey(v){
    v=String(v||'').replace(/\s+/g,'').toLowerCase();
    if(['الكود','كود','code','servicecode','id'].indexOf(v)>-1)return 'code';
    if(['اسمالخدمة','الخدمة','خدمة','service','servicename','name'].indexOf(v)>-1)return 'name';
    if(['السعر','سعر','price','amount','value','fee'].indexOf(v)>-1)return 'price';
    return '';
  }
  function parseMasterServicesSheetRows(data){
    data=Array.isArray(data)?data:[];
    var rows=data.filter(function(r){return Array.isArray(r)&&r.some(function(x){return String(x||'').trim()!=='';});});
    if(!rows.length)return [];
    var header=rows[0]||[], map={}, known=0;
    header.forEach(function(h,i){var k=masterServiceHeaderKey(h);if(k){map[k]=i;known++;}});
    var start=known>=1?1:0;
    if(known<1)map={code:0,name:1,price:2};
    if(map.name==null)map.name=map.code===0?1:0;
    return rows.slice(start).map(function(r){return cleanMasterService({code:r[map.code],name:r[map.name],price:r[map.price]});}).filter(Boolean);
  }
  function handleMasterServicesExcelImport(input){
    input=(input&&input.target&&input.target.files)?input.target:input;
    var file=input&&input.files&&input.files[0]; if(!file)return;
    var finish=function(list){
      var master=readMasterData(); master.services=[];
      list.forEach(function(s){s=cleanMasterService(s);if(s)master.services.push(s);});
      writeMasterData(master); renderMasterData();
      toast(opT('servicesImported',{count:list.length})); alert(opT('servicesImportedSuccess',{count:list.length}));
    };
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var ext=String(file.name||'').toLowerCase();
        if(ext.endsWith('.csv')){
          var text=new TextDecoder('utf-8').decode(new Uint8Array(e.target.result));
          var rows=text.split(/\r?\n/).map(function(line){return line.split(',').map(function(x){return String(x||'').replace(/^"|"$/g,'').replace(/""/g,'"').trim()})});
          finish(parseMasterServicesSheetRows(rows));return;
        }
        if(!window.XLSX||!XLSX.read||window.__PETATOE_XLSX_STUB__){alert(opT('excelUnavailable'));return;}
        var wb=XLSX.read(e.target.result,{type:'array',cellDates:false});
        var ws=wb.Sheets[wb.SheetNames[0]];
        var data=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        finish(parseMasterServicesSheetRows(data));
      }catch(err){console.error(err);alert(opT('servicesFileReadFailed'));}
      finally{if(input)input.value='';}
    };
    reader.readAsArrayBuffer(file);
  }
  function renderMasterServices(){
    var body=byId('appointmentServicesList'); if(!body)return;
    var rows=(readMasterData().services||[]).map(cleanMasterService).filter(Boolean).sort(masterServiceSort);
    var html=rows.length?rows.map(function(s){var key=s.code||s.name;return '<tr><td>'+esc(s.code||'-')+'</td><td>'+esc(s.name||'-')+'</td><td>'+esc(s.price===''?'-':money(s.price))+'</td><td><button type="button" class="appointments-master-action" data-op-click="editMasterItem" data-op-arg1="services" data-op-arg2="'+esc(key)+'">'+esc(opT('edit'))+'</button><button type="button" class="appointments-master-action danger" data-op-click="removeMasterItem" data-op-arg1="services" data-op-arg2="'+esc(key)+'">'+esc(opT('delete'))+'</button></td></tr>'}).join(''):'<tr><td colspan="4" class="appointments-empty appointments-master-empty">'+esc(opT('noServicesUploadOrAdd'))+'</td></tr>';
    safeHtml(body,html,'operations master services table');
  }
  function renderMasterCustomers(){
    var body=byId('appointmentMasterCustomersList'); if(!body)return;
    var q=String(val('appointmentMasterCustomerSearch')||'').toLowerCase();
    var rows=masterCustomerRows().filter(function(c){return !q||[c.code,c.name,c.address,c.phone].join(' ').toLowerCase().indexOf(q)>-1});
    var html=rows.length?rows.map(function(c){return '<tr><td>'+esc(c.code||'-')+'</td><td>'+esc(c.name||'-')+'</td><td>'+esc(c.address||'-')+'</td><td>'+esc(c.phone||'-')+'</td><td><button type="button" class="appointments-master-action" data-op-click="editMasterCustomer" data-op-arg1="'+esc(c.code)+'">'+esc(opT('edit'))+'</button><button type="button" class="appointments-master-action danger" data-op-click="removeMasterCustomer" data-op-arg1="'+esc(c.code)+'">'+esc(opT('delete'))+'</button></td></tr>'}).join(''):'<tr><td colspan="5" class="appointments-empty appointments-master-empty">'+esc(opT('noCustomerData'))+'</td></tr>';
    safeHtml(body,html,'operations master customers table');
  }
  function setupVehicleNamesForAppointments(){
    var names=[];
    try{
      var api=window.PETATOESetup||window.PETATOEReferenceRegistry||null;
      var rows=(api&&typeof api.getVehicles==='function')?api.getVehicles():[];
      (Array.isArray(rows)?rows:[]).forEach(function(v){
        if(!v)return;
        if(v.status&&String(v.status)!=='active')return;
        names.push(v.name||v.vehicle||v.car||v.plate||v.code||'');
      });
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations appointment setup vehicle source',e);}
    return normalizeNamedList(names);
  }
  function payrollRowsForAppointments(){
    var rows=[];
    try{
      if(window.PETATOEPayrollReadFacade&&typeof window.PETATOEPayrollReadFacade.employees==='function')rows=window.PETATOEPayrollReadFacade.employees()||[];
    }catch(e){rows=[];window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations appointment payroll facade source',e);}
    if(!Array.isArray(rows)||!rows.length){
      try{rows=readKey('PETATOE_PAYROLL_EMPLOYEES_V1',[])||[]}catch(_e){rows=[]}
    }
    return Array.isArray(rows)?rows:[];
  }
  function payrollEmployeeNamesByJob(kind){
    var isDriver=kind==='driver';
    var out=[];
    payrollRowsForAppointments().forEach(function(e){
      if(!e)return;
      var status=String(e.status||'active').toLowerCase();
      if(['stopped','resigned','deleted','inactive'].indexOf(status)>-1)return;
      var job=String(e.job||e.job_title||e.position||e.role||'').toLowerCase();
      var ok=isDriver?(job.indexOf('driver')>-1||job.indexOf('سائق')>-1):(job.indexOf('groom')>-1||job.indexOf('جروم')>-1||job.indexOf('جرووم')>-1);
      if(!ok)return;
      out.push(e.name||e.fullName||e.employeeName||e.username||e.code||'');
    });
    return normalizeNamedList(out);
  }
  function renderVehicleAssignments(){
    var master=readMasterData(), cars=setupVehicleNamesForAppointments(), groomers=payrollEmployeeNamesByJob('groomer'), drivers=payrollEmployeeNamesByJob('driver');
    var legacyAssignmentVehicles=normalizeNamedList((master.vehicleAssignments||[]).map(function(v){return v.vehicle}).filter(Boolean));
    legacyAssignmentVehicles.forEach(function(x){if(cars.indexOf(x)===-1)cars.push(x)});
    cars=normalizeNamedList(cars);
    var v=byId('appointmentMasterVehicle'), g=byId('appointmentMasterGroomer'), d=byId('appointmentMasterDriver');
    if(v){var ov=v.value;safeHtml(v,optionList(cars,opT('selectVehicle'),ov),'operations master vehicle select')}
    if(g){var og=g.value;safeHtml(g,optionList(groomers,opT('selectGroomerOption'),og),'operations master groomer select')}
    if(d){var od=d.value;safeHtml(d,optionList(drivers,opT('selectDriverOption'),od),'operations master driver select')}
    var body=byId('appointmentMasterVehicleStaffList'); if(!body)return;
    var assignmentRows=(master.vehicleAssignments||[]).map(cleanVehicleAssignment).filter(Boolean);
    var html=assignmentRows.length?assignmentRows.map(function(r){
      var disabled=!!r.disabled, status=disabled?opT('disabled'):opT('active'), toggleLabel=disabled?opT('enable'):opT('disable');
      return '<tr class="'+(disabled?'appointments-master-disabled':'')+'"><td>'+esc(r.vehicle||'-')+'</td><td>'+esc(r.groomer||'-')+'</td><td>'+esc(r.driver||'-')+'</td><td>'+esc(status)+'</td><td><button type="button" class="appointments-master-action" data-op-click="editVehicleAssignment" data-op-arg1="'+esc(r.vehicle)+'">'+esc(opT('edit'))+'</button><button type="button" class="appointments-master-action" data-op-click="toggleVehicleAssignment" data-op-arg1="'+esc(r.vehicle)+'">'+toggleLabel+'</button><button type="button" class="appointments-master-action danger" data-op-click="removeVehicleAssignment" data-op-arg1="'+esc(r.vehicle)+'">'+esc(opT('deleteAssignment'))+'</button></td></tr>';
    }).join(''):'<tr><td colspan="5" class="appointments-empty appointments-master-empty">'+esc(opT('noVehicleAssignments'))+'</td></tr>';
    safeHtml(body,html,'operations master vehicle assignments table');
  }
  function renderMasterData(){
    var master=readMasterData();
    var section=appointmentMasterSectionValue();
    var sel=byId('appointmentMasterSection');if(sel&&sel.value!==section)sel.value=section;
    document.querySelectorAll('[data-master-panel]').forEach(function(p){p.classList.toggle('active',p.getAttribute('data-master-panel')===section)});
    var a=byId('appointmentAnimalTypesList'), s=byId('appointmentSizesList'), svc=byId('appointmentServicesList'), b=byId('appointmentBreedsList');
    if(a)safeHtml(a, renderMasterPills(master.animalTypes,'animalTypes'), 'operations legacy render');
    if(s)safeHtml(s, renderMasterPills(master.sizes,'sizes'), 'operations legacy render');
    if(svc)renderMasterServices();
    if(b){
      var html=Object.keys(master.breeds||{}).sort(function(x,y){return x.localeCompare(y,'ar')}).map(function(type){return '<div class="appointments-breed-group"><strong>'+esc(type)+'</strong><div>'+renderMasterPills(master.breeds[type]||[],'breeds',type)+'</div></div>'}).join('');
      safeHtml(b, html||'<div class="appointments-empty appointments-master-empty">'+esc(opT('noBreeds'))+'</div>', 'operations legacy render');
    }
    renderMasterCustomers();
    renderVehicleAssignments();
    refreshMasterDrivenSelects();
  }

  function employeeNames(){
    var rows=readKey('PETATOE_PAYROLL_EMPLOYEES_V1',[]);
    if(!Array.isArray(rows))rows=[];
    return uniqueSorted(rows.filter(function(e){return e&&['stopped','resigned','deleted'].indexOf(String(e.status||'active'))===-1}).map(function(e){return e.name||e.fullName||e.employeeName||e.username||e.code||''}))
  }
  function vehicleNames(){
    var names=[];
    var fleet=readKey('fleet',{});
    if(fleet&&Array.isArray(fleet.vehicles)){fleet.vehicles.forEach(function(v){names.push(v.name||v.plate||'')})}
    try{if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.getRecordsSync==='function'){(window.PETATOEDataSource.getRecordsSync()||[]).forEach(function(r){names.push(r.van||r.car||r.vehicle||'')})}}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    return uniqueSorted(names)
  }
  function optionList(items,placeholder,selected){
    selected=String(selected||'');
    var exists=false;
    var html='<option value="">'+esc(placeholder||opT('select'))+'</option>'+(items||[]).map(function(x){x=String(x||'').trim();var sel=x===selected;if(sel)exists=true;return '<option value="'+esc(x)+'" '+(sel?'selected':'')+'>'+esc(x)+'</option>'}).join('');
    if(selected&&!exists)html+='<option value="'+esc(selected)+'" selected>'+esc(selected)+'</option>';
    return html;
  }

  function serviceRowsMaster(){return (readMasterData().services||[]).map(cleanMasterService).filter(Boolean).sort(masterServiceSort)}
  function serviceOptionHtml(selected){
    selected=String(selected||'');
    var rows=serviceRowsMaster(), exists=false;
    var html='<option value="">'+esc(opT('selectService'))+'</option>';
    rows.forEach(function(s){var key=String(s.code||s.name||'');var name=String(s.name||s.code||'');var sel=key===selected||name===selected;if(sel)exists=true;html+='<option value="'+esc(key)+'" data-price="'+esc(s.price||0)+'" data-name="'+esc(name)+'" '+(sel?'selected':'')+'>'+esc(name)+'</option>'});
    if(selected&&!exists)html+='<option value="'+esc(selected)+'" selected>'+esc(selected)+'</option>';
    return html;
  }
  function refreshAppointmentServiceSelects(){
    document.querySelectorAll('.appointment-service-select').forEach(function(sel){var old=sel.value;safeHtml(sel,serviceOptionHtml(old),'operations appointment multi service select')});
  }
  function findMasterService(key){
    key=String(key||'').trim(); if(!key)return null;
    return serviceRowsMaster().filter(function(s){return String(s.code||'')===key||String(s.name||'')===key})[0]||null;
  }
  function animalTargetKey(animal,idx){
    animal=animal||{};
    return String(animal.rowId||animal.petKey||([animal.petName,animal.animalType,animal.breed,animal.size,idx].join('|')));
  }
  function animalTargetLabel(animal,idx){
    animal=animal||{};
    return [animal.petName||(opT('animalNumber',{number:idx+1})),animal.animalType,animal.breed,animal.size].filter(Boolean).join(' - ');
  }
  function normalizeServiceTargets(row){
    var targets=row&&Array.isArray(row.animalTargets)?row.animalTargets:(row&&row.animalTarget?[row.animalTarget]:[]);
    return targets.map(function(x){return String(x||'').trim();}).filter(Boolean);
  }
  function normalizeServiceTargetValue(selectedTargets){
    var targets=normalizeServiceTargets({animalTargets:selectedTargets});
    if(!targets.length||targets.indexOf('__all__')>-1)return '__all__';
    return targets[0]||'__all__';
  }
  function serviceTargetOptionsHtml(selectedTargets){
    var selectedTarget=normalizeServiceTargetValue(selectedTargets);
    var animals=collectAppointmentAnimals();
    var html='<option value="__all__" '+(selectedTarget==='__all__'?'selected':'')+'>'+esc(opT('allAnimals'))+'</option>';
    animals.forEach(function(a,idx){
      var key=animalTargetKey(a,idx), sel=selectedTarget===key;
      html+='<option value="'+esc(key)+'" '+(sel?'selected':'')+'>'+esc(animalTargetLabel(a,idx))+'</option>';
    });
    return html;
  }
  function serviceTargetCountFromSelect(sel){
    var animals=collectAppointmentAnimals();
    var totalAnimals=animals.reduce(function(a,x){return a+(Number(x.petCount||x.count||1)||1)},0)||1;
    if(!sel)return totalAnimals;
    var selected=String(sel.value||'__all__');
    if(!selected||selected==='__all__')return totalAnimals;
    var count=0;
    animals.forEach(function(a,idx){
      var key=animalTargetKey(a,idx);
      if(selected===key)count+=Number(a.petCount||a.count||1)||1;
    });
    return Math.max(1,count||0);
  }
  function refreshAppointmentServiceTargetSelects(){
    document.querySelectorAll('#appointmentServicesRows .appointment-service-targets').forEach(function(sel){
      var selected=sel.value||'__all__';
      safeHtml(sel,serviceTargetOptionsHtml([selected]),'operations appointment service targets');
    });
  }
  function appointmentServiceRowHtml(row){
    row=row||{}; var rowId=String(row.rowId||('srv-'+Date.now()+'-'+Math.floor(Math.random()*10000)));
    var code=String(row.code||row.serviceCode||row.key||'');
    var name=String(row.name||row.serviceName||row.service||'');
    var selected=code||name;
    var unitPrice=Number(row.unitPrice||row.basePrice||row.price||0)||0;
    var targetCount=Math.max(1,Number(row.animalCount||1)||1);
    var gross=Number(row.gross||row.totalBeforeDiscount||(unitPrice*targetCount))||0;
    var discount=Number(row.discount||0)||0;
    var net=Math.max(0,gross-discount);
    return '<div class="appointment-services-grid appointment-service-row" data-service-row-id="'+esc(rowId)+'">'
      +'<select class="appointment-service-select" data-op-change="onAppointmentServiceChange" data-op-pass-self="true">'+serviceOptionHtml(selected)+'</select>'
      +'<select class="appointment-service-targets" data-op-change="recalculateAppointmentServices" title="'+esc(opT('applyServiceTo'))+'">'+serviceTargetOptionsHtml(row.animalTargets||row.targets||[])+'</select>'
      +'<input class="appointment-service-price" type="number" min="0" step="0.01" value="'+esc(unitPrice||0)+'" readonly title="'+esc(opT('unitServicePrice'))+'"/>'
      +'<input class="appointment-service-discount" type="number" min="0" step="0.01" value="'+esc(discount||0)+'" data-op-input="recalculateAppointmentServices"/>'
      +'<input class="appointment-service-net" type="number" min="0" step="0.01" value="'+esc(net||0)+'" readonly title="'+esc(opT('serviceNetAfterDiscount'))+'"/>'
      +'<button type="button" class="appointments-master-action danger" data-op-click="removeAppointmentServiceRow" data-op-pass-self="true">'+esc(opT('delete'))+'</button>'
      +'</div>';
  }
  function renderAppointmentServicesRows(rows){
    var box=byId('appointmentServicesRows'); if(!box)return;
    rows=Array.isArray(rows)&&rows.length?rows:[{}];
    safeHtml(box,rows.map(appointmentServiceRowHtml).join(''),'operations appointment multi service rows');
    refreshAppointmentServiceTargetSelects();
    recalculateAppointmentServices();
  }
  function addAppointmentServiceRow(){
    var box=byId('appointmentServicesRows'); if(!box)return;
    box.insertAdjacentHTML('beforeend',appointmentServiceRowHtml({}));
    refreshAppointmentServiceTargetSelects();
    recalculateAppointmentServices();
  }
  function removeAppointmentServiceRow(btn){
    var row=btn&&btn.closest?btn.closest('.appointment-service-row'):null;
    if(row)row.remove();
    var box=byId('appointmentServicesRows'); if(box&&!box.querySelector('.appointment-service-row'))renderAppointmentServicesRows([{}]);
    recalculateAppointmentServices();
  }
  function onAppointmentServiceChange(sel){
    if(!sel)return;
    var row=sel.closest('.appointment-service-row'); if(!row)return;
    var svc=findMasterService(sel.value);
    var price=row.querySelector('.appointment-service-price');
    if(price)price.value=svc?Number(svc.price||0):0;
    recalculateAppointmentServices();
  }
  function collectAppointmentServices(){
    var out=[];
    document.querySelectorAll('#appointmentServicesRows .appointment-service-row').forEach(function(row){
      var sel=row.querySelector('.appointment-service-select'), targetSel=row.querySelector('.appointment-service-targets'), priceEl=row.querySelector('.appointment-service-price'), discEl=row.querySelector('.appointment-service-discount');
      var key=sel?String(sel.value||'').trim():''; if(!key)return;
      var svc=findMasterService(key)||{};
      var name=String(svc.name||((sel&&sel.options&&sel.selectedIndex>-1)?sel.options[sel.selectedIndex].text:'')||key);
      var code=String(svc.code||key);
      var unitPrice=Number(priceEl&&priceEl.value||svc.price||0)||0;
      var animalTargets=targetSel?[String(targetSel.value||'__all__')]:['__all__'];
      if(!animalTargets.length||!animalTargets[0])animalTargets=['__all__'];
      var animalCount=serviceTargetCountFromSelect(targetSel);
      var gross=unitPrice*animalCount;
      var discount=Math.max(0,Number(discEl&&discEl.value||0)||0);
      if(discount>gross)discount=gross;
      out.push({code:code,name:name,unitPrice:unitPrice,price:gross,animalTargets:animalTargets,animalCount:animalCount,discount:discount,net:Math.max(0,gross-discount)});
    });
    return out;
  }
  function recalculateAppointmentServices(){
    var services=collectAppointmentServices();
    var gross=0, discount=0, net=0;
    document.querySelectorAll('#appointmentServicesRows .appointment-service-row').forEach(function(row){
      var targetSel=row.querySelector('.appointment-service-targets'), priceEl=row.querySelector('.appointment-service-price'), discEl=row.querySelector('.appointment-service-discount'), netEl=row.querySelector('.appointment-service-net');
      var unitPrice=Number(priceEl&&priceEl.value||0)||0;
      var animalCount=serviceTargetCountFromSelect(targetSel);
      var rowGross=unitPrice*animalCount;
      var disc=Math.max(0,Number(discEl&&discEl.value||0)||0);
      if(disc>rowGross){disc=rowGross;if(discEl)discEl.value=disc;}
      var rowNet=Math.max(0,rowGross-disc); if(netEl)netEl.value=rowNet.toFixed(2).replace(/\.00$/,'');
      gross+=rowGross; discount+=disc; net+=rowNet;
    });
    setVal('appointmentSessionPrice',gross.toFixed(2).replace(/\.00$/,''));
    setVal('appointmentDiscount',discount.toFixed(2).replace(/\.00$/,''));
    setVal('appointmentService',services.map(function(s){return s.name}).join(' + '));
    var t=byId('appointmentServicesNetTotal'); if(t)t.textContent=money(net);
    var paid=byId('appointmentPaidAmount'); if(paid&&(!paid.value||Number(paid.value)===0))paid.value=net.toFixed(2).replace(/\.00$/,'');
    return {services:services,gross:gross,discount:discount,net:net};
  }
  function normalizeAppointmentServicesForFill(r){
    var rows=Array.isArray(r&&r.services)?r.services:[];
    if(rows.length)return rows.map(function(x){return {code:x.code||x.serviceCode||'',name:x.name||x.serviceName||x.service||'',unitPrice:Number(x.unitPrice||x.basePrice||x.price||0)||0,price:Number(x.unitPrice||x.basePrice||x.price||0)||0,discount:Number(x.discount||0)||0,animalTargets:x.animalTargets||x.targets||[],animalCount:Number(x.animalCount||1)||1}});
    if(r&&r.service)return [{name:r.service,price:Number(r.sessionPrice||0)||0,discount:Number(r.discount||0)||0,animalTargets:['__all__']}];
    return [{}];
  }
  function animalTypeOptions(selected){
    selected=String(selected||'');
    return optionList(readMasterData().animalTypes||[],opT('selectType'),selected);
  }
  function breedOptionsForType(type,selected){
    selected=String(selected||'');
    var breeds=(readMasterData().breeds||{})[String(type||'')]||[];
    return optionList(breeds,opT('selectBreed'),selected);
  }
  function sizeOptions(selected){
    selected=String(selected||'');
    return optionList(readMasterData().sizes||[],opT('selectSize'),selected);
  }
  function appointmentAnimalRowHtml(row){
    row=row||{};
    var rowId=String(row.rowId||('pet-'+Date.now()+'-'+Math.floor(Math.random()*10000)));
    var type=String(row.animalType||row.type||'');
    return '<div class="appointment-animals-grid appointment-animal-row" data-animal-row-id="'+esc(rowId)+'">'
      +'<input class="appointment-animal-name" list="appointmentPetSuggestions" value="'+esc(row.petName||row.name||'')+'" placeholder="'+esc(opT('petNameExample'))+'" data-op-input="applyPetSuggestion" data-op-blur="applyPetSuggestion"/>'
      +'<select class="appointment-animal-type" data-op-change="onAppointmentAnimalTypeChange" data-op-pass-self="true">'+animalTypeOptions(type)+'</select>'
      +'<select class="appointment-animal-breed" data-op-change="recalculateAppointmentServices">'+breedOptionsForType(type,row.breed||'')+'</select>'
      +'<select class="appointment-animal-size" data-op-change="recalculateAppointmentServices">'+sizeOptions(row.size||'')+'</select>'
      +'<input class="appointment-animal-count" type="number" min="1" step="1" value="'+esc(row.petCount||row.count||1)+'" data-op-input="recalculateAppointmentServices"/>'
      +'<button type="button" class="appointments-master-action danger" data-op-click="removeAppointmentAnimalRow" data-op-pass-self="true">'+esc(opT('delete'))+'</button>'
      +'</div>';
  }
  function syncLegacyAnimalFields(animals){
    animals=Array.isArray(animals)?animals:collectAppointmentAnimals();
    var first=animals[0]||{};
    setVal('appointmentPetName',first.petName||'');
    setVal('appointmentAnimalType',first.animalType||'');
    setVal('appointmentBreed',first.breed||'');
    setVal('appointmentSize',first.size||'');
    setVal('appointmentPetCount',animals.reduce(function(a,x){return a+(Number(x.petCount||x.count||1)||1)},0)||1);
  }
  function renderAppointmentAnimalsRows(rows){
    var box=byId('appointmentAnimalsRows'); if(!box)return;
    rows=Array.isArray(rows)&&rows.length?rows:[{}];
    safeHtml(box,rows.map(appointmentAnimalRowHtml).join(''),'operations appointment multi animals rows');
    syncLegacyAnimalFields(collectAppointmentAnimals());
    refreshAppointmentServiceTargetSelects();
    recalculateAppointmentServices();
    refreshPetSuggestions();
  }
  function addAppointmentAnimalRow(){
    var box=byId('appointmentAnimalsRows'); if(!box)return;
    box.insertAdjacentHTML('beforeend',appointmentAnimalRowHtml({}));
    syncLegacyAnimalFields(collectAppointmentAnimals());
    refreshAppointmentServiceTargetSelects();
    recalculateAppointmentServices();
  }
  function removeAppointmentAnimalRow(btn){
    var row=btn&&btn.closest?btn.closest('.appointment-animal-row'):null;
    if(row)row.remove();
    var box=byId('appointmentAnimalsRows'); if(box&&!box.querySelector('.appointment-animal-row'))renderAppointmentAnimalsRows([{}]);
    syncLegacyAnimalFields(collectAppointmentAnimals());
    refreshAppointmentServiceTargetSelects();
    recalculateAppointmentServices();
  }
  function onAppointmentAnimalTypeChange(sel){
    if(!sel)return;
    var row=sel.closest('.appointment-animal-row'); if(!row)return;
    var breed=row.querySelector('.appointment-animal-breed');
    if(breed)safeHtml(breed,breedOptionsForType(sel.value,breed.value),'operations appointment animal breed select');
    syncLegacyAnimalFields(collectAppointmentAnimals());
    refreshAppointmentServiceTargetSelects();
    recalculateAppointmentServices();
    refreshPetSuggestions();
  }
  function collectAppointmentAnimals(){
    var out=[];
    document.querySelectorAll('#appointmentAnimalsRows .appointment-animal-row').forEach(function(row){
      var nameEl=row.querySelector('.appointment-animal-name'), typeEl=row.querySelector('.appointment-animal-type'), breedEl=row.querySelector('.appointment-animal-breed'), sizeEl=row.querySelector('.appointment-animal-size'), countEl=row.querySelector('.appointment-animal-count');
      var petName=String(nameEl&&nameEl.value||'').trim(), animalType=String(typeEl&&typeEl.value||'').trim(), breed=String(breedEl&&breedEl.value||'').trim(), size=String(sizeEl&&sizeEl.value||'').trim();
      var petCount=Math.max(1,Number(countEl&&countEl.value||1)||1);
      if(petName||animalType||breed||size){out.push({rowId:String(row.getAttribute('data-animal-row-id')||''),petName:petName,animalType:animalType,breed:breed,size:size,petCount:petCount});}
    });
    return out;
  }
  function normalizeAppointmentAnimalsForFill(r){
    var rows=Array.isArray(r&&r.animals)?r.animals:[];
    if(rows.length)return rows.map(function(x){return {rowId:x.rowId||x.petKey||'',petName:x.petName||x.name||'',animalType:x.animalType||x.type||'',breed:x.breed||'',size:x.size||'',petCount:Number(x.petCount||x.count||1)||1}});
    if(r&&(r.petName||r.animalType||r.breed||r.size))return [{petName:r.petName||'',animalType:r.animalType||'',breed:r.breed||'',size:r.size||'',petCount:Number(r.petCount||1)||1}];
    return [{}];
  }
  function hourOptions(selected){
    selected=normalizeHourValue(selected);
    var html='<option value="">'+esc(opT('selectTime'))+'</option>';
    for(var i=0;i<24;i++){var h=pad(i)+':00';html+='<option value="'+h+'" '+(h===selected?'selected':'')+'>'+pad(i)+'</option>';}
    return html;
  }
  function normalizeHourValue(v){
    v=String(v||'').trim();
    if(!v)return '';
    var m=v.match(/^(\d{1,2})(?::\d{1,2})?/);
    if(!m)return '';
    var h=Math.max(0,Math.min(23,Number(m[1])||0));
    return pad(h)+':00';
  }
  function assignedVehicleNames(){
    var names=activeVehicleAssignments().map(function(v){return v&&v.vehicle||''}).filter(Boolean);
    return uniqueSorted(names);
  }
  function refreshTimeSelects(){
    var st=byId('appointmentStart'), en=byId('appointmentEnd');
    if(st)safeHtml(st,hourOptions(st.value),'operations appointment start hour select');
    if(en)safeHtml(en,hourOptions(en.value),'operations appointment end hour select');
  }
  function refreshLookupSelects(){
    var g=byId('appointmentGroomer'), d=byId('appointmentDriver'), v=byId('appointmentVehicle');
    var activeLinks=activeVehicleAssignments(), groomers=normalizeNamedList(activeLinks.map(function(x){return x.groomer}).filter(Boolean)), drivers=normalizeNamedList(activeLinks.map(function(x){return x.driver}).filter(Boolean)), assignedCars=assignedVehicleNames();
    if(g){var old=g.value;safeHtml(g,optionList(groomers,opT('selectGroomerOption'),old),'operations groomer select')}
    if(d){var oldd=d.value;safeHtml(d,optionList(drivers,opT('selectDriverOption'),oldd),'operations driver select')}
    if(v){var oldv=v.value;safeHtml(v,optionList(assignedCars,opT('selectVehicle'),oldv),'operations vehicle select')}
    applyVehicleStaffAssignment();
    refreshTimeSelects();
  }
  function normalizeStatus(s){s=String(s||'مجدول').trim();return LEGACY_STATUS_MAP[s]||s||'مجدول'}
  function statusClass(s){
    s=normalizeStatus(s);
    if(s==='مؤكد')return 'confirmed';
    if(s==='مغلق')return 'closed';
    if(s==='غير مكتملة')return 'incomplete';
    if(s==='تمت الجلسة'||s==='تم التحصيل')return 'done';
    if(s==='مؤجل')return 'postponed';
    if(s==='ملغي')return 'cancelled';
    if(s==='في الطريق'||s==='وصل العميل'||s==='بدأت الجلسة')return 'active';
    return 'scheduled';
  }
  function statusOptionsHtml(selected){selected=normalizeStatus(selected);return STATUS_FLOW.map(function(x){return '<option value="'+esc(x)+'" '+(x===selected?'selected':'')+'>'+esc(x)+'</option>'}).join('')}
  function statusSelectHtml(id,selected,attrs){return '<select '+(id?'id="'+esc(id)+'"':'')+' class="appointments-status-input '+statusClass(selected)+'" '+(attrs||'')+'>'+statusOptionsHtml(selected)+'</select>'}
  function collect(){
    var svcCalc=recalculateAppointmentServices();
    var animals=collectAppointmentAnimals();
    syncLegacyAnimalFields(animals);
    var firstAnimal=animals[0]||{};
    return calcFinancials({id:val('appointmentId')||('APT-'+Date.now()),customerId:val('appointmentCustomerId'),client:val('appointmentClient'),phone:val('appointmentPhone'),animalType:firstAnimal.animalType||val('appointmentAnimalType'),breed:firstAnimal.breed||val('appointmentBreed'),size:firstAnimal.size||val('appointmentSize'),petName:firstAnimal.petName||val('appointmentPetName'),petCount:animals.reduce(function(a,x){return a+(Number(x.petCount||1)||1)},0)||Number(val('appointmentPetCount')||1),animals:animals,service:(svcCalc.services||[]).map(function(s){return s.name}).join(' + '),services:svcCalc.services,date:val('appointmentDate'),start:normalizeHourValue(val('appointmentStart')),end:normalizeHourValue(val('appointmentEnd')),groomer:val('appointmentGroomer'),driver:val('appointmentDriver'),vehicle:val('appointmentVehicle'),paymentMethod:val('appointmentPaymentMethod'),sessionPrice:svcCalc.gross,discount:svcCalc.discount,paidAmount:numVal('appointmentPaidAmount'),collectionStatus:val('appointmentCollectionStatus'),status:normalizeStatus(val('appointmentStatus')||'مجدول'),address:val('appointmentAddress'),googleMapUrl:normalizeGoogleMapUrl(val('appointmentGoogleMapUrl')),notes:val('appointmentNotes'),updatedAt:new Date().toISOString()});
  }
  function fill(r){
    refreshLookupSelects();
    setVal('appointmentId',r.id);setVal('appointmentCustomerId',r.customerId||customerKey(r));setVal('appointmentClient',r.client);setVal('appointmentPhone',r.phone);renderAppointmentAnimalsRows(normalizeAppointmentAnimalsForFill(r));renderAppointmentServicesRows(normalizeAppointmentServicesForFill(r));setVal('appointmentDate',r.date);setVal('appointmentStart',r.start);setVal('appointmentEnd',r.end);setVal('appointmentGroomer',r.groomer);setVal('appointmentDriver',r.driver);setVal('appointmentVehicle',r.vehicle);setVal('appointmentPaymentMethod',r.paymentMethod);setVal('appointmentPaidAmount',r.paidAmount||0);setVal('appointmentCollectionStatus',r.collectionStatus||'غير محصل');setVal('appointmentStatus',normalizeStatus(r.status));setVal('appointmentAddress',r.address);setVal('appointmentGoogleMapUrl',appointmentMapUrl(r));setVal('appointmentNotes',r.notes); recalculateAppointmentServices(); refreshPetSuggestions();
    var t=byId('appointmentFormTitle');if(t)t.textContent=opT('editAppointmentTitle');
  }
  function setTab(tab){
    currentTab=tab||'add';
    // PETATOE v6.4.90: when opening appointments master data directly, keep the screen clean
    // by hiding the appointments dashboard header, KPI cards, and internal quick tabs only.
    // This is a controlled view-state change; it does not touch router, storage, or permissions.
    var panel=byId('appointments');
    if(panel)panel.classList.toggle('appointments-master-only',currentTab==='master');
    document.querySelectorAll('[data-appointment-tab]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-appointment-tab')===currentTab)});
    document.querySelectorAll('[data-appointment-section]').forEach(function(s){s.classList.toggle('active',s.getAttribute('data-appointment-section')===currentTab)});
    render();
  }
  function clearForm(){
    ['appointmentId','appointmentCustomerId','appointmentClient','appointmentPhone','appointmentPetName','appointmentAddress','appointmentGoogleMapUrl','appointmentNotes'].forEach(function(id){setVal(id,'')});
    refreshLookupSelects();
    setVal('appointmentAnimalType','');setVal('appointmentBreed','');setVal('appointmentSize','');setVal('appointmentService','');setVal('appointmentPetCount','1');renderAppointmentAnimalsRows([{}]);setVal('appointmentDate',today());setVal('appointmentStart','');setVal('appointmentEnd','');renderAppointmentServicesRows([{}]);setVal('appointmentGroomer','');setVal('appointmentDriver','');setVal('appointmentVehicle','');setVal('appointmentPaymentMethod','');setVal('appointmentSessionPrice','0');setVal('appointmentDiscount','0');setVal('appointmentPaidAmount','0');setVal('appointmentCollectionStatus','غير محصل');setVal('appointmentStatus','مجدول'); refreshPetSuggestions();
    var t=byId('appointmentFormTitle');if(t)t.textContent=opT('addAppointmentTitle');
  }
  function saveAppointment(){
    if(window.PETATOEOperationsAppointmentsActions&&typeof window.PETATOEOperationsAppointmentsActions.saveAppointment==='function'&&!saveAppointment._opsDelegating){
      saveAppointment._opsDelegating=true;
      try{return window.PETATOEOperationsAppointmentsActions.saveAppointment()}
      finally{saveAppointment._opsDelegating=false}
    }
    var r=collect();
    if(!r.client){alert(opT('enterCustomerName'));return}
    if(!r.date){alert(opT('selectAppointmentDate'));return}
    if(!r.services||!r.services.length){alert(opT('selectAtLeastOneService'));return}
    var rows=read();
    var profile=findCustomerProfile();
    if(profile){
      r.customerId=profile.key;
      if(!r.phone&&profile.phone)r.phone=profile.phone;
      if(!r.address&&profile.address)r.address=profile.address;
    }
    var conflicts=findConflicts(r,rows);
    if(conflicts.length){alert(opT('appointmentConflictHeader')+'\n'+conflicts.map(function(c){return opT('appointmentConflictLine',{reason:c.reason,client:(c.row.client||opT('unspecifiedCustomer')),start:(c.row.start||'?'),end:(c.row.end||'?')})}).join('\n'));return}

    var idx=rows.findIndex(function(x){return String(x.id)===String(r.id)});
    if(idx>-1){
      var oldRow=Object.assign({},rows[idx]);
      rows[idx]=Object.assign({},rows[idx],r);
      pushExecutionLog(rows[idx],'edit',{oldStatus:normalizeStatus(oldRow.status),status:normalizeStatus(rows[idx].status),changes:summarizeAppointmentChanges(oldRow,rows[idx])});
    }else{
      rows.unshift(r);
      pushExecutionLog(rows[0],'create',{status:normalizeStatus(rows[0].status),notes:opT('appointmentCreatedFromManagement')});
    }
    upsertMasterCustomer({code:r.customerId||customerKey(r),name:r.client,phone:r.phone,address:r.address,googleMapUrl:appointmentMapUrl(r)});
    write(rows);clearForm();setTab('log');toast(opT('appointmentSaved'));
  }
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else if(typeof window.toastSafe==='function')window.toastSafe(msg)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}}
  function edit(id){if(window.PETATOEOperationsAppointmentsActions&&typeof window.PETATOEOperationsAppointmentsActions.edit==='function'&&!edit._opsDelegating){edit._opsDelegating=true;try{return window.PETATOEOperationsAppointmentsActions.edit(id)}finally{edit._opsDelegating=false}}var r=read().find(function(x){return String(x.id)===String(id)});if(!r)return;fill(r);setTab('add')}
  function remove(id){if(window.PETATOEOperationsAppointmentsActions&&typeof window.PETATOEOperationsAppointmentsActions.remove==='function'&&!remove._opsDelegating){remove._opsDelegating=true;try{return window.PETATOEOperationsAppointmentsActions.remove(id)}finally{remove._opsDelegating=false}}if(!confirm(opT('confirmDeleteAppointment')))return;write(read().filter(function(x){return String(x.id)!==String(id)}));render();toast(opT('appointmentDeleted'))}
  function changeStatus(id,s){if(window.PETATOEOperationsAppointmentsActions&&typeof window.PETATOEOperationsAppointmentsActions.changeStatus==='function'&&!changeStatus._opsDelegating){changeStatus._opsDelegating=true;try{return window.PETATOEOperationsAppointmentsActions.changeStatus(id,s)}finally{changeStatus._opsDelegating=false}}var rows=read();rows.forEach(function(x){if(String(x.id)===String(id))x.status=normalizeStatus(s)});write(rows);render();toast(opT('appointmentStatusUpdated'))}
  function filtered(){
    var filters={
      q:val('appointmentSearch').toLowerCase(),
      status:val('appointmentStatusFilter'),
      animal:val('appointmentAnimalFilter'),
      groomer:val('appointmentGroomerFilter'),
      driver:val('appointmentDriverFilter'),
      vehicle:val('appointmentVehicleFilter'),
      payment:val('appointmentPaymentFilter'),
      from:val('appointmentDateFromFilter'),
      to:val('appointmentDateToFilter')
    };
    if(window.PETATOEOperationsAppointments&&typeof window.PETATOEOperationsAppointments.filterRows==='function'){
      return window.PETATOEOperationsAppointments.filterRows(read(),filters);
    }
    var q=filters.q, st=filters.status, an=filters.animal, gr=filters.groomer, dr=filters.driver, vh=filters.vehicle, pay=filters.payment, from=filters.from, to=filters.to;
    return read().filter(function(r){
      var blob=[r.client,r.phone,r.animalType,r.breed,r.size,r.petName,r.service,r.groomer,r.driver,r.vehicle,r.paymentMethod,r.address,r.notes,r.status].join(' ').toLowerCase();
      var d=String(r.date||'');
      return (!q||blob.indexOf(q)>-1)
        && (!st||st==='all'||normalizeStatus(r.status)===normalizeStatus(st))
        && (!an||an==='all'||r.animalType===an)
        && (!gr||gr==='all'||r.groomer===gr)
        && (!dr||dr==='all'||r.driver===dr)
        && (!vh||vh==='all'||r.vehicle===vh)
        && (!pay||pay==='all'||r.paymentMethod===pay)
        && (!from||d>=from)
        && (!to||d<=to);
    }).sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||''))});
  }
  function sameDate(r,key){return String((r&&r.date)||'')===String(key||'')}
  function inRange(r,from,to){var d=String((r&&r.date)||'');return !!d && (!from||d>=from) && (!to||d<=to)}
  function countStatus(rows,status){status=normalizeStatus(status);return (rows||[]).filter(function(r){return normalizeStatus(r.status)===status}).length}
  function countAnyStatus(rows,list){return (rows||[]).filter(function(r){return list.indexOf(normalizeStatus(r.status))>-1}).length}
  function renderKpis(rows){
    var el=byId('appointmentsKpis');if(!el)return;
    var all=read(), now=new Date(), t=today(), tomorrowKey=dateKey(addDays(now,1));
    var monthFrom=monthStart(now), monthTo=monthEnd(now);
    var todayRows=all.filter(function(r){return sameDate(r,t)}).length;
    var tomorrowRows=all.filter(function(r){return sameDate(r,tomorrowKey)}).length;
    var monthRows=all.filter(function(r){return inRange(r,monthFrom,monthTo)}).length;
    var active=countAnyStatus(all,['في الطريق','وصل العميل','بدأت الجلسة']), completed=countAnyStatus(all,['تمت الجلسة','تم التحصيل','تم']), postponed=countStatus(all,'مؤجل'), cancelled=countStatus(all,'ملغي');
    var monthFinancial=all.filter(function(r){return inRange(r,monthFrom,monthTo)}).reduce(function(a,r){r=calcFinancials(r);a.total+=r.totalAmount;a.paid+=r.paidAmount;a.remaining+=r.remainingAmount;return a},{total:0,paid:0,remaining:0});
    var alertCount=buildAlerts(all).length;
    var cards=[
      ['🔔',opT('activeAlerts'),alertCount],
      ['📅',opT('todayAppointments'),todayRows],
      ['🌅',opT('tomorrowAppointments'),tomorrowRows],
      ['🗓️',opT('monthAppointments'),monthRows],
      ['💰',opT('monthRevenue'),money(monthFinancial.total)],
      ['✅',opT('monthCollected'),money(monthFinancial.paid)],
      ['⏳',opT('monthRemaining'),money(monthFinancial.remaining)]
    ];
    safeHtml(el, cards.map(function(c){return '<div class="appointments-kpi"><span class="ico">'+c[0]+'</span><div><span>'+esc(c[1])+'</span><b>'+c[2]+'</b></div></div>'}).join(''), 'operations legacy render');
  }
  function renderStatusFilter(){var sel=byId('appointmentStatusFilter');if(!sel)return;var old=sel.value||'all';safeHtml(sel, '<option value="all">'+esc(opT('allStatuses'))+'</option>'+STATUS_FLOW.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join(''), 'operations legacy render');sel.value=(old==='all'||STATUS_FLOW.indexOf(normalizeStatus(old))>-1)?(old==='all'?'all':normalizeStatus(old)):'all'}
  function renderSelectFilter(id,placeholder,values){
    var sel=byId(id);if(!sel)return;var old=sel.value||'all';
    var clean=uniqueSorted(values||[]);
    safeHtml(sel, '<option value="all">'+esc(placeholder)+'</option>'+clean.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join(''), 'operations legacy render');
    sel.value=clean.indexOf(old)>-1?old:'all';
  }
  function renderDynamicFilters(){
    var rows=read();
    renderStatusFilter();
    renderSelectFilter('appointmentAnimalFilter',opT('allAnimalTypes'),rows.map(function(r){return r.animalType}));
    renderSelectFilter('appointmentGroomerFilter',opT('allGroomers'),rows.map(function(r){return r.groomer}));
    renderSelectFilter('appointmentDriverFilter',opT('allDrivers'),rows.map(function(r){return r.driver}));
    renderSelectFilter('appointmentVehicleFilter',opT('allVehicles'),rows.map(function(r){return r.vehicle}));
  }
  function applyQuickActive(){
    document.querySelectorAll('[data-appointment-quick]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-appointment-quick')===quickRange)});
  }
  function setQuickRange(range){
    quickRange=range||'all';
    var now=new Date();
    if(quickRange==='today'){setVal('appointmentDateFromFilter',today());setVal('appointmentDateToFilter',today())}
    else if(quickRange==='tomorrow'){var t=dateKey(addDays(now,1));setVal('appointmentDateFromFilter',t);setVal('appointmentDateToFilter',t)}
    else if(quickRange==='week'){var w=weekRange(now);setVal('appointmentDateFromFilter',w.from);setVal('appointmentDateToFilter',w.to)}
    else if(quickRange==='month'){setVal('appointmentDateFromFilter',monthStart(now));setVal('appointmentDateToFilter',monthEnd(now))}
    else{setVal('appointmentDateFromFilter','');setVal('appointmentDateToFilter','')}
    render();
  }
  function appointmentAnimalSummary(r){return [r.animalType,r.breed,r.size,r.petName, r.petCount?opT('countValue',{count:r.petCount}):''].filter(Boolean).join(' - ')}
  function appointmentStatusBadge(r){var st=normalizeStatus((r&&r.status)||'مجدول');return '<span class="appointments-status '+statusClass(st)+'">'+esc(opStatusT(st))+'</span>'}
  function appointmentDetailItem(label,value,extraClass){return '<div class="appointment-detail-item '+(extraClass||'')+'"><span>'+esc(label)+'</span><b>'+esc((value===0||value)?value:'-')+'</b></div>'}
  var appointmentDetailsHoverTimer=null;
  var appointmentDetailsActiveId=null;
  function appointmentDetailsFinancialClass(label,value){
    var n=Number(value||0);
    if(label===opT('remaining')&&n>0)return ' danger';
    if(label===opT('collected')&&n>=0)return ' success';
    return '';
  }
  function appointmentPopoverItem(label,value,icon,kind){
    var cls=(kind||'').replace(/\s+(success|danger)\b/g,function(_,name){return name==='success'?' appt-money-paid':' appt-money-remaining'});
    return '<div class="appointment-popover-item'+cls+'"><span>'+(icon?'<i class="appt-popover-icon">'+esc(icon)+'</i>':'')+esc(label)+'</span><b>'+esc((value===0||value)?value:'-')+'</b></div>';
  }
  function buildAppointmentDetailsPopover(r){
    var animal=appointmentAnimalSummary(r);
    var time=[r.start,r.end].filter(Boolean).join(' - ')||'-';
    var st=normalizeStatus((r&&r.status)||'مجدول');
    return '<div class="appointment-popover-head">'
      +'<div><small>'+esc(opT('appointmentDetails'))+'</small><h3>'+esc(r.client||'-')+'</h3><p>'+esc([r.date,time].filter(Boolean).join(' • '))+'</p></div>'
      +appointmentStatusBadge(r)
      +'</div>'
      +'<div class="appointment-popover-hero"><div><span>'+esc(opT('animal'))+'</span><b>'+esc(r.petName||r.animalType||'-')+'</b><small>'+esc(animal||'-')+'</small></div><div><span>'+esc(opT('value'))+'</span><b>'+money(r.totalAmount)+'</b><small>'+esc(r.collectionStatus||'-')+'</small></div></div>'
      +'<div class="appointment-popover-grid">'
      +'<div class="appointment-popover-section"><h4>👤 '+esc(opT('customerInformation'))+'</h4>'+appointmentPopoverItem(opT('customerName'),r.client,'👤')+appointmentPopoverItem(opT('phone'),r.phone,'☎')+appointmentPopoverItem(opT('address'),r.address,'📍',' wide')+'</div>'
      +'<div class="appointment-popover-section"><h4>🐾 '+esc(opT('sessionInformation'))+'</h4>'+appointmentPopoverItem(opT('animalType'),r.animalType,'🐾')+appointmentPopoverItem(opT('breed'),r.breed,'🧬')+appointmentPopoverItem(opT('size'),r.size,'↔')+appointmentPopoverItem(opT('petName'),r.petName,'🏷')+appointmentPopoverItem(opT('count'),r.petCount||1,'#')+appointmentPopoverItem(opT('service'),r.service,'🛁')+'</div>'
      +'<div class="appointment-popover-section"><h4>🚐 '+esc(opT('operations'))+'</h4>'+appointmentPopoverItem(opT('groomer'),r.groomer,'✂')+appointmentPopoverItem(opT('driver'),r.driver,'🧑‍✈️')+appointmentPopoverItem(opT('vehicle'),r.vehicle,'🚐')+'</div>'
      +'<div class="appointment-popover-section"><h4>💰 '+esc(opT('financials'))+'</h4>'+appointmentPopoverItem(opT('paymentMethod'),r.paymentMethod,'💳')+appointmentPopoverItem(opT('total'),money(r.totalAmount),'₪')+appointmentPopoverItem(opT('discount'),money(r.discount),'٪')+appointmentPopoverItem(opT('collected'),money(r.paidAmount),'✓',' success')+appointmentPopoverItem(opT('remaining'),money(r.remainingAmount),'!',' danger')+'</div>'
      +'</div>'
      +'<div class="appointment-popover-notes"><span>📝 '+esc(opT('notes'))+'</span><b>'+esc(r.notes||'-')+'</b></div>'
      +'<div class="appointment-popover-foot"><span>'+esc(opT('appointmentNumber'))+': '+esc(r.id||'-')+'</span><span>'+esc(opT('status'))+': '+esc(opStatusT(st))+'</span></div>';
  }
  function positionAppointmentDetailsPopover(pop,btn){
    if(!pop||!btn)return;
    var gap=12, pad=10;
    var br=btn.getBoundingClientRect();
    var pw=Math.min(560, Math.max(360, pop.offsetWidth||520));
    var ph=pop.offsetHeight||420;
    var vw=window.innerWidth||document.documentElement.clientWidth||1200;
    var vh=window.innerHeight||document.documentElement.clientHeight||800;
    var top=br.bottom+gap;
    var left=br.left+(br.width/2)-(pw/2);
    if(top+ph>vh-pad){top=br.top-ph-gap;pop.classList.add('above')}else{pop.classList.remove('above')}
    if(top<pad)top=pad;
    if(left<pad)left=pad;
    if(left+pw>vw-pad)left=vw-pad-pw;
    pop.style.width=pw+'px';
    pop.style.top=top+'px';
    pop.style.left=left+'px';
  }
  function closeAppointmentDetails(){
    clearTimeout(appointmentDetailsHoverTimer);
    appointmentDetailsActiveId=null;
    var el=byId('appointmentDetailsPopover');if(el&&el.parentNode)el.parentNode.removeChild(el);
  }
  function scheduleAppointmentDetailsClose(){
    clearTimeout(appointmentDetailsHoverTimer);
    appointmentDetailsHoverTimer=setTimeout(function(){closeAppointmentDetails()},180);
  }
  function showAppointmentDetails(id,anchor){
    var rows=read().map(function(x){return calcFinancials(x)});
    var r=rows.find(function(x){return String(x.id||'')===String(id||'')});
    if(!r){toast(opT('appointmentNotFound'));return}
    clearTimeout(appointmentDetailsHoverTimer);
    appointmentDetailsActiveId=String(id||'');
    var pop=byId('appointmentDetailsPopover');
    if(!pop){
      pop=document.createElement('div');
      pop.id='appointmentDetailsPopover';
      pop.className='appointment-details-popover';
      pop.setAttribute('role','tooltip');
      pop.addEventListener('mouseenter',function(){clearTimeout(appointmentDetailsHoverTimer)});
      pop.addEventListener('mouseleave',scheduleAppointmentDetailsClose);
      document.body.appendChild(pop);
    }
    safeHtml(pop,buildAppointmentDetailsPopover(r),'operations appointment details popover');
    pop.style.visibility='hidden';
    pop.style.display='block';
    positionAppointmentDetailsPopover(pop,anchor||document.querySelector('[data-appt-popover-id="'+String(id).replace(/"/g,'\\"')+'"]'));
    pop.style.visibility='visible';
  }
  function bindAppointmentDetailsPopover(){
    document.querySelectorAll('[data-appt-popover-id]').forEach(function(btn){
      if(btn.__apptPopoverBound)return;
      btn.__apptPopoverBound=true;
      btn.addEventListener('mouseenter',function(){showAppointmentDetails(btn.getAttribute('data-appt-popover-id'),btn)});
      btn.addEventListener('focus',function(){showAppointmentDetails(btn.getAttribute('data-appt-popover-id'),btn)});
      btn.addEventListener('mouseleave',scheduleAppointmentDetailsClose);
      btn.addEventListener('blur',scheduleAppointmentDetailsClose);
      btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();showAppointmentDetails(btn.getAttribute('data-appt-popover-id'),btn)});
    });
  }
  function renderTable(){
    var body=byId('appointmentsBody');if(!body)return;var rows=filtered();
    safeHtml(body, rows.length?rows.map(function(r,i){
      r=calcFinancials(r);
      var animal=appointmentAnimalSummary(r);
      var dateCell=esc(r.date||'-')+'<small class="appointments-date-sub">'+esc([r.start,r.end].filter(Boolean).join(' - ')||'-')+'</small>';
      var actions='<div class="appointments-log-actions"><button class="btn btn-ghost appointment-details-btn appointment-details-hover-btn" type="button" data-appt-popover-id="'+esc(r.id)+'" aria-label="'+esc(opT('viewAppointmentDetails'))+'">📄 '+esc(opT('details'))+'</button><button class="btn btn-ghost appointments-log-edit-btn" type="button" data-op-click="edit" data-op-arg1="'+esc(r.id)+'">✏️ '+esc(opT('edit'))+'</button><button class="btn btn-ghost appointments-log-delete-btn danger" type="button" data-op-click="remove" data-op-arg1="'+esc(r.id)+'">🗑️ '+esc(opT('delete'))+'</button></div>';
      return '<tr><td>'+(i+1)+'</td><td class="appointments-date-cell">'+dateCell+'</td><td>'+esc(r.client||'-')+'</td><td class="appointments-animal-cell">'+esc(animal||'-')+'</td><td>'+esc(r.service||'-')+'</td><td>'+esc(r.vehicle||'-')+'</td><td>'+money(r.totalAmount)+'</td><td>'+appointmentStatusBadge(r)+'</td><td>'+actions+'</td></tr>';
    }).join(''):'<tr><td colspan="9" class="appointments-empty">'+esc(opT('noAppointmentsForFilters'))+'</td></tr>', 'operations appointments table render');
    bindAppointmentDetailsPopover();
  }
  function pct(part,total){return total?Math.round((Number(part||0)/Number(total||1))*1000)/10:0}
  function reportRowsByField(rows,field,emptyLabel){
    var map={};
    var sourceRows=Array.isArray(rows)?rows:[];
    sourceRows.forEach(function(r){
      var raw=(typeof field==='function'?field(r):r&&r[field]);
      var key=String(raw||'').trim()||emptyLabel||'غير محدد';
      map[key]=(map[key]||0)+1;
    });
    return Object.keys(map).map(function(k){
      var count=Number(map[k]||0);
      return {name:k,count:count,percent:pct(count,sourceRows.length)};
    }).sort(function(a,b){return b.count-a.count||String(a.name).localeCompare(String(b.name),'ar')})
  }
  function customerKey(r){
    var cid=String((r&&r.customerId)||'').trim();
    if(cid)return cid;
    var phone=String((r&&r.phone)||'').replace(/\s+/g,'').trim();
    var name=String((r&&r.client)||'').trim();
    return phone?('phone:'+phone):('name:'+name.toLowerCase());
  }
  function buildCustomerProfiles(){
    var map={};
    read().map(function(r){return calcFinancials(r)}).forEach(function(r){
      var key=customerKey(r); if(!key)return;
      if(!map[key])map[key]={key:key,client:r.client||'عميل غير محدد',phone:r.phone||'',address:r.address||'',googleMapUrl:appointmentMapUrl(r),notes:'',appointments:[],pets:{},total:0,paid:0,remaining:0,lastVisit:'',firstVisit:''};
      var c=map[key];
      if(r.client)c.client=r.client; if(r.phone)c.phone=r.phone; if(r.address)c.address=r.address; if(appointmentMapUrl(r))c.googleMapUrl=appointmentMapUrl(r);
      c.appointments.push(r); c.total+=Number(r.totalAmount||0); c.paid+=Number(r.paidAmount||0); c.remaining+=Number(r.remainingAmount||0);
      if(r.date){ if(!c.firstVisit||r.date<c.firstVisit)c.firstVisit=r.date; if(!c.lastVisit||r.date>c.lastVisit)c.lastVisit=r.date; }
      var appointmentAnimals=Array.isArray(r.animals)&&r.animals.length?r.animals:[{animalType:r.animalType||'',breed:r.breed||'',size:r.size||'',petName:r.petName||'',petCount:r.petCount||1}];
      appointmentAnimals.forEach(function(ap){
        var petKey=[ap.animalType,ap.breed,ap.size,ap.petName].filter(Boolean).join(' - ')||'حيوان غير محدد';
        if(!c.pets[petKey])c.pets[petKey]={animalType:ap.animalType||'',breed:ap.breed||'',size:ap.size||'',petName:ap.petName||'',count:0,visits:0,services:{}};
        c.pets[petKey].count=Math.max(c.pets[petKey].count,Number(ap.petCount||ap.count||1));
        c.pets[petKey].visits+=1;
        if(r.service)c.pets[petKey].services[r.service]=(c.pets[petKey].services[r.service]||0)+1;
      });
    });
    (readMasterData().customers||[]).forEach(function(mc){
      mc=cleanMasterCustomer(mc); if(!mc)return;
      var key=mc.code||mc.phone||mc.name; if(!key)return;
      if(!map[key])map[key]={key:key,client:mc.name||'عميل غير محدد',phone:mc.phone||'',address:mc.address||'',notes:'',appointments:[],pets:{},total:0,paid:0,remaining:0,lastVisit:'',firstVisit:''};
      if(mc.name)map[key].client=mc.name; if(mc.phone)map[key].phone=mc.phone; if(mc.address)map[key].address=mc.address;
    });
    return Object.keys(map).map(function(k){
      var c=map[k]; c.petsList=Object.keys(c.pets).map(function(pk){var pet=c.pets[pk];pet.label=pk;pet.topServices=Object.keys(pet.services).sort(function(a,b){return pet.services[b]-pet.services[a]}).slice(0,3);return pet});
      return c;
    }).sort(function(a,b){return String(b.lastVisit||'').localeCompare(String(a.lastVisit||''))||b.appointments.length-a.appointments.length});
  }
  function normalizePhone(v){return String(v||'').replace(/\s+/g,'').trim()}
  function findCustomerProfile(mode){
    var name=String(val('appointmentClient')||'').trim(), phone=val('appointmentPhone'), code=String(val('appointmentCustomerId')||'').trim();
    if(!name&&!phone&&!code)return null;
    var normalizedPhone=normalizePhone(phone), normalizedName=name.toLowerCase();
    var rows=buildCustomerProfiles();
    return rows.find(function(c){return code&&String(c.key||'')===code;})
      || rows.find(function(c){return normalizedPhone&&normalizePhone(c.phone)===normalizedPhone;})
      || rows.find(function(c){return normalizedName&&String(c.client||'').trim().toLowerCase()===normalizedName;})
      || null;
  }
  function renderClientSuggestions(){
    var clients=byId('appointmentClientSuggestions'), phones=byId('appointmentPhoneSuggestions');
    var profiles=buildCustomerProfiles();
    if(clients)safeHtml(clients, profiles.map(function(c){return '<option value="'+esc(c.client)+'">'+esc([c.phone,c.address].filter(Boolean).join(' | '))+'</option>'}).join(''), 'operations customer name suggestions');
    if(phones)safeHtml(phones, profiles.filter(function(c){return c.phone}).map(function(c){return '<option value="'+esc(c.phone)+'">'+esc([c.client,c.address].filter(Boolean).join(' | '))+'</option>'}).join(''), 'operations customer phone suggestions');
  }
  function refreshPetSuggestions(){
    var dl=byId('appointmentPetSuggestions'); if(!dl)return;
    var found=findCustomerProfile();
    var activeRow=document.activeElement&&document.activeElement.closest?document.activeElement.closest('.appointment-animal-row'):null;
    var typeEl=activeRow?activeRow.querySelector('.appointment-animal-type'):null;
    var animal=(typeEl&&typeEl.value)||val('appointmentAnimalType');
    var pets=(found&&found.petsList?found.petsList:[]).filter(function(p){return !animal||String(p.animalType||'')===String(animal)});
    safeHtml(dl, pets.map(function(p){return '<option value="'+esc(p.petName||p.label)+'">'+esc([p.animalType,p.breed,p.size,p.count?('عدد '+p.count):'',(p.topServices||[]).join('، ')].filter(Boolean).join(' | '))+'</option>'}).join(''), 'operations legacy render');
    return pets;
  }
  function applyPetSuggestion(){
    var activeRow=document.activeElement&&document.activeElement.closest?document.activeElement.closest('.appointment-animal-row'):null;
    var nameEl=activeRow?activeRow.querySelector('.appointment-animal-name'):null;
    var petName=(nameEl&&nameEl.value)||val('appointmentPetName');
    var pets=refreshPetSuggestions();
    if(!petName||!pets.length)return;
    var found=pets.find(function(p){return String(p.petName||p.label||'').trim()===String(petName).trim()});
    if(!found)return;
    if(activeRow){
      var typeEl=activeRow.querySelector('.appointment-animal-type'), breedEl=activeRow.querySelector('.appointment-animal-breed'), sizeEl=activeRow.querySelector('.appointment-animal-size'), countEl=activeRow.querySelector('.appointment-animal-count');
      if(typeEl&&!typeEl.value&&found.animalType){typeEl.value=found.animalType;onAppointmentAnimalTypeChange(typeEl);}
      if(breedEl&&!breedEl.value&&found.breed)breedEl.value=found.breed;
      if(sizeEl&&!sizeEl.value&&found.size)sizeEl.value=found.size;
      if(countEl&&(!countEl.value||countEl.value==='1')&&found.count)countEl.value=found.count;
      syncLegacyAnimalFields(collectAppointmentAnimals());
      refreshAppointmentServiceTargetSelects();
      recalculateAppointmentServices();
      return;
    }
    if(!val('appointmentAnimalType')&&found.animalType){setVal('appointmentAnimalType',found.animalType);refreshBreedOptions();}
    if(!val('appointmentBreed')&&found.breed)setVal('appointmentBreed',found.breed);
    if(!val('appointmentSize')&&found.size)setVal('appointmentSize',found.size);
    if((!val('appointmentPetCount')||val('appointmentPetCount')==='1')&&found.count)setVal('appointmentPetCount',found.count);
  }
  function newCustomer(){
    ['appointmentCustomerId','appointmentClient','appointmentPhone','appointmentAnimalType','appointmentBreed','appointmentSize','appointmentPetName','appointmentAddress','appointmentGoogleMapUrl'].forEach(function(id){setVal(id,'')});
    setVal('appointmentPetCount','1');
    renderAppointmentAnimalsRows([{}]);
    refreshPetSuggestions();
    var c=byId('appointmentClient'); if(c)c.focus();
  }
  function applyCustomerSuggestion(source){
    var srcId=source&&source.id?source.id:'';
    var found=findCustomerProfile();
    if(!found){setVal('appointmentCustomerId','');refreshPetSuggestions();return;}
    setVal('appointmentCustomerId',found.key);
    if(srcId!=='appointmentClient'&&!val('appointmentClient'))setVal('appointmentClient',found.client);
    if(srcId==='appointmentPhone'&&found.client)setVal('appointmentClient',found.client);
    if(srcId!=='appointmentPhone'&&!val('appointmentPhone'))setVal('appointmentPhone',found.phone);
    if(found.address&&!val('appointmentAddress'))setVal('appointmentAddress',found.address);
    if(found.googleMapUrl&&!val('appointmentGoogleMapUrl'))setVal('appointmentGoogleMapUrl',found.googleMapUrl);
    var pets=refreshPetSuggestions();
    if(pets&&pets.length){
      var hasManualAnimal=collectAppointmentAnimals().some(function(x){return x.petName||x.animalType||x.breed||x.size;});
      if(!hasManualAnimal){
        renderAppointmentAnimalsRows(pets.map(function(p){return {
          petName:p.petName||p.label||'',
          animalType:p.animalType||'',
          breed:p.breed||'',
          size:p.size||'',
          petCount:Number(p.count||p.petCount||1)||1
        };}));
      }else if(pets.length===1&&!val('appointmentPetName')){
        var pet=pets[0];
        if(!val('appointmentAnimalType')){setVal('appointmentAnimalType',pet.animalType);refreshBreedOptions();}
        if(!val('appointmentBreed')&&pet.breed)setVal('appointmentBreed',pet.breed);
        if(!val('appointmentSize')&&pet.size)setVal('appointmentSize',pet.size);
        if(!val('appointmentPetName'))setVal('appointmentPetName',pet.petName);
        if((!val('appointmentPetCount')||val('appointmentPetCount')==='1')&&pet.count)setVal('appointmentPetCount',pet.count);
        syncLegacyAnimalFields(collectAppointmentAnimals());
      }
    }
    var hasManualService=collectAppointmentServices().some(function(x){return x.name||x.code;});
    if(found&&found.appointments&&found.appointments.length&&!hasManualService){
      var latest=found.appointments.slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''));})[0]||{};
      var previous=normalizeAppointmentServicesForFill(latest).filter(function(x){return x.name||x.code;}).map(function(x){x.animalTargets=['__all__'];return x;});
      if(previous.length)renderAppointmentServicesRows(previous);
    }
    refreshAppointmentServiceTargetSelects();
    recalculateAppointmentServices();
  }
  function selectedCustomerKey(){return String(window.__PETATOESelectedCustomerKey||'').trim()}
  function selectCustomerProfile(key){window.__PETATOESelectedCustomerKey=String(key||'');renderCustomersPets()}
  function setCustomerSearch(value){
    window.__PETATOECustomersCrmSearch=String(value||'');
    renderCustomersPets();
  }
  function clearCustomerSearch(){
    window.__PETATOECustomersCrmSearch='';
    var qs=byId('appointmentsCustomerQuickSearch');
    if(qs)qs.value='';
    renderCustomersPets();
  }
  function refreshCustomersCrm(){
    renderCustomersPets();
    toast(opT('customersPetsUpdated'));
  }
  function customerDatabaseReportRows(sourceProfiles,query){
    var profiles=(sourceProfiles||buildCustomerProfiles()).slice().sort(function(a,b){return String(b.lastVisit||'').localeCompare(String(a.lastVisit||''))||String(a.client||'').localeCompare(String(b.client||''),'ar')});
    var rows=[];
    profiles.forEach(function(c){
      var pets=c.petsList&&c.petsList.length?c.petsList:[{animalType:'',petName:''}];
      pets.forEach(function(p){
        rows.push({
          client:c.client||'عميل غير محدد',
          phone:c.phone||'',
          animalType:p.animalType||'-',
          petName:p.petName||p.label||'-',
          lastVisit:c.lastVisit||'-'
        });
      });
    });
    query=String(query==null?window.__PETATOECustomerDbReportSearch||'':query).trim().toLowerCase();
    var qPhone=normalizePhone(query);
    if(query){rows=rows.filter(function(r){var blob=[r.client,r.phone,r.animalType,r.petName,r.lastVisit].join(' ').toLowerCase();var phoneBlob=normalizePhone(r.phone);return blob.indexOf(query)>-1||(qPhone&&phoneBlob.indexOf(qPhone)>-1);});}
    return rows;
  }
  function renderCustomerDatabaseReportRowsHtml(rows){
    rows=rows||[];
    return rows.length?rows.map(function(r){return '<tr><td>'+esc(r.client)+'</td><td>'+esc(r.phone||'-')+'</td><td>'+esc(r.animalType||'-')+'</td><td>'+esc(r.petName||'-')+'</td><td>'+esc(r.lastVisit||'-')+'</td></tr>';}).join(''):'<tr><td colspan="5" class="appointments-empty"><div class="appointments-crm-table-empty">لا توجد نتائج مطابقة في تقرير قاعدة بيانات العملاء.</div></td></tr>';
  }
  function renderCustomerDatabaseReportHtml(sourceProfiles){
    var reportQ=String(window.__PETATOECustomerDbReportSearch||'');
    var body=renderCustomerDatabaseReportRowsHtml(customerDatabaseReportRows(sourceProfiles||buildCustomerProfiles(),reportQ));
    return '<section class="appointments-crm-panel appointments-customer-db-report appointments-customer-db-report-wide"><div class="appointments-crm-panel-head"><h4>📋 تقرير قاعدة بيانات العملاء</h4><div class="appointments-crm-report-actions"><input id="appointmentsCustomerDbReportSearch" value="'+esc(reportQ)+'" placeholder="بحث داخل التقرير فقط..." data-op-input="setCustomerDatabaseReportSearch" data-op-use-value="true" autocomplete="off"/><button class="btn btn-ghost" type="button" data-op-click="exportCustomersDatabaseReportExcel">تصدير Excel 📥</button></div></div><div class="appointments-report-table-wrap"><table class="appointments-report-table appointments-crm-table"><thead><tr><th>اسم العميل</th><th>رقم الجوال</th><th>نوع الحيوان</th><th>اسم الحيوان</th><th>آخر زيارة</th></tr></thead><tbody id="appointmentsCustomerDbReportBody">'+body+'</tbody></table></div></section>';
  }
  function setCustomerDatabaseReportSearch(value){
    window.__PETATOECustomerDbReportSearch=String(value||'');
    var body=byId('appointmentsCustomerDbReportBody');
    if(body){
      safeHtml(body,renderCustomerDatabaseReportRowsHtml(customerDatabaseReportRows(buildCustomerProfiles(),window.__PETATOECustomerDbReportSearch||'')),'operations customer database report rows');
      var input=byId('appointmentsCustomerDbReportSearch');
      if(input&&input.value!==String(value||''))input.value=String(value||'');
      return;
    }
    renderCustomersPets();
  }
  function customerDatabaseReportExportRows(){
    return [['اسم العميل','رقم الجوال','نوع الحيوان','اسم الحيوان','آخر زيارة']].concat(customerDatabaseReportRows(buildCustomerProfiles(),window.__PETATOECustomerDbReportSearch||'').map(function(r){return [r.client,r.phone,r.animalType,r.petName,r.lastVisit];}));
  }
  function exportCustomersDatabaseReportExcel(){
    var rows=customerDatabaseReportExportRows();
    if(window.PETATOEExport&&typeof window.PETATOEExport.excelRows==='function'){
      window.PETATOEExport.excelRows(rows,'PETATOE_Customers_Database_Report','Customers Database');return;
    }
    if(window.XLSX&&XLSX.utils&&!window.__PETATOE_XLSX_STUB__){
      var wb=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Customers Database');
      XLSX.writeFile(wb,'PETATOE_Customers_Database_Report.xlsx');return;
    }
    var csv=rows.map(function(r){return r.map(function(x){return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
    var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='PETATOE_Customers_Database_Report.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},0);
  }
  if(!window.__PETATOECustomersCrmSearchDirectBind){
    window.__PETATOECustomersCrmSearchDirectBind=true;
    document.addEventListener('input',function(ev){
      var el=ev&&ev.target;
      if(el&&el.id==='appointmentsCustomerQuickSearch')setCustomerSearch(el.value);
      if(el&&el.id==='appointmentsCustomerDbReportSearch')setCustomerDatabaseReportSearch(el.value);
    },true);
  }
  function renderCustomersPets(){
    var summary=byId('appointmentsCustomersSummary'), list=byId('appointmentsCustomersPets'); if(!summary&&!list)return;
    var qRaw=String(window.__PETATOECustomersCrmSearch||'');
    var q=String(qRaw||'').trim().toLowerCase();
    var qPhone=normalizePhone(qRaw);
    var allProfiles=buildCustomerProfiles();
    var profiles=allProfiles.slice();
    if(q){profiles=profiles.filter(function(c){
      var pets=(c.petsList||[]).map(function(p){return [p.label,p.petName,p.animalType,p.breed,p.size].join(' ')}).join(' ');
      var visits=(c.appointments||[]).map(function(a){return [a.service,a.vehicle,a.groomer,a.driver,a.status,a.address,a.phone,a.client].join(' ')}).join(' ');
      var blob=[c.client,c.phone,c.address,c.key,pets,visits].join(' ').toLowerCase();
      var phoneBlob=normalizePhone([c.phone,c.key].join(' '));
      return blob.indexOf(q)>-1 || (qPhone && phoneBlob.indexOf(qPhone)>-1);
    })}
    profiles=profiles.sort(function(a,b){return String(b.lastVisit||'').localeCompare(String(a.lastVisit||''))||b.appointments.length-a.appointments.length||String(a.client||'').localeCompare(String(b.client||''),'ar')});
    var summaryProfiles=q?allProfiles:profiles;
    var totalVisits=summaryProfiles.reduce(function(a,c){return a+c.appointments.length},0), totalRevenue=summaryProfiles.reduce(function(a,c){return a+c.total},0), totalPaid=summaryProfiles.reduce(function(a,c){return a+c.paid},0), petsCount=summaryProfiles.reduce(function(a,c){return a+c.petsList.length},0);
    if(summary){safeHtml(summary,
      '<div class="appointments-report-card"><span>عدد العملاء</span><b>'+profiles.length+'</b></div>'
      +'<div class="appointments-report-card"><span>عدد الحيوانات</span><b>'+petsCount+'</b></div>'
      +'<div class="appointments-report-card"><span>إجمالي الزيارات</span><b>'+totalVisits+'</b></div>'
      +'<div class="appointments-report-card"><span>إجمالي الإنفاق</span><b>'+money(totalRevenue)+'</b></div>'
      +'<div class="appointments-report-card"><span>المحصل</span><b>'+money(totalPaid)+'</b></div>'
      +'<div class="appointments-report-card"><span>المتبقي</span><b>'+money(totalRevenue-totalPaid)+'</b></div>', 'operations customer crm summary');}
    if(!list)return;
    var noResults=!profiles.length;
    var activeKey=selectedCustomerKey();
    var activeSource=noResults?allProfiles:profiles;
    var active=activeSource.find(function(c){return String(c.key)===activeKey})||activeSource[0]||null;
    if(active)window.__PETATOESelectedCustomerKey=active.key;
    var customerRows=noResults?'<div class="appointments-crm-list-empty"><b>لا توجد نتائج مطابقة</b><small>ملف العميل المختار مازال ظاهرًا. امسح البحث أو جرّب الاسم / الجوال / الحيوان / الخدمة.</small></div>':profiles.map(function(c){
      var activeClass=String(c.key)===String(active.key)?' active':'';
      return '<button class="appointments-crm-customer-row'+activeClass+'" type="button" data-op-click="selectCustomerProfile" data-op-arg1="'+esc(c.key)+'" title="فتح ملف العميل">'
        +'<span><b>'+esc(c.client||'عميل غير محدد')+'</b><small>'+esc(c.phone||'بدون جوال')+'</small><small>🐾 '+(c.petsList||[]).length+' | 🧾 '+c.appointments.length+' زيارات</small></span>'
        +'<em>'+(activeClass?'<strong>محدد</strong>':'')+'<small>آخر زيارة</small>'+esc(c.lastVisit||'-')+'</em>'
        +'</button>';
    }).join('');
    var petsRows=active?((active.petsList||[]).map(function(p,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(p.petName||p.label||'-')+'</td><td>'+esc(p.animalType||'-')+'</td><td>'+esc(p.breed||'-')+'</td><td>'+esc(p.size||'-')+'</td></tr>'}).join('')||'<tr><td colspan="5" class="appointments-empty"><div class="appointments-crm-table-empty">لا توجد حيوانات مسجلة لهذا العميل بعد.</div></td></tr>'):'<tr><td colspan="5" class="appointments-empty"><div class="appointments-crm-table-empty">اختر عميلًا لعرض الحيوانات الخاصة به.</div></td></tr>';
    var visits=active?(active.appointments.slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))||String(b.start||'').localeCompare(String(a.start||''))}).slice(0,10).map(function(a){a=calcFinancials(a);return '<tr><td>'+esc(a.date||'-')+'</td><td>'+esc(a.service||'-')+'</td><td>'+esc([a.vehicle,a.groomer,a.driver].filter(Boolean).join(' / ')||'-')+'</td><td>'+money(a.totalAmount)+'</td><td>'+esc(normalizeStatus(a.status))+'</td></tr>'}).join('')||'<tr><td colspan="5" class="appointments-empty"><div class="appointments-crm-table-empty">لا توجد زيارات مسجلة لهذا العميل حتى الآن.</div></td></tr>'):'<tr><td colspan="5" class="appointments-empty"><div class="appointments-crm-table-empty">اختر عميلًا لعرض سجل الزيارات.</div></td></tr>';
    var profileHtml=active?('<div class="appointments-crm-profile-card">'
      +'<div class="appointments-crm-profile-head"><div><span>ملف العميل</span><h4>👤 '+esc(active.client||'عميل غير محدد')+'</h4></div><b>'+esc(active.key||'-')+'</b></div>'
      +'<div class="appointments-crm-info-grid">'
      +'<div><span>الجوال</span><b>'+esc(active.phone||'-')+'</b></div>'
      +'<div><span>العنوان</span><b>'+esc(active.address||'-')+'</b></div>'
      +'<div><span>أول زيارة</span><b>'+esc(active.firstVisit||'-')+'</b></div>'
      +'<div><span>آخر زيارة</span><b>'+esc(active.lastVisit||'-')+'</b></div>'
      +'<div><span>عدد الزيارات</span><b>'+active.appointments.length+'</b></div>'
      +'<div><span>إجمالي الإنفاق</span><b>'+money(active.total)+'</b></div>'
      +'</div></div>'):'<div class="appointments-crm-profile-card appointments-crm-no-selection"><div class="appointments-crm-empty-state"><b>لا توجد نتائج مطابقة</b><span>امسح البحث أو جرّب كلمة أخرى، ولن يتم إخفاء الشاشة أثناء البحث.</span></div></div>';
    safeHtml(list,
      '<div class="appointments-crm-layout">'
      +'<aside class="appointments-crm-list"><div class="appointments-crm-list-head"><h4>قائمة العملاء</h4><span>'+profiles.length+'</span></div><div class="appointments-crm-search-wrap"><input id="appointmentsCustomerQuickSearch" value="'+esc(qRaw)+'" placeholder="بحث داخل العملاء..." data-op-input="setCustomerSearch" data-op-use-value="true" oninput="if(window.PETATOEOperations&&window.PETATOEOperations.setCustomerSearch)window.PETATOEOperations.setCustomerSearch(this.value)" autocomplete="off"/>'+(qRaw?'<button class="appointments-crm-clear-search" type="button" data-op-click="clearCustomerSearch" onclick="if(window.PETATOEOperations&&window.PETATOEOperations.clearCustomerSearch)window.PETATOEOperations.clearCustomerSearch();return false;">مسح</button>':'')+'</div><div class="appointments-crm-list-scroll">'+customerRows+'</div></aside>'
      +'<main class="appointments-crm-main">'
      +profileHtml
      +'<section class="appointments-crm-panel"><div class="appointments-crm-panel-head"><h4>🐾 الحيوانات الخاصة بالعميل</h4><small>عرض فقط في هذه المرحلة</small></div><div class="appointments-report-table-wrap"><table class="appointments-report-table appointments-crm-table"><thead><tr><th>#</th><th>اسم الحيوان</th><th>النوع</th><th>السلالة</th><th>الحجم</th></tr></thead><tbody>'+petsRows+'</tbody></table></div></section>'
      +'<section class="appointments-crm-panel"><div class="appointments-crm-panel-head"><h4>🧾 سجل الخدمات والزيارات</h4><small>آخر 10 زيارات</small></div><div class="appointments-report-table-wrap"><table class="appointments-report-table appointments-crm-table"><thead><tr><th>التاريخ</th><th>الخدمة</th><th>السيارة / الفريق</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>'+visits+'</tbody></table></div></section>'
      +'</main></div>'
      +renderCustomerDatabaseReportHtml(allProfiles), 'operations customer crm render');
    if(document.activeElement && document.activeElement.id==='appointmentsCustomerQuickSearch'){}
    setTimeout(function(){var qs=byId('appointmentsCustomerQuickSearch');if(qs){qs.focus();try{qs.setSelectionRange(qs.value.length,qs.value.length)}catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('operations/operations-legacy-engine.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations/operations-legacy-engine.js',_petatoeSilentCatch);}}}},0);
  }

  function reportTable(title,icon,rows,totalLabel,limit){
    rows=Array.isArray(rows)?rows:[];
    var total=rows.reduce(function(sum,r){return sum+Number(r.count||0)},0);
    var max=Number(limit||0);
    var shown=max?rows.slice(0,max):rows;
    var hidden=max&&rows.length>max?rows.slice(max).reduce(function(sum,r){return sum+Number(r.count||0)},0):0;
    var body=shown.length?shown.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+r.percent+'%</td></tr>'}).join(''):'<tr><td colspan="4" class="appointments-empty">لا توجد بيانات لهذا التقرير</td></tr>';
    if(hidden){body+='<tr class="appointments-report-more-row"><td>+</td><td>بنود أخرى</td><td>'+hidden+'</td><td>'+pct(hidden,total)+'%</td></tr>';}
    var subtitle=max&&rows.length>max?'يعرض أعلى '+max+' من '+rows.length+' بنود | إجمالي السجلات: '+total:'إجمالي السجلات: '+total;
    return '<div class="appointments-report-table-card"><div class="appointments-report-title"><span class="appointments-report-icon">'+icon+'</span><div><h4>'+esc(title)+'</h4><p>'+subtitle+'</p></div></div><div class="appointments-report-table-wrap"><table class="appointments-report-table"><thead><tr><th>#</th><th>البند</th><th>عدد المواعيد</th><th>النسبة</th></tr></thead><tbody>'+body+'</tbody><tfoot><tr><td colspan="2">'+esc(totalLabel||opT('total'))+'</td><td>'+total+'</td><td>100%</td></tr></tfoot></table></div></div>'
  }
  function sumFinancial(rows){return (rows||[]).reduce(function(a,r){r=calcFinancials(r);a.total+=r.totalAmount;a.paid+=r.paidAmount;a.remaining+=r.remainingAmount;a.count+=1;return a},{total:0,paid:0,remaining:0,count:0})}
  function appointmentReportYears(rows){
    var set={};
    (rows||[]).forEach(function(r){var y=String(r&&r.date||'').slice(0,4);if(/^\d{4}$/.test(y))set[y]=true;});
    set[String(new Date().getFullYear())]=true;
    return Object.keys(set).sort(function(a,b){return Number(b)-Number(a)});
  }
  var APPOINTMENT_LOCAL_REPORTS={
    finance_all:'التقرير المالي للمواعيد - كل البيانات',
    finance_remaining:'المبالغ غير المحصلة / المتبقية',
    finance_paid:'المواعيد المحصلة بالكامل',
    by_status:'تقرير المواعيد حسب الحالة',
    by_groomer:'تقرير المواعيد حسب الجرومر',
    by_driver:'تقرير المواعيد حسب السائق',
    by_vehicle:'تقرير المواعيد حسب السيارة',
    by_payment:'تقرير المواعيد حسب طريقة الدفع',
    by_collection:'تقرير المواعيد حسب حالة التحصيل',
    repeat_clients:'العملاء الأكثر تكرارًا'
  };
  function getLocalReportDefaultFilters(){
    var now=new Date();
    return {year:String(now.getFullYear()),month:pad(now.getMonth()+1),day:'all'};
  }
  function appointmentReportKey(key){key=String(key||'finance_all');return APPOINTMENT_LOCAL_REPORTS[key]?key:'finance_all'}
  function initAppointmentLocalReportFilters(key, rows){
    key=appointmentReportKey(key);
    var defaults=getLocalReportDefaultFilters();
    if(!appointmentLocalReportFilters[key])appointmentLocalReportFilters[key]={year:defaults.year,month:defaults.month,day:defaults.day};
    var f=appointmentLocalReportFilters[key];
    var years=appointmentReportYears(rows||read());
    if(f.year!=='all'&&years.indexOf(String(f.year))<0)f.year=defaults.year;
    if(!/^(all|\d{2})$/.test(String(f.month)))f.month=defaults.month;
    if(!/^(all|\d{2})$/.test(String(f.day)))f.day='all';
    return f;
  }
  function setAppointmentLocalReportFilter(key,field,value){
    key=appointmentReportKey(key);
    var f=initAppointmentLocalReportFilters(key,read());
    if(['year','month','day'].indexOf(field)<0)return;
    f[field]=String(value||'all');
    if(field==='year'||field==='month')f.day='all';
    appointmentLocalReportVisibleLimits[key]=10;
    renderReports();
  }
  function resetAppointmentLocalReportFilters(key){
    key=appointmentReportKey(key);
    appointmentLocalReportFilters[key]=getLocalReportDefaultFilters();
    appointmentLocalReportVisibleLimits[key]=10;
    renderReports();
  }
  function showMoreAppointmentLocalReportRows(key){
    key=appointmentReportKey(key);
    appointmentLocalReportVisibleLimits[key]=Math.max(10,Number(appointmentLocalReportVisibleLimits[key]||10))+10;
    renderReports();
  }
  function filterAppointmentLocalReportRows(key,rows){
    rows=Array.isArray(rows)?rows:[];
    var f=initAppointmentLocalReportFilters(key,rows);
    return rows.filter(function(r){
      var d=String(r&&r.date||'');
      if(f.year!=='all'&&d.slice(0,4)!==String(f.year))return false;
      if(f.month!=='all'&&d.slice(5,7)!==String(f.month))return false;
      if(f.day!=='all'&&d.slice(8,10)!==String(f.day))return false;
      return true;
    });
  }
  function getAppointmentLocalReportVisibleLimit(key){
    key=appointmentReportKey(key);
    return Math.max(10,Number(appointmentLocalReportVisibleLimits[key]||10));
  }
  function initFinanceReportFilters(rows){
    var f=initAppointmentLocalReportFilters('finance_all',rows);
    financeReportFilters=f;
    return f;
  }
  function getFinanceReportDefaultFilters(){return getLocalReportDefaultFilters()}
  function setFinanceReportFilter(field,value){return setAppointmentLocalReportFilter('finance_all',field,value)}
  function resetFinanceReportFilters(){return resetAppointmentLocalReportFilters('finance_all')}
  function showMoreFinanceReportRows(){return showMoreAppointmentLocalReportRows('finance_all')}
  function filterFinanceRows(rows){return filterAppointmentLocalReportRows('finance_all',rows)}
  function selectOptions(list,selected,labeler){return (list||[]).map(function(v){return '<option value="'+esc(v)+'"'+(String(v)===String(selected)?' selected':'')+'>'+esc(labeler?labeler(v):v)+'</option>'}).join('')}
  function appointmentReportFiltersHtml(key,rows,shownCount,totalCount){
    key=appointmentReportKey(key);
    var f=initAppointmentLocalReportFilters(key,rows), years=appointmentReportYears(rows);
    var months=['01','02','03','04','05','06','07','08','09','10','11','12'];
    var monthNames={'01':'يناير','02':'فبراير','03':'مارس','04':'أبريل','05':'مايو','06':'يونيو','07':'يوليو','08':'أغسطس','09':'سبتمبر','10':'أكتوبر','11':'نوفمبر','12':'ديسمبر'};
    var days=[];for(var i=1;i<=31;i++)days.push(pad(i));
    return '<div class="appointments-finance-filter-row" aria-label="فلاتر التقرير المحلي"><div class="appointments-finance-result-count">يعرض '+Number(shownCount||0)+' من أصل '+Number(totalCount||0)+' سجل</div><div class="appointments-finance-local-filters">'
      +'<label><span>السنة</span><select data-op-change="setAppointmentLocalReportFilter" data-op-arg1="'+esc(key)+'" data-op-arg2="year" data-op-use-value="true" onchange="(window.PETATOEOperations||window.PETATOEAppointments).setAppointmentLocalReportFilter(\''+esc(key)+'\',\'year\',this.value)"><option value="all"'+(f.year==='all'?' selected':'')+'>كل السنوات</option>'+selectOptions(years,f.year)+'</select></label>'
      +'<label><span>الشهر</span><select data-op-change="setAppointmentLocalReportFilter" data-op-arg1="'+esc(key)+'" data-op-arg2="month" data-op-use-value="true" onchange="(window.PETATOEOperations||window.PETATOEAppointments).setAppointmentLocalReportFilter(\''+esc(key)+'\',\'month\',this.value)"><option value="all"'+(f.month==='all'?' selected':'')+'>كل الشهور</option>'+selectOptions(months,f.month,function(v){return monthNames[v]||v})+'</select></label>'
      +'<label><span>اليوم</span><select data-op-change="setAppointmentLocalReportFilter" data-op-arg1="'+esc(key)+'" data-op-arg2="day" data-op-use-value="true" onchange="(window.PETATOEOperations||window.PETATOEAppointments).setAppointmentLocalReportFilter(\''+esc(key)+'\',\'day\',this.value)"><option value="all"'+(f.day==='all'?' selected':'')+'>كل الأيام</option>'+selectOptions(days,f.day,function(v){return Number(v)})+'</select></label>'
      +'<button class="appointments-finance-reset-btn" type="button" data-op-click="resetAppointmentLocalReportFilters" data-op-arg1="'+esc(key)+'" onclick="(window.PETATOEOperations||window.PETATOEAppointments).resetAppointmentLocalReportFilters(\''+esc(key)+'\');return false;">استعادة الافتراضيات ↩️</button>'
      +'</div></div>';
  }
  function financeReportFiltersHtml(rows,shownCount,totalCount){return appointmentReportFiltersHtml('finance_all',rows,shownCount,totalCount)}
  function financeTable(title,icon,rows,totalLabel,options){
    options=options||{};rows=Array.isArray(rows)?rows:[];
    var key=appointmentReportKey(options.reportKey||'finance_all');
    var reportRows=options.localFinanceFilters?filterAppointmentLocalReportRows(key,rows):rows;
    var f=sumFinancial(reportRows);
    var limit=options.paginate?getAppointmentLocalReportVisibleLimit(key):reportRows.length;
    var shown=options.paginate?reportRows.slice(0,limit):reportRows;
    var body=shown&&shown.length?shown.map(function(r,i){r=calcFinancials(r);return '<tr><td>'+(i+1)+'</td><td>'+esc(r.client||'عميل غير محدد')+'</td><td>'+esc(r.date||'-')+'</td><td>'+esc(r.paymentMethod||'-')+'</td><td>'+money(r.totalAmount)+'</td><td>'+money(r.paidAmount)+'</td><td>'+money(r.remainingAmount)+'</td><td>'+esc(r.collectionStatus||'-')+'</td></tr>'}).join(''):'<tr><td colspan="8" class="appointments-empty">لا توجد بيانات مالية</td></tr>';
    var controls=options.localFinanceFilters?appointmentReportFiltersHtml(key,rows,shown.length,reportRows.length):'';
    var more=options.paginate&&reportRows.length>shown.length?'<div class="appointments-finance-load-more"><span class="appointments-finance-more-count">يعرض '+shown.length+' من أصل '+reportRows.length+' سجل</span><button type="button" data-op-click="showMoreAppointmentLocalReportRows" data-op-arg1="'+esc(key)+'" onclick="(window.PETATOEOperations||window.PETATOEAppointments).showMoreAppointmentLocalReportRows(\''+esc(key)+'\');return false;">عرض المزيد</button></div>':(options.paginate?'<div class="appointments-finance-load-more"><span>يعرض '+shown.length+' من أصل '+reportRows.length+' سجل</span></div>':'');
    return '<div class="appointments-report-table-card appointments-finance-report'+(options.localFinanceFilters?' appointments-finance-report-local':'')+'"><div class="appointments-report-title"><span class="appointments-report-icon">'+icon+'</span><div><h4>'+esc(title)+'</h4><p>إجمالي: '+money(f.total)+' | محصل: '+money(f.paid)+' | '+esc(opT('remaining'))+': '+money(f.remaining)+'</p></div></div>'+controls+'<div class="appointments-report-table-wrap"><table class="appointments-report-table appointments-finance-table"><thead><tr><th>#</th><th>العميل</th><th>التاريخ</th><th>طريقة الدفع</th><th>الإجمالي</th><th>المحصل</th><th>المتبقي</th><th>حالة التحصيل</th></tr></thead><tbody>'+body+'</tbody><tfoot><tr><td colspan="4">'+esc(totalLabel||opT('total'))+'</td><td>'+money(f.total)+'</td><td>'+money(f.paid)+'</td><td>'+money(f.remaining)+'</td><td>-</td></tr></tfoot></table></div>'+more+'</div>'
  }
  function localReportTable(key,title,icon,baseRows,field,fallback,totalLabel,limit,transform){
    key=appointmentReportKey(key);baseRows=Array.isArray(baseRows)?baseRows:[];
    var filtered=filterAppointmentLocalReportRows(key,baseRows);
    var rows=typeof transform==='function'?transform(filtered):(field?reportRowsByField(filtered,field,fallback):filtered);
    rows=Array.isArray(rows)?rows:[];
    var total=rows.reduce(function(sum,r){return sum+Number(r.count||0)},0);
    var hardMax=Number(limit||0);
    if(hardMax&&rows.length>hardMax)rows=rows.slice(0,hardMax);
    var visibleLimit=getAppointmentLocalReportVisibleLimit(key);
    var shown=rows.slice(0,visibleLimit);
    var hidden=rows.length>shown.length?rows.slice(shown.length).reduce(function(sum,r){return sum+Number(r.count||0)},0):0;
    var body=shown.length?shown.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+Number(r.count||0)+'</td><td>'+pct(Number(r.count||0),total)+'%</td></tr>'}).join(''):'<tr><td colspan="4" class="appointments-empty">لا توجد بيانات لهذا التقرير</td></tr>';
    if(hidden){body+='<tr class="appointments-report-more-row"><td>+</td><td>بنود أخرى غير معروضة</td><td>'+hidden+'</td><td>'+pct(hidden,total)+'%</td></tr>';}
    var controls=appointmentReportFiltersHtml(key,baseRows,shown.length,rows.length);
    var more=rows.length>shown.length?'<div class="appointments-finance-load-more"><span class="appointments-finance-more-count">يعرض '+shown.length+' من أصل '+rows.length+' بند</span><button type="button" data-op-click="showMoreAppointmentLocalReportRows" data-op-arg1="'+esc(key)+'" onclick="(window.PETATOEOperations||window.PETATOEAppointments).showMoreAppointmentLocalReportRows(\''+esc(key)+'\');return false;">عرض المزيد</button></div>':'<div class="appointments-finance-load-more"><span>يعرض '+shown.length+' من أصل '+rows.length+' بند</span></div>';
    return '<div class="appointments-report-table-card appointments-finance-report-local"><div class="appointments-report-title"><span class="appointments-report-icon">'+icon+'</span><div><h4>'+esc(title)+'</h4><p>إجمالي السجلات المطابقة للفلتر: '+filtered.length+' | إجمالي البنود: '+total+'</p></div></div>'+controls+'<div class="appointments-report-table-wrap"><table class="appointments-report-table"><thead><tr><th>#</th><th>البند</th><th>عدد المواعيد</th><th>النسبة</th></tr></thead><tbody>'+body+'</tbody><tfoot><tr><td colspan="2">'+esc(totalLabel||opT('total'))+'</td><td>'+total+'</td><td>100%</td></tr></tfoot></table></div>'+more+'</div>';
  }

  function renderReports(){
    var el=byId('appointmentsReports');if(!el)return;
    var rows=read().map(function(r){return calcFinancials(r)});
    var todayRows=rows.filter(function(r){return sameDate(r,today())});
    var now=new Date(), monthRows=rows.filter(function(r){return inRange(r,monthStart(now),monthEnd(now))});
    var byStatus={};rows.forEach(function(r){var st=normalizeStatus(r.status);byStatus[st]=(byStatus[st]||0)+1});
    var uniqueClients=new Set(rows.map(function(r){return String(r.client||'').trim()}).filter(Boolean)).size;
    var allFin=sumFinancial(rows), todayFin=sumFinancial(todayRows), monthFin=sumFinancial(monthRows);
    var avg=allFin.count?allFin.total/allFin.count:0;
    var cards='<div class="appointments-report-summary-grid appointments-finance-summary-grid">'
      +'<div class="appointments-report-card"><span>إجمالي المواعيد</span><b>'+rows.length+'</b></div>'
      +'<div class="appointments-report-card"><span>عدد العملاء</span><b>'+uniqueClients+'</b></div>'
      +'<div class="appointments-report-card"><span>إيراد اليوم</span><b>'+money(todayFin.total)+'</b></div>'
      +'<div class="appointments-report-card"><span>إيراد الشهر</span><b>'+money(monthFin.total)+'</b></div>'
      +'<div class="appointments-report-card"><span>إجمالي الإيرادات</span><b>'+money(allFin.total)+'</b></div>'
      +'<div class="appointments-report-card"><span>إجمالي المحصل</span><b>'+money(allFin.paid)+'</b></div>'
      +'<div class="appointments-report-card"><span>إجمالي المتبقي</span><b>'+money(allFin.remaining)+'</b></div>'
      +'<div class="appointments-report-card"><span>متوسط قيمة الجلسة</span><b>'+money(avg)+'</b></div>'
      +'</div>';
    var clientRows=reportRowsByField(rows,function(r){var n=String(r.client||'').trim();var p=String(r.phone||'').trim();return n?(p?n+' - '+p:n):''},'عميل غير محدد').filter(function(r){return r.count>1}).slice(0,20);
    var notCollected=rows.filter(function(r){return r.collectionStatus==='غير محصل'||r.remainingAmount>0});
    var fullyCollected=rows.filter(function(r){return r.collectionStatus==='محصل بالكامل'||(r.totalAmount>0&&r.remainingAmount<=0)});
    safeHtml(el,cards+'<div class="appointments-report-tables appointments-appointment-reports-fullwidth">'
      +financeTable('التقرير المالي للمواعيد - كل البيانات','💰',rows,'الإجمالي المالي',{reportKey:'finance_all',localFinanceFilters:true,paginate:true})
      +financeTable('المبالغ غير المحصلة / المتبقية','⏳',rows.filter(function(r){return r.collectionStatus==='غير محصل'||r.remainingAmount>0}),'إجمالي المتبقي',{reportKey:'finance_remaining',localFinanceFilters:true,paginate:true})
      +financeTable('المواعيد المحصلة بالكامل','✅',rows.filter(function(r){return r.collectionStatus==='محصل بالكامل'||(r.totalAmount>0&&r.remainingAmount<=0)}),'إجمالي المحصل بالكامل',{reportKey:'finance_paid',localFinanceFilters:true,paginate:true})
      +localReportTable('by_status','تقرير المواعيد حسب الحالة','📌',rows,function(r){return normalizeStatus(r.status)},'مجدول','إجمالي الحالات')
      +localReportTable('by_groomer','تقرير المواعيد حسب الجرومر','✂️',rows,'groomer','بدون جرومر','إجمالي الجرومرز')
      +localReportTable('by_driver','تقرير المواعيد حسب السائق','🚗',rows,'driver','بدون سائق','إجمالي السائقين')
      +localReportTable('by_vehicle','تقرير المواعيد حسب السيارة','🚐',rows,'vehicle','بدون سيارة','إجمالي السيارات')
      +localReportTable('by_payment','تقرير المواعيد حسب طريقة الدفع','💳',rows,'paymentMethod','غير محدد','إجمالي طرق الدفع')
      +localReportTable('by_collection','تقرير المواعيد حسب حالة التحصيل','🧾',rows,'collectionStatus','غير محدد','إجمالي حالات التحصيل')
      +localReportTable('repeat_clients','العملاء الأكثر تكرارًا','👥',rows,null,'عميل غير محدد','إجمالي المواعيد المتكررة',0,function(filteredRows){return reportRowsByField(filteredRows,function(r){var n=String(r.client||'').trim();var p=String(r.phone||'').trim();return n?(p?n+' - '+p:n):''},'عميل غير محدد').filter(function(r){return r.count>1})})
      +'</div>','operations finance reports full render');
  }

  function timeToMin(t){
    var m=String(t||'').match(/^(\d{1,2}):(\d{2})/);if(!m)return null;
    return Number(m[1])*60+Number(m[2]);
  }
  function timesOverlap(aStart,aEnd,bStart,bEnd){
    var as=timeToMin(aStart), ae=timeToMin(aEnd), bs=timeToMin(bStart), be=timeToMin(bEnd);
    if(as==null||bs==null)return false;
    if(ae==null)ae=as+60;if(be==null)be=bs+60;
    if(ae<=as)ae=as+60;if(be<=bs)be=bs+60;
    return as<be && bs<ae;
  }
  function findConflicts(row,rows){
    var out=[]; if(!row||!row.date||!row.start)return out;
    (rows||[]).forEach(function(r){
      if(!r||String(r.id)===String(row.id)||String(r.date||'')!==String(row.date||''))return;
      if(!timesOverlap(row.start,row.end,r.start,r.end))return;
      if(row.groomer&&r.groomer&&String(row.groomer)===String(r.groomer))out.push({reason:'الجرومر '+row.groomer,row:r});
      if(row.driver&&r.driver&&String(row.driver)===String(r.driver))out.push({reason:'السائق '+row.driver,row:r});
      if(row.vehicle&&r.vehicle&&String(row.vehicle)===String(r.vehicle))out.push({reason:'السيارة '+row.vehicle,row:r});
    });
    return out;
  }
  function calendarBaseDate(){var v=val('appointmentCalendarDate');var d=v?new Date(v+'T00:00:00'):new Date();return isNaN(d.getTime())?new Date():d}
  function setCalendarView(view){calendarView=view||'day';document.querySelectorAll('[data-calendar-view]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-calendar-view')===calendarView)});renderCalendar()}
  function calendarRange(){
    var d=calendarBaseDate();
    if(calendarView==='month')return {from:monthStart(d),to:monthEnd(d),title:'الشهر'};
    if(calendarView==='week'){var w=weekRange(d);return {from:w.from,to:w.to,title:'الأسبوع'}};
    var k=dateKey(d);return {from:k,to:k,title:'اليوم'};
  }
  function renderCalendar(){
    var el=byId('appointmentsCalendar'), warn=byId('appointmentsCalendarWarnings'); if(!el)return;
    if(!val('appointmentCalendarDate'))setVal('appointmentCalendarDate',today());
    document.querySelectorAll('[data-calendar-view]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-calendar-view')===calendarView)});
    var range=calendarRange();
    var rows=read().filter(function(r){return inRange(r,range.from,range.to)}).sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||''))});
    var conflicts=[]; rows.forEach(function(r){findConflicts(r,rows).forEach(function(c){conflicts.push(r);});});
    if(warn){safeHtml(warn, conflicts.length?'<b>⚠️ تنبيه تعارضات</b><span>يوجد '+conflicts.length+' تعارض محتمل في الفترة المعروضة. راجع الجرومر/السائق/السيارة.</span>':'', 'operations legacy render');warn.style.display=conflicts.length?'flex':'none'}
    if(!rows.length){safeHtml(el, '<div class="appointments-empty appointments-calendar-empty">لا توجد مواعيد في '+esc(range.title)+' المحدد</div>', 'operations legacy render');return}
    var groups={}; rows.forEach(function(r){var d=String(r.date||'غير محدد');(groups[d]=groups[d]||[]).push(r)});
    safeHtml(el,Object.keys(groups).sort().map(function(day){
      return '<div class="appointments-day-card"><div class="appointments-day-head"><b>'+esc(day)+'</b><span>'+groups[day].length+' مواعيد</span></div><div class="appointments-timeline">'+groups[day].map(function(r){
        var conflictsHere=findConflicts(r,rows).length>0;
        return '<div class="appointments-timeline-item '+(conflictsHere?'has-conflict':'')+'"><div class="appointments-time"><b>'+esc(r.start||'--:--')+'</b><small>'+esc(r.end||'')+'</small></div><div class="appointments-event"><b>'+esc(r.client||'عميل غير محدد')+'</b><p>'+esc([r.service,r.animalType,r.breed,r.size,r.petName].filter(Boolean).join(' - '))+'</p><div class="appointments-event-meta"><span>✂️ '+esc(r.groomer||'-')+'</span><span>🚗 '+esc(r.driver||'-')+'</span><span>🚐 '+esc(r.vehicle||'-')+'</span><span class="appointments-status '+statusClass(r.status)+'">'+esc(normalizeStatus(r.status))+'</span></div><small>'+esc(r.address||'')+'</small></div></div>'
      }).join('')+'</div></div>'
    }).join(''),'operations calendar grouped timeline');
  }


  function setDispatchDateToday(){setVal('appointmentDispatchDate',today());render()}
  function dispatchDate(){var d=val('appointmentDispatchDate');if(!d){d=today();setVal('appointmentDispatchDate',d)}return d}
  function groupBy(rows,field,emptyLabel){
    var map={};
    (rows||[]).forEach(function(r){var key=String(r[field]||'').trim()||emptyLabel||'غير محدد';(map[key]=map[key]||[]).push(r)});
    return Object.keys(map).sort(function(a,b){return a.localeCompare(b,'ar')}).map(function(k){return {name:k,rows:map[k].sort(function(a,b){return String(a.start||'').localeCompare(String(b.start||''))})}})
  }
  function renderDispatchSummaryCard(icon,title,groups){
    var total=(groups||[]).reduce(function(a,g){return a+g.rows.length},0);
    var max=(groups||[]).reduce(function(a,g){return Math.max(a,g.rows.length)},0);
    return '<div class="appointments-dispatch-summary-card"><span>'+esc(icon)+' '+esc(title)+'</span><b>'+total+'</b><small>'+((groups||[]).length)+' مجموعات | أعلى حمل: '+max+'</small></div>'
  }
  function renderDispatchMiniGroups(title,groups,icon){
    if(!groups.length)return '<div class="appointments-dispatch-box"><h4>'+esc(icon+' '+title)+'</h4><div class="appointments-empty appointments-master-empty">لا توجد بيانات</div></div>';
    return '<div class="appointments-dispatch-box"><h4>'+esc(icon+' '+title)+'</h4><div class="appointments-dispatch-loads">'+groups.map(function(g){return '<div class="appointments-dispatch-load"><b>'+esc(g.name)+'</b><span>'+g.rows.length+' مواعيد</span></div>'}).join('')+'</div></div>'
  }
  function buildDispatchWarnings(rows){
    var warnings=[];
    groupBy(rows,'vehicle','بدون سيارة').forEach(function(g){if(g.rows.length>=7)warnings.push('🚐 حمل مرتفع على '+g.name+' — '+g.rows.length+' مواعيد')});
    groupBy(rows,'groomer','بدون جرومر').forEach(function(g){if(g.rows.length>=7)warnings.push('✂️ حمل مرتفع على '+g.name+' — '+g.rows.length+' مواعيد')});
    groupBy(rows,'driver','بدون سائق').forEach(function(g){if(g.rows.length>=7)warnings.push('🚗 حمل مرتفع على '+g.name+' — '+g.rows.length+' مواعيد')});
    rows.forEach(function(r){findConflicts(r,rows).forEach(function(c){warnings.push('⚠️ تعارض '+c.reason+' بين '+(r.client||'عميل')+' و '+(c.row.client||'عميل'))})});
    var seen=[];return warnings.filter(function(w){if(seen.indexOf(w)>-1)return false;seen.push(w);return true});
  }
  function renderDispatch(){
    var summary=byId('appointmentsDispatchSummary'), routes=byId('appointmentsDispatchRoutes'), warn=byId('appointmentsDispatchWarnings');
    if(!summary&&!routes&&!warn)return;
    var day=dispatchDate();
    var rows=read().filter(function(r){return String(r.date||'')===String(day)}).sort(function(a,b){return String(a.start||'').localeCompare(String(b.start||''))});
    var vehicles=groupBy(rows,'vehicle','بدون سيارة'), groomers=groupBy(rows,'groomer','بدون جرومر'), drivers=groupBy(rows,'driver','بدون سائق');
    var warnings=buildDispatchWarnings(rows);
    if(warn){safeHtml(warn, warnings.length?'<b>⚠️ تنبيهات التوزيع</b><span>'+warnings.map(esc).join(' | ')+'</span>':'', 'operations legacy render');warn.style.display=warnings.length?'flex':'none'}
    if(summary){safeHtml(summary,renderDispatchSummaryCard('📅','مواعيد اليوم', [{name:'all',rows:rows}])+renderDispatchSummaryCard('🚐','توزيع السيارات',vehicles)+renderDispatchSummaryCard('✂️','توزيع الجرومرز',groomers)+renderDispatchSummaryCard('🚗','توزيع السائقين',drivers),'operations dispatch summary')} 
    if(!routes)return;
    if(!rows.length){safeHtml(routes, '<div class="appointments-empty appointments-calendar-empty">لا توجد مواعيد في تاريخ '+esc(day)+'</div>', 'operations legacy render');return}
    var routeHtml=vehicles.map(function(g){
      return '<div class="appointments-route-card"><div class="appointments-route-head"><h4>🚐 '+esc(g.name)+'</h4><span>'+g.rows.length+' مواعيد</span></div><div class="appointments-route-list">'+g.rows.map(function(r,i){
        return '<div class="appointments-route-stop"><div class="appointments-route-index">'+(i+1)+'</div><div class="appointments-time"><b>'+esc(r.start||'--:--')+'</b><small>'+esc(r.end||'')+'</small></div><div class="appointments-event"><b>'+esc(r.client||'عميل غير محدد')+'</b><p>'+esc([r.service,r.animalType,r.breed,r.size,r.petName].filter(Boolean).join(' - '))+'</p><div class="appointments-event-meta"><span>✂️ '+esc(r.groomer||'-')+'</span><span>🚗 '+esc(r.driver||'-')+'</span><span>📞 '+esc(r.phone||'-')+'</span><span class="appointments-status '+statusClass(r.status)+'">'+esc(normalizeStatus(r.status))+'</span></div><small>📍 '+esc(r.address||'بدون عنوان')+'</small></div></div>'
      }).join('')+'</div></div>'
    }).join('');
    safeHtml(routes, '<div class="appointments-dispatch-grid">'+renderDispatchMiniGroups('أحمال الجرومرز',groomers,'✂️')+renderDispatchMiniGroups('أحمال السائقين',drivers,'🚗')+'</div>'+routeHtml, 'operations legacy render');
  }


  function nextStatus(current){
    current=normalizeStatus(current);
    var idx=STATUS_FLOW.indexOf(current);
    if(idx<0||idx>=STATUS_FLOW.length-1)return current;
    if(current==='مؤجل'||current==='ملغي')return current;
    return STATUS_FLOW[idx+1];
  }
  function renderTodayTimeline(){
    var el=byId('appointmentsTodayTimeline');if(!el)return;
    var rows=read().filter(function(r){return sameDate(r,today())}).sort(function(a,b){return String(a.start||'').localeCompare(String(b.start||''))});
    if(!rows.length){safeHtml(el, '<div class="appointments-empty appointments-calendar-empty">لا توجد مواعيد اليوم</div>', 'operations legacy render');return}
    safeHtml(el,rows.map(function(r){
      var st=normalizeStatus(r.status), ns=nextStatus(st);
      var quick=ns!==st?'<button class="appointments-status-step" type="button" data-op-click="changeStatus" data-op-arg1="'+esc(r.id)+'" data-op-arg2="'+esc(ns)+'">التالي: '+esc(ns)+'</button>':'';
      return '<div class="appointments-today-item '+statusClass(st)+'"><div class="appointments-time"><b>'+esc(r.start||'--:--')+'</b><small>'+esc(r.end||'')+'</small></div><div class="appointments-event"><b>'+esc(r.client||'عميل غير محدد')+'</b><p>'+esc([r.service,r.animalType,r.breed,r.size,r.petName].filter(Boolean).join(' - '))+'</p><div class="appointments-event-meta"><span>✂️ '+esc(r.groomer||'-')+'</span><span>🚗 '+esc(r.driver||'-')+'</span><span>🚐 '+esc(r.vehicle||'-')+'</span><span class="appointments-status '+statusClass(st)+'">'+esc(st)+'</span></div><small>'+esc(r.address||'')+'</small></div><div class="appointments-today-actions">'+quick+'<button class="appointments-status-step ghost" type="button" data-op-click="edit" data-op-arg1="'+esc(r.id)+'">'+esc(opT('edit'))+'</button></div></div>'
    }).join(''),'operations today timeline');
  }


  function isClosedStatus(status){
    status=normalizeStatus(status);
    return status==='تمت الجلسة'||status==='تم التحصيل'||status==='ملغي';
  }
  function buildAlerts(rows){
    rows=(rows||[]).map(function(r){return calcFinancials(r)});
    var now=new Date(), t=today(), in60=new Date(now.getTime()+60*60000);
    var alerts=[];
    rows.forEach(function(r){
      var st=normalizeStatus(r.status), dt=appointmentDateTime(r), mins=minutesUntil(r);
      if(dt && dt>=now && dt<=in60 && !isClosedStatus(st)){
        alerts.push({type:'warning',icon:'⏰',title:'موعد خلال ساعة',text:(r.client||'عميل غير محدد')+' — '+(r.start||'--:--')+' — '+([r.service,r.petName].filter(Boolean).join(' / ')||'جلسة'),date:r.date,time:r.start,sort:dt.getTime()});
      }
      if(String(r.date||'')===t && !isClosedStatus(st)){
        alerts.push({type:'info',icon:'📅',title:'موعد اليوم',text:(r.client||'عميل غير محدد')+' — '+(r.start||'--:--')+' — الحالة: '+st,date:r.date,time:r.start,sort:(dt?dt.getTime():Date.now()+999999)});
      }
      if(String(r.date||'')<t && !isClosedStatus(st) && st!=='مؤجل'){
        alerts.push({type:'danger',icon:'⚠️',title:'موعد سابق لم يتم إغلاقه',text:(r.client||'عميل غير محدد')+' — '+(r.date||'-')+' — الحالة: '+st,date:r.date,time:r.start,sort:0});
      }
      if(st==='مؤجل'){
        alerts.push({type:'warning',icon:'⏳',title:'موعد مؤجل يحتاج متابعة',text:(r.client||'عميل غير محدد')+' — '+(r.date||'-')+' — '+(r.service||'جلسة'),date:r.date,time:r.start,sort:(dt?dt.getTime():Date.now()+1000000)});
      }
      if(Number(r.remainingAmount||0)>0 && String(r.date||'')<=t){
        alerts.push({type:'danger',icon:'💳',title:'تحصيل متبقي',text:(r.client||'عميل غير محدد')+' — المتبقي: '+money(r.remainingAmount),date:r.date,time:r.start,sort:(dt?dt.getTime():Date.now()+2000000)});
      }
    });
    rows.forEach(function(r){
      findConflicts(r,rows).forEach(function(c){
        alerts.push({type:'danger',icon:'🚧',title:'تعارض في الموارد',text:c.reason+' مع '+(c.row.client||'عميل')+' من '+(c.row.start||'?')+' إلى '+(c.row.end||'?'),date:r.date,time:r.start,sort:appointmentDateTime(r)?appointmentDateTime(r).getTime():Date.now()+3000000});
      });
    });
    return alerts.sort(function(a,b){return (a.sort||0)-(b.sort||0)||String(a.title).localeCompare(String(b.title),'ar')});
  }
  function updateAppointmentsBadges(count){
    ['appointmentsHeroAlertBadge','appointmentsTabAlertBadge'].forEach(function(id){var el=byId(id);if(el){el.textContent=count;el.style.display=count?'inline-flex':'none'}});
    var navBtn=document.querySelector('[data-tab="appointments"]');
    if(navBtn){
      var badge=navBtn.querySelector('.appointments-nav-badge');
      if(!badge){badge=document.createElement('span');badge.className='appointments-nav-badge';navBtn.appendChild(badge)}
      badge.textContent=count;badge.style.display=count?'inline-flex':'none';
    }
  }
  function renderAlerts(){
    var summary=byId('appointmentsAlertsSummary'), list=byId('appointmentsAlertsList');
    var alerts=buildAlerts(read());
    updateAppointmentsBadges(alerts.length);
    if(summary){
      var danger=alerts.filter(function(a){return a.type==='danger'}).length, warning=alerts.filter(function(a){return a.type==='warning'}).length, info=alerts.filter(function(a){return a.type==='info'}).length;
      safeHtml(summary, '<div class="appointments-alert-summary-card danger"><span>حرجة</span><b>'+danger+'</b></div><div class="appointments-alert-summary-card warning"><span>متابعة</span><b>'+warning+'</b></div><div class="appointments-alert-summary-card info"><span>معلومات اليوم</span><b>'+info+'</b></div><div class="appointments-alert-summary-card"><span>إجمالي التنبيهات</span><b>'+alerts.length+'</b></div>', 'operations legacy render');
    }
    if(!list)return;
    if(!alerts.length){safeHtml(list, '<div class="appointments-empty appointments-calendar-empty">لا توجد تنبيهات حالية</div>', 'operations legacy render');return;}
    safeHtml(list, alerts.map(function(a){return '<div class="appointments-alert-item '+esc(a.type)+'"><div class="appointments-alert-icon">'+esc(a.icon)+'</div><div><b>'+esc(a.title)+'</b><p>'+esc(a.text)+'</p><small>'+esc([a.date,a.time].filter(Boolean).join(' | ')||'-')+'</small></div></div>'}).join(''), 'operations legacy render');
  }



  function dailyOpsDate(){var d=val('appointmentDailyOpsDate');if(!d){d=today();setVal('appointmentDailyOpsDate',d)}return d}
  function setDailyOpsDateToday(){setVal('appointmentDailyOpsDate',today());render()}
  function dailyOpsRows(){var day=dailyOpsDate();return read().map(function(r){return calcFinancials(r)}).filter(function(r){return String(r.date||'')===String(day)}).sort(function(a,b){return String(a.vehicle||'').localeCompare(String(b.vehicle||''),'ar')||String(a.start||'').localeCompare(String(b.start||''))||String(a.client||'').localeCompare(String(b.client||''),'ar')})}
  function renderDailyOperations(){
    var wrap=byId('appointmentsDailyOperations'), summary=byId('appointmentsDailyOpsSummary');
    if(!wrap&&!summary)return;
    var day=dailyOpsDate();
    var rows=dailyOpsRows();
    var vehicles=groupBy(rows,'vehicle','بدون سيارة'), groomers=groupBy(rows,'groomer','بدون جرومر'), drivers=groupBy(rows,'driver','بدون سائق');
    var completed=countAnyStatus(rows,['تمت الجلسة','تم التحصيل']), cancelled=countStatus(rows,'ملغي'), postponed=countStatus(rows,'مؤجل');
    if(summary){safeHtml(summary,'<div class="appointments-dispatch-summary-card"><span>📅 تاريخ الكشف</span><b>'+esc(day)+'</b><small>كشف تشغيل يومي</small></div><div class="appointments-dispatch-summary-card"><span>إجمالي المواعيد</span><b>'+rows.length+'</b><small>'+vehicles.length+' سيارات</small></div><div class="appointments-dispatch-summary-card"><span>المكتمل</span><b>'+completed+'</b><small>مؤجل: '+postponed+' | ملغي: '+cancelled+'</small></div><div class="appointments-dispatch-summary-card"><span>الموارد</span><b>'+groomers.length+'</b><small>'+drivers.length+' سائقين | '+vehicles.length+' سيارات</small></div>','operations dispatch print summary')}
    if(!wrap)return;
    if(!rows.length){safeHtml(wrap, '<div class="appointments-empty appointments-calendar-empty">لا توجد مواعيد في تاريخ '+esc(day)+'</div>', 'operations legacy render');return;}
    var sections=vehicles.map(function(g){
      var body=g.rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.start||'-')+'</td><td>'+esc(r.end||'-')+'</td><td>'+esc(r.client||'-')+'</td><td>'+esc(r.phone||'-')+'</td><td>'+esc(r.address||'-')+'</td><td>'+esc([r.service,r.animalType,r.breed,r.size,r.petName].filter(Boolean).join(' - ')||'-')+'</td><td>'+esc(r.groomer||'-')+'</td><td>'+esc(r.driver||'-')+'</td><td>'+esc(r.paymentMethod||'-')+'</td><td>'+esc(normalizeStatus(r.status))+'</td><td>'+esc(r.notes||'')+'</td></tr>'}).join('');
      return '<div class="appointments-daily-vehicle"><div class="appointments-daily-vehicle-head"><h4>🚐 '+esc(g.name)+'</h4><span>'+g.rows.length+' مواعيد</span></div><div class="appointments-report-table-wrap"><table class="appointments-report-table appointments-daily-table"><thead><tr><th>#</th><th>من</th><th>إلى</th><th>العميل</th><th>الهاتف</th><th>العنوان</th><th>الخدمة / الحيوان</th><th>الجرومر</th><th>السائق</th><th>الدفع</th><th>الحالة</th><th>ملاحظات</th></tr></thead><tbody>'+body+'</tbody><tfoot><tr><td colspan="12">إجمالي '+esc(g.name)+': '+g.rows.length+' مواعيد</td></tr></tfoot></table></div></div>'
    }).join('');
    safeHtml(wrap, '<div class="appointments-daily-print-header"><h3>كشف التشغيل اليومي</h3><p>التاريخ: '+esc(day)+' | إجمالي المواعيد: '+rows.length+'</p></div>'+sections, 'operations legacy render');
  }
  function printDailyOperations(){
    var area=byId('appointmentsDailyOperations');
    if(!area||!String(area.textContent||'').trim()){renderDailyOperations();area=byId('appointmentsDailyOperations')}
    window.print();
  }



  function vehicleOpsDate(){var d=val('vehicleOpsDate');if(!d){d=today();setVal('vehicleOpsDate',d)}return d}
  function setVehicleOpsDateToday(){setVal('vehicleOpsDate',today());vehicleOpsSelectedId='';renderVehicleOperations()}
  function vehicleScopeCanAccess(vehicle){
    try{
      if(!window.PETATOEPermissions||typeof window.PETATOEPermissions.canAccessVehicle!=='function')return true;
      return !!window.PETATOEPermissions.canAccessVehicle(currentUserId(),vehicle);
    }catch(e){
      window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations/operations-legacy-engine.js',e,{phase:'vehicle-scope-access'});
      return true;
    }
  }
  function vehicleScopeFilterRows(rows){
    rows=rows||[];
    return rows.filter(function(r){return vehicleScopeCanAccess(r&&typeof r==='object'?{id:r.vehicleId||r.vehicleCode||r.vehicle,name:r.vehicle,plate:r.vehiclePlate||r.plate}:r)});
  }
  function vehicleScopeFilterNames(names){
    names=names||[];
    return names.filter(function(n){return vehicleScopeCanAccess(n)});
  }
  function renderVehicleOptions(){
    var sel=byId('vehicleOpsVehicleFilter'); if(!sel) return;
    var old=sel.value||'all';
    var names=vehicleScopeFilterNames(uniqueSorted(read().map(function(r){return r.vehicle||''}).concat(vehicleNames()).filter(Boolean)));
    if(old&&old!=='all'&&names.indexOf(old)===-1){old='all';sel.value='all'}
    safeHtml(sel, '<option value="all">'+esc(opT('allAuthorizedVehicles'))+'</option>'+names.map(function(x){return '<option value="'+esc(x)+'" '+(x===old?'selected':'')+'>'+esc(x)+'</option>'}).join(''), 'operations vehicle scope render');
  }
  function vehicleOpsRows(){
    var day=vehicleOpsDate(), car=val('vehicleOpsVehicleFilter')||'all';
    return vehicleScopeFilterRows(read().map(function(r){return calcFinancials(r)})).filter(function(r){return String(r.date||'')===String(day)&&(!car||car==='all'||String(r.vehicle||'')===String(car))}).sort(function(a,b){return String(a.vehicle||'').localeCompare(String(b.vehicle||''),'ar')||String(a.start||'').localeCompare(String(b.start||''))||String(a.client||'').localeCompare(String(b.client||''),'ar')});
  }
  function currentUserId(){
    try{if(window.__PETATOE_SETTINGS_API__&&typeof window.__PETATOE_SETTINGS_API__.currentUser==='function'){var u=window.__PETATOE_SETTINGS_API__.currentUser();if(u)return String(u.id||u.userId||u.username||u.email||'')}}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    try{if(window.petCurrentUser&&typeof window.petCurrentUser==='function'){var p=window.petCurrentUser();if(p)return String(p.id||p.userId||p.username||p.email||'')}}catch(e2){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e2);}
    return '';
  }
  function currentUserInfo(){
    var id=currentUserId(), u=null;
    try{if(window.__PETATOE_SETTINGS_API__&&typeof window.__PETATOE_SETTINGS_API__.currentUser==='function')u=window.__PETATOE_SETTINGS_API__.currentUser()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    try{if(!u&&window.petCurrentUser&&typeof window.petCurrentUser==='function')u=window.petCurrentUser()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    try{if(!u&&window.__PETATOE_SETTINGS_API__&&typeof window.__PETATOE_SETTINGS_API__.users==='function'){u=(window.__PETATOE_SETTINGS_API__.users()||[]).find(function(x){return String(x.id)===String(id)||String(x.username)===String(id)})}}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-legacy-engine.js",e);}
    u=u||{id:id,username:id,fullName:id,role:'unknown'};
    return {id:String(u.id||id||''),name:String(u.fullName||u.name||u.username||id||'مستخدم'),role:String(u.role||u.job||'unknown')};
  }
  function canOps(key){try{return !!(window.PETATOEPermissions&&window.PETATOEPermissions.canSpecial&&window.PETATOEPermissions.canSpecial(currentUserId(),key))}catch(e){return false}}
  function canVehicleOpsScreen(action){try{return !!(window.PETATOEPermissions&&window.PETATOEPermissions.can&&window.PETATOEPermissions.can(currentUserId(),'vehicleOperations',action||'view'))}catch(e){return false}}
  function canVehicleOpsAction(action){
    action=String(action||'view');
    var map={create:'vehicle_ops_create_trip',edit:'vehicle_ops_edit_trip',cancel:'vehicle_ops_cancel_trip',reopen:'vehicle_ops_reopen_trip',approve:'vehicle_ops_approve_trip',print:'vehicle_ops_print',export:'vehicle_ops_export',export_excel:'vehicle_ops_export_excel',export_pdf:'vehicle_ops_export_pdf',reports:'vehicle_ops_view_reports',kpis:'vehicle_ops_view_kpis'};
    if(action==='view')return canVehicleOpsScreen('view');
    if(action==='create')return canVehicleOpsScreen('add')||canOps(map.create);
    if(action==='edit')return canVehicleOpsScreen('edit')||canOps(map.edit);
    if(action==='cancel')return canVehicleOpsScreen('delete')||canOps(map.cancel);
    if(action==='reopen')return canOps(map.reopen)||canOps('operations_reopen_session')||canOps('operations_edit_confirmed_session');
    if(action==='approve')return canOps(map.approve)||canOps('operations_confirm_session');
    if(action==='reports')return canOps(map.reports)||canVehicleOpsScreen('view');
    if(action==='kpis')return canOps(map.kpis)||canVehicleOpsScreen('view');
    return map[action]?canOps(map[action]):false;
  }
  function requireVehicleOpsAction(action,msg){if(canVehicleOpsAction(action))return true;toast(msg||'لا تملك صلاحية تنفيذ هذا الإجراء في تشغيل السيارات');return false}
  function vehicleOpsNoAccessHtml(title){return '<div class="appointments-empty appointments-calendar-empty"><b>🔒 '+esc(title||'غير مصرح')+'</b><p>لا تملك صلاحية هذا الجزء من تشغيل السيارات. راجع مسؤول النظام.</p></div>'}
  function auditActionLabel(action){return {create:'إنشاء الموعد',edit:'تعديل بيانات الموعد',status:'تغيير حالة الطلب',close:'إغلاق الجلسة',reopen:'إعادة فتح الجلسة',confirm:'تأكيد الجلسة',collection:'تحديث التحصيل والدفع',select:'اختيار الطلب للتشغيل',delete:'حذف الموعد'}[action]||action||'تحديث'}
  function fmtAuditDate(iso){var d=new Date(iso||Date.now());if(isNaN(d.getTime()))d=new Date();return d.toLocaleDateString('ar-SA',{year:'numeric',month:'2-digit',day:'2-digit'})}
  function fmtAuditTime(iso){var d=new Date(iso||Date.now());if(isNaN(d.getTime()))d=new Date();return d.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'})}
  function historyDetails(action,extra){
    if(window.PETATOEOperationsHistoryInternal&&typeof window.PETATOEOperationsHistoryInternal.historyDetails==='function'&&!historyDetails._opsDelegating){
      historyDetails._opsDelegating=true;
      try{return window.PETATOEOperationsHistoryInternal.historyDetails(action,extra)}finally{historyDetails._opsDelegating=false}
    }
    return '';
  }
  function pushExecutionLog(row,action,extra){
    if(window.PETATOEOperationsHistoryInternal&&typeof window.PETATOEOperationsHistoryInternal.pushExecutionLog==='function'&&!pushExecutionLog._opsDelegating){
      pushExecutionLog._opsDelegating=true;
      try{return window.PETATOEOperationsHistoryInternal.pushExecutionLog(row,action,extra)}finally{pushExecutionLog._opsDelegating=false}
    }
    return row;
  }
  var VEHICLE_WORKFLOW_ORDER=['مجدول','في الطريق','وصل العميل','بدأت الجلسة','تمت الجلسة','تم التحصيل','مغلق','مؤكد'];
  function vehicleWorkflowIndex(status){return VEHICLE_WORKFLOW_ORDER.indexOf(normalizeStatus(status))}
  function vehicleOpsInputPaid(id,row){var raw=val('vehicleOpsPaid_'+id);if(raw==='')return Number((row&&row.paidAmount)||0);var n=Number(String(raw).replace(/,/g,''));return isFinite(n)?n:0}
  function vehicleOpsInputPayment(id,row){return val('vehicleOpsPayment_'+id)||((row&&row.paymentMethod)||'')}
  function vehicleOpsPaymentAttachmentLabel(row){
    var a=row&&(row.paymentAttachment||row.collectionAttachment);
    if(a&&a.name)return a.name;
    return row&&row.paymentAttachmentName?row.paymentAttachmentName:'';
  }
  function handlePaymentAttachment(id,input){
    if(window.PETATOEOperationsPaymentsActions&&typeof window.PETATOEOperationsPaymentsActions.handlePaymentAttachment==='function'&&!handlePaymentAttachment._opsDelegating){
      handlePaymentAttachment._opsDelegating=true;
      try{return window.PETATOEOperationsPaymentsActions.handlePaymentAttachment(id,input)}finally{handlePaymentAttachment._opsDelegating=false}
    }
    var file=input&&input.files&&input.files[0];
    if(!file)return;
    if(!/^image\//.test(file.type||'')){toast(opT('paymentImageOnly'));input.value='';return;}
    if(file.size>1024*1024*2){toast(opT('paymentImageTooLarge'));input.value='';return;}
    var reader=new FileReader();
    reader.onload=function(){
      updateVehicleRow(id,function(x){
        var oldName=vehicleOpsPaymentAttachmentLabel(x)||'-';
        x.paymentAttachment={name:file.name,type:file.type,size:file.size,data:String(reader.result||''),updatedAt:new Date().toISOString(),updatedBy:currentUserId()};
        x.paymentAttachmentName=file.name;
        x.updatedAt=new Date().toISOString();
        pushExecutionLog(x,'collection',{oldStatus:normalizeStatus(x.status),status:normalizeStatus(x.status),paymentAttachmentName:file.name,notes:'تم إضافة/تغيير صورة إثبات الدفع. السابق: '+oldName});
      });
      toast(opT('paymentImageAttached'));
    };
    reader.onerror=function(){toast(opT('paymentImageReadFailed'));};
    reader.readAsDataURL(file);
  }
  function validateVehicleCollection(row,id,requireFull){
    var paid=vehicleOpsInputPaid(id,row), method=vehicleOpsInputPayment(id,row), c=calcFinancials(Object.assign({},row,{paidAmount:paid,paymentMethod:method}));
    if(paid<0)return {ok:false,msg:'المبلغ المحصل لا يمكن أن يكون أقل من صفر'};
    if(Number(c.totalAmount||0)>0 && paid>Number(c.totalAmount||0))return {ok:false,msg:'المبلغ المحصل لا يمكن أن يكون أكبر من قيمة الجلسة'};
    if(requireFull){
      if(paid<=0)return {ok:false,msg:'لا يمكن تنفيذ تم التحصيل بدون إدخال مبلغ محصل'};
      if(!method)return {ok:false,msg:'لا يمكن تنفيذ تم التحصيل بدون اختيار طريقة السداد'};
      if(Number(c.totalAmount||0)>0 && Number(c.remainingAmount||0)>0)return {ok:false,msg:'لا يمكن اعتبار الجلسة محصلة بالكامل قبل سداد كامل قيمة الجلسة'};
    }
    return {ok:true,paid:paid,method:method,financials:c};
  }
  function requireBackwardReason(oldStatus,newStatus){
    var reason=prompt(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('أنت ترجع حالة الطلب من "'):'أنت ترجع حالة الطلب من "'+oldStatus+'" إلى "'+newStatus+'". اكتب سبب التراجع');
    reason=String(reason||'').trim();
    if(!reason){toast(opT('rollbackReasonRequired'));return null;}
    return reason;
  }
  function validateVehicleStatusTransition(row,newStatus,id){
    newStatus=normalizeStatus(newStatus);var oldStatus=normalizeStatus(row.status);
    if(oldStatus===newStatus)return {ok:true,oldStatus:oldStatus,newStatus:newStatus,same:true};
    if(vehicleOpsIsLocked(row))return {ok:false,msg:'هذه الجلسة مؤكدة ولا يمكن تعديل حالتها بدون صلاحية تعديل جلسة مؤكدة'};
    if(oldStatus==='مؤكد'&&!canOps('operations_edit_confirmed_session'))return {ok:false,msg:'لا يمكن تعديل جلسة مؤكدة بدون صلاحية'};
    if(newStatus==='مؤكد'&&!canOps('operations_confirm_session'))return {ok:false,msg:'لا تملك صلاحية تأكيد الجلسات'};
    if(newStatus==='مؤكد'&&oldStatus!=='مغلق')return {ok:false,msg:'لا يمكن تأكيد الجلسة قبل إغلاقها'};
    if(newStatus==='مغلق'&&!canOps('operations_close_session'))return {ok:false,msg:'لا تملك صلاحية إغلاق الجلسات'};
    if(newStatus==='مغلق'&&oldStatus!=='تم التحصيل'&&oldStatus!=='تمت الجلسة')return {ok:false,msg:'لا يمكن إغلاق الجلسة قبل إنهائها'};
    if(newStatus==='تم التحصيل'){
      if(oldStatus!=='تمت الجلسة'&&oldStatus!=='تم التحصيل')return {ok:false,msg:'لا يمكن تسجيل تم التحصيل قبل إنهاء الجلسة'};
      var vc=validateVehicleCollection(row,id,true);if(!vc.ok)return vc;
    }
    var oldIdx=vehicleWorkflowIndex(oldStatus), newIdx=vehicleWorkflowIndex(newStatus);
    if(oldIdx>-1&&newIdx>-1){
      if(newIdx>oldIdx+1)return {ok:false,msg:'لا يمكن تخطي مراحل حالة الطلب. المرحلة التالية بعد '+oldStatus+' هي '+VEHICLE_WORKFLOW_ORDER[oldIdx+1]};
      if(newIdx<oldIdx){
        if(oldStatus==='تم التحصيل'||oldStatus==='مغلق'||oldStatus==='مؤكد'){
          if(!canOps('operations_reopen_session')&&!canOps('operations_edit_confirmed_session'))return {ok:false,msg:'الرجوع من هذه المرحلة يحتاج صلاحية إعادة فتح/تعديل جلسة'};
        }
        var reason=requireBackwardReason(oldStatus,newStatus); if(!reason)return {ok:false,msg:'تم إلغاء التراجع لعدم إدخال السبب'};
        return {ok:true,oldStatus:oldStatus,newStatus:newStatus,backward:true,reason:reason};
      }
    }
    return {ok:true,oldStatus:oldStatus,newStatus:newStatus};
  }
  function vehicleOpsIsConfirmed(row){return normalizeStatus(row.status)==='مؤكد'||!!row.isConfirmed}
  function vehicleOpsIsLocked(row){return vehicleOpsIsConfirmed(row)&&!canOps('operations_edit_confirmed_session')}
  function vehicleOpsCanClose(row){return !vehicleOpsIsLocked(row)&&canOps('operations_close_session')&&['تمت الجلسة','تم التحصيل'].indexOf(normalizeStatus(row.status))>-1}
  function vehicleOpsCanReopen(row){return canVehicleOpsAction('reopen')&&(['مغلق','غير مكتملة'].indexOf(normalizeStatus(row.status))>-1||vehicleOpsIsConfirmed(row))}
  function vehicleOpsCanConfirm(row){return canVehicleOpsAction('approve')&&normalizeStatus(row.status)==='مغلق'}
  function updateVehicleRow(id,mutator){
    var rows=read(), changed=false;
    rows.forEach(function(x){if(String(x.id)===String(id)){mutator(x);changed=true}});
    if(changed){write(rows);renderVehicleOperations();render();}
  }
  function selectVehicleAppointment(id){vehicleOpsSelectedId=String(id||'');vehicleOpsViewTab='current';try{updateVehicleRow(id,function(x){pushExecutionLog(x,'select',{status:normalizeStatus(x.status),notes:'تم فتح الطلب في شاشة الطلب الحالي'});});}catch(e){renderVehicleOperations()}}
  function setVehicleOpsViewTab(tab){vehicleOpsViewTab=(tab==='current')?'current':'day';renderVehicleOperations()}
  function vehicleOpsIsClosed(row){var st=normalizeStatus(row.status);return st==='تم التحصيل'||st==='مغلق'||st==='مؤكد'||st==='غير مكتملة'||st==='ملغي'}
  function vehicleOpsPickSelected(rows){
    if(!rows||!rows.length)return null;
    var found=rows.find(function(r){return String(r.id)===String(vehicleOpsSelectedId)});
    if(found)return found;
    found=rows.find(function(r){return !vehicleOpsIsClosed(r)});
    vehicleOpsSelectedId=String((found||rows[0]).id||'');
    return found||rows[0];
  }
  function setVehicleStatusById(id,status){
    status=normalizeStatus(status);
    if(status==='مؤكد'&&!requireVehicleOpsAction('approve','لا تملك صلاحية اعتماد رحلة تشغيل السيارات'))return;
    if(status==='ملغي'&&!requireVehicleOpsAction('cancel','لا تملك صلاحية إلغاء رحلة تشغيل السيارات'))return;
    if(status!=='مؤكد'&&status!=='ملغي'&&!requireVehicleOpsAction('edit','لا تملك صلاحية تعديل رحلة تشغيل السيارات'))return;
    if(window.PETATOEOperationsStatusActions&&typeof window.PETATOEOperationsStatusActions.setVehicleStatusById==='function'&&!setVehicleStatusById._opsDelegating){
      setVehicleStatusById._opsDelegating=true;
      try{return window.PETATOEOperationsStatusActions.setVehicleStatusById(id,status)}finally{setVehicleStatusById._opsDelegating=false}
    }
    var r=vehicleOpsRows().find(function(x){return String(x.id)===String(id)});
    if(!r)return;
    var check=validateVehicleStatusTransition(r,status,id);
    if(!check.ok){toast(check.msg||'لا يمكن تغيير الحالة بهذا التسلسل');return;}
    if(check.same){toast(opT('statusAlreadySelected'));return;}
    updateVehicleRow(id,function(x){
      var oldStatus=normalizeStatus(x.status);
      if(status==='تم التحصيل'){
        var vc=validateVehicleCollection(x,id,true);
        x.paidAmount=vc.paid;x.paymentMethod=vc.method;x.collectionStatus='محصل بالكامل';x.remainingAmount=0;
      }
      x.status=status;x.updatedAt=new Date().toISOString();
      pushExecutionLog(x,'status',{oldStatus:oldStatus,status:status,reason:check.reason||'',notes:check.backward?'تراجع حالة الطلب بسبب موثق':''});
    });
    toast(check.backward?'تم التراجع للحالة السابقة وتسجيل السبب':'تم تحديث حالة الجلسة');
  }
  function closeVehicleSessionById(id){
    var r=vehicleOpsRows().find(function(x){return String(x.id)===String(id)}); if(!r)return;
    if(!vehicleOpsCanClose(r)){toast(opT('cannotCloseSession'));return;}
    updateVehicleRow(id,function(x){
      var oldStatus=normalizeStatus(x.status), c=calcFinancials(x), paid=Number(c.paidAmount||0);
      x.isClosed=true;x.closedAt=new Date().toISOString();x.closedBy=currentUserId();x.updatedAt=x.closedAt;
      if(paid<=0){x.status='غير مكتملة';x.collectionStatus='غير محصل';pushExecutionLog(x,'close',{oldStatus:oldStatus,status:'غير مكتملة',closedBy:x.closedBy,validation:'تم إغلاق الجلسة بدون تحصيل لذلك لا تعتبر مكتملة'});}
      else {x.status='مغلق';pushExecutionLog(x,'close',{oldStatus:oldStatus,status:'مغلق',closedBy:x.closedBy});}
    });
    vehicleOpsSelectNextAfter(id);
    toast(opT('sessionClosed'));
  }
  function reopenVehicleSessionById(id){
    if(!requireVehicleOpsAction('reopen','لا تملك صلاحية فتح رحلة تشغيل السيارات مرة أخرى'))return;
    var r=vehicleOpsRows().find(function(x){return String(x.id)===String(id)}); if(!r)return;
    if(!vehicleOpsCanReopen(r)){toast(opT('cannotReopenSession'));return;}
    var reason=prompt(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('اكتب سبب إعادة فتح الجلسة'):'اكتب سبب إعادة فتح الجلسة');
    if(!String(reason||'').trim()){toast(opT('reopenReasonRequired'));return;}
    updateVehicleRow(id,function(x){var oldStatus=normalizeStatus(x.status);x.status='تمت الجلسة';x.wasConfirmed=!!x.isConfirmed;x.isConfirmed=false;x.isClosed=false;x.reopenedAt=new Date().toISOString();x.reopenedBy=currentUserId();x.reopenReason=String(reason).trim();x.updatedAt=x.reopenedAt;pushExecutionLog(x,'reopen',{oldStatus:oldStatus,status:'تمت الجلسة',reason:x.reopenReason,reopenedBy:x.reopenedBy});});
    vehicleOpsSelectedId=String(id);vehicleOpsViewTab='current';
    toast(opT('sessionReopened'));
  }
  function confirmVehicleSessionById(id){
    if(!requireVehicleOpsAction('approve','لا تملك صلاحية اعتماد رحلة تشغيل السيارات'))return;
    var r=vehicleOpsRows().find(function(x){return String(x.id)===String(id)}); if(!r)return;
    if(!vehicleOpsCanConfirm(r)){toast(opT('cannotConfirmSession'));return;}
    if(!confirm(opT('confirmSession')))return;
    updateVehicleRow(id,function(x){var oldStatus=normalizeStatus(x.status);x.status='مؤكد';x.isConfirmed=true;x.confirmedAt=new Date().toISOString();x.confirmedBy=currentUserId();x.updatedAt=x.confirmedAt;pushExecutionLog(x,'confirm',{oldStatus:oldStatus,status:'مؤكد',confirmedBy:x.confirmedBy});});
    toast(opT('sessionConfirmed'));
  }
  function setVehicleStatusByIndex(idx,status){
    if(window.PETATOEOperationsStatusActions&&typeof window.PETATOEOperationsStatusActions.setVehicleStatusByIndex==='function'&&!setVehicleStatusByIndex._opsDelegating){
      setVehicleStatusByIndex._opsDelegating=true;
      try{return window.PETATOEOperationsStatusActions.setVehicleStatusByIndex(idx,status)}finally{setVehicleStatusByIndex._opsDelegating=false}
    }
    var r=vehicleOpsRows()[Number(idx)]; if(r)setVehicleStatusById(r.id,status)
  }
  function nextVehicleStatusById(id){
    if(window.PETATOEOperationsStatusActions&&typeof window.PETATOEOperationsStatusActions.nextVehicleStatusById==='function'&&!nextVehicleStatusById._opsDelegating){
      nextVehicleStatusById._opsDelegating=true;
      try{return window.PETATOEOperationsStatusActions.nextVehicleStatusById(id)}finally{nextVehicleStatusById._opsDelegating=false}
    }
    var r=vehicleOpsRows().find(function(x){return String(x.id)===String(id)}); if(!r)return;
    var ns=nextStatus(r.status); if(ns!==normalizeStatus(r.status)) setVehicleStatusById(id,ns);
  }
  function nextVehicleStatusByIndex(idx){
    if(window.PETATOEOperationsStatusActions&&typeof window.PETATOEOperationsStatusActions.nextVehicleStatusByIndex==='function'&&!nextVehicleStatusByIndex._opsDelegating){
      nextVehicleStatusByIndex._opsDelegating=true;
      try{return window.PETATOEOperationsStatusActions.nextVehicleStatusByIndex(idx)}finally{nextVehicleStatusByIndex._opsDelegating=false}
    }
    var r=vehicleOpsRows()[Number(idx)]; if(r)nextVehicleStatusById(r.id)
  }
  function vehicleOpsSelectNextAfter(id){
    var rows=vehicleOpsRows();
    var idx=rows.findIndex(function(r){return String(r.id)===String(id)});
    var next=rows.slice(idx+1).find(function(r){return !vehicleOpsIsClosed(r)})||rows.find(function(r){return !vehicleOpsIsClosed(r)});
    vehicleOpsSelectedId=next?String(next.id||''):String(id||'');
  }
  function saveVehicleSessionById(id){
    if(!requireVehicleOpsAction('edit','لا تملك صلاحية حفظ أو تعديل رحلة تشغيل السيارات'))return;
    if(window.PETATOEOperationsPaymentsActions&&typeof window.PETATOEOperationsPaymentsActions.saveVehicleSessionById==='function'&&!saveVehicleSessionById._opsDelegating){
      saveVehicleSessionById._opsDelegating=true;
      try{return window.PETATOEOperationsPaymentsActions.saveVehicleSessionById(id)}finally{saveVehicleSessionById._opsDelegating=false}
    }
    var r=vehicleOpsRows().find(function(x){return String(x.id)===String(id)}); if(!r)return;
    if(vehicleOpsIsLocked(r)){toast(opT('confirmedSessionLocked'));return;}
    var hasPaymentInputs=!!byId('vehicleOpsPaid_'+id);
    var paid=hasPaymentInputs?Number(String(val('vehicleOpsPaid_'+id)||0).replace(/,/g,'')):Number((r&&r.paidAmount)||0), method=hasPaymentInputs?val('vehicleOpsPayment_'+id):(r.paymentMethod||''), notes=val('vehicleOpsNotes_'+id), collection=hasPaymentInputs?val('vehicleOpsCollection_'+id):(r.collectionStatus||'غير محصل'), ref=hasPaymentInputs?val('vehicleOpsRef_'+id):(r.collectionReference||'');
    var base=calcFinancials(Object.assign({},r,{paidAmount:paid,paymentMethod:method}));
    if(paid<0){toast(opT('paidBelowZero'));return;}
    if(Number(base.totalAmount||0)>0 && paid>Number(base.totalAmount||0)){toast(opT('paidExceedsTotal'));return;}
    if(paid>0 && !method){toast(opT('selectPaymentMethod'));return;}
    var shouldMoveNext=false;
    updateVehicleRow(r.id,function(x){
      var oldStatus=normalizeStatus(x.status);
      x.paidAmount=paid;
      x.paymentMethod=method||x.paymentMethod||'';
      x.collectionStatus=collection||x.collectionStatus||'غير محصل';
      x.collectionReference=ref||x.collectionReference||'';
      x.sessionExecutionNotes=notes;
      x.notes=notes;
      var c=calcFinancials(x);
      Object.assign(x,c);
      if(Number(c.remainingAmount||0)<=0 && Number(c.totalAmount||0)>0 && paid>0){
        x.collectionStatus='محصل بالكامل';
        if(normalizeStatus(x.status)==='تمت الجلسة'){x.status='تم التحصيل';shouldMoveNext=true}
      }
      else if(Number(c.paidAmount||0)>0){x.collectionStatus='محصل جزئي'}
      else {x.collectionStatus='غير محصل'}
      x.updatedAt=new Date().toISOString();
      pushExecutionLog(x,'collection',{oldStatus:oldStatus,status:normalizeStatus(x.status),paidAmount:x.paidAmount,paymentMethod:x.paymentMethod,collectionStatus:x.collectionStatus,collectionReference:x.collectionReference});
    });
    if(shouldMoveNext){vehicleOpsSelectNextAfter(r.id);renderVehicleOperations();}
    toast(opT('sessionCollectionSaved'));
  }
  function saveVehicleSessionByIndex(idx){
    if(window.PETATOEOperationsPaymentsActions&&typeof window.PETATOEOperationsPaymentsActions.saveVehicleSessionByIndex==='function'&&!saveVehicleSessionByIndex._opsDelegating){
      saveVehicleSessionByIndex._opsDelegating=true;
      try{return window.PETATOEOperationsPaymentsActions.saveVehicleSessionByIndex(idx)}finally{saveVehicleSessionByIndex._opsDelegating=false}
    }
    var r=vehicleOpsRows()[Number(idx)]; if(r)saveVehicleSessionById(r.id)}
  function vehicleStageTime(row,status,fallback){
    if(window.PETATOEOperationsStatusRender&&typeof window.PETATOEOperationsStatusRender.vehicleStageTime==='function'&&!vehicleStageTime._opsDelegating){
      vehicleStageTime._opsDelegating=true;
      try{return window.PETATOEOperationsStatusRender.vehicleStageTime(row,status,fallback)}finally{vehicleStageTime._opsDelegating=false}
    }
    var logs=Array.isArray(row.executionLog)?row.executionLog:[];
    for(var i=logs.length-1;i>=0;i--){
      var x=logs[i]||{};
      if(x.status&&normalizeStatus(x.status)===normalizeStatus(status)&&x.at){
        var d=new Date(x.at); if(!isNaN(d.getTime())) return d.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
      }
    }
    return fallback||'--:--';
  }
  function vehicleStageDone(row,status){
    if(window.PETATOEOperationsStatusRender&&typeof window.PETATOEOperationsStatusRender.vehicleStageDone==='function'&&!vehicleStageDone._opsDelegating){
      vehicleStageDone._opsDelegating=true;
      try{return window.PETATOEOperationsStatusRender.vehicleStageDone(row,status)}finally{vehicleStageDone._opsDelegating=false}
    }
    var order=['مجدول','في الطريق','وصل العميل','بدأت الجلسة','تمت الجلسة','تم التحصيل','مغلق','مؤكد'];
    var current=normalizeStatus(row.status), target=normalizeStatus(status);
    if(current==='غير مكتملة')current='تمت الجلسة';
    return order.indexOf(current)>=order.indexOf(target)&&order.indexOf(target)>-1;
  }
  function vehicleStatusButtons(id,r){
    if(window.PETATOEOperationsStatusRender&&typeof window.PETATOEOperationsStatusRender.vehicleStatusButtons==='function'&&!vehicleStatusButtons._opsDelegating){
      vehicleStatusButtons._opsDelegating=true;
      try{return window.PETATOEOperationsStatusRender.vehicleStatusButtons(id,r)}finally{vehicleStatusButtons._opsDelegating=false}
    }
    var steps=[['في الطريق','بدء التحرك','🚐'],['وصل العميل','وصلنا','📍'],['بدأت الجلسة','بدء الجلسة','✂️'],['تمت الجلسة','إنهاء الجلسة','🧼'],['تم التحصيل','تم التحصيل','💳'],['مغلق','مغلقة','🔒'],['مؤكد','مؤكدة','🛡️']];
    var locked=vehicleOpsIsLocked(r)||!canVehicleOpsAction('edit'), disabled=locked?' disabled title="لا تملك صلاحية تعديل الحالة أو الجلسة مقفلة"':'';
    return steps.map(function(x){var active=normalizeStatus(r.status)===x[0], done=vehicleStageDone(r,x[0]);return '<button class="vehicle-ops-step '+(active?'active ':'')+(done?'done ':'')+(locked?'locked':'')+'" type="button" '+disabled+' data-op-click="setVehicleStatusById" data-op-arg1="'+esc(id)+'" data-op-arg2="'+esc(x[0])+'"><span>'+x[2]+'</span><b>'+esc(x[1])+'</b><small>'+esc(vehicleStageTime(r,x[0],''))+'</small></button>'}).join('');
  }
  function vehicleProgressBar(row){
    if(window.PETATOEOperationsStatusRender&&typeof window.PETATOEOperationsStatusRender.vehicleProgressBar==='function'&&!vehicleProgressBar._opsDelegating){
      vehicleProgressBar._opsDelegating=true;
      try{return window.PETATOEOperationsStatusRender.vehicleProgressBar(row)}finally{vehicleProgressBar._opsDelegating=false}
    }
    var steps=[['في الطريق','بدء التحرك','🚐'],['وصل العميل','وصلنا','📍'],['بدأت الجلسة','بدء الجلسة','✂️'],['تمت الجلسة','إنهاء الجلسة','🧼'],['تم التحصيل','تم التحصيل','💳'],['مغلق','مغلقة','🔒'],['مؤكد','مؤكدة','🛡️']];
    return '<div class="vehicle-ops-progress vehicle-ops-progress-bottom">'+steps.map(function(x,idx){var done=vehicleStageDone(row,x[0]), active=normalizeStatus(row.status)===x[0];return '<div class="vehicle-ops-progress-step '+(done?'done ':'')+(active?'active':'')+'"><span class="vehicle-ops-progress-num">'+(idx+1)+'</span><div><b>'+esc(x[1])+'</b><small>'+esc(vehicleStageTime(row,x[0],idx===0?(row.start||'--:--'):(idx===3?(row.end||'--:--'):'--:--')))+'</small></div></div>'}).join('<i></i>')+'</div>';
  }
  function vehiclePaymentOptions(active){
    var opts=['شبكة','نقدًا','تحويل بنكي','دفع عن طريق الموقع'];
    return opts.map(function(x){return '<option '+(active===x?'selected':'')+'>'+esc(x)+'</option>'}).join('');
  }
  function vehicleOpsElapsed(row){
    var startLog=logDate(row,'في الطريق')||plannedDate(row,'start'); if(!startLog)return '--:--';
    var endLog=logDate(row,'تم التحصيل')||logDate(row,'تمت الجلسة')||new Date();
    var m=Math.max(0,Math.round((endLog.getTime()-startLog.getTime())/60000));
    return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  }
  function vehicleOpsRemaining(rows,selected){
    if(!selected)return '--:--';
    var idx=rows.findIndex(function(r){return String(r.id)===String(selected.id)});
    var tail=rows.slice(Math.max(0,idx)).filter(function(r){return !vehicleOpsIsClosed(r)});
    var mins=tail.reduce(function(a,r){var s=String(r.start||''),e=String(r.end||'');if(s&&e){var ms=new Date('2000-01-01T'+e).getTime()-new Date('2000-01-01T'+s).getTime();if(isFinite(ms)&&ms>0)return a+Math.round(ms/60000)}return a+60},0);
    return String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');
  }
  function summarizeAppointmentChanges(oldRow,newRow){
    var labels={client:'العميل',phone:'الهاتف',date:'التاريخ',start:'وقت البداية',end:'وقت النهاية',vehicle:'السيارة',driver:'السائق',groomer:'الجرومر',service:'الخدمة',paymentMethod:'طريقة الدفع',paidAmount:'المبلغ المحصل',collectionStatus:'حالة التحصيل',collectionReference:'مرجع المعاملة',paymentAttachmentName:'صورة إثبات الدفع',status:'الحالة',address:'العنوان'};
    return Object.keys(labels).filter(function(k){return String((oldRow||{})[k]||'')!==String((newRow||{})[k]||'')}).map(function(k){return labels[k]+': '+String((oldRow||{})[k]||'-')+' ← '+String((newRow||{})[k]||'-')});
  }
  function renderSessionHistory(row){
    if(window.PETATOEOperationsHistoryRender&&typeof window.PETATOEOperationsHistoryRender.renderSessionHistory==='function'&&!renderSessionHistory._opsHistoryDelegating){
      renderSessionHistory._opsHistoryDelegating=true;
      try{return window.PETATOEOperationsHistoryRender.renderSessionHistory(row)}finally{renderSessionHistory._opsHistoryDelegating=false}
    }
    return '<div class="vehicle-ops-history-panel"><div class="vehicle-ops-history-head"><h4>📜 سجل حالة الطلب</h4><span>0 حدث</span></div><div class="vehicle-ops-history-list"><div class="appointments-empty">لا يوجد سجل حالة لهذا الطلب بعد</div></div></div>';
  }

  function vehicleDetailsCell(label,value,wide){
    var api=window.PETATOEOperationsWorkflowReal;
    if(api&&typeof api.vehicleDetailsCell==='function')return api.vehicleDetailsCell(label,value,wide,{esc:esc});
    return '<td '+(wide?'colspan="2"':'')+'><small>'+esc(label)+'</small><b>'+esc((value===0||value)?value:'-')+'</b></td>';
  }
  function renderVehicleSessionDetailsTable(row){
    var api=window.PETATOEOperationsWorkflowReal;
    if(api&&typeof api.renderVehicleSessionDetailsTable==='function')return api.renderVehicleSessionDetailsTable(row,{esc:esc,money:money,normalizeStatus:normalizeStatus,calcFinancials:calcFinancials});
    return '';
  }


  function vehicleOpsPaymentStageStatuses(status){
    var api=window.PETATOEOperationsWorkflowReal;
    if(api&&typeof api.vehicleOpsPaymentStageStatuses==='function')return api.vehicleOpsPaymentStageStatuses(status,{normalizeStatus:normalizeStatus});
    var st=normalizeStatus(status);return st==='تمت الجلسة'||st==='تم التحصيل';
  }
  function renderVehiclePaymentPanel(row,id,lockAttr){
    row=calcFinancials(row||{});
    var payMethod=row.paymentMethod||'';
    return '<div class="vehicle-ops-stage-card vehicle-ops-stage-payment" id="vehicleOpsPaymentStage">'
      +'<div class="vehicle-ops-stage-title"><span>💰</span><div><h4>مرحلة التحصيل والدفع</h4><p>تظهر هذه المرحلة فقط بعد إنهاء الجلسة وقبل الإغلاق.</p></div></div>'
      +'<div class="vehicle-ops-payment-grid-stage">'
      +'<div class="vehicle-ops-finance-cards stage"><span><small>الإجمالي</small><b>'+money(row.totalAmount||0)+'</b></span><span><small>الخصم</small><b>'+money(row.discount||0)+'</b></span><span><small>المتبقي</small><b>'+money(row.remainingAmount||0)+'</b></span></div>'
      +'<label>طريقة الدفع<select id="vehicleOpsPayment_'+esc(id)+'" '+lockAttr+'><option value="">اختر طريقة الدفع</option>'+vehiclePaymentOptions(payMethod)+'</select></label>'
      +'<label>المبلغ المحصل<input id="vehicleOpsPaid_'+esc(id)+'" '+lockAttr+' type="number" min="0" step="0.01" value="'+esc(row.paidAmount||0)+'"/></label>'
      +'<label>حالة التحصيل<select id="vehicleOpsCollection_'+esc(id)+'" '+lockAttr+'><option '+((row.collectionStatus||'غير محصل')==='غير محصل'?'selected':'')+'>غير محصل</option><option '+(row.collectionStatus==='محصل جزئي'?'selected':'')+'>محصل جزئي</option><option '+(row.collectionStatus==='محصل بالكامل'?'selected':'')+'>محصل بالكامل</option></select></label>'
      +'<label>رقم / مرجع المعاملة<input id="vehicleOpsRef_'+esc(id)+'" '+lockAttr+' value="'+esc(row.collectionReference||'')+'" placeholder="TXN / رقم الشبكة"/></label>'
      +'<label class="vehicle-ops-attachment-label stage">صورة إثبات الدفع<input id="vehicleOpsAttachment_'+esc(id)+'" '+lockAttr+' data-id="'+esc(id)+'" type="file" accept="image/*" data-op-change="handlePaymentAttachment" data-op-use-id="true" data-op-pass-self="true"/><span>📎 إضافة صورة</span><small>'+esc(vehicleOpsPaymentAttachmentLabel(row)||'لا توجد صورة مرفقة')+'</small></label>'
      +(vehicleOpsPaymentAttachmentLabel(row)?'<div class="vehicle-ops-attachment-preview stage"><img src="'+esc((row.paymentAttachment&&row.paymentAttachment.data)||'')+'" alt="إثبات الدفع"/><b>'+esc(vehicleOpsPaymentAttachmentLabel(row))+'</b></div>':'')
      +'</div>'
      +'<button class="btn btn-primary vehicle-ops-collect stage" type="button" '+lockAttr+' data-id="'+esc(id)+'" data-op-click="saveVehicleSessionById" data-op-use-id="true">حفظ التحصيل والدفع ✅</button>'
      +'<div class="vehicle-ops-stage-hint">لن يتم اعتبار الطلب محصلًا إلا بعد إدخال المبلغ واختيار طريقة السداد، ولا يمكن أن يتجاوز المحصل قيمة الجلسة.</div>'
      +'</div>';
  }
  function renderVehicleFinalSummary(row){
    var api=window.PETATOEOperationsWorkflowReal;
    if(api&&typeof api.renderVehicleFinalSummary==='function')return api.renderVehicleFinalSummary(row,{esc:esc,money:money,normalizeStatus:normalizeStatus,calcFinancials:calcFinancials,fmtAuditDate:fmtAuditDate,fmtAuditTime:fmtAuditTime,vehicleOpsPaymentAttachmentLabel:vehicleOpsPaymentAttachmentLabel});
    return '';
  }
  function renderVehicleOperationalStage(row,id,lockAttr){
    var st=normalizeStatus(row.status);
    var headline=st==='في الطريق'?'بيانات التحرك والوصول':(st==='وصل العميل'?'بيانات الوصول للعميل':(st==='بدأت الجلسة'?'بيانات تنفيذ الجلسة':'بيانات الطلب الحالي'));
    return '<div class="vehicle-ops-stage-card vehicle-ops-stage-info">'
      +'<div class="vehicle-ops-stage-title"><span>📋</span><div><h4>'+esc(headline)+'</h4><p>يتم عرض البيانات المناسبة حسب مرحلة الطلب الحالية لتقليل التشتت.</p></div></div>'
      +renderVehicleSessionDetailsTable(row)
      +'<div class="vehicle-ops-session-note stage"><h4>سجل ما تم في الجلسة</h4><textarea id="vehicleOpsNotes_'+esc(id)+'" '+lockAttr+' placeholder="اكتب ملاحظات التنفيذ هنا...">'+esc(row.sessionExecutionNotes||row.notes||'')+'</textarea><small>0/250</small></div>'
      +'<button class="btn btn-primary vehicle-ops-save stage" type="button" '+lockAttr+' data-op-click="saveVehicleSessionById" data-op-arg1="'+esc(id)+'">✅ حفظ ما تم في الجلسة</button>'
      +'</div>';
  }
  function renderVehicleStageContent(row,id,lockAttr){
    var st=normalizeStatus(row.status);
    if(st==='مغلق'||st==='مؤكد'||st==='غير مكتملة')return renderVehicleFinalSummary(row);
    if(vehicleOpsPaymentStageStatuses(st))return renderVehiclePaymentPanel(row,id,lockAttr);
    return renderVehicleOperationalStage(row,id,lockAttr);
  }

  function renderVehicleOperations(){
    var board=byId('vehicleOpsBoard'), summary=byId('vehicleOpsSummary');
    if(!board&&!summary)return;
    if(!canVehicleOpsAction('view')){if(summary)summary.textContent='';if(board)safeHtml(board,vehicleOpsNoAccessHtml('تشغيل السيارات'),'vehicle operations permission denied');return;}
    renderVehicleOptions();
    var rows=vehicleOpsRows(), day=vehicleOpsDate(), vehicles=groupBy(rows,'vehicle','بدون سيارة');
    var selected=vehicleOpsPickSelected(rows);
    var active=countAnyStatus(rows,['في الطريق','وصل العميل','بدأت الجلسة']), done=countAnyStatus(rows,['تمت الجلسة','تم التحصيل']), collected=rows.reduce(function(a,r){return a+Number(calcFinancials(r).paidAmount||0)},0), remaining=rows.reduce(function(a,r){return a+Number(calcFinancials(r).remainingAmount||0)},0);
    if(summary){safeHtml(summary,'<div class="appointments-dispatch-summary-card"><span>📅 التاريخ</span><b>'+esc(day)+'</b><small>تشغيل السيارات</small></div><div class="appointments-dispatch-summary-card"><span>'+esc(opT('totalSessions'))+'</span><b>'+rows.length+'</b><small>'+vehicles.length+' سيارات</small></div><div class="appointments-dispatch-summary-card"><span>قيد التشغيل</span><b>'+active+'</b><small>مكتمل: '+done+'</small></div><div class="appointments-dispatch-summary-card"><span>'+esc(opT('collection'))+'</span><b>'+money(collected)+'</b><small>متبقي: '+money(remaining)+'</small></div>','operations vehicle ops summary')}
    if(!board)return;
    var tabs='<div class="vehicle-ops-tabs"><button class="vehicle-ops-tab '+(vehicleOpsViewTab==='day'?'active':'')+'" type="button" data-op-click="setVehicleOpsViewTab" data-op-arg1="day">📋 جدول اليوم</button><button class="vehicle-ops-tab '+(vehicleOpsViewTab==='current'?'active':'')+'" type="button" data-op-click="setVehicleOpsViewTab" data-op-arg1="current">🚦 الطلب الحالي</button></div>';
    if(!rows.length){safeHtml(board, tabs+'<div class="appointments-empty appointments-calendar-empty">لا توجد مواعيد تشغيل في تاريخ '+esc(day)+'</div>', 'operations legacy render');return;}
    selected=calcFinancials(selected||rows[0]);
    var currentId=String(selected.id||'');
    var currentIndex=rows.findIndex(function(r){return String(r.id)===currentId});
    var nextOpen=rows.slice(Math.max(0,currentIndex)+1).find(function(r){return !vehicleOpsIsClosed(r)})||rows.find(function(r){return !vehicleOpsIsClosed(r)});
    var list=rows.map(function(r,i){r=calcFinancials(r);var isCurrent=String(r.id)===currentId, closed=vehicleOpsIsClosed(r), st=normalizeStatus(r.status);var progress=vehicleStageDone(r,'تم التحصيل')?'100%':(vehicleStageDone(r,'تمت الجلسة')?'80%':(vehicleStageDone(r,'بدأت الجلسة')?'60%':(vehicleStageDone(r,'وصل العميل')?'40%':(vehicleStageDone(r,'في الطريق')?'20%':'0%'))));var ops='<div class="vehicle-ops-row-actions"><button type="button" data-op-click="selectVehicleAppointment" data-op-arg1="'+esc(r.id)+'" data-op-stop="true" class="vehicle-ops-circle-action open"><span class="vehicle-ops-action-icon">🛡️</span><b>فتح</b></button>'+(vehicleOpsCanClose(r)?'<button type="button" class="vehicle-ops-circle-action close" data-op-click="closeVehicleSessionById" data-op-arg1="'+esc(r.id)+'" data-op-stop="true"><span class="vehicle-ops-action-icon">🔒</span><b>إغلاق</b></button>':'')+(vehicleOpsCanReopen(r)?'<button type="button" class="vehicle-ops-circle-action reopen" data-op-click="reopenVehicleSessionById" data-op-arg1="'+esc(r.id)+'" data-op-stop="true"><span class="vehicle-ops-action-icon">🔓</span><b>فتح مرة أخرى</b></button>':'')+(vehicleOpsCanConfirm(r)?'<button type="button" class="vehicle-ops-circle-action confirm" data-op-click="confirmVehicleSessionById" data-op-arg1="'+esc(r.id)+'" data-op-stop="true"><span class="vehicle-ops-action-icon">✅</span><b>تأكيد</b></button>':'')+'</div>';return '<button class="vehicle-ops-day-row '+(isCurrent?'active ':'')+(closed?'closed ':'')+statusClass(st)+'" type="button" data-op-click="selectVehicleAppointment" data-op-arg1="'+esc(r.id)+'"><span class="day-row-num">'+(i+1)+'</span><span class="day-row-time">'+esc(r.start||'--:--')+'<small>'+esc(r.end||'')+'</small></span><span class="day-row-main"><b>'+esc(r.client||'عميل غير محدد')+'</b><small>'+esc([r.service,r.petName,r.animalType,r.breed,r.size].filter(Boolean).join(' - ')||'جلسة')+'</small><small>📍 '+esc(r.address||'بدون عنوان')+'</small></span><span class="day-row-team"><small>✂️ '+esc(r.groomer||'-')+'</small><small>🚗 '+esc(r.driver||'-')+'</small><small>🚐 '+esc(r.vehicle||'-')+'</small></span><span class="appointments-status '+statusClass(st)+'">'+esc(st)+'</span><span class="vehicle-ops-row-progress"><i style="width:'+progress+'"></i></span><em>'+esc(st==='مؤكد'?'مؤكد':(st==='مغلق'?'مغلق':(closed?'مكتمل':(isCurrent?'مفتوح الآن':'فتح الطلب'))))+'</em>'+ops+'</button>'}).join('');
    if(vehicleOpsViewTab==='day'){
      safeHtml(board,tabs+'<div class="vehicle-ops-day-layout"><section class="vehicle-ops-day-list"><div class="vehicle-ops-section-head"><h3>جدول اليوم حسب السيارة</h3><span>'+rows.length+'</span></div><div class="vehicle-ops-filter-chip">'+esc(val('vehicleOpsVehicleFilter')==='all'?'كل السيارات':val('vehicleOpsVehicleFilter'))+' — '+esc(day)+'</div><div class="vehicle-ops-day-list-scroll">'+list+'</div></section><aside class="vehicle-ops-day-side"><h3>الطلب المحدد</h3><div class="vehicle-ops-current-mini"><b>'+esc(selected.client||'عميل غير محدد')+'</b><p>'+esc([selected.start,selected.end].filter(Boolean).join(' - ')||'-')+'</p><p>'+esc([selected.service,selected.petName,selected.animalType].filter(Boolean).join(' - ')||'-')+'</p><span class="appointments-status '+statusClass(selected.status)+'">'+esc(normalizeStatus(selected.status))+'</span></div><button class="btn btn-primary" type="button" data-op-click="setVehicleOpsViewTab" data-op-arg1="current">فتح الطلب الحالي</button>'+(nextOpen&&String(nextOpen.id)!==currentId?'<button class="btn btn-ghost" type="button" data-op-click="selectVehicleAppointment" data-op-arg1="'+esc(nextOpen.id)+'">فتح الموعد التالي</button>':'')+'<small>اختيار أي موعد من الجدول يفتح تبويب الطلب الحالي تلقائيًا أمام السائق.</small></aside></div>','operations vehicle day board');
      return;
    }
    var lockedCurrent=vehicleOpsIsLocked(selected), lockAttr=lockedCurrent?' disabled title="الجلسة مؤكدة ومقفلة"':'';
    var logs=(Array.isArray(selected.executionLog)?selected.executionLog:[]).slice(-6).reverse().map(function(x){return '<small>• '+esc(auditActionLabel(x.action))+' — '+esc(x.status||x.collectionStatus||x.paymentMethod||'')+'</small>'}).join('')||'<small>لا يوجد سجل تنفيذ بعد</small>';
    var bottom=vehicleProgressBar(selected);
    var stageContent=renderVehicleStageContent(selected,currentId,lockAttr);
    safeHtml(board,tabs+'<div class="vehicle-ops-current-stage-layout">'
      +'<section class="vehicle-ops-current-main stage-based">'
      +'<div class="vehicle-ops-current-head"><span class="vehicle-now-badge">الطلب الحالي</span><h3>'+esc(selected.client||'عميل غير محدد')+'</h3><div><button class="btn btn-ghost" type="button" data-op-click="setVehicleOpsViewTab" data-op-arg1="day">📋 جدول اليوم</button><button class="btn btn-ghost" type="button" data-op-click="renderVehicleOperations">تحديث ↻</button></div></div>'
      +'<div class="vehicle-ops-status-panel vehicle-ops-status-panel-top"><h4>تحديث حالة الطلب</h4><div class="vehicle-ops-step-row">'+vehicleStatusButtons(currentId,selected)+'</div>'+vehicleDirectionHtml(selected,false)+'</div>'
      +'<div class="vehicle-ops-stage-alert">تتغير البيانات المعروضة أسفل شريط الحالة حسب مرحلة الطلب الحالية. تفاصيل التحصيل والدفع لا تظهر إلا عند الوصول إلى مرحلة التحصيل.</div>'
      +stageContent
      +'<div class="vehicle-ops-admin-actions"><h4>إغلاق / إعادة فتح / تأكيد</h4><div>'+(vehicleOpsCanClose(selected)?'<button class="btn btn-primary" type="button" data-op-click="closeVehicleSessionById" data-op-arg1="'+esc(currentId)+'">🔒 إغلاق الجلسة</button>':'')+(vehicleOpsCanReopen(selected)?'<button class="btn btn-ghost" type="button" data-op-click="reopenVehicleSessionById" data-op-arg1="'+esc(currentId)+'">🔓 فتح الجلسة مرة أخرى</button>':'')+(vehicleOpsCanConfirm(selected)?'<button class="btn btn-primary" type="button" data-op-click="confirmVehicleSessionById" data-op-arg1="'+esc(currentId)+'">✅ تأكيد الجلسة</button>':'')+(!vehicleOpsCanClose(selected)&&!vehicleOpsCanReopen(selected)&&!vehicleOpsCanConfirm(selected)?'<small>لا توجد إجراءات إدارية متاحة لهذا الطلب حسب الحالة والصلاحيات.</small>':'')+'</div></div>'
      +'</section>'
      +'<aside class="vehicle-ops-quick-side"><div class="vehicle-ops-mini-log"><h4>سجل التنفيذ السريع</h4>'+logs+'</div><div class="vehicle-ops-current-mini"><b>'+esc(selected.vehicle||'بدون سيارة')+'</b><p>'+esc(selected.driver||'بدون سائق')+' | '+esc(selected.groomer||'بدون جرومر')+'</p><p>الوقت المنقضي: '+vehicleOpsElapsed(selected)+'</p><p>التالي: '+(nextOpen?esc(nextOpen.start||'--:--'):'لا يوجد')+'</p></div></aside>'
      +'</div>'+renderSessionHistory(selected)+'<div class="vehicle-ops-bottom-bar"><div><b>🚐 '+esc(selected.vehicle||'بدون سيارة')+'</b><small>'+esc(selected.driver||'بدون سائق')+' | '+esc(selected.groomer||'بدون جرومر')+'</small></div><div class="vehicle-ops-bottom-progress"><h4>شريط الحالة والأوقات</h4>'+bottom+'</div><div><small>الوقت المنقضي</small><b>'+vehicleOpsElapsed(selected)+'</b></div><div><small>التالي</small><b>'+(nextOpen?esc(nextOpen.start||'--:--'):'لا يوجد')+'</b></div></div>','operations vehicle current stage');
  }

  function vehicleOpsReportDate(id,fallback){var d=val(id);if(!d){d=fallback||today();setVal(id,d)}return d}
  function renderVehicleReportOptions(){
    var sel=byId('vehicleOpsReportVehicleFilter'); if(!sel) return;
    var old=sel.value||'all';
    var names=vehicleScopeFilterNames(uniqueSorted(read().map(function(r){return r.vehicle||''}).concat(vehicleNames()).filter(Boolean)));
    if(old&&old!=='all'&&names.indexOf(old)===-1){old='all';sel.value='all'}
    safeHtml(sel, '<option value="all">'+esc(opT('allAuthorizedVehicles'))+'</option>'+names.map(function(x){return '<option value="'+esc(x)+'" '+(x===old?'selected':'')+'>'+esc(x)+'</option>'}).join(''), 'operations vehicle scope report render');
  }
  function vehicleExecutionReportRows(){
    var from=vehicleOpsReportDate('vehicleOpsReportFrom',today()), to=vehicleOpsReportDate('vehicleOpsReportTo',from), car=val('vehicleOpsReportVehicleFilter')||'all';
    if(to<from){var tmp=from;from=to;to=tmp;setVal('vehicleOpsReportFrom',from);setVal('vehicleOpsReportTo',to)}
    return vehicleScopeFilterRows(read().map(function(r){return calcFinancials(r)})).filter(function(r){
      var d=String(r.date||'');
      return d>=from&&d<=to&&(!car||car==='all'||String(r.vehicle||'')===String(car));
    }).sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))||String(a.vehicle||'').localeCompare(String(b.vehicle||''),'ar')||String(a.start||'').localeCompare(String(b.start||''))});
  }
  function logDate(row,status){
    var logs=Array.isArray(row.executionLog)?row.executionLog:[];
    var hit=logs.find(function(x){return x&&x.status&&normalizeStatus(x.status)===normalizeStatus(status)})||null;
    if(!hit&&status==='تم التحصيل')hit=logs.find(function(x){return x&&x.action==='collection'&&String(x.collectionStatus||'').indexOf('محصل')>-1})||null;
    if(!hit||!hit.at)return null;
    var d=new Date(hit.at);return isNaN(d.getTime())?null:d;
  }
  function plannedDate(row,timeField){var d=String(row.date||''), t=String(row[timeField]||'');if(!d||!t)return null;var x=new Date(d+'T'+t);return isNaN(x.getTime())?null:x}
  function diffMinutes(a,b){return a&&b?Math.max(0,Math.round((b.getTime()-a.getTime())/60000)):null}
  function avg(list){list=(list||[]).filter(function(x){return x!=null&&isFinite(x)});return list.length?Math.round(list.reduce(function(a,b){return a+b},0)/list.length):null}
  function fmtMins(n){if(n==null)return '-';if(n<60)return opT('minutesShort',{value:n});var h=Math.floor(n/60), m=n%60;return opT('hoursMinutesShort',{hours:h,minutes:m})}
  function executionMetrics(rows){
    rows=rows||[];
    var completed=countAnyStatus(rows,['تمت الجلسة','تم التحصيل']), collected=rows.reduce(function(a,r){return a+Number(calcFinancials(r).paidAmount||0)},0), remaining=rows.reduce(function(a,r){return a+Number(calcFinancials(r).remainingAmount||0)},0);
    var arrival=[], session=[], lateStart=0, lateEnd=0;
    rows.forEach(function(r){
      var go=logDate(r,'في الطريق'), arrived=logDate(r,'وصل العميل'), started=logDate(r,'بدأت الجلسة'), ended=logDate(r,'تمت الجلسة')||logDate(r,'تم التحصيل');
      var a=diffMinutes(go,arrived), s=diffMinutes(started,ended); if(a!=null)arrival.push(a); if(s!=null)session.push(s);
      var ps=plannedDate(r,'start'), pe=plannedDate(r,'end');
      if(ps&&started&&started.getTime()>ps.getTime()+10*60000)lateStart++;
      if(pe&&ended&&ended.getTime()>pe.getTime()+10*60000)lateEnd++;
    });
    return {count:rows.length,completed:completed,collected:collected,remaining:remaining,avgArrival:avg(arrival),avgSession:avg(session),lateStart:lateStart,lateEnd:lateEnd};
  }
  function vehicleExecutionStatsRows(rows,field,emptyLabel){
    return groupBy(rows,field,emptyLabel).map(function(g){var m=executionMetrics(g.rows);return {name:g.name,count:m.count,completed:m.completed,collected:m.collected,remaining:m.remaining,avgArrival:m.avgArrival,avgSession:m.avgSession,late:m.lateStart+m.lateEnd}}).sort(function(a,b){return b.count-a.count||a.name.localeCompare(b.name,'ar')});
  }
  function vehicleExecutionReportTable(title,icon,rows,totalLabel){
    var totals=rows.reduce(function(a,r){a.count+=r.count;a.completed+=r.completed;a.collected+=r.collected;a.remaining+=r.remaining;a.late+=r.late;return a},{count:0,completed:0,collected:0,remaining:0,late:0});
    var body=rows.length?rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+r.completed+'</td><td>'+money(r.collected)+'</td><td>'+money(r.remaining)+'</td><td>'+fmtMins(r.avgArrival)+'</td><td>'+fmtMins(r.avgSession)+'</td><td>'+r.late+'</td></tr>'}).join(''):'<tr><td colspan="9" class="appointments-empty">'+esc(opT('noOperationsDataForPeriod'))+'</td></tr>';
    return '<div class="appointments-report-table-card vehicle-exec-report-table-card"><div class="appointments-report-title"><span class="appointments-report-icon">'+icon+'</span><div><h4>'+esc(title)+'</h4><p>'+esc(opT('vehicleReportsSourceNote'))+'</p></div></div><div class="appointments-report-table-wrap"><table class="appointments-report-table vehicle-exec-report-table"><thead><tr><th>#</th><th>'+esc(opT('item'))+'</th><th>'+esc(opT('sessions'))+'</th><th>'+esc(opT('completed'))+'</th><th>'+esc(opT('collected'))+'</th><th>'+esc(opT('remaining'))+'</th><th>'+esc(opT('averageArrival'))+'</th><th>'+esc(opT('averageSession'))+'</th><th>'+esc(opT('delayed'))+'</th></tr></thead><tbody>'+body+'</tbody><tfoot><tr><td colspan="2">'+esc(totalLabel||opT('total'))+'</td><td>'+totals.count+'</td><td>'+totals.completed+'</td><td>'+money(totals.collected)+'</td><td>'+money(totals.remaining)+'</td><td>-</td><td>-</td><td>'+totals.late+'</td></tr></tfoot></table></div></div>';
  }
  function renderVehicleExecutionReports(){
    var wrap=byId('vehicleOpsReports'), summary=byId('vehicleOpsReportsSummary');
    if(!wrap&&!summary)return;
    if(!canVehicleOpsAction('reports')){if(summary)summary.textContent='';if(wrap)safeHtml(wrap,vehicleOpsNoAccessHtml(opT('vehicleOperationsReports')),'vehicle reports permission denied');return;}
    renderVehicleReportOptions();
    var rows=vehicleExecutionReportRows(), m=executionMetrics(rows);
    var collectedFull=rows.filter(function(r){return String(r.collectionStatus||'')==='محصل بالكامل'||normalizeStatus(r.status)==='تم التحصيل'}).length;
    var uncollected=rows.filter(function(r){return Number(calcFinancials(r).paidAmount||0)<=0}).length;
    if(summary){if(window.PETATOESafeRender&&window.PETATOESafeRender.clear){window.PETATOESafeRender.clear(summary)}else{summary.textContent=''}
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('totalOperationsSessions'))+'</span><b>'+m.count+'</b><small>'+esc(opT('byPeriodAndVehicle'))+'</small></div>'
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('completed'))+'</span><b>'+m.completed+'</b><small>'+esc(opT('fullyCollected'))+': '+collectedFull+'</small></div>'
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('collection'))+'</span><b>'+money(m.collected)+'</b><small>'+esc(opT('uncollected'))+': '+uncollected+' | '+esc(opT('remaining'))+': '+money(m.remaining)+'</small></div>'
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('averageOperations'))+'</span><b>'+fmtMins(m.avgSession)+'</b><small>'+esc(opT('arrival'))+': '+fmtMins(m.avgArrival)+' | '+esc(opT('delay'))+': '+(m.lateStart+m.lateEnd)+'</small></div>';}
    if(!wrap)return;
    var paymentRows=reportRowsByField(rows,function(r){return r.paymentMethod||'بدون طريقة دفع'},'بدون طريقة دفع').map(function(x){return Object.assign(x,{completed:0,collected:rows.filter(function(r){return (r.paymentMethod||'بدون طريقة دفع')===x.name}).reduce(function(a,r){return a+Number(calcFinancials(r).paidAmount||0)},0),remaining:0,avgArrival:null,avgSession:null,late:0})});
    var paymentTable='<div class="appointments-report-table-card vehicle-exec-report-table-card"><div class="appointments-report-title"><span class="appointments-report-icon">💳</span><div><h4>'+esc(opT('paymentMethodsUsed'))+'</h4><p>'+esc(opT('collectionByPaymentMethod'))+'</p></div></div><div class="appointments-report-table-wrap"><table class="appointments-report-table"><thead><tr><th>#</th><th>'+esc(opT('paymentMethod'))+'</th><th>'+esc(opT('transactionsCount'))+'</th><th>'+esc(opT('percentage'))+'</th><th>'+esc(opT('collected'))+'</th></tr></thead><tbody>'+(paymentRows.length?paymentRows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+r.percent+'%</td><td>'+money(r.collected)+'</td></tr>'}).join(''):'<tr><td colspan="5" class="appointments-empty">'+esc(opT('noPaymentData'))+'</td></tr>')+'</tbody><tfoot><tr><td colspan="2">'+esc(opT('total'))+'</td><td>'+rows.length+'</td><td>100%</td><td>'+money(m.collected)+'</td></tr></tfoot></table></div></div>';
    var delayedRows=rows.filter(function(r){var st=logDate(r,'بدأت الجلسة'), en=logDate(r,'تمت الجلسة')||logDate(r,'تم التحصيل'), ps=plannedDate(r,'start'), pe=plannedDate(r,'end');return (ps&&st&&st.getTime()>ps.getTime()+10*60000)||(pe&&en&&en.getTime()>pe.getTime()+10*60000)});
    var delayedBody=delayedRows.length?delayedRows.map(function(r,i){var st=logDate(r,'بدأت الجلسة'), en=logDate(r,'تمت الجلسة')||logDate(r,'تم التحصيل'), ps=plannedDate(r,'start'), pe=plannedDate(r,'end');var lateS=(ps&&st)?Math.max(0,Math.round((st.getTime()-ps.getTime())/60000)):0;var lateE=(pe&&en)?Math.max(0,Math.round((en.getTime()-pe.getTime())/60000)):0;return '<tr><td>'+(i+1)+'</td><td>'+esc(r.date)+'</td><td>'+esc(r.start||'-')+'</td><td>'+esc(r.client||'-')+'</td><td>'+esc(r.vehicle||'-')+'</td><td>'+esc(r.groomer||'-')+'</td><td>'+fmtMins(lateS)+'</td><td>'+fmtMins(lateE)+'</td></tr>'}).join(''):'<tr><td colspan="8" class="appointments-empty">'+esc(opT('noDelayedAppointments'))+'</td></tr>';
    var delayedTable='<div class="appointments-report-table-card vehicle-exec-report-table-card"><div class="appointments-report-title"><span class="appointments-report-icon">⏱️</span><div><h4>'+esc(opT('delayedAppointments'))+'</h4><p>'+esc(opT('delayThresholdNote'))+'</p></div></div><div class="appointments-report-table-wrap"><table class="appointments-report-table"><thead><tr><th>#</th><th>'+esc(opT('date'))+'</th><th>'+esc(opT('appointmentTime'))+'</th><th>'+esc(opT('customer'))+'</th><th>'+esc(opT('vehicle'))+'</th><th>'+esc(opT('groomer'))+'</th><th>'+esc(opT('startDelay'))+'</th><th>'+esc(opT('endDelay'))+'</th></tr></thead><tbody>'+delayedBody+'</tbody></table></div></div>';
    safeHtml(wrap, vehicleExecutionReportTable(opT('sessionsPerVehicle'),'🚐',vehicleExecutionStatsRows(rows,'vehicle',opT('withoutVehicle')),opT('totalVehicles'))+vehicleExecutionReportTable(opT('sessionsPerDriver'),'🚗',vehicleExecutionStatsRows(rows,'driver',opT('withoutDriver')),opT('totalDrivers'))+vehicleExecutionReportTable(opT('sessionsPerGroomer'),'✂️',vehicleExecutionStatsRows(rows,'groomer',opT('withoutGroomer')),opT('totalGroomers'))+paymentTable+delayedTable, 'operations legacy render');
  }


  /* v6.1.186 — Operations KPI Dashboard */
  function operationsKpiDate(id,fallback){var el=byId(id);if(!el)return fallback||today();if(!el.value)el.value=fallback||today();return el.value}
  function renderOperationsKpiVehicleOptions(){
    var sel=byId('operationsKpiVehicleFilter'); if(!sel) return;
    var old=sel.value||'all';
    var names=vehicleScopeFilterNames(uniqueSorted(read().map(function(r){return r.vehicle||''}).concat(vehicleNames()).filter(Boolean)));
    if(old&&old!=='all'&&names.indexOf(old)===-1){old='all';sel.value='all'}
    safeHtml(sel, '<option value="all">'+esc(opT('allAuthorizedVehicles'))+'</option>'+names.map(function(x){return '<option value="'+esc(x)+'" '+(x===old?'selected':'')+'>'+esc(x)+'</option>'}).join(''), 'operations vehicle scope kpi render');
  }
  function operationsKpiRows(){
    var from=operationsKpiDate('operationsKpiFrom',today()), to=operationsKpiDate('operationsKpiTo',from), car=val('operationsKpiVehicleFilter')||'all';
    if(to<from){var tmp=from;from=to;to=tmp;setVal('operationsKpiFrom',from);setVal('operationsKpiTo',to)}
    return vehicleScopeFilterRows(read().map(function(r){return calcFinancials(r)})).filter(function(r){var d=String(r.date||'');return d>=from&&d<=to&&(!car||car==='all'||String(r.vehicle||'')===String(car));}).sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))||String(a.start||'').localeCompare(String(b.start||''))});
  }
  function historyCountByAction(row,actions){
    if(window.PETATOEOperationsHistoryInternal&&typeof window.PETATOEOperationsHistoryInternal.countByAction==='function'&&!historyCountByAction._opsDelegating){
      historyCountByAction._opsDelegating=true;
      try{return window.PETATOEOperationsHistoryInternal.countByAction(row,actions)}finally{historyCountByAction._opsDelegating=false}
    }
    actions=actions||[];var h=Array.isArray(row.sessionHistory)?row.sessionHistory:[];
    return h.filter(function(x){return actions.indexOf(String(x.action||''))>-1 || actions.indexOf(String(x.actionLabel||''))>-1;}).length;
  }
  function historyHas(row,actions){
    if(window.PETATOEOperationsHistoryInternal&&typeof window.PETATOEOperationsHistoryInternal.hasAction==='function'&&!historyHas._opsDelegating){
      historyHas._opsDelegating=true;
      try{return window.PETATOEOperationsHistoryInternal.hasAction(row,actions)}finally{historyHas._opsDelegating=false}
    }
    return historyCountByAction(row,actions)>0
  }
  function pct(part,total){total=Number(total||0);return total?Math.round((Number(part||0)/total)*100):0}
  function kpiCard(icon,title,value,sub,cls){return '<div class="operation-kpi-card-mini '+(cls||'')+'"><span>'+esc(icon)+'</span><b>'+esc(value)+'</b><small>'+esc(title)+'</small>'+(sub?'<em>'+esc(sub)+'</em>':'')+'</div>'}
  function operationsKpiStats(rows){
    var m=executionMetrics(rows), total=rows.length;
    var completed=countAnyStatus(rows,['تمت الجلسة','تم التحصيل','مغلق','مؤكد']);
    var closed=countAnyStatus(rows,['مغلق','مؤكد','غير مكتملة']);
    var confirmed=countAnyStatus(rows,['مؤكد']);
    var incomplete=countAnyStatus(rows,['غير مكتملة']);
    var cancelled=countAnyStatus(rows,['ملغي']);
    var reopened=rows.filter(function(r){return historyHas(r,['reopen','إعادة فتح الجلسة'])}).length;
    var backMoves=rows.reduce(function(a,r){return a+historyCountByAction(r,['rollback','تراجع حالة الطلب'])},0);
    var collectedRows=rows.filter(function(r){return Number(calcFinancials(r).paidAmount||0)>0});
    var unpaid=rows.filter(function(r){return Number(calcFinancials(r).paidAmount||0)<=0});
    return {total:total,metrics:m,completed:completed,closed:closed,confirmed:confirmed,incomplete:incomplete,cancelled:cancelled,reopened:reopened,backMoves:backMoves,collectedRows:collectedRows.length,unpaid:unpaid.length,collected:m.collected,remaining:m.remaining,late:m.lateStart+m.lateEnd};
  }
  function operationKpiPerformanceRows(rows,field,emptyLabel){
    return groupBy(rows,field,emptyLabel).map(function(g){var s=operationsKpiStats(g.rows), m=s.metrics;return {name:g.name,count:s.total,completed:s.completed,confirmed:s.confirmed,incomplete:s.incomplete,success:pct(s.completed,s.total),late:s.late,reopened:s.reopened,avgArrival:m.avgArrival,avgSession:m.avgSession,collected:m.collected,remaining:m.remaining};}).sort(function(a,b){return b.count-a.count||a.name.localeCompare(b.name,'ar')});
  }
  function operationKpiTable(title,icon,rows){
    var body=rows.length?rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+r.count+'</td><td>'+r.completed+'</td><td>'+r.confirmed+'</td><td>'+r.incomplete+'</td><td>'+r.success+'%</td><td>'+fmtMins(r.avgArrival)+'</td><td>'+fmtMins(r.avgSession)+'</td><td>'+r.late+'</td><td>'+r.reopened+'</td><td>'+money(r.collected)+'</td><td>'+money(r.remaining)+'</td></tr>'}).join(''):'<tr><td colspan="13" class="appointments-empty">'+esc(opT('insufficientDataForPeriod'))+'</td></tr>';
    return '<div class="appointments-report-table-card operation-kpi-table-card"><div class="appointments-report-title"><span class="appointments-report-icon">'+icon+'</span><div><h4>'+esc(title)+'</h4><p>'+esc(opT('operationsKpiSourceNote'))+'</p></div></div><div class="appointments-report-table-wrap"><table class="appointments-report-table operation-kpi-table"><thead><tr><th>#</th><th>'+esc(opT('item'))+'</th><th>'+esc(opT('sessions'))+'</th><th>'+esc(opT('completed'))+'</th><th>'+esc(opT('confirmed'))+'</th><th>'+esc(opT('incomplete'))+'</th><th>'+esc(opT('completionRate'))+'</th><th>'+esc(opT('averageArrival'))+'</th><th>'+esc(opT('averageSession'))+'</th><th>'+esc(opT('delay'))+'</th><th>'+esc(opT('reopened'))+'</th><th>'+esc(opT('collected'))+'</th><th>'+esc(opT('remaining'))+'</th></tr></thead><tbody>'+body+'</tbody></table></div></div>';
  }
  function renderOperationsKpiDashboard(){
    var wrap=byId('operationsKpiDashboard'), summary=byId('operationsKpiSummary');
    if(!wrap&&!summary)return;
    if(!canVehicleOpsAction('kpis')){if(summary)summary.textContent='';if(wrap)safeHtml(wrap,vehicleOpsNoAccessHtml(opT('vehicleOperationsKpis')),'vehicle kpi permission denied');return;}
    renderOperationsKpiVehicleOptions();
    var rows=operationsKpiRows(), s=operationsKpiStats(rows), m=s.metrics;
    if(summary){if(window.PETATOESafeRender&&window.PETATOESafeRender.clear){window.PETATOESafeRender.clear(summary)}else{summary.textContent=''}
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('totalSessions'))+'</span><b>'+s.total+'</b><small>'+esc(opT('selectedPeriod'))+'</small></div>'
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('completedClosed'))+'</span><b>'+s.completed+'</b><small>'+esc(opT('closed'))+': '+s.closed+' | '+esc(opT('confirmed'))+': '+s.confirmed+'</small></div>'
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('operationsQuality'))+'</span><b>'+pct(s.completed,s.total)+'%</b><small>'+esc(opT('delay'))+': '+s.late+' | '+esc(opT('reopened'))+': '+s.reopened+'</small></div>'
      +'<div class="appointments-dispatch-summary-card"><span>'+esc(opT('collection'))+'</span><b>'+money(s.collected)+'</b><small>'+esc(opT('uncollected'))+': '+s.unpaid+' | '+esc(opT('remaining'))+': '+money(s.remaining)+'</small></div>';}
    if(!wrap)return;
    var paymentRows=reportRowsByField(rows,function(r){return r.paymentMethod||'بدون طريقة دفع'},'بدون طريقة دفع');
    var payHtml='<div class="operation-kpi-payment-grid">'+(paymentRows.length?paymentRows.map(function(r){var amount=rows.filter(function(x){return (x.paymentMethod||'بدون طريقة دفع')===r.name}).reduce(function(a,x){return a+Number(calcFinancials(x).paidAmount||0)},0);return '<div class="operation-kpi-pay-card"><b>'+esc(r.name)+'</b><span>'+r.count+' عملية</span><strong>'+money(amount)+'</strong><small>'+r.percent+'%</small></div>'}).join(''):'<div class="appointments-empty">'+esc(opT('noPaymentData'))+'</div>')+'</div>';
    var topCards=''
      +kpiCard('📅',opT('todayPeriodSessions'),s.total,opT('byFilters'),'')
      +kpiCard('✅',opT('completed'),s.completed,pct(s.completed,s.total)+'% '+opT('ofTotal'),'ok')
      +kpiCard('🔒',opT('closed'),s.closed,opT('confirmed')+': '+s.confirmed,'')
      +kpiCard('⚠️',opT('incomplete'),s.incomplete,opT('needsFollowUp'),'warn')
      +kpiCard('↩️',opT('reopened'),s.reopened,opT('statusRollbacks')+': '+s.backMoves,'warn')
      +kpiCard('⏱️',opT('averageArrival'),fmtMins(m.avgArrival),opT('delay')+': '+s.late,'')
      +kpiCard('✂️',opT('averageSessionDuration'),fmtMins(m.avgSession),opT('sessionStartToEnd'),'')
      +kpiCard('💳',opT('collectedTransactions'),s.collectedRows,opT('uncollected')+': '+s.unpaid,'ok');
    safeHtml(wrap,'<div class="operation-kpi-grid">'+topCards+'</div>'
      +'<div class="operation-kpi-two-col"><div class="operation-kpi-panel"><h4>💳 '+esc(opT('paymentMethodDistribution'))+'</h4>'+payHtml+'</div><div class="operation-kpi-panel"><h4>📊 '+esc(opT('qualityIndicators'))+'</h4><div class="operation-kpi-quality"><p><span>'+esc(opT('delayRate'))+'</span><b>'+pct(s.late,s.total)+'%</b></p><p><span>'+esc(opT('reopenRate'))+'</span><b>'+pct(s.reopened,s.total)+'%</b></p><p><span>'+esc(opT('incompleteRate'))+'</span><b>'+pct(s.incomplete,s.total)+'%</b></p><p><span>'+esc(opT('confirmationRate'))+'</span><b>'+pct(s.confirmed,s.total)+'%</b></p></div></div></div>'
      +operationKpiTable(opT('vehiclePerformance'),'🚐',operationKpiPerformanceRows(rows,'vehicle',opT('withoutVehicle')))
      +operationKpiTable(opT('driverPerformance'),'🚗',operationKpiPerformanceRows(rows,'driver',opT('withoutDriver')))
      +operationKpiTable(opT('groomerPerformance'),'✂️',operationKpiPerformanceRows(rows,'groomer',opT('withoutGroomer'))),'operations kpi render');
  }


  function activeTopPanel(){var el=document.querySelector('.panel.active');return el?String(el.id||''):''}
  function activeAppointmentSection(){var el=document.querySelector('#appointments [data-appointment-section].active');return el?String(el.getAttribute('data-appointment-section')||currentTab||'add'):(currentTab||'add')}
  function renderAppointmentsShell(){renderDynamicFilters();applyQuickActive();renderKpis();renderClientSuggestions();refreshPetSuggestions()}
  function renderAppointmentsCurrent(){
    if(!byId('appointments'))return;
    refreshMasterDrivenSelects();
    renderAppointmentsShell();
    var tab=activeAppointmentSection();
    if(tab==='calendar')renderCalendar();
    else if(tab==='dispatch')renderDispatch();
    else if(tab==='dailyOps')renderDailyOperations();
    else if(tab==='timeline')renderTodayTimeline();
    else if(tab==='alerts')renderAlerts();
    else if(tab==='log')renderTable();
    else if(tab==='customers')renderCustomersPets();
    else if(tab==='master')renderMasterData();
    else if(tab==='reports')renderReports();
  }
  function renderForPanel(panel){
    panel=panel||activeTopPanel();
    if(panel==='appointments')return renderAppointmentsCurrent();
    if(panel==='vehicleOperations')return renderVehicleOperations();
    if(panel==='vehicleOperationsReports')return renderVehicleExecutionReports();
    if(panel==='operationKpis')return renderOperationsKpiDashboard();
  }
  function render(){renderForPanel(activeTopPanel()||'appointments')}
  function resetFilters(){['appointmentSearch','appointmentDateFromFilter','appointmentDateToFilter'].forEach(function(id){setVal(id,'')});['appointmentStatusFilter','appointmentAnimalFilter','appointmentGroomerFilter','appointmentDriverFilter','appointmentVehicleFilter','appointmentPaymentFilter'].forEach(function(id){setVal(id,'all')});quickRange='all';render()}
  function initBase(){if(!byId('appointmentDate'))return false; refreshLookupSelects(); if(!byId('appointmentCustomerId')){var hid=document.createElement('input');hid.type='hidden';hid.id='appointmentCustomerId';var formId=byId('appointmentId');if(formId&&formId.parentNode)formId.parentNode.insertBefore(hid,formId.nextSibling)} if(!val('appointmentDate'))setVal('appointmentDate',today()); if(byId('appointmentAnimalsRows')&&!byId('appointmentAnimalsRows').querySelector('.appointment-animal-row'))renderAppointmentAnimalsRows([{}]); if(byId('appointmentServicesRows')&&!byId('appointmentServicesRows').querySelector('.appointment-service-row'))renderAppointmentServicesRows([{}]); if(byId('appointmentCalendarDate')&&!val('appointmentCalendarDate'))setVal('appointmentCalendarDate',today()); if(byId('appointmentDispatchDate')&&!val('appointmentDispatchDate'))setVal('appointmentDispatchDate',today()); if(byId('appointmentDailyOpsDate')&&!val('appointmentDailyOpsDate'))setVal('appointmentDailyOpsDate',today()); if(byId('vehicleOpsDate')&&!val('vehicleOpsDate'))setVal('vehicleOpsDate',today()); if(byId('vehicleOpsReportFrom')&&!val('vehicleOpsReportFrom'))setVal('vehicleOpsReportFrom',today()); if(byId('vehicleOpsReportTo')&&!val('vehicleOpsReportTo'))setVal('vehicleOpsReportTo',today()); if(byId('operationsKpiFrom')&&!val('operationsKpiFrom'))setVal('operationsKpiFrom',today()); if(byId('operationsKpiTo')&&!val('operationsKpiTo'))setVal('operationsKpiTo',today()); return true;}
  function init(panel){if(!initBase())return; renderForPanel(panel||activeTopPanel()||'appointments');}
  document.addEventListener('DOMContentLoaded',function(){init(activeTopPanel()||'appointments')});
  document.addEventListener('petatoe:tabchange',function(e){
    var d=e&&e.detail||{}, tab=d.tabId||'';
    if(tab==='appointments'){
      // PETATOE v6.4.91: direct sidebar entry for إدارة المواعيد must always
      // return to the normal appointments dashboard, not keep the previous master tab.
      // Master data sidebar entry still switches to master after this event via navigation.js.
      setTab('add');
      return;
    }
    if(tab==='vehicleOperations'||tab==='vehicleOperationsReports'||tab==='operationKpis'){
      clearTimeout(init._t);init._t=setTimeout(function(){init(tab)},30);
    }
  });
  window.PETATOEOperationsVehiclesInternal={
    version:'OPS-19-vehicles-actions-boundary',
    vehicleAdapter:{
      read:read,
      write:write,
      vehicleOpsDate:vehicleOpsDate,
      vehicleOpsRows:vehicleOpsRows,
      renderVehicleOptions:renderVehicleOptions,
      renderVehicleOperations:renderVehicleOperations,
      updateVehicleRow:updateVehicleRow,
      vehicleOpsSelectNextAfter:vehicleOpsSelectNextAfter,
      validateVehicleCollection:validateVehicleCollection,
      validateVehicleStatusTransition:validateVehicleStatusTransition,
      pushExecutionLog:pushExecutionLog,
      normalizeStatus:normalizeStatus,
      calcFinancials:calcFinancials,
      render:render,
      toast:toast,
      vehicleOpsRows:vehicleOpsRows,
      vehicleOpsIsLocked:vehicleOpsIsLocked,
      canVehicleOpsAction:canVehicleOpsAction,
      vehicleOpsSelectNextAfter:vehicleOpsSelectNextAfter,
      renderVehicleOperations:renderVehicleOperations,
      render:render,
      val:val,
      byId:byId
    },
    vehicleActionsAdapter:{
      selectVehicleAppointment:selectVehicleAppointment,
      setVehicleOpsViewTab:setVehicleOpsViewTab,
      saveVehicleSessionById:saveVehicleSessionById,
      saveVehicleSessionByIndex:saveVehicleSessionByIndex,
      closeVehicleSessionById:closeVehicleSessionById,
      reopenVehicleSessionById:reopenVehicleSessionById,
      confirmVehicleSessionById:confirmVehicleSessionById,
      vehicleOpsCanClose:vehicleOpsCanClose,
      vehicleOpsCanReopen:vehicleOpsCanReopen,
      vehicleOpsCanConfirm:vehicleOpsCanConfirm,
      vehicleOpsIsClosed:vehicleOpsIsClosed,
      vehicleOpsIsLocked:vehicleOpsIsLocked,
      vehicleOpsPickSelected:vehicleOpsPickSelected,
      vehicleOpsSelectNextAfter:vehicleOpsSelectNextAfter,
      updateVehicleRow:updateVehicleRow,
      toast:toast,
      upsertMasterCustomer:upsertMasterCustomer,
      customerKey:customerKey
    },
    vehicleRenderAdapter:{
      renderVehicleOperations:renderVehicleOperations,
      renderVehicleOptions:renderVehicleOptions,
      renderSessionHistory:renderSessionHistory,
      renderVehicleSessionDetailsTable:renderVehicleSessionDetailsTable,
      renderVehiclePaymentPanel:renderVehiclePaymentPanel,
      renderVehicleFinalSummary:renderVehicleFinalSummary,
      renderVehicleOperationalStage:renderVehicleOperationalStage,
      renderVehicleStageContent:renderVehicleStageContent,
      vehicleStatusButtons:vehicleStatusButtons,
      vehicleProgressBar:vehicleProgressBar,
      vehiclePaymentOptions:vehiclePaymentOptions,
      vehicleOpsPaymentAttachmentLabel:vehicleOpsPaymentAttachmentLabel,
      vehicleOpsElapsed:vehicleOpsElapsed,
      vehicleOpsRemaining:vehicleOpsRemaining,
      vehicleDetailsCell:vehicleDetailsCell
    },
    setVehicleOpsDateToday:setVehicleOpsDateToday,
    renderVehicleOperations:renderVehicleOperations,
    setVehicleOpsViewTab:setVehicleOpsViewTab,
    selectVehicleAppointment:selectVehicleAppointment,
    saveVehicleSessionById:saveVehicleSessionById,
    saveVehicleSessionByIndex:saveVehicleSessionByIndex,
    closeVehicleSessionById:closeVehicleSessionById,
    reopenVehicleSessionById:reopenVehicleSessionById,
    confirmVehicleSessionById:confirmVehicleSessionById
  };

  window.PETATOEOperationsPaymentsInternal={
    version:'OPS-24-payments-actions-extraction',
    paymentAdapter:{
      handlePaymentAttachment:handlePaymentAttachment,
      validateVehicleCollection:validateVehicleCollection,
      vehicleOpsInputPaid:vehicleOpsInputPaid,
      vehicleOpsInputPayment:vehicleOpsInputPayment,
      vehicleOpsPaymentAttachmentLabel:vehicleOpsPaymentAttachmentLabel,
      vehiclePaymentOptions:vehiclePaymentOptions,
      renderVehiclePaymentPanel:renderVehiclePaymentPanel,
      renderVehicleFinalSummary:renderVehicleFinalSummary,
      calcFinancials:calcFinancials,
      updateVehicleRow:updateVehicleRow,
      pushExecutionLog:pushExecutionLog,
      normalizeStatus:normalizeStatus,
      currentUserId:currentUserId,
      toast:toast,
      upsertMasterCustomer:upsertMasterCustomer,
      customerKey:customerKey
    },
    handlePaymentAttachment:handlePaymentAttachment,
    validateVehicleCollection:validateVehicleCollection,
    vehicleOpsInputPaid:vehicleOpsInputPaid,
    vehicleOpsInputPayment:vehicleOpsInputPayment,
    vehicleOpsPaymentAttachmentLabel:vehicleOpsPaymentAttachmentLabel,
    vehiclePaymentOptions:vehiclePaymentOptions,
    renderVehiclePaymentPanel:renderVehiclePaymentPanel,
    renderVehicleFinalSummary:renderVehicleFinalSummary
  };

  window.PETATOEOperationsReportsInternal={
    version:'OPS-16-reports-render-extraction',
    reportAdapter:{
      renderVehicleExecutionReports:renderVehicleExecutionReports,
      renderOperationsKpiDashboard:renderOperationsKpiDashboard,
      printDailyOperations:printDailyOperations,
      renderDailyOperations:renderDailyOperations,
      dailyOpsDate:dailyOpsDate,
      setDailyOpsDateToday:setDailyOpsDateToday,
      dailyOpsRows:dailyOpsRows,
      vehicleExecutionReportRows:vehicleExecutionReportRows,
      vehicleExecutionStatsRows:vehicleExecutionStatsRows,
      vehicleExecutionReportTable:vehicleExecutionReportTable,
      executionMetrics:executionMetrics,
      operationsKpiDate:operationsKpiDate,
      renderOperationsKpiVehicleOptions:renderOperationsKpiVehicleOptions,
      operationsKpiRows:operationsKpiRows,
      operationsKpiStats:operationsKpiStats,
      operationKpiPerformanceRows:operationKpiPerformanceRows,
      operationKpiTable:operationKpiTable,
      reportRowsByField:reportRowsByField,
      groupBy:groupBy,
      countStatus:countStatus,
      countAnyStatus:countAnyStatus,
      calcFinancials:calcFinancials,
      normalizeStatus:normalizeStatus,
      money:money,
      esc:esc,
      val:val,
      setVal:setVal,
      byId:byId,
      today:today,
      vehicleNames:vehicleNames,
      uniqueSorted:uniqueSorted,
      fmtMins:fmtMins,
      plannedDate:plannedDate,
      statusFirstAt:(typeof statusFirstAt==='function'?statusFirstAt:logDate),
      read:read,
      toast:toast,
      upsertMasterCustomer:upsertMasterCustomer,
      customerKey:customerKey
    },
    renderVehicleExecutionReports:renderVehicleExecutionReports,
    renderOperationsKpiDashboard:renderOperationsKpiDashboard,
    printDailyOperations:printDailyOperations,
    renderDailyOperations:renderDailyOperations,
    dailyOpsRows:dailyOpsRows,
    operationsKpiRows:operationsKpiRows
  };
  window.PETATOEOperationsStatusInternal={
    version:'OPS-21-status-actions-extraction',
    statusAdapter:{
      normalizeStatus:normalizeStatus,
      nextStatus:nextStatus,
      statusClass:statusClass,
      statusOptionsHtml:statusOptionsHtml,
      statusSelectHtml:statusSelectHtml,
      vehicleWorkflowIndex:vehicleWorkflowIndex,
      validateVehicleStatusTransition:validateVehicleStatusTransition,
      requireBackwardReason:requireBackwardReason,
      vehicleOpsIsConfirmed:vehicleOpsIsConfirmed,
      vehicleOpsIsLocked:vehicleOpsIsLocked,
      vehicleOpsCanClose:vehicleOpsCanClose,
      vehicleOpsCanReopen:vehicleOpsCanReopen,
      vehicleOpsCanConfirm:vehicleOpsCanConfirm,
      setVehicleStatusById:setVehicleStatusById,
      setVehicleStatusByIndex:setVehicleStatusByIndex,
      nextVehicleStatusById:nextVehicleStatusById,
      nextVehicleStatusByIndex:nextVehicleStatusByIndex,
      vehicleStageTime:vehicleStageTime,
      vehicleStageDone:vehicleStageDone,
      vehicleStatusButtons:vehicleStatusButtons,
      vehicleProgressBar:vehicleProgressBar,
      renderSessionHistory:renderSessionHistory
    },
    setVehicleStatusById:setVehicleStatusById,
    setVehicleStatusByIndex:setVehicleStatusByIndex,
    nextVehicleStatusById:nextVehicleStatusById,
    nextVehicleStatusByIndex:nextVehicleStatusByIndex
  };
  try{
    if(!window.__PETATOE_OPERATIONS_MASTER_STORAGE_LISTENER__){
      window.__PETATOE_OPERATIONS_MASTER_STORAGE_LISTENER__=true;
      window.addEventListener('petatoe:operations-storage-change', function(ev){
        var t=ev&&ev.detail&&ev.detail.type;
        if(t==='masterData'||t==='boot'||t==='all'){
          try{refreshMasterDrivenSelects();refreshLookupSelects();renderMasterData();}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('operations-legacy-engine storage refresh',e);}
        }
      });
    }
  }catch(e){}

  var appointmentsPublicApi={setTab:setTab,clearForm:clearForm,saveAppointment:saveAppointment,render:render,edit:edit,remove:remove,changeStatus:changeStatus,resetFilters:resetFilters,setQuickRange:setQuickRange,setCalendarView:setCalendarView,setFinanceReportFilter:setFinanceReportFilter,resetFinanceReportFilters:resetFinanceReportFilters,showMoreFinanceReportRows:showMoreFinanceReportRows,setAppointmentLocalReportFilter:setAppointmentLocalReportFilter,resetAppointmentLocalReportFilters:resetAppointmentLocalReportFilters,showMoreAppointmentLocalReportRows:showMoreAppointmentLocalReportRows,applyCustomerSuggestion:applyCustomerSuggestion,refreshPetSuggestions:refreshPetSuggestions,applyPetSuggestion:applyPetSuggestion,newCustomer:newCustomer,refreshBreedOptions:refreshBreedOptions,addMasterItem:addMasterItem,addBreed:addBreed,removeMasterItem:removeMasterItem,editMasterItem:editMasterItem,resetMasterData:resetMasterData,setMasterSection:setMasterSection,selectCustomerProfile:selectCustomerProfile,setCustomerSearch:setCustomerSearch,clearCustomerSearch:clearCustomerSearch,refreshCustomersCrm:refreshCustomersCrm,exportCustomersDatabaseReportExcel:exportCustomersDatabaseReportExcel,setCustomerDatabaseReportSearch:setCustomerDatabaseReportSearch,addMasterCustomer:addMasterCustomer,editMasterCustomer:editMasterCustomer,removeMasterCustomer:removeMasterCustomer,triggerMasterCustomersExcelImport:triggerMasterCustomersExcelImport,handleMasterCustomersExcelImport:handleMasterCustomersExcelImport,exportMasterCustomersExcel:exportMasterCustomersExcel,addMasterService:addMasterService,triggerMasterServicesExcelImport:triggerMasterServicesExcelImport,handleMasterServicesExcelImport:handleMasterServicesExcelImport,exportMasterServicesExcel:exportMasterServicesExcel,addAppointmentServiceRow:addAppointmentServiceRow,removeAppointmentServiceRow:removeAppointmentServiceRow,onAppointmentServiceChange:onAppointmentServiceChange,recalculateAppointmentServices:recalculateAppointmentServices,addAppointmentAnimalRow:addAppointmentAnimalRow,removeAppointmentAnimalRow:removeAppointmentAnimalRow,onAppointmentAnimalTypeChange:onAppointmentAnimalTypeChange,addOperationsVehicle:addOperationsVehicle,addOperationsDriver:addOperationsDriver,addOperationsGroomer:addOperationsGroomer,removeOperationsVehicle:removeOperationsVehicle,removeOperationsDriver:removeOperationsDriver,removeOperationsGroomer:removeOperationsGroomer,saveVehicleAssignment:saveVehicleAssignment,editVehicleAssignment:editVehicleAssignment,toggleVehicleAssignment:toggleVehicleAssignment,removeVehicleAssignment:removeVehicleAssignment,applyVehicleStaffAssignment:applyVehicleStaffAssignment,setDispatchDateToday:setDispatchDateToday,setDailyOpsDateToday:setDailyOpsDateToday,printDailyOperations:printDailyOperations,setVehicleOpsDateToday:setVehicleOpsDateToday,renderVehicleOperations:renderVehicleOperations,renderVehicleExecutionReports:renderVehicleExecutionReports,renderOperationsKpiDashboard:renderOperationsKpiDashboard,setVehicleOpsViewTab:setVehicleOpsViewTab,selectVehicleAppointment:selectVehicleAppointment,setVehicleStatusById:setVehicleStatusById,setVehicleStatusByIndex:setVehicleStatusByIndex,nextVehicleStatusById:nextVehicleStatusById,nextVehicleStatusByIndex:nextVehicleStatusByIndex,saveVehicleSessionById:saveVehicleSessionById,saveVehicleSessionByIndex:saveVehicleSessionByIndex,closeVehicleSessionById:closeVehicleSessionById,reopenVehicleSessionById:reopenVehicleSessionById,confirmVehicleSessionById:confirmVehicleSessionById,canVehicleOpsAction:canVehicleOpsAction,handlePaymentAttachment:handlePaymentAttachment,openVehicleDirectionById:openVehicleDirectionById,showAppointmentDetails:showAppointmentDetails,closeAppointmentDetails:closeAppointmentDetails};
  window.PETATOEOperationsAppointmentsInternal={
    version:'OPS-15-appointments-actions-adapter',
    actionsAdapter:{
      collect:collect,
      read:read,
      write:write,
      findCustomerProfile:findCustomerProfile,
      findConflicts:findConflicts,
      pushExecutionLog:pushExecutionLog,
      summarizeAppointmentChanges:summarizeAppointmentChanges,
      normalizeStatus:normalizeStatus,
      clearForm:clearForm,
      setTab:setTab,
      render:render,
      fill:fill,
      selectCustomerProfile:selectCustomerProfile,
      toast:toast,
      upsertMasterCustomer:upsertMasterCustomer,
      customerKey:customerKey
    },
    renderAdapter:{
      render:render,
      renderAppointmentsCurrent:renderAppointmentsCurrent,
      renderTable:renderTable,
      renderKpis:renderKpis,
      renderDynamicFilters:renderDynamicFilters,
      renderCalendar:renderCalendar,
      renderDispatch:renderDispatch,
      renderTodayTimeline:renderTodayTimeline,
      renderAlerts:renderAlerts,
      renderDailyOperations:renderDailyOperations,
      renderReports:renderReports,
      renderMasterData:renderMasterData,
      renderCustomersPets:renderCustomersPets
    },
    setTab:setTab,
    clearForm:clearForm,
    saveAppointment:saveAppointment,
    render:render,
    edit:edit,
    remove:remove,
    changeStatus:changeStatus,
    resetFilters:resetFilters,
    setQuickRange:setQuickRange,
    setCalendarView:setCalendarView,
    setFinanceReportFilter:setFinanceReportFilter,
    resetFinanceReportFilters:resetFinanceReportFilters,
    showMoreFinanceReportRows:showMoreFinanceReportRows,
    setAppointmentLocalReportFilter:setAppointmentLocalReportFilter,
    resetAppointmentLocalReportFilters:resetAppointmentLocalReportFilters,
    showMoreAppointmentLocalReportRows:showMoreAppointmentLocalReportRows,
    applyCustomerSuggestion:applyCustomerSuggestion,
    refreshPetSuggestions:refreshPetSuggestions,
    applyPetSuggestion:applyPetSuggestion,
    newCustomer:newCustomer,
    refreshBreedOptions:refreshBreedOptions,
    addMasterItem:addMasterItem,
    addBreed:addBreed,
    removeMasterItem:removeMasterItem,
    editMasterItem:editMasterItem,
    resetMasterData:resetMasterData,
    setMasterSection:setMasterSection,
    selectCustomerProfile:selectCustomerProfile,
    setCustomerSearch:setCustomerSearch,
    clearCustomerSearch:clearCustomerSearch,
    refreshCustomersCrm:refreshCustomersCrm,
    exportCustomersDatabaseReportExcel:exportCustomersDatabaseReportExcel,
    addMasterCustomer:addMasterCustomer,
    editMasterCustomer:editMasterCustomer,
    removeMasterCustomer:removeMasterCustomer,
    triggerMasterCustomersExcelImport:triggerMasterCustomersExcelImport,
    handleMasterCustomersExcelImport:handleMasterCustomersExcelImport,
    exportMasterCustomersExcel:exportMasterCustomersExcel,
    addMasterService:addMasterService,
    triggerMasterServicesExcelImport:triggerMasterServicesExcelImport,
    handleMasterServicesExcelImport:handleMasterServicesExcelImport,
    exportMasterServicesExcel:exportMasterServicesExcel,
    addAppointmentServiceRow:addAppointmentServiceRow,
    removeAppointmentServiceRow:removeAppointmentServiceRow,
    onAppointmentServiceChange:onAppointmentServiceChange,
    recalculateAppointmentServices:recalculateAppointmentServices,
    addAppointmentAnimalRow:addAppointmentAnimalRow,
    removeAppointmentAnimalRow:removeAppointmentAnimalRow,
    onAppointmentAnimalTypeChange:onAppointmentAnimalTypeChange,
    addOperationsVehicle:addOperationsVehicle,
    addOperationsDriver:addOperationsDriver,
    addOperationsGroomer:addOperationsGroomer,
    removeOperationsVehicle:removeOperationsVehicle,
    removeOperationsDriver:removeOperationsDriver,
    removeOperationsGroomer:removeOperationsGroomer,
    saveVehicleAssignment:saveVehicleAssignment,
    removeVehicleAssignment:removeVehicleAssignment,
    applyVehicleStaffAssignment:applyVehicleStaffAssignment,
    setDispatchDateToday:setDispatchDateToday,
    setDailyOpsDateToday:setDailyOpsDateToday,
    printDailyOperations:printDailyOperations,
    openVehicleDirectionById:openVehicleDirectionById,
    showAppointmentDetails:showAppointmentDetails,
    closeAppointmentDetails:closeAppointmentDetails
  };
  if(!window.__PETATOE_APPOINTMENT_REFERENCE_REFRESH_BOUND__){
    window.__PETATOE_APPOINTMENT_REFERENCE_REFRESH_BOUND__=true;
    window.addEventListener('petatoe:payroll-read-facade-refreshed',function(){try{if(currentTab==='master'&&appointmentMasterSectionValue()==='vehicleStaff')renderMasterData();}catch(_e){} });
    document.addEventListener('petatoe:reference-registry-updated',function(){try{if(currentTab==='master'&&appointmentMasterSectionValue()==='vehicleStaff')renderMasterData();}catch(_e){} });
  }
  window.__PETATOEAppointmentsLegacyEngine=appointmentsPublicApi;
  window.PETATOEAppointments=appointmentsPublicApi;
})();
