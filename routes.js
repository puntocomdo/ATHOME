// All account, admin and progress routes. Used by the Vercel function (api/handler.js) and by the local server (server.js).
const A=require('./accounts'),DB=require('./db');
const ADMIN=['/api/progress-all','/api/requests','/api/approve','/api/update','/api/reject','/api/renew'];
const json=(s,c,o)=>{s.statusCode=c;s.setHeader('content-type','application/json');s.end(JSON.stringify(o))};
exports.body=async r=>{if(r.body!==undefined&&r.body!==null){if(Buffer.isBuffer(r.body))r.body=r.body.toString();if(typeof r.body=='string'){try{return r.body?JSON.parse(r.body):{}}catch(e){return{}}}return r.body}
 if(r.readableEnded)return{};
 return new Promise(res=>{let b='';r.on('data',c=>{b+=c;if(b.length>3e5)r.destroy()});r.on('end',()=>{try{res(b?JSON.parse(b):{})}catch(e){res({})}})})};
const send=(s,o)=>json(s,200,o);
exports.handle=async(q,s,u)=>{const p=u.searchParams,P=u.pathname;
 if(!P.startsWith('/api/'))return false;
 if(process.env.VERCEL&&DB.mode!=='supabase')return json(s,500,{error:'The database is not set up yet.'}),true;
 if(ADMIN.includes(P)&&!A.isAdmin(q.headers['x-admin-token']||p.get('t')))return json(s,401,{error:'Admin code needed'}),true;
 if(await A.handle(q,s,u,p,exports.body,(s2,o)=>send(s2,o)))return true;
 if(P=='/api/progress'){
  if(q.method=='POST'){const b=await exports.body(q);if(!await A.okToken(b.user,b.token))return json(s,403,{error:'no'}),true;
   await DB.saveProgress(b.user,{grade:b.grade,school:b.school,data:b.data,updated:Date.now()});send(s,{ok:1});return true}
  if(!await A.okToken(p.get('user'),p.get('token')))return json(s,403,{error:'no'}),true;
  send(s,(await DB.progress(p.get('user')))||{});return true}
 if(P=='/api/progress-all'){send(s,await DB.allProgress());return true}
 return false};
