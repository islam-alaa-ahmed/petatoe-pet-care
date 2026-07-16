/* PETATOE v9 Enterprise - Application Shell runtime migration pilot */
(function(){
  'use strict';
  var VERSION='9.0.0-elc-phase7a';
  var ROOT_SELECTORS=[
    '#sideLauncher',
    '#topbarSearch',
    '#sidebar',
    '#nav',
    '#globalSearchOverlay',
    '#petatoe-pdf-modal',
    '#petDrillModal',
    '#heatCalendarModal'
  ];
  var stats={version:VERSION,applyCount:0,lastApplyMs:0,lastLanguage:null,lastSource:null,lastReason:null,lastError:null};
  var applying=false;

  function now(){return window.performance&&performance.now?performance.now():Date.now();}
  function localizationApi(){return window.PETATOE_I18N||null;}
  function localizationCenter(){return window.PETATOE_LOCALIZATION_CENTER||null;}
  function uniqueRoots(){
    var seen=[];
    ROOT_SELECTORS.forEach(function(selector){
      var el=document.querySelector(selector);
      if(el&&seen.indexOf(el)<0)seen.push(el);
    });
    return seen;
  }
  function updateStatus(reason,start){
    var api=localizationApi();
    var center=localizationCenter();
    var status=center&&center.getStatus?center.getStatus():null;
    stats.applyCount++;
    stats.lastApplyMs=Math.max(0,Math.round(now()-start));
    stats.lastLanguage=api&&api.getLanguage?api.getLanguage():null;
    stats.lastSource=status&&status.loader?status.loader.source:null;
    stats.lastReason=reason||'manual';
    stats.lastError=null;
  }
  function applyShell(reason){
    var api=localizationApi();
    if(applying||!api||typeof api.applySubtree!=='function')return false;
    var roots=uniqueRoots();
    if(!roots.length)return false;
    var start=now();
    applying=true;
    try{
      roots.forEach(function(root){api.applySubtree(root);});
      updateStatus(reason,start);
      return true;
    }catch(error){
      stats.lastError=error&&error.message?error.message:String(error);
      return false;
    }finally{
      applying=false;
    }
  }
  function schedule(reason){
    window.requestAnimationFrame(function(){applyShell(reason);});
  }

  window.addEventListener('petatoe:localization-ready',function(){schedule('localization-ready');});
  window.addEventListener('petatoe:language-changed',function(){schedule('language-changed');});
  document.addEventListener('petatoe:navbuilt',function(){schedule('navbuilt');});
  document.addEventListener('petatoe:tabchange',function(){schedule('tabchange');});

  window.PETATOE_APPLICATION_SHELL_LOCALIZATION_PILOT={
    version:VERSION,
    apply:function(){return applyShell('manual');},
    getStatus:function(){return Object.assign({},stats);},
    roots:function(){return ROOT_SELECTORS.slice();}
  };
  window.petatoeApplicationShellLocalizationStatus=function(){
    return {
      pilot:Object.assign({},stats),
      localization:localizationCenter()&&localizationCenter().getStatus?localizationCenter().getStatus():null
    };
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){schedule('dom-ready');},{once:true});
  else schedule('immediate');
})();
