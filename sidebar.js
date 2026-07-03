/** PETATOE Sidebar Accordion Navigation - extracted in v3.8.145 */
(function(){
  'use strict';
  if(window.__PETATOE_ACCORDION_NAV_FINAL_FIX__) return;
  window.__PETATOE_ACCORDION_NAV_FINAL_FIX__ = true;

  function byId(id){ return document.getElementById(id); }
  function list(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function groupFor(tab){
    return ({
      childrenExpenses:'main', entry:'operations', import:'operations', records:'operations', logs:'operations',
      smart:'analytics', customer360:'analytics', commissions:'analytics',
      executive:'management', obligations:'management', payroll:'management', salarySlip:'management', commissionStatement:'management', fleet:'management', treasury:'management', warehouses:'management',
      settings:'system'
    })[tab] || '';
  }
  function setArrow(group,open){
    var ico = group && group.querySelector('.pet-nav-group-toggle i');
    if(ico) ico.textContent = open ? '▼' : '▶';
  }
  function closeAllGroups(except){
    var nav = byId('nav'); if(!nav) return;
    list('.pet-nav-group',nav).forEach(function(g){
      var open = !!except && g.getAttribute('data-group') === except;
      g.classList.toggle('open', open);
      setArrow(g, open);
    });
  }
  function markActive(tabName){
    var nav = byId('nav'); if(!nav) return;
    list('button[data-tab], .pet-nav-direct[data-tab]',nav).forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    closeAllGroups(groupFor(tabName));
  }
  function activatePanel(tabName){
    if(!tabName) return;
    if(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function'){
      try{ window.PETATOERouter.openTab(tabName); }catch(e){ console.error('PETATOE tab error', e); }
    }else{
      list('.panel').forEach(function(p){ p.classList.toggle('active', p.id === tabName); });
    }
    markActive(tabName);
    try{ document.body.classList.remove('sidebar-open'); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sidebar.js",e);}
  }
  function bindMenu(){
    var nav = byId('nav'); if(!nav) return;
    if(!nav.classList.contains('petatoe-accordion-nav')) nav.classList.add('petatoe-accordion-nav');
    if(nav.__petatoeFinalNavBound) return;
    nav.__petatoeFinalNavBound = true;

    nav.addEventListener('click', function(e){
      // PETATOE v8.0.2 Phase 6: do not let the legacy accordion handler own clicks
      // after navigation/navigation.js has rebuilt #nav as the canonical v142 menu.
      if(nav.classList && nav.classList.contains('pet-v142-nav')) return;
      var groupBtn = e.target.closest && e.target.closest('.pet-nav-group-toggle');
      if(groupBtn && nav.contains(groupBtn)){
        e.preventDefault(); e.stopPropagation();
        var group = groupBtn.closest('.pet-nav-group');
        var gName = groupBtn.getAttribute('data-nav-group') || (group && group.getAttribute('data-group')) || '';
        var willOpen = !(group && group.classList.contains('open'));
        closeAllGroups(willOpen ? gName : '');
        return false;
      }
      var tabBtn = e.target.closest && e.target.closest('button[data-tab], .pet-nav-direct[data-tab]');
      if(tabBtn && nav.contains(tabBtn)){
        e.preventDefault(); e.stopPropagation();
        activatePanel(tabBtn.getAttribute('data-tab'));
        return false;
      }
    }, true);

    var active = nav.querySelector('button.active[data-tab], .pet-nav-direct.active[data-tab]');
    if(active) markActive(active.getAttribute('data-tab')); else closeAllGroups('');
  }
  document.addEventListener('petatoe:tabchange', function(e){var name=e.detail&&e.detail.tabId;try{ markActive(name); }catch(err){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sidebar.js",err);}});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindMenu); else bindMenu();
  setTimeout(bindMenu,300);
  setTimeout(bindMenu,1000);
})();
