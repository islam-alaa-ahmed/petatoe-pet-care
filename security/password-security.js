/* PETATOE v6.4.71 - Security Patch S1 Password Hashing
   Purpose: prevent storing newly-entered passwords as plain text and migrate legacy plain-text values safely.
   Notes: local/offline browser hashing is not a replacement for backend authentication, but it removes readable password storage from PETATOE user records. */
(function(){
  'use strict';
  if(window.PETATOEPasswordSecurity&&window.PETATOEPasswordSecurity.__v==='6.4.71') return;
  function now(){return new Date().toISOString()}
  function salt(){return 'pet_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,14)}
  function rrot(n,x){return (x>>>n)|(x<<(32-n))}
  function sha256(ascii){
    var mathPow=Math.pow,maxWord=mathPow(2,32),lengthProperty='length',i,j,result='',words=[],asciiBitLength=ascii[lengthProperty]*8,hash=sha256.h=sha256.h||[],k=sha256.k=sha256.k||[],primeCounter=k[lengthProperty],isComposite={};
    for(var candidate=2;primeCounter<64;candidate++){if(!isComposite[candidate]){for(i=0;i<313;i+=candidate)isComposite[i]=candidate;hash[primeCounter]=(mathPow(candidate,.5)*maxWord)|0;k[primeCounter++]=(mathPow(candidate,1/3)*maxWord)|0}}
    hash=hash.slice(0);
    ascii+='\x80';while(ascii[lengthProperty]%64-56)ascii+='\x00';
    for(i=0;i<ascii[lengthProperty];i++){j=ascii.charCodeAt(i);if(j>>8)return '';words[i>>2]|=j<<((3-i)%4)*8}
    words[words[lengthProperty]]=((asciiBitLength/maxWord)|0);words[words[lengthProperty]]=asciiBitLength;
    for(j=0;j<words[lengthProperty];){var w=words.slice(j,j+=16),oldHash=hash.slice(0);for(i=0;i<64;i++){var w15=w[i-15],w2=w[i-2],a=hash[0],e=hash[4],temp1=hash[7]+(rrot(6,e)^rrot(11,e)^rrot(25,e))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:((w[i-16]+(rrot(7,w15)^rrot(18,w15)^(w15>>>3))+w[i-7]+(rrot(17,w2)^rrot(19,w2)^(w2>>>10)))|0)),temp2=(rrot(2,a)^rrot(13,a)^rrot(22,a))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));hash=[(temp1+temp2)|0].concat(hash);hash[4]=(hash[4]+temp1)|0;hash.pop()}for(i=0;i<8;i++)hash[i]=(hash[i]+oldHash[i])|0}
    for(i=0;i<8;i++){for(j=3;j+1;j--){var b=(hash[i]>>(j*8))&255;result+=((b<16)?0:'')+b.toString(16)}}return result;
  }
  function normalizePlain(p){return String(p==null?'':p)}
  function hashPassword(password, existingSalt){var s=existingSalt||salt(), h=sha256(s+'|'+normalizePlain(password)); for(var i=0;i<499;i++){h=sha256(s+'|'+h+'|'+i)} return {algorithm:'sha256-iterated',iterations:500,salt:s,hash:h,createdAt:now(),version:'6.4.71'} }
  function hasCredential(u){return !!(u&&(u.passwordHash||u.passwordDigest||u.passwordEncrypted||u.passwordHashMeta));}
  function isPlainPasswordValue(v){return typeof v==='string'&&v.length>0&&v.indexOf('$2')!==0&&v.indexOf('sha256:')!==0}
  function setPassword(u,password){if(!u)return u;var p=normalizePlain(password);if(!p)return u;u.passwordHash=hashPassword(p);u.passwordUpdatedAt=now();delete u.password;delete u.passwordPlain;return u}
  function migrateUser(u){if(!u||typeof u!=='object')return false;var changed=false;if(isPlainPasswordValue(u.password)&&!hasCredential(u)){setPassword(u,u.password);u.passwordMigratedAt=now();changed=true}else if(Object.prototype.hasOwnProperty.call(u,'password')&&u.password!==''){delete u.password;changed=true}else if(u.password===''){delete u.password;changed=true}return changed}
  function sanitizeUsers(list){var changed=false;if(Array.isArray(list)){list.forEach(function(u){if(migrateUser(u))changed=true})}return changed}
  function saveUsers(list){sanitizeUsers(list);return list}
  function migrateStoredUsers(){return false}
  function migrateSecurity(){return false}
  function verifyPassword(password,u){if(!u||!u.passwordHash)return false;var meta=u.passwordHash;var h=hashPassword(password,meta.salt);return !!(h.hash&&h.hash===meta.hash)}
  window.PETATOEPasswordSecurity={__v:'6.4.71',hashPassword:hashPassword,setPassword:setPassword,hasCredential:hasCredential,migrateUser:migrateUser,sanitizeUsers:sanitizeUsers,saveUsers:saveUsers,migrateStoredUsers:migrateStoredUsers,migrateSecurity:migrateSecurity,verifyPassword:verifyPassword};
})();
