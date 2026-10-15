const fs=require('fs'),crypto=require('crypto'),SRC=__dirname+'/data/',D=process.env.VERCEL?'/tmp/vocab-data/':SRC,PH=process.env.VERCEL?'/tmp/photos/':__dirname+'/public/photos/';
try{fs.mkdirSync(D,{recursive:true})}catch(e){}
exports.parseCsv=t=>{const rows=[];let r=[],c='',q=false;t=t.replace(/^\uFEFF/,'');
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch=='"'&&t[i+1]=='"'){c+='"';i++}else if(ch=='"')q=false;else c+=ch}
  else if(ch=='"')q=true;else if(ch==','){r.push(c);c=''}
  else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';if(r.some(x=>x))rows.push(r);r=[]}else c+=ch}
 if(c||r.length){r.push(c);rows.push(r)}return rows};
exports.toCsv=rows=>rows.map(r=>r.map(x=>/[",\n]/.test(String(x))?'"'+String(x).replace(/"/g,'""')+'"':x).join(',')).join('\n');
exports.words=()=>exports.parseCsv(fs.readFileSync(SRC+'words.csv','utf8')).slice(1).map(x=>({grade:x[0],school:x[1],uw:x[2],word:x[3],lang:(x[4]||'').trim().toUpperCase(),def:x[5]||'',sent:x[6]||''}));
exports.key=(lang,word)=>lang.toUpperCase()+'|'+word.toLowerCase();
exports.init=()=>{let db={};try{db=JSON.parse(fs.readFileSync(D+'db.json','utf8'))}catch(e){}
 for(const w of exports.words().sort((a,b)=>a.grade-b.grade)){const k=exports.key(w.lang,w.word);
  if(!db[k])db[k]={word:w.word.toLowerCase(),lang:w.lang,grade:w.grade,def:w.def,sent:w.sent,query:'',sight:false,photo:'',by:'',url:'',done:false,approved:false}}
 exports.save(db);return db};
exports.save=db=>{try{fs.writeFileSync(D+'db.json',JSON.stringify(db,null,1))}catch(e){console.log('save skipped:',e.code)}};
exports.sleep=ms=>new Promise(r=>setTimeout(r,ms));
exports.pexels=async(q,lang)=>{
 if(process.env.PIXABAY_API_KEY){const r=await fetch('https://pixabay.com/api/?key='+process.env.PIXABAY_API_KEY+'&image_type=photo&safesearch=true&per_page=8&lang='+(lang=='SPANISH'?'es':'en')+'&q='+encodeURIComponent(q));
  if(r.status==429)throw new Error('RATE');if(!r.ok)throw new Error('Pixabay '+r.status);
  return((await r.json()).hits||[]).map(p=>({thumb:p.previewURL,medium:p.webformatURL,by:p.user,url:p.pageURL}))}const r=await fetch('https://api.pexels.com/v1/search?per_page=8&orientation=square&query='+encodeURIComponent(q),{headers:{Authorization:process.env.PEXELS_API_KEY||''}});
 if(r.status==429)throw new Error('RATE');if(!r.ok)throw new Error('Pexels '+r.status);
 return((await r.json()).photos||[]).map(p=>({thumb:p.src.small,medium:p.src.medium,by:p.photographer,url:p.url}))};
exports.download=async(url,k)=>{const f=crypto.createHash('md5').update(k).digest('hex').slice(0,12)+'.jpg';
 fs.mkdirSync(PH,{recursive:true});fs.writeFileSync(PH+f,Buffer.from(await(await fetch(url)).arrayBuffer()));return f};
