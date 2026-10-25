const http=require('http'),fs=require('fs'),path=require('path'),L=require('./lib'),A=require('./accounts'),R=require('./routes'),P=__dirname+'/public/';
const DD=process.env.DATA_DIR||__dirname+'/data';try{fs.mkdirSync(DD,{recursive:true})}catch(e){}
const DB=require('./db'),ADMIN=['/api/list','/api/save','/api/photos','/api/pick','/export.csv'];
let db={};try{db=L.init()}catch(e){console.log('Photo review tool is off:',String(e).slice(0,80))}
const T={'.html':'text/html','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png'};
const body=R.body;
const send=(s,o,t='application/json',h={})=>{s.writeHead(200,{'content-type':t,...h});s.end(typeof o=='string'||Buffer.isBuffer(o)?o:JSON.stringify(o))};
http.createServer(async(q,s)=>{try{const u=new URL(q.url,'http://x'),p=u.searchParams;
 if(ADMIN.includes(u.pathname)&&!A.isAdmin(q.headers['x-admin-token']||p.get('t'))){s.writeHead(401,{'content-type':'application/json'});return s.end(JSON.stringify({error:'Admin code needed'}))}
 if(await R.handle(q,s,u))return;
 if(u.pathname=='/api/list')return send(s,Object.entries(db).filter(([k,v])=>v.lang==p.get('lang')&&v.grade==p.get('grade')&&(p.get('unapproved')!='1'||!v.approved)).map(([k,v])=>({key:k,...v})));
 if(u.pathname=='/api/save'){const b=await body(q);Object.assign(db[b.key],{def:b.def,sent:b.sent,sight:b.sight,approved:b.approved});L.save(db);return send(s,{ok:1})}
 if(u.pathname=='/api/photos')return send(s,await L.pexels(p.get('q'),p.get('lang')));
 if(u.pathname=='/api/pick'){const b=await body(q),f=await L.download(b.medium,b.key);Object.assign(db[b.key],{photo:f,by:b.by,url:b.url,sight:false});L.save(db);return send(s,{file:f})}
 if(u.pathname=='/export.csv'){const rows=[['GRADE','SCHOOL (blank = every school)','UNIT # WEEK #','WORD','LANGUAGE','DEFINITION','SENTENCE','PHOTO FILE (example: cat.jpg)']];
  for(const w of L.words()){const v=db[L.key(w.lang,w.word)]||{};rows.push([w.grade,w.school,w.uw,w.word,w.lang,v.def||'',v.sent||'',v.photo||''])}
  return send(s,'\uFEFF'+L.toCsv(rows),'text/csv',{'content-disposition':'attachment; filename=words-final.csv'})}
 let f=u.pathname=='/'?'index.html':u.pathname.slice(1);f=u.pathname.startsWith('/photos/')?'photos/'+path.basename(f):path.basename(f);if(!path.extname(f))f+='.html';
 let fp=P+f;if(!fs.existsSync(fp)&&fs.existsSync(__dirname+'/tools/'+f))fp=__dirname+'/tools/'+f;if(!fs.existsSync(fp)){s.writeHead(404);return s.end('Not found')}send(s,fs.readFileSync(fp),T[path.extname(fp)]||'application/octet-stream')
}catch(e){s.writeHead(500);s.end(String(e))}}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Server running. Storage: '+DB.mode));
