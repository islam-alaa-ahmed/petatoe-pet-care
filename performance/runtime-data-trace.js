/* PETATOE v10.0.20 — Runtime Data Trace Audit R3 (diagnostic only) */
(function(w){
  'use strict';
  if(w.PETATOEDataTrace&&w.PETATOEDataTrace.__ready)return;
  var started=performance.now(), events=[], requests=[], counters={}, maxEvents=600;
  function now(){return Math.round((performance.now()-started)*10)/10}
  function safe(v){try{return JSON.parse(JSON.stringify(v))}catch(_){return String(v)}}
  function add(type,name,detail){var item={t:now(),type:type,name:name,detail:safe(detail||{})};events.push(item);if(events.length>maxEvents)events.shift();try{localStorage.setItem('petatoe_runtime_trace_latest',JSON.stringify(report()))}catch(_e){}return item}
  function count(name){counters[name]=(counters[name]||0)+1;return counters[name]}
  function span(name,detail){var s=performance.now();add('start',name,detail);return function(extra){var ms=Math.round((performance.now()-s)*10)/10;add('end',name,Object.assign({durationMs:ms},extra||{}));return ms}}
  function report(){return {version:String(w.PETATOE_RELEASE_VERSION||''),release:String(w.PETATOE_RELEASE_NAME||''),userAgent:navigator.userAgent,startedAt:new Date(Date.now()-performance.now()+started).toISOString(),elapsedMs:now(),visibility:document.visibilityState,counters:safe(counters),requests:safe(requests),events:safe(events),salesStatus:safe(w.__PETATOE_SALES_SOURCE_STATUS__||null)}}
  function text(){return JSON.stringify(report(),null,2)}
  function clear(){events.length=0;requests.length=0;counters={};started=performance.now();add('mark','trace-cleared')}
  w.PETATOEDataTrace={__ready:true,add:add,span:span,report:report,text:text,clear:clear};
  add('mark','trace-script-ready',{readyState:document.readyState});

  ['DOMContentLoaded','load','pageshow','visibilitychange','petatoe:records-changed','petatoe:session-ready','petatoe:auth-ready'].forEach(function(ev){
    w.addEventListener(ev,function(e){add('event',ev,{reason:e&&e.detail&&e.detail.reason||'',persisted:!!(e&&e.persisted),visibility:document.visibilityState});});
  });

  if(typeof w.fetch==='function'){
    var originalFetch=w.fetch.bind(w);
    w.fetch=function(input,init){
      var url=String((input&&input.url)||input||'');
      var id=count('fetch');var s=performance.now();
      return originalFetch(input,init).then(function(res){var ms=Math.round((performance.now()-s)*10)/10;var row={id:id,t:now(),durationMs:ms,status:res.status,ok:res.ok,url:url.replace(/([?&](?:apikey|token|access_token)=)[^&]+/ig,'$1***')};requests.push(row);if(requests.length>250)requests.shift();add('network','fetch-complete',row);return res;},function(err){var ms=Math.round((performance.now()-s)*10)/10;var row={id:id,t:now(),durationMs:ms,status:0,ok:false,url:url,error:String(err&&err.message||err)};requests.push(row);add('network','fetch-error',row);throw err;});
    };
  }

  function wrap(obj,key,label,meta){
    if(!obj||typeof obj[key]!=='function'||obj[key].__petatoeTraced)return false;
    var original=obj[key];
    function wrapped(){var args=[].slice.call(arguments),done=span(label,Object.assign({call:count(label)},meta?meta(args):{}));try{var out=original.apply(this,args);if(out&&typeof out.then==='function')return out.then(function(v){done({ok:!v||v.ok!==false,rows:v&&((v.rows!=null?v.rows:null)||(v.data&&v.data.length))||0,pages:v&&v.pages||0});return v;},function(e){done({ok:false,error:String(e&&e.message||e)});throw e;});done({sync:true});return out;}catch(e){done({ok:false,error:String(e&&e.message||e)});throw e}}
    wrapped.__petatoeTraced=true;wrapped.__original=original;obj[key]=wrapped;return true;
  }

  var attempts=0;
  var timer=setInterval(function(){
    attempts++;
    var ready=0;
    ready+=wrap(w.PETATOEDataLayer,'readSalesRecords','dataLayer.readSalesRecords',function(a){return {options:a[0]||{}}})?1:0;
    ready+=wrap(w.PETATOEDataSource,'refreshSalesRecordsFromSupabase','dataSource.refreshSalesRecordsFromSupabase',function(a){return {reason:a[0]||'',options:a[1]||{}}})?1:0;
    ready+=wrap(w.PETATOEDataSource,'setRuntimeRecords','dataSource.setRuntimeRecords',function(a){return {inputRows:Array.isArray(a[0])?a[0].length:0,reason:a[1]||''}})?1:0;
    ready+=wrap(w,'populateFilters','ui.populateFilters')?1:0;
    ready+=wrap(w,'renderDashboardAll','ui.renderDashboardAll')?1:0;
    ready+=wrap(w,'renderDashboardKpis','ui.renderDashboardKpis',function(a){return {rows:Array.isArray(a[0])?a[0].length:0}})?1:0;
    ready+=wrap(w,'renderDashboardCharts','ui.renderDashboardCharts',function(a){return {rows:Array.isArray(a[0])?a[0].length:0}})?1:0;
    if(ready)add('mark','trace-hooks-attached',{count:ready,attempt:attempts});
    if(attempts>240)clearInterval(timer);
  },50);
})(window);
