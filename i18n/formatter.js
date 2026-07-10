/* PETATOE v9 Enterprise Locale Formatting Engine
   Isolated presentation formatter: no business data, Supabase, auth, or module logic. */
(function(){
  'use strict';

  var DEFAULT_LANGUAGE='ar';
  var LOCALES={ar:'ar-SA',en:'en-SA'};
  var DEFAULT_CURRENCY='SAR';
  var formatterCache=new Map();

  function normalizeLanguage(language){
    language=String(language||'').toLowerCase();
    return Object.prototype.hasOwnProperty.call(LOCALES,language)?language:DEFAULT_LANGUAGE;
  }

  function getLanguage(){
    try{
      if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.getLanguage==='function'){
        return normalizeLanguage(window.PETATOE_I18N.getLanguage());
      }
    }catch(_){}
    return normalizeLanguage(document.documentElement.getAttribute('lang')||DEFAULT_LANGUAGE);
  }

  function getLocale(language){return LOCALES[normalizeLanguage(language||getLanguage())];}

  function stableOptions(options){
    var source=options||{};
    var sorted={};
    Object.keys(source).sort().forEach(function(key){sorted[key]=source[key];});
    return sorted;
  }

  function cachedFormatter(type,language,options){
    var locale=getLocale(language);
    var normalized=stableOptions(options);
    var key=type+'|'+locale+'|'+JSON.stringify(normalized);
    if(formatterCache.has(key)) return formatterCache.get(key);
    var formatter;
    if(type==='number') formatter=new Intl.NumberFormat(locale,normalized);
    else if(type==='date') formatter=new Intl.DateTimeFormat(locale,normalized);
    else if(type==='relative') formatter=new Intl.RelativeTimeFormat(locale,normalized);
    else if(type==='list') formatter=new Intl.ListFormat(locale,normalized);
    else throw new Error('Unsupported formatter type: '+type);
    formatterCache.set(key,formatter);
    return formatter;
  }

  function toFiniteNumber(value){
    if(typeof value==='number') return Number.isFinite(value)?value:null;
    if(value===null||value===undefined||value==='') return null;
    var normalized=String(value)
      .replace(/[\u0660-\u0669]/g,function(d){return String(d.charCodeAt(0)-0x0660);})
      .replace(/[\u06F0-\u06F9]/g,function(d){return String(d.charCodeAt(0)-0x06F0);})
      .replace(/[\s,٬]/g,'')
      .replace(/٫/g,'.');
    var number=Number(normalized);
    return Number.isFinite(number)?number:null;
  }

  function toDate(value){
    if(value instanceof Date) return Number.isNaN(value.getTime())?null:value;
    if(value===null||value===undefined||value==='') return null;
    var date=new Date(value);
    return Number.isNaN(date.getTime())?null:date;
  }

  function fallback(value,fallbackValue){return fallbackValue!==undefined?fallbackValue:String(value==null?'':value);}

  function number(value,options,language){
    var parsed=toFiniteNumber(value);
    if(parsed===null) return fallback(value,options&&options.fallback);
    var intlOptions=Object.assign({maximumFractionDigits:2},options||{});
    delete intlOptions.fallback;
    try{return cachedFormatter('number',language,intlOptions).format(parsed);}catch(_){return String(parsed);}
  }

  function integer(value,options,language){
    return number(value,Object.assign({maximumFractionDigits:0,minimumFractionDigits:0},options||{}),language);
  }

  function decimal(value,digits,language){
    digits=Number.isFinite(Number(digits))?Math.max(0,Math.min(20,Number(digits))):2;
    return number(value,{minimumFractionDigits:digits,maximumFractionDigits:digits},language);
  }

  function currency(value,options,language){
    var parsed=toFiniteNumber(value);
    if(parsed===null) return fallback(value,options&&options.fallback);
    var intlOptions=Object.assign({
      style:'currency',currency:DEFAULT_CURRENCY,currencyDisplay:'symbol',
      minimumFractionDigits:2,maximumFractionDigits:2
    },options||{});
    delete intlOptions.fallback;
    try{return cachedFormatter('number',language,intlOptions).format(parsed);}catch(_){return String(parsed)+' '+(intlOptions.currency||DEFAULT_CURRENCY);}
  }

  function percent(value,options,language){
    var parsed=toFiniteNumber(value);
    if(parsed===null) return fallback(value,options&&options.fallback);
    var intlOptions=Object.assign({style:'percent',maximumFractionDigits:1},options||{});
    delete intlOptions.fallback;
    try{return cachedFormatter('number',language,intlOptions).format(parsed);}catch(_){return String(parsed*100)+'%';}
  }

  function date(value,options,language){
    var parsed=toDate(value);
    if(!parsed) return fallback(value,options&&options.fallback);
    var intlOptions=Object.assign({year:'numeric',month:'2-digit',day:'2-digit'},options||{});
    delete intlOptions.fallback;
    try{return cachedFormatter('date',language,intlOptions).format(parsed);}catch(_){return parsed.toISOString().slice(0,10);}
  }

  function time(value,options,language){
    var parsed=toDate(value);
    if(!parsed) return fallback(value,options&&options.fallback);
    var intlOptions=Object.assign({hour:'2-digit',minute:'2-digit'},options||{});
    delete intlOptions.fallback;
    try{return cachedFormatter('date',language,intlOptions).format(parsed);}catch(_){return parsed.toTimeString().slice(0,5);}
  }

  function dateTime(value,options,language){
    return date(value,Object.assign({year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'},options||{}),language);
  }

  function month(value,options,language){
    return date(value,Object.assign({month:'long',year:'numeric'},options||{}),language);
  }

  function weekday(value,options,language){
    return date(value,Object.assign({weekday:'long'},options||{}),language);
  }

  function relative(value,unit,options,language){
    var parsed=toFiniteNumber(value);
    if(parsed===null) return fallback(value,options&&options.fallback);
    var intlOptions=Object.assign({numeric:'auto'},options||{});
    delete intlOptions.fallback;
    try{return cachedFormatter('relative',language,intlOptions).format(parsed,unit||'day');}catch(_){return String(parsed)+' '+String(unit||'day');}
  }

  function list(values,options,language){
    if(!Array.isArray(values)) return '';
    try{return cachedFormatter('list',language,Object.assign({style:'long',type:'conjunction'},options||{})).format(values.map(String));}
    catch(_){return values.join(', ');}
  }

  function parseOptions(raw){
    if(!raw) return {};
    try{return JSON.parse(raw);}catch(_){return {};}
  }

  function formatByType(type,value,options,language){
    switch(String(type||'number').toLowerCase()){
      case 'integer': return integer(value,options,language);
      case 'decimal': return decimal(value,options&&options.digits,language);
      case 'currency': return currency(value,options,language);
      case 'percent': return percent(value,options,language);
      case 'date': return date(value,options,language);
      case 'time': return time(value,options,language);
      case 'datetime': return dateTime(value,options,language);
      case 'month': return month(value,options,language);
      case 'weekday': return weekday(value,options,language);
      default: return number(value,options,language);
    }
  }

  function apply(root,language){
    root=root&&root.querySelectorAll?root:document;
    language=normalizeLanguage(language||getLanguage());
    root.querySelectorAll('[data-pet-format]').forEach(function(element){
      var source=element.getAttribute('data-pet-format-value');
      if(source===null){
        source=element.dataset.petFormatSource!==undefined?element.dataset.petFormatSource:element.textContent;
        element.dataset.petFormatSource=source;
      }
      var type=element.getAttribute('data-pet-format');
      var options=parseOptions(element.getAttribute('data-pet-format-options'));
      var formatted=formatByType(type,source,options,language);
      if(element.matches('input,textarea')) element.value=formatted;
      else element.textContent=formatted;
    });
  }

  var api={
    getLanguage:getLanguage,getLocale:getLocale,toNumber:toFiniteNumber,toDate:toDate,
    number:number,integer:integer,decimal:decimal,currency:currency,percent:percent,
    date:date,time:time,dateTime:dateTime,month:month,weekday:weekday,
    relative:relative,list:list,format:formatByType,apply:apply,clearCache:function(){formatterCache.clear();}
  };

  window.PETATOE_FORMATTER=api;
  window.addEventListener('petatoe:language-changed',function(event){
    api.clearCache();
    apply(document,event&&event.detail&&event.detail.language);
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){apply(document);},{once:true});
  else apply(document);
})();
