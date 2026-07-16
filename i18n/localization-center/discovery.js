/* PETATOE v9 ELC Phase 4E - safe missing translation discovery */
(function(){
  'use strict';
  if(window.__PETATOE_ELC_DISCOVERY_PHASE4E__) return;
  window.__PETATOE_ELC_DISCOVERY_PHASE4E__=true;

  var MAX_TEXT=240;
  var IGNORE_SELECTOR=[
    '[data-i18n-ignore]','[data-localization-ignore]','[contenteditable="true"]','script','style','noscript','template','canvas','svg',
    'tbody','td','input[type="password"]','input[type="email"]','input[type="tel"]','input[type="number"]',
    '[data-record-id]','[data-customer-id]','[data-invoice-id]','[data-user-data]','.user-generated','.customer-name','.service-name','.vehicle-name',
    '.chart-container','.chartjs-tooltip','.apexcharts-canvas','.export-clone'
  ].join(',');
  var UI_SELECTOR='h1,h2,h3,h4,h5,h6,label,button,a,th,legend,summary,option,[role="button"],[role="tab"],[role="menuitem"],[data-i18n],[placeholder],[title],[aria-label]';

  function normalize(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function hasArabic(v){return /[\u0600-\u06FF]/.test(v);}
  function hasLatin(v){return /[A-Za-z]/.test(v);}
  function languageOf(v){return hasArabic(v)?'ar':hasLatin(v)?'en':null;}
  function isVisible(el){if(!el||!el.isConnected)return false;var s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;var r=el.getBoundingClientRect();return r.width>0&&r.height>0;}
  function looksLikeData(v){
    if(!v||v.length<2||v.length>MAX_TEXT)return true;
    if(/^https?:\/\//i.test(v)||/^www\./i.test(v)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return true;
    if(/^[-+]?\d[\d\s.,:/-]*$/.test(v))return true;
    var digits=(v.match(/\d/g)||[]).length;if(digits>5&&digits/Math.max(v.length,1)>.25)return true;
    if(/^[A-Z0-9_-]{8,}$/.test(v))return true;
    return !languageOf(v);
  }
  function ignored(el){return !el||!!el.closest(IGNORE_SELECTOR);}
  function screenName(){
    var active=document.querySelector('.tab-content.active,[data-tab-content].active,.settings-view.active,[aria-hidden="false"][data-screen]');
    return normalize((active&&(active.id||active.getAttribute('data-screen')||active.getAttribute('data-tab-content')))||document.body.getAttribute('data-active-tab')||location.hash.replace(/^#/,'')||'current-screen');
  }
  function moduleName(el){
    var holder=el.closest('[data-module],[data-screen],[data-tab],[id]');
    return normalize(holder&&(holder.getAttribute('data-module')||holder.getAttribute('data-screen')||holder.getAttribute('data-tab')||holder.id)||screenName()).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').slice(0,80)||'runtime';
  }
  function fnv1a(v){var h=2166136261;for(var i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36);}
  function slug(v){
    var latin=normalize(v).toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'').slice(0,52);
    return latin||'text';
  }
  function keyFor(text,module){return 'runtime.'+module+'.'+slug(text)+'.'+fnv1a(text+'|'+module);}
  function selectorHint(el){
    if(el.id)return '#'+el.id;
    var attr=el.getAttribute('data-i18n')||el.getAttribute('data-action')||el.getAttribute('name');
    return el.tagName.toLowerCase()+(attr?'['+attr.slice(0,80)+']':'');
  }
  function add(map,text,el,attribute){
    text=normalize(text);if(looksLikeData(text)||ignored(el)||!isVisible(el))return;
    var sourceLanguage=languageOf(text),module=moduleName(el),key=el.getAttribute('data-i18n')||keyFor(text,module);
    var fingerprint=sourceLanguage+'|'+module+'|'+text;
    if(map.has(fingerprint))return;
    map.set(fingerprint,{translation_key:key,source_language:sourceLanguage,source_text:text,module:module,context:{screen:screenName(),selector:selectorHint(el),attribute:attribute||'text',url_path:location.pathname}});
  }
  function scan(root){
    root=root||document;
    var map=new Map();
    root.querySelectorAll(UI_SELECTOR).forEach(function(el){
      if(ignored(el)||!isVisible(el))return;
      if(el.matches('[placeholder]'))add(map,el.getAttribute('placeholder'),el,'placeholder');
      if(el.matches('[title]'))add(map,el.getAttribute('title'),el,'title');
      if(el.matches('[aria-label]'))add(map,el.getAttribute('aria-label'),el,'aria-label');
      if(el.matches('option'))add(map,el.textContent,el,'option');
      else if(!el.matches('input,textarea,select'))add(map,el.textContent,el,'text');
    });
    return Array.from(map.values());
  }
  function localAudit(items){
    var dict=(window.PETATOE_I18N&&window.PETATOE_I18N.getDictionary&&window.PETATOE_I18N.getDictionary())||{};
    return items.filter(function(item){return !dict[item.translation_key]});
  }
  async function submit(items){
    var dash=window.PETATOELocalizationDashboard;
    if(!dash||typeof dash.registerDiscoveries!=='function')throw new Error('LOCALIZATION_DASHBOARD_API_UNAVAILABLE');
    return dash.registerDiscoveries(items);
  }
  async function scanCurrentScreen(options){
    options=options||{};
    var found=scan(options.root||document),missing=localAudit(found);
    if(options.submit===false)return {found:found.length,missing:missing.length,items:missing};
    if(!missing.length)return {found:found.length,missing:0,queued:0,items:[]};
    var result=await submit(missing);
    return Object.assign({found:found.length,missing:missing.length,items:missing},result||{});
  }
  window.PETATOE_LOCALIZATION_DISCOVERY={version:'9.0.0-elc-phase4e',scan:scan,scanCurrentScreen:scanCurrentScreen,ignoreSelector:IGNORE_SELECTOR};
  window.petatoeScanCurrentScreenTranslations=scanCurrentScreen;
})();
