const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
const runtime=read('i18n/global-screen-translator.js');
const html=read('index.html');
const version=read('RELEASE_VERSION.txt');
const required=[
  'installSourceSetterBridge()',
  "patchPropertySetter(window.Node&&Node.prototype,'textContent')",
  "patchPropertySetter(window.Element&&Element.prototype,'innerHTML')",
  'wrappedInsertAdjacentHTML',
  'wrappedSetAttribute',
  "mode:'final-residual-source-cleanup'"
];
const missing=required.filter(x=>!runtime.includes(x));
if(missing.length){console.error('Missing runtime bridge markers:',missing);process.exit(1);}
if(!html.includes("PETATOE_RELEASE_VERSION='v9.3.5'"))throw new Error('index release version not synchronized');
if(!html.includes('9.3.5-final-residual-localization-cleanup'))throw new Error('cache token not synchronized');
if(!version.includes('PETATOE v9.3.5'))throw new Error('RELEASE_VERSION not synchronized');
console.log('PASS final residual localization cleanup guard');
