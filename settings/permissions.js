/* PETATOE v3.8.151 - Real Permissions Split
   User-level CRUD permissions module. The matrix depends on real users only.
   Settings core renders this module without keeping permission logic inside settings.js. */
(function(){
  'use strict';
  var USERS_KEY='petatoe_users_v108', USER_PERMS_KEY='petatoe_user_crud_permissions_v139', CURRENT_KEY='petatoe_current_user_v108';
  var roleNames={
    superadmin:'Super Admin',super_admin:'Super Admin',admin:'Admin',manager:'Manager',operations_manager:'Operations Manager',
    dispatcher:'Dispatcher',driver:'Driver',groomer:'Groomer',accountant:'Accountant',hr:'HR',sales:'Sales',viewer:'Viewer',fleet:'Fleet Manager'
  };
  var permissionModules=[
    {id:'dashboard',label:'🏠 الرئيسية',desc:'لوحات الدخول حسب طبيعة الوظيفة'},
    {id:'operations',label:'🚗 إدارة التشغيل',desc:'الجلسات والسيارات وتشغيل الرحلات'},
    {id:'payroll',label:'💵 الرواتب والعمولات',desc:'كشوف العاملين وإدارة الرواتب والعمولات'},
    {id:'sales',label:'💰 المبيعات والعملاء',desc:'الفواتير والعملاء والخدمات'},
    {id:'finance',label:'🏦 الخزنة والحسابات',desc:'الخزنة والمصروفات والالتزامات'},
    {id:'inventory',label:'📦 المخازن والسيارات',desc:'المخزون والسيارات وخزن السيارات'},
    {id:'children',label:'👶 مصروفات الأبناء',desc:'مصروفات الأبناء والميزانيات'},
    {id:'reports',label:'📊 التقارير والتحليلات',desc:'التقارير الذكية والإدارة العليا'},
    {id:'admin',label:'⚙️ الإدارة والإعدادات',desc:'المستخدمين والصلاحيات والتهيئة والسجل'}
  ];
  var screenPerms=[
    ['dashboardManagement','Dashboard الإدارة','لوحة الإدارة والمؤشرات المالية والإدارية','dashboard'],
    ['dashboardOperations','Dashboard التشغيل','لوحة السائقين والجرومرز وجلسات اليوم','dashboard'],
    ['appointments','إدارة المواعيد','تخطيط وجدولة مواعيد الجلسات','operations'],
    ['appointmentsMaster','البيانات المرجعية للتشغيل','أنواع الحيوانات والسلالات والخدمات وبيانات التشغيل','operations'],
    ['vehicleOperations','تشغيل السيارات','تنفيذ جلسات اليوم، بدء/إنهاء الرحلات، والتحصيل','operations'],
    ['vehicleOperationsReports','تقارير تشغيل السيارات','تقارير تشغيل السيارات والتحصيل والأداء','operations'],
    ['operationKpis','مؤشرات الأداء التشغيلية','لوحات KPI للتشغيل والجودة','operations'],
    ['salarySlip','كشف الراتب','عرض كشف راتب المستخدم الحالي فقط','payroll'],
    ['commissionStatement','كشف العمولة','عرض كشف عمولة المستخدم الحالي فقط','payroll'],
    ['payroll','إدارة الرواتب','إنشاء كشوف الرواتب والاعتمادات','payroll'],
    ['commissions','إدارة العمولات','شرائح واحتساب العمولات والأرشيف','payroll'],
    ['sales','فواتير المبيعات','إضافة وتعديل وحذف فواتير البيع اليدوية والمستوردة','sales'],
    ['customers','العملاء','بيانات العملاء وتحليلاتهم وسجلاتهم','sales'],
    ['services','الخدمات / الأصناف','أصناف الخدمات وأسعارها وتصنيفاتها','sales'],
    ['treasury','الخزينة','الحركات المالية وكشف الحساب والأرصدة','finance'],
    ['vaults','الخزن','الخزن الرئيسية والفرعية وخزن السيارات','finance'],
    ['expenses','المصروفات','المصروفات التشغيلية ومراكز التكلفة','finance'],
    ['obligations','الالتزامات','الالتزامات الشهرية والسداد والحذف','finance'],
    ['warehouses','المخازن','الأصناف المخزنية والحركات والأرصدة','inventory'],
    ['vehicles','السيارات','تعريف السيارات وخزن السيارات','inventory'],
    ['childrenExpenses','مصروفات الأبناء','مصروفات الأبناء حسب صلاحية المستخدم','children'],
    ['reports','التقارير العامة','التقارير الأساسية والذكية والتحليلات','reports'],
    ['executive','الإدارة العليا','Executive Dashboard','reports'],
    ['settings','الإعدادات العامة','إعدادات النظام والعملة والهدف واللغة','admin'],
    ['setup','التهيئة','الخدمات والسيارات والعملاء والخزن داخل Master Data','admin'],
    ['users','المستخدمين','إضافة وتعديل وحذف المستخدمين','admin'],
    ['permissions','الصلاحيات','منح أو تعديل صلاحيات المستخدمين','admin'],
    ['audit','السجل النظامي','عرض وتصدير ومسح سجل النشاط','admin']
  ];
  var crudActions=[['view','عرض'],['add','إضافة'],['edit','تعديل'],['delete','حذف'],['export','تصدير'],['approve','اعتماد/إغلاق']];
  var specialPerms=[
    ['backup','الإدارة - نسخ احتياطي','admin'],
    ['restore','الإدارة - استعادة البيانات','admin'],
    ['manage_security','الإدارة - إدارة الأمان','admin'],
    ['data_quality','الإدارة - فحص البيانات','admin'],
    ['view_profit','التقارير - عرض الأرباح','reports'],
    ['edit_targets','التقارير - تعديل الأهداف','reports'],
    ['payroll_cancel_approval','الرواتب - إلغاء اعتماد الرواتب','payroll'],
    ['children_expenses_budget','مصروفات الأبناء - إدارة الميزانية','children'],
    ['children_expenses_export','مصروفات الأبناء - تصدير/طباعة التقارير','children'],
    ['operations_close_session','التشغيل - إغلاق الجلسات','operations'],
    ['operations_reopen_session','التشغيل - إعادة فتح الجلسات','operations'],
    ['operations_confirm_session','التشغيل - تأكيد الجلسات','operations'],
    ['operations_edit_confirmed_session','التشغيل - تعديل جلسة مؤكدة','operations']
  ];
  function moduleById(id){return permissionModules.find(function(m){return m.id===id})||permissionModules[0]}
  function roleKey(u){return String((u&&(u.role_code||u.role||u.job||u.title))||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_')}
  function S(){return window.PETATOEStorage||null}
  function read(k,d){var st=S();return st&&st.readJSON?st.readJSON(k,d):d}
  function write(k,v){var st=S();if(st&&st.writeJSON)st.writeJSON(k,v)}
  function esc(s){return String(s==null?'':s).replace(/[&<>'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function toast(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function seedUsers(){var sec=window.PETATOEPasswordSecurity;var u=read(USERS_KEY,null);if(!Array.isArray(u)||!u.length){u=[{id:'u_admin',username:'Admin',fullName:'Admin',job:'Super Admin',phone:'',email:'',role:'superadmin',status:'active',createdAt:new Date().toISOString(),lastLogin:''}];write(USERS_KEY,u);var st=S();if(st&&st.set)st.set(CURRENT_KEY,'u_admin')}else if(sec&&sec.sanitizeUsers&&sec.sanitizeUsers(u)){write(USERS_KEY,u)}return u}
  function users(api){if(api&&typeof api.users==='function')return api.users();return seedUsers()}
  function userPermStore(){var p=read(USER_PERMS_KEY,{});return p&&typeof p==='object'?p:{}}
  function saveUserPermStore(p){write(USER_PERMS_KEY,p||{})}
  function isSuperUser(u){var role=String((u&&u.role)||'').trim().toLowerCase(), roleN=role.replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_'), id=String((u&&(u.id||u.userId||u.uid))||'').trim().toLowerCase(), name=String((u&&(u.username||u.name||u.fullName||u.login))||'').trim().toLowerCase(), job=String((u&&(u.job||u.title||u.position))||'').trim().toLowerCase();return !!(u&&(roleN==='superadmin'||roleN==='super_admin'||role.indexOf('super')>-1||role.indexOf('سوبر')>-1||id==='u_admin'||id==='admin'||name==='admin'||name==='superadmin'||job.indexOf('super')>-1||job.indexOf('سوبر')>-1))}
  function blankPerm(){
    var o={screens:{},special:{},vehicleScope:defaultVehicleScope()};
    screenPerms.forEach(function(s){o.screens[s[0]]={view:false,add:false,edit:false,delete:false,export:false,approve:false}});
    specialPerms.forEach(function(s){o.special[s[0]]=false});
    return o;
  }
  function grant(o,screen,actions){
    if(!o.screens[screen]) o.screens[screen]={view:false,add:false,edit:false,delete:false,export:false,approve:false};
    (actions||['view']).forEach(function(a){o.screens[screen][a]=true});
  }
  function grantSpecial(o,keys){(keys||[]).forEach(function(k){o.special[k]=true})}
  function fullUserPerm(){
    var o=blankPerm();
    screenPerms.forEach(function(s){crudActions.forEach(function(a){o.screens[s[0]][a[0]]=true})});
    specialPerms.forEach(function(s){o.special[s[0]]=true});
    o.vehicleScope=defaultVehicleScope();
    return o;
  }
  function roleTemplate(role){
    role=String(role||'').trim().toLowerCase().replace(/[\u200f\u200e]/g,'').replace(/\s+/g,'_').replace(/-/g,'_');
    var o=blankPerm();
    if(role==='superadmin'||role==='super_admin') return fullUserPerm();
    if(role==='driver'||role==='groomer'){
      grant(o,'dashboardOperations',['view']);
      grant(o,'vehicleOperations',['view','edit']);
      grant(o,'salarySlip',['view']);
      grant(o,'commissionStatement',['view']);
      return o;
    }
    if(role==='dispatcher'){
      grant(o,'dashboardOperations',['view']);
      grant(o,'appointments',['view','add','edit']);
      grant(o,'vehicleOperations',['view','add','edit','approve']);
      grant(o,'vehicleOperationsReports',['view','export']);
      return o;
    }
    if(role==='operations_manager'||role==='fleet'){
      ['dashboardOperations','appointments','appointmentsMaster','vehicleOperations','vehicleOperationsReports','operationKpis'].forEach(function(k){grant(o,k,['view','add','edit','export','approve'])});
      grant(o,'vehicles',['view','add','edit']);
      return o;
    }
    if(role==='accountant'){
      ['dashboardManagement','sales','customers','treasury','vaults','expenses','obligations','payroll','commissions','salarySlip','commissionStatement','reports'].forEach(function(k){grant(o,k,['view','add','edit','export'])});
      grantSpecial(o,['view_profit','payroll_cancel_approval']);
      return o;
    }
    if(role==='manager'||role==='admin'){
      ['dashboardManagement','dashboardOperations','sales','customers','services','treasury','vaults','expenses','obligations','warehouses','vehicles','childrenExpenses','reports','executive','vehicleOperationsReports','operationKpis'].forEach(function(k){grant(o,k,['view','export'])});
      return o;
    }
    if(role==='sales'){
      ['dashboardManagement','sales','customers','services','reports'].forEach(function(k){grant(o,k,['view','add','edit','export'])});
      return o;
    }
    if(role==='hr'){
      ['dashboardManagement','payroll','commissions','salarySlip','commissionStatement','users','reports'].forEach(function(k){grant(o,k,['view','add','edit','export'])});
      return o;
    }
    if(role==='viewer'){
      ['dashboardManagement','reports'].forEach(function(k){grant(o,k,['view'])});
      return o;
    }
    return o;
  }
  function defaultUserPerm(u){
    if(isSuperUser(u)) return fullUserPerm();
    return roleTemplate(roleKey(u));
  }
  function applyVehicleOpsDefaultSpecials(o){ return o||blankPerm(); }
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
    var master=read('petatoe_master_setup_v120',{})||{};
    (master.cars||[]).forEach(function(v){addVehicleUnique(out,seen,v.id||v.code||v.name,v.name||v.plate||v.code,'setup')});
    var fleet=read('PETATOE_FLEET_MANAGEMENT_V1',{})||{};
    (fleet.vehicles||[]).forEach(function(v){addVehicleUnique(out,seen,v.id||v.name||v.plate,v.name||v.plate||v.id,'fleet')});
    var ops=read('appointmentsMasterData',{})||{};
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
  function storageValues(k){var a=[],st=S();try{var sv=window.sessionStorage&&window.sessionStorage.getItem(k);if(sv!==null&&sv!==undefined&&sv!=='')a.push(sv)}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('settings/permissions.js', _, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }try{var lv=window['localStorage']&&window['localStorage'].getItem(k);if(lv!==null&&lv!==undefined&&lv!==''&&a.indexOf(lv)===-1)a.push(lv)}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('settings/permissions.js', _, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }try{var v=st&&st.get?st.get(k,''):'';if(v&&a.indexOf(v)===-1)a.push(v)}catch(_){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('settings/permissions.js', _, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }return a}
  function currentUserId(){var keys=[CURRENT_KEY,'petatoe_current_user_v139','petatoe_current_user_v2','petatoe_current_user','currentUser','PETATOE_CURRENT_USER'], us=seedUsers(), refs=[],seen={};function add(r){if(!r)return;var key='';try{key=JSON.stringify(r)}catch(_){key=String(r)}if(!seen[key]){seen[key]=true;refs.push(r)}}keys.forEach(function(k){storageValues(k).forEach(function(v){add(parseCurrentRef(v))})});for(var i=0;i<refs.length;i++){var m=matchUserRef(us,refs[i]);if(m&&isSuperUser(m))return m.id;if(isSuperUser(refs[i]))return refs[i].id||refs[i].username||'u_admin'}for(var j=0;j<refs.length;j++){var f=matchUserRef(us,refs[j]);if(f)return f.id;var r=refs[j];if(r&&(r.id||r.username))return r.id||r.username}
    var bootSuper=us.find(function(x){return isSuperUser(x)});
    return (bootSuper&&bootSuper.id)||'u_admin'}
  function can(uid,screen,action){uid=uid||currentUserId();if(!uid)return false;var u=getUserById(uid);if(isSuperUser(u))return true;var p=getUserPerm(uid);return !!(p.screens&&p.screens[screen]&&p.screens[screen][action||'view'])}
  function canSpecial(uid,key){uid=uid||currentUserId();if(!uid)return false;var u=getUserById(uid);if(isSuperUser(u))return true;var p=getUserPerm(uid);return !!(p.special&&p.special[key])}
  function actionCell(screenKey, actionKey, checked, locked){
    return '<td><input class="pet-v139-check" type="checkbox" data-v139-screen="'+esc(screenKey)+'" data-v139-action="'+esc(actionKey)+'" '+(checked?'checked':'')+' '+(locked?'disabled':'')+'></td>';
  }
  function renderScreenRowsForModule(moduleId,p,locked){
    var rows=screenPerms.filter(function(scr){return (scr[3]||'dashboard')===moduleId}).map(function(scr){
      var sp=p.screens[scr[0]]||{};
      return '<tr data-perm-module="'+esc(moduleId)+'"><td class="pet-v139-screen-name"><b>'+esc(scr[1])+'</b><small>'+esc(scr[2])+'</small></td>'+crudActions.map(function(a){return actionCell(scr[0],a[0],!!sp[a[0]],locked)}).join('')+'</tr>';
    }).join('');
    return rows || '<tr><td colspan="'+(crudActions.length+1)+'"><div class="pet-v110-note">لا توجد شاشات في هذا القسم.</div></td></tr>';
  }
  function renderSpecialRowsForModule(moduleId,p,locked){
    return specialPerms.filter(function(x){return (x[2]||'admin')===moduleId}).map(function(x){return '<label class="pet-v139-special"><input class="pet-v139-check" type="checkbox" data-v139-special="'+esc(x[0])+'" '+(p.special&&p.special[x[0]]?'checked':'')+' '+(locked?'disabled':'')+'> <span>'+esc(x[1])+'</span></label>'}).join('')||'<div class="pet-v110-note">لا توجد صلاحيات خاصة في هذا القسم.</div>';
  }
  function roleTemplateButtons(locked){
    var roles=[['driver','سائق'],['groomer','جرومر'],['dispatcher','منسق تشغيل'],['operations_manager','مدير تشغيل'],['accountant','محاسب'],['manager','مدير'],['viewer','عرض فقط']];
    return roles.map(function(r){return '<button class="pet-v110-btn blue" data-v110-action="apply-role-template" data-role-template="'+esc(r[0])+'" '+(locked?'disabled':'')+'>'+esc(r[1])+'</button>'}).join('');
  }
  function renderPermissionsBody(api){
    var us=users(api), selected=((S()&&S().get)?S().get('pet_v139_selected_user',''):'')||((S()&&S().get)?S().get(CURRENT_KEY,''):'')||((us[0]||{}).id||'');
    if(!us.some(function(u){return u.id===selected})&&us[0])selected=us[0].id;
    var u=us.find(function(x){return x.id===selected})||us[0]||{}, p=getUserPerm(selected), locked=isSuperUser(u);
    var opts=us.map(function(x){return '<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc((x.fullName||x.username||x.id)+' - '+(x.username||''))+'</option>'}).join('');
    var moduleTabs=permissionModules.map(function(m,i){return '<button type="button" class="pet-v110-btn '+(i===0?'primary':'blue')+'" data-perm-module-tab="'+esc(m.id)+'">'+esc(m.label)+'</button>'}).join('');
    var moduleCards=permissionModules.map(function(m,i){
      return '<div class="pet-v110-card pet-v139-module-card" data-perm-module-card="'+esc(m.id)+'" style="'+(i===0?'':'display:none')+'"><h3>'+esc(m.label)+'</h3><p>'+esc(m.desc||'')+'</p><div class="pet-v139-perm-table"><table><thead><tr><th>الشاشة / الوظيفة</th>'+crudActions.map(function(a){return '<th>'+esc(a[1])+'</th>'}).join('')+'</tr></thead><tbody>'+renderScreenRowsForModule(m.id,p,locked)+'</tbody></table></div><div class="pet-v110-card" style="margin-top:14px"><h3>🔐 صلاحيات خاصة داخل هذا القسم</h3><div class="pet-v139-special-grid">'+renderSpecialRowsForModule(m.id,p,locked)+'</div></div></div>';
    }).join('');
    var vehicleScope=normalizeVehicleScope(p.vehicleScope), vehicleList=getVehicleList();
    var vehicleChecks=vehicleList.map(function(v){var key=String(v.id||v.name||'');var checked=vehicleScope.allVehicles||vehicleScope.vehicles.indexOf(key)>-1||vehicleScope.vehicles.indexOf(v.name)>-1;return '<label class="pet-v139-special"><input class="pet-v139-check" type="checkbox" data-v139-vehicle="'+esc(key)+'" '+(checked?'checked':'')+' '+(locked||vehicleScope.allVehicles?'disabled':'')+'> <span>'+esc(v.name)+(v.meta?'<small style="opacity:.7"> — '+esc(v.meta)+'</small>':'')+'</span></label>'}).join('')||'<div class="pet-v110-note">لا توجد سيارات مسجلة حاليًا. يمكن إضافة السيارات من شاشة التهيئة أو إدارة السيارات.</div>';
    var vehicleScopeHtml='<div class="pet-v110-card"><h3>🚐 ربط صلاحية تشغيل السيارات بالسيارات</h3><p>يُستخدم هذا الربط مع تشغيل السيارات فقط. كشف الراتب وكشف العمولة لا يحتاجان ربط سيارة.</p><label class="pet-v139-special"><input class="pet-v139-check" type="checkbox" id="petV139AllVehicles" data-v139-all-vehicles="1" '+(vehicleScope.allVehicles?'checked':'')+' '+(locked?'disabled':'')+'> <span>كل السيارات الحالية والمستقبلية</span></label><div class="pet-v139-special-grid" id="petV139VehicleScopeGrid">'+vehicleChecks+'</div></div>';
    return '<div class="pet-v139-user-permissions">'
      +'<div class="pet-v110-card"><h3>👤 اختيار المستخدم الفعلي</h3><p>اختر مستخدمًا ثم امنحه صلاحيات منظمة حسب القسم مثل أنظمة ERP. السائق والجرومر افتراضيًا: كشف الراتب + كشف العمولة + تشغيل السيارات فقط.</p><div class="pet-v139-user-select-row"><div><label>المستخدم</label><select id="petV139UserSelect" data-v139-select-user="1">'+opts+'</select></div><div class="pet-v139-selected-user">المستخدم المحدد: <b>'+esc(u.fullName||u.username||'-')+'</b><br>اسم الدخول: <b>'+esc(u.username||'-')+'</b> — الدور الحالي: <b>'+esc(roleNames[roleKey(u)]||roleNames[u.role]||u.role||'-')+'</b></div></div>'+(locked?'<div class="pet-v139-warn">⚠️ هذا المستخدم Super Admin، صلاحياته كاملة ومحميّة ولا يمكن تعطيلها من هذه الشاشة.</div>':'')+'</div>'
      +'<div class="pet-v110-card"><h3>🧩 قالب الدور الوظيفي</h3><p>استخدم قالبًا جاهزًا ثم عدّل التفاصيل عند الحاجة.</p><div class="pet-v110-actions">'+roleTemplateButtons(locked)+'</div></div>'
      +'<div class="pet-v110-card"><h3>🛡️ مصفوفة الصلاحيات الخاصة</h3><p>كل قسم مستقل: الشاشة لا تظهر في القائمة إلا إذا كان لديها أي صلاحية فعالة لهذا المستخدم.</p><div class="pet-v110-actions">'+moduleTabs+'</div></div>'
      +moduleCards
      +vehicleScopeHtml
      +'<div class="pet-v110-card"><div class="pet-v110-actions"><button class="pet-v110-btn primary" data-v110-action="save-user-permissions" '+(locked?'disabled':'')+'>💾 حفظ صلاحيات المستخدم</button><button class="pet-v110-btn blue" data-v110-action="grant-read-only" '+(locked?'disabled':'')+'>عرض فقط</button><button class="pet-v110-btn green" data-v110-action="grant-operational" '+(locked?'disabled':'')+'>صلاحيات تشغيلية</button><button class="pet-v110-btn danger" data-v110-action="reset-user-permissions" '+(locked?'disabled':'')+'>إرجاع الافتراضي</button></div></div>'
      +'</div>';
  }

  function applyRoleTemplateToForm(role){
    var tmpl=roleTemplate(role);
    document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){
      var sc=c.getAttribute('data-v139-screen'), ac=c.getAttribute('data-v139-action');
      c.checked=!!(tmpl.screens&&tmpl.screens[sc]&&tmpl.screens[sc][ac]);
    });
    document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){var k=c.getAttribute('data-v139-special');c.checked=!!(tmpl.special&&tmpl.special[k])});
    var av=document.getElementById('petV139AllVehicles');
    if(av){av.checked=true;window.petV139ToggleVehicleScope&&window.petV139ToggleVehicleScope(true)}
    toast('تم تطبيق قالب '+(roleNames[role]||role)+'، اضغط حفظ للتأكيد');
  }
  document.addEventListener('click',function(e){
    var tab=e.target&&e.target.closest&&e.target.closest('[data-perm-module-tab]');
    if(tab){
      e.preventDefault();
      var id=tab.getAttribute('data-perm-module-tab');
      document.querySelectorAll('#settings [data-perm-module-tab]').forEach(function(b){b.classList.toggle('primary',b===tab);b.classList.toggle('blue',b!==tab)});
      document.querySelectorAll('#settings [data-perm-module-card]').forEach(function(c){c.style.display=c.getAttribute('data-perm-module-card')===id?'':'none'});
      return;
    }
    var tpl=e.target&&e.target.closest&&e.target.closest('[data-role-template]');
    if(tpl){ e.preventDefault(); applyRoleTemplateToForm(tpl.getAttribute('data-role-template')); return; }
  });
  window.petV139SelectUser=function(uid){var st=S();if(st&&st.set)st.set('pet_v139_selected_user',uid||'');if(window.__PETATOE_SETTINGS_API__&&window.__PETATOE_SETTINGS_API__.render)window.__PETATOE_SETTINGS_API__.render('permissions')};
  window.petV139ReadFormPerm=function(){var uid=(document.getElementById('petV139UserSelect')||{}).value||((S()&&S().get)?S().get('pet_v139_selected_user',''):''), o={screens:{},special:{}};screenPerms.forEach(function(s){o.screens[s[0]]={};crudActions.forEach(function(a){o.screens[s[0]][a[0]]=false})});document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){var sc=c.getAttribute('data-v139-screen'),ac=c.getAttribute('data-v139-action');if(!o.screens[sc]){o.screens[sc]={};crudActions.forEach(function(a){o.screens[sc][a[0]]=false})};o.screens[sc][ac]=!!c.checked});specialPerms.forEach(function(s){o.special[s[0]]=false});document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){o.special[c.getAttribute('data-v139-special')]=!!c.checked});var allVeh=document.getElementById('petV139AllVehicles');o.vehicleScope={allVehicles:allVeh?!!allVeh.checked:true,vehicles:[]};document.querySelectorAll('#settings [data-v139-vehicle]').forEach(function(c){if(c.checked)o.vehicleScope.vehicles.push(c.getAttribute('data-v139-vehicle'))});return {uid:uid,perm:o}};
  window.petV139SaveUserPermissions=function(){var api=window.__PETATOE_SETTINGS_API__||{}, f=window.petV139ReadFormPerm(), u=users(api).find(function(x){return x.id===f.uid});if(!u){toast('اختر مستخدم أولاً');return}if(isSuperUser(u)){toast('Super Admin كامل الصلاحيات ومحمي');return}saveUserPerm(f.uid,f.perm);if(api.audit)api.audit('User Permissions Updated','Permissions saved for '+(u.username||u.id),'warn');toast('تم حفظ صلاحيات المستخدم');if(api.render)api.render('permissions')};
  window.petV139GrantReadOnly=function(){document.querySelectorAll('#settings [data-v139-screen][data-v139-action]').forEach(function(c){c.checked=c.getAttribute('data-v139-action')==='view'});document.querySelectorAll('#settings [data-v139-special]').forEach(function(c){c.checked=false});var av=document.getElementById('petV139AllVehicles');if(av){av.checked=true;window.petV139ToggleVehicleScope&&window.petV139ToggleVehicleScope(true)}toast('تم تجهيز صلاحية العرض فقط، اضغط حفظ للتأكيد')};
  window.petV139GrantOperational=function(){
    applyRoleTemplateToForm('operations_manager');
    toast('تم تجهيز صلاحيات مدير التشغيل، اضغط حفظ للتأكيد')
  };
  window.petV139ResetUserPermissions=function(){var api=window.__PETATOE_SETTINGS_API__||{}, uid=(document.getElementById('petV139UserSelect')||{}).value||((S()&&S().get)?S().get('pet_v139_selected_user',''):''), u=users(api).find(function(x){return x.id===uid});if(!u)return;if(!confirm('إرجاع صلاحيات هذا المستخدم للوضع الافتراضي؟'))return;var st=userPermStore();delete st[uid];saveUserPermStore(st);if(api.audit)api.audit('User Permissions Reset','Default permissions for '+(u.username||uid),'warn');toast('تم إرجاع صلاحيات المستخدم');if(api.render)api.render('permissions')};
  window.petV139ToggleVehicleScope=function(force){var all=document.getElementById('petV139AllVehicles');var checked=typeof force==='boolean'?force:!!(all&&all.checked);document.querySelectorAll('#settings [data-v139-vehicle]').forEach(function(c){c.disabled=checked;c.checked=checked?true:c.checked});};
  document.addEventListener('change',function(e){var t=e.target;if(t&&t.id==='petV139AllVehicles')window.petV139ToggleVehicleScope(!!t.checked)});
  function getVehicleScope(uid){var p=getUserPerm(uid||currentUserId());return normalizeVehicleScope(p.vehicleScope)}
  function canAccessVehicle(uid,vehicle){var u=getUserById(uid||currentUserId());if(isSuperUser(u))return true;var scope=getVehicleScope(uid);if(scope.allVehicles)return true;var key=normalizeVehicleKey(vehicle&&typeof vehicle==='object'?(vehicle.id||vehicle.name||vehicle.plate):vehicle);return !!key&&scope.vehicles.some(function(x){return normalizeVehicleKey(x)===key})}
  window.PETATOEPermissions={screenPerms:screenPerms,crudActions:crudActions,specialPerms:specialPerms,userPermStore:userPermStore,saveUserPermStore:saveUserPermStore,isSuperUser:isSuperUser,fullUserPerm:fullUserPerm,defaultUserPerm:defaultUserPerm,getUserPerm:getUserPerm,saveUserPerm:saveUserPerm,can:can,canSpecial:canSpecial,getVehicleList:getVehicleList,getVehicleScope:getVehicleScope,canAccessVehicle:canAccessVehicle,applyVehicleOpsDefaultSpecials:applyVehicleOpsDefaultSpecials,renderPermissionsBody:renderPermissionsBody};
})();
