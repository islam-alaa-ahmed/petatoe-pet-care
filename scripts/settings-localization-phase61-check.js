#!/usr/bin/env node
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const store={modules:{},registerModule(name,d){this.modules[name]=d;return true;}};
const context={window:{PETATOE_LOCALIZATION_CENTER_STORE:store,addEventListener(){},dispatchEvent(){}},CustomEvent:function(){}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'i18n/localization-center/settings-phase61.js'),'utf8'),context);
const cat=store.modules.settingsPhase61;
function flatten(o,p='',r={}){Object.keys(o||{}).forEach(k=>{const v=o[k],q=p?p+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flatten(v,q,r);else r[q]=v});return r}
const ar=flatten(cat.ar),en=flatten(cat.en),missingAr=Object.keys(en).filter(k=>!ar[k]),missingEn=Object.keys(ar).filter(k=>!en[k]);
const permissions=fs.readFileSync(path.join(root,'settings/permissions.js'),'utf8');
const required=["settingsPhase61.permissions.","function tr(","screens.'+k+'.title","modules.'+m.id+'.title","controls.saveChanges","messages.saved"];
const failures=[];
required.forEach(x=>{if(!permissions.includes(x))failures.push('Missing consumer marker: '+x)});
if(missingAr.length)failures.push('Missing Arabic keys: '+missingAr.join(', '));
if(missingEn.length)failures.push('Missing English keys: '+missingEn.join(', '));
const oldUi=["'🔐 إدارة الصلاحيات'","'حفظ التغييرات'","'قالب سائق/جرومر'","'إرجاع الافتراضي'","'الشاشة / الوظيفة'"];
oldUi.forEach(x=>{if(permissions.includes(x))failures.push('Hardcoded permissions UI remains: '+x)});
console.log(JSON.stringify({phase:'6.1',module:'settingsPhase61',arabicKeys:Object.keys(ar).length,englishKeys:Object.keys(en).length,missingArabic:missingAr.length,missingEnglish:missingEn.length,failures},null,2));
if(failures.length)process.exit(1);
