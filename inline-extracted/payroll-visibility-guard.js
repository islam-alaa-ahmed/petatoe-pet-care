(function(){
  'use strict';
  if(window.__PETATOE_PAYROLL_VISIBILITY_GUARD_V612__) return;
  window.__PETATOE_PAYROLL_VISIBILITY_GUARD_V612__ = true;
  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function openPayrollTab(tab){
    try{ if(window.PETATOERouter && typeof window.PETATOERouter.openTab==='function') return window.PETATOERouter.openTab(tab); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/payroll-visibility-guard.js",e);}
    qa('.panel').forEach(function(p){p.classList.toggle('active',p.id===tab)});
    try{document.dispatchEvent(new CustomEvent('petatoe:tabchange',{detail:{tabId:tab}}));}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/payroll-visibility-guard.js",e);}
    return true;
  }
  function makeEl(tag, className, text){
    var el=document.createElement(tag);
    if(className) el.className=className;
    if(text!=null) el.textContent=text;
    return el;
  }
  function payrollHomeCard(tab, icon, title, sub){
    var btn=makeEl('button','payroll-home-card');
    btn.type='button';
    btn.setAttribute('data-payroll-open',tab);
    btn.appendChild(makeEl('span','payroll-home-icon',icon));
    var body=makeEl('span');
    body.appendChild(makeEl('b','',title));
    body.appendChild(makeEl('small','',sub));
    btn.appendChild(body);
    return btn;
  }
  function actionButton(className, action, text){
    var btn=makeEl('button',className,text);
    btn.type='button';
    btn.setAttribute('data-payroll-guard-action',action);
    return btn;
  }
  function ensureDashboardCards(){
    var dash=q('#dashboard'); if(!dash) return;
    if(q('[data-payroll-home-access="1"]',dash)) return;
    var wrap=document.createElement('div');
    wrap.className='payroll-home-access';
    wrap.setAttribute('data-payroll-home-access','1');
    wrap.appendChild(payrollHomeCard('payroll','💼','إدارة الرواتب','إنشاء كشوف الرواتب والاعتمادات'));
    wrap.appendChild(payrollHomeCard('salarySlip','📄','كشف الراتب','عرض كشف راتب المستخدم الحالي فقط'));
    var filters=q('.filters',dash), head=q('.section-head',dash);
    dash.insertBefore(wrap, (filters&&filters.nextSibling) || (head&&head.nextSibling) || dash.firstChild);
  }
  function itemButton(tab,title,sub){
    var b=document.createElement('button');
    var titleSpan=document.createElement('span');
    var subSpan=document.createElement('span');
    b.type='button';
    b.setAttribute('data-tab',tab);
    titleSpan.className='pet-v142-title';
    subSpan.className='pet-v142-sub';
    titleSpan.textContent=title||'';
    subSpan.textContent=sub||'';
    b.appendChild(titleSpan);
    b.appendChild(subSpan);
    return b;
  }
  function ensureSidebarItems(){
    var nav=q('#nav'); if(!nav) return;
    if(q('button[data-tab="payroll"]',nav) && q('button[data-tab="salarySlip"]',nav)) return;
    var management=q('.pet-v142-group[data-group="management"] .pet-v142-items',nav) || q('.pet-nav-group[data-group="management"] .pet-nav-group-body',nav) || nav;
    if(!q('button[data-tab="payroll"]',nav)) management.appendChild(itemButton('payroll','إدارة الرواتب','كشوف الرواتب والاعتمادات'));
    if(!q('button[data-tab="salarySlip"]',nav)) management.appendChild(itemButton('salarySlip','كشف الراتب','كشف راتب المستخدم الحالي'));
  }
  function ensurePayrollPanels(){
    var page=q('.page'); if(!page) return;
    if(!q('#payroll')){
      var p=document.createElement('div'); p.className='panel'; p.id='payroll';
      var head=makeEl('div','section-head');
      var titleWrap=makeEl('div');
      titleWrap.appendChild(makeEl('h2','', '💼 إدارة الرواتب'));
      var actions=makeEl('div');
      actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
      actions.appendChild(actionButton('btn btn-primary','open-monthly','➕ كشف راتب'));
      actions.appendChild(actionButton('btn btn-ghost','export-csv','📤 Excel'));
      head.appendChild(titleWrap); head.appendChild(actions);
      var area=makeEl('div'); area.id='payrollArea';
      p.appendChild(head); p.appendChild(area);
      page.insertBefore(p, q('#settings') || null);
    }
    if(!q('#salarySlip')){
      var s=document.createElement('div'); s.className='panel'; s.id='salarySlip';
      var head2=makeEl('div','section-head');
      var titleWrap2=makeEl('div');
      titleWrap2.appendChild(makeEl('h2','', '📄 كشف الراتب'));
      titleWrap2.appendChild(makeEl('p','', 'شاشة الموظف لعرض كشف راتبه فقط بعد الاعتماد المبدئي، مع إمكانية الموافقة أو الاعتراض.'));
      var actions2=makeEl('div');
      actions2.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
      actions2.appendChild(actionButton('btn btn-primary','render-slip','🔄 تحديث'));
      head2.appendChild(titleWrap2); head2.appendChild(actions2);
      var area2=makeEl('div'); area2.id='salarySlipArea';
      s.appendChild(head2); s.appendChild(area2);
      page.insertBefore(s, q('#settings') || null);
    }
  }
  function bindPayrollClicks(){
    if(document.__petatoePayrollVisibilityClickBound) return;
    document.__petatoePayrollVisibilityClickBound=true;
    document.addEventListener('click',function(e){
      var actionBtn=e.target.closest&&e.target.closest('[data-payroll-guard-action]');
      if(actionBtn){
        var action=actionBtn.getAttribute('data-payroll-guard-action');
        e.preventDefault(); e.stopPropagation();
        if(action==='open-monthly' && window.PETATOEPayroll&&typeof window.PETATOEPayroll.openTab==='function')window.PETATOEPayroll.openTab('monthly');
        if(action==='export-csv' && window.PETATOEPayroll&&typeof window.PETATOEPayroll.exportCsv==='function')window.PETATOEPayroll.exportCsv();
        if(action==='render-slip' && window.PETATOEPayroll&&typeof window.PETATOEPayroll.renderSalarySlip==='function')window.PETATOEPayroll.renderSalarySlip();
        return false;
      }
      var b=e.target.closest&&e.target.closest('[data-payroll-open], button[data-tab="payroll"], button[data-tab="salarySlip"]');
      if(!b) return;
      var tab=b.getAttribute('data-payroll-open') || b.getAttribute('data-tab');
      if(tab==='payroll' || tab==='salarySlip'){
        e.preventDefault(); e.stopPropagation(); openPayrollTab(tab); return false;
      }
    },true);
  }
  function run(){ensurePayrollPanels(); ensureDashboardCards(); ensureSidebarItems(); bindPayrollClicks();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('load',function(){setTimeout(run,50); setTimeout(run,500); setTimeout(run,1600);});
  setTimeout(run,700); setTimeout(run,2200); setTimeout(run,3600);
})();