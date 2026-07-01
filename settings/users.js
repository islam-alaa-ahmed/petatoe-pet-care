/* PETATOE v8.0.2 - Users Module Supabase Save Final Fix
   Fix: Save/Edit/Delete users must persist to Supabase app_users, not password-security LocalStorage. */
(function(){
  'use strict';
  if(window.PETATOEUsersModule && window.PETATOEUsersModule.__v==='8.0.2-users-supabase-save-final') return;

  function api(){return window.__PETATOE_SETTINGS_API__||{};}
  function supabaseClient(){return window.supabase || window.PETATOE_SUPABASE_CLIENT || null;}
  function hasClient(){var c=supabaseClient();return !!(c&&typeof c.from==='function');}
  function esc(s){var a=api();return a.esc?a.esc(s):String(s==null?'':s).replace(/[&<>'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function byId(id){var a=api();return a.byId?a.byId(id):document.getElementById(id)}
  function val(id,d){var a=api();return a.val?a.val(id,d):((byId(id)||{}).value||d)}
  function toast(msg){var a=api();return a.toast?a.toast(msg):(window.toast?window.toast(msg):alert(msg))}
  function users(){var a=api();return a.users?a.users():[]}
  function audit(action,details,level){var a=api();try{if(a.audit)return a.audit(action,details,level)}catch(_){}}
  function renderUsers(){var a=api();if(a.render)return a.render('users')}
  function roleNames(){return api().roleNames||{superadmin:'Super Admin',admin:'Admin',accountant:'Accountant',sales:'Sales Manager',fleet:'Fleet Manager',viewer:'Viewer'}}
  function currentUser(){var a=api();return a.currentUser?a.currentUser():{id:'',username:'Guest',fullName:'Guest',role:'guest',status:'inactive'}}
  function isSuperUser(u){var a=api();return a.isSuperUser?a.isSuperUser(u):!!(u&&(u.role==='superadmin'||u.role_code==='superadmin'||u.id==='u_admin'||String(u.username||'').toLowerCase()==='admin'))}
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));}
  function clone(o){try{return JSON.parse(JSON.stringify(o||{}))}catch(_){return o||{}}}
  function normalizeRole(v){v=String(v||'viewer').trim(); if(v==='super_admin')return 'superadmin'; return v||'viewer'}
  function dbRole(v){v=normalizeRole(v); if(v==='superadmin')return 'superadmin'; return v;}
  function normalizeAppUserRow(row){
    row=row||{};
    var data=(row.legacy_payload&&typeof row.legacy_payload==='object')?clone(row.legacy_payload):{};
    var role=normalizeRole(data.role||row.role_code||'viewer');
    return Object.assign(data,{
      supabase_id:String(row.id||data.supabase_id||''),
      id:String(data.id||data.legacy_id||row.id||('u_'+Date.now())),
      username:String(row.username||data.username||''),
      fullName:String(row.full_name||data.fullName||data.full_name||row.username||''),
      job:String(data.job||data.title||''),
      phone:String(row.phone||data.phone||''),
      email:String(row.email||data.email||''),
      role:role,
      role_code:dbRole(role),
      status:String(row.status||data.status||'active'),
      createdAt:data.createdAt||row.created_at||'',
      updatedAt:row.updated_at||data.updatedAt||''
    });
  }
  async function findUserRow(user){
    if(!hasClient()) return null;
    var c=supabaseClient();
    var id=String(user&&user.supabase_id||'');
    if(isUuid(id)){
      var r0=await c.from('app_users').select('*').eq('id',id).limit(1);
      if(!r0.error&&Array.isArray(r0.data)&&r0.data[0])return r0.data[0];
    }
    var uid=String(user&&user.id||'');
    if(isUuid(uid)){
      var r1=await c.from('app_users').select('*').eq('id',uid).limit(1);
      if(!r1.error&&Array.isArray(r1.data)&&r1.data[0])return r1.data[0];
    }
    var username=String(user&&user.username||'').trim();
    if(username){
      var r2=await c.from('app_users').select('*').ilike('username',username).limit(1);
      if(!r2.error&&Array.isArray(r2.data)&&r2.data[0])return r2.data[0];
    }
    var r3=await c.from('app_users').select('*').limit(1000);
    if(!r3.error&&Array.isArray(r3.data)){
      var lowUser=username.toLowerCase();
      for(var i=0;i<r3.data.length;i++){
        var row=r3.data[i]||{}, lp=(row.legacy_payload&&typeof row.legacy_payload==='object')?row.legacy_payload:{};
        if(uid&&String(lp.id||lp.legacy_id||'')===uid)return row;
        if(lowUser&&String(lp.username||row.username||'').toLowerCase()===lowUser)return row;
      }
    }
    return null;
  }
  async function persistUserToSupabase(user){
    if(!user||!String(user.username||'').trim())return {ok:false,error:'اسم الدخول مطلوب'};
    if(!hasClient())return {ok:false,error:'Supabase client not ready'};
    var existing=await findUserRow(user);
    var data=clone(user);
    data.id=String(data.id||data.legacy_id||'').trim()||('u_'+Date.now());
    data.username=String(data.username||'').trim();
    data.fullName=String(data.fullName||data.full_name||data.username).trim()||data.username;
    data.role=normalizeRole(data.role||data.role_code||'viewer');
    data.role_code=dbRole(data.role);
    data.status=String(data.status||'active');
    data.updatedAt=new Date().toISOString();
    var payload={
      username:data.username,
      full_name:data.fullName,
      email:String(data.email||''),
      phone:String(data.phone||''),
      role_code:data.role_code,
      status:data.status,
      legacy_payload:data,
      updated_at:new Date().toISOString()
    };
    var c=supabaseClient(), res;
    if(existing&&existing.id){
      res=await c.from('app_users').update(payload).eq('id',existing.id).select().limit(1);
    }else{
      res=await c.from('app_users').insert(payload).select().limit(1);
    }
    if(res.error)return {ok:false,error:res.error.message||JSON.stringify(res.error)};
    var saved=(Array.isArray(res.data)&&res.data[0])?normalizeAppUserRow(res.data[0]):data;
    return {ok:true,user:saved,data:res.data};
  }
  async function deleteUserFromSupabase(user){
    if(!hasClient())return {ok:false,error:'Supabase client not ready'};
    var existing=await findUserRow(user);
    if(!existing||!existing.id)return {ok:true,skipped:true};
    var res=await supabaseClient().from('app_users').delete().eq('id',existing.id);
    if(res.error)return {ok:false,error:res.error.message||JSON.stringify(res.error)};
    return {ok:true};
  }
  function replaceCacheUser(saved){
    try{
      var a=api(), list=users().slice(), done=false;
      list=list.map(function(u){
        if(String(u.id||'')===String(saved.id||'')||String(u.supabase_id||'')===String(saved.supabase_id||'')||String(u.username||'').toLowerCase()===String(saved.username||'').toLowerCase()){
          done=true;return Object.assign({},u,saved);
        }
        return u;
      });
      if(!done)list.push(saved);
      window.PETATOE_APP_USERS_CACHE=list;
      if(window.PETATOEIdentityStore&&typeof window.PETATOEIdentityStore.setUsersCache==='function')window.PETATOEIdentityStore.setUsersCache(list);
      if(a.__usersCache) a.__usersCache=list;
    }catch(_){ }
  }
  function removeCacheUser(target){
    try{
      var list=users().filter(function(u){return !(String(u.id||'')===String(target.id||'')||String(u.username||'').toLowerCase()===String(target.username||'').toLowerCase())});
      window.PETATOE_APP_USERS_CACHE=list;
      if(window.PETATOEIdentityStore&&typeof window.PETATOEIdentityStore.setUsersCache==='function')window.PETATOEIdentityStore.setUsersCache(list);
    }catch(_){ }
  }

  function renderUsersBody(){
    var u=users();
    var roles=roleNames();
    var rows=u.map(function(x){
      return '<tr><td>'+esc(x.username)+'</td><td>'+esc(x.fullName||x.full_name||'-')+'</td><td>'+esc(x.job||'-')+'</td><td>'+esc(roles[normalizeRole(x.role||x.role_code)]||x.role||x.role_code||'-')+'</td><td><span class="pet-v110-badge '+(x.status==='active'?'ok':'bad')+'">'+esc(x.status||'active')+'</span></td><td><button class="pet-v110-btn blue" data-v110-action="edit-user" data-v110-id="'+esc(x.id)+'">تعديل</button><button class="pet-v110-btn danger" data-v110-action="delete-user" data-v110-id="'+esc(x.id)+'">حذف</button></td></tr>';
    }).join('');
    var roleOpts=Object.keys(roles).map(function(k){return '<option value="'+k+'">'+roles[k]+'</option>'}).join('');
    var cu=currentUser();
    return '<div class="pet-v110-grid one"><div class="pet-v110-card"><h3>👥 إضافة / تعديل مستخدم</h3><div class="pet-v110-actions"><input id="v110UserId" type="hidden"><input id="v110Username" class="pet-v110-input" placeholder="اسم الدخول"><input id="v110FullName" class="pet-v110-input" placeholder="الاسم الكامل"><input id="v110Job" class="pet-v110-input" placeholder="الوظيفة"><input id="v110Phone" class="pet-v110-input" placeholder="الهاتف"><input id="v110Email" class="pet-v110-input" placeholder="البريد"><input id="v110Password" class="pet-v110-input" type="password" placeholder="كلمة المرور"><select id="v110Role" class="pet-v110-select">'+roleOpts+'</select><select id="v110Status" class="pet-v110-select"><option value="active">نشط</option><option value="disabled">موقوف</option><option value="blocked">محظور</option></select><button class="pet-v110-btn primary" data-v110-action="save-user">حفظ المستخدم</button><button class="pet-v110-btn" data-v110-action="clear-user">تفريغ</button></div></div><div class="pet-v110-card"><h3>📋 قائمة المستخدمين</h3><div class="pet-v110-table"><table><thead><tr><th>اسم الدخول</th><th>الاسم</th><th>الوظيفة</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>'+rows+'</tbody></table></div></div><div class="pet-v110-card"><h3>👤 بياناتي</h3><p>المستخدم الحالي: <b>'+esc(cu.fullName||cu.username)+'</b> — '+esc(roles[normalizeRole(cu.role||cu.role_code)]||cu.role)+'</p></div></div>';
  }

  window.petV110SaveUser=async function(){
    var u=users(), id=val('v110UserId',''), username=String(val('v110Username','')).trim();
    if(!username){toast('اسم الدخول مطلوب');return}
    if(u.some(function(x){return String(x.username||'').toLowerCase()===username.toLowerCase()&&String(x.id||'')!==String(id||'')})){toast('اسم الدخول موجود بالفعل');return}
    var x=id?u.find(function(y){return String(y.id||'')===String(id)}):null;
    var isNew=!x;
    if(!x){x={id:'u_'+Date.now(),createdAt:new Date().toISOString(),lastLogin:''};}
    x.username=username; x.fullName=String(val('v110FullName',username)).trim()||username;
    x.job=String(val('v110Job','')).trim(); x.phone=String(val('v110Phone','')).trim(); x.email=String(val('v110Email','')).trim();
    x.role=normalizeRole(val('v110Role','viewer')); x.role_code=dbRole(x.role); x.status=val('v110Status','active');
    var p=val('v110Password',''); var sec=window.PETATOEPasswordSecurity;
    if(p){if(sec&&sec.setPassword)sec.setPassword(x,p);}
    else if(isNew&&!(sec&&sec.hasCredential&&sec.hasCredential(x))&&!x.passwordHash){toast('كلمة المرور مطلوبة للمستخدم الجديد');return;}
    var btn=document.querySelector('[data-v110-action="save-user"]'); if(btn)btn.disabled=true;
    try{
      var res=await persistUserToSupabase(x);
      if(!res.ok){toast('فشل حفظ المستخدم: '+(res.error||'خطأ غير معروف'));return;}
      replaceCacheUser(res.user||x);
      audit(isNew?'User Created':'User Updated',username,'warn');
      toast('تم حفظ المستخدم');
      window.petV110ClearUserForm&&window.petV110ClearUserForm();
      renderUsers();
    }catch(e){toast('فشل حفظ المستخدم: '+(e&&e.message?e.message:e));}
    finally{if(btn)btn.disabled=false;}
  };
  window.petV110EditUser=function(id){
    var x=users().find(function(y){return String(y.id||'')===String(id)}); if(!x)return;
    var map={UserId:'id',Username:'username',FullName:'fullName',Job:'job',Phone:'phone',Email:'email',Role:'role',Status:'status'};
    Object.keys(map).forEach(function(n){var e=byId('v110'+n);if(e){var key=map[n];e.value=(key==='role'?normalizeRole(x.role||x.role_code):x[key])||''}});
    var p=byId('v110Password'); if(p)p.value=''; window.scrollTo({top:0,behavior:'smooth'});
  };
  window.petV110DeleteUser=async function(id){
    var u=users(), target=u.find(function(x){return String(x.id||'')===String(id)}); if(!target)return;
    if(isSuperUser(target)){toast('لا يمكن حذف Super Admin');return}
    if(!confirm('حذف المستخدم؟'))return;
    var res=await deleteUserFromSupabase(target);
    if(!res.ok){toast('فشل حذف المستخدم: '+(res.error||'خطأ غير معروف'));return;}
    removeCacheUser(target);
    audit('User Deleted',target.username||id,'warn'); toast('تم حذف المستخدم'); renderUsers();
  };
  window.petV110ClearUserForm=function(){
    ['v110UserId','v110Username','v110FullName','v110Job','v110Phone','v110Email','v110Password'].forEach(function(id){var e=byId(id);if(e)e.value=''});
    var r=byId('v110Role'); if(r)r.value='viewer'; var s=byId('v110Status'); if(s)s.value='active';
  };
  window.PETATOEUsersModule={__v:'8.0.2-users-supabase-save-final',renderUsersBody:renderUsersBody,persistUserToSupabase:persistUserToSupabase,deleteUserFromSupabase:deleteUserFromSupabase};
})();
