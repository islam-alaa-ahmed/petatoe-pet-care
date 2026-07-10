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
  function normalizeTextValue(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function hashText(value){
    var str=normalizeTextValue(value);
    var h=0x811c9dc5;
    for(var i=0;i<str.length;i++){
      h^=str.charCodeAt(i);
      h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);
    }
    return 'h'+('00000000'+(h>>>0).toString(16)).slice(-8);
  }
  function legacyHashText(value){
    /* SHA-1 keys generated at build time are exposed through a browser-safe lookup map below. */
    var str=normalizeTextValue(value);
    return window.PETATOE_I18N_SHA1_KEYS&&window.PETATOE_I18N_SHA1_KEYS[str];
  }
  function phraseKeyFor(value){return legacyHashText(value)||hashText(value);}
  function translatePhraseByKey(key,lang){return getPath(getDict(lang||currentLang()),'autoPhrases.'+key);}
  var autoTextNodeKeys=new WeakMap();
  var autoAttrKeys=new WeakMap();
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

  function shouldSkipAutoI18n(node){
    if(!node) return true;
    var el=node.nodeType===1?node:node.parentElement;
    if(!el) return true;
    return !!(el.closest('script,style,noscript,code,pre,#petLanguageSwitcher')||el.closest('[data-i18n-skip="true"]'));
  }
  function translateAutoTextNodes(lang){
    lang=normalizeLang(lang||currentLang());
    if(!document.body) return;
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      if(shouldSkipAutoI18n(node)) return NodeFilter.FILTER_REJECT;
      var txt=normalizeTextValue(node.nodeValue);
      if(!txt) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      var existingKey=autoTextNodeKeys.get(node);
      var key=existingKey||phraseKeyFor(node.nodeValue);
      var value=translatePhraseByKey(key,lang);
      if(typeof value==='string'){
        autoTextNodeKeys.set(node,key);
        node.nodeValue=node.nodeValue.replace(/\S[\s\S]*\S|\S/,value);
      }
    });
  }
  function translateAutoAttributes(lang){
    lang=normalizeLang(lang||currentLang());
    if(!document.body) return;
    var attrs=['placeholder','title','aria-label','value'];
    document.querySelectorAll('input,textarea,button,select,option,[title],[aria-label]').forEach(function(el){
      if(shouldSkipAutoI18n(el)) return;
      attrs.forEach(function(attr){
        if(!el.hasAttribute||!el.hasAttribute(attr)) return;
        if(attr==='value'&&!(el.tagName==='INPUT'&&(el.type==='button'||el.type==='submit'||el.type==='reset'))) return;
        var current=el.getAttribute(attr);
        var bucket=autoAttrKeys.get(el)||{};
        var key=bucket[attr]||phraseKeyFor(current);
        var value=translatePhraseByKey(key,lang);
        if(typeof value==='string'){
          bucket[attr]=key;
          autoAttrKeys.set(el,bucket);
          el.setAttribute(attr,value);
        }
      });
    });
  }
  function translateAutoStaticPhrases(lang){
    translateAutoAttributes(lang);
    translateAutoTextNodes(lang);
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
    if(homeCards2[1]) homeCards2[1].textContent=translate('dashboard.vansComparison',lang)||homeCards2[1].textContent;
    setSidebarTexts(lang);
  }
  function setSidebarTexts(lang){
    var tabKeyMap={
      appointments:'sidebar.appointments',dashboard:'sidebar.home',childrenExpenses:'sidebar.children',
      entry:'sidebar.dataEntry',import:'sidebar.excelUpload',records:'sidebar.records',logs:'sidebar.auditLog',
      smart:'sidebar.smartReports',customer360:'sidebar.customer360',commissions:'sidebar.commissions',commissionStatement:'sidebar.commissionStatement',
      executive:'sidebar.executive',obligations:'sidebar.obligations',payroll:'sidebar.payroll',salarySlip:'sidebar.salarySlip',
      fleet:'sidebar.fleet',treasury:'sidebar.treasury',warehouses:'sidebar.warehouses',settings:'sidebar.settings'
    };
    document.querySelectorAll('#nav [data-tab]').forEach(function(el){
      if(el.hasAttribute('data-i18n')) return;
      var key=tabKeyMap[el.getAttribute('data-tab')];
      var value=key&&translate(key,lang);
      if(value) el.textContent=value;
    });
    var groupKeyMap={operations:'sidebar.transactions',analytics:'sidebar.analytics',management:'sidebar.management',system:'sidebar.system'};
    document.querySelectorAll('#nav [data-nav-group]').forEach(function(el){
      var key=groupKeyMap[el.getAttribute('data-nav-group')];
      var value=key&&translate(key,lang);
      var target=el.querySelector('span')||el;
      if(value&&!target.hasAttribute('data-i18n')) target.textContent=value;
    });
  }
  function setMenuState(open){
    var switcher=document.getElementById('petLanguageSwitcher');
    var btn=document.getElementById('petLanguageToggle');
    if(switcher) switcher.classList.toggle('open',!!open);
    if(btn) btn.setAttribute('aria-expanded',open?'true':'false');
  }
  var applying=false;
  var reapplyTimer=null;
  function reapplyLanguage(lang){
    lang=normalizeLang(lang||currentLang());
    applying=true;
    applyDataAttributes(lang);
    applyKnownStaticTexts(lang);
    translateAutoStaticPhrases(lang);
    applying=false;
  }
  function scheduleReapply(lang){
    lang=normalizeLang(lang||currentLang());
    if(reapplyTimer) clearTimeout(reapplyTimer);
    reapplyTimer=setTimeout(function(){reapplyLanguage(lang);},30);
    setTimeout(function(){reapplyLanguage(lang);},120);
    setTimeout(function(){reapplyLanguage(lang);},350);
  }
  function applyLanguage(lang){
    lang=normalizeLang(lang);
    safeStorageSet(lang);
    applying=true;
    document.documentElement.setAttribute('lang',lang);
    document.documentElement.setAttribute('dir','rtl');
    if(document.body) document.body.setAttribute('data-petatoe-lang',lang);
    document.querySelectorAll('.pet-language-option[data-pet-lang]').forEach(function(opt){
      var active=normalizeLang(opt.getAttribute('data-pet-lang'))===lang;
      opt.classList.toggle('active',active);
      opt.setAttribute('aria-selected',active?'true':'false');
    });
    setMenuState(false);
    try{ if(typeof window.renderDashboardAll==='function') window.renderDashboardAll(); }catch(_){}
    reapplyLanguage(lang);
    applying=false;
    scheduleReapply(lang);
    window.dispatchEvent(new CustomEvent('petatoe:language-changed',{detail:{language:lang}}));
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
    if(!document.documentElement.dataset.petI18nMutationBound){
      document.documentElement.dataset.petI18nMutationBound='1';
      try{
        var observer=new MutationObserver(function(mutations){
          if(applying) return;
          for(var i=0;i<mutations.length;i++){
            var t=mutations[i].target;
            if(t&&t.closest&&t.closest('#petLanguageSwitcher')) continue;
            scheduleReapply(currentLang());
            break;
          }
        });
        observer.observe(document.body||document.documentElement,{childList:true,subtree:true,characterData:true});
      }catch(_){}
    }
    applyLanguage(currentLang());
  }
  window.PETATOE_I18N={
    getLanguage:currentLang,
    setLanguage:applyLanguage,
    translate:translate,
    dictionaries:dictionaries,
    reapply:function(){scheduleReapply(currentLang());},
    apply:applyLanguage
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
