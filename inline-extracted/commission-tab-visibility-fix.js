/* === PETATOE v3.5 COMMISSION TAB VISIBILITY FINAL FIX === */
(function(){
  function petBlock5765_q(id){return document.getElementById(id)}
  function ensureCommissionTab(){
    var nav=petBlock5765_q('nav');
    if(!nav) return;
    var btn=nav.querySelector('[data-tab="commissions"]');
    if(!btn){
      btn=document.createElement('button');
      btn.dataset.tab='commissions';
      btn.textContent='💰 نظام العمولات';
      nav.insertBefore(btn, nav.querySelector('[data-tab="records"]')||null);
    }
    btn.classList.remove('locked');
    btn.title='';
    btn.style.pointerEvents='auto';
    if(!btn.dataset.petatoeCommissionBound){
      btn.dataset.petatoeCommissionBound='1';
      btn.addEventListener('click', function(){
        if(window.PETATOERouter && typeof window.PETATOERouter.openTab==='function') window.PETATOERouter.openTab('commissions');
      });
    }

    var stmt=nav.querySelector('[data-tab="commissionStatement"]');
    if(!stmt){
      stmt=document.createElement('button');
      stmt.dataset.tab='commissionStatement';
      stmt.textContent='📄 كشف العمولة';
      btn.parentNode.insertBefore(stmt, btn.nextSibling);
    }
    stmt.classList.remove('locked');
    stmt.title='';
    stmt.style.pointerEvents='auto';
    if(!stmt.dataset.petatoeCommissionStatementBound){
      stmt.dataset.petatoeCommissionStatementBound='1';
      stmt.addEventListener('click', function(){
        if(window.PETATOERouter && typeof window.PETATOERouter.openTab==='function') window.PETATOERouter.openTab('commissionStatement');
      });
    }
  }
  function scheduleBoundedEnsure(){
    var runs=0;
    function tick(){
      runs+=1;
      ensureCommissionTab();
      if(runs<8 && !petBlock5765_q('nav')) setTimeout(tick,500);
    }
    setTimeout(tick,300);
    setTimeout(ensureCommissionTab,900);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureCommissionTab,{once:true}); else ensureCommissionTab();
  scheduleBoundedEnsure();
})();