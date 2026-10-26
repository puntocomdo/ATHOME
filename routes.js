// All account, admin and progress routes. Used by the Vercel function (api/handler.js) and by the local server (server.js).
const A=require('./accounts'),DB=require('./db'),PH=require('./photos'),SEED=require('./seed');
const ADMIN=['/api/progress-all','/api/requests','/api/approve','/api/update','/api/reject','/api/renew','/api/words-admin','/api/word-save','/api/word-delete','/api/words-import','/api/words-stats','/api/photo-search','/api/photo-set','/api/words-photos','/api/words-seed'];
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
 if(P=='/api/my-words'){const user=p.get('user');if(!await A.okToken(user,p.get('token')))return json(s,403,{error:'no'}),true;const r=await DB.accountBy('username',String(user));send(s,Object.assign(await DB.wordsFor(r.grade,r.school),{start:r.start||""}));return true}
 if(P=='/api/words-admin'){try{send(s,await DB.words({lang:p.get('lang'),grade:p.get('grade'),q:p.get('q'),limit:p.get('limit'),offset:p.get('offset'),incomplete:p.get('incomplete'),nophoto:p.get('nophoto')}))}catch(e){json(s,500,{error:String(e.message||e).slice(0,200)})}return true}
 if(P=='/api/word-save'&&q.method=='POST'){try{send(s,await DB.saveWord(await exports.body(q)))}catch(e){json(s,/duplicate|already|23505|409/i.test(String(e.message))?409:400,{error:/duplicate|23505|409/i.test(String(e.message))?'That word already exists in that unit and week.':String(e.message).slice(0,200)})}return true}
 if(P=='/api/words-stats'){try{send(s,await DB.stats())}catch(e){json(s,500,{error:String(e.message||e).slice(0,200)})}return true}
 if(P=='/api/photo-search'){try{send(s,await PH.search(String(p.get('q')||'').slice(0,60),p.get('lang')))}catch(e){json(s,400,{error:String(e.message||e).slice(0,200)})}return true}
 if(P=='/api/photo-set'&&q.method=='POST'){const b=await exports.body(q),w=await DB.wordById(b.id);if(!w)return json(s,404,{error:'Word not found'}),true;try{send(s,{photo:await PH.store(w,String(b.url||''))})}catch(e){json(s,400,{error:String(e.message||e).slice(0,200)})}return true}
 if(P=='/api/words-photos'&&q.method=='POST'){try{send(s,await PH.auto(10,+p.get("after")||0))}catch(e){json(s,400,{error:String(e.message||e).slice(0,200)})}return true}
 if(P=='/api/words-seed'&&q.method=='POST'){try{send(s,{imported:await SEED.run()})}catch(e){json(s,500,{error:String(e.message||e).slice(0,200)})}return true}
 if(P=='/api/word-delete'&&q.method=='POST'){const b=await exports.body(q);await DB.deleteWord(b.id);send(s,{ok:1});return true}
 if(P=='/api/words-import'&&q.method=='POST'){const b=await exports.body(q);try{send(s,{imported:await DB.importWords(Array.isArray(b.rows)?b.rows.slice(0,400):[])})}catch(e){json(s,500,{error:String(e.message||e).slice(0,200)})}return true}
 return false};
