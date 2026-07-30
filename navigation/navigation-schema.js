/** PETATOE v10.0.24 — Canonical desktop/mobile navigation schema */
(function(){
  'use strict';
  function d35Mark(name,detail){try{if(window.PETATOEStartupDiagnostics&&window.PETATOEStartupDiagnostics.mark)window.PETATOEStartupDiagnostics.mark(name,detail);}catch(_e){}}
  d35Mark('navigation-module-eval-start');
  if(window.__PETATOE_NAVIGATION_SCHEMA__) return;
  window.__PETATOE_NAVIGATION_SCHEMA__=true;

  var ATTRS=['data-tab','data-pet-nav-screen','data-pet-permission-screen','data-smart-open','data-settings-main','data-settings-sub','data-settings-action','data-appointments-subtab'];
  var current={version:1,direct:[],groups:[]};

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
  function visible(node){
    if(!node||node.hidden||node.getAttribute('aria-hidden')==='true') return false;
    var style=window.getComputedStyle?getComputedStyle(node):null;
    return !style||style.display!=='none';
  }
  function attrs(node){
    var out={};
    ATTRS.forEach(function(name){var value=node.getAttribute(name);if(value!=null&&value!=='')out[name]=value;});
    return out;
  }
  function keyFor(data,index){
    return ATTRS.map(function(name){return data[name]||'';}).join('|')+'|'+String(index||0);
  }
  function itemFrom(button,index){
    var data=attrs(button);
    var titleNode=button.querySelector('[data-nav-title],.pet-v142-title,strong,b');
    var subNode=button.querySelector('[data-nav-subtitle],.pet-v142-subtitle,small');
    var title=clean(titleNode&&titleNode.textContent)||clean(button.textContent);
    var subtitle=clean(subNode&&subNode.textContent);
    return {key:keyFor(data,index),title:title,subtitle:subtitle,attributes:data,visible:visible(button),source:button};
  }
  function capture(nav){
    d35Mark('navigation-capture-start');
    nav=nav||document.getElementById('nav');
    if(!nav){d35Mark('navigation-capture-end',{result:'nav-missing'});return current;}
    var direct=[],groups=[];
    Array.prototype.forEach.call(nav.children,function(child,childIndex){
      if(child.matches&&child.matches('button[data-tab],button[data-settings-main]')){
        direct.push(itemFrom(child,childIndex));
        return;
      }
      if(!(child.matches&&child.matches('.pet-v142-group,.pet-nav-group'))) return;
      var toggle=child.querySelector('.pet-v142-toggle,.pet-nav-group-toggle');
      var titleNode=toggle&&toggle.querySelector('[data-nav-title],span,b,strong');
      var title=clean(titleNode&&titleNode.textContent)||clean(toggle&&toggle.textContent);
      var groupId=child.getAttribute('data-group')||('group-'+childIndex);
      var body=child.querySelector('.pet-v142-items,.pet-nav-group-items');
      var items=[];
      if(body) Array.prototype.forEach.call(body.querySelectorAll(':scope > button'),function(button,itemIndex){items.push(itemFrom(button,itemIndex));});
      groups.push({id:groupId,title:title,visible:visible(child),items:items,source:child});
    });
    current={version:(current.version||0)+1,direct:direct,groups:groups};
    window.PETATOENavigationSchema.current=current;
    document.dispatchEvent(new CustomEvent('petatoe:navigationschema',{detail:{schema:current}}));
    d35Mark('navigation-capture-end',{result:'captured',direct:direct.length,groups:groups.length});
    return current;
  }
  function refreshVisibility(){
    current.direct.forEach(function(item){item.visible=visible(item.source);});
    current.groups.forEach(function(group){
      group.visible=visible(group.source);
      group.items.forEach(function(item){item.visible=visible(item.source);});
    });
    return current;
  }
  function activate(item){
    if(!item||!item.source||!document.contains(item.source)) return false;
    var data=item.attributes||attrs(item.source);
    var inertOwner=item.source.closest&&item.source.closest('[inert]');

    // Mobile Enterprise v10 keeps the canonical desktop navigation subtree inert
    // and uses it only as the schema/permission source. Programmatic click() on an
    // inert source is not a deterministic navigation contract, so route directly
    // while preserving every captured intent attribute (especially appointments/master).
    if(inertOwner){
      var settingsMain=data['data-settings-main']||'';
      if(settingsMain){
        var settingsSub=data['data-settings-sub']||'';
        var settingsAction=data['data-settings-action']||'';
        try{window.__PETATOE_SETTINGS_MAIN__=settingsMain;window.__PETATOE_SETTINGS_SUB__=settingsSub;}catch(_e){}
        if(window.PETATOERouter&&typeof window.PETATOERouter.openTab==='function'){
          window.PETATOERouter.openTab('settings','',{source:'navigation-schema-mobile'});
        }else if(typeof window.tab==='function'){
          window.tab('settings');
        }else return false;
        try{document.dispatchEvent(new CustomEvent('petatoe:settingsnavigate',{detail:{main:settingsMain,sub:settingsSub,action:settingsAction}}));}catch(_e){}
        if(settingsAction==='restore'){
          setTimeout(function(){
            try{
              if(typeof window.petV110PickRestore==='function') window.petV110PickRestore();
              else if(typeof window.petatoeRestorePicker==='function') window.petatoeRestorePicker();
            }catch(_e){}
          },180);
        }
        return true;
      }

      var tab=data['data-tab']||'';
      if(tab){
        var smartOpen=data['data-smart-open']||'';
        var routeIntent={source:'navigation-schema-mobile'};
        if(tab==='appointments') routeIntent.appointmentsSubTab=data['data-appointments-subtab']||'add';
        if(window.PETATOERouter&&typeof window.PETATOERouter.openTab==='function'){
          window.PETATOERouter.openTab(tab,smartOpen,routeIntent);
          return true;
        }
        if(typeof window.tab==='function'){
          window.tab(tab,smartOpen,routeIntent);
          return true;
        }
        return false;
      }
    }

    item.source.click();
    return true;
  }

  d35Mark('navigation-module-eval-end');
  window.PETATOENavigationSchema={current:current,capture:capture,refreshVisibility:refreshVisibility,activate:activate};
  document.addEventListener('petatoe:navbuilt',function(e){capture(e.detail&&e.detail.nav);});
  document.addEventListener('petatoe:permissionsready',refreshVisibility);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){capture();},{once:true});else capture();
})();
