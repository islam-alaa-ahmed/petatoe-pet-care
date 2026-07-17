/* v3.11.7 namespace compatibility: keep legacy dashboard entrypoint explicit without duplicate function declarations. */
window.renderDashboardAll = window.renderDashboardAll || (typeof renderDashboardAll==='function' ? renderDashboardAll : null);
window.renderDashboardKpis = window.renderDashboardKpis || (typeof renderDashboardKpis==='function' ? renderDashboardKpis : null);
if(!window.renderAll && window.renderDashboardAll){ window.renderAll = window.renderDashboardAll; }
/* === PETATOE v3.0 - Stability, Permissions, Audit Log, Backup & Data Quality Patch === */
(function(){
  var LOG_KEY='petatoe_audit_log_v1', SETTINGS_KEY='petatoe_runtime_settings_v1', BACKUP_VERSION='3.0-stability';
  var DEFAULT_SETTINGS={role:'admin', strictValidation:true, duplicateProtection:true, autoFixMonth:true, defaultPageSize:'100', logLimit:800};
  var ROLE_LABELS={admin:'Super Admin', analyst:'Analyst / Reports', dataentry:'Data Entry', viewer:'Read Only'};
  var ROLE_RULES={
    // TREASURY_PERMISSION_FIX: the treasury tab is a normal management module.
    // It must be available in the same local-role system so the governance validator
    // does not block it with "التبويب غير متاح للصلاحية الحالية".
    admin:{tabs:['dashboard','executive','smart','customer360','commissions','commissionStatement','fleet','obligations','payroll','salarySlip','childrenExpenses','treasury','records','entry','import','settings','logs','appointments','vehicleOperations','vehicleOperationsReports','operationKpis','warehouses'],write:true,del:true,backup:true},
    analyst:{tabs:['dashboard','executive','smart','customer360','commissions','commissionStatement','fleet','obligations','payroll','salarySlip','treasury','records','settings','logs','appointments','vehicleOperationsReports','operationKpis'],write:false,del:false,backup:true},
    dataentry:{tabs:['dashboard','commissions','commissionStatement','fleet','obligations','salarySlip','treasury','records','entry','import','settings','appointments','vehicleOperations'],write:true,del:false,backup:false},
    employee:{tabs:['dashboard','salarySlip','settings','appointments'],write:false,del:false,backup:false},
    viewer:{tabs:['dashboard','executive','smart','customer360','commissions','commissionStatement','fleet','obligations','salarySlip','treasury','records','settings','appointments','vehicleOperationsReports','operationKpis'],write:false,del:false,backup:false}
  };
  /* v3.11.10: using global byId */
  function block_4440_esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function petatoeSetInnerHTML(el, html){(window.PETATOESecurity||{setInnerHTML:function(node,h){node.replaceChildren(document.createRange().createContextualFragment(String(h==null?'':h)));}}).setInnerHTML(el, html);}
  function smartReportsWarn(context,e){if(window.console&&typeof console.warn==='function')console.warn('[PETATOE Smart Reports] '+context,e)}
  var SMART_REMOTE_TABLE='operations_master_data', SMART_REMOTE_ID='smart_reports_persistent_store_v1';
  var smartRemoteCache={}, smartRemoteLoaded=false, smartRemoteLoading=null;
  function smartRepo(){return window.PETATOESupabaseRepository||null}
  function smartLoadRemote(){
    if(smartRemoteLoading)return smartRemoteLoading;
    var R=smartRepo();
    if(!R||typeof R.getSingleton!=='function'){smartRemoteLoaded=true;return Promise.resolve(smartRemoteCache)}
    smartRemoteLoading=R.getSingleton(SMART_REMOTE_TABLE,SMART_REMOTE_ID,{}).then(function(data){
      smartRemoteCache=data&&typeof data==='object'?data:{}; smartRemoteLoaded=true; return smartRemoteCache;
    }).catch(function(e){smartReportsWarn('Supabase remote load failed',e); smartRemoteLoaded=true; return smartRemoteCache;});
    return smartRemoteLoading;
  }
  function smartSaveRemote(){
    var R=smartRepo();
    if(!R||typeof R.saveSingleton!=='function')return Promise.resolve({ok:false,error:'Supabase repository not ready'});
    return R.saveSingleton(SMART_REMOTE_TABLE,SMART_REMOTE_ID,smartRemoteCache).catch(function(e){smartReportsWarn('Supabase remote save failed',e);return {ok:false,error:String(e&&e.message||e)}});
  }
  function readJSON(k,def){if(!smartRemoteLoaded)smartLoadRemote();return Object.prototype.hasOwnProperty.call(smartRemoteCache,k)?smartRemoteCache[k]:def}
  function writeJSON(k,v){smartRemoteCache[k]=v;smartRemoteLoaded=true;smartSaveRemote()}
  function removeJSON(k){if(Object.prototype.hasOwnProperty.call(smartRemoteCache,k))delete smartRemoteCache[k];smartRemoteLoaded=true;smartSaveRemote()}
  function settings(){return Object.assign({},DEFAULT_SETTINGS,readJSON(SETTINGS_KEY,{}))}
  function saveSettings(v){writeJSON(SETTINGS_KEY,Object.assign({},settings(),v||{}));applyGovernance();renderSettingsPanel();}
  function log(action,details,level){
    try{
      var st=settings(), arr=readJSON(LOG_KEY,[]); arr.unshift({time:new Date().toISOString(), action:action||'Action', level:level||'info', details:details||'', count:dsRecords().length, role:st.role});
      arr=arr.slice(0,Number(st.logLimit)||800); writeJSON(LOG_KEY,arr);
    }catch(e){smartReportsWarn('audit log write skipped',e)}
  }
  window.petatoeAuditLog=log;
  function role(){return settings().role||'admin'}
  function canWrite(){return !!(ROLE_RULES[role()]||ROLE_RULES.admin).write}
  function canDelete(){return !!(ROLE_RULES[role()]||ROLE_RULES.admin).del}
  function canBackup(){return !!(ROLE_RULES[role()]||ROLE_RULES.admin).backup}
  function allowedTab(name){return (ROLE_RULES[role()]||ROLE_RULES.admin).tabs.indexOf(name)>-1}
  function toastSafe(msg){try{toast(msg)}catch(e){alert(msg)}}
  // PETATOE v6.1.192: The extracted settings center (settings/settings.js) is the
  // current owner of #settingsArea. This legacy smart-reports patch must not overwrite it,
  // otherwise settings/permissions pages can render blank or be replaced by old HTML.
  function hasModernSettingsCenter(){
    return typeof window.petSettingsV110Open==='function' || !!window.__PETATOE_SETTINGS_API__;
  }
  function openModernSettingsCenter(){
    if(typeof window.petSettingsV110Open==='function'){
      try{
        var S=window.PETATOEStorage;
        /* UI-only tab state: use named storage keys so PETATOEStorage keeps it separate from business data. */
        var main=(S&&S.get?S.get('settingsMain','system'):'system')||'system';
        var sub=(S&&S.get?S.get('settingsSub','backup'):'backup')||'backup';
        window.petSettingsV110Open(main,sub);
      }catch(e){smartReportsWarn('modern settings render skipped',e)}
      return true;
    }
    return false;
  }
  function dsRecords(){try{return window.PETATOEDataSource.getRecordsSync()||[]}catch(e){return []}}
  function petDataQualityNorm(v){return String(v==null?'':v).trim()}
  function dupMoney(v){
    var n=Number(String(v==null?'':v).replace(/,/g,''));
    return isNaN(n)?'':n.toFixed(2);
  }
  function dupVehicle(r){return petDataQualityNorm(r.van||r.vehicle||r.car||r.carName||r.vehicleName)}
  function dupLineValue(r){return dupMoney(r.totalInc||r.total||r.totalWithVat||r.amount||r.lineTotal||r.price)}
  // DUPLICATE_RULE_MULTI_FIELD_FIX:
  // التكرار الحقيقي = نفس رقم الفاتورة + نفس العميل + نفس الصنف/الخدمة + نفس السيارة + نفس قيمة البند.
  // لا نحكم على رقم الفاتورة وحده لأنه طبيعي يظهر أكثر من مرة عند وجود أكثر من صنف في نفس الفاتورة.
  function rowKey(r){return [petDataQualityNorm(r.invoice),petDataQualityNorm(r.client),petDataQualityNorm(r.item),dupVehicle(r),dupLineValue(r)].join('|').toLowerCase()}
  function validateRecord(r,existing,editingId){
    var errors=[], warnings=[], st=settings();
    if(!petDataQualityNorm(r.item))errors.push('الصنف فارغ');
    if(!petDataQualityNorm(r.invoice))errors.push('رقم الفاتورة فارغ');
    if(!petDataQualityNorm(r.date))errors.push('التاريخ فارغ');
    if(!petDataQualityNorm(r.client))warnings.push('اسم العميل فارغ');
    var d=new Date(r.date); if(petDataQualityNorm(r.date)&&isNaN(d.getTime()))errors.push('تاريخ غير صحيح');
    ['price','qty','disc','tax','totalInc','totalEx'].forEach(function(f){
      var n=Number(r[f]||0);
      if(isNaN(n))errors.push('قيمة رقمية غير صحيحة في '+f);
      // PETATOE v3.6 FIX: الخصم قد يأتي بالسالب من ملفات البيع، وهذا صحيح محاسبياً.
      // نمنع القيم السالبة في باقي الأعمدة فقط.
      if(f!=='disc' && n<0)errors.push('قيمة سالبة في '+f);
    });
    if(Number(r.qty||0)<=0)errors.push('الكمية يجب أن تكون أكبر من صفر');
    var ex=Number(r.totalEx||0), inc=Number(r.totalInc||0), tax=Number(r.tax||0);
    if(st.strictValidation && inc && Math.abs((ex+tax)-inc)>1.5)warnings.push('إجمالي شامل الضريبة لا يساوي قبل الضريبة + الضريبة');
    if(st.duplicateProtection && existing && petDataQualityNorm(r.invoice)){
      var k=rowKey(r); var dup=existing.some(function(x){return String(x.id)!==String(editingId||'') && rowKey(x)===k});
      if(dup)errors.push('سجل مكرر بنفس رقم الفاتورة/العميل/الصنف أو الخدمة/السيارة/قيمة الصنف');
    }
    if(st.autoFixMonth && r.date){try{r.month=normalizeMonth(r.month,r.date)}catch(e){smartReportsWarn('record month normalization skipped',e)}}
    return {ok:errors.length===0, errors:errors, warnings:warnings, record:r};
  }
  window.petatoeValidateOneRecord=validateRecord;
  var __legacyQualityCache=null, __legacyQualityCacheAt=0;
  function dataQuality(force){
    var nowMs=Date.now();
    if(!force && __legacyQualityCache && (nowMs-__legacyQualityCacheAt)<60000) return __legacyQualityCache;
    var arr=dsRecords(), seen={}, invalid=[], warn=0, future=0, duplicates=0, monthMismatch=0;
    var now=new Date(); now.setHours(23,59,59,999);
    arr.forEach(function(r,i){
      var v=validateRecord(Object.assign({},r),arr,r.id); if(!v.ok)invalid.push({i:i+1,msg:v.errors.join(' / '),r:r}); warn+=v.warnings.length;
      var d=new Date(r.date); if(!isNaN(d.getTime()) && d>now)future++;
      var m=''; try{m=normalizeMonth('',r.date)}catch(e){smartReportsWarn('data quality month normalization skipped',e)} if(m && r.month && m!==r.month)monthMismatch++;
      var k=rowKey(r); if(seen[k])duplicates++; else seen[k]=1;
    });
    __legacyQualityCache={total:arr.length, invalid:invalid, warnings:warn, future:future, duplicates:duplicates, monthMismatch:monthMismatch}; __legacyQualityCacheAt=nowMs; return __legacyQualityCache;
  }
  window.petatoeRunDataQuality=function(){
    var q=dataQuality(true); renderSettingsPanel(q); log('Data Quality Check','Invalid: '+q.invalid.length+' | Duplicates: '+q.duplicates+' | Month mismatch: '+q.monthMismatch,q.invalid.length?'warn':'info');
    toastSafe(q.invalid.length?'تم الفحص: يوجد ملاحظات تحتاج مراجعة':'تم الفحص: البيانات مستقرة');
  };
  var PET_USERS_KEY='petatoe_users_v2', PET_ROLES_KEY='petatoe_roles_permissions_v2', PET_CURRENT_KEY='petatoe_current_user_v2', PET_SEC_KEY='petatoe_security_settings_v2';
  var PET_ROLE_NAMES={superadmin:'Super Admin',admin:'Admin',accountant:'Accountant',sales:'Sales Manager',fleet:'Fleet Manager',employee:'Employee',viewer:'Viewer'};
  var PET_ROLE_TO_OLD={superadmin:'admin',admin:'admin',accountant:'analyst',sales:'analyst',fleet:'dataentry',viewer:'viewer'};
  var PET_PERMS=[
    ['dashboard','عرض الرئيسية','الدخول للواجهة الرئيسية والمؤشرات'],['entry','إدخال البيانات','رفع وإدخال الفواتير'],['reports','عرض التقارير','فتح التقارير والتقارير الذكية'],['export_pdf','تصدير PDF','استخدام أزرار PDF والطباعة'],['export_excel','تصدير Excel','استخدام أزرار Excel/CSV'],['treasury','عرض الخزنة','فتح الأرصدة والحركات المالية'],['treasury_edit','تعديل الخزنة','تعديل أو حذف الحركات اليدوية'],['vehicles','إدارة السيارات','فتح وإدارة قسم السيارات'],['obligations','إدارة الالتزامات','إضافة وتعديل الالتزامات'],['payroll','إدارة الرواتب','إدارة كشوف الرواتب والاعتمادات'],['salarySlip','كشف الراتب','رؤية كشف راتب المستخدم الحالي فقط'],['commissions','إدارة العمولات','عرض وتعديل الشرائح والأرشيف'],['commissionStatement','كشف العمولة','عرض كشف العمولة الخاص بالمستخدم'],['childrenExpenses','مصروفات الأبناء','فتح قسم مصروفات الأبناء'],['settings','الإعدادات','فتح مركز الإعدادات'],['users','المستخدمون والصلاحيات','إدارة المستخدمين والأدوار']
  ];
  function petDefaultRoles(){return {superadmin:PET_PERMS.map(function(p){return p[0]}),admin:PET_PERMS.map(function(p){return p[0]}),accountant:['dashboard','reports','export_pdf','export_excel','treasury','obligations','payroll','settings'],sales:['dashboard','reports','export_pdf','export_excel','vehicles','commissions','commissionStatement','salarySlip'],fleet:['dashboard','vehicles','treasury','treasury_edit','reports'],employee:['dashboard','salarySlip'],viewer:['dashboard','reports','salarySlip','commissionStatement']}}
  function petGetRoles(){return Object.assign(petDefaultRoles(),readJSON(PET_ROLES_KEY,{}))}
  function petSaveRoles(v){writeJSON(PET_ROLES_KEY,v)}
  function petDefaultUsers(){return [{id:'u_admin',username:'Admin',fullName:'Admin',job:'System Owner',phone:'',email:'',role:'superadmin',status:'active',createdAt:new Date().toISOString(),lastLogin:new Date().toISOString()}]}
  function petGetUsers(){var u=readJSON(PET_USERS_KEY,null); if(!Array.isArray(u)||!u.length){u=petDefaultUsers(); writeJSON(PET_USERS_KEY,u)} return u}
  function petSaveUsers(u){writeJSON(PET_USERS_KEY,u)}
  function petCurrentUser(){var id=String(readJSON(PET_CURRENT_KEY,'')||''); if(!id)return {id:'',username:'Guest',fullName:'Guest',role:'guest',status:'inactive'}; var u=petGetUsers().find(function(x){return x.id===id}); return u||{id:id,username:id,fullName:id,role:'unknown',status:'inactive'}}
  function petSetCurrentRoleFromUser(){var u=petCurrentUser(); var old=PET_ROLE_TO_OLD[u.role]||'viewer'; saveSettings({role:old});}
  function petSecDefaults(){return {requireDeleteReason:true,requireEditReason:true,lockSensitiveDeletes:true,enableAudit:true,sensitiveAmount:10000,managerPasswordHash:null}}
  function petSecurity(){return Object.assign(petSecDefaults(),readJSON(PET_SEC_KEY,{}))}
  function petSaveSecurity(s){writeJSON(PET_SEC_KEY,Object.assign(petSecurity(),s||{}))}
  function petIssuesCount(){try{return __legacyQualityCache?__legacyQualityCache.invalid.length:0}catch(e){return 0}}
  function petUserStats(){var users=petGetUsers(), logs=readJSON(LOG_KEY,[]); return {users:users.length,active:users.filter(function(u){return u.status==='active'}).length,logs:logs.length,issues:petIssuesCount(),records:dsRecords().length}}
  function petKpisHtml(){var s=petUserStats(), u=petCurrentUser(); return '<div class="pet-set-kpis"><div class="pet-set-card"><span>المستخدمون</span><b>'+s.users+'</b><small>'+s.active+' نشط</small></div><div class="pet-set-card"><span>المستخدم الحالي</span><b>'+block_4440_esc(u.fullName||u.username)+'</b><small>'+block_4440_esc(PET_ROLE_NAMES[u.role]||u.role)+'</small></div><div class="pet-set-card"><span>سجل النشاط</span><b>'+s.logs+'</b><small>Audit Trail</small></div><div class="pet-set-card"><span>مشاكل بيانات مبدئية</span><b>'+s.issues+'</b><small>'+s.records+' سجل</small></div></div>'}
  function petTabsHtml(active){var tabs=[['overview','لوحة عامة'],['users','المستخدمون'],['roles','الأدوار والصلاحيات'],['audit','سجل النشاط'],['security','العمليات الحساسة'],['profile','بياناتي']]; return '<div class="pet-set-tabs">'+tabs.map(function(t){return '<button class="pet-set-tab '+(active===t[0]?'active':'')+'">'+t[1]+'</button>'}).join('')+'</div>'}
  function petOverviewHtml(){return '<div class="pet-set-panel"><h3>🧭 مركز التحكم والصلاحيات</h3><p>القسم ده بيجمع المستخدمين، الأدوار، سجل النشاط، والعمليات الحساسة في مكان واحد بدون التأثير على التقارير القديمة.</p><div class="pet-set-actions"><button class="btn btn-primary">👥 إدارة المستخدمين</button><button class="btn btn-ghost">🔐 الأدوار والصلاحيات</button><button class="btn btn-ghost">📋 سجل النشاط</button><button class="btn btn-ghost">🛡️ العمليات الحساسة</button></div><div class="pet-set-note">نظام الصلاحيات الحالي محلي داخل نسخة HTML، ومجهز للتحويل لاحقًا لجداول Users / Roles / Permissions / Audit Logs عند التحويل لـ PHP وقاعدة بيانات.</div></div>'}
  function petUsersRows(){return petGetUsers().map(function(u){var cls=u.status==='active'?'ok':u.status==='blocked'?'bad':'warn'; return '<tr><td>'+block_4440_esc(u.username)+'</td><td>'+block_4440_esc(u.fullName)+'</td><td>'+block_4440_esc(u.job||'-')+'</td><td>'+block_4440_esc(u.phone||'-')+'</td><td>'+block_4440_esc(u.email||'-')+'</td><td><span class="pet-set-badge role">'+block_4440_esc(PET_ROLE_NAMES[u.role]||u.role)+'</span></td><td><span class="pet-set-badge '+cls+'">'+block_4440_esc(u.status==='active'?'نشط':u.status==='blocked'?'محظور':'موقوف')+'</span></td><td>'+block_4440_esc(u.lastLogin?new Date(u.lastLogin).toLocaleString('ar-EG'):'-')+'</td><td><button class="pet-set-mini blue" data-pet-settings-action="set-current-user" data-user-id="'+u.id+'">تفعيل</button><button class="pet-set-mini" data-pet-settings-action="edit-user" data-user-id="'+u.id+'">تعديل</button><button class="pet-set-mini green" data-pet-settings-action="reset-user-pass" data-user-id="'+u.id+'">Reset</button><button class="pet-set-mini danger" data-pet-settings-action="delete-user" data-user-id="'+u.id+'">حذف</button></td></tr>'}).join('')}
  function petUsersHtml(){return '<div class="pet-set-panel"><h3>👥 إدارة المستخدمين</h3><p>إضافة وتعديل وتعطيل المستخدمين. المستخدم الحالي تتم مزامنته مع الصلاحية القديمة حتى لا تتأثر الشاشات الحالية.</p><div class="pet-set-actions"><input id="pu_username" class="pet-set-input" placeholder="اسم الدخول"><input id="pu_fullName" class="pet-set-input" placeholder="الاسم الكامل"><input id="pu_job" class="pet-set-input" placeholder="الوظيفة"><input id="pu_phone" class="pet-set-input" placeholder="الهاتف"><input id="pu_email" class="pet-set-input" placeholder="الإيميل"><select id="pu_role" class="pet-set-select">'+Object.keys(PET_ROLE_NAMES).map(function(k){return '<option value="'+k+'">'+PET_ROLE_NAMES[k]+'</option>'}).join('')+'</select><select id="pu_status" class="pet-set-select"><option value="active">نشط</option><option value="stopped">موقوف</option><option value="blocked">محظور</option></select><input id="pu_password" class="pet-set-input" type="password" placeholder="كلمة المرور"><button class="btn btn-green" data-pet-settings-action="save-user">💾 حفظ المستخدم</button><button class="btn btn-ghost" data-pet-settings-action="clear-user-form">تفريغ</button><input type="hidden" id="pu_id"></div><div class="pet-set-table"><table><thead><tr><th>اسم الدخول</th><th>الاسم</th><th>الوظيفة</th><th>الهاتف</th><th>الإيميل</th><th>الدور</th><th>الحالة</th><th>آخر دخول</th><th>إجراءات</th></tr></thead><tbody>'+petUsersRows()+'</tbody></table></div></div>'}
  function petRolesHtml(){var roles=petGetRoles(), keys=Object.keys(PET_ROLE_NAMES); return '<div class="pet-set-panel"><h3>🔐 الأدوار والصلاحيات</h3><p>حدد صلاحيات كل دور. Super Admin يظل كامل الصلاحيات للحماية.</p><div class="pet-role-matrix"><table><thead><tr><th>الصلاحية</th>'+keys.map(function(r){return '<th>'+block_4440_esc(PET_ROLE_NAMES[r])+'</th>'}).join('')+'</tr></thead><tbody>'+PET_PERMS.map(function(p){return '<tr><td><b>'+block_4440_esc(p[1])+'</b><br><small>'+block_4440_esc(p[2])+'</small></td>'+keys.map(function(r){var chk=(roles[r]||[]).indexOf(p[0])>-1, dis=r==='superadmin'?'disabled':''; return '<td><input type="checkbox" data-role="'+r+'" data-perm="'+p[0]+'" '+(chk?'checked':'')+' '+dis+'></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div><div class="pet-set-actions"><button class="btn btn-primary" data-pet-settings-action="save-role-matrix">💾 حفظ الصلاحيات</button><button class="btn btn-ghost" data-pet-settings-action="reset-role-matrix">إرجاع الافتراضي</button></div></div>'}
  function petAuditHtml(){var logs=readJSON(LOG_KEY,[]); return '<div class="pet-set-panel"><h3>📋 سجل النشاط Audit Trail</h3><p>يعرض آخر الحركات المسجلة في النظام.</p><div class="pet-set-actions"><button class="exp-btn exp-btn-excel" data-pet-settings-action="export-audit-csv">⬇️ تصدير CSV</button><button class="btn btn-danger" data-pet-settings-action="clear-audit-log">مسح السجل</button></div><div class="pet-set-table"><table><thead><tr><th>التاريخ</th><th>المستخدم/الدور</th><th>العملية</th><th>المستوى</th><th>التفاصيل</th></tr></thead><tbody>'+(logs.slice(0,300).map(function(x){return '<tr><td>'+block_4440_esc(x.time?new Date(x.time).toLocaleString('ar-EG'):'-')+'</td><td>'+block_4440_esc(PET_ROLE_NAMES[(petCurrentUser()||{}).role]||ROLE_LABELS[x.role]||x.role||'-')+'</td><td>'+block_4440_esc(x.action||'-')+'</td><td>'+block_4440_esc(x.level||'info')+'</td><td>'+block_4440_esc(x.details||'-')+'</td></tr>'}).join('')||'<tr><td colspan="5">لا توجد حركات مسجلة.</td></tr>')+'</tbody></table></div></div>'}
  function petSecurityHtml(){var s=petSecurity(); return '<div class="pet-set-panel"><h3>🛡️ العمليات الحساسة</h3><p>قواعد حماية التعديل والحذف والعمليات الكبيرة.</p><div class="pet-security-grid"><label class="pet-switch-row"><div><b>سبب إلزامي للحذف</b><span>أي حذف يطلب سبب قبل التنفيذ.</span></div><input id="secDeleteReason" type="checkbox" '+(s.requireDeleteReason?'checked':'')+'></label><label class="pet-switch-row"><div><b>سبب إلزامي للتعديل</b><span>أي تعديل حساس يتطلب سبب.</span></div><input id="secEditReason" type="checkbox" '+(s.requireEditReason?'checked':'')+'></label><label class="pet-switch-row"><div><b>قفل الحذف الحساس</b><span>عمليات فوق حد معين تحتاج كلمة مدير.</span></div><input id="secLockSensitive" type="checkbox" '+(s.lockSensitiveDeletes?'checked':'')+'></label><label class="pet-switch-row"><div><b>تفعيل Audit Trail</b><span>تسجيل كل تغيير مهم.</span></div><input id="secAudit" type="checkbox" '+(s.enableAudit?'checked':'')+'></label></div><div class="pet-set-actions"><input id="secAmount" class="pet-set-input" type="number" value="'+block_4440_esc(s.sensitiveAmount)+'" placeholder="حد العملية الحساسة"><input id="secManagerPass" class="pet-set-input" type="password" placeholder="كلمة مرور المدير الجديدة (اتركها فارغة للإبقاء على الحالية)"><button class="btn btn-primary" data-pet-settings-action="save-security-settings">💾 حفظ إعدادات الأمان</button></div><div class="pet-set-note">الربط الكامل لقواعد الحماية مع الخزنة يتم بعد تثبيت منطق الخزنة النهائي.</div></div>'}
  function petProfileHtml(){var u=petCurrentUser(); return '<div class="pet-set-panel"><h3>👤 بياناتي</h3><p>كل مستخدم يقدر يعدل بياناته الأساسية وكلمة المرور بدون تغيير صلاحياته.</p><div class="pet-profile-box"><div class="pet-profile-avatar">🐾</div><div><div class="pet-set-actions"><input id="profName" class="pet-set-input" value="'+block_4440_esc(u.fullName||'')+'" placeholder="الاسم الكامل"><input id="profPhone" class="pet-set-input" value="'+block_4440_esc(u.phone||'')+'" placeholder="الهاتف"><input id="profEmail" class="pet-set-input" value="'+block_4440_esc(u.email||'')+'" placeholder="الإيميل"><input id="profPass" class="pet-set-input" type="password" placeholder="كلمة مرور جديدة"><button class="btn btn-green" data-pet-settings-action="save-my-profile">💾 تحديث بياناتي</button></div><div class="pet-set-note">الدور الحالي: <b>'+block_4440_esc(PET_ROLE_NAMES[u.role]||u.role)+'</b> — لا يمكن تعديله من شاشة بياناتي.</div></div></div></div>'}
  function renderSettingsPanel(q){
    if(hasModernSettingsCenter() && openModernSettingsCenter()) return;
    var el=byId('settingsArea'); if(!el)return; var active=window.__petSettingsActiveTab||'overview'; var st=settings(); q=q||{total:dsRecords().length,invalid:[],warnings:0,future:0,duplicates:0,monthMismatch:0};
    var legacySettingsHtml='<div class="gov-grid"><div class="gov-kpi"><span>عدد السجلات</span><b>'+block_4440_esc(q.total)+'</b></div><div class="gov-kpi"><span>أخطاء مانعة</span><b>'+block_4440_esc(q.invalid.length)+'</b></div><div class="gov-kpi"><span>تكرارات محتملة</span><b>'+block_4440_esc(q.duplicates)+'</b></div><div class="gov-kpi"><span>اختلاف الشهر مع التاريخ</span><b>'+block_4440_esc(q.monthMismatch)+'</b></div></div><div class="gov-panel"><h3>🔐 الصلاحيات الحالية</h3><p>نظام صلاحيات محلي داخل النسخة الحالية، ليس بديلًا عن Login حقيقي عند الربط بقاعدة البيانات لاحقًا.</p><div class="gov-actions"><select class="gov-select" id="petRoleSelect"><option value="admin">Super Admin</option><option value="analyst">Analyst / Reports</option><option value="dataentry">Data Entry</option><option value="viewer">Read Only</option></select><button class="btn btn-primary" data-pet-settings-action="save-role">حفظ الصلاحية</button></div><div class="gov-note">الصلاحية الحالية: <b>'+block_4440_esc(ROLE_LABELS[st.role]||st.role)+'</b></div></div><div class="gov-panel"><h3>🧪 قواعد جودة البيانات</h3><div class="gov-actions"><label><input type="checkbox" id="strictValidation" '+(st.strictValidation?'checked':'')+'> تفعيل فحص الإجماليات</label><label><input type="checkbox" id="duplicateProtection" '+(st.duplicateProtection?'checked':'')+'> منع التكرار</label><label><input type="checkbox" id="autoFixMonth" '+(st.autoFixMonth?'checked':'')+'> تصحيح الشهر من التاريخ تلقائيًا</label><button class="btn btn-primary" data-pet-settings-action="save-validation-settings">حفظ القواعد</button></div><div class="gov-note">أي استيراد جديد هيتراجع قبل الإضافة، والسجلات الخاطئة لن تدخل للبيانات.</div></div><div class="gov-panel"><h3>💾 Backup / Restore</h3><p>يحفظ البيانات الحالية + الأهداف الشهرية + الإعدادات + سجل الحركات في ملف JSON واحد.</p><div class="gov-actions"><button class="exp-btn exp-btn-excel" data-pet-settings-action="export-backup">تنزيل Backup</button><button class="btn btn-ghost" data-pet-settings-action="restore-picker">استرجاع Backup</button><button class="btn btn-danger" data-pet-settings-action="fix-month-mismatch">تصحيح اختلاف الشهور</button></div></div><div class="gov-panel"><h3>📋 آخر مشاكل الجودة</h3><div class="gov-table"><table><thead><tr><th>#</th><th>الحالة</th><th>الرسالة</th><th>الفاتورة</th><th>العميل</th><th>التاريخ</th></tr></thead><tbody>'+(q.invalid.slice(0,80).map(function(x){return '<tr><td>'+x.i+'</td><td><span class="gov-badge bad">خطأ</span></td><td>'+block_4440_esc(x.msg)+'</td><td>'+block_4440_esc(x.r.invoice)+'</td><td>'+block_4440_esc(x.r.client)+'</td><td>'+block_4440_esc(x.r.date)+'</td></tr>'}).join('')||'<tr><td colspan="6"><span class="gov-badge ok">لا توجد أخطاء مانعة</span></td></tr>')+'</tbody></table></div></div>';
    var body=active==='users'?petUsersHtml():active==='roles'?petRolesHtml():active==='audit'?petAuditHtml():active==='security'?petSecurityHtml():active==='profile'?petProfileHtml():petOverviewHtml()+legacySettingsHtml;
    petatoeSetInnerHTML(el, '<div class="pet-settings-clean">'+petKpisHtml()+petTabsHtml(active)+body+'</div>');
    var rs=byId('petRoleSelect'); if(rs)rs.value=st.role;
  }
  window.petSettingsOpenLegacy=function(t){window.__petSettingsActiveTab=t||'overview'; renderSettingsPanel()};
  window.petClearUserForm=function(){['pu_id','pu_username','pu_fullName','pu_job','pu_phone','pu_email','pu_password'].forEach(function(id){var e=byId(id);if(e)e.value=''}); var r=byId('pu_role'); if(r)r.value='viewer'; var s=byId('pu_status'); if(s)s.value='active'};
  window.petSaveUser=function(){var id=byId('pu_id')?byId('pu_id').value:''; var users=petGetUsers(); var username=(byId('pu_username')?byId('pu_username').value.trim():''); if(!username){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اسم الدخول مطلوب'):'اسم الدخول مطلوب');return} if(users.some(function(u){return u.username===username&&u.id!==id})){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('اسم الدخول موجود بالفعل'):'اسم الدخول موجود بالفعل');return} var u=id?users.find(function(x){return x.id===id}):null; if(!u){u={id:'u_'+Date.now(),createdAt:new Date().toISOString(),lastLogin:''}; users.push(u)}; u.username=username; u.fullName=(byId('pu_fullName')?byId('pu_fullName').value.trim():'')||username; u.job=byId('pu_job')?byId('pu_job').value.trim():''; u.phone=byId('pu_phone')?byId('pu_phone').value.trim():''; u.email=byId('pu_email')?byId('pu_email').value.trim():''; u.role=byId('pu_role')?byId('pu_role').value:'viewer'; u.status=byId('pu_status')?byId('pu_status').value:'active'; var pass=byId('pu_password')?byId('pu_password').value:''; var sec=window.PETATOEPasswordSecurity; if(pass){if(sec&&sec.setPassword)sec.setPassword(u,pass);} else if(!id&&!(sec&&sec.hasCredential&&sec.hasCredential(u))&&!u.password){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('كلمة المرور مطلوبة للمستخدم الجديد'):'كلمة المرور مطلوبة للمستخدم الجديد');return;} petSaveUsers(users); log(id?'User Updated':'User Created',u.username,'warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم حفظ المستخدم'):'تم حفظ المستخدم'); renderSettingsPanel()};
  window.petEditUser=function(id){var u=petGetUsers().find(function(x){return x.id===id}); if(!u)return; window.__petSettingsActiveTab='users'; renderSettingsPanel(); setTimeout(function(){[['pu_id',u.id],['pu_username',u.username],['pu_fullName',u.fullName],['pu_job',u.job||''],['pu_phone',u.phone||''],['pu_email',u.email||'']].forEach(function(a){var e=byId(a[0]); if(e)e.value=a[1]}); var r=byId('pu_role'); if(r)r.value=u.role; var s=byId('pu_status'); if(s)s.value=u.status||'active'},30)};
  window.petDeleteUser=function(id){var users=petGetUsers(); var u=users.find(function(x){return x.id===id}); if(!u)return; if(u.role==='superadmin'){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('لا يمكن حذف Super Admin'):'لا يمكن حذف Super Admin');return} var reason=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('سبب حذف المستخدم؟'):'سبب حذف المستخدم؟'); if(!reason)return; users=users.filter(function(x){return x.id!==id}); petSaveUsers(users); log('User Deleted',u.username+' | '+reason,'warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم حذف المستخدم'):'تم حذف المستخدم'); renderSettingsPanel()};
  window.petResetUserPass=function(id){var users=petGetUsers(), u=users.find(function(x){return x.id===id}); if(!u)return; var p=prompt(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('كلمة المرور الجديدة للمستخدم '):'كلمة المرور الجديدة للمستخدم '+u.username,''); if(!p)return; var sec=window.PETATOEPasswordSecurity; if(sec&&sec.setPassword)sec.setPassword(u,p); petSaveUsers(users); log('Password Reset',u.username,'warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم تغيير كلمة المرور'):'تم تغيير كلمة المرور')};
  window.petSetCurrentUser=function(id){var u=petGetUsers().find(function(x){return x.id===id}); if(!u)return; if(u.status!=='active'){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('المستخدم غير نشط'):'المستخدم غير نشط');return} writeJSON(PET_CURRENT_KEY,id); u.lastLogin=new Date().toISOString(); petSaveUsers(petGetUsers().map(function(x){return x.id===id?u:x})); petSetCurrentRoleFromUser(); log('Current User Changed',u.username+' / '+u.role,'warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم تفعيل المستخدم: '):'تم تفعيل المستخدم: '+u.fullName); renderSettingsPanel(); applyGovernance()};
  window.petSaveRoleMatrix=function(){var roles=petGetRoles(); Object.keys(PET_ROLE_NAMES).forEach(function(r){if(r!=='superadmin')roles[r]=[]}); document.querySelectorAll('.pet-role-matrix input[type=checkbox]').forEach(function(c){if(c.checked){var r=c.getAttribute('data-role'), p=c.getAttribute('data-perm'); if(!roles[r])roles[r]=[]; if(roles[r].indexOf(p)<0)roles[r].push(p)}}); roles.superadmin=PET_PERMS.map(function(p){return p[0]}); petSaveRoles(roles); log('Permissions Updated','Role matrix saved','warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم حفظ الصلاحيات'):'تم حفظ الصلاحيات'); renderSettingsPanel()};
  window.petResetRoleMatrix=function(){if(!confirm(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('إرجاع صلاحيات الأدوار للافتراضي؟'):'إرجاع صلاحيات الأدوار للافتراضي؟'))return; removeJSON(PET_ROLES_KEY); log('Permissions Reset','Default role matrix restored','warn'); renderSettingsPanel()};
  window.petSaveSecuritySettings=function(){petSaveSecurity({requireDeleteReason:!!(byId('secDeleteReason')&&byId('secDeleteReason').checked),requireEditReason:!!(byId('secEditReason')&&byId('secEditReason').checked),lockSensitiveDeletes:!!(byId('secLockSensitive')&&byId('secLockSensitive').checked),enableAudit:!!(byId('secAudit')&&byId('secAudit').checked),sensitiveAmount:parseFloat(byId('secAmount')?byId('secAmount').value:0)||0,managerPasswordHash:(byId('secManagerPass')&&byId('secManagerPass').value&&window.PETATOEPasswordSecurity)?window.PETATOEPasswordSecurity.hashPassword(byId('secManagerPass').value):(petSecurity().managerPasswordHash||null)}); log('Security Settings Updated','Sensitive operations settings saved','warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم حفظ إعدادات الأمان'):'تم حفظ إعدادات الأمان')};
  window.petSaveMyProfile=function(){var users=petGetUsers(), cu=petCurrentUser(), u=users.find(function(x){return x.id===cu.id}); if(!u)return; u.fullName=(byId('profName')?byId('profName').value.trim():'')||u.fullName; u.phone=byId('profPhone')?byId('profPhone').value.trim():u.phone; u.email=byId('profEmail')?byId('profEmail').value.trim():u.email; var p=byId('profPass')?byId('profPass').value:''; if(p){var sec=window.PETATOEPasswordSecurity;if(sec&&sec.setPassword)sec.setPassword(u,p);} petSaveUsers(users); log('My Profile Updated',u.username,'info'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم تحديث بياناتي'):'تم تحديث بياناتي'); renderSettingsPanel()};
  window.petExportAuditCsv=function(){var rows=readJSON(LOG_KEY,[]), header=['time','role','action','level','details']; var csv='\ufeff'+header.join(',')+'\n'+rows.map(function(r){return header.map(function(h){return '"'+String(r[h]||'').replace(/"/g,'""')+'"'}).join(',')}).join('\n'); var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='PETATOE_Audit_Log.csv'; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href)},1000)};
  window.petClearAuditLog=function(){if(!confirm(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('مسح سجل النشاط؟'):'مسح سجل النشاط؟'))return; removeJSON(LOG_KEY); log('Audit Log Cleared','User permissions center','warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم مسح السجل'):'تم مسح السجل'); renderSettingsPanel()};
  window.petatoeSaveRole=function(){var v=byId('petRoleSelect')?byId('petRoleSelect').value:'admin';saveSettings({role:v});log('Role Changed','Current role: '+v,'warn');toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم حفظ الصلاحية: '):'تم حفظ الصلاحية: '+(ROLE_LABELS[v]||v))};
  window.petatoeSaveValidationSettings=function(){saveSettings({strictValidation:!!byId('strictValidation')?.checked,duplicateProtection:!!byId('duplicateProtection')?.checked,autoFixMonth:!!byId('autoFixMonth')?.checked});log('Validation Settings Updated','Data quality rules updated','info');toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم حفظ قواعد جودة البيانات'):'تم حفظ قواعد جودة البيانات')};
  window.petatoeFixMonthMismatch=function(){
    if(!canWrite()){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('الصلاحية الحالية لا تسمح بالتعديل'):'الصلاحية الحالية لا تسمح بالتعديل');return}
    var c=0;dsRecords().forEach(function(r){var m='';try{m=normalizeMonth('',r.date)}catch(e){smartReportsWarn('month auto-fix normalization skipped',e)} if(m&&r.month!==m){r.month=m;c++}});
    if(c){try{_invalidateSearchIndex()}catch(e){smartReportsWarn('search index invalidation skipped after month fix',e)}; try{save()}catch(e){smartReportsWarn('save skipped after month fix',e)}; log('Month Auto Fix','Fixed '+c+' records','warn'); renderSettingsPanel(); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم تصحيح '):'تم تصحيح '+c+' سجل')}else toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('لا يوجد اختلاف في الشهور'):'لا يوجد اختلاف في الشهور')
  };
  function renderLogsPanel(){
    var el=byId('logsArea'); if(!el)return; var arr=readJSON(LOG_KEY,[]);
    petatoeSetInnerHTML(el, '<div class="gov-grid"><div class="gov-kpi"><span>عدد الحركات</span><b>'+arr.length+'</b></div><div class="gov-kpi"><span>آخر حركة</span><b>'+(arr[0]?new Date(arr[0].time).toLocaleString('ar-EG'):'-')+'</b></div><div class="gov-kpi"><span>الصلاحية</span><b>'+block_4440_esc(ROLE_LABELS[role()]||role())+'</b></div><div class="gov-kpi"><span>حد السجل</span><b>'+block_4440_esc(settings().logLimit)+'</b></div></div>'+
      '<div class="gov-panel"><div class="gov-table"><table><thead><tr><th>التاريخ</th><th>الحركة</th><th>المستوى</th><th>التفاصيل</th><th>عدد السجلات وقتها</th><th>الصلاحية</th></tr></thead><tbody>'+
      (arr.map(function(x){var cls=x.level==='warn'?'warn':x.level==='error'?'bad':'ok';return '<tr><td>'+block_4440_esc(new Date(x.time).toLocaleString('ar-EG'))+'</td><td>'+block_4440_esc(x.action)+'</td><td><span class="gov-badge '+cls+'">'+block_4440_esc(x.level)+'</span></td><td>'+block_4440_esc(x.details)+'</td><td>'+block_4440_esc(x.count)+'</td><td>'+block_4440_esc(ROLE_LABELS[x.role]||x.role)+'</td></tr>'}).join('')||'<tr><td colspan="6">لا توجد حركات مسجلة بعد.</td></tr>')+
      '</tbody></table></div></div>');
  }
  window.petatoeClearLogs=function(){if(!canDelete()){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('الصلاحية الحالية لا تسمح بمسح السجل'):'الصلاحية الحالية لا تسمح بمسح السجل');return} if(!confirm(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('مسح سجل الحركات؟'):'مسح سجل الحركات؟'))return; removeJSON(LOG_KEY); log('Audit Log Cleared','Log was cleared','warn'); renderLogsPanel();};
  window.petatoeExportLogsExcel=function(){var arr=readJSON(LOG_KEY,[]); if(!window.XLSX){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('مكتبة Excel غير متاحة'):'مكتبة Excel غير متاحة');return} var ws=XLSX.utils.json_to_sheet(arr);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Audit Log');XLSX.writeFile(wb,'PETATOE_Audit_Log.xlsx')};
  function smartRecordsFacade(){
    return (window.PETATOEDataSource&&typeof window.PETATOEDataSource.getRecordsSync==='function')?window.PETATOEDataSource:null;
  }
  function smartExportTheme(){
    var T=window.PETATOEThemeEngine;
    if(T&&typeof T.getCurrentTheme==='function')return T.getCurrentTheme();
    return (document.documentElement&&document.documentElement.getAttribute('data-theme'))||'dark';
  }
  function smartRestoreRecordsToSupabase(rows){
    var D=smartRecordsFacade();
    if(!D||typeof D.setRecordsSync!=='function')throw new Error('Supabase data source is not ready');
    D.setRecordsSync(Array.isArray(rows)?rows:[]);
    if(typeof D.syncRecordsCache==='function')D.syncRecordsCache(Array.isArray(rows)?rows:[],{reason:'smart-reports-backup-restore'});
  }
  window.petatoeExportBackup=function(){
    if(!canBackup()){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('الصلاحية الحالية لا تسمح بالنسخ الاحتياطي'):'الصلاحية الحالية لا تسمح بالنسخ الاحتياطي');return}
    var payload={version:BACKUP_VERSION,createdAt:new Date().toISOString(),source:'supabase-safe-smart-reports',records:dsRecords(),settings:settings(),logs:readJSON(LOG_KEY,[]),monthlyTargets:readJSON('petatoe_monthly_sales_targets_v1',{}),theme:smartExportTheme()};
    var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PETATOE_BACKUP_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},800);log('Backup Exported','Records: '+payload.records.length,'info');
  };
  window.petatoeRestorePicker=function(){if(!canBackup()){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('الصلاحية الحالية لا تسمح بالاسترجاع'):'الصلاحية الحالية لا تسمح بالاسترجاع');return} byId('petatoeRestoreInput')?.click()};
  function petSafeBackupParse(text){
    var Security=window.PETATOESecurity;
    if(Security&&typeof Security.safeJsonParse==='function')return Security.safeJsonParse(text,null);
    try{return JSON.parse(text||'{}')}catch(e){return null}
  }
  window.petatoeRestoreBackup=function(e){
    var file=e.target.files&&e.target.files[0]; if(!file)return; var reader=new FileReader();
    reader.onload=function(ev){
      var data=petSafeBackupParse(ev.target.result||'{}');
      try{
        if(!data||typeof data!=='object'||!Array.isArray(data.records))throw new Error('Invalid backup');
        if(!confirm(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('استرجاع النسخة الاحتياطية سيستبدل البيانات الحالية. هل أنت متأكد؟'):'استرجاع النسخة الاحتياطية سيستبدل البيانات الحالية. هل أنت متأكد؟'))return;
        smartRestoreRecordsToSupabase(data.records);
        __legacyQualityCache=null;
        if(data.settings)writeJSON(SETTINGS_KEY,data.settings);
        if(data.logs)writeJSON(LOG_KEY,data.logs);
        if(data.monthlyTargets)writeJSON('petatoe_monthly_sales_targets_v1',data.monthlyTargets);
        if(data.theme&&window.PETATOEThemeEngine&&typeof window.PETATOEThemeEngine.setTheme==='function')window.PETATOEThemeEngine.setTheme(data.theme);
        try{_invalidateSearchIndex()}catch(e){smartReportsWarn('search index invalidation skipped after restore',e)};
        applyGovernance(); renderSettingsPanel(); log('Backup Restored','Records: '+dsRecords().length,'warn'); toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تم استرجاع النسخة الاحتياطية بنجاح'):'تم استرجاع النسخة الاحتياطية بنجاح')
      }catch(err){console.error(err);toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('ملف Backup غير صالح أو مصدر Supabase غير جاهز'):'ملف Backup غير صالح أو مصدر Supabase غير جاهز')}
    };
    reader.readAsText(file); e.target.value='';
  };

  function petSettingsActionRun(action,id){
    if(action==='save-user')return petSaveUser();
    if(action==='clear-user-form')return petClearUserForm();
    if(action==='set-current-user')return petSetCurrentUser(id);
    if(action==='edit-user')return petEditUser(id);
    if(action==='reset-user-pass')return petResetUserPass(id);
    if(action==='delete-user')return petDeleteUser(id);
    if(action==='save-role-matrix')return petSaveRoleMatrix();
    if(action==='reset-role-matrix')return petResetRoleMatrix();
    if(action==='export-audit-csv')return petExportAuditCsv();
    if(action==='clear-audit-log')return petClearAuditLog();
    if(action==='save-security-settings')return petSaveSecuritySettings();
    if(action==='save-my-profile')return petSaveMyProfile();
    if(action==='save-role')return petatoeSaveRole();
    if(action==='save-validation-settings')return petatoeSaveValidationSettings();
    if(action==='export-backup')return petatoeExportBackup();
    if(action==='restore-picker')return petatoeRestorePicker();
    if(action==='fix-month-mismatch')return petatoeFixMonthMismatch();
  }
  if(!window.__PETATOE_SETTINGS_DELEGATES_BOUND__){
    window.__PETATOE_SETTINGS_DELEGATES_BOUND__=true;
    document.addEventListener('click',function(e){
      var tab=e.target.closest&&e.target.closest('[data-pet-settings-tab],.pet-set-tab');
      if(tab){var txt=(tab.textContent||'').trim();var map={'لوحة عامة':'overview','المستخدمون':'users','الأدوار والصلاحيات':'roles','سجل النشاط':'audit','العمليات الحساسة':'security','بياناتي':'profile'};petSettingsOpen(tab.getAttribute('data-pet-settings-tab')||map[txt]||'overview');return}
      var btn=e.target.closest&&e.target.closest('[data-pet-settings-action],.pet-set-actions button,.pet-set-table button');
      if(!btn)return;
      var action=btn.getAttribute('data-pet-settings-action'), id=btn.getAttribute('data-user-id');
      if(!action){var text=(btn.textContent||'').trim();var row=btn.closest('tr'), username=row&&row.children&&row.children[0]?row.children[0].textContent:'';var user=username?petGetUsers().find(function(u){return u.username===username}):null;id=user&&user.id;if(text.indexOf('تفعيل')>=0)action='set-current-user';else if(text.indexOf('تعديل')>=0)action='edit-user';else if(text.indexOf('Reset')>=0)action='reset-user-pass';else if(text.indexOf('حذف')>=0)action='delete-user';else if(text.indexOf('حفظ المستخدم')>=0)action='save-user';else if(text.indexOf('تفريغ')>=0)action='clear-user-form';else if(text.indexOf('حفظ الصلاحيات')>=0)action='save-role-matrix';else if(text.indexOf('إرجاع الافتراضي')>=0)action='reset-role-matrix';else if(text.indexOf('تصدير CSV')>=0)action='export-audit-csv';else if(text.indexOf('مسح السجل')>=0)action='clear-audit-log';else if(text.indexOf('حفظ إعدادات الأمان')>=0)action='save-security-settings';else if(text.indexOf('تحديث بياناتي')>=0)action='save-my-profile';else if(text.indexOf('حفظ الصلاحية')>=0)action='save-role';else if(text.indexOf('حفظ القواعد')>=0)action='save-validation-settings';else if(text.indexOf('تنزيل Backup')>=0)action='export-backup';else if(text.indexOf('استرجاع Backup')>=0)action='restore-picker';else if(text.indexOf('تصحيح اختلاف الشهور')>=0)action='fix-month-mismatch';else if(text.indexOf('إدارة المستخدمين')>=0){petSettingsOpen('users');return}else if(text.indexOf('الأدوار والصلاحيات')>=0){petSettingsOpen('roles');return}else if(text.indexOf('سجل النشاط')>=0){petSettingsOpen('audit');return}else if(text.indexOf('العمليات الحساسة')>=0){petSettingsOpen('security');return}}
      if(action)petSettingsActionRun(action,id);
    },true);
  }
  function applyGovernance(){
    var rr=ROLE_RULES[role()]||ROLE_RULES.admin;
    var nav=document.getElementById('nav');
    // PETATOE v6.1.192: sidebar-final.js owns the modern sidebar and current permission UX.
    // The legacy smart-reports governance was locking new operation/settings entries because
    // it only knew old tab ids. Do not apply legacy locked/title state to the v142 sidebar.
    if(!(nav&&nav.classList&&nav.classList.contains('pet-v142-nav'))){
      document.querySelectorAll('#nav button[data-tab]').forEach(function(b){var ok=rr.tabs.indexOf(b.dataset.tab)>-1;b.classList.toggle('locked',!ok);b.title=ok?'':'غير متاح للصلاحية الحالية'});
    }else{
      document.querySelectorAll('#nav button.locked').forEach(function(b){b.classList.remove('locked'); if(b.title==='غير متاح للصلاحية الحالية')b.title='';});
    }
    document.querySelectorAll('#entry .btn-primary,#import .btn-green,#import .btn-primary').forEach(function(x){x.classList.toggle('perm-blocked',!rr.write)});
    document.querySelectorAll('.btn-danger').forEach(function(x){if(!x.closest('#settings'))x.classList.toggle('perm-blocked',!rr.del)});
    var ps=byId('pageSize'); if(ps && settings().defaultPageSize)ps.value=settings().defaultPageSize;
  }
  if(!window.__PETATOE_SETTINGS_TABCHANGE_BOUND__){
    window.__PETATOE_SETTINGS_TABCHANGE_BOUND__=true;
    document.addEventListener('petatoe:tabchange',function(e){var name=e.detail&&e.detail.tabId;setTimeout(function(){if(name==='settings'){ if(typeof window.petatoeRenderSettingsSafe==='function') window.petatoeRenderSettingsSafe(); else if(typeof window.renderSettingsPanelV110==='function') window.renderSettingsPanelV110(); else renderSettingsPanel(); } if(name==='logs')renderLogsPanel(); applyGovernance();},80)});
  }
  if(!window.__PETATOE_GOVERNANCE_CORE_READY__){
  window.__PETATOE_GOVERNANCE_CORE_READY__=true;
  window.petatoeBeforeSaveRecord=function(){
    if(!canWrite()){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('الصلاحية الحالية لا تسمح بالحفظ'):'الصلاحية الحالية لا تسمح بالحفظ');return false}
    try{
      var formFields=(window.fields&&window.fields.length?window.fields:['item','van','date','month','invoice','client','price','qty','disc','tax','totalInc','totalEx','pay']);
      var r={id:window.editingId||Date.now()+Math.random()}; formFields.forEach(function(f){var el=byId('e_'+f); r[f]=el?el.value:''});
      r.date=parseDate(r.date); r.month=normalizeMonth(r.month,r.date); ['price','qty','disc','tax','totalInc','totalEx'].forEach(function(f){r[f]=parseNum(r[f])});
      var v=validateRecord(r,dsRecords(),window.editingId); if(!v.ok){toastSafe(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('لم يتم الحفظ: '):'لم يتم الحفظ: '+v.errors[0]); log('Save Blocked',v.errors.join(' | '),'error');return false}
      if(v.warnings.length && !confirm(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تنبيه جودة بيانات:\n- '):'تنبيه جودة بيانات:\n- '+v.warnings.join('\n- ')+'\nهل تريد الحفظ؟')){log('Save Cancelled',v.warnings.join(' | '),'warn');return false}
    }catch(e){console.warn(e)}
    return true;
  };
  document.addEventListener('petatoe:record-saved',function(e){log(e&&e.detail&&e.detail.mode==='edit'?'Record Updated':'Record Added','Invoice saved','info')});
  // Phase 2: confirmImport is owned by sales/import-engine.js only.
  document.addEventListener('petatoe:record-deleted',function(e){var d=e.detail||{};log('Record Deleted','ID: '+(d.id||''),'warn')});
  document.addEventListener('petatoe:records-cleared',function(){log('All Records Cleared','All records delete requested','warn')});
  document.addEventListener('petatoe:records-exported',function(e){var d=e.detail||{}; if(d.type==='excel')log('Excel Export','Main records exported','info')});
  document.addEventListener('petatoe:tabchange',function(e){var d=e.detail||{}; if(d.tabId==='records') setTimeout(applyGovernance,120);});
  window.addEventListener('load',function(){setTimeout(function(){applyGovernance(); if(document.getElementById('settings')&&document.getElementById('settings').classList.contains('active')){ if(typeof window.petatoeRenderSettingsSafe==='function') window.petatoeRenderSettingsSafe(); else if(typeof window.renderSettingsPanelV110==='function') window.renderSettingsPanelV110(); else renderSettingsPanel(); } log('System Opened','PETATOE session started','info')},700)});
  }
})();