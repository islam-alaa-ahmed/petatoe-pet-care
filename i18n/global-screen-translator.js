/* PETATOE v9 - Global English Screen Translator (Performance-safe)
   Batches DOM mutations, avoids recursive observer loops and caches translations. */
(function(){
  'use strict';

  var ARABIC_RE=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  var ATTRS=['title','aria-label','aria-description','placeholder','data-label','data-title','data-tooltip','data-original-title','alt'];
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
    'الهدف الشهري':'Monthly Target','مبيعات الشهر':'Monthly Sales','عدد العملاء':'Customer Count','عدد العمليات':'Transaction Count',
    'كل السنوات 🌐':'All Years 🌐','المبيعات شاملة الضريبة':'Sales Including VAT','المبيعات قبل الضريبة':'Sales Before VAT',
    'مقارنة مخصصة':'Custom Comparison','مبيعات العملاء الجدد':'New Customer Sales','متوسط العميل الجديد':'Average New Customer',
    'إجمالي / عدد العملاء':'Total / Customer Count','عادوا أو نفذوا أكثر من عملية':'Returned or completed more than one transaction',
    'قيمة':'Value','بالشهور':'by Month','مقارنة العملاء الجدد بالشهور':'Monthly New Customer Comparison',
    'اتجاه اكتساب العملاء الجدد خلال شهور السنة المختارة':'New customer acquisition trend across the selected year',
    'طريقة احتساب العملاء الجدد':'How New Customers Are Calculated','توزيع العملاء الجدد أسبوعياً':'Weekly New Customer Distribution',
    'أعلى 10 عملاء جدد قيمة':'Top 10 New Customers by Value','ترتيب العملاء الجدد حسب إجمالي مبيعاتهم في الشهر المختار':'Ranking new customers by total sales in the selected month',
    'تفاصيل احتساب عدد الزيارات':'Visit Count Calculation Details','محسوبة':'Counted','عرض التفاصيل':'View Details','عرض التفاصيل 👁️':'View Details 👁️',
    'مرتفع':'High','متوسط':'Medium','منخفض':'Low','نشاط منتظم':'Regular Activity','زيارات متكررة':'Frequent Visits',
    'زيارة قريبة':'Recent Visit','إنفاق قوي':'Strong Spending','عقد سنوي':'Annual Contract','عقد توريد دوري':'Recurring Supply Contract',
    'متابعة تعاقدية':'Contract Follow-up','ملخص الترشيح':'Recommendation Summary','التوصية':'Recommendation','شهور النشاط':'Active Months',
    'المرشحين':'Candidates','العملاء المرشحين':'Candidate Customers','إجمالي العملاء المرشحين':'Total Candidate Customers',
    'إجمالي المبيعات المحتملة':'Total Potential Sales','أفضل مرشح':'Best Candidate','درجة الترشيح':'Recommendation Score',
    'جميع القيم بالريال السعودي وتشمل ضريبة القيمة المضافة':'All values are in SAR and include VAT',
    'أفضل شهر':'Best Month','أفضل خدمة':'Best Service','إجمالي المبيعات':'Total Sales'
  };

  // FINAL8: persistent English safety net for Smart Reports dynamic/narrative text.
  // Kept in one central layer so later report edits cannot silently reintroduce Arabic UI.
  Object.assign(UI_GLOSSARY,{
    'كل السنوات':'All Years','المبيعات شاملة الضريبة':'Sales Including VAT','المبيعات قبل الضريبة':'Sales Before VAT','مقارنة مخصصة':'Custom Comparison','النمو':'Growth',
    'مبيعات العملاء الجدد':'New Customer Sales','متوسط العميل الجديد':'Average New Customer','إجمالي / عدد العملاء':'Total / Customer Count','عادوا أو نفذوا أكثر من عملية':'Returned or completed more than one transaction',
    'الزيارة = فاتورة بيع فعلية لم يتم إلغاؤها بمرتجع كامل.':'A visit is an actual sales invoice that was not fully cancelled by a return.',
    'فواتير البيع':'Sales invoices','فواتير المرتجع المطابقة':'Matched return invoices','الزيارات الصافية المحتسبة':'Calculated net visits',
    'المعادلة: الزيارات الصافية = فواتير البيع - فواتير البيع الملغاة بمرتجع كامل في نفس اليوم تقريباً.':'Formula: net visits = sales invoices minus sales invoices fully cancelled by a return on approximately the same day.',
    'تقريباً Day البيع الملغاة بمرتجع كامل في نفس Invoices البيع - Invoices = Visits Net المعادلة:':'Formula: net visits = sales invoices minus sales invoices fully cancelled by a return on approximately the same day.',
    'تفاصيل احتساب عدد الزيارات':'Visit Count Calculation Details','الفاتورة':'Invoice','التاريخ':'Date','القيمة':'Value','الحالة':'Status','محسوبة':'Counted',
    'العملاء المرشحين للعقود':'Customers Recommended for Contracts','عملاء مرشحون لعمل عقود معهم':'Customers Recommended for Contracts',
    'يرتب أفضل العملاء المرشحين لعقد سنوي أو توريد دوري بنفس منطق تحليل العملاء الحالي، مع حداثة آخر زيارة وتصنيف العميل.':'Ranks the best candidates for an annual or recurring supply contract using current customer-analysis logic, recent activity, last visit, and customer classification.',
    'إجمالي العملاء المرشحين':'Total Candidate Customers','إجمالي المبيعات المحتملة':'Total Potential Sales','أفضل مرشح':'Best Candidate','للعملاء المرشحين':'for candidate customers','عميل مرشح':'candidate customers',
    'نشاط جيد + فرصة توريد دوري':'Good activity + recurring supply opportunity','قبل التعاقد: متابعة فرصة':'Before contracting: follow up on the opportunity','قبل التعاقد Follow-up فرصة':'Before contracting: follow up on the opportunity',
    'التوصية التجارية':'Business Recommendation','التوصية التجارية الذكية':'Smart Business Recommendation','درجة الترشيح':'Recommendation Score',
    'تفاصيل سبب الترشيح':'Recommendation Reason Details','متابعة للتعاقد':'Contract Follow-up','مرشح للمتابعة قبل عرض عقد رسمي':'Candidate for follow-up before presenting a formal contract',
    'سبب الترشيح الكامل':'Full recommendation rationale','الإجراء المقترح':'Recommended action','متابعة تجارية قبل عرض العقد':'Commercial follow-up before presenting the contract',
    'مع مراجعة آخر الخدمات والزيارات قبل التواصل.':'Review the latest services and visits before contacting the customer.',
    'شهور النشاط':'Active Months','التصنيف الحالي':'Current Classification','أيام الغياب':'Inactive Days','متوسط الفاتورة':'Average Invoice','عدد الزيارات':'Visit Count','إجمالي الإنفاق':'Total Spend',
    'يقارن التقرير مبيعات كل عميل بين سنتين حتى تاريخ آخر فاتورة مرفوعة في سنة المقارنة، مع حساب كامل البيانات أو أول 10 فقط في كل جدول مع زر عرض المزيد. الفلاتر مرتبطة بكل الأقسام: الملخص، النمو، التراجع، المفقودين، الترتيب، والرسم.':'The report compares each customer’s sales across two years through the latest uploaded invoice date in the comparison year. It calculates the full dataset while showing the first 10 rows in each table with a Load More option. Filters apply to the summary, growth, decline, lost customers, ranking, and charts.',
    'اشتروا في فترة الأساس ولم يشتروا في نفس فترة المقارنة':'Purchased in the base period but not in the same comparison period','ظهروا في نفس فترة المقارنة':'Appeared in the same comparison period','زادوا عن سنة الأساس':'Increased versus the base year','انخفضوا ومازالوا نشطين':'Declined but remain active',
    'أكثر من 60 يوم بدون زيارة صافية':'More than 60 days without a net visit','من آخر زيارة صافية':'From the last net visit','تقدير حسب متوسط الإنفاق الشهري للعميل':'Estimated from the customer’s average monthly spending',
    'توزيع العملاء حسب مدة الغياب':'Customer Distribution by Inactivity Duration','يوضح أين تتركز مخاطر فقد العملاء بناءً على تاريخ آخر زيارة صافية.':'Shows where customer-loss risk is concentrated based on the last net visit date.',
    'عملاء أصبحوا غير نشطين':'Customers Becoming Inactive','جدول العملاء غير النشطين':'Inactive Customers Table','يمكن تغيير ترتيب الجدول من الأزرار بدون تغيير أي قيم. الترتيب الحالي حسب إجمالي الإنفاق.':'Use the buttons to change table ranking without changing any values. The current ranking is by total spending.',
    'ترتيب حسب إجمالي الإنفاق':'Rank by Total Spending','ترتيب حسب تصنيف العميل':'Rank by Customer Classification','ترتيب حسب مستوى المخاطر':'Rank by Risk Level','ترتيب حسب أيام الغياب':'Rank by Inactive Days',
    'فرص الاسترجاع':'Recovery Opportunities','تحديد العملاء الأولى بالمتابعة حسب قيمة الإنفاق ومتوسط الإنفاق الشهري ومدة الغياب.':'Prioritizes customers for follow-up based on spending value, average monthly spending, and inactivity duration.',
    'متوسط الإنفاق الشهري':'Average Monthly Spending','القيمة المفقودة المتوقعة':'Expected Lost Value','فرصة الاسترجاع':'Recovery Opportunity',
    'آخر فاتورة':'Last Invoice','رقم آخر فاتورة':'Last Invoice Number','التصنيف':'Category',
    'كل السنوات 🌐':'All Years 🌐','كل السنوات':'All Years','المبيعات':'Sales','تفاصيل الأرباع':'Quarter Details','المبيعات شاملة الضريبة - 2025':'Sales Including VAT - 2025','المبيعات شاملة الضريبة - 2026':'Sales Including VAT - 2026',
    'متابعة العملاء الجدد':'Follow-up New Customers','العملاء الجدد وقيمة العملاء':'New Customers and Customer Value','العملاء المرشحون للعقود':'Customers Recommended for Contracts','مقارنة العملاء بين عامين':'Two-Year Customer Comparison','متابعة نشاط العملاء':'Customer Activity Follow-up',
    'العملاء الجدد':'New Customers','مبيعات العملاء الجدد':'New Customer Sales','متوسط العميل الجديد':'Average New Customer','إجمالي / عدد العملاء':'Total / Customer Count','عادوا أو نفذوا أكثر من عملية':'Returned or completed more than one transaction',
    'العملاء غير النشطين':'Inactive Customers','العملاء الحرجون':'Critical Customers','متوسط الغياب':'Average Absence','المبيعات المفقودة المتوقعة':'Expected Lost Sales','أعلى عميل خطورة':'Highest-Risk Customer'
  });

  var MONTHS={jan:'January',feb:'February',mar:'March',apr:'April',may:'May',jun:'June',jul:'July',aug:'August',sep:'September',oct:'October',nov:'November',dec:'December',
    '01':'January','02':'February','03':'March','04':'April','05':'May','06':'June','07':'July','08':'August','09':'September','10':'October','11':'November','12':'December'};

  var phrasePairs=[];
  var phraseMap=Object.create(null);
  var translationCache=new Map();
  var observer=null;
  var observerTarget=null;
  var mutationQueue=[];
  var queuedNodes=new Set();
  var flushHandle=0;
  var fullScanHandle=0;
  var processing=false;
  var MAX_CACHE=3000;
  var MAX_NODES_PER_SLICE=180;

  function language(){
    try{
      if(window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage)return window.PETATOE_I18N.getLanguage();
      var stored='';
      try{stored=window.localStorage&&localStorage.getItem('petatoe.ui.language')||'';}catch(_storage){}
      return stored||window.__PETATOE_INITIAL_LANGUAGE__||document.documentElement.lang||'ar';
    }catch(_){return document.documentElement.lang||'ar';}
  }
  function isAuthenticated(){
    try{
      if(document.documentElement.classList.contains('pet-authenticated')) return true;
      if(document.body&&document.body.classList.contains('pet-authenticated')) return true;
      if(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function'){
        var u=window.PETATOEAuth.currentUser();
        return !!(u&&(u.id||u.username));
      }
    }catch(_e){}
    return false;
  }
  function runtimeEnabled(){ return language()==='en'&&isAuthenticated(); }
  function normalize(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function hasArabic(v){return ARABIC_RE.test(String(v||''));}
  function flatten(obj,prefix,out){
    out=out||{};prefix=prefix||'';
    if(!obj||typeof obj!=='object')return out;
    Object.keys(obj).forEach(function(k){
      var v=obj[k],path=prefix?prefix+'.'+k:k;
      if(typeof v==='string')out[path]=v;
      else if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,path,out);
    });
    return out;
  }
  function addPair(source,target){
    source=normalize(source);target=normalize(target);
    if(!source||!target||source===target||!hasArabic(source)||hasArabic(target))return;
    if(!phraseMap[source]||target.length>phraseMap[source].length)phraseMap[source]=target;
  }
  function buildIndex(){
    phraseMap=Object.create(null);
    translationCache.clear();
    try{
      var d=window.PETATOE_I18N_DICTIONARIES||{},ar=flatten(d.ar||{}),en=flatten(d.en||{});
      Object.keys(ar).forEach(function(k){if(typeof en[k]==='string')addPair(ar[k],en[k]);});
    }catch(_){}
    try{
      var s=window.PETATOE_SMART_REPORTS_TRANSLATIONS||{},sa=flatten(s.ar||{}),se=flatten(s.en||{});
      Object.keys(sa).forEach(function(k){if(typeof se[k]==='string')addPair(sa[k],se[k]);});
    }catch(_){}
    Object.keys(UI_GLOSSARY).forEach(function(k){addPair(k,UI_GLOSSARY[k]);});
    phrasePairs=Object.keys(phraseMap).map(function(source){return{source:source,target:phraseMap[source]};})
      .sort(function(a,b){return b.source.length-a.source.length;});
  }
  function replaceLiteral(text,source,target){return text.split(source).join(target);}
  function setCache(key,value){
    if(translationCache.size>=MAX_CACHE)translationCache.clear();
    translationCache.set(key,value);
  }
  function translateMixed(value){
    if(language()!=='en'||value==null)return value;
    var original=String(value);
    if(!hasArabic(original))return original;
    if(translationCache.has(original))return translationCache.get(original);
    var exact=original;
    try{
      exact=window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?
        window.PETATOE_I18N.translateRuntime(original,'en'):original;
    }catch(_){}
    if(typeof exact==='string'&&exact!==original&&!hasArabic(exact)){
      setCache(original,exact);return exact;
    }
    var out=original;
    for(var i=0;i<phrasePairs.length&&hasArabic(out);i++){
      var pair=phrasePairs[i];
      if(out.indexOf(pair.source)!==-1)out=replaceLiteral(out,pair.source,pair.target);
    }
    setCache(original,out);
    return out;
  }
  function englishMonth(value){
    var key=String(value==null?'':value).trim().toLowerCase();
    if(language()!=='en')return value;
    return MONTHS[key]||translateMixed(value);
  }
  function skip(el){
    if(!el||el.nodeType!==1)return true;
    if(el.closest&&el.closest('script,style,noscript,code,pre,#petLanguageSwitcher,[data-i18n-skip="true"],[data-i18n-ignore]'))return true;
    if(el.isContentEditable||el.matches&&el.matches('textarea'))return true;
    return false;
  }
  function translateTextNode(node){
    if(!node||node.nodeType!==3||!node.parentElement||skip(node.parentElement)||!hasArabic(node.nodeValue))return;
    var translated=translateMixed(node.nodeValue);
    if(translated!==node.nodeValue)node.nodeValue=translated;
  }
  function translateAttributes(el){
    if(!el||el.nodeType!==1||skip(el))return;
    ATTRS.forEach(function(name){
      if(!el.hasAttribute(name))return;
      var value=el.getAttribute(name);
      if(!hasArabic(value))return;
      var translated=translateMixed(value);
      if(translated!==value)el.setAttribute(name,translated);
    });
    if(el.matches&&el.matches('input[type="button"],input[type="submit"],input[type="reset"],option')){
      var value=el.tagName==='OPTION'?el.textContent:el.value;
      if(hasArabic(value)){
        var translated=translateMixed(value);
        if(el.tagName==='OPTION')el.textContent=translated;else el.value=translated;
      }
    }
  }
  function processNode(root){
    if(!runtimeEnabled()||!root)return;
    if(root.nodeType===3){translateTextNode(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1&&skip(root))return;
    if(root.nodeType===1)translateAttributes(root);
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{
      acceptNode:function(node){
        if(node.nodeType===1&&skip(node))return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while((node=walker.nextNode())){
      if(node.nodeType===3)translateTextNode(node);
      else{
        translateAttributes(node);
        if(node.shadowRoot)enqueue(node.shadowRoot);
      }
    }
  }
  function pauseObserver(){if(observer)observer.disconnect();}
  function resumeObserver(){
    if(!observer||!observerTarget||!runtimeEnabled())return;
    observer.observe(observerTarget,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS.concat(['value'])});
  }
  function runIdle(callback){
    if(window.requestIdleCallback)return window.requestIdleCallback(callback,{timeout:180});
    return window.setTimeout(function(){callback({timeRemaining:function(){return 8;},didTimeout:true});},16);
  }
  function cancelIdle(handle){
    if(!handle)return;
    if(window.cancelIdleCallback)window.cancelIdleCallback(handle);else clearTimeout(handle);
  }
  function enqueue(node){
    if(!node||!runtimeEnabled()||queuedNodes.has(node))return;
    queuedNodes.add(node);mutationQueue.push(node);
    if(!flushHandle)flushHandle=runIdle(flushQueue);
  }
  function flushQueue(deadline){
    flushHandle=0;
    if(processing||!runtimeEnabled()){mutationQueue.length=0;queuedNodes.clear();return;}
    processing=true;pauseObserver();
    var processed=0;
    try{
      while(mutationQueue.length&&processed<MAX_NODES_PER_SLICE&&(deadline.didTimeout||deadline.timeRemaining()>2)){
        var node=mutationQueue.shift();queuedNodes.delete(node);processNode(node);processed++;
      }
    }finally{
      processing=false;resumeObserver();
    }
    if(mutationQueue.length&&!flushHandle)flushHandle=runIdle(flushQueue);
  }
  function requestFullScan(delay){
    if(!runtimeEnabled())return;
    cancelIdle(fullScanHandle);
    fullScanHandle=setTimeout(function(){
      fullScanHandle=0;
      if(!runtimeEnabled()) return;
      var roots=[];
      ['header','.topbar','.top-bar','#nav','.sidebar','.panel.active','main .active','#smartTabs','.smart-tab-section.active','.contract-reason-modal-overlay.show','.new-cust-tier-tooltip','.smart-modal-overlay.show'].forEach(function(selector){
        try{ document.querySelectorAll(selector).forEach(function(el){ if(roots.indexOf(el)===-1) roots.push(el); }); }catch(_e){}
      });
      if(!roots.length) roots.push(document.body||document.documentElement);
      roots.forEach(enqueue);
    },typeof delay==='number'?delay:120);
  }
  function installObserver(){
    if(observer||!window.MutationObserver)return;
    observerTarget=document.body||document.documentElement;
    observer=new MutationObserver(function(records){
      if(processing||!runtimeEnabled())return;
      records.forEach(function(record){
        if(record.type==='characterData')enqueue(record.target);
        else if(record.type==='attributes')enqueue(record.target);
        else Array.prototype.forEach.call(record.addedNodes||[],enqueue);
      });
    });
    resumeObserver();
  }
  function patchCanvas(){
    try{
      var proto=window.CanvasRenderingContext2D&&window.CanvasRenderingContext2D.prototype;
      if(!proto||proto.__petatoeI18nPatched)return;
      ['fillText','strokeText'].forEach(function(name){
        var original=proto[name];if(typeof original!=='function')return;
        proto[name]=function(text){
          var args=Array.prototype.slice.call(arguments);
          if(runtimeEnabled()&&hasArabic(text))args[0]=translateMixed(text);
          return original.apply(this,args);
        };
      });
      proto.__petatoeI18nPatched=true;
    }catch(_){}
  }

  // FINAL9: initial English hydration coordinator.
  // Some report builders finish after the saved language is restored. Manual language toggling
  // used to fix those surfaces because it reran the full language application lifecycle.
  // This coordinator performs the same lifecycle once, silently, after auth/data/render readiness.
  var hydrationTimer=0;
  var hydrationRunning=false;
  var lastHydrationAt=0;
  var lastDictionarySignature='';

  function dictionarySignature(){
    try{
      var d=window.PETATOE_I18N_DICTIONARIES||{};
      var s=window.PETATOE_SMART_REPORTS_TRANSLATIONS||{};
      return [
        Object.keys(d.ar||{}).length,Object.keys(d.en||{}).length,
        Object.keys(s.ar||{}).length,Object.keys(s.en||{}).length,
        !!window.PETATOE_I18N,!!window.PETATOE_BUSINESS_DATA_LOCALIZATION
      ].join('|');
    }catch(_e){ return ''; }
  }
  function ensureIndexFresh(force){
    var sig=dictionarySignature();
    if(force||!phrasePairs.length||sig!==lastDictionarySignature){
      buildIndex();
      lastDictionarySignature=sig;
    }
  }
  function activeEnglishRoots(){
    var roots=[];
    ['header','.topbar','.top-bar','#nav','.sidebar','.panel.active','main .active','#smartTabs','.smart-tab-section.active','.contract-reason-modal-overlay.show','.new-cust-tier-tooltip','.smart-modal-overlay.show'].forEach(function(selector){
      try{document.querySelectorAll(selector).forEach(function(el){if(roots.indexOf(el)===-1)roots.push(el);});}catch(_e){}
    });
    return roots.length?roots:[document.body||document.documentElement];
  }
  function activeSurfaceHasArabic(){
    var roots=activeEnglishRoots();
    for(var r=0;r<roots.length;r++){
      var root=roots[r];
      if(!root)continue;
      try{
        var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()){
          var node=walker.currentNode;
          if(node.parentElement&&!skip(node.parentElement)&&hasArabic(node.nodeValue))return true;
        }
      }catch(_e){}
    }
    return false;
  }
  function runInitialEnglishHydration(reason){
    hydrationTimer=0;
    if(hydrationRunning||!runtimeEnabled())return;
    ensureIndexFresh(false);
    // Avoid needless work after the active surface is already clean.
    if(!activeSurfaceHasArabic()){requestFullScan(0);return;}
    var now=Date.now();
    if(now-lastHydrationAt<700)return;
    lastHydrationAt=now;
    hydrationRunning=true;
    try{
      if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.apply==='function'){
        window.PETATOE_I18N.apply('en',{renderDashboard:false,source:'initial-hydration',silent:true});
      }
    }catch(_e){}
    finally{
      hydrationRunning=false;
      ensureIndexFresh(false);
      requestFullScan(20);
      try{window.dispatchEvent(new CustomEvent('petatoe:english-hydrated',{detail:{reason:reason||'unknown'}}));}catch(_e2){}
    }
  }
  function scheduleInitialEnglishHydration(reason,delay){
    if(!runtimeEnabled())return;
    clearTimeout(hydrationTimer);
    hydrationTimer=setTimeout(function(){runInitialEnglishHydration(reason);},typeof delay==='number'?delay:180);
  }

  function residuals(){
    var rows=[];if(!document.body)return rows;
    function inspect(root){
      var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        var node=walker.currentNode;
        if(node.parentElement&&!skip(node.parentElement)&&hasArabic(node.nodeValue))rows.push({text:normalize(node.nodeValue),element:node.parentElement.tagName,id:node.parentElement.id||'',className:String(node.parentElement.className||'')});
      }
      if(root.querySelectorAll)root.querySelectorAll('*').forEach(function(el){
        ATTRS.forEach(function(name){
          var value=el.getAttribute&&el.getAttribute(name);
          if(hasArabic(value))rows.push({text:normalize(value),attribute:name,element:el.tagName,id:el.id||'',className:String(el.className||'')});
        });
        if(el.shadowRoot)inspect(el.shadowRoot);
      });
    }
    inspect(document.body);return rows;
  }
  function init(){patchCanvas();installObserver();if(runtimeEnabled()){buildIndex();requestFullScan(0);}}

  window.PETATOE_GLOBAL_SCREEN_TRANSLATOR={
    translate:translateMixed,
    monthName:englishMonth,
    scan:function(){requestFullScan(0);},
    rebuild:function(){ensureIndexFresh(true);requestFullScan(0);},
    hydrate:function(){scheduleInitialEnglishHydration('manual-api',0);},
    remainingArabic:residuals,
    stats:function(){return{authenticated:isAuthenticated(),runtimeEnabled:runtimeEnabled(),queuedNodes:mutationQueue.length,cacheSize:translationCache.size,phrases:phrasePairs.length,processing:processing};},
    assertEnglishClean:function(){
      var rows=residuals();
      if(rows.length)console.error('[PETATOE i18n] Arabic remains in English UI',rows);
      else console.info('[PETATOE i18n] English UI is clean');
      return{passed:rows.length===0,count:rows.length,items:rows};
    }
  };

  window.addEventListener('petatoe:language-changed',function(){
    if(runtimeEnabled()){ensureIndexFresh(true);resumeObserver();requestFullScan(30);}else{pauseObserver();mutationQueue.length=0;queuedNodes.clear();}
  });
  document.addEventListener('petatoe:userchanged',function(e){
    var user=e&&e.detail&&e.detail.user;
    if(user&&(user.id||user.username)){
      ensureIndexFresh(true);resumeObserver();requestFullScan(40);scheduleInitialEnglishHydration('userchanged',260);
    }else{
      pauseObserver();cancelIdle(flushHandle);cancelIdle(fullScanHandle);flushHandle=0;fullScanHandle=0;
      mutationQueue.length=0;queuedNodes.clear();processing=false;
    }
  });
  document.addEventListener('petatoe:tabchange',function(e){requestFullScan(90);var d=e&&e.detail||{};if(d.tabId==='smart'||document.querySelector('.smart-tab-section.active'))scheduleInitialEnglishHydration('smart-tabchange',220);});
  document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('[data-smart-action],[data-contract-reason-index],[data-contract-reason-close]'))requestFullScan(120);},true);
  window.addEventListener('petatoe:records-changed',function(){ensureIndexFresh(false);requestFullScan(120);scheduleInitialEnglishHydration('records-changed',240);});
  document.addEventListener('petatoe:navbuilt',function(){requestFullScan(90);scheduleInitialEnglishHydration('navbuilt',160);});
  window.addEventListener('petatoe:localization-ready',function(){if(runtimeEnabled()){ensureIndexFresh(true);requestFullScan(50);scheduleInitialEnglishHydration('localization-ready',140);}});
  window.addEventListener('load',function(){if(runtimeEnabled()){ensureIndexFresh(true);requestFullScan(180);scheduleInitialEnglishHydration('window-load',420);}});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
