'use strict';
const fs=require('fs');
function fail(msg){console.error('Source Migration Pack 7 Check: Failed\n'+msg);process.exit(1)}
const engine=fs.readFileSync('operations/operations-legacy-engine.js','utf8');
const dict=fs.readFileSync('i18n/operations-source.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const required=['selectType','selectSize','selectService','selectAnimalType','selectBreed','enterNewName','customerName','mobile','address','code','name','assignmentDisabled','assignmentEnabled','serviceName','price','edit','delete','selectGroomerOption','selectDriverOption','disabled','active','enable','disable','deleteAssignment','noVehicleAssignments','noBreeds','select','animalNumber','allAnimals','applyServiceTo','unitServicePrice','serviceNetAfterDiscount','selectTime','editAppointmentTitle','addAppointmentTitle','appointmentCreatedFromManagement','noServicesUploadOrAdd','noCustomerData','petNameExample'];
for(const k of required){
  const uses=(engine.match(new RegExp("opT\\('"+k+"'",'g'))||[]).length;
  if(!uses)fail('Runtime key is not used: '+k);
  const defs=(dict.match(new RegExp(k+":",'g'))||[]).length;
  if(defs!==2)fail('Dictionary key must exist in Arabic and English: '+k+' ('+defs+')');
}
const forbidden=[
  "prompt('اكتب الاسم الجديد'","prompt('اسم العميل'","prompt('الجوال'","prompt('العنوان'",
  '>تعديل</button>','>حذف</button>','>حذف الربط</button>','لا توجد خدمات. ارفع ملف Excel أو أضف خدمة يدويًا.',
  'لا توجد بيانات عملاء','لا توجد ربط سيارات حتى الآن','لا توجد سلالات','placeholder="مثال: Max"',
  "t.textContent='✏️ تعديل موعد'","t.textContent='➕ إضافة موعد جديد'"
];
for(const text of forbidden){if(engine.includes(text))fail('Direct Arabic UI source remains: '+text)}
if(!/i18n\/operations-source\.js\?v=9\.2\.(?:8|9)-source-migration-pack(?:7|8)/.test(index))fail('Operations dictionary cache token is not a valid Pack 7+ version');
if(!/operations\/operations-legacy-engine\.js\?v=9\.2\.(?:8|9)-source-migration-pack(?:7|8)/.test(index))fail('Operations engine cache token is not a valid Pack 7+ version');
const enMatch=dict.match(/var en=\{([\s\S]*?)\n  \};/);
if(!enMatch)fail('English dictionary not found');
if(/[\u0600-\u06FF]/.test(enMatch[1]))fail('Arabic characters found inside English operations dictionary');
console.log('Source Migration Pack 7 Check: Passed');
console.log('Operations dynamic form keys covered:',required.length);
console.log('Direct Arabic UI patterns remaining:',0);
