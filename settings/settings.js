/* PETATOE v3.8.155 - Settings Core Cleanup
   Settings center controller only. Business logic lives in users/permissions/setup/audit/backup modules. */
(function(){
  'use strict';
  if(window.__PETATOE_SETTINGS_CORE_BOOTED__) return;
  window.__PETATOE_SETTINGS_CORE_BOOTED__=true;
  var MAIN_KEY='settings_main', SUB_KEY='settings_sub', USERS_KEY='app_users', ROLES_KEY='roles', CURRENT_KEY='app_current_user_ref', SEC_KEY='security_settings', SYSTEM_KEY='system_settings', AUDIT_KEY='audit_logs';
  var roleNames={superadmin:'Super Admin',admin:'Admin',accountant:'Accountant',sales:'Sales Manager',fleet:'Fleet Manager',driver:'Driver',groomer:'Groomer',driver_groomer:'Driver / Groomer',viewer:'Viewer'};
  var perms=[['dashboard','عرض الرئيسية'],['entry','إدخال البيانات'],['reports','عرض التقارير'],['pdf','تصدير PDF'],['excel','تصدير Excel'],['treasury','عرض الخزنة'],['treasury_edit','تعديل/حذف الخزنة'],['vehicles','إدارة السيارات'],['obligations','إدارة الالتزامات'],['commissions','إدارة العمولات'],['appointments','إدارة المواعيد'],['childrenExpenses','مصروفات الأبناء'],['settings','الإعدادات'],['users','المستخدمون والصلاحيات']];
  var defaults={superadmin:perms.map(function(p){return p[0]}),admin:['dashboard','entry','reports','pdf','excel','treasury','treasury_edit','vehicles','obligations','commissions','childrenExpenses','settings','users'],accountant:['dashboard','entry','reports','pdf','excel','treasury','treasury_edit','obligations','settings'],sales:['dashboard','entry','reports','pdf','excel','vehicles'],fleet:['dashboard','reports','vehicles','treasury','treasury_edit'],viewer:['dashboard','reports']};
  function byId(id){return document.getElementById(id)}
  function esc(s){return String(s==null?'':s).replace(/[&<>\'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function S(){return null}
  function ID(){return window.PETATOEIdentityStore||null}
  function read(k,d){var ids=ID(); if(k===USERS_KEY&&ids&&ids.usersSync)return ids.usersSync(); if(k===ROLES_KEY)return defaults; return d}
  function write(k,v){var ids=ID(); if(k===USERS_KEY&&ids&&ids.saveUsers){return ids.saveUsers(v||[])} if(k===AUDIT_KEY&&Array.isArray(v)&&ids&&ids.appendAudit){if(v[0])return ids.appendAudit(v[0]);return {ok:true}} return {ok:true}}
  // PETATOE Supabase cleanup: keep Settings navigation state in memory only.
  // This replaces the old LocalStorage-backed settings_main/settings_sub state
  // without reintroducing persistent browser storage.
  var __settingsMemoryState={};
  __settingsMemoryState[MAIN_KEY]='system';
  __settingsMemoryState[SUB_KEY]='backup';
  function getText(k,d){
    try{
      if(Object.prototype.hasOwnProperty.call(__settingsMemoryState,k)){
        var v=__settingsMemoryState[k];
        return v==null||v===''?d:v;
      }
      if(k===CURRENT_KEY && window.PETATOE_CURRENT_USER_REF){ return String(window.PETATOE_CURRENT_USER_REF||'')||d; }
    }catch(_){}
    return d;
  }
  function setText(k,v){
    try{
      if(k===CURRENT_KEY){ window.PETATOE_CURRENT_USER_REF=String(v||''); return; }
      __settingsMemoryState[k]=String(v==null?'':v);
    }catch(_){}
  }
  function removeKey(k){
    try{ if(Object.prototype.hasOwnProperty.call(__settingsMemoryState,k)) delete __settingsMemoryState[k]; }catch(_){}
  }
  function tr(key,fallback){try{return window.PETATOE_I18N&&typeof window.PETATOE_I18N.t==='function'?window.PETATOE_I18N.t(key,fallback):fallback}catch(_){return fallback}}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function records(){try{var fb=(window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync)?window.PETATOEDataSource.getRecordsSync():[];return Array.isArray(fb)?fb:[]}catch(e){return []}}
  function seed(){var sec=window.PETATOEPasswordSecurity;var u=read(USERS_KEY,null);if(!Array.isArray(u)||!u.length){u=[{id:'u_admin',username:'Admin',fullName:'Admin',job:'Super Admin',phone:'',email:'',role:'superadmin',status:'active',createdAt:new Date().toISOString(),lastLogin:''}];write(USERS_KEY,u);setText(CURRENT_KEY,'u_admin')}else if(sec&&sec.sanitizeUsers&&sec.sanitizeUsers(u)){write(USERS_KEY,u)}var r=read(ROLES_KEY,null);if(!r)write(ROLES_KEY,defaults)}
  function users(){seed();var u=read(USERS_KEY,[]);var sec=window.PETATOEPasswordSecurity;if(sec&&sec.sanitizeUsers&&sec.sanitizeUsers(u))write(USERS_KEY,u);return u} function saveUsers(v){var list=Array.isArray(v)?v:[];var sec=window.PETATOEPasswordSecurity;if(sec&&sec.saveUsers)list=sec.saveUsers(list)||list;return write(USERS_KEY,list)}
  function roles(){seed();return read(ROLES_KEY,defaults)} function saveRoles(v){write(ROLES_KEY,v)}
  var Permissions=window.PETATOEPermissions||{};
  var Audit=window.PETATOEAudit||{};
  var __qualityCache=null, __qualityCacheAt=0, __lastRenderKey='', __lastRenderAt=0, __pendingRenderTimer=null, __lastNavIntentAt=0;
  function isSuperUser(u){if(Permissions.isSuperUser&&Permissions.isSuperUser(u))return true;var role=String((u&&u.role)||'').trim().toLowerCase(), roleN=role.replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'), id=String((u&&(u.id||u.userId||u.uid))||'').trim().toLowerCase(), name=String((u&&(u.username||u.name||u.fullName||u.login))||'').trim().toLowerCase(), job=String((u&&(u.job||u.title||u.position))||'').trim().toLowerCase();return !!(u&&(roleN==='superadmin'||roleN==='super_admin'||role.indexOf('super')>-1||role.indexOf('سوبر')>-1||id==='u_admin'||id==='admin'||name==='admin'||name==='superadmin'||job.indexOf('super')>-1||job.indexOf('سوبر')>-1))}
  function parseCurrentRef(raw){try{if(raw&&typeof raw==='object')return raw;var s=String(raw||'').trim();if(!s)return null;if((s.charAt(0)==='{'&&s.charAt(s.length-1)==='}')||(s.charAt(0)==='['&&s.charAt(s.length-1)===']'))return JSON.parse(s);return {id:s,username:s}}catch(_){return null}}
  function matchCurrentUser(us,ref){if(!ref)return null;var rid=String(ref.id||ref.userId||ref.uid||'').trim(), rn=String(ref.username||ref.name||ref.fullName||ref.login||'').trim().toLowerCase();return (us||[]).find(function(u){var uid=String(u.id||u.userId||u.uid||'').trim(), un=String(u.username||u.name||u.login||'').trim().toLowerCase(), fn=String(u.fullName||'').trim().toLowerCase();return (rid&&uid===rid)||(rid&&un===rid.toLowerCase())||(rid&&fn===rid.toLowerCase())||(rn&&un===rn)||(rn&&uid.toLowerCase()===rn)||(rn&&fn===rn)})||null}
  function storageValues(k){var a=[];try{if(window.PETATOE_CURRENT_USER_REF)a.push(String(window.PETATOE_CURRENT_USER_REF));}catch(_){}return a}
  function currentUser(){
    seed();
    var us=users();
    function validRef(r){return r&&typeof r==='object'&&(r.id||r.userId||r.uid||r.username||r.login||r.email)}
    function canonicalRef(){
      try{if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function'){var a=window.PETATOEAuth.currentUser();if(validRef(a))return a}}catch(_e){}
      try{if(validRef(window.__PETATOE_ACTIVE_USER__))return window.__PETATOE_ACTIVE_USER__;if(validRef(window.currentUser))return window.currentUser}catch(_e){}
      return null;
    }
    var canonical=canonicalRef();
    if(canonical){
      var matched=matchCurrentUser(us,canonical);
      if(matched)return matched;
      if(isSuperUser(canonical))return Object.assign({id:'u_admin',username:'Admin',fullName:'Admin',role:'superadmin',status:'active'},canonical,{role:canonical.role||'superadmin',status:canonical.status||'active'});
      return Object.assign({id:'',username:'Guest',fullName:'Guest',role:'guest',status:'inactive'},canonical);
    }
    var refs=[],seen={};
    function add(r){if(!r)return;var key='';try{key=JSON.stringify(r)}catch(_e){key=String(r)}if(!seen[key]){seen[key]=true;refs.push(r)}}
    storageValues('app_current_user_ref').forEach(function(v){add(parseCurrentRef(v))});
    for(var j=0;j<refs.length;j++){var f=matchCurrentUser(us,refs[j]);if(f)return f}
    return {id:'',username:'Guest',fullName:'Guest',role:'guest',status:'inactive'}
  }
  function system(){return Object.assign({companyName:'PETATOE',currency:'SAR',monthlyTarget:92000,vatRate:15,language:'ar',theme:document.documentElement.getAttribute('data-theme')||'dark'},read(SYSTEM_KEY,{}))}
  function saveSystem(v){write(SYSTEM_KEY,Object.assign(system(),v||{}))}
  function security(){var sec=window.PETATOEPasswordSecurity;if(sec&&sec.migrateSecurity)sec.migrateSecurity();return Object.assign({lockDelete:true,requireEditReason:true,requireDeleteReason:true,enableAudit:true,protectReports:false,sensitiveAmount:10000,managerPasswordHash:null},read(SEC_KEY,{}))}
  function saveSecurity(v){var next=Object.assign(security(),v||{});if(Object.prototype.hasOwnProperty.call(next,'managerPassword'))delete next.managerPassword;write(SEC_KEY,next)}
  function audit(action,details,level){if(Audit.log)return Audit.log(action,details,level);var arr=read(AUDIT_KEY,[]);arr.unshift({time:new Date().toISOString(),user:currentUser().username||'Guest',role:currentUser().role||'guest',action:action,details:details||'',level:level||'info',count:records().length});write(AUDIT_KEY,arr.slice(0,700))}
  function qText(v){return String(v==null?'':v).trim().replace(/\s+/g,' ').toLowerCase()}
  function qNum(v){var n=Number(String(v==null?'':v).replace(/,/g,''));return isNaN(n)?0:n}
  function qInv(r){return String(r.invoice||r.invoiceNo||r.invoiceNumber||r.InvNo||'').trim()}
  function qClient(r){return String(r.client||r.customer||r.customerName||'').trim()}
  function qItem(r){return String(r.item||r.service||r.serviceName||r.product||'').trim()}
  function qVehicle(r){return String(r.van||r.vehicle||r.car||r.carName||r.vehicleName||'').trim()}
  function qLineValue(r){return qNum(r.totalInc||r.total||r.totalWithVat||r.amount||r.lineTotal||r.price).toFixed(2)}
  function qDupKey(r){return [qInv(r),qClient(r),qItem(r),qVehicle(r),qLineValue(r)].map(qText).join('|')}
  function quality(force){var nowMs=Date.now();if(!force&&__qualityCache&&(nowMs-__qualityCacheAt)<60000)return __qualityCache;var rs=records(), seen={}, dup=0, neg=0, future=0, noVehicle=0, rows=[];var now=new Date();rs.forEach(function(r,i){var inv=qInv(r), client=qClient(r), item=qItem(r), vehicle=qVehicle(r), lineValue=qLineValue(r);if(inv){var dk=qDupKey(r);if(seen[dk]){dup++;rows.push({type:'فاتورة/بند مكرر',ref:inv,index:i+1,client:client,item:item,vehicle:vehicle,value:lineValue,prev:seen[dk]})}else seen[dk]=i+1}var amount=qNum(r.total||r.totalWithVat||r.amount||r.totalInc);if(amount<0){neg++;rows.push({type:'قيمة سالبة',ref:amount,index:i+1,client:client,item:item,vehicle:vehicle,value:lineValue})}var d=r.date?new Date(r.date):null;if(d&&String(d)!=='Invalid Date'&&d>now){future++;rows.push({type:'تاريخ مستقبلي',ref:r.date,index:i+1,client:client,item:item,vehicle:vehicle,value:lineValue})}if(!vehicle){noVehicle++;if(rows.length<80)rows.push({type:'بدون سيارة',ref:inv||'-',index:i+1,client:client,item:item,vehicle:vehicle,value:lineValue})}});__qualityCache={count:rs.length,dup:dup,neg:neg,future:future,noVehicle:noVehicle,rows:rows};__qualityCacheAt=nowMs;return __qualityCache}
  function qualitySummary(){var rs=records();if(__qualityCache)return {count:rs.length,dup:__qualityCache.dup||0,neg:__qualityCache.neg||0,future:__qualityCache.future||0,noVehicle:__qualityCache.noVehicle||0,rows:__qualityCache.rows||[]};return {count:rs.length,dup:0,neg:0,future:0,noVehicle:0,rows:[]}}
  function settingsCanOpen(key){try{if(window.PETATOENavigationPermissions&&typeof window.PETATOENavigationPermissions.canOpen==='function')return !!window.PETATOENavigationPermissions.canOpen(key);}catch(_e){} return true}
  function mainTabs(active){var arr=[['system','النظام'],['settings','الإعدادات'],['setup','التهيئة'],['permissions','الصلاحيات'],['vehicleAssignment','ربط السيارات'],['users','المستخدمين']];var elcUser=currentUser(), elcRole=String((elcUser&&elcUser.role)||'').toLowerCase();if(isSuperUser(elcUser)||elcRole==='admin')arr.push(['localization',tr('elc.title','مركز الترجمة')]);arr=arr.filter(function(t){return t[0]==='localization'||settingsCanOpen(t[0])});if(!arr.length)arr=[['system','النظام']];if(!arr.some(function(t){return t[0]===active}))active=arr[0][0];return '<div class="pet-v110-main-tabs">'+arr.map(function(t){return '<button type="button" class="pet-v110-main-tab '+(active===t[0]?'active':'')+'" data-pet-v110-main="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>'}
  function subTabs(active){var arr=[['backup','النسخ الاحتياطي والاستعادة'],['quality','فحص البيانات'],['systemSettings','إعدادات النظام'],['data','إدارة البيانات'],['security','الأمان'],['maintenance','الصيانة']];return '<div class="pet-v110-sub-tabs">'+arr.map(function(t){return '<button type="button" class="pet-v110-sub-tab '+(active===t[0]?'active':'')+'" data-pet-v110-sub="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>'}
  function kpis(q){var u=users(), cu=currentUser(), logs=Audit.getLogs?Audit.getLogs():read(AUDIT_KEY,[]);q=q||quality();return '<div class="pet-v110-kpis"><div class="pet-v110-kpi"><span>المستخدمون</span><b>'+u.length+'</b><small>'+u.filter(function(x){return x.status==='active'}).length+' نشط</small></div><div class="pet-v110-kpi"><span>المستخدم الحالي</span><b>'+esc(cu.fullName||cu.username)+'</b><small>'+esc(roleNames[cu.role]||cu.role)+'</small></div><div class="pet-v110-kpi"><span>سجل النشاط</span><b>'+logs.length+'</b><small>Audit Trail</small></div><div class="pet-v110-kpi"><span>مشاكل بيانات محتملة</span><b>'+q.rows.length+'</b><small>مكرر: '+q.dup+' / بدون سيارة: '+q.noVehicle+'</small></div></div>'}
  function card(title,desc,body){return '<div class="pet-v110-card"><h3>'+title+'</h3><p>'+desc+'</p>'+(body||'')+'</div>'}
  function systemHome(q){var shortcuts=[['settings','الإعدادات','primary'],['setup','التهيئة','blue'],['permissions','الصلاحيات','blue'],['users','المستخدمين','green']].filter(function(x){return settingsCanOpen(x[0])}).map(function(x){return '<button class="pet-v110-btn '+x[2]+'" data-pet-v110-main="'+x[0]+'">'+x[1]+'</button>'}).join('')||'<span class="pet-v110-note">لا توجد اختصارات متاحة للصلاحية الحالية.</span>';return '<div class="pet-v110-grid three">'+card('🧭 ملخص النظام','نظرة عامة على حالة البرنامج والبيانات.', '<div class="pet-v110-actions"><span class="pet-v110-badge info">الفواتير: '+q.count+'</span><span class="pet-v110-badge '+(q.rows.length?'warn':'ok')+'">مشاكل البيانات: '+q.rows.length+'</span><span class="pet-v110-badge role">المستخدم: '+esc(currentUser().username)+'</span></div>')+card('⚙️ اختصارات الإعدادات','انتقل مباشرة للتبويب المطلوب.', '<div class="pet-v110-actions">'+shortcuts+'</div>')+card('🛡️ الحوكمة','الأمان وسجل النشاط وتجهيز النظام للتحويل لاحقًا إلى PHP وقاعدة بيانات.', '<div class="pet-v110-note">النظام الحالي يعتمد على Supabase لجداول Users / Roles / Permissions / Audit Logs.</div>')+'</div>'}
  function settingsBody(sub,q){if(sub==='quality')return qualityBody(q); if(sub==='systemSettings')return systemSettingsBody(); if(sub==='data')return dataBody(); if(sub==='security')return securitySettingsBody(); if(sub==='maintenance')return maintenanceBody(); return backupBody()}
  function backupBody(){return (window.PETATOEBackup&&window.PETATOEBackup.renderBackupBody)?window.PETATOEBackup.renderBackupBody():('<div class="pet-v110-card"><h3>💾 Backup / Restore</h3><p>جاري تحميل وحدة النسخ الاحتياطي...</p></div>')}
  function qualityBody(q){var rows=q.rows.slice(0,120).map(function(x){return '<tr><td>'+esc(x.type)+'</td><td>'+esc(x.ref)+'</td><td>'+esc(x.client||'')+'</td><td>'+esc(x.item||'')+'</td><td>'+esc(x.vehicle||'')+'</td><td>'+esc(x.value||'')+'</td><td>'+esc(x.prev||'')+'</td><td>'+x.index+'</td></tr>'}).join('')||'<tr><td colspan="8">لا توجد مشاكل ظاهرة</td></tr>';return '<div class="pet-v110-grid three">'+card('🔁 الفواتير/البنود المكررة','الحكم بالتكرار عند تطابق رقم الفاتورة + العميل + الصنف/الخدمة + السيارة + قيمة الصنف.', '<b class="pet-v110-badge '+(q.dup?'warn':'ok')+'">'+q.dup+'</b>')+card('📉 القيم السالبة','كشف أي إجماليات سالبة.', '<b class="pet-v110-badge '+(q.neg?'bad':'ok')+'">'+q.neg+'</b>')+card('🚚 فواتير بدون سيارة','كشف السجلات التي لا تحتوي على سيارة.', '<b class="pet-v110-badge '+(q.noVehicle?'warn':'ok')+'">'+q.noVehicle+'</b>')+'</div><div class="pet-v110-card"><h3>🧪 تفاصيل الفحص</h3><div class="pet-v110-note">شرط التكرار الحالي: رقم الفاتورة + اسم العميل + الصنف/الخدمة + السيارة + قيمة الصنف. تكرار رقم الفاتورة وحده لا يُعتبر مشكلة.</div><div class="pet-v110-actions"><button class="pet-v110-btn blue" data-v110-action="export-quality">تصدير نتيجة الفحص</button></div><div class="pet-v110-table"><table><thead><tr><th>نوع المشكلة</th><th>رقم الفاتورة/المرجع</th><th>العميل</th><th>الصنف/الخدمة</th><th>السيارة</th><th>قيمة الصنف</th><th>السطر السابق</th><th>رقم السطر</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'}
  function systemSettingsBody(){var s=system();return '<div class="pet-v110-card"><h3>⚙️ إعدادات النظام</h3><p>اسم الشركة، العملة، الهدف الشهري، اللغة، والدارك مود.</p><div class="pet-v110-actions"><input id="v110Company" class="pet-v110-input" placeholder="اسم الشركة" value="'+esc(s.companyName)+'"><input id="v110Currency" class="pet-v110-input" placeholder="العملة" value="'+esc(s.currency)+'"><input id="v110Target" class="pet-v110-input" type="number" placeholder="الهدف الشهري" value="'+esc(s.monthlyTarget)+'"><input id="v110Vat" class="pet-v110-input" type="number" placeholder="الضريبة %" value="'+esc(s.vatRate)+'"><select id="v110Lang" class="pet-v110-select"><option value="ar" '+(s.language==='ar'?'selected':'')+'>العربية</option><option value="en" '+(s.language==='en'?'selected':'')+'>English</option></select><select id="v110Theme" class="pet-v110-select"><option value="dark" '+(s.theme==='dark'?'selected':'')+'>Dark</option><option value="light" '+(s.theme==='light'?'selected':'')+'>Light</option></select><button class="pet-v110-btn primary" data-v110-action="save-system">حفظ الإعدادات</button></div></div>'}
  function dataBody(){return '<div class="pet-v110-grid three">'+card('🧹 مسح بيانات تجريبية','حذف السجلات التي تحتوي على Test / Demo / تجريبي.', '<button class="pet-v110-btn danger" data-v110-action="clear-demo">مسح التجريبي</button>')+card('🗑️ تصفير قسم معين','تصفير بيانات قسم محدد من مصدر Supabase عند الحاجة.', '<div class="pet-v110-actions"><select id="v110ClearSection" class="pet-v110-select"><option value="">اختر القسم</option><option value="treasury">الخزنة</option><option value="obligations">الالتزامات</option><option value="vehicles">السيارات</option></select><button class="pet-v110-btn danger" data-v110-action="clear-section">تصفير</button></div>')+card('📥 استيراد بيانات','استيراد ملف JSON للبيانات فقط أو نسخة كاملة.', '<button class="pet-v110-btn blue" data-v110-action="pick-restore">استيراد JSON</button>')+'</div>'}
  function securitySettingsBody(){var s=security();return '<div class="pet-v110-grid">'+card('🛡️ قفل العمليات الحساسة','إعدادات الأمان العامة.', '<div class="pet-v110-actions"><label class="pet-v110-check"><input id="v110LockDelete" type="checkbox" '+(s.lockDelete?'checked':'')+'> قفل الحذف</label><label class="pet-v110-check"><input id="v110EditReason" type="checkbox" '+(s.requireEditReason?'checked':'')+'> سبب إلزامي للتعديل</label><label class="pet-v110-check"><input id="v110DeleteReason" type="checkbox" '+(s.requireDeleteReason?'checked':'')+'> سبب إلزامي للحذف</label><label class="pet-v110-check"><input id="v110Audit" type="checkbox" '+(s.enableAudit?'checked':'')+'> تفعيل Audit Trail</label><label class="pet-v110-check"><input id="v110ProtectReports" type="checkbox" '+(s.protectReports?'checked':'')+'> حماية التقارير</label><input id="v110SensitiveAmount" class="pet-v110-input" type="number" value="'+esc(s.sensitiveAmount)+'" placeholder="حد العملية الحساسة"><button class="pet-v110-btn primary" data-v110-action="save-security">حفظ الأمان</button></div>')+card('📋 سجل Audit Trail','تصدير أو مسح سجل النشاط.', '<div class="pet-v110-actions"><button class="pet-v110-btn blue" data-v110-action="export-audit">تصدير السجل</button><button class="pet-v110-btn danger" data-v110-action="clear-audit">مسح السجل</button></div>')+card('💻 الأجهزة الموثوقة','الأجهزة التي يمكنها تخطي MFA مؤقتًا لهذا المستخدم.', '<div class="pet-v110-actions"><button class="pet-v110-btn blue" data-v110-action="trusted-devices-refresh">تحديث الأجهزة</button></div><div id="petV9TrustedDevicesBox" class="pet-v110-note">جاري تحميل الأجهزة الموثوقة...</div>')+card('🧭 الجلسات النشطة','جلسات الدخول الحالية لهذا المستخدم عبر الأجهزة والمتصفحات.', '<div class="pet-v110-actions"><button class="pet-v110-btn blue" data-v110-action="active-sessions-refresh">تحديث الجلسات</button><button class="pet-v110-btn danger" data-v110-action="active-sessions-revoke-all">إنهاء كل الجلسات الأخرى</button></div><div id="petV9ActiveSessionsBox" class="pet-v110-note">جاري تحميل الجلسات النشطة...</div>')+card('📡 سجل الأمان','آخر أحداث الدخول والجلسات و MFA لهذا المستخدم.', '<div class="pet-v110-actions"><button class="pet-v110-btn blue" data-v110-action="security-activity-refresh">تحديث سجل الأمان</button></div><div id="petV9SecurityActivityBox" class="pet-v110-note">جاري تحميل سجل الأمان...</div>')+'</div>'}
  function maintenanceBody(){return '<div class="pet-v110-grid three">'+card('🔄 إعادة بناء الفهارس','إعادة بناء فهارس البحث والكاش الداخلي.', '<button class="pet-v110-btn primary" data-v110-action="rebuild-indexes">إعادة بناء</button>')+card('🧼 تنظيف الكاش','تنظيف كاش الجلسة المؤقت وإخفاء اللودر العالق.', '<button class="pet-v110-btn blue" data-v110-action="clean-cache">تنظيف الكاش</button>')+card('🛠️ فحص التخزين التشغيلي','فحص حالة التخزين التشغيلي والتأكد من جاهزية الواجهات.', '<button class="pet-v110-btn green" data-v110-action="repair-storage">فحص وإصلاح</button>')+'</div>'}

  function setupBody(){
    if(window.PETATOESetup && typeof window.PETATOESetup.renderSetupBody==='function')return window.PETATOESetup.renderSetupBody(window.__PETATOE_SETTINGS_API__);
    return '<div class="pet-v110-card"><h3>🛠️ بيانات التهيئة</h3><p>جاري تحميل وحدة التهيئة...</p></div>';
  }
  function permissionsBody(){
    if(window.PETATOEPermissions && typeof window.PETATOEPermissions.renderPermissionsBody==='function')return window.PETATOEPermissions.renderPermissionsBody(window.__PETATOE_SETTINGS_API__);
    return '<div class="pet-v110-card"><h3>🔐 الصلاحيات</h3><p>جاري تحميل وحدة الصلاحيات...</p></div>';
  }
  function vehicleAssignmentBody(){
    var P=window.PETATOEPermissions||{};
    if(!P.getVehicleList||!P.getUserPerm||!P.saveUserPerm){return '<div class="pet-v110-card"><h3>🚐 مركز ربط السيارات</h3><p>جاري تحميل وحدة صلاحيات السيارات...</p></div>';}
    var us=users().slice().sort(function(a,b){return String(a.fullName||a.username||a.id).localeCompare(String(b.fullName||b.username||b.id),'ar')});
    var vehicles=P.getVehicleList?P.getVehicleList():[];
    var selected=(window.__PETATOE_V664_ASSIGNMENT_USER__||'')||((us.find(function(u){return !isSuperUser(u)})||us[0]||{}).id||'');
    if(!us.some(function(u){return u.id===selected})&&us[0])selected=us[0].id;
    var u=us.find(function(x){return x.id===selected})||us[0]||{};
    var locked=isSuperUser(u);
    var perm=P.getUserPerm(selected)||{};
    var scope=(P.getVehicleScope?P.getVehicleScope(selected):perm.vehicleScope)||{allVehicles:true,vehicles:[]};
    var selectedMap={};(scope.vehicles||[]).forEach(function(x){selectedMap[String(x)]=1;});
    var userOpts=us.map(function(x){return '<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc((x.fullName||x.username||x.id)+' — '+(roleNames[x.role]||x.role||''))+'</option>'}).join('');
    var userOptsPlain=us.map(function(x){return '<option value="'+esc(x.id)+'">'+esc((x.fullName||x.username||x.id)+' — '+(roleNames[x.role]||x.role||''))+'</option>'}).join('');
    var vehicleChecks=vehicles.map(function(v){var id=String(v.id||v.name||'');var ck=scope.allVehicles||selectedMap[id]||selectedMap[String(v.name||'')];return '<label class="pet-v139-special"><input class="pet-v139-check" type="checkbox" data-v664-vehicle="'+esc(id)+'" '+(ck?'checked':'')+' '+(locked||scope.allVehicles?'disabled':'')+'> <span>'+esc(v.name||id)+(v.meta?'<small style="opacity:.7"> — '+esc(v.meta)+'</small>':'')+'</span></label>';}).join('')||'<div class="pet-v110-note">لا توجد سيارات مسجلة حاليًا. يمكن إضافة السيارات من شاشة التهيئة أو إدارة السيارات.</div>';
    var summaryRows=us.map(function(x){var sc=P.getVehicleScope?P.getVehicleScope(x.id):((P.getUserPerm(x.id)||{}).vehicleScope||{});sc=sc||{};var label=sc.allVehicles?'كل السيارات':((sc.vehicles||[]).length?sc.vehicles.join('، '):'لا توجد سيارات مخصصة');return '<tr><td>'+esc(x.fullName||x.username||x.id)+'</td><td>'+esc(roleNames[x.role]||x.role||'-')+'</td><td>'+esc(label)+'</td><td><button class="pet-v110-btn blue" data-v664-select-assignment-user="'+esc(x.id)+'">فتح</button></td></tr>';}).join('');
    return '<div class="pet-v110-card"><h3>🚐 مركز ربط صلاحيات تشغيل السيارات بالسيارات</h3><p>إدارة مركزية لتحديد السيارات المسموح لكل مستخدم بتشغيلها أو عرض تقاريرها، بدون تغيير صلاحيات الشاشات الأخرى.</p><div class="pet-v139-user-select-row"><div><label>المستخدم</label><select id="petV664AssignmentUser" data-v664-assignment-user="1">'+userOpts+'</select></div><div class="pet-v139-selected-user">المستخدم المحدد: <b>'+esc(u.fullName||u.username||'-')+'</b><br>الدور: <b>'+esc(roleNames[u.role]||u.role||'-')+'</b>'+(locked?'<br><span class="pet-v139-warn">Super Admin كامل الصلاحيات ومحمي</span>':'')+'</div></div></div>'+
      '<div class="pet-v110-card"><h3>🚗 السيارات المسموح بها</h3><p>اختر كل السيارات أو سيارات محددة لهذا المستخدم.</p><label class="pet-v139-special"><input class="pet-v139-check" id="petV664AllVehicles" type="checkbox" '+(scope.allVehicles?'checked':'')+' '+(locked?'disabled':'')+'> <span>كل السيارات الحالية والمستقبلية</span></label><div class="pet-v139-special-grid" id="petV664VehicleGrid">'+vehicleChecks+'</div><div class="pet-v110-actions"><button class="pet-v110-btn primary" data-v110-action="save-vehicle-assignment" '+(locked?'disabled':'')+'>💾 حفظ ربط السيارات</button><button class="pet-v110-btn blue" data-v110-action="clear-vehicle-assignment" '+(locked?'disabled':'')+'>كل السيارات</button></div></div>'+
      '<div class="pet-v110-card"><h3>📋 نسخ تخصيص مستخدم</h3><p>انسخ قائمة السيارات من مستخدم إلى مستخدم آخر لتسريع الإدارة.</p><div class="pet-v110-actions"><select class="pet-v110-select" id="petV664CopyFrom"><option value="">من مستخدم</option>'+userOptsPlain+'</select><select class="pet-v110-select" id="petV664CopyTo"><option value="">إلى مستخدم</option>'+userOptsPlain+'</select><button class="pet-v110-btn green" data-v110-action="copy-vehicle-assignment">نسخ التخصيص</button></div></div>'+
      '<div class="pet-v110-card"><h3>🧾 ملخص ربط السيارات</h3><div class="pet-v110-table"><table><thead><tr><th>المستخدم</th><th>الدور</th><th>السيارات المصرح بها</th><th>إجراء</th></tr></thead><tbody>'+summaryRows+'</tbody></table></div></div>';
  }
  function auditOnlyBody(){return Audit.renderAuditBody?Audit.renderAuditBody():'<div class="pet-v110-card"><h3>📄 السجل النظامي</h3><p>جاري تحميل وحدة سجل المراجعة...</p></div>'}
  function usersBody(){
    if(window.PETATOEUsersModule && typeof window.PETATOEUsersModule.renderUsersBody==='function'){
      return window.PETATOEUsersModule.renderUsersBody(window.__PETATOE_SETTINGS_API__);
    }
    return '<div class="pet-v110-card"><h3>👥 المستخدمين</h3><p>جاري تحميل وحدة المستخدمين...</p></div>';
  }

  window.__PETATOE_SETTINGS_API__={
    byId:byId, esc:esc, read:read, write:write, toast:toast,
    records:records, users:users, saveUsers:saveUsers, roles:roles, saveRoles:saveRoles,
    system:system, saveSystem:saveSystem, security:security, saveSecurity:saveSecurity,
    currentUser:currentUser, roleNames:roleNames, audit:audit, isSuperUser:isSuperUser,
    val:function(id,d){var e=byId(id);return e?e.value:d},
    render:function(main,sub){return render(main,sub)}, invalidateQuality:function(){__qualityCache=null;__qualityCacheAt=0},
    MAIN_KEY:MAIN_KEY, SUB_KEY:SUB_KEY, USERS_KEY:USERS_KEY, ROLES_KEY:ROLES_KEY,
    CURRENT_KEY:CURRENT_KEY, SEC_KEY:SEC_KEY, SYSTEM_KEY:SYSTEM_KEY, AUDIT_KEY:AUDIT_KEY
  };

  function render(main,sub){
    var el=byId('settingsArea'); if(!el) return;
    main=main||getText(MAIN_KEY,'system')||'system';
    sub=(main==='settings')?(sub||getText(SUB_KEY,'backup')||'backup'):'';
    var key=main+'|'+sub, nowMs=Date.now();
    // PETATOE v6.1.213: protect setup from duplicate render storms caused by tabchange + settingsnavigate + legacy safe calls.
    if(key===__lastRenderKey&&(nowMs-__lastRenderAt)<450) return;
    __lastRenderKey=key; __lastRenderAt=nowMs;
    var q=(main==='settings'&&sub==='quality')?quality(true):qualitySummary();
    var body=main==='settings'?subTabs(sub)+settingsBody(sub,q):(main==='setup'?setupBody():(main==='permissions'?(sub==='audit'?auditOnlyBody():permissionsBody()):(main==='vehicleAssignment'?vehicleAssignmentBody():(main==='users'?usersBody():(main==='localization'?'<div id="petatoeLocalizationDashboardMount"></div>':systemHome(q))))));
    el.setAttribute('data-v110-render','1');
    el.setAttribute('data-v110-main',main);
    el.setAttribute('data-v110-sub',sub||'');
    (window.PETATOESecurity||{setInnerHTML:function(el,h){el.replaceChildren(document.createRange().createContextualFragment(String(h==null?'':h)));}}).setInnerHTML(el, '<div class="pet-v110-wrap"><div class="pet-v110-hero"><div><h3>⚙️ مركز الإعدادات والصلاحيات</h3><p>القائمة الرئيسية: النظام، الإعدادات، الصلاحيات، المستخدمين — بدون التأثير على التقارير القديمة.</p></div></div>'+mainTabs(main)+(main==='permissions'?'':kpis(q))+body+'</div>');
    if(main==='localization'&&window.PETATOELocalizationDashboard&&typeof window.PETATOELocalizationDashboard.mount==='function'){window.PETATOELocalizationDashboard.mount(byId('petatoeLocalizationDashboardMount'));}
    if(main==='settings' && sub==='security') setTimeout(function(){ if(typeof window.petV9LoadTrustedDevices==='function') window.petV9LoadTrustedDevices(); if(typeof window.petV9LoadActiveSessions==='function') window.petV9LoadActiveSessions(); if(typeof window.petV9LoadSecurityActivity==='function') window.petV9LoadSecurityActivity(); }, 120);
  }
  window.petSettingsV110Open=function(main,sub){setText(MAIN_KEY,main||'system');if(sub)setText(SUB_KEY,sub);render(main,sub)};
  window.petV110ExportQuality=function(){download({type:'PETATOE_DATA_QUALITY',createdAt:new Date().toISOString(),quality:quality(true)},'PETATOE_data_quality.json')};
  window.petV110SaveSystem=function(){var v={companyName:val('v110Company','PETATOE'),currency:val('v110Currency','SAR'),monthlyTarget:Number(val('v110Target',92000))||0,vatRate:Number(val('v110Vat',15))||0,language:val('v110Lang','ar'),theme:val('v110Theme','dark')};saveSystem(v);try{document.documentElement.setAttribute('data-theme',v.theme);setText('petatoe_theme',v.theme)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("settings/settings.js",e);}audit('System Settings Saved',v.companyName+' / '+v.currency,'info');toast('تم حفظ إعدادات النظام');render('settings','systemSettings')};
  window.petV110ClearDemo=function(){var before=records().length, kept=records().filter(function(r){var s=JSON.stringify(r).toLowerCase();return !(s.includes('demo')||s.includes('test')||s.includes('تجريبي'))});if(kept.length===before){toast('لا توجد بيانات تجريبية ظاهرة');return}if(!confirm('حذف '+(before-kept.length)+' سجل تجريبي؟'))return;try{if(window.PETATOEDataSource&&window.PETATOEDataSource.setRecordsSync)window.PETATOEDataSource.setRecordsSync(kept)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("settings/settings.js",e);}try{if(typeof save==='function')save()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("settings/settings.js",e);}audit('Demo Data Cleared','Removed '+(before-kept.length),'warn');__qualityCache=null;toast('تم مسح البيانات التجريبية');render('settings','data')};
  window.petV110ClearSection=function(){var sec=val('v110ClearSection','');if(!sec)return;if(prompt('للتأكيد اكتب DELETE')!=='DELETE'){toast('تم الإلغاء');return}var keys={treasury:['petatoe_treasury_movements','petatoe_treasury_audit','PETATOE_TREASURY_MOVEMENTS'],obligations:['petatoe_obligations','petatoe_obligations_archive'],vehicles:['petatoe_vehicles','petatoe_fleet']};if(sec==='allLocal'){if(confirm('مسح كل التخزين المحلي؟')){var st=S();if(st&&st.clearRaw)st.clearRaw()}}else{(keys[sec]||[]).forEach(function(k){removeKey(k)})}audit('Section Cleared',sec,'warn');toast('تم تنفيذ التصفير');render('settings','data')};
  window.petV110SaveSecurity=function(){saveSecurity({lockDelete:checked('v110LockDelete'),requireEditReason:checked('v110EditReason'),requireDeleteReason:checked('v110DeleteReason'),enableAudit:checked('v110Audit'),protectReports:checked('v110ProtectReports'),sensitiveAmount:Number(val('v110SensitiveAmount',10000))||0});audit('Security Settings Saved','Security settings updated','warn');toast('تم حفظ إعدادات الأمان');render('settings','security')};
  window.petV110ExportAudit=function(){if(Audit.exportLogs)return Audit.exportLogs();download({type:'PETATOE_AUDIT_TRAIL',createdAt:new Date().toISOString(),audit:read(AUDIT_KEY,[])},'PETATOE_audit_trail.json')};
  window.petV110ClearAudit=function(){if(!confirm('مسح سجل النشاط؟'))return;if(Audit.clearLogs)Audit.clearLogs();else{removeKey(AUDIT_KEY);audit('Audit Trail Reset','Audit log cleared','warn')}toast('تم مسح السجل');render('permissions','audit')};
  window.petV110RebuildIndexes=function(){try{setText('petatoe_index_rebuild_at',new Date().toISOString());if(typeof _invalidateSearchIndex==='function')_invalidateSearchIndex()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("settings/settings.js",e);}audit('Indexes Rebuilt','Search/cache indexes rebuilt','info');toast('تمت إعادة بناء الفهارس')};
  window.petV110CleanCache=function(){try{var l=byId('petatoeLoader');if(l){l.classList.add('hidden');l.style.display='none';l.style.pointerEvents='none'}var st=S();if(st&&st.clearRaw)st.clearRaw({scope:'session'});}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("settings/settings.js",e);}audit('Cache Cleaned','Session cache and loader cleaned','info');toast('تم تنظيف الكاش')};
  window.petV110RepairStorage=function(){var st=S();var bad=(st&&st.scanInvalidJSON)?st.scanInvalidJSON():[];audit('Storage Repair Scan','Bad JSON keys: '+bad.length,bad.length?'warn':'info');toast(bad.length?'ملاحظات تخزين: '+bad.join(', '):'التخزين التشغيلي سليم ظاهريًا')};

  window.petV664SelectAssignmentUser=function(uid){window.__PETATOE_V664_ASSIGNMENT_USER__=uid||'';render('vehicleAssignment')};
  window.petV664ToggleAllVehicles=function(force){var all=byId('petV664AllVehicles');var checked=typeof force==='boolean'?force:!!(all&&all.checked);document.querySelectorAll('#settings [data-v664-vehicle]').forEach(function(c){c.disabled=checked;c.checked=checked?true:c.checked});};
  window.petV664SaveVehicleAssignment=function(){var P=window.PETATOEPermissions||{}, uid=val('petV664AssignmentUser',''), us=users(), u=us.find(function(x){return x.id===uid});if(!uid||!u){toast('اختر مستخدم أولاً');return}if(isSuperUser(u)){toast('Super Admin كامل الصلاحيات ومحمي');return}if(!P.getUserPerm||!P.saveUserPerm){toast('وحدة الصلاحيات غير جاهزة');return}var p=P.getUserPerm(uid)||{};var all=!!(byId('petV664AllVehicles')&&byId('petV664AllVehicles').checked);var list=[];document.querySelectorAll('#settings [data-v664-vehicle]').forEach(function(c){if(c.checked)list.push(c.getAttribute('data-v664-vehicle'))});p.vehicleScope={allVehicles:all,vehicles:all?[]:list};P.saveUserPerm(uid,p);audit('Vehicle Assignment Updated','Vehicle scope saved for '+(u.username||uid),'warn');toast('تم حفظ ربط السيارات للمستخدم');render('vehicleAssignment')};
  window.petV664ClearVehicleAssignment=function(){var all=byId('petV664AllVehicles');if(all){all.checked=true;window.petV664ToggleAllVehicles(true)}toast('تم تحديد كل السيارات، اضغط حفظ للتأكيد')};
  window.petV664CopyVehicleAssignment=function(){var P=window.PETATOEPermissions||{}, from=val('petV664CopyFrom',''), to=val('petV664CopyTo',''), us=users(), target=us.find(function(x){return x.id===to});if(!from||!to){toast('اختر مستخدم المصدر والهدف');return}if(from===to){toast('لا يمكن النسخ لنفس المستخدم');return}if(!target){toast('المستخدم الهدف غير موجود');return}if(isSuperUser(target)){toast('Super Admin محمي ولا يحتاج تخصيص');return}if(!P.getUserPerm||!P.saveUserPerm){toast('وحدة الصلاحيات غير جاهزة');return}var sourceScope=(P.getVehicleScope?P.getVehicleScope(from):(P.getUserPerm(from)||{}).vehicleScope)||{allVehicles:true,vehicles:[]};var p=P.getUserPerm(to)||{};p.vehicleScope={allVehicles:sourceScope.allVehicles!==false,vehicles:(sourceScope.vehicles||[]).slice()};P.saveUserPerm(to,p);window.__PETATOE_V664_ASSIGNMENT_USER__=to;audit('Vehicle Assignment Copied','Vehicle scope copied from '+from+' to '+to,'warn');toast('تم نسخ ربط السيارات');render('vehicleAssignment')};
  window.petV110SaveRoles=function(){if(window.petV139SaveUserPermissions)return window.petV139SaveUserPermissions();};
  function val(id,d){var e=byId(id);return e?e.value:d}function checked(id){var e=byId(id);return !!(e&&e.checked)}
  function download(data,name){var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
  function queueRender(main,sub,delay){
    if(__pendingRenderTimer) clearTimeout(__pendingRenderTimer);
    __pendingRenderTimer=setTimeout(function(){__pendingRenderTimer=null;render(main,sub)},delay||40);
  }
  function hook(){
    document.addEventListener('petatoe:settingsnavigate',function(e){
      var d=e.detail||{}; __lastNavIntentAt=Date.now();
      queueRender(d.main||getText(MAIN_KEY,'system')||'system',d.sub||'',40);
    });
    document.addEventListener('petatoe:tabchange',function(e){
      if(!(e.detail&&e.detail.tabId==='settings')) return;
      if(Date.now()-__lastNavIntentAt<300) return;
      queueRender(getText(MAIN_KEY,'system')||'system',getText(SUB_KEY,'')||'',120);
    });
    window.petSettingsOpen=function(t){queueRender(t||getText(MAIN_KEY,'system')||'system',getText(SUB_KEY,'')||'',20)};
    window.renderSettingsPanelV110=function(){queueRender(getText(MAIN_KEY,'system')||'system',getText(SUB_KEY,'')||'',20)};
  }
  document.addEventListener('click',function(e){var m=e.target.closest&&e.target.closest('[data-pet-v110-main]');if(m){var main=m.getAttribute('data-pet-v110-main'),sub=(main==='settings'?(m.getAttribute('data-pet-v110-sub')||getText(SUB_KEY,'backup')||'backup'):'');if(!settingsCanOpen(main)){toast('غير متاح للصلاحية الحالية');return}setText(MAIN_KEY,main);if(sub)setText(SUB_KEY,sub);render(main,sub);return}var s=e.target.closest&&e.target.closest('[data-pet-v110-sub]');if(s){var sub=s.getAttribute('data-pet-v110-sub');setText(MAIN_KEY,'settings');setText(SUB_KEY,sub);render('settings',sub);return}var b=e.target.closest&&e.target.closest('[data-tab="settings"]');if(b)setTimeout(function(){render(getText(MAIN_KEY,'system')||'system',getText(SUB_KEY,'')||'')},320)},true);
  hook();
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){if(document.querySelector('#settings.panel.active,#settings.active'))render(getText(MAIN_KEY,'system')||'system',getText(SUB_KEY,'backup')||'backup')},800)})}else{setTimeout(function(){if(document.querySelector('#settings.panel.active,#settings.active'))render(getText(MAIN_KEY,'system')||'system',getText(SUB_KEY,'backup')||'backup')},800)}
})();



(function(){
  if(window.__PETATOE_SETTINGS_XSS_DELEGATION__) return;
  window.__PETATOE_SETTINGS_XSS_DELEGATION__=true;
  var actions={'export-quality':'petV110ExportQuality','save-security':'petV110SaveSecurity','export-audit':'petV110ExportAudit','clear-audit':'petV110ClearAudit','rebuild-indexes':'petV110RebuildIndexes','clean-cache':'petV110CleanCache','repair-storage':'petV110RepairStorage','backup':'petV110Backup','data-only':'petV110DataOnly','pick-restore':'petV110PickRestore','save-system':'petV110SaveSystem','clear-demo':'petV110ClearDemo','clear-section':'petV110ClearSection','save-user':'petV110SaveUser','clear-user':'petV110ClearUserForm','save-user-permissions':'petV139SaveUserPermissions','grant-read-only':'petV139GrantReadOnly','grant-driver-groomer':'petV139GrantDriverGroomer','grant-operational':'petV139GrantOperational','reset-user-permissions':'petV139ResetUserPermissions','save-vehicle-assignment':'petV664SaveVehicleAssignment','clear-vehicle-assignment':'petV664ClearVehicleAssignment','copy-vehicle-assignment':'petV664CopyVehicleAssignment','trusted-devices-refresh':'petV9LoadTrustedDevices','trusted-device-revoke':'petV9RevokeTrustedDevice','active-sessions-refresh':'petV9LoadActiveSessions','active-session-revoke':'petV9RevokeActiveSession','active-sessions-revoke-all':'petV9RevokeAllActiveSessions','security-activity-refresh':'petV9LoadSecurityActivity','trusted-devices-toggle':'petV9ToggleTrustedDevicesList','active-sessions-toggle':'petV9ToggleActiveSessionsList','security-activity-toggle':'petV9ToggleSecurityActivityList'};
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest&&e.target.closest('[data-v110-action],[data-v121-action]'); if(!btn) return;
    var a=btn.getAttribute('data-v110-action');
    if(a){e.preventDefault(); if(a==='edit-user'&&typeof window.petV110EditUser==='function') return window.petV110EditUser(btn.getAttribute('data-v110-id')); if(a==='delete-user'&&typeof window.petV110DeleteUser==='function') return window.petV110DeleteUser(btn.getAttribute('data-v110-id')); var fn=actions[a]; if(fn&&typeof window[fn]==='function') return window[fn](btn.getAttribute('data-device-id'));}
    var su=btn.getAttribute('data-v664-select-assignment-user'); if(su&&typeof window.petV664SelectAssignmentUser==='function'){e.preventDefault(); return window.petV664SelectAssignmentUser(su);}
    a=btn.getAttribute('data-v121-action');
    if(a){e.preventDefault(); var type=btn.getAttribute('data-v121-type'), id=btn.getAttribute('data-v121-id'); if(a==='save'&&typeof window.petV121SaveMasterItem==='function') return window.petV121SaveMasterItem(type); if(a==='clear'&&typeof window.petV121ClearMasterForm==='function') return window.petV121ClearMasterForm(type); if(a==='seed'&&typeof window.petV120SeedFromRecords==='function') return window.petV120SeedFromRecords(); if(a==='showAll'&&typeof window.petV121ShowAllMaster==='function') return window.petV121ShowAllMaster(type); if(a==='view'&&typeof window.petV121ViewMasterItem==='function') return window.petV121ViewMasterItem(type,id); if(a==='edit'&&typeof window.petV121EditMasterItem==='function') return window.petV121EditMasterItem(type,id); if(a==='delete'&&typeof window.petV120DeleteMasterItem==='function') return window.petV120DeleteMasterItem(type,id);}
  });
  document.addEventListener('change',function(e){var el=e.target;if(el&&el.matches&&el.matches('[data-v139-select-user]')&&typeof window.petV139SelectUser==='function') window.petV139SelectUser(el.value); if(el&&el.matches&&el.matches('[data-v664-assignment-user]')&&typeof window.petV664SelectAssignmentUser==='function') window.petV664SelectAssignmentUser(el.value); if(el&&el.id==='petV664AllVehicles'&&typeof window.petV664ToggleAllVehicles==='function') window.petV664ToggleAllVehicles(!!el.checked);});
  document.addEventListener('input',function(e){var el=e.target;if(el&&el.matches&&el.matches('[data-v121-search]')&&typeof window.petV121SearchMaster==='function') window.petV121SearchMaster(el.getAttribute('data-v121-search'),el.value);});
})();

/* PETATOE v9 S4.4.2.1 — Trusted Devices real loader/revoke UI
   Root cause: S4.4.2 added the UI placeholder and click action mapping, but did not define
   petV9LoadTrustedDevices / petV9RevokeTrustedDevice, so the box stayed on "loading" forever.
*/
(function(){
  if(window.__PETATOE_V9_TRUSTED_DEVICES_UI__) return;
  window.__PETATOE_V9_TRUSTED_DEVICES_UI__ = true;

  function byId(id){ return document.getElementById(id); }
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c;
    });
  }
  function fmtDate(v){
    if(!v) return '—';
    try{
      var d = new Date(String(v));
      if(isNaN(d.getTime())) return '—';
      return d.toLocaleString('ar-EG', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
    }catch(_){ return '—'; }
  }
  function shortDeviceName(device){
    var name = device && (device.deviceName || device.platform || 'Browser Device');
    if(String(name).length > 70) name = String(name).slice(0, 70) + '…';
    return name;
  }
  function statusLabel(status){
    status = String(status || '').toLowerCase();
    if(status === 'active') return '<span class="pet-v110-pill green">نشط</span>';
    if(status === 'expired') return '<span class="pet-v110-pill warn">منتهي</span>';
    if(status === 'revoked') return '<span class="pet-v110-pill danger">ملغي</span>';
    return '<span class="pet-v110-pill">غير معروف</span>';
  }
  function setBox(html){
    var box = byId('petV9TrustedDevicesBox');
    if(!box) return;
    var S = window.PETATOESecurity;
    if(S && typeof S.setInnerHTML === 'function') S.setInnerHTML(box, html);
    else box.innerHTML = html;
  }
  function errorMessage(error){
    var msg = String((error && (error.error || error.message || error.details)) || error || 'UNKNOWN_ERROR');
    if(msg.indexOf('Could not find the table') !== -1 || msg.indexOf('trusted_devices') !== -1){
      return 'جدول الأجهزة الموثوقة غير جاهز في Supabase. شغّل ملف SQL الخاص بالمرحلة S4.4.2.1 أولاً.';
    }
    if(msg === 'CURRENT_USER_EMAIL_REQUIRED') return 'تعذر تحديد بريد المستخدم الحالي. سجّل خروج ثم ادخل مرة أخرى.';
    return 'تعذر تحميل الأجهزة الموثوقة: ' + msg;
  }
  var SECURITY_LIST_LIMIT = 4;
  var trustedDevicesExpanded = false;
  var trustedDevicesCache = [];
  function listToggleButton(action,total,expanded){
    if(total <= SECURITY_LIST_LIMIT) return '';
    var remaining = Math.max(0, total - SECURITY_LIST_LIMIT);
    var label = expanded ? 'إخفاء' : ('عرض المزيد (+' + remaining + ')');
    return '<div class="pet-v110-actions" style="justify-content:center;margin-top:10px"><button class="pet-v110-btn blue" data-v110-action="'+esc(action)+'">'+esc(label)+'</button></div>';
  }

  window.petV9RenderTrustedDevices = function(devices){
    devices = Array.isArray(devices) ? devices : [];
    trustedDevicesCache = devices.slice();
    if(!devices.length){
      setBox('<div class="pet-v110-note">لا توجد أجهزة موثوقة لهذا المستخدم حتى الآن.</div>');
      return;
    }
    var visibleDevices = trustedDevicesExpanded ? devices : devices.slice(0, SECURITY_LIST_LIMIT);
    var rows = visibleDevices.map(function(d){
      var active = String(d.status || '').toLowerCase() === 'active';
      return '<div class="pet-v110-card" style="margin:10px 0;padding:14px">'
        + '<div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">'
        + '<div style="min-width:220px;flex:1">'
        + '<div style="font-weight:900;color:#e5f3ff;margin-bottom:6px">💻 '+esc(shortDeviceName(d))+'</div>'
        + '<div style="font-size:12px;color:rgba(226,232,240,.76);line-height:1.8">'
        + 'المتصفح/النظام: '+esc(d.platform || d.browser || '—')+'<br>'
        + 'آخر استخدام: '+esc(fmtDate(d.lastSeenAt))+'<br>'
        + 'موثوق حتى: '+esc(fmtDate(d.trustedUntil))
        + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+statusLabel(d.status)
        + (active ? '<button class="pet-v110-btn danger" data-v110-action="trusted-device-revoke" data-device-id="'+esc(d.id)+'">إلغاء الثقة</button>' : '')
        + '</div></div></div>';
    }).join('') + listToggleButton('trusted-devices-toggle', devices.length, trustedDevicesExpanded);
    setBox(rows);
  };

  window.petV9ToggleTrustedDevicesList = function(){
    trustedDevicesExpanded = !trustedDevicesExpanded;
    window.petV9RenderTrustedDevices(trustedDevicesCache || []);
  };

  window.petV9LoadTrustedDevices = async function(){
    var box = byId('petV9TrustedDevicesBox');
    if(!box) return;
    setBox('<div class="pet-v110-note">جاري تحميل الأجهزة الموثوقة...</div>');
    try{
      if(!window.PETATOEAuth || typeof window.PETATOEAuth.listTrustedDevices !== 'function'){
        throw new Error('PETATOE_AUTH_TRUSTED_DEVICES_API_NOT_READY');
      }
      var res = await window.PETATOEAuth.listTrustedDevices();
      if(!res || res.ok === false) throw new Error(errorMessage(res));
      window.petV9RenderTrustedDevices(res.devices || []);
    }catch(err){
      setBox('<div class="pet-v110-note" style="border-color:rgba(248,113,113,.45);color:#fecaca">'+esc(errorMessage(err))+'</div>');
    }
  };

  window.petV9RevokeTrustedDevice = async function(deviceId){
    if(!deviceId) return;
    if(!confirm('إلغاء الثقة من هذا الجهاز؟ سيُطلب OTP مرة أخرى عند الدخول منه.')) return;
    setBox('<div class="pet-v110-note">جاري إلغاء الثقة...</div>');
    try{
      if(!window.PETATOEAuth || typeof window.PETATOEAuth.revokeTrustedDevice !== 'function'){
        throw new Error('PETATOE_AUTH_TRUSTED_DEVICES_API_NOT_READY');
      }
      var res = await window.PETATOEAuth.revokeTrustedDevice(deviceId);
      if(!res || res.ok === false) throw new Error(errorMessage(res));
      if(window.PETATOEUI && typeof window.PETATOEUI.toast === 'function') window.PETATOEUI.toast('تم إلغاء الثقة من الجهاز');
      await window.petV9LoadTrustedDevices();
    }catch(err){
      setBox('<div class="pet-v110-note" style="border-color:rgba(248,113,113,.45);color:#fecaca">'+esc(errorMessage(err))+'</div>');
    }
  };


  function sessionStatusLabel(status, isCurrent){
    status = String(status || '').toLowerCase();
    if(isCurrent) return '<span class="pet-v110-pill green">الجلسة الحالية</span>';
    if(status === 'active') return '<span class="pet-v110-pill green">نشطة</span>';
    if(status === 'expired') return '<span class="pet-v110-pill warn">منتهية</span>';
    if(status === 'revoked') return '<span class="pet-v110-pill danger">منهية</span>';
    return '<span class="pet-v110-pill">غير معروفة</span>';
  }
  function setSessionsBox(html){
    var box = byId('petV9ActiveSessionsBox');
    if(!box) return;
    var S = window.PETATOESecurity;
    if(S && typeof S.setInnerHTML === 'function') S.setInnerHTML(box, html);
    else box.innerHTML = html;
  }
  function sessionErrorMessage(error){
    var msg = String((error && (error.error || error.message || error.details)) || error || 'UNKNOWN_ERROR');
    if(msg.indexOf('Could not find the table') !== -1 || msg.indexOf('user_sessions') !== -1){
      return 'جدول الجلسات غير جاهز في Supabase. شغّل ملف SQL الخاص بالمرحلة S4.5.1 أولاً.';
    }
    if(msg === 'CURRENT_USER_EMAIL_REQUIRED') return 'تعذر تحديد بريد المستخدم الحالي. سجّل خروج ثم ادخل مرة أخرى.';
    return 'تعذر تحميل الجلسات النشطة: ' + msg;
  }
  var activeSessionsExpanded = false;
  var activeSessionsCache = [];
  window.petV9RenderActiveSessions = function(sessions){
    sessions = Array.isArray(sessions) ? sessions : [];
    activeSessionsCache = sessions.slice();
    if(!sessions.length){
      setSessionsBox('<div class="pet-v110-note">لا توجد جلسات نشطة مسجلة لهذا المستخدم حتى الآن.</div>');
      return;
    }
    var visibleSessions = activeSessionsExpanded ? sessions : sessions.slice(0, SECURITY_LIST_LIMIT);
    var rows = visibleSessions.map(function(s){
      var active = String(s.status || '').toLowerCase() === 'active';
      var canRevoke = active && !s.isCurrent && s.id;
      var actions = s.isCurrent
        ? '<span class="pet-v110-note" style="padding:8px 10px">هذه هي الجلسة الحالية</span>'
        : (canRevoke ? '<button class="pet-v110-btn danger" data-v110-action="active-session-revoke" data-device-id="'+esc(s.id)+'">إنهاء الجلسة</button>' : '');
      return '<div class="pet-v110-card" style="margin:10px 0;padding:14px">'
        + '<div style="display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">'
        + '<div style="min-width:240px;flex:1">'
        + '<div style="font-weight:900;color:#e5f3ff;margin-bottom:6px">🧭 '+esc(shortDeviceName({deviceName:s.deviceName, platform:s.platform}))+'</div>'
        + '<div style="font-size:12px;color:rgba(226,232,240,.76);line-height:1.8">'
        + 'المتصفح/النظام: '+esc(s.platform || s.browser || '—')+'<br>'
        + 'بدأت: '+esc(fmtDate(s.startedAt))+'<br>'
        + 'آخر نشاط: '+esc(fmtDate(s.lastActivityAt))+'<br>'
        + 'تنتهي: '+esc(fmtDate(s.expiresAt))
        + (s.logoutReason ? '<br>سبب الإنهاء: '+esc(s.logoutReason) : '')
        + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+sessionStatusLabel(s.status, !!s.isCurrent)+actions
        + '</div></div></div>';
    }).join('') + listToggleButton('active-sessions-toggle', sessions.length, activeSessionsExpanded);
    setSessionsBox(rows);
  };
  window.petV9ToggleActiveSessionsList = function(){
    activeSessionsExpanded = !activeSessionsExpanded;
    window.petV9RenderActiveSessions(activeSessionsCache || []);
  };
  window.petV9LoadActiveSessions = async function(){
    var box = byId('petV9ActiveSessionsBox');
    if(!box) return;
    setSessionsBox('<div class="pet-v110-note">جاري تحميل الجلسات النشطة...</div>');
    try{
      if(!window.PETATOEAuth || typeof window.PETATOEAuth.listActiveSessions !== 'function'){
        throw new Error('PETATOE_AUTH_SESSIONS_API_NOT_READY');
      }
      var res = await window.PETATOEAuth.listActiveSessions();
      if(!res || res.ok === false) throw new Error(sessionErrorMessage(res));
      window.petV9RenderActiveSessions(res.sessions || []);
    }catch(err){
      setSessionsBox('<div class="pet-v110-note" style="border-color:rgba(248,113,113,.45);color:#fecaca">'+esc(sessionErrorMessage(err))+'</div>');
    }
  };

  window.petV9RevokeActiveSession = async function(sessionId){
    sessionId = String(sessionId || '').trim();
    if(!sessionId) return;
    if(!confirm('إنهاء هذه الجلسة؟ سيتم إجبار هذا الجهاز على تسجيل الدخول مرة أخرى.')) return;
    try{
      if(!window.PETATOEAuth || typeof window.PETATOEAuth.revokeActiveSession !== 'function'){
        throw new Error('PETATOE_AUTH_SESSIONS_API_NOT_READY');
      }
      var res = await window.PETATOEAuth.revokeActiveSession(sessionId);
      if(!res || res.ok === false) throw new Error(sessionErrorMessage(res));
      if(window.PETATOEUI && typeof window.PETATOEUI.toast === 'function') window.PETATOEUI.toast('تم إنهاء الجلسة');
      await window.petV9LoadActiveSessions();
    }catch(err){
      setSessionsBox('<div class="pet-v110-note" style="border-color:rgba(248,113,113,.45);color:#fecaca">'+esc(sessionErrorMessage(err))+'</div>');
    }
  };

  window.petV9RevokeAllActiveSessions = async function(){
    if(!confirm('إنهاء كل الجلسات الأخرى؟ ستبقى هذه الجلسة الحالية فقط مفتوحة.')) return;
    try{
      if(!window.PETATOEAuth || typeof window.PETATOEAuth.revokeAllActiveSessions !== 'function'){
        throw new Error('PETATOE_AUTH_SESSIONS_API_NOT_READY');
      }
      var res = await window.PETATOEAuth.revokeAllActiveSessions(true);
      if(!res || res.ok === false) throw new Error(sessionErrorMessage(res));
      var count = Number(res.revokedCount || 0);
      if(window.PETATOEUI && typeof window.PETATOEUI.toast === 'function') window.PETATOEUI.toast(count ? ('تم إنهاء '+count+' جلسة') : 'لا توجد جلسات أخرى لإنهائها');
      await window.petV9LoadActiveSessions();
    }catch(err){
      setSessionsBox('<div class="pet-v110-note" style="border-color:rgba(248,113,113,.45);color:#fecaca">'+esc(sessionErrorMessage(err))+'</div>');
    }
  };
})();


/* PETATOE v9 S4.5.7 — Security Activity real loader
   Shows server-side login_history events produced by MFA/session/trusted-device flows.
   It intentionally uses the existing PETATOEAuth Edge Function bridge so no service-role
   access is exposed to the browser. */
(function(){
  function byId(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function fmtDate(v){try{if(!v)return '—';var d=new Date(v);if(isNaN(d.getTime()))return '—';return d.toLocaleString('ar-SA')}catch(_){return '—'}}
  function setActivityBox(html){var box=byId('petV9SecurityActivityBox');if(box)box.innerHTML=html}
  function activityLabel(t, ok){
    var label={
      login:'تسجيل دخول', failed_login:'فشل تسجيل الدخول', logout:'تسجيل خروج',
      mfa_challenge:'إرسال MFA OTP', mfa_verify:'تحقق MFA',
      password_reset_requested:'طلب إعادة كلمة المرور', password_reset_completed:'اكتمال إعادة كلمة المرور',
      trusted_device_added:'إضافة جهاز موثوق', trusted_device_revoked:'إلغاء جهاز موثوق', trusted_device_used:'استخدام جهاز موثوق',
      session_started:'بدء جلسة', session_ended:'إنهاء جلسة', session_revoked:'إلغاء جلسة',
      sessions_revoked_all:'إنهاء كل الجلسات', sessions_force_revoked:'إنهاء جبري للجلسات',
      session_expired:'انتهاء جلسة', session_idle_timeout:'انتهاء بسبب الخمول', account_locked:'قفل الحساب', account_unlocked:'فتح الحساب'
    }[String(t||'')] || String(t||'حدث أمني');
    var cls=ok===false?'danger':(String(t||'').indexOf('failed')>-1?'danger':'ok');
    return '<span class="pet-v110-badge '+cls+'">'+esc(label)+'</span>';
  }
  function activityErrorMessage(error){
    var msg = error && (error.message || error.error || error.details || error);
    msg = String(msg || 'UNKNOWN_ERROR');
    if(msg.indexOf('login_history') !== -1 || msg.indexOf('Could not find') !== -1){
      return 'جدول سجل الأمان غير جاهز أو يحتاج تحديث SQL الخاص بالمرحلة S4.5.7.';
    }
    return 'تعذر تحميل سجل الأمان: ' + msg;
  }
  var SECURITY_ACTIVITY_LIMIT = 4;
  var securityActivityExpanded = false;
  var securityActivityCache = [];
  function activityToggleButton(total){
    if(total <= SECURITY_ACTIVITY_LIMIT) return '';
    var remaining = Math.max(0, total - SECURITY_ACTIVITY_LIMIT);
    var label = securityActivityExpanded ? 'إخفاء' : ('عرض المزيد (+' + remaining + ')');
    return '<div class="pet-v110-actions" style="justify-content:center;margin-top:10px"><button class="pet-v110-btn blue" data-v110-action="security-activity-toggle">'+esc(label)+'</button></div>';
  }
  window.petV9RenderSecurityActivity = function(events){
    events = Array.isArray(events) ? events : [];
    securityActivityCache = events.slice();
    if(!events.length){
      setActivityBox('<div class="pet-v110-note">لا توجد أحداث أمنية مسجلة لهذا المستخدم حتى الآن.</div>');
      return;
    }
    var visibleEvents = securityActivityExpanded ? events : events.slice(0, SECURITY_ACTIVITY_LIMIT);
    var rows = visibleEvents.map(function(e){
      var reason = e.failureReason ? '<div class="pet-v110-note" style="margin-top:6px">السبب: '+esc(e.failureReason)+'</div>' : '';
      return '<div class="pet-v110-card" style="margin:8px 0;padding:10px;border-radius:14px">'
        + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+activityLabel(e.eventType, e.success)+'<span class="pet-v110-badge info">'+esc(fmtDate(e.createdAt))+'</span>'+(e.success===false?'<span class="pet-v110-badge danger">فشل</span>':'<span class="pet-v110-badge ok">نجاح</span>')+'</div>'
        + '<div class="pet-v110-note" style="margin-top:8px">المستخدم: '+esc(e.usernameAttempted || '—')+' — MFA: '+(e.mfaRequired?'مطلوب':'غير مطلوب')+' — جهاز موثوق: '+(e.trustedDeviceUsed?'نعم':'لا')+'</div>'
        + reason
        + '</div>';
    }).join('') + activityToggleButton(events.length);
    setActivityBox(rows);
  };
  window.petV9ToggleSecurityActivityList = function(){
    securityActivityExpanded = !securityActivityExpanded;
    window.petV9RenderSecurityActivity(securityActivityCache || []);
  };
  window.petV9LoadSecurityActivity = async function(){
    var box=byId('petV9SecurityActivityBox');
    if(!box) return;
    setActivityBox('<div class="pet-v110-note">جاري تحميل سجل الأمان...</div>');
    try{
      if(!window.PETATOEAuth || typeof window.PETATOEAuth.listSecurityActivity !== 'function'){
        throw new Error('PETATOEAuth.listSecurityActivity is not available');
      }
      var res = await window.PETATOEAuth.listSecurityActivity();
      if(!res || res.ok === false) throw new Error(activityErrorMessage(res));
      window.petV9RenderSecurityActivity(res.events || []);
    }catch(err){
      setActivityBox('<div class="pet-v110-note" style="border-color:rgba(248,113,113,.45);color:#fecaca">'+esc(activityErrorMessage(err))+'</div>');
    }
  };
})();
