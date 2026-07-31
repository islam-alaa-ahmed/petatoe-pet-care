(function(){
'use strict';
if(window.PETATOECommissionDiagnostic) return;
var events=[];
function now(){return new Date().toISOString();}
function snap(label, extra){
  var gate=window.PETATOEMobileStartupGate;
  var data={
    at:now(),label:label,
    url:location.href,
    activePanel:(document.querySelector('.panel.active')||{}).id||'',
    commissionsPanel:!!document.getElementById('commissions'),
    commissionStatementPanel:!!document.getElementById('commissionStatement'),
    runtime:!!window.PETATOECommissionRuntime,
    runtimeReady:!!(window.PETATOECommissionRuntime&&window.PETATOECommissionRuntime.__ready),
    ensurePanels:typeof(window.PETATOECommissionRuntime&&window.PETATOECommissionRuntime.ensurePanels),
    renderSystem:typeof(window.PETATOECommissionRuntime&&window.PETATOECommissionRuntime.renderSystem),
    renderCommissionSystem:typeof window.renderCommissionSystem,
    renderCommissionStatementPage:typeof window.renderCommissionStatementPage,
    gateStatus:gate&&typeof gate.getGroupStatus==='function'?gate.getGroupStatus('commission'):null,
    loadedScripts:Array.prototype.map.call(document.scripts,function(x){return x.src||'';}).filter(function(x){return /commission|startup-loading-gate/i.test(x);}),
    extra:extra||null
  };
  events.push(data); console.log('[PETATOE Commission Diagnostic]',data); return data;
}
function describeButton(b){return b?{text:(b.textContent||'').trim(),tab:b.getAttribute('data-tab'),screen:b.getAttribute('data-pet-nav-screen'),group:b.getAttribute('data-pet-lazy-group'),hidden:b.hidden,display:getComputedStyle(b).display}:null;}
document.addEventListener('pointerdown',function(e){var b=e.target&&e.target.closest&&e.target.closest('button[data-tab="commissions"],button[data-tab="commissionStatement"]');if(b)snap('pointerdown',describeButton(b));},true);
document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('button[data-tab="commissions"],button[data-tab="commissionStatement"]');if(b){snap('click-capture',describeButton(b));setTimeout(function(){snap('after-click-0ms',describeButton(b));},0);setTimeout(function(){snap('after-click-250ms',describeButton(b));},250);setTimeout(function(){snap('after-click-1500ms',describeButton(b));},1500);}},true);
document.addEventListener('petatoe:tabchange',function(e){var id=e.detail&&e.detail.tabId;if(id==='commissions'||id==='commissionStatement')snap('tabchange',e.detail);},true);
window.addEventListener('petatoe:mobile-lazy-group',function(e){if(e.detail&&e.detail.group==='commission')snap('lazy-group-event',e.detail);});
window.addEventListener('error',function(e){snap('window-error',{message:e.message,source:e.filename,line:e.lineno,column:e.colno});});
window.addEventListener('unhandledrejection',function(e){snap('unhandled-rejection',{reason:String(e.reason&&e.reason.stack||e.reason)});});
var router=window.PETATOERouter;
if(router&&typeof router.openTab==='function'&&!router.openTab.__commissionDiag){var original=router.openTab;var wrapped=function(){var args=[].slice.call(arguments);snap('router-before',{args:args});var result;try{result=original.apply(this,args);}catch(err){snap('router-throw',{message:err.message,stack:err.stack});throw err;}snap('router-after',{args:args,result:result});return result;};wrapped.__commissionDiag=true;router.openTab=wrapped;window.tab=wrapped;}
window.PETATOECommissionDiagnostic={snapshot:snap,events:events,export:function(){snap('manual-export');var text=JSON.stringify({generatedAt:now(),events:events},null,2);try{navigator.clipboard&&navigator.clipboard.writeText(text);}catch(_){}return text;},download:function(){var text=this.export();var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download='petatoe-commission-runtime-trace-'+Date.now()+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);}};
setTimeout(function(){snap('diagnostic-ready');},0);
})();
