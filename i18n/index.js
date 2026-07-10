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
  function currentLang(){return normalizeLang(safeStorageGet()||window.__PETATOE_INITIAL_LANGUAGE__||document.documentElement.getAttribute('lang')||DEFAULT_LANG);}
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
  function interpolate(value,params){
    var out=String(value||'');
    params=params||{};
    Object.keys(params).forEach(function(k){out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});
    return out;
  }
  function translateRuntimeByKey(key,lang){return getPath(getDict(lang||currentLang()),'runtimePhrases.'+key);}
  function getRuntimeTemplates(lang){return getPath(getDict(lang||currentLang()),'runtimeTemplates')||{};}
  function translateRuntimeValue(value,lang){
    if(value===undefined||value===null) return value;
    lang=normalizeLang(lang||currentLang());
    var text=String(value);
    var key=phraseKeyFor(text);
    var exact=translateRuntimeByKey(key,lang)||translatePhraseByKey(key,lang);
    if(typeof exact==='string') return exact;
    var sourceTemplates=getRuntimeTemplates(DEFAULT_LANG);
    var targetTemplates=getRuntimeTemplates(lang);
    for(var k in sourceTemplates){
      if(!Object.prototype.hasOwnProperty.call(sourceTemplates,k)) continue;
      var source=sourceTemplates[k]&&sourceTemplates[k].source;
      var mode=sourceTemplates[k]&&sourceTemplates[k].mode||'prefix';
      if(typeof source!=='string') continue;
      if((mode==='exact'&&text===source)||(mode!=='exact'&&text.indexOf(source)===0)){
        var target=targetTemplates&&targetTemplates[k]&&targetTemplates[k].target;
        if(typeof target==='string') return interpolate(target,{rest:mode==='exact'?'':text.slice(source.length)});
      }
    }
    return value;
  }
  function patchRuntimeTextAPIs(){
    if(!window.__PETATOE_I18N_ORIGINAL_ALERT__&&typeof window.alert==='function'){
      window.__PETATOE_I18N_ORIGINAL_ALERT__=window.alert;
      window.alert=function(message){return window.__PETATOE_I18N_ORIGINAL_ALERT__.call(window,translateRuntimeValue(message));};
    }
    if(!window.__PETATOE_I18N_ORIGINAL_CONFIRM__&&typeof window.confirm==='function'){
      window.__PETATOE_I18N_ORIGINAL_CONFIRM__=window.confirm;
      window.confirm=function(message){return window.__PETATOE_I18N_ORIGINAL_CONFIRM__.call(window,translateRuntimeValue(message));};
    }
    if(!window.__PETATOE_I18N_ORIGINAL_PROMPT__&&typeof window.prompt==='function'){
      window.__PETATOE_I18N_ORIGINAL_PROMPT__=window.prompt;
      window.prompt=function(message,def){return window.__PETATOE_I18N_ORIGINAL_PROMPT__.call(window,translateRuntimeValue(message),def);};
    }
    ['toast','toastSafe','notify'].forEach(function(name){
      var fn=window[name];
      if(typeof fn==='function'&&!fn.__petatoeI18nWrapped){
        var wrapped=function(message){
          var args=Array.prototype.slice.call(arguments);
          if(args.length) args[0]=translateRuntimeValue(args[0]);
          return fn.apply(this,args);
        };
        wrapped.__petatoeI18nWrapped=true;
        wrapped.__petatoeI18nOriginal=fn;
        try{window[name]=wrapped;}catch(_){}
      }
    });
  }
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
  function translateAutoTextNodes(lang,root){
    lang=normalizeLang(lang||currentLang());
    root=root&&root.nodeType?root:document.body;
    if(!root) return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
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
  function translateAutoAttributes(lang,root){
    lang=normalizeLang(lang||currentLang());
    root=root&&root.nodeType?root:document.body;
    if(!root) return;
    var attrs=['placeholder','title','aria-label','value'];
    var elements=[];
    if(root.nodeType===1&&root.matches&&root.matches('input,textarea,button,select,option,[title],[aria-label]')) elements.push(root);
    if(root.querySelectorAll) elements=elements.concat(Array.prototype.slice.call(root.querySelectorAll('input,textarea,button,select,option,[title],[aria-label]')));
    elements.forEach(function(el){
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
  function translateAutoStaticPhrases(lang,root){
    translateAutoAttributes(lang,root);
    translateAutoTextNodes(lang,root);
  }

  function selectWithin(root,selector){
    root=root&&root.nodeType?root:document;
    var out=[];
    if(root.nodeType===1&&root.matches&&root.matches(selector)) out.push(root);
    if(root.querySelectorAll) out=out.concat(Array.prototype.slice.call(root.querySelectorAll(selector)));
    return out;
  }
  function applyDataAttributes(lang,root){
    selectWithin(root,'[data-i18n]').forEach(function(el){
      var value=translate(el.getAttribute('data-i18n'),lang);
      if(typeof value==='string') el.textContent=value;
    });
    selectWithin(root,'[data-i18n-title]').forEach(function(el){
      var value=translate(el.getAttribute('data-i18n-title'),lang);
      if(typeof value==='string'){
        el.setAttribute('title',value);
        el.setAttribute('aria-label',value);
      }
    });
    selectWithin(root,'[data-i18n-placeholder]').forEach(function(el){
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
      if(el.hasAttribute('data-i18n')||el.querySelector('[data-i18n]')) return;
      var key=tabKeyMap[el.getAttribute('data-tab')];
      var value=key&&translate(key,lang);
      if(value) el.textContent=value;
    });
    var groupKeyMap={operationManagement:'sidebar.operations',operations:'sidebar.transactions',analytics:'sidebar.analytics',management:'sidebar.management',settings:'sidebar.system',system:'sidebar.system'};
    document.querySelectorAll('#nav [data-nav-group],#nav [data-v142-toggle]').forEach(function(el){
      var key=groupKeyMap[el.getAttribute('data-nav-group')||el.getAttribute('data-v142-toggle')];
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
  function isInsideI18nScope(node){
    var el=node&&node.nodeType===1?node:(node&&node.parentElement);
    if(!el||!el.closest) return false;
    return !!el.closest('[data-i18n],[data-i18n-title],[data-i18n-placeholder],#nav,#dashboard,.toast,#toast');
  }
  function reapplyLanguage(lang){
    lang=normalizeLang(lang||currentLang());
    patchRuntimeTextAPIs();
    applying=true;
    applyDataAttributes(lang);
    applyKnownStaticTexts(lang);
    translateAutoStaticPhrases(lang);
    applying=false;
  }
  function translateAddedSubtree(root,lang){
    if(!root||!root.nodeType) return;
    lang=normalizeLang(lang||currentLang());
    patchRuntimeTextAPIs();
    applying=true;
    try{
      applyDataAttributes(lang,root);
      translateAutoStaticPhrases(lang,root);
      if(root.nodeType===1&&(root.id==='nav'||root.closest&&root.closest('#nav'))) setSidebarTexts(lang);
    }finally{
      applying=false;
    }
  }
  function scheduleReapply(lang,delay){
    lang=normalizeLang(lang||currentLang());
    if(reapplyTimer) clearTimeout(reapplyTimer);
    reapplyTimer=setTimeout(function(){reapplyTimer=null;reapplyLanguage(lang);},typeof delay==='number'?delay:80);
  }
  function setNavigationReady(ready){
    document.documentElement.setAttribute('data-pet-i18n-nav-ready',ready?'true':'false');
  }
  function finishInitialPaint(){
    if(window.__PETATOE_I18N_BOOT_FAILSAFE__){clearTimeout(window.__PETATOE_I18N_BOOT_FAILSAFE__);window.__PETATOE_I18N_BOOT_FAILSAFE__=null;}
    document.documentElement.removeAttribute('data-pet-i18n-booting');
    document.documentElement.setAttribute('data-pet-i18n-ready','true');
  }
  function applyLanguage(lang,options){
    lang=normalizeLang(lang);
    options=options||{};
    safeStorageSet(lang);
    setNavigationReady(false);
    applying=true;
    if(window.PETATOE_DIRECTION&&typeof window.PETATOE_DIRECTION.apply==='function'){
      window.PETATOE_DIRECTION.apply(lang,{silent:true});
    }else{
      var fallbackDir=lang==='ar'?'rtl':'ltr';
      document.documentElement.setAttribute('lang',lang);
      document.documentElement.setAttribute('dir',fallbackDir);
      document.documentElement.setAttribute('data-layout-dir',fallbackDir);
      if(document.body){document.body.setAttribute('dir',fallbackDir);document.body.setAttribute('data-layout-dir',fallbackDir);document.body.setAttribute('data-petatoe-lang',lang);}
    }
    document.querySelectorAll('.pet-language-option[data-pet-lang]').forEach(function(opt){
      var active=normalizeLang(opt.getAttribute('data-pet-lang'))===lang;
      opt.classList.toggle('active',active);
      opt.setAttribute('aria-selected',active?'true':'false');
    });
    setMenuState(false);
    applying=false;
    if(options.renderDashboard){try{ if(typeof window.renderDashboardAll==='function') window.renderDashboardAll(); }catch(_){}}
    try{
      reapplyLanguage(lang);
    }finally{
      setNavigationReady(true);
      finishInitialPaint();
    }
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
        opt.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();applyLanguage(opt.getAttribute('data-pet-lang'),{renderDashboard:false});});
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
        var pendingRoots=[];
        var pendingFrame=0;
        function flushAddedRoots(){
          pendingFrame=0;
          if(applying||!pendingRoots.length) return;
          var roots=pendingRoots.splice(0,pendingRoots.length);
          roots.forEach(function(root){
            if(root&&root.nodeType===1&&!root.closest('#petLanguageSwitcher')) translateAddedSubtree(root,currentLang());
          });
        }
        var observer=new MutationObserver(function(mutations){
          if(applying) return;
          mutations.forEach(function(mutation){
            Array.prototype.forEach.call(mutation.addedNodes||[],function(node){
              if(node&&node.nodeType===1) pendingRoots.push(node);
            });
          });
          if(pendingRoots.length&&!pendingFrame) pendingFrame=requestAnimationFrame(flushAddedRoots);
        });
        observer.observe(document.body||document.documentElement,{childList:true,subtree:true});
      }catch(_){}
    }
    applyLanguage(currentLang(),{renderDashboard:false});
  }

  document.addEventListener('petatoe:navbuilt',function(){
    try{
      reapplyLanguage(currentLang());
    }finally{
      setNavigationReady(true);
    }
  });
  document.addEventListener('petatoe:tabchange',function(){scheduleReapply(currentLang(),90);});
  window.PETATOE_I18N={
    getLanguage:currentLang,
    setLanguage:applyLanguage,
    translate:translate,
    translateRuntime:translateRuntimeValue,
    t:function(key,params,lang){var v=translate(key,lang);return typeof v==='string'?interpolate(v,params):v;},
    dictionaries:dictionaries,
    format:window.PETATOE_FORMATTER||null,
    direction:window.PETATOE_DIRECTION||null,
    reapply:function(){scheduleReapply(currentLang());},
    apply:applyLanguage,
    applySubtree:function(root){translateAddedSubtree(root,currentLang());}
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
