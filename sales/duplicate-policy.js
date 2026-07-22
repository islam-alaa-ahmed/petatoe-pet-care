/* PETATOE v10 — Unified Sales Duplicate Policy */
(function(){
  'use strict';
  if(window.__PETATOE_SALES_DUPLICATE_POLICY_SINGLETON__) return;
  window.__PETATOE_SALES_DUPLICATE_POLICY_SINGLETON__=true;

  function safeNum(v){
    try{return typeof window.parseNum==='function'?window.parseNum(v):(Number(String(v==null?'':v).replace(/,/g,''))||0);}catch(_e){return 0;}
  }
  function normText(v){
    return String(v==null?'':v).trim().replace(/\s+/g,' ').replace(/ي/g,'ى').replace(/ة/g,'ه').toLowerCase();
  }
  function normalizeInvoice(v){
    var s=String(v==null?'':v).trim();
    if(!s)return '';
    s=s.replace(/[٠-٩]/g,function(d){return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d));})
      .replace(/[۰-۹]/g,function(d){return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));})
      .replace(/\u00a0/g,' ')
      .replace(/,/g,'')
      .replace(/\s+/g,'')
      .trim();
    if(/^\d+\.0+$/.test(s))s=s.replace(/\.0+$/,'');
    if(/^0+\d+$/.test(s))s=s.replace(/^0+(?=\d)/,'');
    return normText(s);
  }
  function lineValue(row){
    row=row||{};
    return safeNum(row.totalInc||row.total||row.totalWithVat||row.amount||row.lineTotal||row.price).toFixed(2);
  }
  function key(row){
    row=row||{};
    return [
      normalizeInvoice(row.invoice!=null?row.invoice:row.invoice_no),
      normText(row.client!=null?row.client:row.customer),
      normText(row.item!=null?row.item:(row.service!=null?row.service:row.item_name)),
      normText(row.van||row.vehicle||row.car||row.carName||row.vehicleName),
      lineValue(row)
    ].join('|');
  }
  function findDuplicates(rows,existingRows,options){
    rows=Array.isArray(rows)?rows:[];
    existingRows=Array.isArray(existingRows)?existingRows:[];
    options=options||{};
    var excludedInvoices=(Array.isArray(options.excludeInvoices)?options.excludeInvoices:[options.excludeInvoice]).filter(Boolean).map(normalizeInvoice);
    var excluded={};excludedInvoices.forEach(function(v){excluded[v]=true;});
    var seenExisting={};
    existingRows.forEach(function(row,index){
      var inv=normalizeInvoice(row&&((row.invoice!=null)?row.invoice:row.invoice_no));
      if(excluded[inv])return;
      var k=key(row);
      if(k&&!seenExisting[k])seenExisting[k]={row:row,index:index};
    });
    var seenBatch={};
    var duplicates=[];
    rows.forEach(function(row,index){
      var k=key(row);
      if(!k)return;
      if(seenBatch[k])duplicates.push({type:'within-batch',index:index,firstIndex:seenBatch[k].index,row:row,key:k});
      else seenBatch[k]={index:index,row:row};
      if(seenExisting[k])duplicates.push({type:'existing',index:index,existingIndex:seenExisting[k].index,row:row,existingRow:seenExisting[k].row,key:k});
    });
    return duplicates;
  }
  function validate(rows,existingRows,options){
    var duplicates=findDuplicates(rows,existingRows,options);
    return {ok:duplicates.length===0,duplicates:duplicates};
  }

  window.PETATOESalesDuplicatePolicy={
    version:'1.0.0',
    normalizeText:normText,
    normalizeInvoice:normalizeInvoice,
    recordKey:key,
    findDuplicates:findDuplicates,
    validate:validate
  };
  window.dispatchEvent(new CustomEvent('petatoe:sales-duplicate-policy-ready'));
})();
