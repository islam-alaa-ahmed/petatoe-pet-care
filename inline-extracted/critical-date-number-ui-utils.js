/* PETATOE v3.11.14 - Critical utilities single source */
(function(w,d){
  function pad(n){return String(n).padStart(2,'0')}
  function todayDate(){var x=new Date();x.setHours(0,0,0,0);return x}
  function dateToString(x){x=x instanceof Date?x:new Date(x||Date.now());return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())}
  w.PETATOEDate=w.PETATOEDate||{};
  w.PETATOEDate.todayDate=todayDate;
  w.PETATOEDate.todayString=function(){return dateToString(todayDate())};
  w.PETATOEDate.dateToString=dateToString;
  w.PETATOEDate.parseDate=function(v){if(v instanceof Date){var c=new Date(v.getTime());c.setHours(0,0,0,0);return isNaN(c)?null:c} if(!v)return null; var dt=new Date(v); if(isNaN(dt))return null; dt.setHours(0,0,0,0); return dt};
  function normalizeArabicDigits(v){return String(v==null?'':v).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)});}
  function coreNum(v){
    if(typeof v==='number') return isFinite(v)?v:0;
    var raw=normalizeArabicDigits(v).replace(/SAR|ريال|ر\.س/ig,'').replace(/,/g,'').replace(/\s+/g,'').replace(/[^0-9.\-]/g,'');
    var n=parseFloat(raw);
    return isFinite(n)?n:0;
  }
  function roundMoney(v){var n=coreNum(v); if(Math.abs(n)<0.005)n=0; return Math.round(n*100)/100;}
  w.PETATOENumber=w.PETATOENumber||{};
  w.PETATOENumber.num=coreNum;
  w.PETATOENumber.roundMoney=roundMoney;
  w.PETATOENumber.fmt=function(v){return roundMoney(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})};
  w.PETATOENumber.fmt0=function(v){return coreNum(v).toLocaleString('en-US',{maximumFractionDigits:0})};
  w.PETATOENumber.qty=function(v){var n=coreNum(v); if(Math.abs(n)<0.000001)n=0; return n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2})};
  w.PETATOENumber.money=function(v,currency){return w.PETATOENumber.fmt(v)+' '+(currency||w.SAR||'SAR')};
  w.PETATOEUtils=w.PETATOEUtils||{};
  w.PETATOEUtils.num=w.PETATOENumber.num;
  w.PETATOEUtils.fmt=w.PETATOENumber.fmt;
  w.PETATOEUtils.money=w.PETATOENumber.money;
  w.PETATOEUI=w.PETATOEUI||{};
  w.PETATOEUI.byId=function(id){return typeof id==='string'?d.getElementById(id):id};
  w.PETATOEUI.fillSelect=function(target,items,opts){
    var el=w.PETATOEUI.byId(target); if(!el)return;
    opts=opts||{}; var cur=opts.keepValue!==false?el.value:'';
    var list=Array.isArray(items)?items:[];
    function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
    while(el.firstChild){el.removeChild(el.firstChild);}
    function addOption(val,txt){var opt=d.createElement('option');opt.value=String(val==null?'':val);opt.textContent=String(txt==null?'':txt);el.appendChild(opt);}
    if(opts.placeholder!=null) addOption(opts.placeholderValue||'', opts.placeholder);
    list.forEach(function(it){var val,txt;if(it&&typeof it==='object'){val=it.value!=null?it.value:(it.id!=null?it.id:it.name);txt=it.label!=null?it.label:(it.text!=null?it.text:(it.name!=null?it.name:val));}else{val=it;txt=it;}addOption(val,txt);});
    if(cur && Array.prototype.some.call(el.options,function(o){return String(o.value)===String(cur)})) el.value=cur;
  };
})(window,document);