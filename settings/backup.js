/* PETATOE v8.0.2 - Supabase Backup Split
   Stage 4: backup/export reads from Supabase-bound APIs only.
   No legacy restore or raw snapshot fallback. */
(function(){
  'use strict';
  var VERSION='8.0.2-stage4-supabase-backup';
  var MAX_BACKUP_JSON_LENGTH=60*1024*1024;

  function api(){return window.__PETATOE_SETTINGS_API__||{};}
  function repo(){return window.PETATOESupabaseRepository||null;}
  function byId(id){var a=api();return a.byId?a.byId(id):document.getElementById(id);}
  function toast(msg){var a=api();if(a.toast)return a.toast(msg);try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function audit(action,details,level){var a=api();if(a.audit)return a.audit(action,details,level);var r=repo();if(r&&r.appendAudit){r.appendAudit({time:new Date().toISOString(),action:action,details:details||'',level:level||'info'});}}
  function records(){try{var fb=(window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync)?window.PETATOEDataSource.getRecordsSync():[];return Array.isArray(fb)?fb:[]}catch(e){return []}}
  function users(){var a=api();if(a.users)return a.users();var ids=window.PETATOEIdentityStore;return ids&&ids.usersSync?ids.usersSync():[];}
  function roles(){var a=api();if(a.roles)return a.roles();return {};}
  function system(){var a=api();if(a.system)return a.system();return {};}
  function security(){var a=api();if(a.security)return a.security();return {};}
  function saveUsers(v){var a=api();if(a.saveUsers)return a.saveUsers(v||[]);var ids=window.PETATOEIdentityStore;if(ids&&ids.saveUsers)return ids.saveUsers(v||[]);}
  function saveRoles(v){var a=api();if(a.saveRoles)return a.saveRoles(v||{});}
  function saveSystem(v){var a=api();if(a.saveSystem)return a.saveSystem(v||{});var r=repo();if(r&&r.saveSystemSetting)return r.saveSystemSetting('system_settings',v||{});}
  function saveSecurity(v){var a=api();if(a.saveSecurity)return a.saveSecurity(v||{});var r=repo();if(r&&r.saveSystemSetting)return r.saveSystemSetting('security_settings',v||{});}
  function render(main,sub){var a=api();if(a.render)return a.render(main,sub);}

  function payrollSnapshot(){
    var out={source:'supabase-runtime',employees:[],slips:[],master:{}};
    try{if(window.PETATOEPayrollDataStore){out.employees=(window.PETATOEPayrollDataStore.employees||[]).slice();out.slips=(window.PETATOEPayrollDataStore.slips||[]).slice();out.master=Object.assign({},window.PETATOEPayrollDataStore.master||{});}}catch(e){}
    return out;
  }
  function treasurySnapshot(){try{return window.PETATOETreasuryDataStore?JSON.parse(JSON.stringify(window.PETATOETreasuryDataStore)):{};}catch(e){return {};}}
  function warehouseSnapshot(){try{return window.PETATOEWarehouseDataStore?JSON.parse(JSON.stringify(window.PETATOEWarehouseDataStore)):{};}catch(e){return {};}}
  function childrenSnapshot(){try{return window.PETATOEChildrenExpensesDataStore?JSON.parse(JSON.stringify(window.PETATOEChildrenExpensesDataStore)):{};}catch(e){return {};}}

  function download(data,name){var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});var link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;document.body.appendChild(link);link.click();setTimeout(function(){URL.revokeObjectURL(link.href);link.remove()},500)}
  function safeParseJson(text){if(String(text||'').length>MAX_BACKUP_JSON_LENGTH)return null;var Security=window.PETATOESecurity;if(Security&&typeof Security.safeJsonParse==='function')return Security.safeJsonParse(text,null);try{return JSON.parse(text||'{}');}catch(e){return null;}}

  function validateBackup(data){
    if(!data||typeof data!=='object'||Array.isArray(data))return {ok:false,message:'ملف JSON غير صالح'};
    if(data.type&&String(data.type).indexOf('PETATOE_')!==0)return {ok:false,message:'نوع ملف غير مدعوم'};
    if(data.records!=null&&!Array.isArray(data.records))return {ok:false,message:'صيغة بيانات المبيعات داخل الملف غير صالحة'};
    if(data.users!=null&&!Array.isArray(data.users))return {ok:false,message:'صيغة المستخدمين داخل الملف غير صالحة'};
    if(data.roles!=null&&(typeof data.roles!=='object'||Array.isArray(data.roles)))return {ok:false,message:'صيغة الصلاحيات داخل الملف غير صالحة'};
    if(data.system!=null&&(typeof data.system!=='object'||Array.isArray(data.system)))return {ok:false,message:'صيغة إعدادات النظام غير صالحة'};
    if(data.security!=null&&(typeof data.security!=='object'||Array.isArray(data.security)))return {ok:false,message:'صيغة إعدادات الأمان غير صالحة'};
    if(!Array.isArray(data.records)&&!data.users&&!data.roles&&!data.system&&!data.security&&!data.payroll)return {ok:false,message:'الملف لا يحتوي بيانات قابلة للاستيراد'};
    return {ok:true,message:'OK'};
  }

  function renderBackupBody(){return '<div class="pet-v110-grid">'+
    '<div class="pet-v110-card"><h3>💾 Backup</h3><p>تصدير نسخة JSON من البيانات المحمّلة من Supabase فقط، بدون أي LocalStorage.</p><div class="pet-v110-actions"><button class="pet-v110-btn green" data-v110-action="backup">تصدير Backup JSON</button><button class="pet-v110-btn blue" data-v110-action="data-only">تصدير بيانات المبيعات فقط</button></div></div>'+
    '<div class="pet-v110-card"><h3>♻️ Restore</h3><p>استيراد محدود وآمن للبيانات المدعومة فقط. لا يتم استرجاع أي لقطة LocalStorage قديمة.</p><div class="pet-v110-actions"><button class="pet-v110-btn primary" data-v110-action="pick-restore">استيراد / Restore</button></div><div class="pet-v110-note">يفضل تصدير Backup قبل أي Restore.</div></div>'+ '</div>';}

  function exportFullBackup(){download({type:'PETATOE_FULL_BACKUP_SUPABASE',version:VERSION,createdAt:new Date().toISOString(),records:records(),users:users(),roles:roles(),system:system(),security:security(),payroll:payrollSnapshot(),treasury:treasurySnapshot(),warehouse:warehouseSnapshot(),childrenExpenses:childrenSnapshot()},'PETATOE_backup_'+new Date().toISOString().slice(0,10)+'.json');audit('Backup Exported','Supabase JSON backup','info');toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم تصدير Backup من بيانات Supabase'):'تم تصدير Backup من بيانات Supabase');}
  function exportDataOnly(){download({type:'PETATOE_DATA_ONLY',version:VERSION,createdAt:new Date().toISOString(),records:records()},'PETATOE_records_only.json');audit('Data Exported','Records only JSON export','info');toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم تصدير البيانات فقط'):'تم تصدير البيانات فقط');}
  function pickRestore(){var input=byId('v110RestoreInput');if(!input){input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.id='v110RestoreInput';input.hidden=true;input.onchange=restoreFromInput;document.body.appendChild(input)}input.click();}
  function applyRestore(data,fileName){var check=validateBackup(data);if(!check.ok){toast(check.message);return false}
    if(Array.isArray(data.records)){try{if(window.PETATOEDataSource&&window.PETATOEDataSource.setRecordsSync)window.PETATOEDataSource.setRecordsSync(data.records)}catch(e){audit('Restore Records Failed',e&&e.message?e.message:String(e),'error');}}
    if(data.users)saveUsers(data.users); if(data.roles)saveRoles(data.roles); if(data.system)saveSystem(data.system); if(data.security)saveSecurity(data.security);
    audit('Restore Imported',fileName||'JSON backup','warn'); return true;}
  function restoreFromInput(e){var f=e&&e.target&&e.target.files&&e.target.files[0];if(!f)return;var reader=new FileReader();reader.onload=function(ev){var data=safeParseJson(ev.target.result||'{}');var check=validateBackup(data);if(!check.ok){toast(check.message);return}try{if(!confirm(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('سيتم استيراد ملف JSON للبيانات المدعومة فقط. هل تتابع؟'):'سيتم استيراد ملف JSON للبيانات المدعومة فقط. هل تتابع؟'))return;if(applyRestore(data,f.name)){toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم الاستيراد بنجاح'):'تم الاستيراد بنجاح');render('settings','backup')}}catch(err){console.error(err);toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تعذر استيراد ملف Backup'):'تعذر استيراد ملف Backup')}};if(f.size&&f.size>MAX_BACKUP_JSON_LENGTH){toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('حجم ملف Backup أكبر من الحد الآمن'):'حجم ملف Backup أكبر من الحد الآمن');e.target.value='';return;}reader.readAsText(f);e.target.value='';}

  window.PETATOEBackup={renderBackupBody:renderBackupBody,exportFullBackup:exportFullBackup,exportDataOnly:exportDataOnly,pickRestore:pickRestore,restoreFromInput:restoreFromInput,applyRestore:applyRestore,validateBackup:validateBackup,download:download,payrollSnapshot:payrollSnapshot};
  window.petV110Backup=exportFullBackup; window.petV110DataOnly=exportDataOnly; window.petV110PickRestore=pickRestore; window.petV110Restore=restoreFromInput;
})();
