/* PETATOE v9 Enterprise i18n Engine
   Isolated translation runtime: no business data, no Supabase logic, no auth logic. */
(function(){
  'use strict';
  var STORAGE_KEY='petatoe.ui.language';
  var DEFAULT_LANG='ar';
  var SUPPORTED_LANGS=['ar','en'];
  var dictionaries=window.PETATOE_I18N_DICTIONARIES||{};

  function normalizeLang(lang){
    lang=String(lang||'').toLowerCase();
    return SUPPORTED_LANGS.indexOf(lang)>=0?lang:DEFAULT_LANG;
  }
  function getPath(obj,path){
    return String(path||'').split('.').reduce(function(acc,key){
      return acc&&Object.prototype.hasOwnProperty.call(acc,key)?acc[key]:undefined;
    },obj);
  }
  function safeStorageGet(){try{return localStorage.getItem(STORAGE_KEY);}catch(_){return null;}}
  function safeStorageSet(lang){try{localStorage.setItem(STORAGE_KEY,lang);}catch(_){}}
  function currentLang(){return normalizeLang(safeStorageGet()||document.documentElement.getAttribute('lang')||DEFAULT_LANG);}
  function getDict(lang){return dictionaries[normalizeLang(lang)]||dictionaries[DEFAULT_LANG]||{};}
  function translate(key,lang){return getPath(getDict(lang||currentLang()),key);}
  function setText(selector,key,lang){
    var el=document.querySelector(selector), value=translate(key,lang);
    if(el&&typeof value==='string') el.textContent=value;
  }
  function setTitle(selector,key,lang){
    var el=document.querySelector(selector), value=translate(key,lang);
    if(el&&typeof value==='string'){
      el.setAttribute('title',value);
      el.setAttribute('aria-label',value);
    }
  }
  function setPlaceholder(selector,key,lang){
    var el=document.querySelector(selector), value=translate(key,lang);
    if(el&&typeof value==='string') el.setAttribute('placeholder',value);
  }
  function setHtml(selector,key,lang){
    var el=document.querySelector(selector), value=translate(key,lang);
    if(el&&typeof value==='string') el.textContent=value;
  }
  function applyDataAttributes(lang){
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var value=translate(el.getAttribute('data-i18n'),lang);
      if(typeof value==='string') el.textContent=value;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){
      var value=translate(el.getAttribute('data-i18n-title'),lang);
      if(typeof value==='string'){
        el.setAttribute('title',value);
        el.setAttribute('aria-label',value);
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
      var value=translate(el.getAttribute('data-i18n-placeholder'),lang);
      if(typeof value==='string') el.setAttribute('placeholder',value);
    });
  }
  function applyKnownStaticTexts(lang){
    setText('#sideLauncher .launch-text b','app.name',lang);
    setText('#sideLauncher .launch-text small','app.subtitle',lang);
    setTitle('#sideLauncher','topbar.launcherTitle',lang);
    setTitle('#topbarSearch','topbar.searchTitle',lang);
    setText('.pet-topbar-compact-actions .reports-btn:not(#headerPdfBtn)','topbar.reports',lang);
    setText('#headerPdfBtn','topbar.pdf',lang);
    setTitle('#topbarNotifBtn','topbar.notifications',lang);
    setText('#petLanguageCurrent','language.button',lang);
    setTitle('#petLanguageToggle','language.toggleTitle',lang);
    setText('.pet-language-option[data-pet-lang="ar"]','language.arabic',lang);
    setText('.pet-language-option[data-pet-lang="en"]','language.english',lang);
    setPlaceholder('#globalSearchInput','globalSearch.placeholder',lang);
    setText('#globalSearchShortcut','globalSearch.shortcut',lang);
    setText('#dashboard .section-head h2','dashboard.title',lang);
    setText('#dashboard .section-head p','dashboard.subtitle',lang);
    setText('#safeDashboardPdfBtn','actions.exportPagePdf',lang);
    var refresh=document.querySelector('#dashboard .section-head [data-pet-action="dashboard-refresh"]');
    var refreshValue=translate('actions.refresh',lang); if(refresh&&refreshValue) refresh.textContent=refreshValue;
    var reset=document.querySelector('#dashboard [data-pet-action="dashboard-reset"]'); var resetValue=translate('actions.reset',lang); if(reset&&resetValue) reset.textContent=resetValue;
    var selects=[['#fYear','filters.allYears'],['#fMonth','filters.allMonths'],['#fVan','filters.allVehicles'],['#fPay','filters.allPayments']];
    selects.forEach(function(pair){
      var sel=document.querySelector(pair[0]); var value=translate(pair[1],lang);
      if(sel&&value&&sel.options&&sel.options[0]) sel.options[0].textContent=value;
    });
    var homeCards=document.querySelectorAll('#dashboard .payroll-home-card');
    if(homeCards[0]){var b=homeCards[0].querySelector('b'), s=homeCards[0].querySelector('small'); if(b)b.textContent=translate('payroll.manage',lang)||b.textContent; if(s)s.textContent=translate('payroll.manageSub',lang)||s.textContent;}
    if(homeCards[1]){var b2=homeCards[1].querySelector('b'), s2=homeCards[1].querySelector('small'); if(b2)b2.textContent=translate('payroll.slip',lang)||b2.textContent; if(s2)s2.textContent=translate('payroll.slipSub',lang)||s2.textContent;}
    setText('#dashboard .monthly-wide-card .card-title b','dashboard.monthlySales',lang);
    setText('#dashboard .dashboard-services-card .card-title b','dashboard.topServices',lang);
    setText('#dashboard .dashboard-clients-card .card-title b','dashboard.topClients',lang);
    setText('#dashboard .payment-below-card .card-title b','dashboard.paymentSales',lang);
    var homeCards2=document.querySelectorAll('#dashboard .grid[style*="margin-top:16px"] .card-title b');
    if(homeCards2[1]) homeCards2[1].textContent=translate('vansComparison',lang)||homeCards2[1].textContent;
    setSidebarTexts(lang);
  }
  function setSidebarTexts(lang){
    var labels=[
      ['operations','sidebar.operations'],['الرئيسية','sidebar.home'],['مصروفات الأبناء','sidebar.children'],['العمليات','sidebar.transactions'],['التحليلات','sidebar.analytics'],['الإدارة','sidebar.management'],['الإعدادات والصلاحيات','sidebar.settings']
    ];
    document.querySelectorAll('.sidebar button,.side-menu button,.nav button,.menu button,.sidebar .nav-item').forEach(function(el){
      labels.forEach(function(pair){
        if((el.textContent||'').indexOf(pair[0])>-1){
          var value=translate(pair[1],lang); if(value) el.textContent=value;
        }
      });
    });
    setText('#petCardTagline','sidebar.tagline',lang);
  }
  function setMenuState(open){
    var switcher=document.getElementById('petLanguageSwitcher');
    var btn=document.getElementById('petLanguageToggle');
    if(switcher) switcher.classList.toggle('open',!!open);
    if(btn) btn.setAttribute('aria-expanded',open?'true':'false');
  }
  function applyLanguage(lang){
    lang=normalizeLang(lang);
    safeStorageSet(lang);
    document.documentElement.setAttribute('lang',lang);
    document.documentElement.setAttribute('dir','rtl');
    if(document.body) document.body.setAttribute('data-petatoe-lang',lang);
    document.querySelectorAll('.pet-language-option[data-pet-lang]').forEach(function(opt){
      var active=normalizeLang(opt.getAttribute('data-pet-lang'))===lang;
      opt.classList.toggle('active',active);
      opt.setAttribute('aria-selected',active?'true':'false');
    });
    setMenuState(false);
    applyDataAttributes(lang);
    applyKnownStaticTexts(lang);
    window.dispatchEvent(new CustomEvent('petatoe:language-changed',{detail:{language:lang}}));
    try{ if(typeof window.renderDashboardAll==='function') window.renderDashboardAll(); }catch(_){}
  }
  function init(){
    var btn=document.getElementById('petLanguageToggle');
    if(btn&&!btn.dataset.petI18nBound){
      btn.dataset.petI18nBound='1';
      btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();var sw=document.getElementById('petLanguageSwitcher');setMenuState(!(sw&&sw.classList.contains('open')));});
    }
    document.querySelectorAll('.pet-language-option[data-pet-lang]').forEach(function(opt){
      if(!opt.dataset.petI18nBound){
        opt.dataset.petI18nBound='1';
        opt.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();applyLanguage(opt.getAttribute('data-pet-lang'));});
      }
    });
    if(!document.documentElement.dataset.petI18nOutsideBound){
      document.documentElement.dataset.petI18nOutsideBound='1';
      document.addEventListener('click',function(ev){var sw=document.getElementById('petLanguageSwitcher');if(sw&&!sw.contains(ev.target)) setMenuState(false);});
      document.addEventListener('keydown',function(ev){if(ev.key==='Escape') setMenuState(false);});
    }
    applyLanguage(currentLang());
  }
  window.PETATOE_I18N={
    getLanguage:currentLang,
    setLanguage:applyLanguage,
    translate:translate,
    dictionaries:dictionaries,
    apply:applyLanguage
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
