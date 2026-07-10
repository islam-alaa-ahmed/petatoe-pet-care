/* PETATOE v9 Phase 2 - Language Switcher Foundation
   Scope: UI language foundation only. No data, Supabase, auth, reports, payroll, or business logic changes. */
(function(){
  'use strict';

  var STORAGE_KEY='petatoe.ui.language';
  var DEFAULT_LANG='ar';
  var SUPPORTED_LANGS=['ar','en'];

  var dictionary={
    ar:{
      app:{name:'PETATOE',subtitle:'Analytics System'},
      language:{toggleTitle:'تغيير اللغة',current:'AR',next:'EN'},
      topbar:{reports:'📑 التقارير',pdf:'📊 تقرير PDF',searchTitle:'بحث',launcherTitle:'فتح القائمة الرئيسية'},
      dashboard:{title:'Dashboard',subtitle:'لوحة متابعة مبيعات PETATOE بالريال السعودي'},
      actions:{refresh:'🔄 تحديث',exportPagePdf:'🖨️ تصدير الصفحة PDF',reset:'Reset 🔄'},
      filters:{allYears:'كل السنوات',allMonths:'كل الشهور',allVehicles:'كل السيارات',allPayments:'كل طرق الدفع'},
      payroll:{manage:'إدارة الرواتب',manageSub:'إنشاء كشوف الرواتب والاعتمادات',slip:'كشف الراتب',slipSub:'عرض كشف راتب المستخدم الحالي فقط'}
    },
    en:{
      app:{name:'PETATOE',subtitle:'Analytics System'},
      language:{toggleTitle:'Switch language',current:'EN',next:'AR'},
      topbar:{reports:'📑 Reports',pdf:'📊 PDF Report',searchTitle:'Search',launcherTitle:'Open main menu'},
      dashboard:{title:'Dashboard',subtitle:'PETATOE sales dashboard in Saudi Riyal'},
      actions:{refresh:'🔄 Refresh',exportPagePdf:'🖨️ Export Page PDF',reset:'Reset 🔄'},
      filters:{allYears:'All years',allMonths:'All months',allVehicles:'All vehicles',allPayments:'All payment methods'},
      payroll:{manage:'Payroll Management',manageSub:'Create payroll sheets and approvals',slip:'Salary Slip',slipSub:'Show salary slip for current user only'}
    }
  };

  function getPath(obj,path){
    return String(path||'').split('.').reduce(function(acc,key){return acc&&Object.prototype.hasOwnProperty.call(acc,key)?acc[key]:undefined;},obj);
  }

  function safeStorageGet(){
    try{return localStorage.getItem(STORAGE_KEY);}catch(_){return null;}
  }
  function safeStorageSet(lang){
    try{localStorage.setItem(STORAGE_KEY,lang);}catch(_){}
  }
  function normalizeLang(lang){
    lang=String(lang||'').toLowerCase();
    return SUPPORTED_LANGS.indexOf(lang)>=0?lang:DEFAULT_LANG;
  }
  function currentLang(){
    return normalizeLang(safeStorageGet()||document.documentElement.getAttribute('lang')||DEFAULT_LANG);
  }
  function setText(selector,value){
    var el=document.querySelector(selector);
    if(el&&typeof value==='string') el.textContent=value;
  }
  function setTitle(selector,value){
    var el=document.querySelector(selector);
    if(el&&typeof value==='string'){
      el.setAttribute('title',value);
      el.setAttribute('aria-label',value);
    }
  }
  function applyKnownStaticTexts(lang){
    var t=dictionary[lang]||dictionary[DEFAULT_LANG];
    setText('#sideLauncher .launch-text b',t.app.name);
    setText('#sideLauncher .launch-text small',t.app.subtitle);
    setTitle('#sideLauncher',t.topbar.launcherTitle);
    setTitle('#topbarSearch',t.topbar.searchTitle);
    setText('.pet-topbar-compact-actions .reports-btn:not(#headerPdfBtn)',t.topbar.reports);
    setText('#headerPdfBtn',t.topbar.pdf);
    setText('#petLanguageCurrent',t.language.current);
    setText('#petLanguageNext',t.language.next);
    setTitle('#petLanguageToggle',t.language.toggleTitle);
    setText('#home .section-head h2',t.dashboard.title);
    setText('#home .section-head p',t.dashboard.subtitle);
    setText('#safeDashboardPdfBtn',t.actions.exportPagePdf);
    var refresh=document.querySelector('#home .section-head [data-pet-action="dashboard-refresh"]');
    if(refresh) refresh.textContent=t.actions.refresh;
    var homeCards=document.querySelectorAll('#home .payroll-home-card');
    if(homeCards[0]){
      var h=homeCards[0].querySelector('h3'); var p=homeCards[0].querySelector('p');
      if(h) h.textContent=t.payroll.manage; if(p) p.textContent=t.payroll.manageSub;
    }
    if(homeCards[1]){
      var h2=homeCards[1].querySelector('h3'); var p2=homeCards[1].querySelector('p');
      if(h2) h2.textContent=t.payroll.slip; if(p2) p2.textContent=t.payroll.slipSub;
    }
  }
  function applyDataI18n(lang){
    var t=dictionary[lang]||dictionary[DEFAULT_LANG];
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var value=getPath(t,el.getAttribute('data-i18n'));
      if(typeof value==='string') el.textContent=value;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){
      var value=getPath(t,el.getAttribute('data-i18n-title'));
      if(typeof value==='string'){
        el.setAttribute('title',value);
        el.setAttribute('aria-label',value);
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
      var value=getPath(t,el.getAttribute('data-i18n-placeholder'));
      if(typeof value==='string') el.setAttribute('placeholder',value);
    });
  }
  function applyLanguage(lang){
    lang=normalizeLang(lang);
    safeStorageSet(lang);
    document.documentElement.setAttribute('lang',lang);
    document.documentElement.setAttribute('dir',lang==='ar'?'rtl':'ltr');
    document.body&&document.body.setAttribute('data-petatoe-lang',lang);
    var btn=document.getElementById('petLanguageToggle');
    if(btn) btn.setAttribute('aria-pressed',lang==='en'?'true':'false');
    applyKnownStaticTexts(lang);
    applyDataI18n(lang);
    window.dispatchEvent(new CustomEvent('petatoe:language-changed',{detail:{language:lang}}));
  }
  function toggleLanguage(){
    applyLanguage(currentLang()==='ar'?'en':'ar');
  }
  function init(){
    var btn=document.getElementById('petLanguageToggle');
    if(btn&&!btn.dataset.petI18nBound){
      btn.dataset.petI18nBound='1';
      btn.addEventListener('click',function(ev){ev.preventDefault();toggleLanguage();});
    }
    applyLanguage(currentLang());
  }

  window.PETATOE_I18N={
    dictionary:dictionary,
    getLanguage:currentLang,
    setLanguage:applyLanguage,
    toggleLanguage:toggleLanguage,
    translate:function(key,lang){return getPath(dictionary[normalizeLang(lang||currentLang())],key);}
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
