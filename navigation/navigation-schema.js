/** PETATOE v10.0.24 — Canonical desktop/mobile navigation schema */
(function(){
  'use strict';
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
    nav=nav||document.getElementById('nav');
    if(!nav) return current;
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
    item.source.click();
    return true;
  }

  window.PETATOENavigationSchema={current:current,capture:capture,refreshVisibility:refreshVisibility,activate:activate};
  document.addEventListener('petatoe:navbuilt',function(e){capture(e.detail&&e.detail.nav);});
  document.addEventListener('petatoe:permissionsready',refreshVisibility);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){capture();},{once:true});else capture();
})();
