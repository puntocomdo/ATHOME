const http=require('http'),fs=require('fs'),path=require('path'),L=require('./lib'),A=require('./accounts'),P=__dirname+'/public/';
const DD=process.env.DATA_DIR||__dirname+'/data';try{fs.mkdirSync(DD,{recursive:true})}catch(e){}
const DB=require('./db'),ADMIN=['/api/list','/api/save','/api/photos','/api/pick','/export.csv','/api/progress-all','/api/requests','/api/approve','/api/update','/api/reject','/api/renew'];
let db={};try{db=L.init()}catch(e){console.log('Photo review tool is off:',String(e).slice(0,80))}
const T={'.html':'text/html','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png'};
const body=r=>new Promise(res=>{let b='';r.on('data',c=>{b+=c;if(b.length>3e5)r.destroy()});r.on('end',()=>res(b?JSON.parse(b):{}))});
const send=(s,o,t='application/json',h={})=>{s.writeHead(200,{'content-type':t,...h});s.end(typeof o=='string'||Buffer.isBuffer(o)?o:JSON.stringify(o))};
http.createServer(async(q,s)=>{try{const u=new URL(q.url,'http://x'),p=u.searchParams;
 if(ADMIN.includes(u.pathname)&&!A.isAdmin(q.headers['x-admin-token']||p.get('t'))){s.writeHead(401,{'content-type':'application/json'});return s.end(JSON.stringify({error:'Admin code needed'}))}
 if(await A.handle(q,s,u,p,body,send))return;
 if(u.pathname=='/api/progress'){if(q.method=='POST'){const b=await body(q);if(!await A.okToken(b.user,b.token)){s.writeHead(403);return s.end('no')}await DB.saveProgress(b.user,{grade:b.grade,school:b.school,data:b.data,updated:Date.now()});return send(s,{ok:1})}
  if(!await A.okToken(p.get('user'),p.get('token'))){s.writeHead(403);return s.end('no')}return send(s,(await DB.progress(p.get('user')))||{})}
 if(u.pathname=='/api/progress-all')return send(s,await DB.allProgress());
 if(u.pathname=='/api/list')return send(s,Object.entries(db).filter(([k,v])=>v.lang==p.get('lang')&&v.grade==p.get('grade')&&(p.get('unapproved')!='1'||!v.approved)).map(([k,v])=>({key:k,...v})));
 if(u.pathname=='/api/save'){const b=await body(q);Object.assign(db[b.key],{def:b.def,sent:b.sent,sight:b.sight,approved:b.approved});L.save(db);return send(s,{ok:1})}
 if(u.pathname=='/api/photos')return send(s,await L.pexels(p.get('q')));
 if(u.pathname=='/api/pick'){const b=await body(q),f=await L.download(b.medium,b.key);Object.assign(db[b.key],{photo:f,by:b.by,url:b.url,sight:false});L.save(db);return send(s,{file:f})}
 if(u.pathname=='/export.csv'){const rows=[['GRADE','SCHOOL (blank = every school)','UNIT # WEEK #','WORD','LANGUAGE','DEFINITION','SENTENCE','PHOTO FILE (example: cat.jpg)']];
  for(const w of L.words()){const v=db[L.key(w.lang,w.word)]||{};rows.push([w.grade,w.school,w.uw,w.word,w.lang,v.def||'',v.sent||'',v.photo||''])}
  return send(s,'\uFEFF'+L.toCsv(rows),'text/csv',{'content-disposition':'attachment; filename=words-final.csv'})}
 let f=u.pathname=='/'?(fs.existsSync(P+'index.html')?'index.html':'review.html'):u.pathname.slice(1);f=u.pathname.startsWith('/photos/')?'photos/'+path.basename(f):path.basename(f);
 const fp=P+f;if(!fs.existsSync(fp)){s.writeHead(404);return s.end('Not found')}send(s,fs.readFileSync(fp),T[path.extname(fp)]||'application/octet-stream')
}catch(e){s.writeHead(500);s.end(String(e))}}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Server running. Storage: '+DB.mode));
