const fs=require('fs');
function must(ok,msg){if(!ok){throw new Error(msg)}}
const html=fs.readFileSync('index.html','utf8');
const src=fs.readFileSync('maintenance/maintenance-center.js','utf8');
const dict=fs.readFileSync('i18n/maintenance-source.js','utf8');
must(/i18n\/maintenance-source\.js\?v=[^"']+/.test(html),'maintenance dictionary is not loaded');
must(html.indexOf('i18n/maintenance-source.js')<html.indexOf('maintenance/maintenance-center.js'),'maintenance dictionary must load before center');
must(src.indexOf("function mt(key, fallback)")>=0,'maintenance source helper missing');
must(src.indexOf("dir=\"' + (isEnglish ? 'ltr' : 'rtl')")>=0,'dynamic maintenance direction missing');
[
 'نسخ تقرير الصيانة','تم نسخ التقرير بنجاح','لم يسمح المتصفح بالنسخ التلقائي','🛠️ صيانة','مركز صيانة وتشخيص النظام','تعذر فتح مركز الصيانة. راجع Console.'
].forEach(v=>must(src.indexOf("'"+v+"'")<0 && src.indexOf('"'+v+'"')<0,'direct maintenance shell source remains: '+v));
const enBlock=(dict.match(/root\.en\.maintenanceSource=\{([\s\S]*?)\n  \};/)||[])[1]||'';
must(enBlock && !/[\u0600-\u06FF]/.test(enBlock),'Arabic characters found in English maintenance dictionary');
const keys=[...src.matchAll(/mt\('([^']+)'/g)].map(m=>m[1]);
const arBlock=(dict.match(/root\.ar\.maintenanceSource=\{([\s\S]*?)\n  \};/)||[])[1]||'';
for(const key of keys){must(new RegExp("(?:^|[,\\n])\\s*"+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"\\s*:").test(arBlock),'Arabic key missing: '+key);must(new RegExp("(?:^|[,\\n])\\s*"+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"\\s*:").test(enBlock),'English key missing: '+key)}
console.log('Source Migration Pack 5 Check: Passed');
console.log('Maintenance shell keys covered:',new Set(keys).size);
