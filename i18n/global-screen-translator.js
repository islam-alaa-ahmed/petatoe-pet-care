/* PETATOE v9 - Enterprise Global English Screen Purge
   Ensures every rendered UI surface is reprocessed in English mode, including
   dynamic DOM text, attributes, shadow roots and Canvas chart labels. */
(function(){
  'use strict';
  var ARABIC_RE=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  var ATTRS=['title','aria-label','aria-description','placeholder','data-label','data-title','data-tooltip','data-original-title','alt'];
  var phrasePairs=[], phraseMap=Object.create(null), processing=false, scheduled=false, observer=null;
  var UI_GLOSSARY={
    'تقرير فواتير المبيعات':'Sales Invoice Report','ملخص الأداء':'Performance Summary','التقارير الذكية':'Smart Reports',
    'لوحة التحكم':'Dashboard','إدارة المواعيد':'Appointment Management','إدارة العملاء':'Customer Management',
    'اتجاه المبيعات الشهري':'Monthly Sales Trend','مقارنة شهر بشهر':'Month-over-Month Comparison',
    'مقارنة مخصصة بين سنتين':'Custom Two-Year Comparison','المقارنة النشطة':'Active Comparison',
    'تقرير':'Report','تقارير':'Reports','التقرير':'Report','التقارير':'Reports','الرئيسية':'Home','الرئيسيه':'Home',
    'الإعدادات':'Settings','الاعدادات':'Settings','حفظ':'Save','إلغاء':'Cancel','الغاء':'Cancel','حذف':'Delete','تعديل':'Edit',
    'إضافة':'Add','اضافة':'Add','بحث':'Search','طباعة':'Print','تصدير':'Export','تحميل':'Download','رفع':'Upload','فتح':'Open',
    'إغلاق':'Close','اغلاق':'Close','عرض':'View','المزيد':'More','عرض المزيد':'Show More','إعادة تعيين':'Reset','تحديث':'Refresh',
    'رجوع':'Back','التالي':'Next','السابق':'Previous','تأكيد':'Confirm','اختيار':'Select','تطبيق':'Apply','مسح':'Clear',
    'الكل':'All','كل السنوات':'All Years','كل الشهور':'All Months','كل السيارات':'All Vehicles','كل طرق الدفع':'All Payment Methods',
    'السنة':'Year','الشهر':'Month','اليوم':'Day','الأسبوع':'Week','الفترة':'Period','من':'From','إلى':'To','الى':'To',
    'الحالي':'Current','السابقة':'Previous','الفرق':'Difference','الإجمالي':'Total','اجمالي':'Total','إجمالي':'Total','المتوسط':'Average',
    'المبيعات':'Sales','العملاء':'Customers','العميل':'Customer','الخدمات':'Services','الخدمة':'Service','الأصناف':'Items','الصنف':'Item',
    'السيارات':'Vehicles','السيارة':'Vehicle','الفواتير':'Invoices','الفاتورة':'Invoice','العمليات':'Operations','العملية':'Operation',
    'المبلغ':'Amount','القيمة':'Value','الكمية':'Quantity','العدد':'Count','الحالة':'Status','التاريخ':'Date','الوقت':'Time',
    'الاسم':'Name','الوصف':'Description','التفاصيل':'Details','ملاحظات':'Notes','الملاحظات':'Notes','النوع':'Type','الفئة':'Category',
    'رقم الفاتورة':'Invoice Number','رقم العملية':'Transaction Number','طريقة الدفع':'Payment Method','طرق الدفع':'Payment Methods',
    'تاريخ الفاتورة':'Invoice Date','تاريخ العملية':'Transaction Date','آخر زيارة':'Last Visit','أول معاملة':'First Transaction',
    'نشط':'Active','غير نشط':'Inactive','معلق':'Pending','معتمد':'Approved','مرفوض':'Rejected','مسودة':'Draft','مدفوع':'Paid','آجل':'Credit',
    'نعم':'Yes','لا':'No','لا توجد بيانات':'No data available','لا توجد نتائج':'No results','غير محدد':'Not specified','غير معروف':'Unknown',
    'ريال سعودي':'SAR','ريال':'SAR','عملية':'operation','عميل':'customer','خدمة':'service','سيارة':'vehicle','فاتورة':'invoice',
    'صافي':'Net','الضريبة':'Tax','شامل الضريبة':'Including VAT','قبل الضريبة':'Before VAT','نسبة':'Percentage','معدل':'Rate',
    'أعلى':'Top','أقل':'Lowest','أفضل':'Best','الأفضل':'Best','الأكثر':'Most','الأقل':'Least','جديد':'New','جدد':'New',
    'يناير':'January','فبراير':'February','مارس':'March','أبريل':'April','ابريل':'April','مايو':'May','يونيو':'June',
    'يوليو':'July','أغسطس':'August','اغسطس':'August','سبتمبر':'September','أكتوبر':'October','اكتوبر':'October','نوفمبر':'November','ديسمبر':'December',
    'الأحد':'Sunday','الاحد':'Sunday','الاثنين':'Monday','الإثنين':'Monday','الثلاثاء':'Tuesday','الأربعاء':'Wednesday',
    'الاربعاء':'Wednesday','الخميس':'Thursday','الجمعة':'Friday','السبت':'Saturday',
    'يناير إلى':'January to','حتى':'through','خلال':'during','لهذا الشهر':'for this month','لهذا العام':'for this year',
    'الهدف الشهري':'Monthly Target','مبيعات الشهر':'Monthly Sales','عدد العملاء':'Customer Count','عدد العمليات':'Transaction Count'
  };
  var MONTHS={jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December',
    '01':'January','02':'February','03':'March','04':'April','05':'May','06':'June','07':'July','08':'August','09':'September','10':'October','11':'November','12':'December'};
  function language(){try{if(window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage)return window.PETATOE_I18N.getLanguage();var stored='';try{stored=window.localStorage&&localStorage.getItem('petatoe.ui.language')||'';}catch(_storage){}return stored||window.__PETATOE_INITIAL_LANGUAGE__||document.documentElement.lang||'ar';}catch(_){return document.documentElement.lang||'ar';}}
  function normalize(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function hasArabic(v){return ARABIC_RE.test(String(v||''));}
  function flatten(obj,prefix,out){out=out||{};prefix=prefix||'';if(!obj||typeof obj!=='object')return out;Object.keys(obj).forEach(function(k){var v=obj[k],path=prefix?prefix+'.'+k:k;if(typeof v==='string')out[path]=v;else if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,path,out);});return out;}
  function addPair(source,target){source=normalize(source);target=normalize(target);if(!source||!target||source===target||!hasArabic(source)||hasArabic(target))return;if(!phraseMap[source]||target.length>phraseMap[source].length)phraseMap[source]=target;}
  function buildIndex(){phraseMap=Object.create(null);try{var d=window.PETATOE_I18N_DICTIONARIES||{},ar=flatten(d.ar||{}),en=flatten(d.en||{});Object.keys(ar).forEach(function(k){if(typeof en[k]==='string')addPair(ar[k],en[k]);});}catch(_){}
    try{var s=window.PETATOE_SMART_REPORTS_TRANSLATIONS||{},sa=flatten(s.ar||{}),se=flatten(s.en||{});Object.keys(sa).forEach(function(k){if(typeof se[k]==='string')addPair(sa[k],se[k]);});}catch(_){}
    Object.keys(UI_GLOSSARY).forEach(function(k){addPair(k,UI_GLOSSARY[k]);});phrasePairs=Object.keys(phraseMap).map(function(s){return{source:s,target:phraseMap[s]};}).sort(function(a,b){return b.source.length-a.source.length;});}
  function replaceLiteral(text,source,target){return text.split(source).join(target);}
  function translateMixed(value){if(language()!=='en'||value==null)return value;var original=String(value);if(!hasArabic(original))return original;var exact=original;try{exact=window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime(original,'en'):original;}catch(_){}if(typeof exact==='string'&&exact!==original&&!hasArabic(exact))return exact;var out=original;for(var i=0;i<phrasePairs.length;i++){var pair=phrasePairs[i];if(out.indexOf(pair.source)!==-1)out=replaceLiteral(out,pair.source,pair.target);if(!hasArabic(out))break;}return out;}
  function englishMonth(value){var key=String(value==null?'':value).trim().toLowerCase();if(language()!=='en')return value;return MONTHS[key]||translateMixed(value);}
  function skip(el){if(!el||el.nodeType!==1)return true;if(el.closest&&el.closest('script,style,noscript,code,pre,#petLanguageSwitcher,[data-i18n-skip="true"],[data-i18n-ignore]'))return true;if(el.isContentEditable)return true;if(el.matches&&el.matches('textarea'))return true;return false;}
  function textNode(n){if(!n||n.nodeType!==3||!n.parentElement||skip(n.parentElement)||!hasArabic(n.nodeValue))return;var t=translateMixed(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t;}
  function attrs(el){if(!el||el.nodeType!==1||skip(el))return;ATTRS.forEach(function(a){if(!el.hasAttribute(a))return;var v=el.getAttribute(a);if(hasArabic(v)){var t=translateMixed(v);if(t!==v)el.setAttribute(a,t);}});if(el.matches&&el.matches('input[type="button"],input[type="submit"],input[type="reset"],option')){var v=el.value||el.textContent;if(hasArabic(v)){var t=translateMixed(v);if(el.tagName==='OPTION')el.textContent=t;else el.value=t;}}}
  function processRoot(root){if(language()!=='en'||!root)return;processing=true;try{if(root.nodeType===3){textNode(root);return;}if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;if(root.nodeType===1)attrs(root);var w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:function(n){if(n.nodeType===1&&skip(n))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}}),list=[];while(w.nextNode())list.push(w.currentNode);list.forEach(function(n){if(n.nodeType===3)textNode(n);else{attrs(n);if(n.shadowRoot)processRoot(n.shadowRoot);}});}finally{processing=false;}}
  function scan(){scheduled=false;if(language()!=='en')return;buildIndex();processRoot(document.body||document.documentElement);}
  function schedule(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||setTimeout)(scan);}
  function installObserver(){if(observer||!window.MutationObserver)return;observer=new MutationObserver(function(ms){if(processing||language()!=='en')return;processing=true;try{ms.forEach(function(m){if(m.type==='characterData')textNode(m.target);else if(m.type==='attributes')attrs(m.target);else Array.prototype.forEach.call(m.addedNodes||[],processRoot);});}finally{processing=false;}});observer.observe(document.body||document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS.concat(['value'])});}
  function patchCanvas(){try{var proto=window.CanvasRenderingContext2D&&window.CanvasRenderingContext2D.prototype;if(!proto||proto.__petatoeI18nPatched)return;['fillText','strokeText'].forEach(function(name){var original=proto[name];if(typeof original!=='function')return;proto[name]=function(text){var args=[].slice.call(arguments);if(language()==='en'&&hasArabic(text))args[0]=translateMixed(text);return original.apply(this,args);};});proto.__petatoeI18nPatched=true;}catch(_){} }
  function residuals(){var rows=[];if(!document.body)return rows;function inspect(root){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode()){var n=w.currentNode;if(n.parentElement&&!skip(n.parentElement)&&hasArabic(n.nodeValue))rows.push({text:normalize(n.nodeValue),element:n.parentElement.tagName,id:n.parentElement.id||'',className:String(n.parentElement.className||'')});}root.querySelectorAll&&root.querySelectorAll('*').forEach(function(el){ATTRS.forEach(function(a){var v=el.getAttribute&&el.getAttribute(a);if(hasArabic(v))rows.push({text:normalize(v),attribute:a,element:el.tagName,id:el.id||'',className:String(el.className||'')});});if(el.shadowRoot)inspect(el.shadowRoot);});}inspect(document.body);return rows;}
  function init(){buildIndex();patchCanvas();installObserver();schedule();}
  window.PETATOE_GLOBAL_SCREEN_TRANSLATOR={translate:translateMixed,monthName:englishMonth,scan:scan,rebuild:buildIndex,remainingArabic:residuals,assertEnglishClean:function(){var r=residuals();if(r.length)console.error('[PETATOE i18n] Arabic remains in English UI',r);else console.info('[PETATOE i18n] English UI is clean');return{passed:r.length===0,count:r.length,items:r};}};
  window.addEventListener('petatoe:language-changed',function(){buildIndex();patchCanvas();schedule();setTimeout(schedule,50);setTimeout(schedule,250);});document.addEventListener('petatoe:tabchange',schedule);document.addEventListener('petatoe:navbuilt',schedule);window.addEventListener('petatoe:localization-ready',function(){buildIndex();schedule();});window.addEventListener('load',function(){schedule();setTimeout(schedule,300);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
