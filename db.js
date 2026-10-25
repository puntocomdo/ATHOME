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

// ---------- words (editable from the admin Words page) ----------
const wclean=r=>({id:r.id,lang:String(r.lang||'en').toLowerCase().startsWith('es')?'es':'en',grade:Math.min(5,Math.max(1,parseInt(r.grade)||1)),unit:Math.max(1,parseInt(r.unit)||1),week:Math.max(1,parseInt(r.week)||1),school:String(r.school||'').trim().slice(0,80),word:String(r.word||'').trim().toLowerCase().slice(0,60),definition:String(r.definition||'').trim().slice(0,400),sentence:String(r.sentence||'').trim().slice(0,400),photo:String(r.photo||'').trim().slice(0,300),sight:r.sight===true||r.sight==='true'||r.sight===1||r.sight==='1',active:!(r.active===false||r.active==='false'||r.active===0||r.active==='0'),updated:Date.now()});
exports.cleanWord=wclean;
const KEY=w=>[w.lang,w.grade,w.unit,w.week,w.word,w.school].join('|');
const ORDER='order=lang.asc,grade.asc,unit.asc,week.asc,word.asc';
const cnt=async f=>{const k=process.env.SUPABASE_SERVICE_KEY,r=await fetch(`${base}/rest/v1/words?select=id&limit=1${f}`,{headers:{apikey:k,Authorization:'Bearer '+k,Prefer:'count=exact'}});if(!r.ok)throw new Error('Supabase '+r.status);return +((r.headers.get('content-range')||'').split('/')[1])||0};
const INC='&or='+enc('(definition.eq.,sentence.eq.)'),NOP='&photo=eq.&sight=eq.false&active=eq.true';
exports.words=async({lang,grade,q,limit=100,offset=0,incomplete,nophoto})=>{limit=Math.min(1000,Math.max(1,+limit||100));offset=Math.max(0,+offset||0);
 if(SB){let f='';if(lang)f+=`&lang=eq.${enc(lang)}`;if(grade)f+=`&grade=eq.${+grade}`;if(nophoto)f+=NOP;
  const t=q?String(q).replace(/[(),*%]/g,' ').trim():'';
  if(t&&incomplete)f+='&and='+enc(`(or(definition.eq.,sentence.eq.),or(word.ilike.*${t}*,definition.ilike.*${t}*,sentence.ilike.*${t}*))`);
  else if(incomplete)f+=INC;else if(t)f+=`&or=${enc(`(word.ilike.*${t}*,definition.ilike.*${t}*,sentence.ilike.*${t}*)`)}`;
  const k=process.env.SUPABASE_SERVICE_KEY,r=await fetch(`${base}/rest/v1/words?select=*&${ORDER}&limit=${limit}&offset=${offset}${f}`,{headers:{apikey:k,Authorization:'Bearer '+k,Prefer:'count=exact'}});
  if(!r.ok)throw new Error('Supabase '+r.status+': '+(await r.text()).slice(0,200));const cr=r.headers.get('content-range')||'';return{rows:await r.json(),total:+(cr.split('/')[1])||0}}
 let a=rf('words.json',[]);if(lang)a=a.filter(w=>w.lang==lang);if(grade)a=a.filter(w=>w.grade==+grade);
 if(incomplete)a=a.filter(w=>!w.definition||!w.sentence);if(nophoto)a=a.filter(w=>!w.photo&&!w.sight&&w.active!==false);
 if(q){const t=String(q).toLowerCase();a=a.filter(w=>[w.word,w.definition,w.sentence].join(' ').toLowerCase().includes(t))}
 a.sort((x,y)=>(x.lang+x.grade*100+x.unit*10+x.week).toString().localeCompare((y.lang+y.grade*100+y.unit*10+y.week).toString())||x.word.localeCompare(y.word));return{rows:a.slice(offset,offset+limit),total:a.length}};
exports.stats=async()=>{if(SB)return{total:await cnt(''),incomplete:await cnt(INC),nophoto:await cnt(NOP)};const a=rf('words.json',[]);return{total:a.length,incomplete:a.filter(w=>!w.definition||!w.sentence).length,nophoto:a.filter(w=>!w.photo&&!w.sight&&w.active!==false).length}};
exports.countNoPhoto=async()=>SB?cnt(NOP):rf('words.json',[]).filter(w=>!w.photo&&!w.sight&&w.active!==false).length;
exports.noPhotoWords=async n=>SB?sb('GET',`words?select=id,lang,word&order=id.asc&limit=${+n}${NOP}`):rf('words.json',[]).filter(w=>!w.photo&&!w.sight&&w.active!==false).slice(0,n);
exports.wordById=async id=>SB?((await sb('GET',`words?id=eq.${+id}&select=*&limit=1`))[0]||null):(rf('words.json',[]).find(v=>v.id==id)||null);
const patch=async(id,o)=>{if(SB){await sb('PATCH',`words?id=eq.${+id}`,Object.assign({updated:Date.now()},o),'return=minimal');return}const a=rf('words.json',[]),x=a.find(v=>v.id==id);if(x)Object.assign(x,o);wf('words.json',a)};
exports.setPhoto=(id,photo)=>patch(id,{photo,sight:false});exports.markSight=id=>patch(id,{sight:true});
exports.uploadPhoto=async(name,buf)=>{if(SB){const k=process.env.SUPABASE_SERVICE_KEY,up=()=>fetch(`${base}/storage/v1/object/word-photos/${enc(name)}`,{method:'POST',headers:{apikey:k,Authorization:'Bearer '+k,'content-type':'image/jpeg','x-upsert':'true'},body:buf});
  let r=await up();if(!r.ok){await fetch(base+'/storage/v1/bucket',{method:'POST',headers:{apikey:k,Authorization:'Bearer '+k,'content-type':'application/json'},body:JSON.stringify({id:'word-photos',name:'word-photos',public:true})});r=await up()}
  if(!r.ok)throw new Error('Could not save the photo: '+(await r.text()).slice(0,120));return `${base}/storage/v1/object/public/word-photos/${enc(name)}`}
 const dir=__dirname+'/public/photos';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/'+name,buf);return name};
exports.saveWord=async r=>{const w=wclean(r);if(!w.word)throw new Error('Please type the word.');
 if(SB){if(r.id){const o=await sb('PATCH',`words?id=eq.${+r.id}`,Object.assign({},w,{id:undefined}));return o[0]||null}
  const o=await sb('POST','words?on_conflict=lang,grade,unit,week,word,school',[Object.assign({},w,{id:undefined})],'resolution=merge-duplicates,return=representation');return o[0]||null}
 const a=rf('words.json',[]);let x=r.id?a.find(v=>v.id==r.id):a.find(v=>KEY(v)==KEY(w));
 if(a.some(v=>KEY(v)==KEY(w)&&(!x||v.id!=x.id)))throw new Error('That word already exists in that unit and week.');
 if(x)Object.assign(x,w,{id:x.id});else{x=Object.assign(w,{id:a.reduce((m,v)=>Math.max(m,v.id),0)+1});a.push(x)}wf('words.json',a);return x};
exports.importWords=async rows=>{const ws=rows.map(wclean).filter(w=>w.word),seen={};for(const w of ws)seen[KEY(w)]=w;const u=Object.values(seen);
 // blank definition/sentence/photo never erase what is already saved
 const slim=w=>{const o={lang:w.lang,grade:w.grade,unit:w.unit,week:w.week,school:w.school,word:w.word,updated:w.updated};if(w.definition)o.definition=w.definition;if(w.sentence)o.sentence=w.sentence;if(w.photo)o.photo=w.photo;if(w.sight)o.sight=true;if(!w.active)o.active=false;return o};
 if(SB){const g={};for(const w of u){const o=slim(w),k=Object.keys(o).join();(g[k]=g[k]||[]).push(o)}
  for(const l of Object.values(g))for(let i=0;i<l.length;i+=300)await sb('POST','words?on_conflict=lang,grade,unit,week,word,school',l.slice(i,i+300),'resolution=merge-duplicates,return=minimal');return u.length}
 const a=rf('words.json',[]);let id=a.reduce((m,v)=>Math.max(m,v.id),0);for(const w of u){const o=slim(w),x=a.find(v=>KEY(v)==KEY(w));if(x)Object.assign(x,o);else a.push(Object.assign({definition:'',sentence:'',photo:'',sight:false,active:true},o,{id:++id}))}wf('words.json',a);return u.length};
exports.deleteWord=async id=>{if(SB){await sb('DELETE',`words?id=eq.${+id}`,null,'return=minimal');return}wf('words.json',rf('words.json',[]).filter(v=>v.id!=id))};
const imgUrl=p=>!p?'':/^(https?:)?\//.test(p)?p:'/photos/'+p.replace(/^photos\//,'');
exports.wordsFor=async(grade,school)=>{let all=[];
 if(SB){for(let off=0;;off+=1000){const b=await sb('GET',`words?select=lang,unit,week,school,word,definition,sentence,photo,sight&grade=eq.${+grade}&active=eq.true&${ORDER}&limit=1000&offset=${off}`);all=all.concat(b);if(b.length<1000)break}}
 else all=rf('words.json',[]).filter(w=>w.grade==+grade&&w.active!==false);
 all=all.filter(w=>!w.school||w.school==school);const tot={},ok={};
 for(const w of all){const k=w.lang+w.unit+'-'+w.week;tot[k]=(tot[k]||0)+1;ok[k]=(ok[k]||0)+(w.definition&&w.sentence?1:0)}
 const out={en:{},es:{}};
 for(const w of all){const k=w.lang+w.unit+'-'+w.week;if(ok[k]!=tot[k])continue;const g=out[w.lang]||(out[w.lang]={}),wk=w.unit+'-'+w.week,o={w:w.word,d:w.definition,s:w.sentence};if(w.photo)o.img=imgUrl(w.photo);if(w.school)o.sc=w.school;if(w.sight)o.sg=1;(g[wk]=g[wk]||[]).push(o)}
 return out};
