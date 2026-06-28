/* PETATOE v3.8.154 - Real Backup Split
   Backup/restore logic is separated from settings.js.
   Keeps old global button handlers for compatibility with the current UI. */
(function(){
  'use strict';
  var VERSION='3.8.155';
  // PETATOE v6.1.81 Phase 5-E: keep Restore bounded and predictable.
  var MAX_BACKUP_JSON_LENGTH=60*1024*1024;
  var MAX_RAW_VALUE_LENGTH=25*1024*1024;
  var USERS_KEY='petatoe_users_v108', ROLES_KEY='petatoe_roles_v108', SEC_KEY='petatoe_security_v110', SYSTEM_KEY='petatoe_system_settings_v110', AUDIT_KEY='petatoe_logs_v2';
  var PAYROLL_MANIFEST=[
    {name:'payrollEmployees',label:'Payroll Employees',fallback:[]},
    {name:'payrollSlips',label:'Payroll Slips',fallback:[]},
    {name:'payrollJobTypes',label:'Payroll Job Types',fallback:[]},
    {name:'payrollEmployeeConfig',label:'Payroll Employee Config',fallback:{}},
    {name:'payrollCommissionSnapshots',label:'Payroll Commission Snapshots',fallback:{}}
  ];

  function api(){return window.__PETATOE_SETTINGS_API__||{};}
  function byId(id){var a=api();return a.byId?a.byId(id):document.getElementById(id);}
  function read(k,d){var a=api();if(a.read)return a.read(k,d);var S=window.PETATOEStorage;return S&&S.readJSON?S.readJSON(k,d):d}
  function write(k,v){var a=api();if(a.write)return a.write(k,v);var S=window.PETATOEStorage;if(S&&S.writeJSON)S.writeJSON(k,v)}
  function toast(msg){var a=api();if(a.toast)return a.toast(msg);try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function audit(action,details,level){var a=api();if(a.audit)return a.audit(action,details,level);var arr=read(AUDIT_KEY,[]);arr.unshift({time:new Date().toISOString(),action:action,details:details||'',level:level||'info'});write(AUDIT_KEY,arr.slice(0,700));}
  function records(){var a=api();if(a.records)return a.records();try{var fb=(window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync)?window.PETATOEDataSource.getRecordsSync():[];return Array.isArray(fb)?fb:[]}catch(e){return []}}
  function users(){var a=api();return a.users?a.users():read(USERS_KEY,[])}
  function saveUsers(v){var a=api();if(a.saveUsers)return a.saveUsers(v);write(USERS_KEY,v)}
  function roles(){var a=api();return a.roles?a.roles():read(ROLES_KEY,{})}
  function saveRoles(v){var a=api();if(a.saveRoles)return a.saveRoles(v);write(ROLES_KEY,v)}
  function system(){var a=api();return a.system?a.system():read(SYSTEM_KEY,{})}
  function saveSystem(v){var a=api();if(a.saveSystem)return a.saveSystem(v);write(SYSTEM_KEY,v)}
  function security(){var a=api();return a.security?a.security():read(SEC_KEY,{})}
  function saveSecurity(v){var a=api();if(a.saveSecurity)return a.saveSecurity(v);write(SEC_KEY,v)}
  function render(main,sub){var a=api();if(a.render)return a.render(main,sub);}
  function snapshot(){var S=window.PETATOEStorage;return S&&S.rawSnapshot?S.rawSnapshot():{}}
  function payrollSnapshot(){
    var out={manifest:PAYROLL_MANIFEST.map(function(x){return {name:x.name,label:x.label};}),data:{}};
    PAYROLL_MANIFEST.forEach(function(item){out.data[item.name]=read(item.name,item.fallback);});
    return out;
  }
  function restorePayrollSection(payroll){
    if(!payroll||typeof payroll!=='object'||!payroll.data||typeof payroll.data!=='object')return;
    PAYROLL_MANIFEST.forEach(function(item){
      if(Object.prototype.hasOwnProperty.call(payroll.data,item.name))write(item.name,payroll.data[item.name]);
    });
  }
  function verifyPayrollRestore(sourceSnapshot){
    var S=window.PETATOEStorage;
    var result={total:PAYROLL_MANIFEST.length,restored:0,missingInBackup:0,failed:[],checked:[]};
    PAYROLL_MANIFEST.forEach(function(item){
      var key=S&&S.key?S.key(item.name):item.name;
      var expectedRaw=null, hasExpected=false;
      if(sourceSnapshot&&Object.prototype.hasOwnProperty.call(sourceSnapshot,key)){expectedRaw=sourceSnapshot[key];hasExpected=true;}
      else if(sourceSnapshot&&Object.prototype.hasOwnProperty.call(sourceSnapshot,item.name)){expectedRaw=sourceSnapshot[item.name];hasExpected=true;}
      if(!hasExpected){result.missingInBackup++;result.checked.push({name:item.name,key:key,status:'missing_in_backup'});return;}
      var actualRaw=S&&S.get?S.get(item.name,null):null;
      if(String(actualRaw)===String(expectedRaw)){result.restored++;result.checked.push({name:item.name,key:key,status:'restored'});}
      else{result.failed.push({name:item.name,key:key,status:'failed'});result.checked.push({name:item.name,key:key,status:'failed'});}
    });
    result.ok=result.failed.length===0;
    return result;
  }
  function download(data,name){var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});var link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;document.body.appendChild(link);link.click();setTimeout(function(){URL.revokeObjectURL(link.href);link.remove()},500)}
  function safeParseJson(text){
    if(String(text||'').length>MAX_BACKUP_JSON_LENGTH)return null;
    var Security=window.PETATOESecurity;
    if(Security&&typeof Security.safeJsonParse==='function'){
      return Security.safeJsonParse(text, null);
    }
    try{return JSON.parse(text||'{}');}catch(e){return null;}
  }
  function isSafeStorageKey(key){return !!key&&String(key).length<=180&&/^[A-Za-z0-9_:\-.]+$/.test(String(key));}
  function validateRawSnapshot(raw){
    if(raw==null)return {ok:true,message:'OK'};
    if(typeof raw!=='object'||Array.isArray(raw))return {ok:false,message:'صيغة localStorage داخل الملف غير صالحة'};
    var keys=Object.keys(raw);
    if(keys.length>1000)return {ok:false,message:'ملف Backup يحتوي مفاتيح localStorage أكثر من المتوقع'};
    for(var i=0;i<keys.length;i++){
      var k=keys[i], v=raw[k];
      if(!isSafeStorageKey(k))return {ok:false,message:'ملف Backup يحتوي مفتاح تخزين غير آمن: '+k};
      if(v!==null&&v!==undefined&&typeof v!=='string'&&typeof v!=='number'&&typeof v!=='boolean'&&typeof v!=='object')return {ok:false,message:'ملف Backup يحتوي قيمة تخزين غير مدعومة'};
      try{if(String(typeof v==='object'?JSON.stringify(v):v).length>MAX_RAW_VALUE_LENGTH)return {ok:false,message:'ملف Backup يحتوي قيمة تخزين أكبر من الحد الآمن'};}catch(e){return {ok:false,message:'ملف Backup يحتوي قيمة تخزين غير قابلة للتحقق'};}
    }
    return {ok:true,message:'OK'};
  }
  function validateBackup(data){
    if(!data||typeof data!=='object'||Array.isArray(data))return {ok:false,message:'ملف JSON غير صالح'};
    if(data.type&&String(data.type).indexOf('PETATOE_')!==0)return {ok:false,message:'نوع ملف غير مدعوم'};
    if(data.records!=null&&!Array.isArray(data.records))return {ok:false,message:'صيغة بيانات المبيعات داخل الملف غير صالحة'};
    var rawCheck=validateRawSnapshot(data.localStorage);if(!rawCheck.ok)return rawCheck;
    if(data.payroll!=null&&(typeof data.payroll!=='object'||Array.isArray(data.payroll)))return {ok:false,message:'صيغة بيانات الرواتب داخل الملف غير صالحة'};
    if(data.users!=null&&!Array.isArray(data.users))return {ok:false,message:'صيغة المستخدمين داخل الملف غير صالحة'};
    if(data.roles!=null&&(typeof data.roles!=='object'||Array.isArray(data.roles)))return {ok:false,message:'صيغة الصلاحيات داخل الملف غير صالحة'};
    if(data.system!=null&&(typeof data.system!=='object'||Array.isArray(data.system)))return {ok:false,message:'صيغة إعدادات النظام داخل الملف غير صالحة'};
    if(data.security!=null&&(typeof data.security!=='object'||Array.isArray(data.security)))return {ok:false,message:'صيغة إعدادات الأمان داخل الملف غير صالحة'};
    if(!data.localStorage&&!Array.isArray(data.records)&&!data.users&&!data.roles&&!data.system&&!data.security&&!data.payroll)return {ok:false,message:'الملف لا يحتوي بيانات قابلة للاستيراد'};
    return {ok:true,message:'OK'};
  }
  function renderBackupBody(){return '<div class="pet-v110-grid">'+
    '<div class="pet-v110-card"><h3>💾 Backup</h3><p>تصدير نسخة كاملة JSON تشمل البيانات والإعدادات والسجلات.</p><div class="pet-v110-actions"><button class="pet-v110-btn green" data-v110-action="backup">تصدير Backup JSON</button><button class="pet-v110-btn blue" data-v110-action="data-only">تصدير البيانات فقط</button></div></div>'+
    '<div class="pet-v110-card"><h3>♻️ Restore</h3><p>استيراد نسخة JSON مع تحذير قبل استبدال البيانات.</p><div class="pet-v110-actions"><button class="pet-v110-btn primary" data-v110-action="pick-restore">استيراد / Restore</button></div><div class="pet-v110-note">يفضل تصدير Backup قبل أي Restore.</div></div>'+
    '</div>';}
  function exportFullBackup(){download({type:'PETATOE_FULL_BACKUP',version:VERSION,createdAt:new Date().toISOString(),records:records(),localStorage:snapshot(),payroll:payrollSnapshot(),system:system(),security:security(),users:users(),roles:roles()},'PETATOE_backup_'+new Date().toISOString().slice(0,10)+'.json');audit('Backup Exported','Full JSON backup + payroll manifest','info');toast('تم تصدير Backup شامل بيانات الرواتب');}
  function exportDataOnly(){download({type:'PETATOE_DATA_ONLY',version:VERSION,createdAt:new Date().toISOString(),records:records()},'PETATOE_records_only.json');audit('Data Exported','Records only JSON export','info');toast('تم تصدير البيانات فقط');}
  function pickRestore(){var input=byId('v110RestoreInput');if(!input){input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.id='v110RestoreInput';input.hidden=true;input.onchange=restoreFromInput;document.body.appendChild(input)}input.click();}
  function applyRestore(data,fileName){var check=validateBackup(data);if(!check.ok){toast(check.message);return false}var S=window.PETATOEStorage;var payrollSource=null;if(data.localStorage&&typeof data.localStorage==='object')payrollSource=Object.assign({},data.localStorage);if(data.payroll&&data.payroll.data&&typeof data.payroll.data==='object'){payrollSource=payrollSource||{};PAYROLL_MANIFEST.forEach(function(item){if(Object.prototype.hasOwnProperty.call(data.payroll.data,item.name)){var key=S&&S.key?S.key(item.name):item.name;try{payrollSource[key]=JSON.stringify(data.payroll.data[item.name]);}catch(e){console.warn('PETATOEBackup payroll key stringify fallback', item.name, e);payrollSource[key]=String(data.payroll.data[item.name]);}}});}if(data.localStorage&&typeof data.localStorage==='object'){if(S&&S.applyRawSnapshot)S.applyRawSnapshot(data.localStorage);}restorePayrollSection(data.payroll);var payrollVerify=payrollSource?verifyPayrollRestore(payrollSource):null;if(Array.isArray(data.records)){try{if(window.PETATOEDataSource&&window.PETATOEDataSource.setRecordsSync)window.PETATOEDataSource.setRecordsSync(data.records)}catch(e){console.warn('PETATOEBackup restore records failed', e);audit('Restore Records Failed',e&&e.message?e.message:String(e),'error');} try{if(typeof save==='function')save()}catch(e){console.warn('PETATOEBackup post-restore save failed', e);audit('Restore Save Failed',e&&e.message?e.message:String(e),'warn');}}
    try{if(window.PETATOESmartTabs&&typeof window.PETATOESmartTabs.notifyDataChanged==='function')window.PETATOESmartTabs.notifyDataChanged('backup-restore');}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("settings/backup.js",e);}if(data.users)saveUsers(data.users);if(data.roles)saveRoles(data.roles);if(data.system)saveSystem(data.system);if(data.security)saveSecurity(data.security);if(payrollVerify){var msg='Payroll restore check: '+payrollVerify.restored+'/'+payrollVerify.total+' restored, '+payrollVerify.missingInBackup+' missing in backup, '+payrollVerify.failed.length+' failed';audit('Payroll Restore Verification',msg,payrollVerify.ok?'info':'warn');if(payrollVerify.failed.length){toast('تحذير: فشل استعادة '+payrollVerify.failed.length+' من مفاتيح الرواتب. راجع سجل النظام.');}}audit('Restore Imported',fileName||'JSON backup','warn');return true;}
  function restoreFromInput(e){var f=e&&e.target&&e.target.files&&e.target.files[0];if(!f)return;var reader=new FileReader();reader.onload=function(ev){var data=safeParseJson(ev.target.result||'{}');var check=validateBackup(data);if(!check.ok){toast(check.message);return}try{if(!confirm('سيتم استيراد ملف JSON. هل تتابع؟'))return;if(applyRestore(data,f.name)){toast('تم الاستيراد بنجاح');{var S=window.PETATOEStorage;render((S&&S.get?S.get('pet_settings_v110_main','settings'):'settings')||'settings',(S&&S.get?S.get('pet_settings_v110_sub','backup'):'backup')||'backup')}}}catch(err){console.error(err);toast('تعذر استيراد ملف Backup')}};if(f.size&&f.size>MAX_BACKUP_JSON_LENGTH){toast('حجم ملف Backup أكبر من الحد الآمن');e.target.value='';return;}reader.readAsText(f);e.target.value='';}

  window.PETATOEBackup={renderBackupBody:renderBackupBody,exportFullBackup:exportFullBackup,exportDataOnly:exportDataOnly,pickRestore:pickRestore,restoreFromInput:restoreFromInput,applyRestore:applyRestore,validateBackup:validateBackup,download:download,snapshot:snapshot,payrollSnapshot:payrollSnapshot,verifyPayrollRestore:verifyPayrollRestore};
  window.petV110Backup=exportFullBackup;
  window.petV110DataOnly=exportDataOnly;
  window.petV110PickRestore=pickRestore;
  window.petV110Restore=restoreFromInput;
})();
