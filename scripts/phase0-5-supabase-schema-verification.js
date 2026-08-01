#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'audit', 'phase0_5', 'PETATOE_PHASE0_5_SCHEMA_CONTRACT.json');
const TEXT_EXT = new Set(['.js','.mjs','.ts','.html','.sql']);
function walk(dir, out=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ent.name === '.git' || ent.name === 'node_modules') continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p,out); else if(TEXT_EXT.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}
function add(map,key,file){ if(!map[key]) map[key]=[]; const rel=path.relative(ROOT,file).replace(/\\/g,'/'); if(!map[key].includes(rel)) map[key].push(rel); }
const refs={tables:{},rpcs:{},edgeFunctions:{},storageBuckets:{}};
const defs={tables:{},views:{},functions:{},policies:{},triggers:{}};
const files=walk(ROOT);
for(const file of files){
  const src=fs.readFileSync(file,'utf8');
  for(const m of src.matchAll(/\.from\(\s*['"]([^'"]+)['"]\s*\)/g)) add(refs.tables,m[1],file);
  for(const m of src.matchAll(/\.rpc\(\s*['"]([^'"]+)['"]/g)) add(refs.rpcs,m[1],file);
  for(const m of src.matchAll(/functions\.invoke\(\s*['"]([^'"]+)['"]/g)) add(refs.edgeFunctions,m[1],file);
  for(const m of src.matchAll(/\/functions\/v1\/([a-zA-Z0-9_-]+)/g)) add(refs.edgeFunctions,m[1],file);
  for(const m of src.matchAll(/functionName\s*:\s*['"]([^'"]+)['"]/g)) add(refs.edgeFunctions,m[1],file);
  for(const m of src.matchAll(/storage\.from\(\s*['"]([^'"]+)['"]\s*\)/g)) add(refs.storageBuckets,m[1],file);
  if(path.extname(file).toLowerCase() !== '.sql') continue;
  for(const m of src.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-zA-Z0-9_]+)"?/gi)) add(defs.tables,m[1],file);
  for(const m of src.matchAll(/create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?"?([a-zA-Z0-9_]+)"?/gi)) add(defs.views,m[1],file);
  for(const m of src.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-zA-Z0-9_]+)"?/gi)) add(defs.functions,m[1],file);
  for(const m of src.matchAll(/create\s+policy\s+"?([^"\n]+?)"?\s+on\s+(?:public\.)?"?([a-zA-Z0-9_]+)"?/gi)) add(defs.policies,m[2],file);
  for(const m of src.matchAll(/create\s+trigger\s+"?([a-zA-Z0-9_]+)"?/gi)) add(defs.triggers,m[1],file);
}
const edgeRoot=path.join(ROOT,'supabase','functions');
const edgeDirs=fs.existsSync(edgeRoot)?fs.readdirSync(edgeRoot).filter(n=>fs.statSync(path.join(edgeRoot,n)).isDirectory()).sort():[];
const setDiff=(a,b)=>Object.keys(a).filter(x=>!Object.prototype.hasOwnProperty.call(b,x)).sort();
const contract={
  generatedAt:new Date().toISOString(),
  mode:'read-only-static-contract-audit',
  limitations:[
    'This audit does not connect to the live Supabase project.',
    'A missing CREATE TABLE file means the repository lacks a complete migration definition; it does not prove the live table is missing.',
    'RLS enablement and applied migrations must be verified against the live database using the generated read-only SQL.'
  ],
  counts:{
    scannedTextFiles:files.length,
    referencedTables:Object.keys(refs.tables).length,
    referencedRpcs:Object.keys(refs.rpcs).length,
    referencedEdgeFunctions:Object.keys(refs.edgeFunctions).length,
    sqlDefinedTables:Object.keys(defs.tables).length,
    sqlDefinedFunctions:Object.keys(defs.functions).length,
    sqlPolicyTables:Object.keys(defs.policies).length,
    edgeFunctionDirectories:edgeDirs.length
  },
  frontendReferences:refs,
  repositorySqlDefinitions:defs,
  edgeFunctionDirectories:edgeDirs,
  gaps:{
    referencedTablesWithoutRepositoryCreateDefinition:setDiff(refs.tables,defs.tables),
    referencedRpcsWithoutRepositoryFunctionDefinition:setDiff(refs.rpcs,defs.functions),
    referencedEdgeFunctionsWithoutDirectory:Object.keys(refs.edgeFunctions).filter(x=>!edgeDirs.includes(x)).sort(),
    sqlDefinedTablesWithoutDirectFrontendFromReference:setDiff(defs.tables,refs.tables),
    edgeDirectoriesWithoutDirectFunctionsInvokeReference:edgeDirs.filter(x=>!Object.prototype.hasOwnProperty.call(refs.edgeFunctions,x)).sort()
  }
};
fs.writeFileSync(OUT,JSON.stringify(contract,null,2)+'\n');
console.log('PETATOE Phase 0.5 Supabase schema contract audit: PASSED');
console.log(JSON.stringify(contract.counts,null,2));
console.log('Repository schema gaps:',contract.gaps.referencedTablesWithoutRepositoryCreateDefinition.length);
