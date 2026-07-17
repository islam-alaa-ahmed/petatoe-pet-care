/* PETATOE v9.0.0 - Enterprise Business Data Localization Runtime
   Localizes user-maintained master-data display names without changing canonical stored values. */
(function(){
  'use strict';
  var VERSION='9.1.7-enterprise-business-localization-pack2';
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

  var STATIC_BUSINESS_EN=Object.freeze({
    payment:Object.freeze({
      'كاش':'Cash','نقدي':'Cash','نقدًا':'Cash','نقدا':'Cash','مدى':'Mada','شبكة':'Card / POS',
      'تحويل':'Bank Transfer','تحويل بنكي':'Bank Transfer','آجل':'Credit','غير محدد':'Unspecified'
    }),
    customerStatus:Object.freeze({
      'نشط':'Active','غير نشط':'Inactive','مفقود':'Lost','عميل جديد':'New Customer','جديد':'New',
      'مؤكد':'Confirmed','ملغي':'Cancelled','مكتمل':'Completed','قيد التنفيذ':'In Progress','غير محدد':'Unspecified'
    }),
    appointmentStatus:Object.freeze({
      'مؤكد':'Confirmed','ملغي':'Cancelled','مكتمل':'Completed','قيد التنفيذ':'In Progress','جديد':'New','غير محدد':'Unspecified'
    }),
    vehicleStatus:Object.freeze({
      'نشط':'Active','جاهز':'Ready','متوقف':'Stopped','متوقفة':'Stopped','في الصيانة':'In Maintenance','صيانة':'Maintenance','غير محدد':'Unspecified'
    }),
    vehicleType:Object.freeze({
      'سيارة':'Vehicle','فان':'Van','شاحنة':'Truck','سيارة خدمة':'Service Vehicle','غير محدد':'Unspecified'
    }),
    customerCategory:Object.freeze({
      'VIP':'VIP','كبار العملاء':'VIP','عادي':'Regular','منتظم':'Regular','عميل جديد':'New Customer','جديد':'New',
      'نشط':'Active','غير نشط':'Inactive','مفقود':'Lost','متنامي':'Growing','نمو':'Growing','متراجع':'Declining','تراجع':'Declining','غير محدد':'Unspecified'
    }),
    generic:Object.freeze({'غير محدد':'Unspecified'})
  });
  function hasArabic(value){return /[\u0600-\u06FF]/.test(String(value==null?'':value));}
  function recordMissing(type,original,fallback){
    var rows=window.PETATOE_BUSINESS_I18N_MISSING=window.PETATOE_BUSINESS_I18N_MISSING||{};
    var key=String(type||'generic')+'|'+String(original||'');
    rows[key]={type:type||'generic',source:String(original||''),fallback:String(fallback||''),lastSeenAt:new Date().toISOString()};
  }
  function safeEnglishFallback(type,original){
    if(!hasArabic(original))return original;
    var fallback=transliterateArabic(original)||'Untranslated';
    recordMissing(type,original,fallback);
    return fallback;
  }
  function staticBusinessValue(type,value,code){
    var original=text(value),c=text(code||lang()).toLowerCase();
    if(!original||c==='ar')return original;
    var group=STATIC_BUSINESS_EN[type]||STATIC_BUSINESS_EN.generic;
    return group&&group[original]?group[original]:original;
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
      var staticValue=staticBusinessValue(type,original,c);
      if(staticValue!==original)return staticValue;
      if(type==='service'&&c==='en'){var serviceValue=translateServiceName(original,c);if(serviceValue&&serviceValue!==original)return serviceValue;}
      try{
        if(c!=='ar'&&window.PETATOE_I18N&&typeof window.PETATOE_I18N.translateRuntime==='function'){
          var runtimeValue=text(window.PETATOE_I18N.translateRuntime(original));
          if(runtimeValue&&runtimeValue!==original)return runtimeValue;
        }
      }catch(_e){}
      return c==='en'?safeEnglishFallback(type,original):original;
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
    var canonicalValue=item.canonical||original;
    return c==='en'?safeEnglishFallback(type,canonicalValue):canonicalValue;
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
    var payment=text(row.pay||row.payment||row.paymentMethod||row.payment_method||row['طريقة الدفع']);
    var customerStatus=text(row.customerStatus||row.customer_status||row.status||row['الحالة']);
    var appointmentStatus=text(row.appointmentStatus||row.appointment_status||row.bookingStatus||row.booking_status);
    var vehicleStatus=text(row.vehicleStatus||row.vehicle_status||row.carStatus||row.car_status);
    var vehicleType=text(row.vehicleType||row.vehicle_type||row.carType||row.car_type);
    var customerCategory=text(row.customerCategory||row.customer_category||row.clientCategory||row.client_category||row.segment||row.classification);
    if(service){out.__serviceCanonical=service;out.item=resolve('service',service,code);if('service' in out)out.service=out.item;if('serviceName' in out)out.serviceName=out.item;}
    if(vehicle){out.__vehicleCanonical=vehicle;out.van=resolve('vehicle',vehicle,code);if('vehicle' in out)out.vehicle=out.van;if('car' in out)out.car=out.van;}
    if(customer){out.__customerCanonical=customer;out.client=resolve('customer',customer,code);if('customer' in out)out.customer=out.client;if('customerName' in out)out.customerName=out.client;}
    if(payment){out.__paymentCanonical=payment;out.pay=resolve('payment',payment,code);if('payment' in out)out.payment=out.pay;if('paymentMethod' in out)out.paymentMethod=out.pay;if('payment_method' in out)out.payment_method=out.pay;}
    if(customerStatus){out.__statusCanonical=customerStatus;var localizedStatus=resolve('customerStatus',customerStatus,code);if('customerStatus' in out)out.customerStatus=localizedStatus;if('customer_status' in out)out.customer_status=localizedStatus;if('status' in out)out.status=localizedStatus;}
    if(appointmentStatus){out.__appointmentStatusCanonical=appointmentStatus;var localizedAppointmentStatus=resolve('appointmentStatus',appointmentStatus,code);if('appointmentStatus' in out)out.appointmentStatus=localizedAppointmentStatus;if('appointment_status' in out)out.appointment_status=localizedAppointmentStatus;if('bookingStatus' in out)out.bookingStatus=localizedAppointmentStatus;if('booking_status' in out)out.booking_status=localizedAppointmentStatus;}
    if(vehicleStatus){out.__vehicleStatusCanonical=vehicleStatus;var localizedVehicleStatus=resolve('vehicleStatus',vehicleStatus,code);if('vehicleStatus' in out)out.vehicleStatus=localizedVehicleStatus;if('vehicle_status' in out)out.vehicle_status=localizedVehicleStatus;if('carStatus' in out)out.carStatus=localizedVehicleStatus;if('car_status' in out)out.car_status=localizedVehicleStatus;}
    if(vehicleType){out.__vehicleTypeCanonical=vehicleType;var localizedVehicleType=resolve('vehicleType',vehicleType,code);if('vehicleType' in out)out.vehicleType=localizedVehicleType;if('vehicle_type' in out)out.vehicle_type=localizedVehicleType;if('carType' in out)out.carType=localizedVehicleType;if('car_type' in out)out.car_type=localizedVehicleType;}
    if(customerCategory){out.__customerCategoryCanonical=customerCategory;var localizedCustomerCategory=resolve('customerCategory',customerCategory,code);if('customerCategory' in out)out.customerCategory=localizedCustomerCategory;if('customer_category' in out)out.customer_category=localizedCustomerCategory;if('clientCategory' in out)out.clientCategory=localizedCustomerCategory;if('client_category' in out)out.client_category=localizedCustomerCategory;if('segment' in out)out.segment=localizedCustomerCategory;if('classification' in out)out.classification=localizedCustomerCategory;}
    return out;
  }
  function render(type,value,code){return resolve(type,value,code);}
  function renderRecord(row,code){return localizeRecord(row,code);}
  function renderList(type,values,code){return (Array.isArray(values)?values:[]).map(function(value){return resolve(type,value,code);});}
  function invalidate(){cache={signature:'',maps:null};return true;}
  window.PETATOE_BUSINESS_DATA_I18N={version:VERSION,resolve:resolve,canonical:canonical,localizeRecord:localizeRecord,render:render,renderRecord:renderRecord,renderList:renderList,translateServiceName:translateServiceName,invalidate:invalidate,getLanguage:lang};
  ['petatoe:language-changed','petatoe:reference-registry-updated','petatoe:operations-storage-change'].forEach(function(evt){window.addEventListener(evt,function(){invalidate();try{if(window.PETATOESmartReports&&typeof window.PETATOESmartReports.clearCache==='function')window.PETATOESmartReports.clearCache('business-data-localization');}catch(_e){}try{if(typeof window.renderSmartReports==='function'&&document.getElementById('smartReportsArea'))window.renderSmartReports();}catch(_e2){}});});
})();
