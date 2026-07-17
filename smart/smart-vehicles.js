/* PETATOE v6.4.172 - Smart Vehicles Module Extraction (Phase B3)
   Owns Smart Reports > Vehicles rendering, filters, charts, and tables.
   Source of truth remains invoice/manual sales records only via the Smart Data Engine when available. */


function petatoeSmartVehiclesT(key,fallback,params){try{if(typeof window.smartReportT==='function')return window.smartReportT(key,fallback,params);}catch(_){ }return String(fallback==null?'':fallback).replace(/\{(\w+)\}/g,function(_,k){return params&&params[k]!=null?params[k]:_;});}

function petatoeSmartVehiclesEscHTML(value){
  if(window.PETATOESafeRender && typeof window.PETATOESafeRender.escapeHTML === 'function') return window.PETATOESafeRender.escapeHTML(value);
  if(typeof window.htmlSafe === 'function') return window.htmlSafe(value);
  return String(value == null ? '' : value).replace(/[&<>\"'`]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;','`':'&#96;'}[ch]||ch;});
}

function petatoeSmartVehiclesSetHTML(el, html, reason){
  if(!el) return false;
  html = String(html == null ? '' : html);
  if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function'){
    window.PETATOESafeRender.htmlSanitized(el, html, reason || 'smart-vehicles render');
  }else{
    el.replaceChildren(document.createRange().createContextualFragment(html));
  }
  return true;
}

function setSmartVanYear(y){smartVehicleYear=y;petatoeSmartRerender('vehicles')}
function setSmartVanDetailsYear(y){smartVehicleDetailsYear=y;petatoeSmartRerender('vehicles')}
function setSmartVehicleBarYear(y){smartVehicleBarYear=y;petatoeSmartRerender('vehicles')}
function setSmartVehiclePieYear(y){smartVehiclePieYear=y;petatoeSmartRerender('vehicles')}
function setSmartVehicleLineYear(y){smartVehicleLineYear=y;petatoeSmartRerender('vehicles')}
function smartVehicleScopedYear(value,data){
  return value==='all'?'all':(+value||defaultYear(data));
}
function smartVehicleReportMonths(data,year){
  return monthAgg(data,year);
}
function renderSmartVans(data){
  data=Array.isArray(data)?data:(records||[]);
  if(!$('smartVanPieBtns')) return;
  const fallbackYear=defaultYear(data);
  let detailsY=(typeof smartVehicleDetailsYear!=='undefined' && smartVehicleDetailsYear==='all')?'all':(+(typeof smartVehicleDetailsYear!=='undefined'?smartVehicleDetailsYear:fallbackYear)||fallbackYear);
  let barY=smartVehicleScopedYear(typeof smartVehicleBarYear!=='undefined'?smartVehicleBarYear:fallbackYear,data);
  let pieY=smartVehicleScopedYear(typeof smartVehiclePieYear!=='undefined'?smartVehiclePieYear:fallbackYear,data);
  let lineY=smartVehicleScopedYear(typeof smartVehicleLineYear!=='undefined'?smartVehicleLineYear:fallbackYear,data);

  if($('smartVanDetailsBtns')) yearButtons('smartVanDetailsBtns',String(detailsY),'setSmartVanDetailsYear');
  yearButtons('smartVanBarBtns',String(barY),'setSmartVehicleBarYear');
  yearButtons('smartVanPieBtns',String(pieY),'setSmartVehiclePieYear');
  yearButtons('smartVanLineBtns',String(lineY),'setSmartVehicleLineYear');

  function invRows(y){
    try{
      if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.filterInvoicesByYear==='function'){
        return window.PETATOESmartDataEngine.filterInvoicesByYear(data,y);
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-vehicles.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return byYear(data,y).map(function(r){return {row:r,year:getYear(r),month:normalizeMonth(r.month,r.date),monthName:(window.PETATOE_GLOBAL_SCREEN_TRANSLATOR&&window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName)?window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName(MAR[normalizeMonth(r.month,r.date)]||normalizeMonth(r.month,r.date)):(MAR[normalizeMonth(r.month,r.date)]||normalizeMonth(r.month,r.date)),vehicle:r.van||'غير محدد',amount:parseNum(r.totalInc)};});
  }
  function aggVehicles(rows, yearValue){
    try{
      if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.aggregateVehicles==='function' && yearValue !== undefined){
        var out={};
        window.PETATOESmartDataEngine.aggregateVehicles(data, yearValue, 'valueDesc').forEach(function(x){out[x.name]={name:x.name,total:x.total||x.value||0,count:x.count||0};});
        return out;
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-vehicles.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    var idx={};
    rows.forEach(function(inv){var k=String(inv.vehicle||'غير محدد'); if(!idx[k])idx[k]={name:k,total:0,count:0}; idx[k].total+=parseNum(inv.amount); idx[k].count+=1;});
    return idx;
  }

  const pieRows=invRows(pieY);
  const pieTotalsObj=aggVehicles(pieRows,pieY);
  const pieKeys=Object.keys(pieTotalsObj);
  const pieTotal=pieKeys.reduce(function(s,k){return s+pieTotalsObj[k].total;},0);
  $('smartVansDistSub').textContent=petatoeSmartVehiclesT('vehicles.totalSalesLabel','إجمالي المبيعات: {amount}',{amount:money(pieTotal)});
  petatoeSmartVehiclesSetHTML($('smartVanPieValues'), pieKeys.map((k,i)=>`<div class="value-item"><i class="value-dot" style="background:${[css('--cyan'),css('--purple'),css('--green'),css('--orange')][i%4]}"></i><span>${petatoeSmartVehiclesEscHTML(k)}</span><b>${money(pieTotalsObj[k].total)}<br><small class="metric-up">${pieTotal?(pieTotalsObj[k].total/pieTotal*100).toFixed(2):0}%</small></b></div>`).join(''), 'smart vehicles pie values');
  chart('smartVansPieChart',{type:'doughnut',data:{labels:pieKeys,datasets:[{data:pieKeys.map(k=>pieTotalsObj[k].total),backgroundColor:[css('--cyan'),css('--purple'),css('--green'),css('--orange')],borderWidth:0}]},options:{...baseOpts('none'),cutout:'44%',plugins:{legend:{display:false},petatoeLabels:{enabled:true,fullMoney:true,color:'#fff'}}}});

  function matrixFor(y){
    try{
      if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.monthVehicleMatrix==='function') return window.PETATOESmartDataEngine.monthVehicleMatrix(data,y);
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-vehicles.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    var rows=invRows(y), vehicles={}, months={};
    rows.forEach(function(inv){var v=String(inv.vehicle||'غير محدد'); vehicles[v]=true; var key=(String(y)==='all'?String(inv.year)+'-':'')+String(inv.month).padStart(2,'0'); if(!months[key])months[key]={key:key,year:inv.year,month:inv.month,label:inv.monthName||key,total:0,byVehicle:{}}; months[key].total+=parseNum(inv.amount); months[key].byVehicle[v]=(months[key].byVehicle[v]||0)+parseNum(inv.amount);});
    return {rows:rows,vehicles:Object.keys(vehicles),months:Object.values(months).sort(function(a,b){return (Number(a.year)-Number(b.year))||(Number(a.month)-Number(b.month));})};
  }

  const lineMatrix=matrixFor(lineY);
  chart('smartVansCompareChart',{type:'line',data:{labels:lineMatrix.months.map(x=>x.label),datasets:lineMatrix.vehicles.map((v,i)=>({label:v,data:lineMatrix.months.map(m=>m.byVehicle[v]||0),borderColor:[css('--cyan'),css('--purple'),css('--green'),css('--orange')][i%4],backgroundColor:'transparent',fill:false,tension:.27,pointRadius:5,borderWidth:3}))},options:{...baseOpts(),layout:{padding:{top:34,right:20}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:true,font:'800 10px Cairo',offset:14}},scales:{x:{ticks:{color:css('--text'),font:{family:'Cairo'},maxRotation:0,minRotation:0},grid:{color:'rgba(148,163,184,.1)'}},y:{ticks:{color:css('--muted')},grid:{color:'rgba(148,163,184,.13)'}}}}});

  const barMatrix=matrixFor(barY);
  let datasets=barMatrix.vehicles.map((v,i)=>({label:v,data:barMatrix.months.map(m=>m.byVehicle[v]||0),backgroundColor:[css('--cyan'),css('--purple'),css('--green'),css('--orange')][i%4],borderRadius:7}));
  datasets.push({label:petatoeSmartVehiclesT('overview.totalSales','إجمالي المبيعات'),data:barMatrix.months.map(m=>m.total||0),backgroundColor:'#94a3b8',borderRadius:7});
  chart('smartVansMonthlyBars',{type:'bar',data:{labels:barMatrix.months.map(x=>x.label),datasets},options:{...baseOpts(),layout:{padding:{top:36}},plugins:{...baseOpts().plugins,petatoeLabels:{enabled:true,money:true,font:'800 10px Cairo'}},scales:{x:{ticks:{color:css('--text'),font:{family:'Cairo',weight:'700'},maxRotation:0,minRotation:0},grid:{display:false}},y:{ticks:{color:css('--muted')},grid:{color:'rgba(148,163,184,.13)'}}}}});

  const detailsRows=invRows(detailsY);
  const detailsTotalsObj=aggVehicles(detailsRows,detailsY);
  const smartVanEntries=Object.keys(detailsTotalsObj).map(k=>[k,detailsTotalsObj[k].total,detailsTotalsObj[k].count]);
  const smartVanDetailsTotal=smartVanEntries.reduce((a,b)=>a+b[1],0);
  const smartVanTableRows=smartVanEntries.map(x=>`<tr><td>${petatoeSmartVehiclesEscHTML(x[0])}</td><td>${money(x[1])}</td><td>${x[2]}</td><td>${money(x[1]/(x[2]||1))}</td></tr>`).join('');
  const smartVanTotalOps=smartVanEntries.reduce((sum,x)=>sum+x[2],0);
  const smartVanTotalRow=`<tfoot><tr class="smart-vans-total-row"><td>${petatoeSmartVehiclesT('vehicleEfficiency.total','الإجمالي')}</td><td>${money(smartVanDetailsTotal)}</td><td>${fmt0(smartVanTotalOps)}</td><td>${money(smartVanDetailsTotal/(smartVanTotalOps||1))}</td></tr></tfoot>`;
  petatoeSmartVehiclesSetHTML($('smartVansTable'), `<thead><tr><th>${petatoeSmartVehiclesT('vehicleEfficiency.vehicle','السيارة')}</th><th>${petatoeSmartVehiclesT('metrics.sales','المبيعات')}</th><th>${petatoeSmartVehiclesT('vehicleEfficiency.operationsCount','العمليات')}</th><th>${petatoeSmartVehiclesT('vehicleEfficiency.averageTransaction','متوسط العملية')}</th></tr></thead><tbody>`+smartVanTableRows+'</tbody>'+smartVanTotalRow, 'smart vehicles table');
}
try{ window.renderSmartVans = renderSmartVans; }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-vehicles.js', e, {phase:'v6.4.209'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
