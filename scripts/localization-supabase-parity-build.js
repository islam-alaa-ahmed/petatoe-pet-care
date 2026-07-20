#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const INDEX=path.join(ROOT,'index.html');
const OUT_JSON=path.join(ROOT,'LOCALIZATION_SUPABASE_PARITY_SNAPSHOT.json');
const OUT_SQL=path.join(ROOT,'petatoe_v9_4_23_supabase_localization_dictionary_parity_sync.sql');

function scriptSources(){
  const html=fs.readFileSync(INDEX,'utf8');
  const re=/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi;
  const all=[]; let m;
  while((m=re.exec(html))){
    const src=m[1].split('?')[0].replace(/^\.\//,'');
    if(src.startsWith('i18n/localization-center/')) all.push(src);
  }
  const excluded=new Set(['registry.js','cache.js','loader.js','runtime.js','consolidation.js']);
  return all.filter(src=>!excluded.has(path.basename(src)));
}
function createContext(){
  const listeners=new Map();
  class CustomEvent{constructor(type,init){this.type=type;this.detail=init&&init.detail;}}
  const window={
    PETATOE_I18N_DICTIONARIES:{},
    requestAnimationFrame(fn){if(typeof fn==='function')fn(0);return 0;},
    cancelAnimationFrame(){},
    addEventListener(type,fn,opt){const arr=listeners.get(type)||[];arr.push({fn,once:!!(opt&&opt.once)});listeners.set(type,arr);},
    removeEventListener(type,fn){listeners.set(type,(listeners.get(type)||[]).filter(x=>x.fn!==fn));},
    dispatchEvent(evt){const arr=(listeners.get(evt.type)||[]).slice();for(const item of arr)item.fn.call(window,evt);listeners.set(evt.type,(listeners.get(evt.type)||[]).filter(x=>!x.once));return true;}
  };
  const context={window,CustomEvent,console,setTimeout(){return 0;},clearTimeout(){},document:{readyState:'complete',addEventListener(){},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return [];},documentElement:{setAttribute(){},getAttribute(){return null;}},body:{classList:{add(){},remove(){},toggle(){}}}}};
  context.globalThis=context;context.self=window;
  return vm.createContext(context);
}
function flatten(value,prefix='',out={}){
  if(value===null||['string','number','boolean'].includes(typeof value)){if(prefix)out[prefix]=String(value??'');return out;}
  if(Array.isArray(value)){value.forEach((v,i)=>flatten(v,prefix?`${prefix}.${i}`:String(i),out));return out;}
  if(value&&typeof value==='object')Object.keys(value).sort().forEach(k=>flatten(value[k],prefix?`${prefix}.${k}`:k,out));
  return out;
}
function sqlLiteral(v){return `'${String(v).replace(/'/g,"''")}'`;}
function moduleOf(key){return key.split('.')[0]||'general';}
function sha(obj){return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');}

const context=createContext();
const loaded=[];
for(const src of scriptSources()){
  const full=path.join(ROOT,src);
  if(!fs.existsSync(full))throw new Error(`Missing catalog script: ${src}`);
  vm.runInContext(fs.readFileSync(full,'utf8'),context,{filename:src,timeout:5000});loaded.push(src);
}
const store=context.window.PETATOE_LOCALIZATION_CENTER_STORE;
const dictionaries=(store&&store.dictionaries)||context.window.PETATOE_I18N_DICTIONARIES||{};
const ar=flatten(dictionaries.ar||{}), en=flatten(dictionaries.en||{});
const arKeys=Object.keys(ar).sort(), enKeys=Object.keys(en).sort();
const missingAr=enKeys.filter(k=>!Object.prototype.hasOwnProperty.call(ar,k));
const missingEn=arKeys.filter(k=>!Object.prototype.hasOwnProperty.call(en,k));
const emptyAr=arKeys.filter(k=>!String(ar[k]).trim()), emptyEn=enKeys.filter(k=>!String(en[k]).trim());
const sourceMetadataArabic=enKeys.filter(k=>/^runtimeTemplates\.[^.]+\.source$/.test(k)&&/[\u0600-\u06FF]/.test(en[k]));
const arabicInEnglish=enKeys.filter(k=>!/^runtimeTemplates\.[^.]+\.source$/.test(k)&&/[\u0600-\u06FF]/.test(en[k]));
const keys=[...new Set([...arKeys,...enKeys])].sort();
const duplicateKeys=keys.length-(new Set(keys)).size;
const valid=missingAr.length===0&&missingEn.length===0&&emptyAr.length===0&&emptyEn.length===0&&arabicInEnglish.length===0&&duplicateKeys===0;
const snapshot={
  generatedAt:new Date().toISOString(),source:'index.html localization-center script order',loadedCatalogs:loaded,
  counts:{activeKeys:keys.length,arabicValues:arKeys.length,englishValues:enKeys.length,duplicateKeys,missingArabic:missingAr.length,missingEnglish:missingEn.length,emptyArabic:emptyAr.length,emptyEnglish:emptyEn.length,arabicTextInEnglish:arabicInEnglish.length,sourceMetadataArabic:sourceMetadataArabic.length},
  hashes:{arabic:sha(ar),english:sha(en),combined:sha({ar,en})},
  issues:{missingArabic:missingAr,missingEnglish:missingEn,emptyArabic:emptyAr,emptyEnglish:emptyEn,arabicTextInEnglish:arabicInEnglish,sourceMetadataArabic},
  valid
};
fs.writeFileSync(OUT_JSON,JSON.stringify(snapshot,null,2)+'\n');
if(!valid){console.error(JSON.stringify(snapshot,null,2));process.exit(1);}
const rows=keys.map(k=>`(${sqlLiteral(k)},${sqlLiteral(moduleOf(k))},${sqlLiteral(ar[k])},${sqlLiteral(en[k])})`).join(',\n');
const sql=`-- PETATOE v9.4.23 — Supabase Localization Dictionary Parity Sync\n-- Generated by scripts/localization-supabase-parity-build.js from index.html catalog order.\n-- Active keys: ${keys.length}; Arabic values: ${arKeys.length}; English values: ${enKeys.length}\n-- Combined SHA-256: ${snapshot.hashes.combined}\n\nbegin;\n\ninsert into public.localization_languages(code,name,english_name,direction,locale,is_enabled,is_default,sort_order) values\n('ar','العربية','Arabic','rtl','ar-SA',true,true,10),\n('en','English','English','ltr','en-SA',true,false,20),\n('fil','Filipino','Filipino','ltr','fil-PH',false,false,30)\non conflict (code) do update set name=excluded.name,english_name=excluded.english_name,direction=excluded.direction,locale=excluded.locale,updated_at=now();\n\ncreate temporary table petatoe_localization_sync(translation_key text primary key,module text,ar_text text,en_text text) on commit drop;\ninsert into petatoe_localization_sync(translation_key,module,ar_text,en_text) values\n${rows};\n\ninsert into public.localization_keys(translation_key,module,source_text,description,is_system,is_active,updated_at)\nselect translation_key,module,nullif(ar_text,''),'Synchronized from PETATOE v9.4.23 production dictionary',true,true,now() from petatoe_localization_sync\non conflict (translation_key) do update set module=excluded.module,source_text=excluded.source_text,is_active=true,updated_at=now();\n\ninsert into public.localization_values(key_id,language_code,translated_text,status,version,approved_at,updated_at)\nselect k.id,'ar',s.ar_text,'approved',coalesce(v.version,0)+1,now(),now()\nfrom petatoe_localization_sync s join public.localization_keys k using(translation_key)\nleft join public.localization_values v on v.key_id=k.id and v.language_code='ar'\nwhere s.ar_text<>''\non conflict (key_id,language_code) do update set translated_text=excluded.translated_text,status='approved',version=case when public.localization_values.translated_text is distinct from excluded.translated_text then public.localization_values.version+1 else public.localization_values.version end,approved_at=now(),updated_at=now();\n\ninsert into public.localization_values(key_id,language_code,translated_text,status,version,approved_at,updated_at)\nselect k.id,'en',s.en_text,'approved',coalesce(v.version,0)+1,now(),now()\nfrom petatoe_localization_sync s join public.localization_keys k using(translation_key)\nleft join public.localization_values v on v.key_id=k.id and v.language_code='en'\nwhere s.en_text<>''\non conflict (key_id,language_code) do update set translated_text=excluded.translated_text,status='approved',version=case when public.localization_values.translated_text is distinct from excluded.translated_text then public.localization_values.version+1 else public.localization_values.version end,approved_at=now(),updated_at=now();\n\n-- Only deactivate obsolete system keys. User-created keys are preserved.\nupdate public.localization_keys k set is_active=false,updated_at=now()\nwhere k.is_system=true and k.is_active=true and not exists(select 1 from petatoe_localization_sync s where s.translation_key=k.translation_key);\n\n-- Remove stale pending rows where an approved value now exists.\ndelete from public.localization_queue q using public.localization_keys k,public.localization_values v\nwhere q.translation_key=k.translation_key and v.key_id=k.id and v.language_code=q.target_language and v.status='approved' and q.status='pending';\n\ncommit;\n\n-- Exact parity verification. Expected: all booleans true and all issue counts zero.\nwith expected as (select ${keys.length}::bigint active_keys,${arKeys.length}::bigint ar_values,${enKeys.length}::bigint en_values),\nactual as (\n select\n  (select count(*) from public.localization_keys where is_active and is_system) active_system_keys,\n  (select count(*) from public.localization_values v join public.localization_keys k on k.id=v.key_id where k.is_active and k.is_system and v.status='approved' and v.language_code='ar') approved_ar,\n  (select count(*) from public.localization_values v join public.localization_keys k on k.id=v.key_id where k.is_active and k.is_system and v.status='approved' and v.language_code='en') approved_en,\n  (select count(*) from public.localization_queue q where q.status='pending' and exists(select 1 from public.localization_keys k where k.is_active and k.translation_key=q.translation_key)) pending_active,\n  (select count(*) from public.localization_keys where is_active and is_system and btrim(coalesce(source_text,''))='') empty_source,\n  (select count(*) from public.localization_values v join public.localization_keys k on k.id=v.key_id where k.is_active and k.is_system and v.status='approved' and btrim(coalesce(v.translated_text,''))='') empty_approved\n)\nselect jsonb_build_object(\n 'expected_active_keys',e.active_keys,'actual_active_system_keys',a.active_system_keys,'keys_match',a.active_system_keys=e.active_keys,\n 'expected_ar',e.ar_values,'actual_approved_ar',a.approved_ar,'arabic_match',a.approved_ar=e.ar_values,\n 'expected_en',e.en_values,'actual_approved_en',a.approved_en,'english_match',a.approved_en=e.en_values,\n 'pending_active',a.pending_active,'empty_source',a.empty_source,'empty_approved',a.empty_approved,\n 'parity_ok',a.active_system_keys=e.active_keys and a.approved_ar=e.ar_values and a.approved_en=e.en_values and a.pending_active=0 and a.empty_source=0 and a.empty_approved=0,\n 'dictionary_sha256',${sqlLiteral(snapshot.hashes.combined)}\n) as localization_parity_result from expected e cross join actual a;\n`;
fs.writeFileSync(OUT_SQL,sql);
console.log(JSON.stringify(snapshot,null,2));
