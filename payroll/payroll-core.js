/* PETATOE v8.0.2 — Payroll Supabase Storage Cleanup
   Payroll operational data reads/writes through Supabase runtime cache only. */
(function(){
  'use strict';
  if(window.__PETATOE_PAYROLL_CORE_BOOTED__ && window.PETATOEPayroll) return;
  window.__PETATOE_PAYROLL_CORE_BOOTED__=true;
  var EMP_KEY='PETATOE_PAYROLL_EMPLOYEES_V1';
  var SLIP_KEY='PETATOE_PAYROLL_SLIPS_V1';
  var COMM_SNAPSHOT_KEY='PETATOE_v3_5_COMMISSION_MONTHLY_SNAPSHOTS';
  var JOB_TYPES_KEY='PETATOE_PAYROLL_JOB_TYPES_V1';
  var EMP_CONFIG_KEY='PETATOE_PAYROLL_EMPLOYEE_CONFIG_V1';
  var state={tab:'employees',configTab:'employees',editEmployeeId:'',editSlipId:'',archiveYear:'',archiveMonth:'',archivePayment:'',reportYear:'',reportMonth:'',reportPayment:'',salarySlipId:''};
  function byId(id){return document.getElementById(id)}
  function safeRender(target, html, reason){var el=(typeof target==='string')?byId(target):target;if(!el)return false;try{if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function')return window.PETATOESafeRender.htmlTrusted(el,html,reason||'payroll trusted template')}catch(e){console.warn('PETATOEPayroll safeRender fallback',e)}el.textContent='';el.insertAdjacentHTML('beforeend',String(html==null?'':html));return true}
  function safeAppend(target, html, reason){var el=(typeof target==='string')?byId(target):target;if(!el)return false;try{if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.appendTrusted==='function')return window.PETATOESafeRender.appendTrusted(el,html,reason||'payroll trusted append')}catch(e){console.warn('PETATOEPayroll safeAppend fallback',e)}el.insertAdjacentHTML('beforeend',String(html==null?'':html));return true}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
  function num(v){if(v==null||v==='')return 0;if(typeof v==='number')return isFinite(v)?v:0;var n=parseFloat(String(v).replace(/,/g,'').replace(/SAR|sar|ريال|ر\.س/gi,'').trim());return isNaN(n)?0:n}
  function money(v){try{if(window.PETATOENumber)return PETATOENumber.money(num(v),'SAR')}catch(e){console.warn('PETATOEPayroll money formatter fallback',e)}return num(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' SAR'}
  function toastMsg(m){try{if(typeof toast==='function')toast(m);else alert(m)}catch(e){alert(m)}}

  /* Payroll Supabase storage boundary
     No LocalStorage migration: payroll starts from Supabase data only.
     UI remains synchronous through this runtime cache, while writes persist async to Supabase. */
  var PAYROLL_MASTER_ROW_ID='payroll_master';
  var payrollCache={};
  payrollCache[EMP_KEY]=[];
  payrollCache[SLIP_KEY]=[];
  payrollCache[JOB_TYPES_KEY]=[];
  payrollCache[EMP_CONFIG_KEY]={prefix:'EMP',next:1,digits:4};
  payrollCache[COMM_SNAPSHOT_KEY]={};
  var payrollLoadStarted=false;
  var payrollLoaded=false;

  function payrollRepo(){return window.PETATOESupabaseRepository||null}
  function isPayrollKey(key){return key===EMP_KEY||key===SLIP_KEY||key===JOB_TYPES_KEY||key===EMP_CONFIG_KEY||key===COMM_SNAPSHOT_KEY}
  function cloneVal(v){try{return JSON.parse(JSON.stringify(v));}catch(_e){return v}}
  function read(key,def){
    if(isPayrollKey(key)){
      var v=payrollCache[key];
      if(v===undefined||v===null)return cloneVal(def);
      return cloneVal(v);
    }
    return cloneVal(def);
  }
  function write(key,val){
    if(isPayrollKey(key)){
      var prev=cloneVal(payrollCache[key]);
      payrollCache[key]=cloneVal(val==null?(Array.isArray(prev)?[]:{}):val);
      return persistPayrollKey(key,payrollCache[key],prev);
    }
    console.warn('PETATOEPayroll ignored non-payroll storage write', key);
    return Promise.resolve({ok:false,skipped:true});
  }
  function payrollMasterPayload(){return {jobTypes:payrollCache[JOB_TYPES_KEY]||[],employeeConfig:payrollCache[EMP_CONFIG_KEY]||{prefix:'EMP',next:1,digits:4},commissionSnapshots:payrollCache[COMM_SNAPSHOT_KEY]||{}}}
  function persistMaster(){
    var R=payrollRepo();
    if(!R||!R.hasClient||!R.hasClient())return Promise.resolve({ok:false,skipped:true});
    return R.saveSingleton('payroll_master_data',PAYROLL_MASTER_ROW_ID,payrollMasterPayload()).then(function(res){
      if(res&&!res.ok)throw new Error(res.error||'Payroll master save failed');
      return res||{ok:true};
    }).catch(function(e){console.warn('PETATOEPayroll master persist failed',e);toastMsg('تعذر حفظ تهيئة الرواتب في Supabase');throw e});
  }
  function stablePayload(row){
    var v=cloneVal(row||{});
    if(v&&typeof v==='object'){
      delete v._persistPromise;
    }
    try{return JSON.stringify(v,Object.keys(v||{}).sort())}catch(_e){try{return JSON.stringify(v)}catch(_e2){return String(v)}}
  }
  function persistArrayTable(table,nextRows,prevRows,extraForRow){
    var R=payrollRepo();
    if(!R||!R.hasClient||!R.hasClient())return Promise.resolve({ok:false,skipped:true});
    nextRows=Array.isArray(nextRows)?nextRows:[];
    prevRows=Array.isArray(prevRows)?prevRows:[];
    var nextIds={};
    var prevById={};
    var ops=[];
    prevRows.forEach(function(row){if(row&&row.id!=null)prevById[String(row.id)]=row});
    nextRows.forEach(function(row){if(row&&row.id!=null)nextIds[String(row.id)]=true});
    prevRows.forEach(function(row){
      if(row&&row.id!=null&&!nextIds[String(row.id)]){
        ops.push(R.deleteById(table,row.id).then(function(res){if(res&&!res.ok)throw new Error(res.error||('Delete failed: '+table));return res||{ok:true}}));
      }
    });
    nextRows.forEach(function(row){
      if(!row||row.id==null)return;
      var old=prevById[String(row.id)];
      if(old && stablePayload(old)===stablePayload(row))return;
      ops.push(R.upsertJsonRow(table,row.id,row,extraForRow?extraForRow(row):{}).then(function(res){if(res&&!res.ok)throw new Error(res.error||('Save failed: '+table));return res||{ok:true}}));
    });
    return Promise.all(ops).then(function(){
      try{document.dispatchEvent(new CustomEvent('petatoe:payroll-persisted',{detail:{table:table,count:ops.length,total:nextRows.length}}))}catch(_e){}
      return {ok:true,count:ops.length,total:nextRows.length};
    }).catch(function(e){
      console.warn('PETATOEPayroll persist failed',table,e);
      toastMsg('تعذر حفظ بيانات الرواتب في Supabase');
      throw e;
    });
  }
  function persistPayrollEmployees(nextRows,prevRows){
    var R=payrollRepo();
    if(!R||!R.hasClient||!R.hasClient())return Promise.resolve({ok:false,skipped:true});
    nextRows=Array.isArray(nextRows)?nextRows:[];
    prevRows=Array.isArray(prevRows)?prevRows:[];
    var nextIds={};
    var ops=[];
    nextRows.forEach(function(row){if(row&&row.id!=null)nextIds[String(row.id)]=true});
    prevRows.forEach(function(row){
      if(row&&row.id!=null&&!nextIds[String(row.id)]&&typeof R.deletePayrollEmployee==='function'){
        ops.push(R.deletePayrollEmployee(row).then(function(res){if(res&&!res.ok)throw new Error(res.error||'Employee delete failed');return res||{ok:true}}));
      }
    });
    nextRows.forEach(function(row){
      if(!row||row.id==null)return;
      if(typeof R.upsertPayrollEmployee==='function'){
        ops.push(R.upsertPayrollEmployee(row).then(function(res){if(res&&!res.ok)throw new Error(res.error||'Employee save failed');return res||{ok:true}}));
      }
    });
    return Promise.all(ops).then(function(){return {ok:true,count:nextRows.length}}).catch(function(e){console.warn('PETATOEPayroll employee persist failed',e);toastMsg('تعذر حفظ الموظف في Supabase');throw e});
  }
  function persistPayrollKey(key,val,prev){
    if(key===EMP_KEY){
      return persistPayrollEmployees(val,prev);
    }
    if(key===SLIP_KEY){
      return persistArrayTable('payroll_slips',val,prev,function(slip){var c={net:0};try{if(typeof calcSlip==='function')c=calcSlip(slip)||c}catch(_e){}return {employee_id:String(slip.employeeId||''),period:String(slip.period||''),status:String(slip.status||''),payment_method:String(slip.paymentMethod||''),net_amount:num(c.net||0)};});
    }
    if(key===JOB_TYPES_KEY||key===EMP_CONFIG_KEY||key===COMM_SNAPSHOT_KEY){return persistMaster();}
    return Promise.resolve({ok:true,skipped:true});
  }
  function refreshPayrollViews(){
    try{if(byId('payrollArea'))render()}catch(e){console.warn('PETATOEPayroll render after load failed',e)}
    try{if(byId('salarySlipArea'))renderSalarySlip()}catch(e){console.warn('PETATOEPayroll salary slip render after load failed',e)}
    try{document.dispatchEvent(new CustomEvent('petatoe:payroll-supabase-ready',{detail:{loaded:payrollLoaded}}))}catch(_e){}
  }
  async function loadPayrollFromSupabase(){
    if(payrollLoadStarted)return;
    payrollLoadStarted=true;
    var R=payrollRepo();
    if(!R||!R.hasClient||!R.hasClient()){console.warn('PETATOEPayroll Supabase repository/client not ready');return;}
    try{
      var emps=typeof R.listPayrollEmployees==='function'?await R.listPayrollEmployees():await R.listJsonRows('payroll_employees',{order:'created_at'});
      var slipsRows=await R.listJsonRows('payroll_slips',{order:'created_at'});
      var master=await R.getSingleton('payroll_master_data',PAYROLL_MASTER_ROW_ID,{});
      payrollCache[EMP_KEY]=Array.isArray(emps)?emps:[];
      payrollCache[SLIP_KEY]=Array.isArray(slipsRows)?slipsRows:[];
      payrollCache[JOB_TYPES_KEY]=Array.isArray(master.jobTypes)?master.jobTypes:[];
      payrollCache[EMP_CONFIG_KEY]=employeeConfigNormalize(master.employeeConfig||payrollCache[EMP_CONFIG_KEY]);
      payrollCache[COMM_SNAPSHOT_KEY]=master.commissionSnapshots&&typeof master.commissionSnapshots==='object'?master.commissionSnapshots:{};
      payrollLoaded=true;
      console.log('✅ PETATOE Payroll Supabase storage loaded', {employees:payrollCache[EMP_KEY].length, slips:payrollCache[SLIP_KEY].length});
      refreshPayrollViews();
    }catch(e){console.warn('PETATOEPayroll Supabase load failed',e)}
  }
  function uid(p){return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
  function nowPeriod(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
  function currentArchiveYear(){return String(new Date().getFullYear())}
  function currentArchiveMonth(){return String(new Date().getMonth()+1).padStart(2,'0')}
  function ensureArchiveDefaults(){if(!state.archiveYear)state.archiveYear=currentArchiveYear();if(!state.archiveMonth)state.archiveMonth=currentArchiveMonth();if(state.archivePayment==null)state.archivePayment=''}
  function ensureReportDefaults(){if(!state.reportYear)state.reportYear=currentArchiveYear();if(state.reportMonth==null)state.reportMonth='';if(state.reportPayment==null)state.reportPayment=''}
  function periodLabel(p){var ar=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];var m=String(p||'').match(/^(\d{4})-(\d{2})$/);return m?ar[(+m[2])-1]+' '+m[1]:p}
  function periodYear(p){var m=String(p||'').match(/^(\d{4})-(\d{2})$/);return m?m[1]:''}
  function periodMonth(p){var m=String(p||'').match(/^(\d{4})-(\d{2})$/);return m?m[2]:''}
  function monthName(mm){var ar=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];var i=parseInt(mm,10)-1;return ar[i]||mm}
  function paymentMethods(){return [['','غير محدد'],['mada','مدد'],['bank','تحويل بنكي'],['cash','نقدًا']]}
  function paymentLabel(v){v=String(v||'');var found=paymentMethods().find(function(x){return x[0]===v});return found?found[1]:'غير محدد'}
  function paymentOptions(selected,includeAll){selected=String(selected||'');var opts=includeAll?'<option value="">كل طرق الصرف</option>':'';var methods=paymentMethods();if(includeAll)methods=methods.filter(function(x){return x[0]!==''});return opts+methods.map(function(x){return '<option value="'+esc(x[0])+'" '+(String(x[0])===selected?'selected':'')+'>'+esc(x[1])+'</option>'}).join('')}
  function uniqueSorted(arr,desc){var out=[];(arr||[]).forEach(function(x){x=String(x||'');if(x&&out.indexOf(x)===-1)out.push(x)});out.sort();if(desc)out.reverse();return out}
  function payrollYears(){return uniqueSorted(slips().map(function(s){return periodYear(s.period)}),true)}
  function payrollMonths(year){return uniqueSorted(slips().filter(function(s){return !year||periodYear(s.period)===String(year)}).map(function(s){return periodMonth(s.period)}),false)}
  function norm(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ')}
  var PET_USERS_KEYS=['app_users','petatoe_users_v139','petatoe_users_v108','petatoe_users_v2'];
  function mergeUser(oldU,newU){
    oldU=oldU||{};newU=newU||{};
    return Object.assign({},oldU,newU,{
      id:String(newU.id||newU.userId||newU.uid||oldU.id||oldU.userId||oldU.uid||newU.username||oldU.username||''),
      fullName:(newU.fullName||newU.name||newU.displayName||newU.employeeName||oldU.fullName||oldU.name||oldU.displayName||oldU.employeeName||newU.username||oldU.username||''),
      username:(newU.username||newU.login||oldU.username||oldU.login||''),
      email:(newU.email||oldU.email||''),
      phone:(newU.phone||oldU.phone||''),
      role:(newU.role||oldU.role||''),
      status:(newU.status||oldU.status||'active')
    });
  }
  function pushUsersIntoMap(map,arr){
    if(!Array.isArray(arr))return;
    arr.forEach(function(u){
      if(!u)return;
      var id=String(u.id||u.userId||u.uid||u.username||u.login||u.email||u.fullName||u.name||'').trim();
      if(!id)return;
      var key=String(u.id||u.userId||u.uid||u.username||u.login||u.email||id).toLowerCase();
      map[key]=mergeUser(map[key],Object.assign({},u,{id:id}));
    });
  }
  function appUsers(){
    var map={};
    try{
      var ids=window.PETATOEIdentityStore||window.PETATOESupabaseRepository||null;
      if(ids&&typeof ids.load==='function')ids.load();
      if(ids&&typeof ids.usersSync==='function')pushUsersIntoMap(map,ids.usersSync()||[]);
    }catch(e){console.warn('PETATOEPayroll identity users load failed',e)}
    try{if(window.__PETATOE_SETTINGS_API__&&typeof window.__PETATOE_SETTINGS_API__.users==='function')pushUsersIntoMap(map,window.__PETATOE_SETTINGS_API__.users()||[])}catch(e2){console.warn('PETATOEPayroll settings users load failed',e2)}
    PET_USERS_KEYS.forEach(function(key){
      try{var arr=read(key,[]);pushUsersIntoMap(map,arr)}catch(_e){}
    });
    var list=Object.keys(map).map(function(k){return map[k]});
    return list.filter(function(u){return String(u.status||'active')!=='deleted'});
  }
  function getUserById(id){
    id=String(id||'');var nid=norm(id);
    return appUsers().find(function(u){return String(u.id)===id||norm(u.username)===nid||norm(u.login)===nid||norm(u.email)===nid})||null
  }
  function currentUser(){
    try{if(typeof window.petCurrentUser==='function')return window.petCurrentUser()}catch(e){console.warn('PETATOEPayroll currentUser fallback',e)}
    try{if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function')return window.PETATOEAuth.currentUser()}catch(e2){console.warn('PETATOEPayroll auth currentUser fallback',e2)}
    try{if(window.__PETATOE_ACTIVE_USER__)return window.__PETATOE_ACTIVE_USER__}catch(_e){}
    try{if(window.currentUser)return window.currentUser}catch(_e2){}
    return {id:'',username:'',fullName:'',role:'guest',status:'inactive'};
  }
  function userLabel(u){
    if(!u)return '';
    var full=String(u.fullName||u.name||u.displayName||u.employeeName||'').trim();
    var username=String(u.username||u.login||'').trim();
    var email=String(u.email||'').trim();
    /* عرض الاسم الفعلي للمستخدم وليس الدور أو اسم الدخول متى كان متاحًا */
    if(full && norm(full)!==norm(u.role) && norm(full)!==norm(username))return full;
    if(email)return email;
    if(username)return username;
    return String(u.id||'');
  }
  function userOptions(selected){
    var users=appUsers();
    if(!users.length)users=[currentUser()];
    users=users.slice().sort(function(a,b){return userLabel(a).localeCompare(userLabel(b),'ar')});
    return '<option value="">بدون ربط</option>'+users.map(function(u){var id=String(u.id||'');return '<option value="'+esc(id)+'" '+(id===String(selected||'')?'selected':'')+'>'+esc(userLabel(u))+'</option>'}).join('')
  }
  function userTextForEmployee(e){var u=e&&e.userId?getUserById(e.userId):null;return u?userLabel(u):(e&&e.userKey?e.userKey:'غير مربوط')}
  function isAdmin(){var u=currentUser();return ['superadmin','admin'].indexOf(String(u.role||''))>-1}
  function isBoard(){var u=currentUser();var r=String(u.role||'');var text=norm((u.job||'')+' '+(u.fullName||'')+' '+(u.username||''));return isAdmin()||r==='chairman'||text.indexOf('رئيس مجلس')>-1||text.indexOf('chairman')>-1}
  function isAccounts(){var u=currentUser();var r=String(u.role||'');return isAdmin()||r==='accountant'||r==='accounts'}
  function canCancelApproval(){var u=currentUser();if(isAdmin())return true;try{if(window.PETATOEPermissions&&window.PETATOEPermissions.canSpecial)return !!window.PETATOEPermissions.canSpecial(String(u.id||''),'payroll_cancel_approval')}catch(e){console.warn('PETATOEPayroll permission check failed',e)}return false}
  function notifyAfterPersist(promise,successMsg){
    if(promise&&typeof promise.then==='function'){
      return promise.then(function(){
        if(successMsg)toastMsg(successMsg);
        try{document.dispatchEvent(new CustomEvent('petatoe:payroll-status-persisted'))}catch(_e){}
        return true;
      }).catch(function(e){
        console.warn('PETATOEPayroll status persistence failed',e);
        toastMsg('لم يتم حفظ تغيير حالة كشف الراتب في قاعدة البيانات');
        return false;
      });
    }
    if(successMsg)toastMsg(successMsg);
    return Promise.resolve(true);
  }
  function employees(){var arr=read(EMP_KEY,[]);return Array.isArray(arr)?arr:[]}
  function saveEmployees(arr){return write(EMP_KEY,arr)}

  function employeeConfig(){var cfg=read(EMP_CONFIG_KEY,null);if(!cfg||typeof cfg!=='object')cfg={prefix:'EMP',next:1,digits:4};cfg.prefix=String(cfg.prefix||'EMP').trim()||'EMP';cfg.next=Math.max(1,parseInt(cfg.next||1,10)||1);cfg.digits=Math.max(2,parseInt(cfg.digits||4,10)||4);return cfg}
  function saveEmployeeConfig(cfg){write(EMP_CONFIG_KEY,employeeConfigNormalize(cfg))}
  function employeeConfigNormalize(cfg){cfg=cfg||{};return {prefix:String(cfg.prefix||'EMP').trim()||'EMP',next:Math.max(1,parseInt(cfg.next||1,10)||1),digits:Math.max(2,parseInt(cfg.digits||4,10)||4)}}
  function formatEmployeeCode(n,cfg){cfg=employeeConfigNormalize(cfg||employeeConfig());return cfg.prefix+'-'+String(n).padStart(cfg.digits,'0')}
  function firstAvailableEmployeeCode(ignoreId){
    var cfg=employeeConfig();
    var existing=employees().filter(function(e){return !ignoreId||String(e.id)!==String(ignoreId)}).map(function(e){return String(e.code||'').trim()}).filter(Boolean);
    var used={};existing.forEach(function(code){used[code]=true});
    var n=cfg.next;
    var guard=0;
    while(used[formatEmployeeCode(n,cfg)]&&guard<100000){n++;guard++}
    return formatEmployeeCode(n,cfg)
  }
  function generateEmployeeCode(ignoreId){return firstAvailableEmployeeCode(ignoreId)}
  function isDuplicateEmployeeCode(code,ignoreId){code=String(code||'').trim();if(!code)return false;return employees().some(function(e){return String(e.id)!==String(ignoreId||'')&&String(e.code||'').trim()===code})}

  function jobTypes(){var arr=read(JOB_TYPES_KEY,[]);if(!Array.isArray(arr)||!arr.length)arr=['مدير','محاسب','مندوب مبيعات','جروومر','سائق','إداري'];return arr.filter(function(x){return String(x||'').trim()})}
  function saveJobTypes(arr){write(JOB_TYPES_KEY,(Array.isArray(arr)?arr:[]).map(function(x){return String(x||'').trim()}).filter(Boolean))}
  function jobOptions(selected){var exists=false;var html=jobTypes().map(function(j){var sel=String(j)===String(selected||'');if(sel)exists=true;return '<option value="'+esc(j)+'" '+(sel?'selected':'')+'>'+esc(j)+'</option>'}).join('');if(selected&&!exists)html='<option value="'+esc(selected)+'" selected>'+esc(selected)+'</option>'+html;return '<option value="">اختر الوظيفة</option>'+html}
  function employeeStatusLabel(st){return ({active:'نشط',stopped:'موقوف',resigned:'مستقيل'})[st]||st||'نشط'}
  function employeeStatusBadge(st){var cls=st==='active'?'ok':(st==='stopped'?'warn':'bad');return '<span class="payroll-badge '+cls+'">'+esc(employeeStatusLabel(st))+'</span>'}
  function employeeStatusPicker(value){
    value=value||'active';
    var items=[['active','نشط'],['stopped','موقوف'],['resigned','مستقيل']];
    return '<select id="peStatus" class="payroll-native-select">'+items.map(function(x){return '<option value="'+x[0]+'" '+(value===x[0]?'selected':'')+'>'+x[1]+'</option>'}).join('')+'</select>';
  }


  function slips(){var arr=read(SLIP_KEY,[]);return Array.isArray(arr)?arr:[]}
  function saveSlips(arr){return write(SLIP_KEY,arr)}
  function setSlipsCache(arr){payrollCache[SLIP_KEY]=cloneVal(Array.isArray(arr)?arr:[]);return Promise.resolve({ok:true,cached:true})}
  function slipPersistenceExtra(slip){var c={net:0};try{if(typeof calcSlip==='function')c=calcSlip(slip)||c}catch(_e){}return {employee_id:String(slip&&slip.employeeId||''),period:String(slip&&slip.period||''),status:String(slip&&slip.status||''),net_amount:num(c.net||0)}}
  function persistOneSlip(slip){var R=payrollRepo();if(!slip||!slip.id)return Promise.resolve({ok:false,skipped:true});if(!R||!R.hasClient||!R.hasClient())return Promise.resolve({ok:false,skipped:true});return R.upsertJsonRow('payroll_slips',slip.id,slip,slipPersistenceExtra(slip)).then(function(res){if(res&&!res.ok)throw new Error(res.error||'Save failed: payroll_slips');return res||{ok:true}}).catch(function(e){console.warn('PETATOEPayroll single slip persist failed',e);throw e})}
  function removeOneSlip(id){var R=payrollRepo();if(!id)return Promise.resolve({ok:false,skipped:true});if(!R||!R.hasClient||!R.hasClient())return Promise.resolve({ok:false,skipped:true});return R.deleteById('payroll_slips',id).then(function(res){if(res&&!res.ok)throw new Error(res.error||'Delete failed: payroll_slips');return res||{ok:true}}).catch(function(e){console.warn('PETATOEPayroll single slip delete failed',e);throw e})}
  function getEmployee(id){return employees().find(function(e){return e.id===id})||null}
  function activeEmployees(){return employees().filter(function(e){return e.status!=='stopped'&&e.status!=='resigned'})}
  function statusInfo(st){var map={draft:['مسودة','warn'],pending_board:['بانتظار اعتماد رئيس مجلس الإدارة','warn'],board_approved:['معتمد مبدئيًا - بانتظار موافقة الموظف','ok'],employee_objection:['اعتراض من الموظف','bad'],employee_approved:['موافق عليه من الموظف - جاهز للحسابات','ok'],accounts_approved:['معتمد للصرف','ok'],paid:['تم الصرف','ok'],rejected:['مرفوض','bad']};return map[st]||[st||'مسودة','warn']}
  function statusBadge(st){var x=statusInfo(st);return '<span class="payroll-badge '+x[1]+'">'+esc(x[0])+'</span>'}
  function readCommissionSnapshots(){var s=read(COMM_SNAPSHOT_KEY,{});return s&&typeof s==='object'?s:{}}
  function readCommissionStore(){
    var s=read(COMM_SNAPSHOT_KEY,{});
    return s&&typeof s==='object'?s:{};
  }
  function addUniqueCommissionName(out,name){
    name=String(name||'').trim();
    if(name&&out.map(norm).indexOf(norm(name))===-1)out.push(name);
  }
  function currentCommissionEmployeeNames(){
    var st=readCommissionStore();
    var emp=(st&&st.employees)||{};
    var out=[];
    ['groomers','drivers','sales','groomer','driver'].forEach(function(k){
      (Array.isArray(emp[k])?emp[k]:[]).forEach(function(r){addUniqueCommissionName(out,r&&r.name)});
    });
    return out;
  }
  function snapshotCommissionEmployeeNames(){
    var snaps=readCommissionSnapshots();var out=[];
    Object.keys(snaps||{}).forEach(function(period){var snap=snaps[period]||{};['groomer','driver','sales'].forEach(function(k){(snap[k]||[]).forEach(function(r){addUniqueCommissionName(out,commissionPersonName(r))})})});
    return out;
  }
  function commissionAliases(emp){
    emp=emp||{};
    var linked=emp.userId?getUserById(emp.userId):null;
    var raw=[emp.name,emp.userKey,emp.username,emp.email,emp.phone,linked&&linked.fullName,linked&&linked.name,linked&&linked.displayName,linked&&linked.username,linked&&linked.email,linked&&linked.phone];
    var out=[];raw.forEach(function(x){x=norm(x);if(x&&out.indexOf(x)===-1)out.push(x)});return out;
  }
  function commissionPersonName(row){row=row||{};return row.person||row.name||row.employee||row.employeeName||row.salesPerson||row.driver||row.groomer||''}
  function payrollEmployeeNames(){
    var out=[];
    employees().forEach(function(e){
      if(!e||String(e.status||'active')==='deleted')return;
      addUniqueCommissionName(out,e.name||e.fullName||e.employeeName);
    });
    return out;
  }
  function commissionEmployeeNames(){
    var out=[];
    payrollEmployeeNames().forEach(function(name){addUniqueCommissionName(out,name)});
    currentCommissionEmployeeNames().forEach(function(name){addUniqueCommissionName(out,name)});
    snapshotCommissionEmployeeNames().forEach(function(name){addUniqueCommissionName(out,name)});
    return out.sort(function(a,b){return a.localeCompare(b,'ar')});
  }
  function commissionEmployeeOptions(selected){
    selected=String(selected||'');var exists=false;var opts=commissionEmployeeNames().map(function(name){var sel=norm(name)===norm(selected);if(sel)exists=true;return '<option value="'+esc(name)+'" '+(sel?'selected':'')+'>'+esc(name)+'</option>'}).join('');
    if(selected&&!exists)opts='<option value="'+esc(selected)+'" selected>'+esc(selected)+'</option>'+opts;
    return '<option value="">بدون ربط / استخدم المنطق القديم</option>'+opts;
  }
  function commissionFor(emp,period){return commissionDetail(emp,period).total}
  function commissionDetail(emp,period){
    var snap=readCommissionSnapshots()[period];var mappedName=String((emp||{}).commissionEmployeeName||'').trim();var aliases=mappedName?[norm(mappedName)]:commissionAliases(emp);var matches=[];
    if(!snap)return {total:0,matches:matches,source:'no_snapshot',mappedName:mappedName,mode:mappedName?'manual':'legacy'};
    ['groomer','driver','sales'].forEach(function(k){(snap[k]||[]).forEach(function(r){var person=norm(commissionPersonName(r));if(person&&aliases.indexOf(person)>-1)matches.push({type:k,person:commissionPersonName(r),car:r.car||'',commission:num(r.commission)})})});
    return {total:matches.reduce(function(sum,x){return sum+num(x.commission)},0),matches:matches,source:matches.length?'matched':'not_matched',mappedName:mappedName,mode:mappedName?'manual':'legacy'};
  }
  function commissionStatusNote(detail){
    detail=detail||{source:'no_snapshot',matches:[]};
    if(detail.source==='no_snapshot')return 'لم يتم العثور على شهر مقفول في قسم العمولات لنفس فترة كشف الراتب.';
    if(detail.source==='not_matched')return detail.mode==='manual'?'لا توجد عمولة مطابقة لاسم العمولات المرتبط: '+(detail.mappedName||'غير محدد'):'لا توجد عمولة مطابقة لهذا الموظف داخل Snapshot العمولات لنفس الشهر.';
    var names=(detail.matches||[]).map(function(x){return x.person}).filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i});
    return (detail.mode==='manual'?'مرتبطة يدويًا بقسم العمولات':'مرتبطة بقسم العمولات بالمنطق القديم')+' — '+(names.length?('الاسم المطابق: '+names.join(' / ')):'تمت المطابقة');
  }
  function sumLines(lines){return (Array.isArray(lines)?lines:[]).reduce(function(s,x){return s+num(x.value)},0)}
  function calcSlip(slip){var emp=getEmployee(slip.employeeId)||{};var cd=commissionDetail(emp,slip.period);var commission=cd.total;var additions=sumLines(slip.additions);var deductions=sumLines(slip.deductions);var gross=num(slip.base)+num(slip.housing)+num(slip.transport)+commission+num(slip.incentives)+additions;var net=gross-deductions;return {commission:commission,commissionDetail:cd,additions:additions,deductions:deductions,gross:gross,net:net}}
  function identityKeys(obj){
    obj=obj||{};
    var keys=[];
    ['id','userId','uid','supabase_id','username','login','email','fullName','name','userKey','phone'].forEach(function(k){
      var v=obj[k];
      if(v!==null&&v!==undefined&&String(v).trim())keys.push(norm(v));
    });
    return keys.filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i});
  }
  function employeeLinkedToCurrentUser(emp){
    if(!emp)return false;
    var u=currentUser();
    var userKeys=identityKeys(u);
    var empKeys=identityKeys(emp);
    /* Phase 32: employee.userId can be stored as username/login label (e.g. Brian),
       while currentUser.id can be an internal/Supabase id. Do not fail on id-only mismatch;
       compare all stable identity keys used by auth, users, and payroll linking. */
    return userKeys.some(function(k){return empKeys.indexOf(k)>-1});
  }
  function canEmployeeSee(slip){var emp=getEmployee(slip.employeeId);return employeeLinkedToCurrentUser(emp)}
  function lineInputsHtml(kind,lines){lines=Array.isArray(lines)?lines:[];return '<div class="payroll-lines" id="'+kind+'Lines">'+lines.map(function(x,i){return lineRowHtml(kind,i,x.name,x.value)}).join('')+'</div><button type="button" class="btn btn-ghost" data-payroll-action="add-line" data-payroll-kind="'+esc(kind)+'">+ إضافة بند</button>'}
  function lineRowHtml(kind,i,name,value){return '<div class="payroll-line" data-line-kind="'+kind+'"><input data-line-name="'+kind+'" placeholder="اسم البند" value="'+esc(name||'')+'"><input data-line-value="'+kind+'" type="number" step="0.01" placeholder="القيمة" value="'+esc(value||'')+'"><button type="button" class="btn btn-danger" data-payroll-action="remove-line">حذف</button></div>'}
  function collectLines(kind){return Array.prototype.slice.call(document.querySelectorAll('[data-line-kind="'+kind+'"]')).map(function(row){return {name:(row.querySelector('[data-line-name]')||{}).value||'',value:num((row.querySelector('[data-line-value]')||{}).value)}}).filter(function(x){return x.name.trim()||num(x.value)})}
  function employeeOptions(selected){return activeEmployees().map(function(e){return '<option value="'+esc(e.id)+'" '+(e.id===selected?'selected':'')+'>'+esc(e.name)+'</option>'}).join('')}
  function yearMonthFilters(){return '<div class="payroll-grid-3"><div class="payroll-field"><label>الشهر</label><input id="payPeriod" type="month" value="'+esc(byId('payPeriod')&&byId('payPeriod').value||nowPeriod())+'"></div><div class="payroll-field"><label>الموظف</label><select id="payEmployee"><option value="">اختر موظف</option>'+employeeOptions('')+'</select></div><div class="payroll-field"><label>&nbsp;</label><button class="btn btn-primary" data-payroll-action="load-slip-form">فتح / إنشاء الكشف</button></div></div>'}
  function tabsHtml(){var tabs=[['employees','👨‍💼 الموظفون'],['monthly','💰 الرواتب الشهرية'],['board','📋 اعتماد رئيس مجلس الإدارة'],['accounts','🏦 الحسابات'],['archive','📚 سجل الرواتب'],['monthlyReport','📊 تقرير الرواتب الشهرية'],['config','⚙️ التهيئة']];return '<div class="payroll-tabs">'+tabs.map(function(t){var active=state.tab===t[0];return '<button type="button" data-payroll-tab="'+t[0]+'" aria-selected="'+(active?'true':'false')+'" class="payroll-tab '+(active?'active':'')+'" data-payroll-action="open-tab">'+t[1]+'</button>'}).join('')+'</div>'}
  function render(){var area=byId('payrollArea');if(!area)return;var body='';if(state.tab==='employees')body=renderEmployees();if(state.tab==='monthly')body=renderMonthly();if(state.tab==='board')body=renderBoard();if(state.tab==='accounts')body=renderAccounts();if(state.tab==='archive')body=renderArchive();if(state.tab==='monthlyReport')body=renderMonthlyReport();if(state.tab==='config')body=renderConfig();safeRender(area,'<div class="payroll-shell">'+tabsHtml()+body+'</div>','payroll shell render')}
  function employeeRowsHtml(){var arr=employees();return arr.map(function(e,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(e.code||'')+'</td><td>'+esc(e.name)+'</td><td>'+esc(e.job||'')+'</td><td>'+esc(userTextForEmployee(e))+'</td><td>'+esc(e.commissionEmployeeName||'—')+'</td><td>'+money(e.base)+'</td><td>'+money(e.housing)+'</td><td>'+money(e.transport)+'</td><td>'+esc(paymentLabel(e.paymentMethod))+'</td><td>'+employeeStatusBadge(e.status||'active')+'</td><td><button class="btn btn-ghost" data-payroll-action="edit-employee" data-payroll-id="'+esc(e.id)+'">تعديل</button><button class="btn btn-danger" data-payroll-action="delete-employee" data-payroll-id="'+esc(e.id)+'">حذف</button></td></tr>'}).join('')||'<tr><td colspan="12">لا يوجد موظفون في الرواتب بعد.</td></tr>'}
  function employeesTableHtml(title,note){return '<div class="payroll-card"><h3>'+esc(title||'👨‍💼 قائمة الموظفين')+'</h3>'+(note?'<p>'+note+'</p>':'')+'<div class="payroll-table"><table><thead><tr><th>#</th><th>الكود</th><th>الموظف</th><th>الوظيفة</th><th>اليوزر المرتبط</th><th>اسم العمولات المرتبط</th><th>الأساسي</th><th>السكن</th><th>المواصلات</th><th>طريقة الصرف</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>'+employeeRowsHtml()+'</tbody></table></div></div>'}
  function employeeFormHtml(){return '<div class="payroll-card"><h3>👥 إضافة / تعديل موظف</h3><div class="payroll-grid"><div class="payroll-field"><label>كود الموظف</label><input id="peCode" placeholder="Auto / اختياري"></div><div class="payroll-field"><label>اسم الموظف</label><input id="peName" placeholder="اسم الموظف"></div><div class="payroll-field"><label>الوظيفة</label><select id="peJob">'+jobOptions('')+'</select></div><div class="payroll-field"><label>ربط يوزر الموظف</label><select id="peUserId">'+userOptions('')+'</select></div><div class="payroll-field"><label>اسم الموظف المرتبط بالعمولات</label><select id="peCommissionEmployeeName">'+commissionEmployeeOptions('')+'</select></div><div class="payroll-field"><label>الراتب الأساسي</label><input id="peBase" type="number" step="0.01"></div><div class="payroll-field"><label>بدل السكن</label><input id="peHousing" type="number" step="0.01"></div><div class="payroll-field"><label>بدل المواصلات</label><input id="peTransport" type="number" step="0.01"></div><div class="payroll-field"><label>طريقة صرف الراتب الافتراضية</label><select id="pePaymentMethod">'+paymentOptions('',false)+'</select></div><div class="payroll-field"><label>الحالة</label>'+employeeStatusPicker('active')+'</div></div><div class="payroll-actions"><button class="btn btn-green" data-payroll-action="save-employee">💾 حفظ الموظف</button><button class="btn btn-ghost" data-payroll-action="clear-employee-form">تفريغ</button></div><input type="hidden" id="peId"></div>'}
  function renderEmployees(){return employeesTableHtml('👨‍💼 قائمة الموظفين والراتب الأساسي','')}
  function configTabsHtml(){var tabs=[['employees','👥 إضافة الموظفين'],['jobs','💼 الوظائف']];return '<div class="payroll-config-tabs">'+tabs.map(function(t){var active=state.configTab===t[0];return '<button type="button" class="payroll-config-tab '+(active?'active':'')+'" aria-selected="'+(active?'true':'false')+'" data-payroll-action="open-config-tab" data-payroll-tab="'+esc(t[0])+'">'+t[1]+'</button>'}).join('')+'</div>'}
  function renderConfigEmployees(){var cfg=employeeConfig();return '<div class="payroll-card"><h3>👥 تهيئة إضافة الموظفين</h3><div class="payroll-grid-3"><div class="payroll-field"><label>بادئة الكود</label><input id="payEmpCodePrefix" value="'+esc(cfg.prefix)+'" placeholder="EMP"></div><div class="payroll-field"><label>رقم البداية القادم</label><input id="payEmpCodeNext" type="number" min="1" step="1" value="'+esc(cfg.next)+'"></div><div class="payroll-field"><label>عدد الخانات</label><input id="payEmpCodeDigits" type="number" min="2" step="1" value="'+esc(cfg.digits)+'"></div></div><div class="payroll-actions"><button class="btn btn-green" data-payroll-action="save-employee-code-config">💾 حفظ تهيئة أكواد الموظفين</button><span class="salary-slip-note">أول كود متاح حاليًا: <b>'+esc(firstAvailableEmployeeCode())+'</b></span></div></div>'+employeeFormHtml()+employeesTableHtml('📋 الموظفون المضافون','')}
  function renderConfigJobs(){var rows=jobTypes().map(function(j,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(j)+'</td><td><button class="btn btn-ghost" data-payroll-action="edit-job-type" data-payroll-name="'+esc(j)+'">تعديل</button><button class="btn btn-danger" data-payroll-action="delete-job-type" data-payroll-name="'+esc(j)+'">حذف</button></td></tr>'}).join('')||'<tr><td colspan="3">لا توجد وظائف مضافة.</td></tr>';return '<div class="payroll-card"><h3>💼 تهيئة الوظائف</h3><p>أضف أو عدّل أنواع الوظائف، ثم اخترها تلقائيًا عند إضافة الموظف.</p><div class="payroll-grid-3"><input id="payJobTypeOriginal" type="hidden"><div class="payroll-field"><label>نوع الوظيفة</label><input id="payJobTypeName" placeholder="مثال: محاسب / مندوب مبيعات"></div><div class="payroll-field"><label>&nbsp;</label><button class="btn btn-green" data-payroll-action="save-job-type">💾 حفظ الوظيفة</button></div><div class="payroll-field"><label>&nbsp;</label><button class="btn btn-ghost" data-payroll-action="clear-job-type-form">تفريغ</button></div></div><div class="payroll-table"><table><thead><tr><th>#</th><th>الوظيفة</th><th>إجراءات</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'}
  function renderConfig(){var body=state.configTab==='jobs'?renderConfigJobs():renderConfigEmployees();return '<div class="payroll-card payroll-config-shell"><h3>⚙️ تهيئة الرواتب</h3>'+configTabsHtml()+'</div>'+body}
  function renderMonthly(){return '<div class="payroll-card"><h3>💰 إنشاء / تعديل كشف راتب شهري</h3>'+yearMonthFilters()+'<div id="paySlipFormArea"></div></div>'+recordsTable('monthly')}
  function slipFormHtml(slip){var emp=getEmployee(slip.employeeId)||{};var c=calcSlip(slip);return '<div class="payroll-card" style="margin-top:12px"><h3>كشف: '+esc(emp.name||'')+' — '+esc(periodLabel(slip.period))+'</h3><div class="payroll-grid"><div class="payroll-field"><label>الراتب الأساسي</label><input id="psBase" type="number" step="0.01" value="'+esc(slip.base)+'"></div><div class="payroll-field"><label>بدل السكن</label><input id="psHousing" type="number" step="0.01" value="'+esc(slip.housing)+'"></div><div class="payroll-field"><label>بدل المواصلات</label><input id="psTransport" type="number" step="0.01" value="'+esc(slip.transport)+'"></div><div class="payroll-field"><label>💼 العمولات والإضافي</label><input readonly value="'+esc(c.commission.toFixed(2))+'"></div><div class="payroll-field"><label>🎁 الحوافز</label><input id="psIncentives" type="number" step="0.01" value="'+esc(slip.incentives||0)+'"></div><div class="payroll-field"><label>طريقة صرف الراتب</label><select id="psPaymentMethod">'+paymentOptions(slip.paymentMethod||emp.paymentMethod||'',false)+'</select></div></div><hr><h4>➕ إضافات أخرى</h4>'+lineInputsHtml('additions',slip.additions)+'<h4>➖ خصومات أخرى</h4>'+lineInputsHtml('deductions',slip.deductions)+'<div class="payroll-actions"><button class="btn btn-green" data-payroll-action="save-slip">💾 حفظ كمسودة</button><button class="btn btn-primary" data-payroll-action="send-to-board">📤 إرسال لاعتماد رئيس مجلس الإدارة</button><span class="payroll-badge ok">الصافي الحالي: '+money(c.net)+'</span></div><input type="hidden" id="psId" value="'+esc(slip.id)+'"><input type="hidden" id="psEmployeeId" value="'+esc(slip.employeeId)+'"><input type="hidden" id="psPeriod" value="'+esc(slip.period)+'"></div>'}
  function cancelApprovalButton(s){if(!canCancelApproval())return '';if(['board_approved','employee_objection','employee_approved','accounts_approved','paid','rejected'].indexOf(s.status)===-1)return '';return '<button class="btn btn-danger" data-payroll-action="cancel-approval" data-payroll-id="'+esc(s.id)+'">إلغاء الاعتماد</button>'}
  function archiveFiltersHtml(){ensureArchiveDefaults();var years=payrollYears();var year=state.archiveYear||currentArchiveYear();if(year&&years.indexOf(year)===-1)years.unshift(year);var months=payrollMonths(year);var month=state.archiveMonth||currentArchiveMonth();if(month&&months.indexOf(month)===-1)months.unshift(month);var pay=state.archivePayment||'';var yOpts='<option value="">كل السنوات</option>'+years.map(function(y){return '<option value="'+esc(y)+'" '+(String(y)===String(year)?'selected':'')+'>'+esc(y)+'</option>'}).join('');var mOpts='<option value="">كل الشهور</option>'+months.map(function(m){return '<option value="'+esc(m)+'" '+(String(m)===String(month)?'selected':'')+'>'+esc(monthName(m))+'</option>'}).join('');return '<div class="payroll-grid-4 payroll-archive-filters"><div class="payroll-field"><label>السنة</label><select id="payArchiveYear" data-payroll-change="archive-year">'+yOpts+'</select></div><div class="payroll-field"><label>الشهر</label><select id="payArchiveMonth" data-payroll-change="archive-month">'+mOpts+'</select></div><div class="payroll-field"><label>طريقة الصرف</label><select id="payArchivePayment" data-payroll-change="archive-payment">'+paymentOptions(pay,true)+'</select></div><div class="payroll-field payroll-filter-actions"><label>&nbsp;</label><button class="btn btn-primary" data-payroll-action="export-archive-pdf">PDF 🖨️</button><button class="btn btn-ghost" data-payroll-action="clear-archive-filter">Reset 🔄</button></div></div>'}
  function archiveFilteredSlips(){ensureArchiveDefaults();var arr=slips().slice().sort(function(a,b){return String(b.period).localeCompare(String(a.period))});if(state.archiveYear)arr=arr.filter(function(s){return periodYear(s.period)===String(state.archiveYear)});if(state.archiveMonth)arr=arr.filter(function(s){return periodMonth(s.period)===String(state.archiveMonth)});if(state.archivePayment)arr=arr.filter(function(s){return String(s.paymentMethod||'')===String(state.archivePayment)});return arr}
  function archiveTotalsHtml(arr){var t={base:0,housing:0,transport:0,commission:0,incentives:0,additions:0,deductions:0,net:0};(arr||[]).forEach(function(s){var c=calcSlip(s);t.base+=num(s.base);t.housing+=num(s.housing);t.transport+=num(s.transport);t.commission+=num(c.commission);t.incentives+=num(s.incentives);t.additions+=num(c.additions);t.deductions+=num(c.deductions);t.net+=num(c.net)});return '<tfoot><tr class="payroll-total-row"><td colspan="4">الإجمالي</td><td>'+money(t.base)+'</td><td>'+money(t.housing)+'</td><td>'+money(t.transport)+'</td><td>'+money(t.commission)+'</td><td>'+money(t.incentives)+'</td><td>'+money(t.additions)+'</td><td>'+money(t.deductions)+'</td><td><b>'+money(t.net)+'</b></td><td colspan="3">عدد الكشوف: '+(arr||[]).length+'</td></tr></tfoot>'}
  function recordsTable(mode){var arr=mode==='archive'?archiveFilteredSlips():slips().filter(function(s){return s.status!=='paid'}).sort(function(a,b){return String(b.period).localeCompare(String(a.period))});var title='📚 الكشوف الحالية';var filters='';if(mode==='archive'){title='📚 سجل الرواتب';filters=archiveFiltersHtml()}var rows=arr.map(function(s,i){var emp=getEmployee(s.employeeId)||{};var c=calcSlip(s);var deleteBtn=mode==='monthly'?'<button class="btn btn-danger" data-payroll-action="delete-slip" data-payroll-id="'+esc(s.id)+'">حذف</button>':'';return '<tr><td>'+(i+1)+'</td><td>'+esc(s.period)+'</td><td>'+esc(emp.name||'محذوف')+'</td><td>'+esc(paymentLabel(s.paymentMethod))+'</td><td>'+money(s.base)+'</td><td>'+money(s.housing)+'</td><td>'+money(s.transport)+'</td><td>'+money(c.commission)+'</td><td>'+money(s.incentives)+'</td><td>'+money(c.additions)+'</td><td>'+money(c.deductions)+'</td><td><b>'+money(c.net)+'</b></td><td>'+statusBadge(s.status)+'</td><td><button class="btn btn-ghost" data-payroll-action="edit-slip" data-payroll-id="'+esc(s.id)+'">فتح</button>'+deleteBtn+cancelApprovalButton(s)+'</td></tr>'}).join('')||'<tr><td colspan="14">لا توجد كشوف رواتب بعد.</td></tr>';var totals=mode==='archive'?archiveTotalsHtml(arr):'';return '<div class="payroll-card"><h3>'+title+'</h3>'+filters+'<div class="payroll-table"><table><thead><tr><th>#</th><th>الشهر</th><th>الموظف</th><th>طريقة الصرف</th><th>أساسي</th><th>سكن</th><th>مواصلات</th><th>عمولات وإضافي</th><th>حوافز</th><th>إضافات أخرى</th><th>خصومات</th><th>الصافي</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>'+rows+'</tbody>'+totals+'</table></div></div>'}
  function renderBoard(){var rows=slips().filter(function(s){return ['pending_board','board_approved','rejected'].indexOf(s.status)>-1}).map(function(s,i){var emp=getEmployee(s.employeeId)||{};var c=calcSlip(s);return '<tr><td>'+(i+1)+'</td><td>'+esc(s.period)+'</td><td>'+esc(emp.name||'')+'</td><td>'+esc(paymentLabel(s.paymentMethod))+'</td><td>'+money(c.net)+'</td><td>'+statusBadge(s.status)+'</td><td><button class="btn btn-green" data-payroll-action="board-approve" data-payroll-id="'+esc(s.id)+'">اعتماد مبدئي</button><button class="btn btn-danger" data-payroll-action="reject-slip" data-payroll-id="'+esc(s.id)+'">رفض</button>'+cancelApprovalButton(s)+'</td></tr>'}).join('')||'<tr><td colspan="7">لا توجد كشوف بانتظار الاعتماد.</td></tr>';return '<div class="payroll-card"><h3>📋 اعتماد رئيس مجلس الإدارة</h3><p>بعد الاعتماد المبدئي يظهر كشف الراتب للموظف في شاشة 📄 كشف الراتب.</p><div class="payroll-table"><table><thead><tr><th>#</th><th>الشهر</th><th>الموظف</th><th>طريقة الصرف</th><th>الصافي</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'}
  function renderAccounts(){var arr=slips().filter(function(s){return s.status!=='paid'});var rows=arr.map(function(s,i){var emp=getEmployee(s.employeeId)||{};var c=calcSlip(s);var ready=s.status==='employee_approved';var paid=s.status==='accounts_approved';return '<tr><td>'+(i+1)+'</td><td>'+esc(s.period)+'</td><td>'+esc(emp.name||'')+'</td><td>'+esc(paymentLabel(s.paymentMethod))+'</td><td>'+money(c.net)+'</td><td>'+statusBadge(s.status)+'</td><td>'+esc(s.employeeNote||'-')+'</td><td><button class="btn btn-green" '+(ready?'':'disabled')+' data-payroll-action="accounts-approve" data-payroll-id="'+esc(s.id)+'">اعتماد للصرف</button><button class="btn btn-primary" '+(paid?'':'disabled')+' data-payroll-action="mark-paid" data-payroll-id="'+esc(s.id)+'">تم الصرف</button>'+cancelApprovalButton(s)+'</td></tr>'}).join('')||'<tr><td colspan="8">لا توجد كشوف رواتب معلقة للحسابات.</td></tr>';return '<div class="payroll-card"><h3>🏦 شاشة الحسابات</h3><div class="payroll-table"><table><thead><tr><th>#</th><th>الشهر</th><th>الموظف</th><th>طريقة الصرف</th><th>الصافي</th><th>الحالة</th><th>ملاحظة الموظف</th><th>إجراءات</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'}
  function reportYears(){var years=payrollYears();var y=currentArchiveYear();if(years.indexOf(y)===-1)years.unshift(y);return years}
  function reportMonths(year){var months=payrollMonths(year);for(var i=1;i<=12;i++){var mm=String(i).padStart(2,'0');if(months.indexOf(mm)===-1)months.push(mm)}months.sort();return months}
  function monthlyReportFiltersHtml(){ensureReportDefaults();var years=reportYears();var year=state.reportYear||currentArchiveYear();var months=reportMonths(year);var yOpts=years.map(function(y){return '<option value="'+esc(y)+'" '+(String(y)===String(year)?'selected':'')+'>'+esc(y)+'</option>'}).join('');var mOpts='<option value="">كل الشهور</option>'+months.map(function(m){return '<option value="'+esc(m)+'" '+(String(m)===String(state.reportMonth||'')?'selected':'')+'>'+esc(monthName(m))+'</option>'}).join('');return '<div class="payroll-grid-4 payroll-archive-filters"><div class="payroll-field"><label>السنة</label><select id="payMonthlyReportYear" data-payroll-change="monthly-report-year">'+yOpts+'</select></div><div class="payroll-field"><label>الشهر</label><select id="payMonthlyReportMonth" data-payroll-change="monthly-report-month">'+mOpts+'</select></div><div class="payroll-field"><label>طريقة الصرف</label><select id="payMonthlyReportPayment" data-payroll-change="monthly-report-payment">'+paymentOptions(state.reportPayment||'',true)+'</select></div><div class="payroll-field payroll-filter-actions"><label>&nbsp;</label><button class="btn btn-primary" data-payroll-action="export-monthly-report-pdf">PDF 🖨️</button><button class="btn btn-ghost" data-payroll-action="export-monthly-report-csv">Excel 📥</button></div></div>'}
  function monthlyReportFilteredSlips(){ensureReportDefaults();var year=String(state.reportYear||currentArchiveYear());var arr=slips().filter(function(s){return periodYear(s.period)===year});if(state.reportMonth)arr=arr.filter(function(s){return periodMonth(s.period)===String(state.reportMonth)});if(state.reportPayment)arr=arr.filter(function(s){return String(s.paymentMethod||'')===String(state.reportPayment)});return arr}
  function monthlyReportModel(){var arr=monthlyReportFilteredSlips();var months=state.reportMonth?[String(state.reportMonth)]:reportMonths(state.reportYear||currentArchiveYear());var empMap={};var monthTotals={};months.forEach(function(m){monthTotals[m]=0});arr.forEach(function(s){var emp=getEmployee(s.employeeId)||{};var key=s.employeeId||('deleted-'+(emp.name||'محذوف'));var name=emp.name||'محذوف';if(!empMap[key])empMap[key]={name:name,months:{},total:0};var mm=periodMonth(s.period);if(months.indexOf(mm)===-1)return;var value=calcSlip(s).net;empMap[key].months[mm]=(empMap[key].months[mm]||0)+value;empMap[key].total+=value;monthTotals[mm]=(monthTotals[mm]||0)+value});var rows=Object.keys(empMap).map(function(k){return empMap[k]}).sort(function(a,b){return a.name.localeCompare(b.name,'ar')});var grand=rows.reduce(function(sum,r){return sum+r.total},0);return {months:months,rows:rows,monthTotals:monthTotals,grand:grand}}
  function renderMonthlyReport(){var model=monthlyReportModel();var head='<tr><th>الموظف</th>'+model.months.map(function(m){return '<th>'+esc(monthName(m))+'</th>'}).join('')+'<th>إجمالي الموظف</th></tr>';var body=model.rows.map(function(r){return '<tr><td>'+esc(r.name)+'</td>'+model.months.map(function(m){return '<td>'+money(r.months[m]||0)+'</td>'}).join('')+'<td><b>'+money(r.total)+'</b></td></tr>'}).join('')||'<tr><td colspan="'+(model.months.length+2)+'">لا توجد بيانات حسب الفلاتر الحالية.</td></tr>';var foot='<tfoot><tr class="payroll-total-row"><td>الإجمالي</td>'+model.months.map(function(m){return '<td><b>'+money(model.monthTotals[m]||0)+'</b></td>'}).join('')+'<td><b>'+money(model.grand)+'</b></td></tr></tfoot>';return '<div class="payroll-card"><h3>📊 تقرير الرواتب الشهرية</h3>'+monthlyReportFiltersHtml()+'<div class="payroll-table payroll-matrix-table"><table><thead>'+head+'</thead><tbody>'+body+'</tbody>'+foot+'</table></div></div>'}
  function monthlyReportExportHtml(){var model=monthlyReportModel();var filterText='السنة: '+(state.reportYear||currentArchiveYear())+' — الشهر: '+(state.reportMonth?monthName(state.reportMonth):'كل الشهور')+' — طريقة الصرف: '+(state.reportPayment?paymentLabel(state.reportPayment):'كل طرق الصرف');var head='<tr><th>الموظف</th>'+model.months.map(function(m){return '<th>'+esc(monthName(m))+'</th>'}).join('')+'<th>إجمالي الموظف</th></tr>';var body=model.rows.map(function(r){return '<tr><td>'+esc(r.name)+'</td>'+model.months.map(function(m){return '<td>'+money(r.months[m]||0)+'</td>'}).join('')+'<td>'+money(r.total)+'</td></tr>'}).join('')||'<tr><td colspan="'+(model.months.length+2)+'">لا توجد بيانات حسب الفلاتر الحالية.</td></tr>';var foot='<tr class="total"><td>الإجمالي</td>'+model.months.map(function(m){return '<td>'+money(model.monthTotals[m]||0)+'</td>'}).join('')+'<td>'+money(model.grand)+'</td></tr>';return {filterText:filterText,table:'<table><thead>'+head+'</thead><tbody>'+body+foot+'</tbody></table>'}}
  function exportMonthlyReportPdf(){var data=monthlyReportExportHtml();var w=openPrintHtml('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير الرواتب الشهرية</title><style>body{font-family:Cairo,Arial,sans-serif;margin:18px;color:#111827;background:#fff}h1{margin:0 0 6px;font-size:22px}.meta{margin-bottom:14px;color:#475569;font-weight:700}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d1d5db;padding:7px;text-align:center}th{background:#e2e8f0}.total td{background:#f8fafc;font-weight:900}@page{size:A4 landscape;margin:8mm}</style></head><body><h1>📊 تقرير الرواتب الشهرية</h1><div class="meta">'+esc(data.filterText)+'<br>تاريخ التصدير: '+new Date().toLocaleString('ar-SA')+'</div>'+data.table+'<scr'+'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},450)};<\/scr'+'ipt></body></html>','width=1100,height=800');if(!w){toastMsg('المتصفح منع نافذة الطباعة');return}}
  function exportMonthlyReportCsv(){var model=monthlyReportModel();var rows=[['الموظف'].concat(model.months.map(monthName)).concat(['إجمالي الموظف'])];model.rows.forEach(function(r){rows.push([r.name].concat(model.months.map(function(m){return (r.months[m]||0).toFixed(2)})).concat([r.total.toFixed(2)]))});rows.push(['الإجمالي'].concat(model.months.map(function(m){return (model.monthTotals[m]||0).toFixed(2)})).concat([model.grand.toFixed(2)]));var csv=rows.map(function(r){return r.map(function(x){return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'}).join(',')}).join('\n');var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PETATOE_Payroll_Monthly_Report.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}
  function renderArchive(){return recordsTable('archive')}
  function exportArchivePdf(){var arr=archiveFilteredSlips();var totals={base:0,housing:0,transport:0,commission:0,incentives:0,additions:0,deductions:0,net:0};var rows=arr.map(function(s,i){var emp=getEmployee(s.employeeId)||{};var c=calcSlip(s);totals.base+=num(s.base);totals.housing+=num(s.housing);totals.transport+=num(s.transport);totals.commission+=num(c.commission);totals.incentives+=num(s.incentives);totals.additions+=num(c.additions);totals.deductions+=num(c.deductions);totals.net+=num(c.net);return '<tr><td>'+(i+1)+'</td><td>'+esc(s.period)+'</td><td>'+esc(emp.name||'محذوف')+'</td><td>'+esc(paymentLabel(s.paymentMethod))+'</td><td>'+money(s.base)+'</td><td>'+money(s.housing)+'</td><td>'+money(s.transport)+'</td><td>'+money(c.commission)+'</td><td>'+money(s.incentives)+'</td><td>'+money(c.additions)+'</td><td>'+money(c.deductions)+'</td><td>'+money(c.net)+'</td><td>'+esc(statusInfo(s.status)[0])+'</td></tr>'}).join('')||'<tr><td colspan="13">لا توجد بيانات حسب الفلاتر الحالية.</td></tr>';var filterText='السنة: '+(state.archiveYear||'كل السنوات')+' — الشهر: '+(state.archiveMonth?monthName(state.archiveMonth):'كل الشهور')+' — طريقة الصرف: '+(state.archivePayment?paymentLabel(state.archivePayment):'كل طرق الصرف');var totalRow='<tr class="total"><td colspan="4">الإجمالي</td><td>'+money(totals.base)+'</td><td>'+money(totals.housing)+'</td><td>'+money(totals.transport)+'</td><td>'+money(totals.commission)+'</td><td>'+money(totals.incentives)+'</td><td>'+money(totals.additions)+'</td><td>'+money(totals.deductions)+'</td><td>'+money(totals.net)+'</td><td>'+arr.length+' كشف</td></tr>';var w=openPrintHtml('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>سجل الرواتب</title><style>body{font-family:Cairo,Arial,sans-serif;margin:18px;color:#111827;background:#fff}h1{margin:0 0 6px;font-size:22px}.meta{margin-bottom:14px;color:#475569;font-weight:700}table{width:100%;border-collapse:collapse;font-size:10px}th,td{border:1px solid #d1d5db;padding:6px;text-align:center}th{background:#e2e8f0}.total td{background:#f8fafc;font-weight:900}@page{size:A4 landscape;margin:8mm}</style></head><body><h1>📚 سجل الرواتب</h1><div class="meta">'+esc(filterText)+'<br>تاريخ التصدير: '+new Date().toLocaleString('ar-SA')+'</div><table><thead><tr><th>#</th><th>الشهر</th><th>الموظف</th><th>طريقة الصرف</th><th>أساسي</th><th>سكن</th><th>مواصلات</th><th>عمولات وإضافي</th><th>حوافز</th><th>إضافات أخرى</th><th>خصومات</th><th>الصافي</th><th>الحالة</th></tr></thead><tbody>'+rows+totalRow+'</tbody></table><scr'+'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},450)};<\/scr'+'ipt></body></html>','width=1100,height=800');if(!w){toastMsg('المتصفح منع نافذة الطباعة');return}}
  function renderSalarySlip(){
    var area=byId('salarySlipArea');
    if(!area)return;
    var allowedStatuses=['board_approved','employee_objection','employee_approved','accounts_approved','paid'];
    var arr=slips().filter(function(s){
      return allowedStatuses.indexOf(s.status)>-1&&canEmployeeSee(s)
    }).sort(function(a,b){return String(b.period).localeCompare(String(a.period))});
    if(!arr.length){
      state.salarySlipId='';
      safeRender(area,'<div class="payroll-shell salary-slip-redesign-shell"><div class="payroll-card salary-slip-empty"><h3>📄 كشف الراتب</h3><p>لا يوجد كشف راتب معتمد مبدئيًا لهذا المستخدم حتى الآن.</p></div></div>','payroll empty self slip');
      return;
    }
    var selected=arr.find(function(s){return String(s.id)===String(state.salarySlipId)})||arr[0];
    state.salarySlipId=selected.id;
    function detailRows(rows,emptyText){
      rows=(rows||[]).filter(function(x){return x&&String(x.label||'').trim()});
      if(!rows.length){
        return '<div class="salary-slip-empty-state"><span>📄</span><b>'+esc(emptyText||'لا توجد بنود')+'</b></div>';
      }
      return '<div class="salary-slip-lines-list">'+rows.map(function(x){
        return '<div class="salary-slip-line-item"><span class="salary-slip-line-label">'+esc(x.label)+'</span><b class="salary-slip-line-value">'+money(x.value)+'</b></div>';
      }).join('')+'</div>';
    }
    function slipActions(s,canAct){
      if(!canAct){
        return '<div class="salary-slip-action-note">لا توجد إجراءات متاحة في هذه الحالة.</div>';
      }
      return '<div class="salary-slip-actions-pro"><button class="salary-slip-btn salary-slip-btn-approve" data-payroll-action="employee-approve" data-payroll-id="'+esc(s.id)+'">✅ موافق على كشف الراتب</button><textarea id="empNote_'+esc(s.id)+'" class="salary-slip-objection-input" placeholder="سبب الاعتراض"></textarea><button class="salary-slip-btn salary-slip-btn-reject" data-payroll-action="employee-object" data-payroll-id="'+esc(s.id)+'">تقديم اعتراض</button></div>';
    }
    function slipCard(s){
      var emp=getEmployee(s.employeeId)||{};
      var c=calcSlip(s);
      var canAct=s.status==='board_approved';
      var empName=emp.name||userTextForEmployee(emp)||'الموظف';
      var slipNo='SLIP-'+String(s.period||'').replace('-','-')+'-'+String(s.id||'0001').slice(-5).toUpperCase();
      var creationDate=s.createdAt?new Date(s.createdAt).toLocaleDateString('ar-SA'):new Date().toLocaleDateString('ar-SA');
      var additions=[
        {label:'الراتب الأساسي',value:s.base},
        {label:'بدل السكن',value:s.housing},
        {label:'بدل المواصلات',value:s.transport},
        {label:'العمولات والإضافي',value:c.commission},
        {label:'الحوافز',value:s.incentives}
      ].concat((s.additions||[]).map(function(x){return {label:x.name,value:x.value}}));
      var deductions=(s.deductions||[]).map(function(x){return {label:x.name,value:x.value}});
      return '<article class="salary-slip-pro salary-slip-self-service-card" dir="rtl">'
        +'<div class="salary-slip-main">'
          +'<header class="salary-slip-hero">'
            +'<div><h2>📄 كشف راتب '+esc(periodLabel(s.period))+'</h2><div class="salary-slip-status-wrap">'+statusBadge(s.status)+'</div></div>'
            +'<button class="salary-slip-back" data-payroll-action="back-to-monthly-slips">← العودة إلى الكشوفات</button>'
          +'</header>'
          +'<section class="salary-slip-kpis">'
            +'<div class="salary-kpi salary-kpi-net"><span>صافي الراتب</span><b>'+money(c.net)+'</b><i>💵</i></div>'
            +'<div class="salary-kpi"><span>الراتب الأساسي</span><b>'+money(s.base)+'</b><i>💼</i></div>'
            +'<div class="salary-kpi"><span>إجمالي الإضافات</span><b>'+money(c.gross)+'</b><i>⬆️</i></div>'
            +'<div class="salary-kpi salary-kpi-deduct"><span>إجمالي الخصومات</span><b>'+money(c.deductions)+'</b><i>⬇️</i></div>'
          +'</section>'
          +'<section class="salary-slip-details-card">'
            +'<div class="salary-slip-section-title"><h3>تفاصيل بنود الراتب</h3><span>إضافات وخصومات</span></div>'
            +'<div class="salary-slip-two-cols">'
              +'<div class="salary-slip-col salary-slip-additions"><div class="salary-slip-col-title">الإضافات <span>⬆</span></div>'+detailRows(additions,'لا توجد إضافات')+'<div class="salary-slip-col-total">إجمالي الإضافات <b>'+money(c.gross)+'</b></div></div>'
              +'<div class="salary-slip-col salary-slip-deductions"><div class="salary-slip-col-title">الخصومات <span>⬇</span></div>'+detailRows(deductions,'لا توجد خصومات')+'<div class="salary-slip-col-total">إجمالي الخصومات <b>'+money(c.deductions)+'</b></div></div>'
            +'</div>'
            +'<div class="salary-slip-net-formula"><span>صافي الراتب</span><b>'+money(c.net)+'</b></div>'
            +'<div class="salary-slip-note commission-link-note">'+esc(commissionStatusNote(c.commissionDetail))+'</div>'
            +(s.employeeNote?'<div class="salary-slip-note salary-slip-employee-note">ملاحظة الموظف: '+esc(s.employeeNote)+'</div>':'')
          +'</section>'
        +'</div>'
        +'<aside class="salary-slip-side">'
          +'<div class="salary-slip-logo-card"><img src="img/petatoe-salary-slip-logo.png" alt="PETATOE"><div class="salary-slip-logo-glow"></div></div>'
          +'<div class="salary-slip-person-card">'
            +'<div class="salary-slip-avatar">👤</div><small>الموظف</small><h3>'+esc(empName)+'</h3>'
            +'<div class="salary-slip-meta-row"><span>طريقة الصرف</span><b>'+esc(paymentLabel(s.paymentMethod))+'</b></div>'
            +'<div class="salary-slip-meta-row"><span>الشهر</span><b>'+esc(periodLabel(s.period))+'</b></div>'
            +'<div class="salary-slip-meta-row"><span>تاريخ الإنشاء</span><b>'+esc(creationDate)+'</b></div>'
            +'<div class="salary-slip-meta-row"><span>رقم الكشف</span><b>'+esc(slipNo)+'</b></div>'
          +'</div>'
          +slipActions(s,canAct)
        +'</aside>'
      +'</article>';
    }
    function slipsList(){
      return '<div class="salary-slip-self-panel payroll-card"><h3>📚 سجل الرواتب</h3><div class="salary-slip-self-list">'+arr.map(function(s){
        var c=calcSlip(s);var active=String(s.id)===String(selected.id);
        return '<button type="button" class="salary-slip-self-item '+(active?'active':'')+'" data-payroll-action="select-my-salary-slip" data-payroll-id="'+esc(s.id)+'"><span>'+esc(periodLabel(s.period))+'</span><b>'+money(c.net)+'</b><small>'+esc(statusInfo(s.status)[0])+'</small></button>';
      }).join('')+'</div></div>';
    }
    function objectionsLog(){
      var obs=arr.filter(function(s){return String(s.employeeNote||'').trim()});
      if(!obs.length)return '<div class="salary-slip-self-panel payroll-card"><h3>📝 سجل الاعتراضات</h3><p class="salary-slip-muted">لا توجد اعتراضات مسجلة.</p></div>';
      return '<div class="salary-slip-self-panel payroll-card"><h3>📝 سجل الاعتراضات</h3><div class="salary-slip-objections-list">'+obs.map(function(s){return '<div class="salary-slip-objection-row"><b>'+esc(periodLabel(s.period))+'</b><span>'+esc(s.employeeNote||'')+'</span><small>'+esc(statusInfo(s.status)[0])+'</small></div>'}).join('')+'</div></div>';
    }
    safeRender(area,'<div class="payroll-shell salary-slip-redesign-shell salary-slip-self-service">'
      +'<div class="salary-slip-self-head"><div><h2>📄 كشف الراتب</h2></div><div class="salary-slip-self-actions"><button class="btn btn-primary" data-payroll-action="render-salary-slip">🔄 تحديث</button><button class="btn btn-green" data-payroll-action="export-current-salary-slip-pdf">PDF طباعة 🖨️</button></div></div>'
      +'<div class="salary-slip-self-full">'+slipCard(selected)+'</div>'
      +'<div class="salary-slip-self-bottom">'+slipsList()+objectionsLog()+'</div>'
    +'</div>','payroll self salary slip');
  }


  function exportCurrentSalarySlipPdf(){
    var slipEl=document.querySelector('#salarySlip .salary-slip-pro');
    if(!slipEl){toastMsg('لا يوجد كشف راتب للطباعة');return}
    var titleEl=document.querySelector('#salarySlip .salary-slip-hero h2');
    var title=titleEl?titleEl.textContent.trim():'كشف الراتب';
    var html=slipEl.outerHTML;
    var printHtml='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>body{margin:0;padding:14px;background:#0f172a;font-family:Cairo,Arial,sans-serif;color:#fff}.salary-slip-pro{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:14px;padding:16px;border-radius:20px;border:1px solid #334155;background:#111827;color:#fff}.salary-slip-main{display:flex;flex-direction:column;gap:12px}.salary-slip-hero,.salary-slip-kpis,.salary-slip-two-cols,.salary-slip-net-formula,.salary-slip-meta-row{display:flex;justify-content:space-between;gap:10px}.salary-slip-kpis{display:grid;grid-template-columns:repeat(4,1fr)}.salary-kpi,.salary-slip-details-card,.salary-slip-col,.salary-slip-person-card,.salary-slip-logo-card{border:1px solid #334155;border-radius:14px;padding:12px;background:#0b1220}.salary-slip-two-cols{display:grid;grid-template-columns:1fr 1fr}.salary-slip-line-item,.salary-slip-col-total{display:flex;justify-content:space-between;border-bottom:1px solid #334155;padding:8px}.salary-slip-actions-pro,.salary-slip-back{display:none!important}.salary-slip-logo-card img{max-width:100%;max-height:190px;object-fit:contain}.salary-slip-side{display:flex;flex-direction:column;gap:10px}.salary-slip-btn,.salary-slip-objection-input{display:none!important}@page{size:A4 landscape;margin:8mm}@media print{body{background:#fff;color:#111}.salary-slip-pro{background:#fff;color:#111;border-color:#ddd}.salary-kpi,.salary-slip-details-card,.salary-slip-col,.salary-slip-person-card,.salary-slip-logo-card{background:#fff;color:#111;border-color:#ddd}}</style></head><body>'+html+'<scr'+'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},400)};<\/scr'+'ipt></body></html>';
    var w=openPrintHtml(printHtml,'width=1200,height=900');
    if(!w){toastMsg('المتصفح منع نافذة الطباعة');return}
  }



  function loadSlipForm(){
    var period=(byId('payPeriod')||{}).value||nowPeriod();
    var empId=(byId('payEmployee')||{}).value;
    if(!empId){toastMsg('اختر الموظف أولاً');return}
    var arr=slips();
    var slip=arr.find(function(s){return s.employeeId===empId&&s.period===period});
    var emp=getEmployee(empId)||{};
    if(!slip){
      slip={
        id:uid('slip'),
        employeeId:empId,
        period:period,
        base:num(emp.base),
        housing:num(emp.housing),
        transport:num(emp.transport),
        paymentMethod:(emp.paymentMethod||''),
        incentives:0,
        additions:[],
        deductions:[],
        status:'draft',
        createdAt:new Date().toISOString()
      };
      arr.push(slip);
      setSlipsCache(arr);
      persistOneSlip(slip).catch(function(e){console.warn('PETATOEPayroll draft slip persist failed',e)})
    }else if(!slip.paymentMethod&&emp.paymentMethod){
      slip.paymentMethod=emp.paymentMethod;
      setSlipsCache(arr);
      persistOneSlip(slip).catch(function(e){console.warn('PETATOEPayroll payment method default persist failed',e)})
    }
    state.editSlipId=slip.id;
    var target=byId('paySlipFormArea');
    if(target)safeRender(target,slipFormHtml(slip),'payroll slip form')
  }

  function readSlipForm(status){
    var id=(byId('psId')||{}).value||uid('slip');
    var visiblePeriod=(byId('payPeriod')||{}).value||'';
    var visibleEmployee=(byId('payEmployee')||{}).value||'';
    var period=visiblePeriod||((byId('psPeriod')||{}).value);
    var employeeId=visibleEmployee||((byId('psEmployeeId')||{}).value);
    return {
      id:id,
      employeeId:employeeId,
      period:period,
      base:num((byId('psBase')||{}).value),
      housing:num((byId('psHousing')||{}).value),
      transport:num((byId('psTransport')||{}).value),
      paymentMethod:(byId('psPaymentMethod')||{}).value||'',
      incentives:num((byId('psIncentives')||{}).value),
      additions:collectLines('additions'),
      deductions:collectLines('deductions'),
      status:status||'draft',
      updatedAt:new Date().toISOString()
    }
  }

  function upsertSlip(slip){var arr=slips();var i=arr.findIndex(function(x){return x.id===slip.id});var duplicate=arr.find(function(x){return String(x.id)!==String(slip.id)&&String(x.employeeId)===String(slip.employeeId)&&String(x.period)===String(slip.period)});if(duplicate){toastMsg('يوجد كشف راتب لنفس الموظف في نفس الشهر بالفعل');return null}var old=i>-1?arr[i]:{};slip=Object.assign({},old,slip);if(i>-1)arr[i]=slip;else arr.push(slip);setSlipsCache(arr);slip._persistPromise=persistOneSlip(slip);return slip}
  function setStatus(id,st,extra){var arr=slips();var s=arr.find(function(x){return x.id===id});if(!s)return Promise.resolve(false);s.status=st;Object.assign(s,extra||{});s.updatedAt=new Date().toISOString();setSlipsCache(arr);var p=persistOneSlip(s);render();renderSalarySlip();return p;}

  function payrollDelegatedClick(e){
    var btn=e.target&&e.target.closest?e.target.closest('[data-payroll-action]'):null;
    if(!btn)return;
    var root=btn.closest('#payrollArea,#salarySlipArea,.payroll-shell,.salary-slip-redesign-shell,.salary-slip-self-service');
    /* Phase 41: any [data-payroll-action] belongs to payroll. Do not let generic Customer 360 handlers steal Arabic 'فتح' buttons. */
    var action=btn.getAttribute('data-payroll-action')||'';
    var id=btn.getAttribute('data-payroll-id')||'';
    var name=btn.getAttribute('data-payroll-name')||'';
    var kind=btn.getAttribute('data-payroll-kind')||'';
    var tab=btn.getAttribute('data-payroll-tab')||'';
    var P=window.PETATOEPayroll||{};
    try{
      /* Phase 32: payroll owns clicks inside payroll/salary panels.
         Stop later generic handlers that treat any Arabic 'فتح' button as Customer 360/D360. */
      e.preventDefault();
      e.stopPropagation();
      if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
      if(action==='remove-line'){var row=btn.closest('.payroll-line');if(row)row.remove();return}
      if(action==='back-to-monthly-slips'){if(window.PETATOERouter&&PETATOERouter.openTab){PETATOERouter.openTab('payroll');setTimeout(function(){if(P.openTab)P.openTab('monthly')},80)}return}
      var map={
        'add-line':function(){P.addLine&&P.addLine(kind)},
        'load-slip-form':function(){P.loadSlipForm&&P.loadSlipForm()},
        'open-tab':function(){P.openTab&&P.openTab(tab)},
        'edit-employee':function(){P.editEmployee&&P.editEmployee(id)},
        'delete-employee':function(){P.deleteEmployee&&P.deleteEmployee(id)},
        'save-employee':function(){P.saveEmployee&&P.saveEmployee()},
        'clear-employee-form':function(){P.clearEmployeeForm&&P.clearEmployeeForm()},
        'open-config-tab':function(){P.openConfigTab&&P.openConfigTab(tab)},
        'save-employee-code-config':function(){P.saveEmployeeCodeConfig&&P.saveEmployeeCodeConfig()},
        'edit-job-type':function(){P.editJobType&&P.editJobType(name)},
        'delete-job-type':function(){P.deleteJobType&&P.deleteJobType(name)},
        'save-job-type':function(){P.saveJobType&&P.saveJobType()},
        'clear-job-type-form':function(){P.clearJobTypeForm&&P.clearJobTypeForm()},
        'save-slip':function(){P.saveSlip&&P.saveSlip()},
        'send-to-board':function(){P.sendToBoard&&P.sendToBoard()},
        'cancel-approval':function(){P.cancelApproval&&P.cancelApproval(id)},
        'delete-slip':function(){P.deleteSlip&&P.deleteSlip(id)},
        'edit-slip':function(){P.editSlip&&P.editSlip(id)},
        'board-approve':function(){P.boardApprove&&P.boardApprove(id)},
        'reject-slip':function(){P.rejectSlip&&P.rejectSlip(id)},
        'accounts-approve':function(){P.accountsApprove&&P.accountsApprove(id)},
        'mark-paid':function(){P.markPaid&&P.markPaid(id)},
        'employee-approve':function(){P.employeeApprove&&P.employeeApprove(id)},
        'employee-object':function(){P.employeeObject&&P.employeeObject(id)},
        'select-my-salary-slip':function(){P.selectMySalarySlip&&P.selectMySalarySlip(id)},
        'render-salary-slip':function(){P.renderSalarySlip&&P.renderSalarySlip()},
        'export-current-salary-slip-pdf':function(){P.exportCurrentSalarySlipPdf&&P.exportCurrentSalarySlipPdf()},
        'export-archive-pdf':function(){P.exportArchivePdf&&P.exportArchivePdf()},
        'clear-archive-filter':function(){P.clearArchiveFilter&&P.clearArchiveFilter()},
        'export-monthly-report-pdf':function(){P.exportMonthlyReportPdf&&P.exportMonthlyReportPdf()},
        'export-monthly-report-csv':function(){P.exportMonthlyReportCsv&&P.exportMonthlyReportCsv()}
      };
      if(map[action]){map[action]()}
    }catch(err){console.warn('PETATOEPayroll delegated action failed',action,err)}
  }
  function payrollDelegatedChange(e){
    var el=e.target&&e.target.closest?e.target.closest('[data-payroll-change]'):null;
    if(!el)return;
    var root=el.closest('#payrollArea,#salarySlipArea');
    if(!root)return;
    var type=el.getAttribute('data-payroll-change')||'';
    var val=el.value;
    var P=window.PETATOEPayroll||{};
    try{
      if(type==='archive-year')P.setArchiveFilter&&P.setArchiveFilter(val,null,null);
      else if(type==='archive-month')P.setArchiveFilter&&P.setArchiveFilter(null,val,null);
      else if(type==='archive-payment')P.setArchiveFilter&&P.setArchiveFilter(null,null,val);
      else if(type==='monthly-report-year')P.setMonthlyReportFilter&&P.setMonthlyReportFilter(val,null,null);
      else if(type==='monthly-report-month')P.setMonthlyReportFilter&&P.setMonthlyReportFilter(null,val,null);
      else if(type==='monthly-report-payment')P.setMonthlyReportFilter&&P.setMonthlyReportFilter(null,null,val);
    }catch(err){console.warn('PETATOEPayroll delegated change failed',type,err)}
  }

  window.PETATOEPayroll={
    openTab:function(t){state.tab=t||'employees';render()},render:render,renderSalarySlip:renderSalarySlip,selectMySalarySlip:function(id){var s=slips().find(function(x){return String(x.id)===String(id)});if(!s||!canEmployeeSee(s)){toastMsg('لا يمكنك فتح كشف غير خاص بك');return}state.salarySlipId=id;renderSalarySlip()},
    setArchiveFilter:function(year,month,payment){if(year!==null&&year!==undefined){state.archiveYear=String(year||'');state.archiveMonth=''}if(month!==null&&month!==undefined){state.archiveMonth=String(month||'')}if(payment!==null&&payment!==undefined){state.archivePayment=String(payment||'')}render()},
    setMonthlyReportFilter:function(year,month,payment){if(year!==null&&year!==undefined){state.reportYear=String(year||currentArchiveYear());state.reportMonth=''}if(month!==null&&month!==undefined){state.reportMonth=String(month||'')}if(payment!==null&&payment!==undefined){state.reportPayment=String(payment||'')}render()},
    exportMonthlyReportPdf:exportMonthlyReportPdf,
    exportMonthlyReportCsv:exportMonthlyReportCsv,
    clearArchiveFilter:function(){state.archiveYear=currentArchiveYear();state.archiveMonth=currentArchiveMonth();state.archivePayment='';render()},
    exportArchivePdf:exportArchivePdf,
    exportCurrentSalarySlipPdf:exportCurrentSalarySlipPdf,
    toggleEmployeeStatusMenu:function(force){var menu=byId('peStatusMenu');var wrap=byId('peStatusSelect');if(!menu)return;var hidden=(force==null)?!menu.hidden:!force;menu.hidden=hidden;if(wrap)wrap.classList.toggle('open',!menu.hidden)},
    setEmployeeStatus:function(st){st=st||'active';var input=byId('peStatus');if(input)input.value=st;var label=byId('peStatusLabel');if(label)label.textContent=employeeStatusLabel(st);var box=byId('peStatusMenu');if(box)Array.prototype.forEach.call(box.querySelectorAll('.payroll-status-option'),function(b){b.classList.toggle('active',b.getAttribute('data-status')===st)});try{PETATOEPayroll.toggleEmployeeStatusMenu(false)}catch(e){console.warn('PETATOEPayroll close status menu failed',e)}},
    openConfigTab:function(t){state.configTab=t||'employees';render()},
    saveEmployeeCodeConfig:function(){var cfg={prefix:(byId('payEmpCodePrefix')||{}).value,next:(byId('payEmpCodeNext')||{}).value,digits:(byId('payEmpCodeDigits')||{}).value};saveEmployeeConfig(cfg);toastMsg('تم حفظ تهيئة أكواد الموظفين');render()},
    saveJobType:function(){var inp=byId('payJobTypeName');var old=(byId('payJobTypeOriginal')||{}).value||'';var val=inp?String(inp.value||'').trim():'';if(!val){toastMsg('اكتب اسم الوظيفة');return}var arr=jobTypes();if(arr.some(function(j){return norm(j)===norm(val)&&norm(j)!==norm(old)})){toastMsg('الوظيفة موجودة بالفعل');return}if(old){arr=arr.map(function(j){return norm(j)===norm(old)?val:j});var emps=employees().map(function(e){if(norm(e.job)===norm(old))e.job=val;return e});saveEmployees(emps);toastMsg('تم تعديل الوظيفة وتحديث الموظفين المرتبطين بها')}else{arr.push(val);toastMsg('تمت إضافة الوظيفة')}saveJobTypes(arr);render()},
    editJobType:function(name){state.configTab='jobs';render();setTimeout(function(){if(byId('payJobTypeOriginal'))byId('payJobTypeOriginal').value=name;if(byId('payJobTypeName'))byId('payJobTypeName').value=name},0)},
    clearJobTypeForm:function(){if(byId('payJobTypeOriginal'))byId('payJobTypeOriginal').value='';if(byId('payJobTypeName'))byId('payJobTypeName').value=''},
    deleteJobType:function(name){if(!confirm('حذف نوع الوظيفة؟'))return;saveJobTypes(jobTypes().filter(function(j){return norm(j)!==norm(name)}));render()},
    addLine:function(kind){var box=byId(kind+'Lines');if(box)safeAppend(box,lineRowHtml(kind,Date.now(),'',''),'payroll line row')},
    saveEmployee:function(){var arr=employees();var id=(byId('peId')||{}).value||uid('emp');var name=(byId('peName')||{}).value||'';if(!name.trim()){toastMsg('اكتب اسم الموظف');return}var selectedUserId=(byId('peUserId')||{}).value||'';var linkedUser=getUserById(selectedUserId);var code=String((byId('peCode')||{}).value||'').trim();if(!code)code=generateEmployeeCode(id);if(isDuplicateEmployeeCode(code,id)){toastMsg('كود الموظف مستخدم بالفعل');return}var obj={id:id,code:code,name:name.trim(),job:(byId('peJob')||{}).value||'',userId:selectedUserId,userKey:linkedUser?userLabel(linkedUser):name.trim(),commissionEmployeeName:(byId('peCommissionEmployeeName')||{}).value||'',username:linkedUser?(linkedUser.username||''):'',email:linkedUser?(linkedUser.email||''):'',phone:linkedUser?(linkedUser.phone||''):'',base:num((byId('peBase')||{}).value),housing:num((byId('peHousing')||{}).value),transport:num((byId('peTransport')||{}).value),paymentMethod:(byId('pePaymentMethod')||{}).value||'',status:(byId('peStatus')||{}).value||'active'};var i=arr.findIndex(function(e){return e.id===id});if(i>-1)arr[i]=Object.assign({},arr[i],obj);else arr.push(obj);saveEmployees(arr);toastMsg('تم حفظ الموظف وربطه باليوزر');render()},
    editEmployee:function(id){state.tab='config';state.configTab='employees';render();setTimeout(function(){var e=getEmployee(id);if(!e)return;byId('peId').value=e.id;byId('peCode').value=e.code||'';byId('peName').value=e.name||'';if(byId('peJob'))byId('peJob').value=e.job||'';if(byId('peUserId'))byId('peUserId').value=e.userId||'';if(byId('peCommissionEmployeeName'))byId('peCommissionEmployeeName').value=e.commissionEmployeeName||'';byId('peBase').value=e.base||0;byId('peHousing').value=e.housing||0;byId('peTransport').value=e.transport||0;if(byId('pePaymentMethod'))byId('pePaymentMethod').value=e.paymentMethod||'';PETATOEPayroll.setEmployeeStatus(e.status||'active')},0)},
    deleteEmployee:function(id){if(!confirm('حذف الموظف من قسم الرواتب؟'))return;saveEmployees(employees().filter(function(e){return e.id!==id}));render()},
    clearEmployeeForm:function(){['peId','peCode','peName','peJob','peUserId','peCommissionEmployeeName','peBase','peHousing','peTransport','pePaymentMethod'].forEach(function(id){if(byId(id))byId(id).value=''});if(byId('peStatus'))PETATOEPayroll.setEmployeeStatus('active')},
    loadSlipForm:loadSlipForm,
    saveSlip:function(){var s=upsertSlip(readSlipForm('draft'));if(!s)return;notifyAfterPersist(s._persistPromise,'تم حفظ كشف الراتب كمسودة');delete s._persistPromise;state.editSlipId=s.id;render()},
    sendToBoard:function(){var s=upsertSlip(readSlipForm('pending_board'));if(!s)return;notifyAfterPersist(s._persistPromise,'تم إرسال الكشف للاعتماد المبدئي');delete s._persistPromise;state.editSlipId=s.id;render()},
    editSlip:function(id){state.tab='monthly';render();setTimeout(function(){var s=slips().find(function(x){return x.id===id});if(!s)return;if(byId('payPeriod'))byId('payPeriod').value=s.period;if(byId('payEmployee'))byId('payEmployee').value=s.employeeId;var target=byId('paySlipFormArea');if(target)safeRender(target,slipFormHtml(s),'payroll edit slip form')},0)},
    deleteSlip:function(id){var s=slips().find(function(x){return x.id===id});if(!s){toastMsg('لم يتم العثور على كشف الراتب');return}if(!confirm('حذف كشف الراتب نهائيًا من الرواتب الشهرية؟'))return;setSlipsCache(slips().filter(function(x){return x.id!==id}));notifyAfterPersist(removeOneSlip(id),'تم حذف كشف الراتب');if(state.editSlipId===id)state.editSlipId='';render();renderSalarySlip();},
    boardApprove:function(id){if(!isBoard()){toastMsg('هذه الصلاحية لرئيس مجلس الإدارة أو الإدارة العليا');return}notifyAfterPersist(setStatus(id,'board_approved',{boardApprovedAt:new Date().toISOString(),boardApprovedBy:(currentUser().fullName||currentUser().username)}),'تم الاعتماد المبدئي وظهر الكشف للموظف')},
    rejectSlip:function(id){if(!isBoard()){toastMsg('هذه الصلاحية لرئيس مجلس الإدارة أو الإدارة العليا');return}notifyAfterPersist(setStatus(id,'rejected',{rejectedAt:new Date().toISOString()}),'تم رفض الكشف')},
    employeeApprove:function(id){var s=slips().find(function(x){return x.id===id});if(!s||!canEmployeeSee(s)){toastMsg('لا يمكنك اعتماد كشف غير خاص بك');return}notifyAfterPersist(setStatus(id,'employee_approved',{employeeApprovedAt:new Date().toISOString(),employeeApprovedBy:(currentUser().fullName||currentUser().username),employeeNote:''}),'تمت موافقة الموظف')},
    employeeObject:function(id){var s=slips().find(function(x){return x.id===id});if(!s||!canEmployeeSee(s)){toastMsg('لا يمكنك الاعتراض على كشف غير خاص بك');return}var note=(byId('empNote_'+id)||{}).value||'';if(!note.trim()){toastMsg('اكتب سبب الاعتراض');return}notifyAfterPersist(setStatus(id,'employee_objection',{employeeObjectedAt:new Date().toISOString(),employeeNote:note.trim()}),'تم تسجيل الاعتراض')},
    cancelApproval:function(id){
      if(!canCancelApproval()){toastMsg('ليست لديك صلاحية إلغاء اعتماد الرواتب');return}
      var arr=slips();
      var s=arr.find(function(x){return x.id===id});
      if(!s){toastMsg('لم يتم العثور على كشف الراتب');return}
      var prevMap={paid:'accounts_approved',accounts_approved:'employee_approved',employee_approved:'board_approved',employee_objection:'board_approved',board_approved:'pending_board',rejected:'pending_board'};
      var oldStatus=s.status;
      var prev=prevMap[oldStatus];
      if(!prev){toastMsg('لا توجد مرحلة اعتماد سابقة لهذه الحالة');return}
      if(!confirm('إلغاء الاعتماد خطوة واحدة للخلف فقط؟'))return;
      var at=new Date().toISOString();
      var by=(currentUser().fullName||currentUser().username||currentUser().id);
      s.status=prev;
      s.cancelledApprovalAt=at;
      s.cancelledApprovalBy=by;
      s.cancelHistory=Array.isArray(s.cancelHistory)?s.cancelHistory:[];
      s.cancelHistory.push({at:at,by:by,from:oldStatus,to:prev});
      /* Phase A QA fix:
         إلغاء الاعتماد يرجع خطوة واحدة فقط ويحذف بيانات المرحلة الملغاة فقط،
         ولا يمس بيانات المرحلة التي رجعنا إليها حتى يظل السجل دقيقًا. */
      if(oldStatus==='paid'){
        delete s.paidAt;
      }else if(oldStatus==='accounts_approved'){
        delete s.accountsApprovedAt;
        delete s.accountsApprovedBy;
      }else if(oldStatus==='employee_approved'){
        delete s.employeeApprovedAt;
        delete s.employeeApprovedBy;
      }else if(oldStatus==='employee_objection'){
        delete s.employeeObjectedAt;
        s.employeeNote='';
      }else if(oldStatus==='board_approved'){
        delete s.boardApprovedAt;
        delete s.boardApprovedBy;
      }else if(oldStatus==='rejected'){
        delete s.rejectedAt;
      }
      s.updatedAt=at;
      setSlipsCache(arr);
      notifyAfterPersist(persistOneSlip(s),'تم إلغاء الاعتماد خطوة واحدة للخلف');
      render();
      renderSalarySlip();
    },
    accountsApprove:function(id){if(!isAccounts()){toastMsg('هذه الصلاحية للحسابات');return}var s=slips().find(function(x){return x.id===id});if(!s||s.status!=='employee_approved'){toastMsg('لا يمكن اعتماد الصرف قبل موافقة الموظف');return}notifyAfterPersist(setStatus(id,'accounts_approved',{accountsApprovedAt:new Date().toISOString(),accountsApprovedBy:(currentUser().fullName||currentUser().username)}),'تم اعتماد الصرف')},
    markPaid:function(id){if(!isAccounts()){toastMsg('هذه الصلاحية للحسابات');return}var s=slips().find(function(x){return x.id===id});if(!s||s.status!=='accounts_approved'){toastMsg('لا يمكن تسجيل الصرف قبل اعتماد الحسابات');return}notifyAfterPersist(setStatus(id,'paid',{paidAt:new Date().toISOString()}),'تم تسجيل الصرف')},
    exportCsv:function(){var rows=[['period','employee','payment_method','base','housing','transport','commission_overtime','incentives','other_additions','deductions','net','status']].concat(slips().map(function(s){var e=getEmployee(s.employeeId)||{};var c=calcSlip(s);return [s.period,e.name||'',paymentLabel(s.paymentMethod),s.base,s.housing,s.transport,c.commission,s.incentives,c.additions,c.deductions,c.net,statusInfo(s.status)[0]]}));var csv=rows.map(function(r){return r.map(function(x){return '"'+String(x==null?'':x).replace(/"/g,'""')+'"'}).join(',')}).join('\n');var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PETATOE_Payroll.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)},
    reloadFromSupabase:function(){payrollLoadStarted=false;return loadPayrollFromSupabase()},
    isSupabaseLoaded:function(){return !!payrollLoaded}
  };
  if(!window.__PETATOE_PAYROLL_DELEGATES_BOUND__){
    window.__PETATOE_PAYROLL_DELEGATES_BOUND__=true;
    document.addEventListener('click',payrollDelegatedClick,true);
    document.addEventListener('change',payrollDelegatedChange);
    document.addEventListener('click',function(e){var wrap=byId('peStatusSelect');if(!wrap)return;if(!wrap.contains(e.target))PETATOEPayroll.toggleEmployeeStatusMenu(false)});
    document.addEventListener('petatoe:tabchange',function(e){var t=(e.detail||{}).tabId;if(t==='payroll')setTimeout(render,0);if(t==='salarySlip')setTimeout(renderSalarySlip,0)});
    window.addEventListener('petatoe:identity-ready',function(){refreshPayrollViews()});
    document.addEventListener('petatoe:identity-ready',function(){refreshPayrollViews()});
    window.addEventListener('petatoe:permissionschanged',function(){refreshPayrollViews()});
    document.addEventListener('petatoe:permissionschanged',function(){refreshPayrollViews()});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){if(byId('payrollArea'))render();},200)});else setTimeout(function(){if(byId('payrollArea'))render();},200);
  }
  setTimeout(loadPayrollFromSupabase,0);
})();
