/* PETATOE v3.8.150 - Real Users Module Split
   Handles only users screen: render/add/edit/delete/clear.
   Depends on window.__PETATOE_SETTINGS_API__ from settings.js. */
(function(){
  'use strict';
  if(window.PETATOEUsersModule && window.PETATOEUsersModule.__v==='3.8.150') return;
  function api(){return window.__PETATOE_SETTINGS_API__||{};}
  function esc(s){var a=api();return a.esc?a.esc(s):String(s==null?'':s).replace(/[&<>\'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function byId(id){var a=api();return a.byId?a.byId(id):document.getElementById(id)}
  function val(id,d){var a=api();return a.val?a.val(id,d):((byId(id)||{}).value||d)}
  function toast(msg){var a=api();return a.toast?a.toast(msg):(window.toast?window.toast(msg):alert(msg))}
  function users(){var a=api();return a.users?a.users():[]}
  function saveUsers(v){var a=api();if(a.saveUsers)return a.saveUsers(v||[]);var ids=window.PETATOEIdentityStore;if(ids&&ids.saveUsers)return ids.saveUsers(v||[]);}
  function audit(action,details,level){var a=api();if(a.audit)return a.audit(action,details,level)}
  function renderUsers(){var a=api();if(a.render)return a.render('users')}
  function roleNames(){return api().roleNames||{superadmin:'Super Admin',admin:'Admin',accountant:'Accountant',sales:'Sales Manager',fleet:'Fleet Manager',viewer:'Viewer'}}
  function currentUser(){var a=api();return a.currentUser?a.currentUser():{id:'',username:'Guest',fullName:'Guest',role:'guest',status:'inactive'}}
  function isSuperUser(u){var a=api();return a.isSuperUser?a.isSuperUser(u):!!(u&&(u.role==='superadmin'||u.id==='u_admin'||String(u.username||'').toLowerCase()==='admin'))}

  function renderUsersBody(){
    var u=users();
    var roles=roleNames();
    var rows=u.map(function(x){
      return '<tr><td>'+esc(x.username)+'</td><td>'+esc(x.fullName||'-')+'</td><td>'+esc(x.job||'-')+'</td><td>'+esc(roles[x.role]||x.role)+'</td><td><span class="pet-v110-badge '+(x.status==='active'?'ok':'bad')+'">'+esc(x.status||'active')+'</span></td><td><button class="pet-v110-btn blue" data-v110-action="edit-user" data-v110-id="'+esc(x.id)+'">تعديل</button><button class="pet-v110-btn danger" data-v110-action="delete-user" data-v110-id="'+esc(x.id)+'">حذف</button></td></tr>';
    }).join('');
    var roleOpts=Object.keys(roles).map(function(k){return '<option value="'+k+'">'+roles[k]+'</option>'}).join('');
    var cu=currentUser();
    return '<div class="pet-v110-grid one"><div class="pet-v110-card"><h3>👥 إضافة / تعديل مستخدم</h3><div class="pet-v110-actions"><input id="v110UserId" type="hidden"><input id="v110Username" class="pet-v110-input" placeholder="اسم الدخول"><input id="v110FullName" class="pet-v110-input" placeholder="الاسم الكامل"><input id="v110Job" class="pet-v110-input" placeholder="الوظيفة"><input id="v110Phone" class="pet-v110-input" placeholder="الهاتف"><input id="v110Email" class="pet-v110-input" placeholder="البريد"><input id="v110Password" class="pet-v110-input" type="password" placeholder="كلمة المرور"><select id="v110Role" class="pet-v110-select">'+roleOpts+'</select><select id="v110Status" class="pet-v110-select"><option value="active">نشط</option><option value="disabled">موقوف</option><option value="blocked">محظور</option></select><button class="pet-v110-btn primary" data-v110-action="save-user">حفظ المستخدم</button><button class="pet-v110-btn" data-v110-action="clear-user">تفريغ</button></div></div><div class="pet-v110-card"><h3>📋 قائمة المستخدمين</h3><div class="pet-v110-table"><table><thead><tr><th>اسم الدخول</th><th>الاسم</th><th>الوظيفة</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>'+rows+'</tbody></table></div></div><div class="pet-v110-card"><h3>👤 بياناتي</h3><p>المستخدم الحالي: <b>'+esc(cu.fullName||cu.username)+'</b> — '+esc(roles[cu.role]||cu.role)+'</p></div></div>';
  }

  window.petV110SaveUser=async function(){
    var u=users(), id=val('v110UserId',''), username=String(val('v110Username','')).trim();
    if(!username){toast('اسم الدخول مطلوب');return}
    if(u.some(function(x){return String(x.username||'').toLowerCase()===username.toLowerCase()&&String(x.id)!==String(id)})){toast('اسم الدخول موجود بالفعل');return}
    var x=id?u.find(function(y){return String(y.id)===String(id)}):null;
    if(!x){x={id:'u_'+Date.now(),createdAt:new Date().toISOString(),lastLogin:''};u.push(x)}
    x.username=username; x.fullName=String(val('v110FullName',username)).trim()||username; x.full_name=x.fullName;
    x.job=String(val('v110Job','')).trim(); x.phone=String(val('v110Phone','')).trim(); x.email=String(val('v110Email','')).trim();
    x.role=val('v110Role','viewer'); x.role_code=x.role; x.status=val('v110Status','active');
    var p=val('v110Password',''); var sec=window.PETATOEPasswordSecurity;
    if(p){if(sec&&sec.setPassword)sec.setPassword(x,p); else x.password=p;}
    else if(!id&&!(sec&&sec.hasCredential&&sec.hasCredential(x))&&!x.passwordHash&&!x.password){toast('كلمة المرور مطلوبة للمستخدم الجديد');return;}
    var res=await saveUsers(u);
    if(res&&res.ok===false){toast('فشل حفظ المستخدم: '+(res.error||'خطأ غير معروف'));return;}
    audit(id?'User Updated':'User Created',username,'warn'); toast('تم حفظ المستخدم');
    if(window.PETATOEIdentityStore&&window.PETATOEIdentityStore.load){try{await window.PETATOEIdentityStore.load({force:true});}catch(_e){}}
    renderUsers();
  };
  window.petV110EditUser=function(id){
    var x=users().find(function(y){return y.id===id}); if(!x)return;
    ['UserId','Username','FullName','Job','Phone','Email','Role','Status'].forEach(function(n){var e=byId('v110'+n);if(e){var key={UserId:'id',Username:'username',FullName:'fullName',Job:'job',Phone:'phone',Email:'email',Role:'role',Status:'status'}[n];e.value=x[key]||''}});
    var p=byId('v110Password'); if(p)p.value=''; window.scrollTo({top:0,behavior:'smooth'});
  };
  window.petV110DeleteUser=function(id){
    var u=users(), target=u.find(function(x){return x.id===id}); if(!target)return;
    if(id==='u_admin'||isSuperUser(target)){toast('لا يمكن حذف Super Admin');return}
    if(!confirm('حذف المستخدم؟'))return;
    Promise.resolve(saveUsers(u.filter(function(x){return String(x.id)!==String(id)}))).then(function(res){
      if(res&&res.ok===false){toast('فشل حذف المستخدم: '+(res.error||'خطأ غير معروف'));return;}
      audit('User Deleted',target.username||id,'warn'); toast('تم حذف المستخدم'); renderUsers();
    });
  };
  window.petV110ClearUserForm=function(){
    ['v110UserId','v110Username','v110FullName','v110Job','v110Phone','v110Email','v110Password'].forEach(function(id){var e=byId(id);if(e)e.value=''});
    var r=byId('v110Role'); if(r)r.value='viewer'; var s=byId('v110Status'); if(s)s.value='active';
  };
  window.PETATOEUsersModule={__v:'3.8.150',renderUsersBody:renderUsersBody};
})();
