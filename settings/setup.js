/* PETATOE v3.8.152 - Real Setup Split
   Master setup data module extracted from settings.js. */
(function(){
  'use strict';
  var INIT_KEY='petatoe_master_setup_v120';
  var currentApi=null;
  var __masterCache=null, __masterCacheAt=0, __masterSyncAt=0, __searchTimers={};
  var TABLE_LIMIT=120, SEARCH_LIMIT=250;
  function api(){return currentApi||window.__PETATOE_SETTINGS_API__||{}}
  function byId(id){return (api().byId?api().byId(id):document.getElementById(id))}
  function esc(s){return api().esc?api().esc(s):String(s==null?'':s).replace(/[&<>\'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]})}
  var __supabaseSetupCache={}, __supabaseSetupLoading={}, __uiState={};
  function clone(v,d){try{return v==null?d:JSON.parse(JSON.stringify(v));}catch(_){return v==null?d:v;}}
  function repo(){return window.PETATOESupabaseRepository||null}
  function setupKey(k){return 'settings_setup_'+String(k||'default');}
  function scheduleSetupRender(){setTimeout(function(){try{if(api().render)api().render('setup');}catch(_){}} ,80)}
  function read(k,d){
    if(api().read&&k!=='petatoe_master_setup_v120'&&k!=='petatoe_master_setup_deleted_v121')return api().read(k,d);
    if(Object.prototype.hasOwnProperty.call(__uiState,k))return clone(__uiState[k],d);
    if(Object.prototype.hasOwnProperty.call(__supabaseSetupCache,k))return clone(__supabaseSetupCache[k],d);
    var r=repo();
    if(r&&typeof r.getSystemSetting==='function'&&!__supabaseSetupLoading[k]){
      __supabaseSetupLoading[k]=true;
      r.getSystemSetting(setupKey(k),d).then(function(v){__supabaseSetupCache[k]=clone(v,d);__supabaseSetupLoading[k]=false;scheduleSetupRender();}).catch(function(e){__supabaseSetupLoading[k]=false;console.warn('PETATOESetup Supabase read failed',k,e);});
    }
    return clone(d,d);
  }
  function write(k,v){
    if(k&&String(k).indexOf('pet_v121_')===0 || k==='pet_settings_v120_setup_tab'){__uiState[k]=v;return;}
    __supabaseSetupCache[k]=clone(v,v);
    var r=repo();
    if(r&&typeof r.saveSystemSetting==='function')r.saveSystemSetting(setupKey(k),v).catch(function(e){console.warn('PETATOESetup Supabase write failed',k,e);});
    else if(api().write)api().write(k,v);
  }
  function store(){return {get:function(k,d){var v=read(k,d);return v==null?d:v;},set:function(k,v){write(k,v);},remove:function(k){delete __uiState[k];delete __supabaseSetupCache[k];}}}
  function toast(msg){if(api().toast)return api().toast(msg);try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(e){alert(msg)}}
  function records(){try{var fb=(window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync)?window.PETATOEDataSource.getRecordsSync():[];return Array.isArray(fb)?fb:[]}catch(e){return []}}
  function audit(action,details,level){if(api().audit)return api().audit(action,details,level)}
  function render(main,sub){if(api().render)return api().render(main,sub)}

  function normalizeMasterData(d){
    if(!d||typeof d!=='object') d={services:[],cars:[],customers:[],vaults:[]};
    ['services','cars','customers','vaults'].forEach(function(k){if(!Array.isArray(d[k]))d[k]=[]});
    return d;
  }
  function masterData(forceSync){
    var now=Date.now();
    if(__masterCache && !forceSync && (now-__masterCacheAt)<30000) return __masterCache;
    var d=normalizeMasterData(read(INIT_KEY,null));
    if(forceSync){
      try{d=syncExistingMasterData(d);__masterSyncAt=now;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("settings/setup.js",e);}
    }
    __masterCache=d;__masterCacheAt=now;
    return d;
  }
  function saveMasterData(d){d=normalizeMasterData(d);__masterCache=d;__masterCacheAt=Date.now();write(INIT_KEY,d)}
  function uniqueValues(arr){var m={};return arr.filter(function(v){v=String(v||'').trim();if(!v||m[v])return false;m[v]=1;return true})}
  function normMasterName(v){return String(v==null?'':v).trim().replace(/\s+/g,' ').toLowerCase()}
  function readMasterDeleted(){return read('petatoe_master_setup_deleted_v121',{})||{}}
  function writeMasterDeleted(v){write('petatoe_master_setup_deleted_v121',v||{})}
  function isMasterDeleted(type,name){var del=readMasterDeleted();return !!del[type+'|'+normMasterName(name)]}
  function markMasterDeleted(type,name){name=String(name||'').trim();if(!name)return;var del=readMasterDeleted();del[type+'|'+normMasterName(name)]=true;writeMasterDeleted(del)}
  function masterHas(d,type,name){var n=normMasterName(name);return (d[type]||[]).some(function(x){return normMasterName(x.name)===n})}
  function addMasterAuto(d,type,name,extra){name=String(name||'').trim();if(!name||isMasterDeleted(type,name)||masterHas(d,type,name))return false;d[type]=d[type]||[];d[type].push(Object.assign({id:'auto_'+type+'_'+Date.now()+'_'+Math.random().toString(16).slice(2),code:'',name:name,source:'imported',status:'active',createdAt:new Date().toISOString()},extra||{}));return true}
  function safeLocalObj(k,def){return def&&typeof def==='object'?clone(def,def):def}
  function safeLocalArr(k){return []}
  function rVal(r,keys){for(var i=0;i<keys.length;i++){var k=keys[i];if(r&&r[k]!=null&&String(r[k]).trim()!=='')return r[k]}return ''}
  function syncExistingMasterData(d){
    var changed=false, rs=records();
    rs.forEach(function(r){
      changed=addMasterAuto(d,'cars',rVal(r,['van','vehicle','car','carName','truck','السيارة']),{plate:'',driver:'',notes:'مستورد من بيانات المبيعات'})||changed;
      changed=addMasterAuto(d,'customers',rVal(r,['client','customer','customerName','clientName','name','العميل']),{code:rVal(r,['customerCode','clientCode','code']),phone:rVal(r,['phone','mobile','هاتف']),notes:'مستورد من الفواتير'})||changed;
      changed=addMasterAuto(d,'services',rVal(r,['item','itemName','service','serviceName','product','description','الصنف','الخدمة']),{category:'من الفواتير',price:rVal(r,['price','unitPrice','unit_price','سعر الوحدة']),description:'مستورد من الفواتير'})||changed;
    });
    var fleet=safeLocalObj('PETATOE_FLEET_MANAGEMENT_V1',{vehicles:[]});
    (fleet.vehicles||[]).forEach(function(v){changed=addMasterAuto(d,'cars',v.name||v.plate,{code:v.id||'',plate:v.plate||'',driver:v.driver||v.groomer||'',status:v.status||'active',notes:v.notes||'مستورد من إدارة السيارات'})||changed});
    var txs=safeLocalArr('PETATOE_TREASURY_TRANSACTIONS_V1');
    txs.forEach(function(t){
      var v=t.vehicle||t.source||t.from||'';
      if(v&&String(v).indexOf('الخزنة الرئيسية')<0) changed=addMasterAuto(d,'vaults','خزنة '+v,{type:'car',balance:0,notes:'مستورد من حركات الخزينة'})||changed;
      var to=t.to||t.target||'';
      if(to&&String(to).indexOf('الخزنة')>-1) changed=addMasterAuto(d,'vaults',to,{type:'custom',balance:0,notes:'مستورد من حركات الخزينة'})||changed;
    });

    // PETATOE v3.8.123: auto-create car sub-vaults even if no treasury handover/expense was recorded yet.
    // The previous setup screen only detected car vaults from treasury movements, so vehicles with cash invoices
    // or fleet records but no handover movement did not appear in the Vaults setup tab.
    var carVaultSet={};
    (d.cars||[]).forEach(function(c){var n=String((c&&c.name)||'').trim(); if(n)carVaultSet[n]=1; var p=String((c&&c.plate)||'').trim(); if(p)carVaultSet[p]=1});
    rs.forEach(function(r){var n=String(rVal(r,['van','vehicle','car','carName','truck','السيارة'])||'').trim(); if(n)carVaultSet[n]=1});
    (fleet.vehicles||[]).forEach(function(v){var n=String((v&&v.name)||(v&&v.plate)||'').trim(); if(n)carVaultSet[n]=1});
    Object.keys(carVaultSet).filter(Boolean).sort().forEach(function(v){
      if(String(v).indexOf('الخزنة الرئيسية')>-1)return;
      changed=addMasterAuto(d,'vaults','خزنة '+v,{code:'CAR-'+v.replace(/\s+/g,'_'),type:'car',balance:0,notes:'خزنة فرعية للسيارة - مستوردة تلقائيًا من بيانات السيارات والفواتير'})||changed;
    });

    changed=addMasterAuto(d,'vaults','الخزنة الرئيسية للمالك',{code:'MAIN',type:'main',balance:0,notes:'خزنة رئيسية'})||changed;
    if(changed)saveMasterData(d);
    return d;
  }
  function setupStats(d){return {services:d.services.length,cars:d.cars.length,customers:d.customers.length,vaults:d.vaults.length}}
  function setupActiveType(){var S=store();var t=(S&&S.get?S.get('pet_settings_v120_setup_tab','services'):'services')||'services';return ['services','cars','customers','vaults'].indexOf(t)>=0?t:'services'}
  function setupTypeMeta(type){var map={
    services:{ico:'🛠️',title:'الخدمات',single:'خدمة',formTitle:'إضافة / تعديل خدمة',listTitle:'سجل الخدمات',importBtn:true,fields:[['code','كود الخدمة','text'],['name','اسم الخدمة','text'],['category','تصنيف الخدمة','text'],['price','السعر (SAR)','number'],['description','الوصف','text'],['status','حالة الخدمة','select']]},
    cars:{ico:'🚐',title:'السيارات',single:'سيارة',formTitle:'إضافة / تعديل سيارة',listTitle:'سجل السيارات',importBtn:true,fields:[['code','كود السيارة','text'],['name','اسم السيارة','text'],['plate','رقم اللوحة','text'],['driver','السائق / المسؤول','text'],['status','حالة السيارة','select']]},
    customers:{ico:'👥',title:'العملاء',single:'عميل',formTitle:'إضافة / تعديل عميل',listTitle:'سجل العملاء',importBtn:true,fields:[['code','كود العميل','text'],['name','اسم العميل','text'],['phone','الهاتف','text'],['notes','ملاحظات','text'],['status','حالة العميل','select']]},
    vaults:{ico:'🏦',title:'الخزن',single:'خزنة',formTitle:'إضافة / تعديل خزنة',listTitle:'سجل الخزن',importBtn:false,fields:[['code','كود الخزنة','text'],['name','اسم الخزنة','text'],['type','نوع الخزنة','vaultType'],['balance','الرصيد الافتتاحي','number'],['notes','ملاحظات','text'],['status','حالة الخزنة','select']]}
  };return map[type]||map.services}
  function setupFieldInput(type,f,item){var key=f[0],label=f[1],kind=f[2],id='v121_'+type+'_'+key,valx=esc(item&&item[key]!=null?item[key]:(kind==='select'?'active':''));var input='';if(kind==='select'){input='<select id="'+id+'"><option value="active" '+(valx==='active'?'selected':'')+'>نشط</option><option value="inactive" '+(valx==='inactive'?'selected':'')+'>متوقف</option></select>'}else if(kind==='vaultType'){input='<select id="'+id+'"><option value="main" '+(valx==='main'?'selected':'')+'>رئيسية</option><option value="car" '+(valx==='car'?'selected':'')+'>خزنة سيارة</option><option value="custom" '+(valx==='custom'?'selected':'')+'>أخرى</option></select>'}else{input='<input id="'+id+'" type="'+kind+'" value="'+valx+'" placeholder="'+esc(label)+'">'}return '<div class="pet-v121-field"><label>'+esc(label)+(key==='name'?' <span style="color:var(--red)">*</span>':'')+'</label>'+input+'</div>'}
  function setupForm(type){var m=setupTypeMeta(type), d=masterData(), editId=((store()&&store().get)?store().get('pet_v121_edit_'+type,''):''), item=(d[type]||[]).find(function(x){return x.id===editId})||null;return '<div class="pet-v121-master-form"><div class="pet-v121-form-head"><div><h3>'+m.ico+' '+m.formTitle+'</h3><p>أدخل البيانات الأساسية ثم احفظ. عند التعديل يتم ملء النموذج الحالي بنفس بيانات السجل.</p></div><span class="pet-v110-badge '+(item?'warn':'info')+'">'+(item?'وضع التعديل':'إضافة جديد')+'</span></div><div class="pet-v121-form-grid">'+m.fields.map(function(f){return setupFieldInput(type,f,item)}).join('')+'</div><div class="pet-v121-form-actions"><button class="pet-v110-btn primary" data-v121-action="save" data-v121-type="'+type+'">💾 '+(item?'حفظ التعديل':'حفظ')+'</button><button class="pet-v110-btn blue" data-v121-action="clear" data-v121-type="'+type+'">↻ تفريغ</button>'+(m.importBtn?'<button class="pet-v110-btn green" data-v121-action="seed">⬇️ استيراد من الفواتير</button>':'')+'</div></div>'}
  function setupQuery(type){return String((store()&&store().get)?store().get('pet_v121_search_'+type,''):'').toLowerCase().trim()}
  function setupShowAll(type){return ((store()&&store().get)?store().get('pet_v121_show_all_'+type,'0'):'0')==='1'}
  function setupFilteredMasterData(type,d){d=d||masterData();var q=setupQuery(type), data=(d[type]||[]).slice();if(q){data=data.filter(function(x){return Object.keys(x).some(function(k){return String(x[k]||'').toLowerCase().indexOf(q)>=0})})}return data}
  function setupVisibleMasterData(type,d){var data=setupFilteredMasterData(type,d), q=setupQuery(type), limit=q?SEARCH_LIMIT:TABLE_LIMIT;if(setupShowAll(type))return {rows:data,total:data.length,limited:false,limit:limit};return {rows:data.slice(0,limit),total:data.length,limited:data.length>limit,limit:limit}}
  function setupTableRows(type,d){d=d||masterData();var m=setupTypeMeta(type), pack=setupVisibleMasterData(type,d), data=pack.rows, cols=m.fields.filter(function(f){return f[0]!=='description'});return data.map(function(x,i){var status=x.status||'active',source=x.source||'manual',created=x.createdAt?String(x.createdAt).slice(0,10):'-';return '<tr><td>'+(i+1)+'</td>'+cols.map(function(c){var v=x[c[0]];if(c[0]==='status')return '<td><span class="pet-v110-badge '+(status==='inactive'?'pet-v121-status-inactive':'pet-v121-status-active')+'">'+(status==='inactive'?'متوقف':'نشط')+'</span></td>';return '<td>'+esc(v==null||v===''?'-':v)+'</td>'}).join('')+'<td><span class="pet-v110-badge '+(source==='imported'?'pet-v121-source-imported':'pet-v121-source-manual')+'">'+(source==='imported'?'مستورد':'يدوي')+'</span></td><td>'+esc(created)+'</td><td><button class="pet-v121-action-btn view" title="عرض" data-v121-action="view" data-v121-type="'+type+'" data-v121-id="'+esc(x.id)+'">👁</button><button class="pet-v121-action-btn edit" title="تعديل" data-v121-action="edit" data-v121-type="'+type+'" data-v121-id="'+esc(x.id)+'">✏️</button><button class="pet-v121-action-btn delete" title="حذف" data-v121-action="delete" data-v121-type="'+type+'" data-v121-id="'+esc(x.id)+'">🗑</button></td></tr>'}).join('')||'<tr><td colspan="'+(cols.length+4)+'">لا توجد بيانات مسجلة</td></tr>'}
  function setupTableFooter(type,d){var pack=setupVisibleMasterData(type,d);if(!pack.limited)return '';return '<div class="pet-v110-note" style="margin-top:10px">تم عرض أول '+pack.limit+' سجل فقط من أصل '+pack.total+' للحفاظ على سرعة الشاشة. <button type="button" class="pet-v110-btn blue" data-v121-action="showAll" data-v121-type="'+type+'">عرض الكل</button></div>'}
  function setupTable(type,d){d=d||masterData();var m=setupTypeMeta(type), cols=m.fields.filter(function(f){return f[0]!=='description'}), shown=setupVisibleMasterData(type,d);return '<div class="pet-v121-master-list"><div class="pet-v121-list-head"><div><h3>'+m.ico+' '+m.listTitle+'</h3><p style="margin:4px 0 0;color:var(--muted);font:850 12px Cairo">يعرض البيانات المستوردة من الفواتير والبيانات المضافة يدويًا.</p></div><div class="pet-v121-list-tools"><input id="pet_v121_search_input_'+type+'" class="pet-v121-search" value="'+esc((store()&&store().get)?store().get('pet_v121_search_'+type,''):'')+'" placeholder="بحث داخل '+esc(m.listTitle)+'..." data-v121-search="'+type+'"><span id="pet_v121_total_'+type+'" class="pet-v110-badge info">المعروض: '+shown.rows.length+' / '+shown.total+'</span></div></div><div class="pet-v110-table pet-v120-setup-table"><table><thead><tr><th>#</th>'+cols.map(function(c){return '<th>'+esc(c[1])+'</th>'}).join('')+'<th>المصدر</th><th>تاريخ الإضافة</th><th>إجراءات</th></tr></thead><tbody id="pet_v121_tbody_'+type+'">'+setupTableRows(type,d)+'</tbody></table></div><div id="pet_v121_footer_'+type+'">'+setupTableFooter(type,d)+'</div></div>'}
  function setupBody(){var d=masterData(), st=setupStats(d), active=setupActiveType(), meta=setupTypeMeta(active);var tabs=['services','cars','customers','vaults'].map(function(t){var m=setupTypeMeta(t), count=(d[t]||[]).length;return '<button type="button" class="pet-v121-setup-tab '+(active===t?'active':'')+'" data-v120-setup-tab="'+t+'"><span>'+m.ico+'</span><span>'+m.title+'</span><small style="opacity:.8">'+count+'</small></button>'}).join('');return '<div class="pet-v121-setup-page"><div class="pet-v121-setup-hero"><div><h3>🛠️ بيانات التهيئة</h3><p>إدارة البيانات الأساسية للنظام: الخدمات، السيارات، العملاء، والخزن. كل قسم له نموذج إضافة/تعديل بالأعلى وسجل البيانات بالأسفل.</p></div><div class="pet-v110-actions"><span class="pet-v110-badge info">الخدمات: '+st.services+'</span><span class="pet-v110-badge info">السيارات: '+st.cars+'</span><span class="pet-v110-badge info">العملاء: '+st.customers+'</span><span class="pet-v110-badge info">الخزن: '+st.vaults+'</span></div></div><div class="pet-v121-setup-tabs">'+tabs+'</div><div class="pet-v121-master-layout">'+setupForm(active)+setupTable(active,d)+'</div><div class="pet-v110-note">ملاحظة: شاشة التهيئة لا تغير الفواتير أو التقارير القديمة. البيانات هنا Master Data مستقلة ومحفوظة في Supabase ضمن إعدادات النظام.</div></div>'}

  function getV121Field(type,key){var e=byId('v121_'+type+'_'+key);return e?e.value:''}
  window.petV121SaveMasterItem=function(type){
    var d=masterData(), m=setupTypeMeta(type), editId=((store()&&store().get)?store().get('pet_v121_edit_'+type,''):''), item=editId?(d[type]||[]).find(function(x){return x.id===editId}):null;
    if(!item){item={id:'m_'+Date.now()+'_'+Math.random().toString(16).slice(2),source:'manual',createdAt:new Date().toISOString()};d[type]=d[type]||[];d[type].push(item)}
    m.fields.forEach(function(f){item[f[0]]=getV121Field(type,f[0])});
    item.name=String(item.name||'').trim();
    if(!item.name){toast('اسم '+m.single+' مطلوب');return;}
    item.updatedAt=new Date().toISOString();
    item.source=item.source||'manual';
    if(!item.status)item.status='active';
    var dup=(d[type]||[]).some(function(x){return x.id!==item.id&&String(x.name||'').trim().toLowerCase()===item.name.toLowerCase()});
    if(dup&&!confirm('الاسم موجود بالفعل. هل تريد حفظه رغم التكرار؟'))return;
    saveMasterData(d);var S=store();if(S&&S.remove)S.remove('pet_v121_edit_'+type);audit(item.id===editId?'Master Data Updated':'Master Data Created',type+': '+item.name,'info');toast(editId?'تم حفظ التعديل':'تمت الإضافة');render('setup');
  };
  window.petV120SaveMasterItem=function(type){window.petV121SaveMasterItem(type)};
  window.petV121ShowAllMaster=function(type){var S=store();if(S&&S.set)S.set('pet_v121_show_all_'+type,'1');render('setup')};

  window.petV121EditMasterItem=function(type,id){var S=store();if(S&&S.set){S.set('pet_settings_v120_setup_tab',type);S.set('pet_v121_edit_'+type,id);}render('setup');setTimeout(function(){var el=document.querySelector('#settings .pet-v121-master-form');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},60)};
  window.petV121ClearMasterForm=function(type){var S=store();if(S&&S.remove)S.remove('pet_v121_edit_'+type);render('setup')};
  window.petV121ViewMasterItem=function(type,id){var x=(masterData()[type]||[]).find(function(y){return y.id===id});if(!x)return;var m=setupTypeMeta(type);var lines=m.fields.map(function(f){return f[1]+': '+(x[f[0]]||'-')}).join('\n');alert(m.title+'\n----------------\n'+lines+'\nالمصدر: '+(x.source==='imported'?'مستورد':'يدوي'))};
  window.petV121SearchMaster=function(type,q){var S=store();if(S&&S.set){S.set('pet_v121_search_'+type,String(q||''));S.remove&&S.remove('pet_v121_show_all_'+type);}if(__searchTimers[type])clearTimeout(__searchTimers[type]);__searchTimers[type]=setTimeout(function(){var tbody=document.getElementById('pet_v121_tbody_'+type), foot=document.getElementById('pet_v121_footer_'+type), total=document.getElementById('pet_v121_total_'+type);if(tbody){var d=masterData(), shown=setupVisibleMasterData(type,d);if(window.PETATOESecurity&&window.PETATOESecurity.setInnerHTML){window.PETATOESecurity.setInnerHTML(tbody,setupTableRows(type,d));if(foot)window.PETATOESecurity.setInnerHTML(foot,setupTableFooter(type,d));}else{tbody.replaceChildren(document.createRange().createContextualFragment(String(setupTableRows(type,d)||'')));if(foot)foot.replaceChildren(document.createRange().createContextualFragment(String(setupTableFooter(type,d)||'')));}if(total)total.textContent='المعروض: '+shown.rows.length+' / '+shown.total;return;}render('setup')},120)};
  window.petV120DeleteMasterItem=function(type,id){
    if(!confirm('تأكيد حذف هذا السطر من بيانات التهيئة؟'))return;
    var d=masterData(), old=(d[type]||[]).find(function(x){return x.id===id});
    if(old&&old.source==='imported')markMasterDeleted(type,old.name);
    d[type]=(d[type]||[]).filter(function(x){return x.id!==id});saveMasterData(d);audit('Master Data Deleted',type+': '+(old&&old.name||id),'warn');toast('تم الحذف');render('setup');
  };
  window.petV120SeedFromRecords=function(){
    var d=masterData(true), rs=records();
    var add=function(type,name,extra){name=String(name||'').trim(); if(!name)return; d[type]=d[type]||[]; if(d[type].some(function(x){return String(x.name||'').trim().toLowerCase()===name.toLowerCase()}))return; d[type].push(Object.assign({id:'m_'+Date.now()+'_'+Math.random().toString(16).slice(2),code:'',name:name,source:'imported',status:'active',createdAt:new Date().toISOString()},extra||{}));};
    rs.forEach(function(r){
      add('cars', r.vehicle||r.car||r.van||r.carName||'', {plate:'',driver:''});
      add('customers', r.customer||r.client||r.customerName||r.clientName||'', {phone:r.phone||'',notes:'من الفواتير'});
      add('services', r.service||r.serviceName||r.item||r.itemName||r.product||'', {category:'من الفواتير',price:r.price||r.unitPrice||'',description:'مستورد من الفواتير'});
    });
    uniqueValues((d.cars||[]).map(function(c){return c.name})).forEach(function(car){add('vaults','خزنة '+car,{code:'',type:'car',balance:0,notes:'من السيارات'})});
    add('vaults','الخزنة الرئيسية للمالك',{code:'MAIN',type:'main',balance:0,notes:'خزنة رئيسية'});
    saveMasterData(d); audit('Master Data Imported','Seed from invoices','info'); toast('تم استيراد بيانات التهيئة من الفواتير الحالية'); render('setup');
  };
  if(!window.__PETATOE_SETUP_TAB_CLICK_BOUND__){window.__PETATOE_SETUP_TAB_CLICK_BOUND__=true;document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-v120-setup-tab]');if(t){e.preventDefault();e.stopPropagation();var S=store();if(S&&S.set)S.set('pet_settings_v120_setup_tab',t.getAttribute('data-v120-setup-tab'));render('setup')}},true);}

  window.PETATOESetup={
    renderSetupBody:function(settingsApi){currentApi=settingsApi||currentApi;return setupBody()},
    masterData:masterData,
    saveMasterData:saveMasterData,
    setupTypeMeta:setupTypeMeta
  };
})();
