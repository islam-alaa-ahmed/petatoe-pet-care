/* === NEW CUSTOMER TIER TOOLTIP VIEWPORT SAFE FIX === */
(function(){
  if(window.__PETATOE_CUSTOMER_TIER_TOOLTIP_VIEWPORT_FIX_BOUND__) return;
  window.__PETATOE_CUSTOMER_TIER_TOOLTIP_VIEWPORT_FIX_BOUND__ = true;
  /* v3.11.10: using global clamp */
  function ensureTip(){
    let tip=document.getElementById('newCustTierGlobalTooltip');
    if(!tip){
      tip=document.createElement('div');
      tip.id='newCustTierGlobalTooltip';
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTierTooltip(wrap){
    const source=wrap && wrap.querySelector('.new-cust-tier-tooltip');
    if(!source) return;
    const tip=ensureTip();
    if(window.PETATOESecurity && typeof window.PETATOESecurity.setInnerHTML==='function'){
      window.PETATOESecurity.setInnerHTML(tip, source.innerHTML);
    }else{
      tip.textContent=source.textContent||'';
    }
    tip.classList.remove('arrow-right','show','visit-data-tooltip','visit-months-tooltip','inactive-recovery-tooltip');
    if(source.querySelector && source.querySelector('.cust-visit-mini-table')){
      tip.classList.add('visit-data-tooltip');
    }
    if((source.textContent||'').includes('بيان شهور الزيارة')){
      tip.classList.add('visit-months-tooltip');
    }
    if(source.querySelector && source.querySelector('.inactive-tip-kpis')){
      tip.classList.add('inactive-recovery-tooltip');
    }

    const rect=wrap.getBoundingClientRect();
    const vw=window.innerWidth || document.documentElement.clientWidth;
    const vh=window.innerHeight || document.documentElement.clientHeight;
    const margin=12, gap=12;

    tip.style.visibility='hidden';
    tip.style.opacity='0';
    tip.style.left='0px';
    tip.style.top='0px';
    tip.classList.add('show');

    const tw=tip.offsetWidth || 310;
    const th=tip.offsetHeight || 170;

    let left=rect.right + gap;
    let arrowRight=false;
    if(left + tw + margin > vw){
      left=rect.left - tw - gap;
      arrowRight=true;
    }
    if(left < margin){
      left=clamp(rect.left + rect.width/2 - tw/2, margin, Math.max(margin, vw - tw - margin));
      arrowRight=false;
    }

    let top=rect.top + rect.height/2 - th/2;
    top=clamp(top, margin, Math.max(margin, vh - th - margin));

    const arrowTop=clamp(rect.top + rect.height/2 - top - 6, 18, Math.max(18, th - 24));
    tip.style.left=left+'px';
    tip.style.top=top+'px';
    tip.style.setProperty('--tier-arrow-top', arrowTop+'px');
    if(arrowRight) tip.classList.add('arrow-right');

    tip.style.visibility='';
    tip.style.opacity='';
  }
  function hideTierTooltip(){
    const tip=document.getElementById('newCustTierGlobalTooltip');
    if(tip) tip.classList.remove('show');
  }
  document.addEventListener('mouseover',function(e){
    const wrap=e.target.closest && e.target.closest('.new-cust-tier-wrap');
    if(wrap) showTierTooltip(wrap);
  },true);
  document.addEventListener('focusin',function(e){
    const wrap=e.target.closest && e.target.closest('.new-cust-tier-wrap');
    if(wrap) showTierTooltip(wrap);
  },true);
  document.addEventListener('mouseout',function(e){
    const wrap=e.target.closest && e.target.closest('.new-cust-tier-wrap');
    if(wrap && (!e.relatedTarget || !wrap.contains(e.relatedTarget))) hideTierTooltip();
  },true);
  document.addEventListener('focusout',function(e){
    const wrap=e.target.closest && e.target.closest('.new-cust-tier-wrap');
    if(wrap) hideTierTooltip();
  },true);
  var hideScheduled=false;
  function scheduleHideTierTooltip(){
    if(hideScheduled) return;
    hideScheduled=true;
    requestAnimationFrame(function(){
      hideScheduled=false;
      hideTierTooltip();
    });
  }
  window.addEventListener('scroll',scheduleHideTierTooltip,true);
  window.addEventListener('resize',scheduleHideTierTooltip);
})();