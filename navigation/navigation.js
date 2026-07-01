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
    {id:'operations',label:'⭐ العمليات',items:[
      {tab:'entry',screen:'sales',title:'إدخال البيانات',sub:'تسجيل الفواتير والعمليات'},
      {tab:'import',screen:'sales',title:'رفع Excel',sub:'استيراد البيانات'},
      {tab:'records',screen:'reports',title:'السجلات',sub:'عرض السجلات'},
      {tab:'treasury',title:'الخزينة',sub:'الحركات المالية'},
      {tab:'warehouses',title:'المخازن',sub:'إدارة المخزون'}
    ]},
    {id:'analytics',label:'📈 التحليلات',items:[
      {tab:'smart',screen:'reports',smartOpen:'advanced',title:'التقارير',sub:'التقارير الأساسية'},
      {tab:'smart',screen:'reports',title:'التقارير الذكية',sub:'تحليل وذكاء الأعمال'},
      {tab:'customer360',screen:'customers',title:'Customer 360',sub:'ملف العميل الشامل'},
      {tab:'executive',screen:'executive',title:'الإدارة العليا',sub:'Executive Dashboard'}
    ]},
    {id:'management',label:'🏢 الإدارة',items:[
      {tab:'commissions',title:'نظام العمولات',sub:'حساب ومتابعة العمولات'},
      {tab:'commissionStatement',title:'كشف العمولة',sub:'كشف العمولة'},
      {tab:'fleet',title:'إدارة السيارات',sub:'السيارات والتشغيل'},
      {tab:'obligations',title:'الالتزامات',sub:'التزامات ومواعيد السداد'},
      {tab:'payroll',title:'إدارة الرواتب',sub:'كشوف الرواتب والاعتمادات'},
      {tab:'salarySlip',title:'كشف الراتب',sub:'كشف راتب المستخدم الحالي'}
    ]},
    {id:'settings',label:'⚙️ الإعدادات والصلاحيات',items:[
      {settingsMain:'system',title:'لوحة التحكم',sub:'ملخص وحالة النظام'},
      {settingsMain:'settings',settingsSub:'systemSettings',title:'الإعدادات العامة',sub:'الشركة، العملة، الوجهة، اللغة'},
      {settingsMain:'setup',title:'التهيئة',sub:'الخدمات، السيارات، العملاء، الخزن'},
      {settingsMain:'permissions',title:'الصلاحيات',sub:'صلاحيات المستخدمين'},
      {settingsMain:'users',title:'المستخدمين',sub:'إضافة وتعديل المستخدمين'},
      {tab:'logs',title:'السجل النظامي',sub:'Audit Trail'},
      {settingsMain:'settings',settingsSub:'backup',title:'نسخ احتياطي',sub:'تصدير نسخة JSON'},
      {settingsMain:'settings',settingsSub:'backup',settingsAction:'restore',title:'استعادة بيانات',sub:'استيراد نسخة JSON'}
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
    try{var S=window.PETATOEStorage;if(S&&S.set){S.set('pet_settings_v110_main',main); if(sub)S.set('pet_settings_v110_sub',sub);}}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("navigation/navigation.js",e);}
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
  function setButtonTitleSub(btn, title, sub){ clearNode(btn); btn.appendChild(navSpan('pet-v142-title', title||'')); btn.appendChild(navSpan('pet-v142-sub', sub||'')); }
  function setToggleLabel(btn, label){ clearNode(btn); btn.appendChild(navSpan('', label||'')); btn.appendChild(navArrow()); }
  function setDirectLabel(btn, label){ clearNode(btn); btn.appendChild(navSpan('', label||'')); }
  function itemButton(it){
    var b=document.createElement('button'); b.type='button';
    if(it.tab){b.setAttribute('data-tab',it.tab);b.setAttribute('data-pet-nav-screen',it.screen||it.tab);}
    if(it.appointmentsSubTab)b.setAttribute('data-appointments-subtab',it.appointmentsSubTab);
    if(it.smartOpen)b.setAttribute('data-smart-open',it.smartOpen);
    if(it.settingsMain){b.setAttribute('data-settings-main',it.settingsMain);b.setAttribute('data-pet-nav-screen',it.screen||it.settingsMain);}
    if(it.settingsSub)b.setAttribute('data-settings-sub',it.settingsSub);
    if(it.settingsAction)b.setAttribute('data-settings-action',it.settingsAction);
    setButtonTitleSub(b, it.title||'', it.sub||'');
    return b;
  }
  function build(){
    var nav=petBlock7937_q('#nav')||petBlock7937_q('.nav'); if(!nav) return false;
    nav.id='nav'; nav.className='nav pet-v142-nav'; clearNode(nav);
    var opsWrap=document.createElement('div'); opsWrap.className='pet-v142-group'; opsWrap.setAttribute('data-group','operationManagement');
    var opsHead=document.createElement('button'); opsHead.type='button'; opsHead.className='pet-v142-toggle'; opsHead.setAttribute('data-v142-toggle','operationManagement');
    setToggleLabel(opsHead, '⚙️ إدارة التشغيل');
    var opsBody=document.createElement('div'); opsBody.className='pet-v142-items';
    opsBody.appendChild(itemButton({tab:'appointments',screen:'appointments',title:'إدارة المواعيد',sub:'تخطيط وجدولة مواعيد الجلسات'}));
    opsBody.appendChild(itemButton({tab:'vehicleOperations',screen:'vehicleOperations',title:'تشغيل السيارات',sub:'تنفيذ جلسات اليوم والتحصيل'}));
    opsBody.appendChild(itemButton({tab:'vehicleOperationsReports',screen:'vehicleOperationsReports',title:'تقارير تشغيل السيارات',sub:'تحليل التنفيذ والتحصيل والأداء'}));
    opsBody.appendChild(itemButton({tab:'operationKpis',screen:'operationKpis',title:'مؤشرات الأداء التشغيلية',sub:'KPI Dashboard للتشغيل والجودة'}));
    // PETATOE v6.4.89: expose appointments master data directly in Operation Management sidebar.
    // Safe route: still opens the existing appointments panel, then switches only its internal tab to master.
    opsBody.appendChild(itemButton({tab:'appointments',appointmentsSubTab:'master',screen:'appointments-master',title:'البيانات المرجعية ⚙️',sub:'إدارة البيانات الأساسية للمواعيد'}));
    opsWrap.appendChild(opsHead); opsWrap.appendChild(opsBody); nav.appendChild(opsWrap);
    var home=document.createElement('button'); home.type='button'; home.className='pet-v142-direct active'; home.setAttribute('data-tab','dashboard'); home.setAttribute('data-pet-nav-screen','dashboardManagement'); setDirectLabel(home, '🏠 الرئيسية');
    nav.appendChild(home);
    // PETATOE v6.1.124: sidebar-final.js rebuilds #nav at runtime, so static index.html additions are overwritten.
    // Add the Children Expenses entry to the generated v142 sidebar directly under Home.
    var childExpenses=document.createElement('button'); childExpenses.type='button'; childExpenses.className='pet-v142-direct'; childExpenses.setAttribute('data-tab','childrenExpenses'); childExpenses.setAttribute('data-pet-permission-screen','childrenExpenses'); setDirectLabel(childExpenses, '👨‍👧‍👦 مصروفات الأبناء');
    nav.appendChild(childExpenses);
    groups.forEach(function(g){
      var wrap=document.createElement('div'); wrap.className='pet-v142-group'; wrap.setAttribute('data-group',g.id);
      var head=document.createElement('button'); head.type='button'; head.className='pet-v142-toggle'; head.setAttribute('data-v142-toggle',g.id);
      setToggleLabel(head, g.label);
      var body=document.createElement('div'); body.className='pet-v142-items';
      (g.items||[]).forEach(function(it){ body.appendChild(itemButton(it)); });
      wrap.appendChild(head); wrap.appendChild(body); nav.appendChild(wrap);
    });
    bind(nav); markActive(); try{ if(window.PETATOENavigationPermissions&&window.PETATOENavigationPermissions.apply) window.PETATOENavigationPermissions.apply(nav); document.dispatchEvent(new CustomEvent('petatoe:navbuilt',{detail:{nav:nav}})); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('navigation/navigation.js',e);} return true;
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
    var sm=''; try{var S=window.PETATOEStorage;sm=(S&&S.get?S.get('pet_settings_v110_main','system'):'system')||'system'}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("navigation/navigation.js",e);}
    qa('button',nav).forEach(function(b){b.classList.remove('active')});
    var activeBtn=null, groupId='';
    if(active==='settings'){
      activeBtn=petBlock7937_q('button[data-settings-main="'+sm+'"]',nav)||petBlock7937_q('button[data-settings-main="system"]',nav);
      groupId='settings';
    }else if(active==='logs'){
      activeBtn=petBlock7937_q('button[data-tab="logs"]',nav); groupId='settings';
    }else{
      if(active==='appointments'){
        var appointmentsActiveTab='';
        try{
          var appointmentTab=petBlock7937_q('#appointments .appointments-tab.active[data-appointment-tab]');
          appointmentsActiveTab=appointmentTab?appointmentTab.getAttribute('data-appointment-tab'):'';
        }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('navigation/navigation.js',e);}
        if(appointmentsActiveTab==='master') activeBtn=petBlock7937_q('button[data-tab="appointments"][data-appointments-subtab="master"]',nav);
      }
      if(!activeBtn) activeBtn=petBlock7937_q('button[data-tab="'+active+'"]',nav);
      var grp=activeBtn&&activeBtn.closest('.pet-v142-group'); groupId=grp?grp.getAttribute('data-group'):'';
    }
    if(activeBtn) activeBtn.classList.add('active');
    // settings must stay collapsed by default on dashboard. Open only when active inside settings/logs or when user clicks.
    if(active==='dashboard') closeOpen(nav,''); else closeOpen(nav,groupId);
  }
  function force(){build();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',force); else force();
  window.addEventListener('load',function(){setTimeout(force,30); setTimeout(force,350); setTimeout(force,1400);});
  setTimeout(force,700); setTimeout(force,1800); setTimeout(force,3200);
  document.addEventListener('petatoe:tabchange',function(){setTimeout(markActive,60)});
})();