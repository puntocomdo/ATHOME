// Storage for accounts and progress. Uses Supabase when SUPABASE_URL and SUPABASE_SERVICE_KEY are set, otherwise local files (for testing).
require('./loadenv');
const fs=require('fs'),DD=process.env.DATA_DIR||__dirname+'/data',SB=!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_KEY),base=(process.env.SUPABASE_URL||'').replace(/\/$/,''),enc=encodeURIComponent;
async function sb(method,path,body,prefer){const k=process.env.SUPABASE_SERVICE_KEY;
 const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:k,Authorization:'Bearer '+k,'content-type':'application/json',Prefer:prefer||'return=representation'},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw new Error('Supabase '+r.status+': '+(await r.text()).slice(0,200));const t=await r.text();return t?JSON.parse(t):[]}
const rf=(n,d)=>{try{return JSON.parse(fs.readFileSync(DD+'/'+n,'utf8'))}catch(e){return d}},wf=(n,v)=>{fs.mkdirSync(DD,{recursive:true});fs.writeFileSync(DD+'/'+n,JSON.stringify(v,null,1))};
exports.mode=SB?'supabase':'file';
exports.accounts=async()=>SB?sb('GET','accounts?select=*&order=created.desc'):rf('accounts.json',[]);
exports.accountBy=async(col,val)=>SB?(await sb('GET',`accounts?${col}=eq.${enc(val)}&select=*&limit=1`))[0]:rf('accounts.json',[]).find(r=>r[col]==val);
exports.saveAccount=async r=>{if(SB){await sb('POST','accounts?on_conflict=id',[r],'resolution=merge-duplicates,return=minimal');return}const a=rf('accounts.json',[]),i=a.findIndex(x=>x.id==r.id);i<0?a.push(r):a[i]=r;wf('accounts.json',a)};
exports.progress=async u=>SB?((await sb('GET',`progress?username=eq.${enc(u)}&select=*&limit=1`))[0]||null):(rf('progress.json',{})[u]||null);
exports.saveProgress=async(u,o)=>{if(SB){await sb('POST','progress?on_conflict=username',[{username:u,grade:o.grade,school:o.school,data:o.data,updated:o.updated}],'resolution=merge-duplicates,return=minimal');return}const a=rf('progress.json',{});a[u]=o;wf('progress.json',a)};
exports.allProgress=async()=>{if(SB){const o={};for(const r of await sb('GET','progress?select=*'))o[r.username]={grade:r.grade,school:r.school,data:r.data,updated:r.updated};return o}return rf('progress.json',{})};
exports.renameProgress=async(a,b)=>{const p=await exports.progress(a);if(!p)return;await exports.saveProgress(b,p);if(SB)await sb('DELETE',`progress?username=eq.${enc(a)}`,null,'return=minimal');else{const x=rf('progress.json',{});delete x[a];wf('progress.json',x)}};
