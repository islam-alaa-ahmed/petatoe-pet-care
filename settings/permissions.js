/* PETATOE v3.8.151 - Real Permissions Split
   User-level CRUD permissions module. The matrix depends on real users only.
   Settings core renders this module without keeping permission logic inside settings.js. */
(function(){
  'use strict';
  var USERS_KEY='app_users', USER_PERMS_KEY='app_user_permissions', CURRENT_KEY='app_current_user_ref';
  var roleNames={superadmin:'Super Admin',admin:'Admin',accountant:'Accountant',sales:'Sales Manager',fleet:'Fleet Manager',viewer:'Viewer'};
  var screenPerms=[
    ['sales','فواتير المبيعات','إضافة وتعديل وحذف فواتير البيع اليدوية والمستوردة'],
    ['customers','العملاء','بيانات العملاء وتحليلاتهم وسجلاتهم'],
    ['services','الخدمات / الأصناف','أصناف الخدمات وأسعارها وتصنيفاتها'],
    ['vehicles','السيارات','إدارة السيارات وخزن السيارات والتقارير المرتبطة'],
    ['vaults','الخزن','الخزن الرئيسية والفرعية وخزن السيارات'],
    ['treasury','الخزينة','الحركات المالية وكشف الحساب والأرصدة'],
    ['expenses','المصروفات','المصروفات التشغيلية ومراكز التكلفة'],
    ['obligations','الالتزامات','الالتزامات الشهرية والسداد والحذف'],
    ['commissions','العمولات','الشرائح واحتساب العمولات والأرشيف'],
    ['payroll','الرواتب','إدارة الموظفين وكشوف الرواتب واعتمادات الصرف'],
    ['salarySlip','كشف الراتب','عرض كشف الراتب الخاص بالموظف فقط'],
    ['commissionStatement','كشف العمولة','عرض كشف العمولة الخاص بالمستخدم فقط'],
    ['appointments','إدارة المواعيد','قسم خاص لتسجيل ومتابعة مواعيد جلسات العملاء'],
    ['vehicleOperations','تشغيل السيارات','إدارة جدول تشغيل السيارات اليومي وتقارير التشغيل وربط المستخدم بالسيارات المصرح بها'],
    ['childrenExpenses','مصروفات الأبناء','قسم خاص لمتابعة مصروفات الأبناء حسب صلاحية المستخدم'],
    ['reports','التقارير','التقارير الذكية والتحليلات ومركز الأعمال'],
    ['settings','الإعدادات العامة','إعدادات النظام والعملة والهدف واللغة'],
    ['setup','التهيئة','الخدمات والسيارات والعملاء والخزن داخل Master Data'],
    ['users','المستخدمين','إضافة وتعديل وحذف المستخدمين'],
    ['permissions','الصلاحيات','منح أو تعديل صلاحيات المستخدمين'],
    ['audit','السجل النظامي','عرض وتصدير ومسح سجل النشاط']
  ];
  var crudActions=[['view','عرض'],['add','إضافة'],['edit','تعديل'],['delete','حذف']];
  var specialPerms=[
    ['export_pdf','تصدير PDF'],
    ['export_excel','تصدير Excel'],
    ['backup','نسخ احتياطي'],
    ['restore','استعادة البيانات'],
    ['manage_users','إدارة المستخدمين'],
    ['manage_permissions','إدارة الصلاحيات'],
    ['hard_delete','حذف نهائي'],
    ['edit_closed','تعديل بعد الإغلاق'],
    ['view_profit','عرض الأرباح'],
    ['edit_targets','تعديل الأهداف'],
    ['manage_security','إدارة الأمان'],
    ['data_quality','فحص البيانات'],
    ['payroll_cancel_approval','إلغاء اعتماد الرواتب'],
    ['children_expenses_budget','مصروفات الأبناء - إدارة الميزانية'],
    ['children_expenses_export','مصروفات الأبناء - تصدير/طباعة التقارير'],
    ['operations_close_session','إدارة التشغيل - إغلاق الجلسات'],
    ['operations_reopen_session','إدارة التشغيل - إعادة فتح الجلسات'],
    ['operations_confirm_session','إدارة التشغيل - تأكيد الجلسات'],
    ['operations_edit_confirmed_session','إدارة التشغيل - تعديل جلسة مؤكدة'],
    ['vehicle_ops_create_trip','تشغيل السيارات - إنشاء رحلة'],
    ['vehicle_ops_edit_trip','تشغيل السيارات - تعديل رحلة/تحصيل'],
    ['vehicle_ops_cancel_trip','تشغيل السيارات - إلغاء رحلة'],
    ['vehicle_ops_reopen_trip','تشغيل السيارات - فتح مرة أخرى'],
    ['vehicle_ops_approve_trip','تشغيل السيارات - اعتماد الرحلة'],
    ['vehicle_ops_print','تشغيل السيارات - طباعة التشغيل'],
    ['vehicle_ops_export','تشغيل السيارات - تصدير تقارير التشغيل'],
    ['vehicle_ops_export_excel','تشغيل السيارات - تصدير Excel'],
    ['vehicle_ops_export_pdf','تشغيل السيارات - تصدير PDF'],
    ['vehicle_ops_view_reports','تشغيل السيارات - عرض تقارير التشغيل'],
    ['vehicle_ops_view_kpis','تشغيل السيارات - عرض مؤشرات التشغيل']
  ];
  function S(){return null}
  var __selectedUser='';
  function ID(){return window.PETATOEIdentityStore||null}
  function read(k,d){var ids=ID(); if(k===USERS_KEY&&ids&&ids.usersSync)return ids.usersSync(); if(k===USER_PERMS_KEY&&ids&&ids.permissionsSync)return ids.permissionsSync(); return d}
  function write(k,v){var ids=ID(); if(k===USERS_KEY&&ids&&ids.saveUsers){ids.saveUsers(v||[]);return} if(k===USER_PERMS_KEY&&ids&&ids.savePermissions){ids.savePermissions(v||{});return}}
  function esc(s){return String(s==null?'':s).replace(/[&<>'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function seedUsers(){var sec=window.PETATOEPasswordSecurity;var u=read(USERS_KEY,null);if(!Array.isArray(u)||!u.length){u=[{id:'u_admin',username:'Admin',fullName:'Admin',job:'Super Admin',phone:'',email:'',role:'superadmin',status:'active',createdAt:new Date().toISOString(),lastLogin:''}];write(USERS_KEY,u);__selectedUser='u_admin'}else if(sec&&sec.sanitizeUsers&&sec.sanitizeUsers(u)){write(USERS_KEY,u)}return u}
  function users(api){if(api&&typeof api.users==='function')return api.users();return seedUsers()}
  function userPermStore(){var p=read(USER_PERMS_KEY,{});return p&&typeof p==='object'?p:{}}
  function saveUserPermStore(p){write(USER_PERMS_KEY,p||{})}
  function isSuperUser(u){var role=String((u&&u.role)||'').trim().toLowerCase(), roleN=role.replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'), id=String((u&&(u.id||u.userId||u.uid))||'').trim().toLowerCase(), name=String((u&&(u.username||u.name||u.fullName||u.login))||'').trim().toLowerCase(), job=String((u&&(u.job||u.title||u.position))||'').trim().toLowerCase();return !!(u&&(roleN==='superadmin'||roleN==='super_admin'||role.indexOf('super')>-1||role.indexOf('سوبر')>-1||id==='u_admin'||id==='admin'||name==='admin'||name==='superadmin'||job.indexOf('super')>-1||job.indexOf('سوبر')>-1))}
  function fullUserPerm(){var o={screens:{},special:{},vehicleScope:defaultVehicleScope()};screenPerms.forEach(function(s){o.screens[s[0]]={view:true,add:true,edit:true,delete:true}});specialPerms.forEach(function(s){o.special[s[0]]=true});return o}
  function defaultUserPerm(u){if(isSuperUser(u))return fullUserPerm();var o={screens:{},special:{},vehicleScope:defaultVehicleScope()};screenPerms.forEach(function(s){o.screens[s[0]]={view:false,add:false,edit:false,delete:false}});specialPerms.forEach(function(s){o.special[s[0]]=false});return o}
  function applyVehicleOpsDefaultSpecials(o){
    o=o||{screens:{},special:{}};o.special=o.special||{};
    var v=o.screens&&o.screens.vehicleOperations||{};
    if(v.view){o.special.vehicle_ops_view_reports=true;o.special.vehicle_ops_view_kpis=true;o.special.vehicle_ops_print=true;o.special.vehicle_ops_export=true;o.special.vehicle_ops_export_excel=true;o.special.vehicle_ops_export_pdf=true;}
    if(v.add){o.special.vehicle_ops_create_trip=true;}
    if(v.edit){o.special.vehicle_ops_edit_trip=true;}
    return o;
  }
  function getUserById(uid){var us=seedUsers();return us.find(function(x){return x.id===uid})||us[0]}
  function getUserPerm(uid){var u=getUserById(uid);if(isSuperUser(u))return fullUserPerm();var store=userPermStore(), base=defaultUserPerm(u), saved=store[u.id]||{};screenPerms.forEach(function(s){var k=s[0], src=(saved.screens&&saved.screens[k])||{};base.screens[k]=Object.assign(base.screens[k]||{},src)});specialPerms.forEach(function(s){var k=s[0];if(saved.special&&Object.prototype.hasOwnProperty.call(saved.special,k))base.special[k]=!!saved.special[k]});base.vehicleScope=normalizeVehicleScope(saved.vehicleScope||base.vehicleScope);return base}
  function saveUserPerm(uid,perm){var u=getUserById(uid);if(!u||isSuperUser(u))return;var store=userPermStore();store[uid]=perm;saveUserPermStore(store)}
  function normalizeVehicleKey(v){return String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,' ')}
  function addVehicleUnique(out,seen,id,name,meta){
    name=String(name||'').trim(); id=String(id||name||'').trim();
    if(!name&&!id)return;
    var key=normalizeVehicleKey(id||name);
    if(!key||seen[key])return;
    seen[key]=1;
    out.push({id:id||name,name:name||id,meta:meta||''});
  }
  function getVehicleList(){
    var out=[],seen={};
    var master=(window.PETATOESetup&&window.PETATOESetup.getMasterData?window.PETATOESetup.getMasterData():{})||{};
    (master.cars||[]).forEach(function(v){addVehicleUnique(out,seen,v.id||v.code||v.name,v.name||v.plate||v.code,'setup')});
    var fleet=(window.PETATOEFleet&&window.PETATOEFleet.getData?window.PETATOEFleet.getData():{})||{};
    (fleet.vehicles||[]).forEach(function(v){addVehicleUnique(out,seen,v.id||v.name||v.plate,v.name||v.plate||v.id,'fleet')});
    var ops=(window.PETATOEOperationsStorage&&window.PETATOEOperationsStorage.readMasterDataSync?window.PETATOEOperationsStorage.readMasterDataSync():{})||{};
    (ops.vehicleAssignments||[]).forEach(function(v){addVehicleUnique(out,seen,v.id||v.vehicle||v.name||v.car,v.vehicle||v.name||v.car||v.id,'operations')});
    if(!out.length){['VAN A','VAN B'].forEach(function(v){addVehicleUnique(out,seen,v,v,'default')})}
    return out.sort(function(a,b){return String(a.name).localeCompare(String(b.name),'ar')});
  }
  function defaultVehicleScope(){return {allVehicles:true,vehicles:[]}}
  function normalizeVehicleScope(scope){
    scope=scope&&typeof scope==='object'?scope:{};
    var list=Array.isArray(scope.vehicles)?scope.vehicles.map(function(x){return String(x||'').trim()}).filter(Boolean):[];
    return {allVehicles:scope.allVehicles!==false,vehicles:list};
  }
  function parseCurrentRef(raw){try{if(raw&&typeof raw==='object')return raw;var s=String(raw||'').trim();if(!s)return null;if((s.charAt(0)==='{'&&s.charAt(s.length-1)==='}')||(s.charAt(0)==='['&&s.charAt(s.length-1)===']'))return JSON.parse(s);return {id:s,username:s}}catch(_){return null}}
  function matchUserRef(us,ref){if(!ref)return null;var rid=String(ref.id||ref.userId||ref.uid||'').trim(), rn=String(ref.username||ref.name||ref.fullName||ref.login||'').trim().toLowerCase();return (us||[]).find(function(u){var uid=String(u.id||u.userId||u.uid||'').trim(), un=String(u.username||u.name||u.login||'').trim().toLowerCase(), fn=String(u.fullName||'').trim().toLowerCase();return (rid&&uid===rid)||(rid&&un===rid.toLowerCase())||(rid&&fn===rid.toLowerCase())||(rn&&un===rn)||(rn&&uid.toLowerCase()===rn)||(rn&&fn===rn)})||null}
  function storageValues(k){var a=[];try{if(window.PETATOE_CURRENT_USER_REF)a.push(String(window.PETATOE_CURRENT_USER_REF));}catch(_){}return a}
  function currentUserId(){var keys=[CURRENT_KEY,'petatoe_current_user_v139','petatoe_current_user_v2','petatoe_current_user','currentUser','PETATOE_CURRENT_USER'], us=seedUsers(), refs=[],seen={};function add(r){if(!r)return;var key='';try{key=JSON.stringify(r)}catch(_){key=String(r)}if(!seen[key]){seen[key]=true;refs.push(r)}}keys.forEach(function(k){storageValues(k).forEach(function(v){add(parseCurrentRef(v))})});for(var i=0;i<refs.length;i++){var m=matchUserRef(us,refs[i]);if(m&&isSuperUser(m))return m.id;if(isSuperUser(refs[i]))return refs[i].id||refs[i].username||'u_admin'}for(var j=0;j<refs.length;j++){var f=matchUserRef(us,refs[j]);if(f)return f.id;var r=refs[j];if(r&&(r.id||r.username))return r.id||r.username}
    var bootSuper=us.find(function(x){return isSuperUser(x)});
    return (bootSuper&&bootSuper.id)||'u_admin'}
  function can(uid,screen,action){uid=uid||currentUserId();if(!uid)return false;var u=getUserById(uid);if(isSuperUser(u))return true;var p=getUserPerm(uid);return !!(p.screens&&p.screens[screen]&&p.screens[screen][action||'view'])}
  function canSpecial(uid,key){uid=uid||currentUserId();if(!uid)return false;var u=getUserById(uid);if(isSuperUser(u))return true;var p=getUserPerm(uid);return !!(p.special&&p.special[key])}
  function renderPermissionsBody(api){
    var us=users(api), selected=__selectedUser||((us[0]||{}).id||'');
    if(!us.some(function(u){return u.id===selected})&&us[0])selected=us[0].id;
    var u=us.find(function(x){return x.id===selected})||us[0]||{}, p=getUserPerm(selected), locked=isSuperUser(u);
    var opts=us.map(function(x){return '<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc((x.fullName||x.username||x.id)+' - '+(x.username||''))+'</option>'}).join('');
    var rows=screenPerms.map(function(scr){var sp=p.screens[scr[0]]||{};return '<tr><td class="pet-v139-screen-name"><b>'+esc(scr[1])+'</b><small>'+esc(scr[2])+'</small></td>'+crudActions.map(function(a){var ck=!!sp[a[0]];return '<td><input class="pet-v139-check" type="checkbox" data-v139-screen="'+scr[0]+'" data-v139-action="'+a[0]+'" '+(ck?'checked':'')+' '+(locked?'disabled':'')+'></td>'}).join('')+'</tr>'}).join('');
    var specials=specialPerms.map(function(x){return '<label class="pet-v139-special"><input class="pet-v139-check" type="checkbox" data-v139-special="'+x[0]+'" '+(p.special&&p.special[x[0]]?'checked':'')+' '+(locked?'disabled':'')+'> <span>'+esc(x[1])+'</span></label>'}).join('');
    var vehicleScope=normalizeVehicleScope(p.vehicleScope), vehicleList=getVehicleList();
    var vehicleChecks=vehicleList.map(function(v){var key=String(v.id||v.name||'');var checked=vehicleScope.allVehicles||vehicleScope.vehicles.indexOf(key)>-1||vehicleScope.vehicles.indexOf(v.name)>-1;return '<label class="pet-v139-special"><input class="pet-v139-check" type="checkbox" data-v139-vehicle="'+esc(key)+'" '+(checked?'checked':'')+' '+(locked||vehicleScope.allVehicles?'disabled':'')+'> <span>'+esc(v.name)+(v.meta?'<small style="opacity:.7"> — '+esc(v.meta)+'</small>':'')+'</span></label>'}).join('')||'<div class="pet-v110-note">لا توجد سيارات مسجلة حاليًا. يمكن إضافة السيارات من شاشة التهيئة أو إدارة السيارات.</div>';
    var vehicleScopeHtml='<div class="pet-v110-card"><h3>🚐 ربط صلاحية تشغيل السيارات بالسيارات</h3><p>اختر السيارات التي يستطيع المستخدم تشغيلها أو عرض تقارير تشغيلها. عند تفعيل كل السيارات يتم السماح له بجميع السيارات الحالية والمستقبلية.</p><label class="pet-v139-special"><input class="pet-v139-check" type="checkbox" id="petV139AllVehicles" data-v139-all-vehicles="1" '+(vehicleScope.allVehicles?'checked':'')+' '+(locked?'disabled':'')+'> <span>كل السيارات الحالية والمستقبلية</span></label><div class="pet-v139-special-grid" id="petV139VehicleScopeGrid">'+vehicleChecks+'</div><div class="pet-v110-note">هذه الصلاحية تُحفظ مع المستخدم وتُستخدم كمرجع لتطبيق فلترة تشغيل السيارات في مراحل لاحقة بدون تغيير بيانات التشغيل الحالية.</div></div>';
    return '<div class="pet-v139-user-permissions">'
      +'<div class="pet-v110-card"><h3>👤 اختيار المستخدم الفعلي</h3><p>اختر مستخدم من المستخدمين المسجلين فعليًا في النظام، ثم امنحه صلاحيات داخل كل شاشة: عرض / إضافة / تعديل / حذف.</p><div class="pet-v139-user-select-row"><div><label>المستخدم</label><select id="petV139UserSelect" data-v139-select-user="1">'+opts+'</select></div><div class="pet-v139-selected-user">المستخدم المحدد: <b>'+esc(u.fullName||u.username||'-')+'</b><br>اسم الدخول: <b>'+esc(u.username||'-')+'</b> — الدور الحالي: <b>'+esc(roleNames[u.role]||u.role||'-')+'</b></div></div>'+(locked?'<div class="pet-v139-warn">⚠️ هذا المستخدم Super Admin، صلاحياته كاملة ومحميّة ولا يمكن تعطيلها من هذه الشاشة.</div>':'')+'</div>'
      +'<div class="pet-v110-card"><h3>🛡️ صلاحيات الشاشات</h3><p>هذه الصلاحيات تفصيلية لكل مستخدم فعلي، وليست أدوارًا وهمية.</p><div class="pet-v139-perm-table"><table><thead><tr><th>الشاشة</th>'+crudActions.map(function(a){return '<th>'+a[1]+'</th>'}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>'
      +vehicleScopeHtml
      +'<div class="pet-v110-card"><h3>🔐 صلاحيات خاصة</h3><p>صلاحيات عامة لا ترتبط بشاشة واحدة.</p><div class="pet-v139-special-grid">'+specials+'</div><div class="pet-v110-actions"><button class="pet-v110-btn primary" data-v110-action="save-user-permissions" '+(locked?'disabled':'')+'>💾 حفظ صلاحيات المستخدم</button><button class="pet-v110-btn blue" data-v110-action="grant-read-only" '+(locked?'disabled':'')+'>عرض فقط</button><button class="pet-v110-btn green" data-v110-action="grant-operational" '+(locked?'disabled':'')+'>صلاحيات تشغيلية</button><button class="pet-v110-btn danger" data-v110-action="reset-user-permissions" '+(locked?'disabled':'')+'>إرجاع الافتراضي</button></div></div>'
      +'</div>';
  }
  window.petV139SelectUser=function(uid){__selectedUser=uid||'';if(window.__PETATOE_SETTINGS_API__&&window.__PETATOE_SETTINGS_API__.render)window.__PETATOE_SETTINGS_API__.render('permissions')};
  window.petV139ReadFormPerm=function(){var uid=(document.getElementById('petV139UserSelect')||{}).value||__selectedUser, o={screens:{},special:{}};screenPerms.forEach(function(s){o.screens[s[0]]={view:false,add:false,edit:false,delete:false}});document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){var sc=c.getAttribute('data-v139-screen'),ac=c.getAttribute('data-v139-action');if(!o.screens[sc])o.screens[sc]={view:false,add:false,edit:false,delete:false};o.screens[sc][ac]=!!c.checked});specialPerms.forEach(function(s){o.special[s[0]]=false});document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){o.special[c.getAttribute('data-v139-special')]=!!c.checked});var allVeh=document.getElementById('petV139AllVehicles');o.vehicleScope={allVehicles:allVeh?!!allVeh.checked:true,vehicles:[]};document.querySelectorAll('#settings [data-v139-vehicle]').forEach(function(c){if(c.checked)o.vehicleScope.vehicles.push(c.getAttribute('data-v139-vehicle'))});return {uid:uid,perm:o}};
  window.petV139SaveUserPermissions=function(){var api=window.__PETATOE_SETTINGS_API__||{}, f=window.petV139ReadFormPerm(), u=users(api).find(function(x){return x.id===f.uid});if(!u){toast('اختر مستخدم أولاً');return}if(isSuperUser(u)){toast('Super Admin كامل الصلاحيات ومحمي');return}saveUserPerm(f.uid,f.perm);if(api.audit)api.audit('User Permissions Updated','Permissions saved for '+(u.username||u.id),'warn');toast('تم حفظ صلاحيات المستخدم');if(api.render)api.render('permissions')};
  window.petV139GrantReadOnly=function(){document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){c.checked=c.getAttribute('data-v139-action')==='view'});document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){c.checked=false});var av=document.getElementById('petV139AllVehicles');if(av){av.checked=true;window.petV139ToggleVehicleScope&&window.petV139ToggleVehicleScope(true)}toast('تم تجهيز صلاحية العرض فقط، اضغط حفظ للتأكيد')};
  window.petV139GrantOperational=function(){document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){var sc=c.getAttribute('data-v139-screen'),ac=c.getAttribute('data-v139-action');c.checked=(ac==='view'||ac==='add'||ac==='edit')&&['sales','customers','services','vehicles','vehicleOperations','vaults','treasury','expenses','obligations','commissions','reports'].indexOf(sc)>-1});document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){var k=c.getAttribute('data-v139-special');c.checked=['export_excel','export_pdf','data_quality','vehicle_ops_create_trip','vehicle_ops_edit_trip','vehicle_ops_print','vehicle_ops_export','vehicle_ops_export_excel','vehicle_ops_export_pdf','vehicle_ops_view_reports','vehicle_ops_view_kpis'].indexOf(k)>-1});var av=document.getElementById('petV139AllVehicles');if(av){av.checked=true;window.petV139ToggleVehicleScope&&window.petV139ToggleVehicleScope(true)}toast('تم تجهيز الصلاحيات التشغيلية، اضغط حفظ للتأكيد')};
  window.petV139ResetUserPermissions=function(){var api=window.__PETATOE_SETTINGS_API__||{}, uid=(document.getElementById('petV139UserSelect')||{}).value||__selectedUser, u=users(api).find(function(x){return x.id===uid});if(!u)return;if(!confirm('إرجاع صلاحيات هذا المستخدم للوضع الافتراضي؟'))return;var st=userPermStore();delete st[uid];saveUserPermStore(st);if(api.audit)api.audit('User Permissions Reset','Default permissions for '+(u.username||uid),'warn');toast('تم إرجاع صلاحيات المستخدم');if(api.render)api.render('permissions')};
  window.petV139ToggleVehicleScope=function(force){var all=document.getElementById('petV139AllVehicles');var checked=typeof force==='boolean'?force:!!(all&&all.checked);document.querySelectorAll('#settings [data-v139-vehicle]').forEach(function(c){c.disabled=checked;c.checked=checked?true:c.checked});};
  document.addEventListener('change',function(e){var t=e.target;if(t&&t.id==='petV139AllVehicles')window.petV139ToggleVehicleScope(!!t.checked)});
  function getVehicleScope(uid){var p=getUserPerm(uid||currentUserId());return normalizeVehicleScope(p.vehicleScope)}
  function canAccessVehicle(uid,vehicle){var u=getUserById(uid||currentUserId());if(isSuperUser(u))return true;var scope=getVehicleScope(uid);if(scope.allVehicles)return true;var key=normalizeVehicleKey(vehicle&&typeof vehicle==='object'?(vehicle.id||vehicle.name||vehicle.plate):vehicle);return !!key&&scope.vehicles.some(function(x){return normalizeVehicleKey(x)===key})}
  window.PETATOEPermissions={screenPerms:screenPerms,crudActions:crudActions,specialPerms:specialPerms,userPermStore:userPermStore,saveUserPermStore:saveUserPermStore,isSuperUser:isSuperUser,fullUserPerm:fullUserPerm,defaultUserPerm:defaultUserPerm,getUserPerm:getUserPerm,saveUserPerm:saveUserPerm,can:can,canSpecial:canSpecial,getVehicleList:getVehicleList,getVehicleScope:getVehicleScope,canAccessVehicle:canAccessVehicle,applyVehicleOpsDefaultSpecials:applyVehicleOpsDefaultSpecials,renderPermissionsBody:renderPermissionsBody};
})();
