/* PETATOE v9 - Global Screen Translator
   Final English-screen purge: translates mixed/dynamic UI text at DOM runtime.
   It does not change business calculations, stored data, Supabase, or authentication. */
(function(){
  'use strict';

  var ARABIC_RE=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  var ATTRS=['title','aria-label','placeholder','data-label','data-title','alt'];
  var phrasePairs=[];
  var phraseMap=Object.create(null);
  var processing=false;
  var scheduled=false;
  var observer=null;

  var UI_GLOSSARY={
    'تقرير':'Report','تقارير':'Reports','التقرير':'Report','التقارير':'Reports',
    'الرئيسية':'Home','الرئيسيه':'Home','الإعدادات':'Settings','الاعدادات':'Settings',
    'حفظ':'Save','إلغاء':'Cancel','الغاء':'Cancel','حذف':'Delete','تعديل':'Edit','إضافة':'Add','اضافة':'Add',
    'بحث':'Search','طباعة':'Print','تصدير':'Export','تحميل':'Download','رفع':'Upload','فتح':'Open','إغلاق':'Close','اغلاق':'Close',
    'عرض':'View','المزيد':'More','عرض المزيد':'Show More','إعادة تعيين':'Reset','تحديث':'Refresh',
    'الكل':'All','كل السنوات':'All Years','كل الشهور':'All Months','كل السيارات':'All Vehicles','كل طرق الدفع':'All Payment Methods',
    'السنة':'Year','الشهر':'Month','اليوم':'Day','الفترة':'Period','من':'From','إلى':'To','الى':'To',
    'الحالي':'Current','السابق':'Previous','الفرق':'Difference','الإجمالي':'Total','اجمالي':'Total','إجمالي':'Total',
    'المبيعات':'Sales','العملاء':'Customers','العميل':'Customer','الخدمات':'Services','الخدمة':'Service',
    'السيارات':'Vehicles','السيارة':'Vehicle','الفواتير':'Invoices','الفاتورة':'Invoice','العمليات':'Operations','العملية':'Operation',
    'المبلغ':'Amount','القيمة':'Value','الكمية':'Quantity','العدد':'Count','الحالة':'Status','التاريخ':'Date','الوقت':'Time',
    'الاسم':'Name','الوصف':'Description','التفاصيل':'Details','ملاحظات':'Notes','الملاحظات':'Notes',
    'رقم الفاتورة':'Invoice Number','طريقة الدفع':'Payment Method','طرق الدفع':'Payment Methods',
    'نشط':'Active','غير نشط':'Inactive','معلق':'Pending','معتمد':'Approved','مرفوض':'Rejected','مسودة':'Draft',
    'نعم':'Yes','لا':'No','لا توجد بيانات':'No data available','غير محدد':'Not specified',
    'ريال سعودي':'SAR','ريال':'SAR','عملية':'operation','عميل':'customer','خدمة':'service','سيارة':'vehicle','فاتورة':'invoice',
    'يناير':'January','فبراير':'February','مارس':'March','أبريل':'April','ابريل':'April','مايو':'May','يونيو':'June',
    'يوليو':'July','أغسطس':'August','اغسطس':'August','سبتمبر':'September','أكتوبر':'October','اكتوبر':'October','نوفمبر':'November','ديسمبر':'December',
    'الأحد':'Sunday','الاحد':'Sunday','الاثنين':'Monday','الثلاثاء':'Tuesday','الأربعاء':'Wednesday','الاربعاء':'Wednesday','الخميس':'Thursday','الجمعة':'Friday','السبت':'Saturday'
  };

  function language(){
    try{return window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage?window.PETATOE_I18N.getLanguage():(document.documentElement.lang||'ar');}
    catch(_){return document.documentElement.lang||'ar';}
  }
  function normalize(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function hasArabic(value){return ARABIC_RE.test(String(value||''));}
  function flatten(obj,prefix,out){
    out=out||{}; prefix=prefix||'';
    if(!obj||typeof obj!=='object') return out;
    Object.keys(obj).forEach(function(key){
      var value=obj[key], path=prefix?prefix+'.'+key:key;
      if(typeof value==='string') out[path]=value;
      else if(value&&typeof value==='object'&&!Array.isArray(value)) flatten(value,path,out);
    });
    return out;
  }
  function addPair(source,target){
    source=normalize(source); target=normalize(target);
    if(!source||!target||source===target||!hasArabic(source)||hasArabic(target)) return;
    if(!phraseMap[source]||target.length>phraseMap[source].length) phraseMap[source]=target;
  }
  function buildIndex(){
    phraseMap=Object.create(null);
    try{
      var dicts=window.PETATOE_I18N_DICTIONARIES||{};
      var ar=flatten(dicts.ar||{}), en=flatten(dicts.en||{});
      Object.keys(ar).forEach(function(k){if(typeof en[k]==='string') addPair(ar[k],en[k]);});
    }catch(_){}
    try{
      var smart=window.PETATOE_SMART_REPORTS_TRANSLATIONS||{};
      var sar=smart.ar||{}, sen=smart.en||{};
      Object.keys(sar).forEach(function(k){if(typeof sen[k]==='string') addPair(sar[k],sen[k]);});
    }catch(_){}
    Object.keys(UI_GLOSSARY).forEach(function(k){addPair(k,UI_GLOSSARY[k]);});
    phrasePairs=Object.keys(phraseMap).map(function(source){return {source:source,target:phraseMap[source]};})
      .sort(function(a,b){return b.source.length-a.source.length;});
  }
  function replaceAllLiteral(text,source,target){return text.split(source).join(target);}
  function translateMixed(value){
    if(language()!=='en'||value==null) return value;
    var original=String(value);
    if(!hasArabic(original)) return original;
    var exact;
    try{exact=window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime(original,'en'):original;}catch(_){exact=original;}
    if(typeof exact==='string'&&exact!==original&&!hasArabic(exact)) return exact;
    var out=original;
    for(var i=0;i<phrasePairs.length;i++){
      var pair=phrasePairs[i];
      if(out.indexOf(pair.source)!==-1) out=replaceAllLiteral(out,pair.source,pair.target);
      if(!hasArabic(out)) break;
    }
    return out;
  }
  function skipElement(el){
    if(!el||el.nodeType!==1) return true;
    if(el.closest('script,style,noscript,code,pre,#petLanguageSwitcher,[data-i18n-skip="true"],[data-i18n-ignore]')) return true;
    if(el.isContentEditable) return true;
    if(el.matches('input:not([type="button"]):not([type="submit"]):not([type="reset"]),textarea')) return true;
    return false;
  }
  function translateTextNode(node){
    if(!node||node.nodeType!==3||!node.parentElement||skipElement(node.parentElement)) return;
    var value=node.nodeValue;
    if(!hasArabic(value)) return;
    var translated=translateMixed(value);
    if(translated!==value) node.nodeValue=translated;
  }
  function translateElementAttributes(el){
    if(!el||el.nodeType!==1||skipElement(el)) return;
    ATTRS.forEach(function(attr){
      if(!el.hasAttribute(attr)) return;
      var value=el.getAttribute(attr);
      if(!hasArabic(value)) return;
      var translated=translateMixed(value);
      if(translated!==value) el.setAttribute(attr,translated);
    });
    if(el.matches('input[type="button"],input[type="submit"],input[type="reset"]')){
      var v=el.value;
      if(hasArabic(v)){var tv=translateMixed(v);if(tv!==v) el.value=tv;}
    }
  }
  function processRoot(root){
    if(language()!=='en'||!root) return;
    processing=true;
    try{
      if(root.nodeType===3){translateTextNode(root);return;}
      if(root.nodeType!==1&&root.nodeType!==9) return;
      if(root.nodeType===1) translateElementAttributes(root);
      var walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:function(node){
        if(node.nodeType===1&&skipElement(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }});
      var list=[]; while(walker.nextNode()) list.push(walker.currentNode);
      list.forEach(function(node){if(node.nodeType===3) translateTextNode(node); else translateElementAttributes(node);});
    }finally{processing=false;}
  }
  function scan(){
    scheduled=false;
    if(language()!=='en') return;
    buildIndex();
    processRoot(document.body||document.documentElement);
  }
  function schedule(){if(scheduled)return;scheduled=true;(window.requestAnimationFrame||setTimeout)(scan);}
  function installObserver(){
    if(observer||!window.MutationObserver) return;
    observer=new MutationObserver(function(mutations){
      if(processing||language()!=='en') return;
      processing=true;
      try{
        mutations.forEach(function(m){
          if(m.type==='characterData') translateTextNode(m.target);
          else if(m.type==='attributes') translateElementAttributes(m.target);
          else Array.prototype.forEach.call(m.addedNodes||[],function(n){processRoot(n);});
        });
      }finally{processing=false;}
    });
    observer.observe(document.body||document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS.concat(['value'])});
  }
  function init(){buildIndex();installObserver();schedule();}

  window.PETATOE_GLOBAL_SCREEN_TRANSLATOR={
    translate:translateMixed,
    scan:scan,
    rebuild:buildIndex,
    remainingArabic:function(){
      var rows=[];
      if(!document.body) return rows;
      var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        var n=walker.currentNode;
        if(n.parentElement&&!skipElement(n.parentElement)&&hasArabic(n.nodeValue)) rows.push({text:normalize(n.nodeValue),element:n.parentElement.tagName,id:n.parentElement.id||'',className:n.parentElement.className||''});
      }
      return rows;
    }
  };
  window.addEventListener('petatoe:language-changed',function(){buildIndex();schedule();});
  document.addEventListener('petatoe:tabchange',schedule);
  document.addEventListener('petatoe:navbuilt',schedule);
  window.addEventListener('petatoe:localization-ready',function(){buildIndex();schedule();});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
