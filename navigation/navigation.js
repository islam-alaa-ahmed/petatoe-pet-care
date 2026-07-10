(function(){
  'use strict';
  if(window.__PETATOE_NAVIGATION_MODULE_PHASE1__) return;
  window.__PETATOE_NAVIGATION_MODULE_PHASE1__=true;
  // PETATOE v6.1.206 Phase 3: canonical navigation module with isolated permission gate.
  // This file owns building #nav and menu click routing only. Screen rendering remains inside each screen module.
  function petBlock7937_q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function petatoe_v38142_sidebar_final_js_esc(s){return String(s==null?'':s).replace(/[&<>\'\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  var groups=[
    {id:'operations',label:'⭐ العمليات',labelKey:'navigation.groups.transactions',items:[
      {tab:'entry',screen:'sales',title:'إدخال البيانات',sub:'تسجيل الفواتير والعمليات',titleKey:'navigation.transactions.dataEntry.title',subKey:'navigation.transactions.dataEntry.subtitle'},
      {tab:'import',screen:'sales',title:'رفع Excel',sub:'استيراد البيانات',titleKey:'navigation.transactions.excelUpload.title',subKey:'navigation.transactions.excelUpload.subtitle'},
      {tab:'records',screen:'reports',title:'السجلات',sub:'عرض السجلات',titleKey:'navigation.transactions.records.title',subKey:'navigation.transactions.records.subtitle'},
      {tab:'treasury',title:'الخزينة',sub:'الحركات المالية',titleKey:'navigation.transactions.treasury.title',subKey:'navigation.transactions.treasury.subtitle'},
      {tab:'warehouses',title:'المخازن',sub:'إدارة المخزون',titleKey:'navigation.transactions.warehouses.title',subKey:'navigation.transactions.warehouses.subtitle'}
    ]},
    {id:'analytics',label:'📈 التحليلات',labelKey:'navigation.groups.analytics',items:[
      {tab:'smart',screen:'reports',smartOpen:'advanced',title:'التقارير',sub:'التقارير الأساسية',titleKey:'navigation.analytics.reports.title',subKey:'navigation.analytics.reports.subtitle'},
      {tab:'smart',screen:'reports',title:'التقارير الذكية',sub:'تحليل وذكاء الأعمال',titleKey:'navigation.analytics.smartReports.title',subKey:'navigation.analytics.smartReports.subtitle'},
      {tab:'customer360',screen:'customers',title:'Customer 360',sub:'ملف العميل الشامل',titleKey:'navigation.analytics.customer360.title',subKey:'navigation.analytics.customer360.subtitle'},
      {tab:'executive',screen:'executive',title:'الإدارة العليا',sub:'Executive Dashboard',titleKey:'navigation.analytics.executive.title',subKey:'navigation.analytics.executive.subtitle'}
    ]},
    {id:'management',label:'🏢 الإدارة',labelKey:'navigation.groups.management',items:[
      {tab:'commissions',title:'نظام العمولات',sub:'حساب ومتابعة العمولات',titleKey:'navigation.management.commissions.title',subKey:'navigation.management.commissions.subtitle'},
      {tab:'commissionStatement',title:'كشف العمولة',sub:'كشف العمولة',titleKey:'navigation.management.commissionStatement.title',subKey:'navigation.management.commissionStatement.subtitle'},
      {tab:'fleet',title:'إدارة السيارات',sub:'السيارات والتشغيل',titleKey:'navigation.management.fleet.title',subKey:'navigation.management.fleet.subtitle'},
      {tab:'obligations',title:'الالتزامات',sub:'التزامات ومواعيد السداد',titleKey:'navigation.management.obligations.title',subKey:'navigation.management.obligations.subtitle'},
      {tab:'payroll',title:'إدارة الرواتب',sub:'كشوف الرواتب والاعتمادات',titleKey:'navigation.management.payroll.title',subKey:'navigation.management.payroll.subtitle'},
      {tab:'salarySlip',title:'كشف الراتب',sub:'كشف راتب المستخدم الحالي',titleKey:'navigation.management.salarySlip.title',subKey:'navigation.management.salarySlip.subtitle'}
    ]},
    {id:'settings',label:'⚙️ الإعدادات والصلاحيات',labelKey:'navigation.groups.settings',items:[
      {settingsMain:'system',title:'لوحة التحكم',sub:'ملخص وحالة النظام',titleKey:'navigation.settings.dashboard.title',subKey:'navigation.settings.dashboard.subtitle'},
      {settingsMain:'settings',settingsSub:'systemSettings',title:'الإعدادات العامة',sub:'الشركة، العملة، الوجهة، اللغة',titleKey:'navigation.settings.general.title',subKey:'navigation.settings.general.subtitle'},
      {settingsMain:'setup',title:'التهيئة',sub:'الخدمات، السيارات، العملاء، الخزن',titleKey:'navigation.settings.setup.title',subKey:'navigation.settings.setup.subtitle'},
      {settingsMain:'permissions',title:'الصلاحيات',sub:'صلاحيات المستخدمين',titleKey:'navigation.settings.permissions.title',subKey:'navigation.settings.permissions.subtitle'},
      {settingsMain:'users',title:'المستخدمين',sub:'إضافة وتعديل المستخدمين',titleKey:'navigation.settings.users.title',subKey:'navigation.settings.users.subtitle'},
      {tab:'logs',title:'السجل النظامي',sub:'Audit Trail',titleKey:'navigation.settings.auditLog.title',subKey:'navigation.settings.auditLog.subtitle'},
      {settingsMain:'settings',settingsSub:'backup',title:'نسخ احتياطي',sub:'تصدير نسخة JSON',titleKey:'navigation.settings.backup.title',subKey:'navigation.settings.backup.subtitle'},
      {settingsMain:'settings',settingsSub:'backup',settingsAction:'restore',title:'استعادة بيانات',sub:'استيراد نسخة JSON',titleKey:'navigation.settings.restore.title',subKey:'navigation.settings.restore.subtitle'}
    ]}
  ];
  function petatoeSidebarOpenTab(tabName, smartOpen){
    try{ if(window.PETATOERouter&&typeof window.PETATOERouter.openTab==='function') window.PETATOERouter.openTab(tabName, smartOpen||''); }
    catch(e){ try{ qa('.panel').forEach(function(p){p.classList.toggle('active',p.id===tabName)}); }catch(_){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("navigation/navigation.js",_);} }
    try{document.body.classList.remove('sidebar-open')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("navigation/navigation.js",e);}
    setTimeout(markActive,50);
  }
  function openSettings(main,sub,action){
    main=main||'system'; sub=sub||'';
    try{window.__PETATOE_SETTINGS_MAIN__=main;window.__PETATOE_SETTINGS_SUB__=sub||'';}catch(e){}
    // PETATOE v6.1.205 Phase 2: navigation only opens the section and broadcasts intent.
    // It must not call settings render functions directly; settings.js/settings-render-fix own rendering.
    petatoeSidebarOpenTab('settings');
    try{document.dispatchEvent(new CustomEvent('petatoe:settingsnavigate',{detail:{main:main,sub:sub,action:action||''}}));}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("navigation/navigation.js",e);}
    if(action==='restore'){
      setTimeout(function(){try{ if(typeof window.petV110PickRestore==='function') window.petV110PickRestore(); else if(typeof window.petatoeRestorePicker==='function') window.petatoeRestorePicker(); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("navigation/navigation.js",e);}},180);
    }
    setTimeout(markActive,80);
  }
  function clearNode(el){ while(el && el.firstChild){ el.removeChild(el.firstChild); } }
  function navSpan(className, text){ var span=document.createElement('span'); if(className)span.className=className; span.textContent=String(text==null?'':text); return span; }
  function navArrow(){ var i=document.createElement('i'); i.className='pet-v142-arrow'; i.textContent='▶'; return i; }
  function setI18nKey(el,key){ if(el&&key) el.setAttribute('data-i18n',key); return el; }
  function setButtonTitleSub(btn, title, sub, titleKey, subKey){
    clearNode(btn);
    btn.appendChild(setI18nKey(navSpan('pet-v142-title', title||''),titleKey));
    btn.appendChild(setI18nKey(navSpan('pet-v142-sub', sub||''),subKey));
  }
  function setToggleLabel(btn, label, labelKey){ clearNode(btn); btn.appendChild(setI18nKey(navSpan('', label||''),labelKey)); btn.appendChild(navArrow()); }
  function setDirectLabel(btn, label, labelKey){ clearNode(btn); btn.appendChild(setI18nKey(navSpan('', label||''),labelKey)); }
  // PETATOE v8.0.2 Phase 9: active-state must ignore buttons hidden by the permission layer.
  // Root cause: after permission apply() hides unauthorized buttons, markActive() could still select
  // the first DOM match, leaving a hidden button active or opening the wrong collapsed group.
  function isNavButtonVisible(btn){
    if(!btn) return false;
    if(btn.classList&&btn.classList.contains('pet-nav-hidden-by-permission')) return false;
    if(btn.getAttribute&&btn.getAttribute('aria-hidden')==='true') return false;
    if(btn.style&&btn.style.display==='none') return false;
    return true;
  }
  function firstVisibleButton(selector, root){
    var list=qa(selector,root);
    for(var i=0;i<list.length;i++){ if(isNavButtonVisible(list[i])) return list[i]; }
    return list[0]||null;
  }

  function normalizeScreenKey(screen){
    try{
      var G=window.PETATOENavigationPermissions;
      if(G&&typeof G.normalizeScreen==='function') return G.normalizeScreen(screen||'');
    }catch(e){}
    var m={dashboard:'dashboardManagement',system:'settings',logs:'audit','appointments-master':'appointmentsMaster',warehouse:'warehouses'};
    return m[screen]||screen||'';
  }
  function navCan(screen){
    screen=normalizeScreenKey(screen);
    if(!screen) return false;
    try{
      var G=window.PETATOENavigationPermissions;
      // PETATOE v8.0.2 Phase 5: fail-open while the navigation permission module is still loading.
      // Root cause: build() permanently removes items before apply()/guardClick can run when this file loads first.
      if(!G) return true;
      // PETATOE v8.0.2 Phase 4: use canOpen() before hasAnyAction().
      // canOpen() contains the Phase 3 readiness guard; hasAnyAction() must only run after identity is ready.
      if(typeof G.canOpen==='function') return !!G.canOpen(screen);
      if(typeof G.hasAnyAction==='function') return !!G.hasAnyAction(G.currentUser&&G.currentUser(),screen);
      var P=window.PETATOEPermissions, A=window.PETATOEAuth&&window.PETATOEAuth.currentUser?window.PETATOEAuth.currentUser():window.currentUser;
      var uid=A&&(A.id||A.username);
      if(P&&P.can&&uid) return ['view','add','edit','delete'].some(function(a){return P.can(uid,screen,a)});
    }catch(e){}
    return true;
  }
  function itemScreen(it){
    it=it||{};
    if(it.screen) return normalizeScreenKey(it.screen);
    if(it.settingsMain) return normalizeScreenKey(it.settingsMain);
    return normalizeScreenKey(it.tab||'');
  }
  function itemAllowed(it){return navCan(itemScreen(it));}
  function homeConfig(){
    var management=navCan('dashboardManagement');
    var operations=navCan('dashboardOperations')||navCan('vehicleOperations');
    if(management) return {tab:'dashboard',screen:'dashboardManagement',label:'🏠 الرئيسية'};
    if(operations) return {tab:'vehicleOperations',screen:'dashboardOperations',label:'🏠 الرئيسية التشغيلية'};
    // PETATOE v9 Phase 3H: keep the core Home entry in the DOM while identity/permissions are still hydrating.
    // The permission layer still owns final visibility after readiness, but the menu builder must not permanently omit Home.
    return {tab:'dashboard',screen:'dashboardManagement',label:'🏠 الرئيسية'};
  }

  function itemButton(it){
    var b=document.createElement('button'); b.type='button';
    if(it.tab){b.setAttribute('data-tab',it.tab);b.setAttribute('data-pet-nav-screen',it.screen||it.tab);}
    if(it.appointmentsSubTab)b.setAttribute('data-appointments-subtab',it.appointmentsSubTab);
    if(it.smartOpen)b.setAttribute('data-smart-open',it.smartOpen);
    if(it.settingsMain){b.setAttribute('data-settings-main',it.settingsMain);b.setAttribute('data-pet-nav-screen',it.screen||it.settingsMain);}
    if(it.settingsSub)b.setAttribute('data-settings-sub',it.settingsSub);
    if(it.settingsAction)b.setAttribute('data-settings-action',it.settingsAction);
    setButtonTitleSub(b, it.title||'', it.sub||'', it.titleKey||'', it.subKey||'');
    return b;
  }
  function build(){
    var nav=petBlock7937_q('#nav')||petBlock7937_q('.nav'); if(!nav) return false;
    nav.id='nav'; nav.className='nav pet-v142-nav'; clearNode(nav);

    function appendGroup(id,label,items,labelKey){
      // PETATOE v8.0.2 Phase 7: build the canonical menu DOM first, then let
      // PETATOENavigationPermissions.apply() hide unauthorized items after identity readiness.
      // Root cause: pre-filtering here permanently removed buttons when user/permissions were still loading,
      // so later permission readiness guards could not restore them without another full rebuild.
      var list=(items||[]);
      if(!list.length) return false;
      var wrap=document.createElement('div'); wrap.className='pet-v142-group'; wrap.setAttribute('data-group',id);
      var head=document.createElement('button'); head.type='button'; head.className='pet-v142-toggle'; head.setAttribute('data-v142-toggle',id);
      setToggleLabel(head,label,labelKey||'');
      var body=document.createElement('div'); body.className='pet-v142-items';
      list.forEach(function(it){ body.appendChild(itemButton(it)); });
      wrap.appendChild(head); wrap.appendChild(body); nav.appendChild(wrap);
      return true;
    }

    appendGroup('operationManagement','⚙️ إدارة التشغيل',[
      {tab:'appointments',screen:'appointments',title:'إدارة المواعيد',sub:'تخطيط وجدولة مواعيد الجلسات',titleKey:'navigation.operations.appointments.title',subKey:'navigation.operations.appointments.subtitle'},
      {tab:'vehicleOperations',screen:'vehicleOperations',title:'تشغيل السيارات',sub:'تنفيذ جلسات اليوم والتحصيل',titleKey:'navigation.operations.vehicleOperations.title',subKey:'navigation.operations.vehicleOperations.subtitle'},
      {tab:'vehicleOperationsReports',screen:'vehicleOperationsReports',title:'تقارير تشغيل السيارات',sub:'تحليل التنفيذ والتحصيل والأداء',titleKey:'navigation.operations.vehicleReports.title',subKey:'navigation.operations.vehicleReports.subtitle'},
      {tab:'operationKpis',screen:'operationKpis',title:'مؤشرات الأداء التشغيلية',sub:'KPI Dashboard للتشغيل والجودة',titleKey:'navigation.operations.kpis.title',subKey:'navigation.operations.kpis.subtitle'},
      {tab:'appointments',appointmentsSubTab:'master',screen:'appointmentsMaster',title:'البيانات المرجعية ⚙️',sub:'إدارة البيانات الأساسية للمواعيد',titleKey:'navigation.operations.masterData.title',subKey:'navigation.operations.masterData.subtitle'}
    ] ,'navigation.groups.operations');

    var hc=homeConfig();
    if(hc){
      var home=document.createElement('button'); home.type='button'; home.className='pet-v142-direct active'; home.setAttribute('data-tab',hc.tab); home.setAttribute('data-pet-nav-screen',hc.screen); setDirectLabel(home,hc.label,'navigation.home.title');
      nav.appendChild(home);
    }

    var childItem={tab:'childrenExpenses',screen:'childrenExpenses',title:'👨‍👧‍👦 مصروفات الأبناء',sub:''};
    // PETATOE v8.0.2 Phase 7: keep direct buttons in DOM; permission apply() owns visibility.
    var childExpenses=document.createElement('button'); childExpenses.type='button'; childExpenses.className='pet-v142-direct'; childExpenses.setAttribute('data-tab','childrenExpenses'); childExpenses.setAttribute('data-pet-permission-screen','childrenExpenses'); setDirectLabel(childExpenses,'👨‍👧‍👦 مصروفات الأبناء','navigation.children.title');
    nav.appendChild(childExpenses);

    groups.forEach(function(g){ appendGroup(g.id,g.label,g.items||[],g.labelKey||''); });
    bind(nav); markActive();
    try{ if(window.PETATOENavigationPermissions&&window.PETATOENavigationPermissions.apply) window.PETATOENavigationPermissions.apply(nav); document.dispatchEvent(new CustomEvent('petatoe:navbuilt',{detail:{nav:nav}})); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('navigation/navigation.js',e);}
    return true;
  }
  function closeOpen(nav, id){
    qa('.pet-v142-group',nav).forEach(function(g){
      var open=!!id && g.getAttribute('data-group')===id;
      g.classList.toggle('open',open);
      var ar=petBlock7937_q('.pet-v142-arrow',g); if(ar) ar.textContent=open?'▼':'▶';
    });
  }
  function bind(nav){
    if(nav.__petV142Bound) return; nav.__petV142Bound=true;
    nav.addEventListener('click',function(e){
      var t=e.target.closest&&e.target.closest('[data-v142-toggle]');
      if(t&&nav.contains(t)){
        e.preventDefault(); e.stopPropagation();
        var id=t.getAttribute('data-v142-toggle'); var group=t.closest('.pet-v142-group');
        closeOpen(nav,!(group&&group.classList.contains('open'))?id:'');
        return false;
      }
      var b=e.target.closest&&e.target.closest('button'); if(!b||!nav.contains(b)) return;
      var sm=b.getAttribute('data-settings-main');
      if(window.PETATOENavigationPermissions&&window.PETATOENavigationPermissions.guardClick&&!window.PETATOENavigationPermissions.guardClick(b)){e.preventDefault(); e.stopPropagation(); return false;}
      if(sm){e.preventDefault(); e.stopPropagation(); openSettings(sm,b.getAttribute('data-settings-sub')||'',b.getAttribute('data-settings-action')||''); return false;}
      var tab=b.getAttribute('data-tab');
      if(tab){
        e.preventDefault(); e.stopPropagation();
        var appointmentsSubTab=b.getAttribute('data-appointments-subtab')||'';
        petatoeSidebarOpenTab(tab,b.getAttribute('data-smart-open')||'');
        if(tab==='appointments'&&appointmentsSubTab){
          setTimeout(function(){
            try{
              if(window.PETATOEAppointments&&typeof window.PETATOEAppointments.setTab==='function') window.PETATOEAppointments.setTab(appointmentsSubTab);
              else if(window.__PETATOEAppointmentsLegacyEngine&&typeof window.__PETATOEAppointmentsLegacyEngine.setTab==='function') window.__PETATOEAppointmentsLegacyEngine.setTab(appointmentsSubTab);
              else if(window.PETATOEOperationsAppointmentsInternal&&typeof window.PETATOEOperationsAppointmentsInternal.setTab==='function') window.PETATOEOperationsAppointmentsInternal.setTab(appointmentsSubTab);
            }catch(err){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('navigation/navigation.js',err);}
            setTimeout(markActive,40);
          },80);
        }
        return false;
      }
    },true);
  }
  function markActive(){
    var nav=petBlock7937_q('#nav'); if(!nav||!nav.classList.contains('pet-v142-nav')) return;
    var active=(petBlock7937_q('.panel.active')||{}).id||'dashboard';
    var sm=''; try{sm=window.__PETATOE_SETTINGS_MAIN__||'system'}catch(e){sm='system';}
    qa('button',nav).forEach(function(b){b.classList.remove('active')});
    var activeBtn=null, groupId='';
    if(active==='settings'){
      activeBtn=firstVisibleButton('button[data-settings-main="'+sm+'"]',nav)||firstVisibleButton('button[data-settings-main="system"]',nav);
      groupId='settings';
    }else if(active==='logs'){
      activeBtn=firstVisibleButton('button[data-tab="logs"]',nav); groupId='settings';
    }else{
      if(active==='appointments'){
        var appointmentsActiveTab='';
        try{
          var appointmentTab=petBlock7937_q('#appointments .appointments-tab.active[data-appointment-tab]');
          appointmentsActiveTab=appointmentTab?appointmentTab.getAttribute('data-appointment-tab'):'';
        }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('navigation/navigation.js',e);}
        if(appointmentsActiveTab==='master') activeBtn=firstVisibleButton('button[data-tab="appointments"][data-appointments-subtab="master"]',nav);
      }
      if(!activeBtn) activeBtn=firstVisibleButton('button[data-tab="'+active+'"]',nav);
      var grp=activeBtn&&activeBtn.closest('.pet-v142-group'); groupId=grp?grp.getAttribute('data-group'):'';
    }
    if(activeBtn) activeBtn.classList.add('active');
    // settings must stay collapsed by default on dashboard. Open only when active inside settings/logs or when user clicks.
    if(active==='dashboard') closeOpen(nav,''); else closeOpen(nav,groupId);
  }
  var buildTimer=null;
  function force(){build();}
  function scheduleBuild(delay){
    if(buildTimer) clearTimeout(buildTimer);
    buildTimer=setTimeout(function(){buildTimer=null; force();}, delay||0);
  }
  function buildIfMissing(delay){
    setTimeout(function(){
      var nav=petBlock7937_q('#nav');
      if(!nav||!nav.classList.contains('pet-v142-nav')) scheduleBuild(0);
    }, delay||0);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){scheduleBuild(0);}); else scheduleBuild(0);
  // PETATOE v8.0.2 Phase 8: keep one safety probe after load instead of two blind rebuild retries.
  window.addEventListener('load',function(){buildIfMissing(120);},{once:true});
  document.addEventListener('petatoe:navigationpermissionsready',function(){scheduleBuild(30);});
  document.addEventListener('petatoe:permissionschanged',function(){scheduleBuild(30);});
  document.addEventListener('petatoe:userchanged',function(){scheduleBuild(30);});
  window.addEventListener('petatoe:identity-ready',function(){scheduleBuild(30);});
  document.addEventListener('petatoe:navigationpermissionsapplied',function(){setTimeout(markActive,30);});
  document.addEventListener('petatoe:tabchange',function(){setTimeout(markActive,60)});
})();