/* PETATOE v3.8.151 - Real Permissions Split
   User-level CRUD permissions module. The matrix depends on real users only.
   Settings core renders this module without keeping permission logic inside settings.js. */
(function(){
  'use strict';
  var USERS_KEY='app_users', USER_PERMS_KEY='app_user_permissions', CURRENT_KEY='app_current_user_ref';
  var roleNames={superadmin:'Super Admin',super_admin:'Super Admin',admin:'Admin',manager:'Manager',operations_manager:'Operations Manager',accountant:'Accountant',sales:'Sales Manager',fleet:'Fleet Manager',driver:'Driver',groomer:'Groomer',driver_groomer:'Driver / Groomer',viewer:'Viewer'};
  var screenPerms=[
    ['dashboardManagement','Dashboard الإدارة','لوحة المؤشرات المالية والإدارية للإدارة فقط'],
    ['dashboardOperations','Dashboard التشغيل','لوحة تشغيل مبسطة للسائقين والجرومرز ومشرفي التشغيل'],
    ['sales','فواتير المبيعات','إضافة وتعديل وحذف فواتير البيع اليدوية والمستوردة'],
    ['customers','العملاء','بيانات العملاء وتحليلاتهم وسجلاتهم'],
    ['services','الخدمات / الأصناف','أصناف الخدمات وأسعارها وتصنيفاتها'],
    ['appointments','إدارة المواعيد','تسجيل ومتابعة مواعيد جلسات العملاء'],
    ['vehicleOperations','تشغيل السيارات','تنفيذ جلسات اليوم والتحصيل وحركة السيارات'],
    ['vehicleOperationsReports','تقارير تشغيل السيارات','عرض وتحليل تقارير تشغيل السيارات والتحصيل'],
    ['operationKpis','مؤشرات الأداء التشغيلية','مؤشرات KPI الخاصة بالتشغيل والجودة'],
    ['vehicles','السيارات','إدارة السيارات وخزن السيارات والتقارير المرتبطة'],
    ['vaults','الخزن','الخزن الرئيسية والفرعية وخزن السيارات'],
    ['treasury','الخزينة','الحركات المالية وكشف الحساب والأرصدة'],
    ['expenses','المصروفات','المصروفات التشغيلية ومراكز التكلفة'],
    ['obligations','الالتزامات','الالتزامات الشهرية والسداد والحذف'],
    ['commissions','العمولات','الشرائح واحتساب العمولات والأرشيف'],
    ['commissionStatement','كشف العمولة','عرض كشف العمولة الخاص بالمستخدم فقط'],
    ['payroll','إدارة الرواتب','إدارة الموظفين وكشوف الرواتب واعتمادات الصرف'],
    ['salarySlip','كشف الراتب','عرض كشف الراتب الخاص بالموظف فقط'],
    ['childrenExpenses','مصروفات الأبناء','متابعة مصروفات الأبناء حسب صلاحية المستخدم'],
    ['reports','التقارير والتحليلات','التقارير الذكية والتحليلات ومركز الأعمال'],
    ['settings','الإعدادات العامة','إعدادات النظام والعملة والهدف واللغة'],
    ['setup','التهيئة / البيانات المرجعية','الخدمات والسيارات والعملاء والخزن داخل Master Data'],
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
    ['operations_close_session','تشغيل السيارات - إغلاق جلسة'],
    ['operations_reopen_session','تشغيل السيارات - إعادة فتح جلسة'],
    ['operations_confirm_session','تشغيل السيارات - تأكيد جلسة'],
    ['operations_edit_confirmed_session','تشغيل السيارات - تعديل جلسة مؤكدة'],
    ['vehicle_ops_create_trip','تشغيل السيارات - إنشاء رحلة'],
    ['vehicle_ops_edit_trip','تشغيل السيارات - تعديل رحلة/تحصيل'],
    ['vehicle_ops_cancel_trip','تشغيل السيارات - إلغاء رحلة'],
    ['vehicle_ops_reopen_trip','تشغيل السيارات - فتح مرة أخرى'],
    ['vehicle_ops_approve_trip','تشغيل السيارات - اعتماد الرحلة'],
    ['vehicle_ops_print','تقارير تشغيل السيارات - طباعة'],
    ['vehicle_ops_export','تقارير تشغيل السيارات - تصدير'],
    ['vehicle_ops_export_excel','تقارير تشغيل السيارات - تصدير Excel'],
    ['vehicle_ops_export_pdf','تقارير تشغيل السيارات - تصدير PDF'],
    ['vehicle_ops_view_reports','تقارير تشغيل السيارات - عرض'],
    ['vehicle_ops_view_kpis','مؤشرات التشغيل - عرض']
  ];
  var permissionModules=[
    {id:'home',icon:'🏠',title:'الرئيسية',hint:'فصل Dashboard الإدارة عن Dashboard التشغيل',screens:['dashboardManagement','dashboardOperations'],specials:[]},
    {id:'operations',icon:'🚗',title:'إدارة التشغيل',hint:'تشغيل السيارات منفصل عن تقارير التشغيل ومؤشرات الأداء',screens:['appointments','vehicleOperations','vehicleOperationsReports','operationKpis'],specials:['vehicle_ops_create_trip','vehicle_ops_edit_trip','vehicle_ops_cancel_trip','vehicle_ops_reopen_trip','vehicle_ops_approve_trip','operations_close_session','operations_reopen_session','operations_confirm_session','operations_edit_confirmed_session','vehicle_ops_print','vehicle_ops_export','vehicle_ops_export_excel','vehicle_ops_export_pdf','vehicle_ops_view_reports','vehicle_ops_view_kpis']},
    {id:'salary',icon:'💵',title:'الرواتب والعمولات',hint:'صلاحيات الموظف الشخصية منفصلة عن إدارة الرواتب',screens:['salarySlip','commissionStatement','payroll','commissions'],specials:['payroll_cancel_approval']},
    {id:'sales',icon:'🛒',title:'المبيعات والعملاء',hint:'الفواتير والعملاء والخدمات والتقارير العامة',screens:['sales','customers','services','reports'],specials:['export_pdf','export_excel','view_profit','edit_targets']},
    {id:'finance',icon:'💰',title:'الخزنة والحسابات',hint:'الخزن والحركات المالية والمصروفات والالتزامات',screens:['vaults','treasury','expenses','obligations'],specials:['hard_delete','edit_closed']},
    {id:'fleet',icon:'🚐',title:'السيارات والمخازن',hint:'إدارة السيارات وربط التشغيل بالسيارات',screens:['vehicles'],specials:[]},
    {id:'children',icon:'👶',title:'مصروفات الأبناء',hint:'مصروفات الأبناء وميزانيتها وتقاريرها',screens:['childrenExpenses'],specials:['children_expenses_budget','children_expenses_export']},
    {id:'admin',icon:'⚙️',title:'الإدارة والإعدادات',hint:'إدارة المستخدمين والصلاحيات والتهيئة والأمان',screens:['settings','setup','users','permissions','audit'],specials:['manage_users','manage_permissions','backup','restore','manage_security','data_quality']}
  ];
  function S(){return null}
  var __petV139SelectedUser='';
  var __petV139ActiveModule='home';
  function identity(){return window.PETATOEIdentityStore||window.PETATOESupabaseRepository||null}
  function read(k,d){return d}
  function write(k,v){}
  function esc(s){return String(s==null?'':s).replace(/[&<>'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function defaultAdmin(){return {id:'u_admin',username:'Admin',fullName:'Admin',role:'superadmin',role_code:'super_admin',status:'active'}}
  function seedUsers(){
    try{var ids=identity(); if(ids&&typeof ids.load==='function') ids.load(); if(ids&&typeof ids.usersSync==='function'){var u=ids.usersSync()||[]; if(u.length) return u;}}catch(e){try{console.warn('PETATOE permissions users load failed',e)}catch(_){}}
    return [defaultAdmin()];
  }
  function users(api){if(api&&typeof api.users==='function'){var au=api.users(); if(Array.isArray(au)&&au.length)return au;}return seedUsers()}
  function userPermStore(){try{var ids=identity(); if(ids&&typeof ids.permissionsSync==='function'){var p=ids.permissionsSync()||{}; return p&&typeof p==='object'?p:{}}}catch(e){try{console.warn('PETATOE permissions store load failed',e)}catch(_){}} return {}}
  function saveUserPermStore(p){try{var ids=identity(); if(ids&&typeof ids.savePermissions==='function') return ids.savePermissions(p||{});}catch(e){try{console.warn('PETATOE permissions store save failed',e)}catch(_){}} return null}
  function isSuperUser(u){var role=String((u&&u.role)||'').trim().toLowerCase(), roleN=role.replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'), id=String((u&&(u.id||u.userId||u.uid))||'').trim().toLowerCase(), name=String((u&&(u.username||u.name||u.fullName||u.login))||'').trim().toLowerCase(), job=String((u&&(u.job||u.title||u.position))||'').trim().toLowerCase();return !!(u&&(roleN==='superadmin'||roleN==='super_admin'||role.indexOf('super')>-1||role.indexOf('سوبر')>-1||id==='u_admin'||id==='admin'||name==='admin'||name==='superadmin'||job.indexOf('super')>-1||job.indexOf('سوبر')>-1))}
  function fullUserPerm(){var o={screens:{},special:{},vehicleScope:defaultVehicleScope()};screenPerms.forEach(function(s){o.screens[s[0]]={view:true,add:true,edit:true,delete:true}});specialPerms.forEach(function(s){o.special[s[0]]=true});return o}
  function normalizeRole(u){return String((u&&(u.role||u.role_code||u.job||u.title))||'').trim().toLowerCase().replace(/[‏‎]/g,'').replace(/\s+/g,'_').replace(/-/g,'_')}
  function emptyUserPerm(){var o={screens:{},special:{},vehicleScope:defaultVehicleScope()};screenPerms.forEach(function(s){o.screens[s[0]]={view:false,add:false,edit:false,delete:false}});specialPerms.forEach(function(s){o.special[s[0]]=false});return o}
  function grantScreen(o,k,actions){if(!o.screens[k])return;o.screens[k].view=actions.indexOf('view')>-1;o.screens[k].add=actions.indexOf('add')>-1;o.screens[k].edit=actions.indexOf('edit')>-1;o.screens[k].delete=actions.indexOf('delete')>-1}
  function defaultUserPerm(u){
    if(isSuperUser(u))return fullUserPerm();
    var o=emptyUserPerm(), r=normalizeRole(u);
    if(r==='driver'||r==='groomer'||r==='driver_groomer'){
      grantScreen(o,'dashboardOperations',['view']);
      grantScreen(o,'vehicleOperations',['view','edit']);
      grantScreen(o,'salarySlip',['view']);
      grantScreen(o,'commissionStatement',['view']);
      ['vehicle_ops_edit_trip','operations_confirm_session','operations_close_session'].forEach(function(k){o.special[k]=true});
      return o;
    }
    if(r==='viewer'){
      ['dashboardManagement','reports','sales','customers'].forEach(function(k){grantScreen(o,k,['view'])});
      return o;
    }
    if(r==='accountant'){
      ['dashboardManagement','sales','customers','treasury','vaults','expenses','obligations','salarySlip','commissionStatement','payroll','commissions','reports'].forEach(function(k){grantScreen(o,k,['view'])});
      ['sales','treasury','expenses','obligations','payroll'].forEach(function(k){grantScreen(o,k,['view','add','edit'])});
      o.special.export_pdf=true;o.special.export_excel=true;o.special.payroll_cancel_approval=true;
      return o;
    }
    if(r==='fleet'||r==='operations_manager'||r==='dispatcher'){
      ['dashboardOperations','appointments','vehicleOperations','vehicleOperationsReports','operationKpis','vehicles','salarySlip','commissionStatement'].forEach(function(k){grantScreen(o,k,['view'])});
      ['appointments','vehicleOperations'].forEach(function(k){grantScreen(o,k,['view','add','edit'])});
      ['vehicle_ops_create_trip','vehicle_ops_edit_trip','vehicle_ops_cancel_trip','vehicle_ops_reopen_trip','vehicle_ops_approve_trip','operations_close_session','operations_reopen_session','operations_confirm_session','operations_edit_confirmed_session','vehicle_ops_view_reports','vehicle_ops_view_kpis','vehicle_ops_export','vehicle_ops_export_excel','vehicle_ops_export_pdf','vehicle_ops_print'].forEach(function(k){o.special[k]=true});
      return o;
    }
    if(r==='admin'||r==='manager'){
      ['dashboardManagement','sales','customers','services','appointments','vehicleOperations','vehicleOperationsReports','operationKpis','vehicles','vaults','treasury','expenses','obligations','commissions','commissionStatement','payroll','salarySlip','childrenExpenses','reports','settings','setup','users','permissions','audit'].forEach(function(k){grantScreen(o,k,['view','add','edit'])});
      ['users','permissions'].forEach(function(k){grantScreen(o,k,['view','add','edit','delete'])});
      specialPerms.forEach(function(s){o.special[s[0]]=true});
      return o;
    }
    grantScreen(o,'dashboardOperations',['view']);
    grantScreen(o,'salarySlip',['view']);
    grantScreen(o,'commissionStatement',['view']);
    return o;
  }
  function applyVehicleOpsDefaultSpecials(o){
    o=o||{screens:{},special:{}};o.special=o.special||{};
    var v=o.screens&&o.screens.vehicleOperations||{};
    if(v.add){o.special.vehicle_ops_create_trip=true;}
    if(v.edit){o.special.vehicle_ops_edit_trip=true;}
    return o;
  }
  // PETATOE v8.0.2 Phase 12: strict user identity resolution for permissions.
  // Root cause: the old getUserById() returned us[0] when the requested user was not matched.
  // If us[0] was Super Admin, normal users could inherit full permissions during runtime checks.
  // PETATOE v8.0.2 Phase 15: strict user identity resolution.
  // Runtime permissions must never match a user by display name or fallback to another record.
  // Matching priority: stable technical ids first, then username/login/email only when unique.
  function normalizeIdentityValue(v){return String(v==null?'':v).trim().toLowerCase()}
  function primaryUserKeys(u){
    var out=[],seen={};
    function add(v){v=String(v==null?'':v).trim();var k=v.toLowerCase();if(k&&!seen[k]){seen[k]=1;out.push(v)}}
    if(u&&typeof u==='object'){add(u.id);add(u.userId);add(u.uid);add(u.supabase_id);add(u.row_id)}
    else add(u);
    return out;
  }
  function loginUserKeys(u){
    var out=[],seen={};
    function add(v){v=String(v==null?'':v).trim();var k=v.toLowerCase();if(k&&!seen[k]){seen[k]=1;out.push(v)}}
    if(u&&typeof u==='object'){add(u.username);add(u.login);add(u.email)}
    else add(u);
    return out;
  }
  function permissionStoreKeys(u){
    var out=[],seen={};
    function add(v){v=String(v==null?'':v).trim();var k=v.toLowerCase();if(k&&!seen[k]){seen[k]=1;out.push(v)}}
    primaryUserKeys(u).forEach(add); loginUserKeys(u).forEach(add);
    return out;
  }
  function findUniqueByLoginKey(us,key){
    key=normalizeIdentityValue(key); if(!key)return null;
    var matches=(us||[]).filter(function(x){
      return loginUserKeys(x).map(normalizeIdentityValue).indexOf(key)>-1;
    });
    return matches.length===1?matches[0]:null;
  }
  function samePrimaryUserKey(u,ref){
    var a=primaryUserKeys(u).map(normalizeIdentityValue), b=primaryUserKeys(ref).map(normalizeIdentityValue);
    return a.some(function(x){return b.indexOf(x)>-1});
  }
  function getUserById(uid){
    var us=seedUsers(), ref=(uid&&typeof uid==='object')?uid:{id:uid,username:uid};
    if(!uid&&uid!==0)return null;
    var primary=us.find(function(x){return samePrimaryUserKey(x,ref)});
    if(primary)return primary;
    var loginKeys=loginUserKeys(ref);
    for(var i=0;i<loginKeys.length;i++){
      var unique=findUniqueByLoginKey(us,loginKeys[i]);
      if(unique)return unique;
    }
    return null;
  }
  function permissionRecordFor(store,u){
    store=store||{};
    var keys=permissionStoreKeys(u);
    for(var i=0;i<keys.length;i++){
      if(Object.prototype.hasOwnProperty.call(store,keys[i]))return {found:true,perm:store[keys[i]]||{}};
    }
    return {found:false,perm:{}};
  }
  function getUserPerm(uid){
    var u=getUserById(uid);
    if(!u)return emptyUserPerm();
    if(isSuperUser(u))return fullUserPerm();
    var store=userPermStore(), rec=permissionRecordFor(store,u), saved=rec.perm||{};
    // PETATOE v8.0.2 Phase 14: strict runtime permission source of truth.
    // Runtime access is controlled only by the saved per-user permission record.
    // Role defaults remain templates for creation/reset buttons, but they must not grant access automatically.
    var base=emptyUserPerm();
    if(!rec.found)return base;
    screenPerms.forEach(function(s){var k=s[0], src=(saved.screens&&saved.screens[k])||{};base.screens[k]=Object.assign(base.screens[k]||{},src)});
    specialPerms.forEach(function(s){var k=s[0];if(saved.special&&Object.prototype.hasOwnProperty.call(saved.special,k))base.special[k]=!!saved.special[k]});
    base.vehicleScope=normalizeVehicleScope(saved.vehicleScope||base.vehicleScope);
    return base
  }
  function saveUserPerm(uid,perm){var u=getUserById(uid);if(!u||isSuperUser(u))return Promise.resolve({ok:false,skipped:true});var key=(primaryUserKeys(u)[0]||loginUserKeys(u)[0]||uid);var store=userPermStore();store[key]=perm;try{var ids=identity(); if(ids&&typeof ids.savePermission==='function') return ids.savePermission(key,perm);}catch(e){try{console.warn('PETATOE save permission failed',e)}catch(_){}}return saveUserPermStore(store)||Promise.resolve({ok:true})}
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
    try{
      var ops=window.PETATOEOperationsStorage;
      if(ops&&typeof ops.readMasterDataSync==='function'){
        var md=ops.readMasterDataSync()||{};
        (md.vehicleStaffLinks||md.vehicleAssignments||md.vehicles||[]).forEach(function(v){addVehicleUnique(out,seen,v.id||v.vehicle||v.name||v.car,v.vehicle||v.name||v.car||v.id,'operations')});
      }
    }catch(e){}
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
  function currentUserId(){
    try{if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function'){var au=window.PETATOEAuth.currentUser(); if(au&&(au.id||au.userId||au.uid||au.username||au.login||au.email)) return au;}}catch(e){}
    try{if(window.__PETATOE_ACTIVE_USER__&&(window.__PETATOE_ACTIVE_USER__.id||window.__PETATOE_ACTIVE_USER__.username||window.__PETATOE_ACTIVE_USER__.email)) return window.__PETATOE_ACTIVE_USER__;}catch(e){}
    try{if(window.currentUser&&(window.currentUser.id||window.currentUser.username||window.currentUser.email)) return window.currentUser;}catch(e){}
    return '';
  }
  function can(uid,screen,action){uid=uid||currentUserId();if(!uid)return false;var u=getUserById(uid);if(!u)return false;if(isSuperUser(u))return true;var p=getUserPerm(uid);return !!(p.screens&&p.screens[screen]&&p.screens[screen][action||'view'])}
  function canSpecial(uid,key){uid=uid||currentUserId();if(!uid)return false;var u=getUserById(uid);if(!u)return false;if(isSuperUser(u))return true;var p=getUserPerm(uid);return !!(p.special&&p.special[key])}
  function screenByKey(k){return screenPerms.find(function(s){return s[0]===k})||[k,k,'']}
  function specialByKey(k){return specialPerms.find(function(s){return s[0]===k})||[k,k]}
  function getModuleById(id){return permissionModules.find(function(m){return m.id===id})||permissionModules[0]}
  function normalizeActiveModule(){
    if(!permissionModules.some(function(m){return m.id===__petV139ActiveModule}))__petV139ActiveModule=(permissionModules[0]||{}).id||'home';
    return __petV139ActiveModule;
  }
  function moduleTabsHtml(){var active=normalizeActiveModule();return '<div class="pet-v139-module-tabs">'+permissionModules.map(function(m){var cls='pet-v139-module-tab'+(m.id===active?' active':'');return '<button type="button" class="'+cls+'" data-v139-set-module="'+esc(m.id)+'"><span class="pet-v139-module-icon">'+esc(m.icon)+'</span><b>'+esc(m.title)+'</b></button>'}).join('')+'</div>'}
  function actionCheckbox(screenKey,actionKey,checked,locked){return '<td><input class="pet-v139-check" type="checkbox" data-v139-screen="'+esc(screenKey)+'" data-v139-action="'+esc(actionKey)+'" '+(checked?'checked':'')+' '+(locked?'disabled':'')+'></td>'}
  function moduleActionChecked(m,p,actionKey){
    var keys=(m&&m.screens)||[];
    if(!keys.length)return false;
    return keys.every(function(k){return !!(p.screens&&p.screens[k]&&p.screens[k][actionKey])});
  }
  function moduleSectionHtml(m,p,locked){
    var rows=(m.screens||[]).map(function(k){var scr=screenByKey(k), sp=p.screens[k]||{};return '<tr><td class="pet-v139-screen-name"><b>'+esc(scr[1])+'</b><small>'+esc(scr[2])+'</small></td>'+crudActions.map(function(a){return actionCheckbox(k,a[0],!!sp[a[0]],locked)}).join('')+'</tr>'}).join('');
    var header=crudActions.map(function(a){var checked=moduleActionChecked(m,p,a[0]);return '<th><label class="pet-v139-bulk-head"><input class="pet-v139-check pet-v139-bulk-check" type="checkbox" data-v139-bulk-action="'+esc(a[0])+'" '+(checked?'checked':'')+' '+(locked?'disabled':'')+'> <span>'+esc(a[1])+'</span></label></th>'}).join('');
    var specials=(m.specials||[]).map(function(k){var x=specialByKey(k);return '<label class="pet-v139-special pet-v139-special-erp"><input class="pet-v139-check" type="checkbox" data-v139-special="'+esc(k)+'" '+(p.special&&p.special[k]?'checked':'')+' '+(locked?'disabled':'')+'> <span>'+esc(x[1])+'</span></label>'}).join('');
    return '<section class="pet-v139-module-section active" id="petV139Module_'+esc(m.id)+'" data-v139-current-module="'+esc(m.id)+'"><div class="pet-v139-module-head"><div><h3>'+esc(m.icon)+' '+esc(m.title)+'</h3><p>'+esc(m.hint||'')+'</p></div><span class="pet-v139-module-badge">'+((m.screens||[]).length)+' شاشات</span></div><div class="pet-v139-perm-table erp"><table><thead><tr><th>الشاشة / الوظيفة</th>'+header+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+(specials?'<div class="pet-v139-special-box"><h4>صلاحيات إضافية داخل '+esc(m.title)+'</h4><div class="pet-v139-special-grid erp">'+specials+'</div></div>':'')+'</section>';
  }
  function renderPermissionsBody(api){
    var us=users(api), selected=__petV139SelectedUser||currentUserId()||((us[0]||{}).id||'');
    if(!us.some(function(u){return String(u.id)===String(selected)})&&us[0])selected=us[0].id;
    __petV139SelectedUser=selected;
    var u=us.find(function(x){return String(x.id)===String(selected)})||us[0]||{}, p=getUserPerm(selected), locked=isSuperUser(u);
    var opts=us.map(function(x){return '<option value="'+esc(x.id)+'" '+(String(x.id)===String(selected)?'selected':'')+'>'+esc((x.fullName||x.username||x.id)+' - '+(x.username||''))+'</option>'}).join('');
    var active=normalizeActiveModule(), activeModule=getModuleById(active);
    var modules=moduleSectionHtml(activeModule,p,locked);
    var usedSpecials={}; permissionModules.forEach(function(m){(m.specials||[]).forEach(function(k){usedSpecials[k]=true})});
    var orphanSpecials='';
    if(active==='admin'){
      orphanSpecials=specialPerms.filter(function(x){return !usedSpecials[x[0]]}).map(function(x){return '<label class="pet-v139-special pet-v139-special-erp"><input class="pet-v139-check" type="checkbox" data-v139-special="'+esc(x[0])+'" '+(p.special&&p.special[x[0]]?'checked':'')+' '+(locked?'disabled':'')+'> <span>'+esc(x[1])+'</span></label>'}).join('');
    }
    var vehicleScopeHtml='';
    if(active==='operations'||active==='fleet'){
      var vehicleScope=normalizeVehicleScope(p.vehicleScope), vehicleList=getVehicleList();
      var vehicleChecks=vehicleList.map(function(v){var key=String(v.id||v.name||'');var checked=vehicleScope.allVehicles||vehicleScope.vehicles.indexOf(key)>-1||vehicleScope.vehicles.indexOf(v.name)>-1;return '<label class="pet-v139-special pet-v139-special-erp"><input class="pet-v139-check" type="checkbox" data-v139-vehicle="'+esc(key)+'" '+(checked?'checked':'')+' '+(locked||vehicleScope.allVehicles?'disabled':'')+'> <span>'+esc(v.name)+(v.meta?'<small style="opacity:.7"> — '+esc(v.meta)+'</small>':'')+'</span></label>'}).join('')||'<div class="pet-v110-note">لا توجد سيارات مسجلة حاليًا. يمكن إضافة السيارات من شاشة التهيئة أو إدارة السيارات.</div>';
      vehicleScopeHtml='<section class="pet-v139-module-section"><div class="pet-v139-module-head"><div><h3>🚐 ربط تشغيل السيارات بالسيارات</h3><p>تحديد السيارات المسموح للمستخدم بتشغيلها أو عرض تقاريرها.</p></div></div><label class="pet-v139-special pet-v139-special-erp"><input class="pet-v139-check" type="checkbox" id="petV139AllVehicles" data-v139-all-vehicles="1" '+(vehicleScope.allVehicles?'checked':'')+' '+(locked?'disabled':'')+'> <span>كل السيارات الحالية والمستقبلية</span></label><div class="pet-v139-special-grid erp" id="petV139VehicleScopeGrid">'+vehicleChecks+'</div></section>';
    }
    return '<div class="pet-v139-user-permissions pet-v139-erp-ui">'
      +'<div class="pet-v139-hero"><div><h3>🔐 إدارة الصلاحيات</h3><p>تنظيم ERP واضح: القسم ← الشاشة ← عرض / إضافة / تعديل / حذف. يتم عرض القسم المحدد فقط لضمان عدم تداخل الصلاحيات.</p></div><div class="pet-v139-info-pill">'+(locked?'Super Admin كامل الصلاحيات':'القسم الحالي: '+esc(activeModule.title))+'</div></div>'
      +'<div class="pet-v139-control-card"><div class="pet-v139-user-select-row"><div><label>المستخدم</label><select id="petV139UserSelect" data-v139-select-user="1">'+opts+'</select></div><div class="pet-v139-selected-user">المستخدم المحدد: <b>'+esc(u.fullName||u.username||'-')+'</b><br>اسم الدخول: <b>'+esc(u.username||'-')+'</b> — الدور الحالي: <b>'+esc(roleNames[normalizeRole(u)]||roleNames[u.role]||u.role||'-')+'</b></div><div class="pet-v139-template-actions"><button class="pet-v110-btn primary" data-v110-action="save-user-permissions" '+(locked?'disabled':'')+'>💾 حفظ التغييرات</button><button class="pet-v110-btn blue" data-v110-action="grant-read-only" '+(locked?'disabled':'')+'>عرض فقط</button><button class="pet-v110-btn green" data-v110-action="grant-driver-groomer" '+(locked?'disabled':'')+'>قالب سائق/جرومر</button><button class="pet-v110-btn green" data-v110-action="grant-operational" '+(locked?'disabled':'')+'>قالب تشغيلي</button><button class="pet-v110-btn danger" data-v110-action="reset-user-permissions" '+(locked?'disabled':'')+'>إرجاع الافتراضي</button></div></div>'+(locked?'<div class="pet-v139-warn">⚠️ هذا المستخدم Super Admin، صلاحياته كاملة ومحميّة ولا يمكن تعطيلها من هذه الشاشة.</div>':'')+'</div>'
      +moduleTabsHtml()
      +'<div class="pet-v139-layout"><div class="pet-v139-modules">'+modules+(orphanSpecials?'<section class="pet-v139-module-section"><div class="pet-v139-module-head"><div><h3>🔐 صلاحيات عامة أخرى</h3><p>صلاحيات عامة غير مرتبطة بشاشة واحدة.</p></div></div><div class="pet-v139-special-grid erp">'+orphanSpecials+'</div></section>':'')+vehicleScopeHtml+'</div><aside class="pet-v139-help"><div class="pet-v139-help-card"><h3>ℹ️ معلومات</h3><p>اختر القسم من الأعلى. مربع الاختيار في رأس العمود يحدد أو يلغي كل صلاحيات هذا العمود داخل القسم الحالي فقط.</p></div><div class="pet-v139-help-card"><h3>💡 قوالب أساسية</h3><ul><li>Driver/Groomer: Dashboard التشغيل + كشف الراتب + كشف العمولة + تشغيل السيارات فقط.</li><li>Operations: تشغيل السيارات وتقارير التشغيل.</li><li>Accountant: المبيعات والخزنة والرواتب.</li><li>Super Admin: كل الصلاحيات.</li></ul></div></aside></div>'
      +'</div>';
  }
  function clonePerm(p){try{return JSON.parse(JSON.stringify(p||{screens:{},special:{}}))}catch(e){return {screens:{},special:{}}}}
  window.petV139SelectUser=function(uid){__petV139SelectedUser=uid||'';if(window.__PETATOE_SETTINGS_API__&&window.__PETATOE_SETTINGS_API__.render)window.__PETATOE_SETTINGS_API__.render('permissions')};
  window.petV139ReadFormPerm=function(){
    var uid=(document.getElementById('petV139UserSelect')||{}).value||__petV139SelectedUser;
    var o=clonePerm(getUserPerm(uid));
    screenPerms.forEach(function(s){if(!o.screens[s[0]])o.screens[s[0]]={view:false,add:false,edit:false,delete:false}});
    specialPerms.forEach(function(s){if(!o.special)o.special={}; if(!Object.prototype.hasOwnProperty.call(o.special,s[0]))o.special[s[0]]=false});
    document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){var sc=c.getAttribute('data-v139-screen'),ac=c.getAttribute('data-v139-action');if(!o.screens[sc])o.screens[sc]={view:false,add:false,edit:false,delete:false};o.screens[sc][ac]=!!c.checked});
    document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){o.special[c.getAttribute('data-v139-special')]=!!c.checked});
    var allVeh=document.getElementById('petV139AllVehicles');
    if(allVeh){o.vehicleScope={allVehicles:!!allVeh.checked,vehicles:[]};document.querySelectorAll('#settings [data-v139-vehicle]').forEach(function(c){if(c.checked)o.vehicleScope.vehicles.push(c.getAttribute('data-v139-vehicle'))});}
    else{o.vehicleScope=normalizeVehicleScope(o.vehicleScope)}
    return {uid:uid,perm:o};
  };
  window.petV139SaveUserPermissions=async function(){var api=window.__PETATOE_SETTINGS_API__||{}, f=window.petV139ReadFormPerm(), u=users(api).find(function(x){return String(x.id)===String(f.uid)});if(!u){toast('اختر مستخدم أولاً');return}if(isSuperUser(u)){toast('Super Admin كامل الصلاحيات ومحمي');return}var res=await saveUserPerm(f.uid,f.perm);if(res&&res.ok===false){toast('فشل حفظ الصلاحيات: '+(res.error||''));return}try{window.dispatchEvent(new CustomEvent('petatoe:permissionschanged',{detail:{userId:f.uid}}));document.dispatchEvent(new CustomEvent('petatoe:permissionschanged',{detail:{userId:f.uid}}));}catch(e){}if(api.audit)api.audit('User Permissions Updated','Permissions saved for '+(u.username||u.id),'warn');toast('تم حفظ صلاحيات المستخدم');if(api.render)api.render('permissions')};
  window.petV139GrantReadOnly=function(){
    document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){c.checked=c.getAttribute('data-v139-action')==='view'});
    document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){c.checked=false});
    var av=document.getElementById('petV139AllVehicles');if(av){av.checked=true;window.petV139ToggleVehicleScope&&window.petV139ToggleVehicleScope(true)}
    window.petV139SyncBulkHeaders&&window.petV139SyncBulkHeaders();
    toast('تم تجهيز صلاحية العرض فقط للقسم الحالي، اضغط حفظ للتأكيد')
  };
  window.petV139GrantDriverGroomer=function(){
    var f=window.petV139ReadFormPerm(), p=emptyUserPerm();
    grantScreen(p,'dashboardOperations',['view']);
    grantScreen(p,'vehicleOperations',['view','edit']);
    grantScreen(p,'salarySlip',['view']);
    grantScreen(p,'commissionStatement',['view']);
    ['vehicle_ops_edit_trip','operations_confirm_session','operations_close_session'].forEach(function(k){p.special[k]=true});
    p.vehicleScope={allVehicles:true,vehicles:[]};
    saveUserPerm(f.uid,p).then(function(res){
      if(res&&res.ok===false){toast('فشل تطبيق قالب السائق/الجرومر: '+(res.error||''));return}
      try{document.dispatchEvent(new CustomEvent('petatoe:permissionschanged',{detail:{userId:f.uid}}));window.dispatchEvent(new CustomEvent('petatoe:permissionschanged',{detail:{userId:f.uid}}));}catch(e){}
      toast('تم تطبيق قالب السائق/الجرومر');
      if(window.__PETATOE_SETTINGS_API__&&window.__PETATOE_SETTINGS_API__.render)window.__PETATOE_SETTINGS_API__.render('permissions');
    });
  };
  window.petV139GrantOperational=function(){
    var f=window.petV139ReadFormPerm(), p=emptyUserPerm();
    ['dashboardOperations','appointments','vehicleOperations','vehicleOperationsReports','operationKpis','salarySlip','commissionStatement'].forEach(function(k){grantScreen(p,k,['view'])});
    ['appointments','vehicleOperations'].forEach(function(k){grantScreen(p,k,['view','add','edit'])});
    ['vehicle_ops_create_trip','vehicle_ops_edit_trip','vehicle_ops_cancel_trip','vehicle_ops_reopen_trip','vehicle_ops_approve_trip','operations_close_session','operations_reopen_session','operations_confirm_session','operations_edit_confirmed_session','vehicle_ops_view_reports','vehicle_ops_view_kpis','vehicle_ops_export','vehicle_ops_export_excel','vehicle_ops_export_pdf','vehicle_ops_print'].forEach(function(k){p.special[k]=true});
    p.vehicleScope={allVehicles:true,vehicles:[]};
    saveUserPerm(f.uid,p).then(function(res){
      if(res&&res.ok===false){toast('فشل تطبيق القالب التشغيلي: '+(res.error||''));return}
      try{document.dispatchEvent(new CustomEvent('petatoe:permissionschanged',{detail:{userId:f.uid}}));window.dispatchEvent(new CustomEvent('petatoe:permissionschanged',{detail:{userId:f.uid}}));}catch(e){}
      toast('تم تطبيق القالب التشغيلي');
      if(window.__PETATOE_SETTINGS_API__&&window.__PETATOE_SETTINGS_API__.render)window.__PETATOE_SETTINGS_API__.render('permissions');
    });
  };
  window.petV139ResetUserPermissions=async function(){var api=window.__PETATOE_SETTINGS_API__||{}, uid=(document.getElementById('petV139UserSelect')||{}).value||__petV139SelectedUser, u=users(api).find(function(x){return x.id===uid});if(!u)return;if(!confirm('إرجاع صلاحيات هذا المستخدم للوضع الافتراضي؟'))return;var st=userPermStore();delete st[uid];try{var ids=identity(); if(ids&&typeof ids.deletePermission==='function') await ids.deletePermission(uid); else await saveUserPermStore(st);}catch(e){await saveUserPermStore(st);}if(api.audit)api.audit('User Permissions Reset','Default permissions for '+(u.username||uid),'warn');toast('تم إرجاع صلاحيات المستخدم');if(api.render)api.render('permissions')};
  window.petV139ToggleVehicleScope=function(force){var all=document.getElementById('petV139AllVehicles');var checked=typeof force==='boolean'?force:!!(all&&all.checked);document.querySelectorAll('#settings [data-v139-vehicle]').forEach(function(c){c.disabled=checked;c.checked=checked?true:c.checked});};
  document.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('[data-v139-set-module]');if(!t)return;__petV139ActiveModule=t.getAttribute('data-v139-set-module')||'home';if(window.__PETATOE_SETTINGS_API__&&window.__PETATOE_SETTINGS_API__.render)window.__PETATOE_SETTINGS_API__.render('permissions');});
  window.petV139SyncBulkHeaders=function(){var section=document.querySelector('#settings [data-v139-current-module]');if(!section)return;crudActions.forEach(function(a){var inputs=[].slice.call(section.querySelectorAll('[data-v139-action="'+a[0]+'"]'));var head=section.querySelector('[data-v139-bulk-action="'+a[0]+'"]');if(head)head.checked=!!inputs.length&&inputs.every(function(x){return x.checked})})};
  document.addEventListener('change',function(e){var t=e.target;if(!t)return;if(t.matches&&t.matches('[data-v139-bulk-action]')){var act=t.getAttribute('data-v139-bulk-action');var section=t.closest('[data-v139-current-module]')||document.querySelector('#settings [data-v139-current-module]');if(section){section.querySelectorAll('[data-v139-action="'+act+'"]').forEach(function(c){if(!c.disabled)c.checked=!!t.checked});window.petV139SyncBulkHeaders&&window.petV139SyncBulkHeaders();}}else if(t.matches&&t.matches('[data-v139-screen][data-v139-action]')){window.petV139SyncBulkHeaders&&window.petV139SyncBulkHeaders();}if(t&&t.id==='petV139AllVehicles')window.petV139ToggleVehicleScope(!!t.checked)});
  function getVehicleScope(uid){var p=getUserPerm(uid||currentUserId());return normalizeVehicleScope(p.vehicleScope)}
  function canAccessVehicle(uid,vehicle){var u=getUserById(uid||currentUserId());if(isSuperUser(u))return true;var scope=getVehicleScope(uid);if(scope.allVehicles)return true;var key=normalizeVehicleKey(vehicle&&typeof vehicle==='object'?(vehicle.id||vehicle.name||vehicle.plate):vehicle);return !!key&&scope.vehicles.some(function(x){return normalizeVehicleKey(x)===key})}
  window.PETATOEPermissions={screenPerms:screenPerms,crudActions:crudActions,specialPerms:specialPerms,userPermStore:userPermStore,saveUserPermStore:saveUserPermStore,isSuperUser:isSuperUser,fullUserPerm:fullUserPerm,defaultUserPerm:defaultUserPerm,getUserPerm:getUserPerm,saveUserPerm:saveUserPerm,can:can,canSpecial:canSpecial,getVehicleList:getVehicleList,getVehicleScope:getVehicleScope,canAccessVehicle:canAccessVehicle,applyVehicleOpsDefaultSpecials:applyVehicleOpsDefaultSpecials,renderPermissionsBody:renderPermissionsBody};
})();
