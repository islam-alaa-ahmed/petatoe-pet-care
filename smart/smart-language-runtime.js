/* PETATOE v9.4.23 — Smart Reports Dynamic Localization Runtime
   Keeps Smart Reports fast by translating only the visible tab and newly-created
   dynamic nodes. No report rebuild, data reload, calculation-cache clear, or
   full-page observer is used. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_DYNAMIC_LOCALIZATION__) return;
  window.__PETATOE_SMART_DYNAMIC_LOCALIZATION__=true;

  var textSources=new WeakMap();
  var attrSources=new WeakMap();
  var chartSources=new WeakMap();
  var revision=0;
  var chartFrame=0;
  var observer=null;
  var translating=false;
  var pendingRoots=new Set();
  var pendingFlush=false;

  var FRAGMENTS_EN=Object.freeze({
    'المبيعات شاملة الضريبة':'Sales Including VAT','المبيعات قبل الضريبة':'Sales Before VAT','الضريبة':'VAT',
    'كل السنوات':'All Years','كل السيارات':'All Vehicles','كل الخدمات':'All Services','كل طرق الدفع':'All Payment Methods','كل العملاء':'All Customers',
    'تحليل الخدمات':'Service Analysis','تحليل المبيعات':'Sales Analysis','تحليل السيارات':'Vehicle Analysis','تحليل العملاء':'Customer Analysis',
    'قائمة فواتير المبيعات':'Sales Invoice List','تفاصيل مقارنة الشهور':'Monthly Comparison Details','مقارنة الشهور':'Compare Months','مقارنة الأرباع':'Compare Quarters',
    'إجمالي المبيعات':'Total Sales','إجمالي عدد المعاملات':'Total Operations','متوسط قيمة الفاتورة':'Average Invoice','أعلى شهر مبيعات':'Best Sales Month',
    'عدد المعاملات':'Operations Count','عدد العمليات':'Operations Count','متوسط العملية':'Average Transaction','نسبة المساهمة من الإجمالي':'Contribution to Total',
    'المؤشر':'Metric','الإجمالي - الفترة':'Period Total','الإجمالي':'Total','الإيراد':'Revenue','المبيعات':'Sales','العمليات':'Operations','الخدمة':'Service','العميل':'Customer','الإجراء':'Action','الإنفاق':'Spending',
    'أهم قرار اليوم':'Top Decision Today','أكبر فرصة نمو':'Largest Growth Opportunity','أكبر نقطة متابعة':'Top Follow-up Point',
    'الأثر المتوقع':'Expected Impact','درجة الثقة':'Confidence Score','عرض السبب':'View Reason','فتح التقرير':'Open Report','خطة التنفيذ السريعة':'Quick Action Plan',
    'أولوية عالية':'High Priority','عاجل':'Urgent','عالي':'High','متوسط':'Medium','منخفض':'Low','حرج':'Critical','خطر مرتفع':'High Risk',
    'عملاء معرضون للفقد':'Customers at Risk','قيمة تقديرية للأولوية':'Estimated Priority Value','عميل متكرر':'Repeat Customer','فاتورة':'Invoice',
    'ذكاء الأعمال':'Business Intelligence','تحديث الطبقة':'Refresh Layer','خدمات تحتاج متابعة':'Services Requiring Follow-up','أفضل العملاء صحة':'Healthiest Customers',
    'انقر لعرض المزيد':'Click to Load More','المزيد لعرض باقي الخدمات':'Load More Services','عرض المزيد':'Load More',
    'العملاء الجدد':'New Customers','مبيعات العملاء الجدد':'New Customer Sales','متوسط العميل الجديد':'Average New Customer','معدل التحويل':'Conversion Rate','أعلى عميل جديد':'Top New Customer',
    'من نفس الشهر':'From the Same Month','عادوا أو نفذوا أكثر من عملية':'Returned or completed more than one transaction',
    'نقدي':'Cash','كاش':'Cash','غير محدد':'Unspecified','التصنيف الحالي':'Current Classification','شهور النشاط':'Active Months','أيام الغياب':'Inactive Days',
    'تفاصيل سبب الترشيح':'Recommendation Reason Details','سبب الترشيح الكامل':'Full Recommendation Rationale','الإجراء المقترح':'Recommended Action',
    'تحليل القيمة المفقودة المتوقعة':'Expected Lost Value Analysis','توصيات استرجاع العميل':'Customer Recovery Recommendations',
    'فتح':'Open','عرض التفاصيل':'View Details','المرشحون للعقود':'Contract Candidates','عقد سنوي':'Annual Contract','متابعة للتعاقد':'Contract Follow-up'
  });

  function language(){
    try{
      var center=window.PETATOE_LOCALIZATION_CENTER;
      if(center&&typeof center.getLanguage==='function')return String(center.getLanguage()||document.documentElement.lang||'ar').toLowerCase();
      var api=translator();
      if(api&&typeof api.getLanguage==='function')return String(api.getLanguage()||document.documentElement.lang||'ar').toLowerCase();
      return String(document.documentElement.lang||'ar').toLowerCase();
    }catch(_){return 'ar';}
  }
  function translator(){return window.PETATOE_GLOBAL_SCREEN_TRANSLATOR||null;}
  function exactTranslate(source){
    var api=translator();
    if(!api||typeof api.translate!=='function')return source;
    try{return String(api.translate(source));}catch(_){return source;}
  }
  function businessTranslate(source){
    var business=window.PETATOE_LOCALIZATION_CENTER_BUSINESS;
    if(!business||typeof business.resolve!=='function')return source;
    var value=String(source||'').trim();
    if(!value||value.length>120)return source;
    var types=['payment','customerStatus','customerCategory','appointmentStatus','vehicleStatus','vehicleType','service'];
    for(var i=0;i<types.length;i++){
      try{var result=String(business.resolve(types[i],value,'en')||value);if(result!==value&&!/[\u0600-\u06FF]/.test(result))return result;}catch(_){ }
    }
    return source;
  }
  function fragmentTranslate(source){
    var out=String(source||'');
    Object.keys(FRAGMENTS_EN).sort(function(a,b){return b.length-a.length;}).forEach(function(ar){out=out.split(ar).join(FRAGMENTS_EN[ar]);});
    out=out.replace(/تم عرض\s*([\d,]+)\s*من أصل\s*([\d,]+)\s*(عميل|خدمة|فرصة استرجاع|عميل مرشح)?/g,function(_,shown,total,noun){return 'Showing '+shown+' of '+total+(noun?' '+fragmentTranslate(noun):'');});
    out=out.replace(/عرض\s*([\d,]+)\s*من\s*([\d,]+)\s*(عميل|خدمة)?/g,function(_,shown,total,noun){return 'Showing '+shown+' of '+total+(noun?' '+fragmentTranslate(noun):'');});
    return out;
  }
  function translate(value){
    var source=String(value==null?'':value);
    if(!source.trim())return source;
    var exact=exactTranslate(source);
    if(exact!==source)return exact;
    var business=businessTranslate(source);
    if(business!==source)return business;
    return /[\u0600-\u06FF]/.test(source)?fragmentTranslate(source):source;
  }
  function smartArea(){return document.getElementById('smartReportsArea');}
  function visibleRoot(){
    var area=smartArea();
    if(!area)return null;
    return area.querySelector('.smart-tab-section.active[data-smart-section]')||area;
  }
  function sourceText(node,lang){
    var saved=textSources.get(node);
    if(!saved){saved={ar:null,en:null};textSources.set(node,saved);}
    var current=String(node.nodeValue||'');
    if(lang==='ar')saved.ar=current;
    else if(saved.ar==null&&/[\u0600-\u06FF]/.test(current))saved.ar=current;
    if(saved.ar==null)saved.ar=current;
    return saved.ar;
  }
  function translateTextNodes(root,lang){
    if(!root)return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      if(!node.parentElement||node.parentElement.closest('script,style,noscript,code,pre,[data-i18n-skip="true"],[data-i18n-ignore]'))return NodeFilter.FILTER_REJECT;
      return String(node.nodeValue||'').trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    var node;
    while((node=walker.nextNode())){
      var source=sourceText(node,lang);
      var next=lang==='ar'?source:translate(source);
      if(next!==node.nodeValue)node.nodeValue=next;
    }
  }
  function translateAttributes(root,lang){
    if(!root||!root.querySelectorAll)return;
    var elements=[];
    if(root.nodeType===1&&root.matches('[placeholder],[title],[aria-label],[data-placeholder]'))elements.push(root);
    root.querySelectorAll('[placeholder],[title],[aria-label],[data-placeholder]').forEach(function(el){elements.push(el);});
    elements.forEach(function(el){
      var saved=attrSources.get(el)||{};
      ['placeholder','title','aria-label','data-placeholder'].forEach(function(attr){
        if(!el.hasAttribute(attr))return;
        if(!Object.prototype.hasOwnProperty.call(saved,attr))saved[attr]=el.getAttribute(attr);
        var source=saved[attr];
        var next=lang==='ar'?source:translate(source);
        if(next!==el.getAttribute(attr))el.setAttribute(attr,next);
      });
      attrSources.set(el,saved);
    });
  }
  function translateRoot(root,lang){
    if(!root)return;
    translating=true;
    try{translateTextNodes(root,lang);translateAttributes(root,lang);}finally{translating=false;}
  }
  function translateChartValue(value,lang){
    if(Array.isArray(value))return value.map(function(v){return translateChartValue(v,lang);});
    if(typeof value!=='string')return value;
    return lang==='ar'?value:translate(value);
  }
  function captureChartSource(chart){
    var source=chartSources.get(chart);
    if(source)return source;
    source={labels:Array.isArray(chart.data&&chart.data.labels)?chart.data.labels.slice():null,datasets:(chart.data&&chart.data.datasets||[]).map(function(ds){return {label:ds.label};})};
    chartSources.set(chart,source);return source;
  }
  function translateCharts(root,lang,token){
    if(token!==revision)return;
    Object.keys(window.charts||{}).forEach(function(key){
      var chart=window.charts[key],canvas=chart&&chart.canvas;
      if(!chart||!canvas||!root.contains(canvas))return;
      var source=captureChartSource(chart);
      if(source.labels&&chart.data)chart.data.labels=source.labels.map(function(v){return translateChartValue(v,lang);});
      (chart.data&&chart.data.datasets||[]).forEach(function(ds,i){if(source.datasets[i])ds.label=translateChartValue(source.datasets[i].label,lang);});
      try{chart.update('none');}catch(_){ }
    });
  }
  function scheduleCharts(root,lang,token){
    if(chartFrame&&window.cancelAnimationFrame)window.cancelAnimationFrame(chartFrame);
    var run=function(){chartFrame=0;translateCharts(root,lang,token);};
    chartFrame=window.requestAnimationFrame?window.requestAnimationFrame(run):setTimeout(run,0);
  }
  function flushPending(){
    pendingFlush=false;
    if(translating||!pendingRoots.size)return;
    var lang=language();
    var roots=Array.from(pendingRoots);pendingRoots.clear();
    roots.forEach(function(root){if(root&&root.isConnected)translateRoot(root,lang);});
  }
  function queueRoot(root){
    if(!root||root.nodeType!==1)return;
    var active=visibleRoot();
    if(!active||!(active===root||active.contains(root)||root.contains(active)))return;
    pendingRoots.add(root.contains(active)?active:root);
    if(!pendingFlush){pendingFlush=true;Promise.resolve().then(flushPending);}
  }
  function startObserver(){
    var area=smartArea();if(!area||observer)return;
    observer=new MutationObserver(function(records){
      if(translating)return;
      records.forEach(function(record){
        if(record.type==='characterData'){queueRoot(record.target.parentElement);return;}
        record.addedNodes.forEach(function(node){if(node.nodeType===1)queueRoot(node);else if(node.nodeType===3)queueRoot(node.parentElement);});
      });
    });
    observer.observe(area,{subtree:true,childList:true,characterData:true});
  }
  function apply(reason){
    var token=++revision,root=visibleRoot();if(!root)return false;
    var lang=language();
    root.setAttribute('data-smart-language-applying',lang);
    translateRoot(root,lang);
    root.setAttribute('data-smart-language-stable',lang);
    root.removeAttribute('data-smart-language-applying');
    scheduleCharts(root,lang,token);startObserver();return true;
  }

  window.PETATOE_SMART_LANGUAGE_RUNTIME={apply:apply,getLanguage:language,translate:translate,version:'10.0.13-startup-regression-r1'};
  window.addEventListener('petatoe:language-changed',function(){apply('language-changed');});
  window.addEventListener('petatoe:smart-tab-rendered',function(){apply('tab-rendered');});
  document.addEventListener('DOMContentLoaded',function(){startObserver();apply('dom-ready');});
})();
