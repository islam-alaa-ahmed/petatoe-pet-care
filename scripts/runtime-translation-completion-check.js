const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else if(/\.(js|html)$/.test(e.name))out.push(p)}return out}
const storeCode=fs.readFileSync(path.join(root,'i18n/localization-center/dictionary-store.js'),'utf8');
const ctx={window:{dispatchEvent(){}},CustomEvent:function(){}};vm.createContext(ctx);vm.runInContext(storeCode,ctx);
const store=ctx.window.PETATOE_LOCALIZATION_CENTER_STORE;
const ar=(store.getPath('ar','runtimeSource')||{}),en=(store.getPath('en','runtimeSource')||{});
const used=new Map();
const rx=/\.translateRuntime\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
for(const file of walk(root)){const src=fs.readFileSync(file,'utf8');let m;rx.lastIndex=0;while((m=rx.exec(src))){const text=m[2].replace(/\\n/g,'\n').replace(/\\'/g,"'").replace(/\\"/g,'"');if(!/[\u0600-\u06FF]/.test(text))continue;if(!used.has(text))used.set(text,[]);used.get(text).push(path.relative(root,file));}}
const missing=[];for(const [text,files] of used){if(typeof ar[text]!=='string'||typeof en[text]!=='string'||/[\u0600-\u06FF]/.test(en[text]))missing.push({text,files:[...new Set(files)]});}
const release=fs.readFileSync(path.join(root,'RELEASE_VERSION.txt'),'utf8');
const runtime=fs.readFileSync(path.join(root,'i18n/localization-center/runtime.js'),'utf8');
const failures=[];
if(missing.length)failures.push('Missing runtime translations: '+missing.length);
if(!release.includes('PETATOE v9.4.21')||!release.includes('PETATOE_V9_4_21_ENTERPRISE_LOCALIZATION_FINALIZATION'))failures.push('Release metadata mismatch.');
if(!runtime.includes("VERSION='9.4.21-enterprise-localization-finalization'"))failures.push('Runtime version mismatch.');
const result={status:failures.length?'FAILED':'PASSED',usedRuntimePhrases:used.size,storedRuntimePhrases:Object.keys(en).length,missingRuntimePhrases:missing.length,missing};
console.log('Runtime Translation Completion: '+result.status);console.log(JSON.stringify(result,null,2));
if(failures.length){failures.forEach(x=>console.error('- '+x));process.exit(1);}
