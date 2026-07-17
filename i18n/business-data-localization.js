/* PETATOE v9.0.0 - Enterprise Business Data Localization Runtime
   Localizes user-maintained master-data display names without changing canonical stored values. */
(function(){
  'use strict';
  var VERSION='9.0.0-bdl-phase1';
  var cache={signature:'',maps:null};

  function text(v){return String(v==null?'':v).trim();}
  function lang(){
    try{if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.getLanguage==='function')return text(window.PETATOE_I18N.getLanguage()).toLowerCase()||'ar';}catch(_e){}
    return text(document.documentElement.lang||'ar').toLowerCase()||'ar';
  }
  function master(){
    try{if(window.PETATOEReferenceRegistry&&typeof window.PETATOEReferenceRegistry.masterData==='function')return window.PETATOEReferenceRegistry.masterData(false)||{};}catch(_e){}
    try{if(window.PETATOEOperationsStorage&&typeof window.PETATOEOperationsStorage.readNormalizedMasterData==='function')return window.PETATOEOperationsStorage.readNormalizedMasterData()||{};}catch(_e2){}
    return {};
  }
  function rowsFor(data,type){
    if(type==='service')return Array.isArray(data.services)?data.services:[];
    if(type==='vehicle')return Array.isArray(data.cars)?data.cars:(Array.isArray(data.vehicles)?data.vehicles:[]);
    if(type==='customer')return Array.isArray(data.customers)?data.customers:[];
    return [];
  }
  function rowName(row){return text(typeof row==='string'?row:(row&&(row.name||row.title||row.label||row.vehicle||row.client)));}
  function translated(row,code){
    if(!row||typeof row!=='object')return '';
    var c=text(code).toLowerCase();
    if(c==='fil'||c==='tl')return text(row.name_fil||row.name_tl||row.display_name_fil||row.displayNameFil);
    if(c==='en')return text(row.name_en||row.display_name_en||row.displayNameEn);
    if(c==='ar')return text(row.name_ar||row.display_name_ar||row.displayNameAr);
    return text(row['name_'+c]||row['display_name_'+c]);
  }
  function build(){
    var data=master();
    var signature='';
    try{signature=JSON.stringify([data.services||[],data.cars||data.vehicles||[],data.customers||[]]);}catch(_e){signature=String(Date.now());}
    if(cache.maps&&cache.signature===signature)return cache.maps;
    var maps={service:Object.create(null),vehicle:Object.create(null),customer:Object.create(null)};
    ['service','vehicle','customer'].forEach(function(type){
      rowsFor(data,type).forEach(function(row){
        var canonical=rowName(row); if(!canonical)return;
        var item={canonical:canonical,ar:translated(row,'ar'),en:translated(row,'en'),fil:translated(row,'fil')};
        maps[type][canonical.toLowerCase()]=item;
        [item.ar,item.en,item.fil].filter(Boolean).forEach(function(alias){maps[type][alias.toLowerCase()]=item;});
      });
    });
    cache={signature:signature,maps:maps};
    return maps;
  }
  var SERVICE_EXACT_EN=Object.freeze({
    'الشاملة - كلب متوسط':'Comprehensive - Medium Dog',
    'الشاملة - قط متوسط':'Comprehensive - Medium Cat',
    'الشاملة - كلب كبير':'Comprehensive - Large Dog',
    'الشاملة - قط كبير':'Comprehensive - Large Cat',
    'السعيدة - كلب متوسط':'Happy - Medium Dog',
    'السعيدة - قط متوسط':'Happy - Medium Cat',
    'السعيدة - كلب كبير':'Happy - Large Dog',
    'السعيدة - قط كبير':'Happy - Large Cat',
    'الأساسية - كلب متوسط':'Basic - Medium Dog',
    'الأساسية - قط متوسط':'Basic - Medium Cat',
    'الأساسية - كلب كبير':'Basic - Large Dog',
    'الأساسية - قط كبير':'Basic - Large Cat',
    'قص الشعر وسط':'Medium Haircut',
    'قص الشعر متوسط':'Medium Haircut',
    'قص الشعر كبير':'Large Haircut',
    'قص الشعر صغير':'Small Haircut'
  });
  var SERVICE_TOKEN_EN=Object.freeze({
    'الشاملة':'Comprehensive','السعيدة':'Happy','الأساسية':'Basic','الاساسية':'Basic',
    'قص الشعر':'Haircut','قص':'Haircut','الشعر':'Hair','استحمام':'Bath','تنظيف':'Cleaning',
    'كلب':'Dog','قط':'Cat','كبير':'Large','متوسط':'Medium','وسط':'Medium','صغير':'Small',
    'ساسينو':'SASINO','ساس':'SAS'
  });
  var ARABIC_CHAR_LATIN={
    'ا':'a','أ':'a','إ':'i','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','ة':'a','و':'w','ؤ':'w','ي':'y','ى':'a','ئ':'y','ء':'','ـ':''
  };
  function transliterateArabic(value){
    return text(value).split('').map(function(ch){return Object.prototype.hasOwnProperty.call(ARABIC_CHAR_LATIN,ch)?ARABIC_CHAR_LATIN[ch]:ch;}).join('').replace(/\s+/g,' ').trim();
  }
  function translateServiceName(value,code){
    var original=text(value); if(!original)return original;
    var c=text(code||lang()).toLowerCase(); if(c!=='en')return original;
    if(SERVICE_EXACT_EN[original])return SERVICE_EXACT_EN[original];
    var out=original;
    Object.keys(SERVICE_TOKEN_EN).sort(function(a,b){return b.length-a.length;}).forEach(function(token){out=out.split(token).join(SERVICE_TOKEN_EN[token]);});
    out=out.replace(/\s*-\s*/g,' - ').replace(/\s+/g,' ').trim();
    if(/[\u0600-\u06FF]/.test(out))out=transliterateArabic(out);
    return out;
  }
  function resolve(type,value,code){
    var original=text(value); if(!original)return original;
    var map=build()[type]||{}; var item=map[original.toLowerCase()];
    var c=text(code||lang()).toLowerCase();
    if(!item){
      if(type==='service'&&c==='en'){var serviceValue=translateServiceName(original,c);if(serviceValue&&serviceValue!==original)return serviceValue;}
      try{
        if(c!=='ar'&&window.PETATOE_I18N&&typeof window.PETATOE_I18N.translateRuntime==='function'){
          var runtimeValue=text(window.PETATOE_I18N.translateRuntime(original));
          if(runtimeValue&&runtimeValue!==original)return runtimeValue;
        }
      }catch(_e){}
      return original;
    }
    var localized=text(c==='fil'||c==='tl'?item.fil:item[c]);
    if(localized)return localized;
    if(type==='service'&&c==='en'){var translatedService=translateServiceName(item.canonical||original,c);if(translatedService&&translatedService!==(item.canonical||original))return translatedService;}
    try{
      if(c!=='ar'&&window.PETATOE_I18N&&typeof window.PETATOE_I18N.translateRuntime==='function'){
        var fallbackValue=text(window.PETATOE_I18N.translateRuntime(item.canonical||original));
        if(fallbackValue&&fallbackValue!==(item.canonical||original))return fallbackValue;
      }
    }catch(_e2){}
    return item.canonical||original;
  }
  function canonical(type,value){
    var original=text(value); if(!original)return original;
    var item=(build()[type]||{})[original.toLowerCase()];
    return item&&item.canonical?item.canonical:original;
  }
  function localizeRecord(row,code){
    if(!row||typeof row!=='object')return row;
    var out=Object.assign({},row);
    var service=text(row.item||row.service||row.serviceName||row.product||row['الخدمة']);
    var vehicle=text(row.van||row.vehicle||row.car||row.carName||row['السيارة']);
    var customer=text(row.client||row.customer||row.customerName||row.clientName||row['العميل']||row['اسم العميل']);
    if(service){out.__serviceCanonical=service;out.item=resolve('service',service,code);if('service' in out)out.service=out.item;if('serviceName' in out)out.serviceName=out.item;}
    if(vehicle){out.__vehicleCanonical=vehicle;out.van=resolve('vehicle',vehicle,code);if('vehicle' in out)out.vehicle=out.van;if('car' in out)out.car=out.van;}
    if(customer){out.__customerCanonical=customer;out.client=resolve('customer',customer,code);if('customer' in out)out.customer=out.client;if('customerName' in out)out.customerName=out.client;}
    return out;
  }
  function invalidate(){cache={signature:'',maps:null};return true;}
  window.PETATOE_BUSINESS_DATA_I18N={version:'9.0.0-bdl-phase3',resolve:resolve,canonical:canonical,localizeRecord:localizeRecord,translateServiceName:translateServiceName,invalidate:invalidate,getLanguage:lang};
  window.businessDataT=window.businessDataT||function(type,value,code){return resolve(type,value,code);};
  ['petatoe:language-changed','petatoe:reference-registry-updated','petatoe:operations-storage-change'].forEach(function(evt){window.addEventListener(evt,function(){invalidate();try{if(window.PETATOESmartReports&&typeof window.PETATOESmartReports.clearCache==='function')window.PETATOESmartReports.clearCache('business-data-localization');}catch(_e){}try{if(typeof window.renderSmartReports==='function'&&document.getElementById('smartReportsArea'))window.renderSmartReports();}catch(_e2){}});});
})();
