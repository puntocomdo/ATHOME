// Sign-up requests, approval, admin edits, username login and admin code. Storage comes from db.js (Supabase or files).
const crypto=require('crypto'),DB=require('./db'),DAY=864e5,hits={};
const limited=(k,max,ms)=>{const n=Date.now();hits[k]=(hits[k]||[]).filter(t=>n-t<ms);if(hits[k].length>=max)return true;hits[k].push(n);return false};
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'').slice(0,12)||'student';
const clean=(s,n=80)=>String(s||'').replace(/[<>]/g,'').trim().slice(0,n);
async function mail(to,subject,text){const k=process.env.RESEND_API_KEY,from=process.env.MAIL_FROM;if(!k||!from||!/@/.test(to||''))return false;
 try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+k},body:JSON.stringify({from,to:[to.trim()],subject,text})});return r.ok}catch(e){return false}}
const msg=(r,o)=>`Hola ${r.parent}, la cuenta de ${r.child} fue aprobada.\nUsuario: ${r.username}\nEntra en: ${o}\nVálida por 1 año.\n\nHello ${r.parent}, ${r.child}'s account is approved.\nUsername: ${r.username}\nOpen: ${o}\nValid for 1 year.`;
const SECRET=()=>process.env.ADMIN_CODE||process.env.ADMIN_PASSWORD||'';
const sign=e=>crypto.createHmac('sha256',SECRET()).update(String(e)).digest('hex');
const same=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length==y.length&&crypto.timingSafeEqual(x,y)};
const adminToken=()=>{const e=Date.now()+12*36e5;return e+'.'+sign(e)};
exports.isAdmin=tok=>{if(!SECRET())return true;const[e,sg]=String(tok||'').split('.');return !!e&&!!sg&&+e>Date.now()&&same(sign(e),sg)};
exports.okToken=async(user,token)=>{if(!token||!user)return false;const r=await DB.accountBy('username',String(user));return !!r&&same(r.token||'-',token)&&r.status=='approved'&&Date.now()<r.exp};
const validU=u=>/^[a-z0-9]{3,30}$/.test(u);
async function uniqueName(child){let n;do{n=slug(child)+String(1000+crypto.randomInt(9000))}while(await DB.accountBy('username',n));return n}
// Grade 0 = PF (Pre-First). start = first week the child still has to do, like "2-3" (earlier weeks were already covered in class).
exports.grade=v=>{if(/^\s*pf\s*$/i.test(String(v)))return 0;const n=parseInt(v);return isNaN(n)?1:Math.min(6,Math.max(0,n))};
const startW=v=>{const m=String(v||"").match(/^(\d{1,2})-(\d)$/);return m&&+m[1]>=1&&+m[2]>=1?m[1]+"-"+m[2]:""};
const dateMs=v=>{if(v==null||v==='')return null;if(typeof v=='number')return v;const d=Date.parse(String(v)+'T23:59:59');return isNaN(d)?null:d};
exports.handle=async(q,s,u,p,body,send)=>{
 const P=u.pathname,ip=q.socket.remoteAddress||'?',origin=(q.headers['x-forwarded-proto']||'http')+'://'+q.headers.host;
 const fail=(c,m)=>{s.writeHead(c,{'content-type':'application/json'});s.end(JSON.stringify({error:m}));return true};
 if(P=='/api/admin-login'&&q.method=='POST'){const b=await body(q);if(!SECRET()){send(s,{token:adminToken(),open:true});return true}
  if(limited('ad'+ip,10,6e5))return fail(429,'Too many tries. Please wait a few minutes.');
  if(!same(b.code||'',SECRET()))return fail(401,'Wrong admin code.');send(s,{token:adminToken()});return true}
 if(P=='/api/signup'&&q.method=='POST'){const b=await body(q);if(b.website){send(s,{ok:1});return true}
  if(limited('su'+ip,5,36e5))return fail(429,'Too many requests. Please try again later.');
  const r={id:crypto.randomBytes(4).toString('hex').toUpperCase().replace(/(.{4})/,'$1-'),parent:clean(b.parent),contact:clean(b.contact,120),child:clean(b.child,40),grade:exports.grade(b.grade),school:clean(b.school,80),status:'pending',created:Date.now()};
  if(!r.parent||!r.contact||!r.child||!r.school)return fail(400,'Please fill in every box.');
  await DB.saveAccount(r);send(s,{code:r.id});return true}
 if(P=='/api/signup-status'){if(limited('st'+ip,30,36e5))return fail(429,'Too many requests.');
  const r=await DB.accountBy('id',String(p.get('code')||'').toUpperCase().trim());if(!r)return fail(404,'Request not found.');
  const o={status:r.status,child:r.child};if(r.status=='pending')o.hoursLeft=Math.max(0,Math.ceil(24-(Date.now()-r.created)/36e5));
  if(r.status=='approved'){o.username=r.username;o.exp=r.exp}if(r.status=='rejected')o.reason=r.reason||'';send(s,o);return true}
 if(P=='/api/login'&&q.method=='POST'){const b=await body(q);if(limited('lg'+ip+clean(b.user,30),10,6e5)||limited('lgip'+ip,30,6e5))return fail(429,'Too many tries. Please wait a few minutes.');
  const r=await DB.accountBy('username',String(b.user||'').toLowerCase().trim());
  if(!r)return fail(401,'This username is not active yet.');if(r.status=='rejected')return fail(403,'This account was not approved.');if(r.status!='approved')return fail(403,'Your account is waiting for approval.');
  if(Date.now()>r.exp)return fail(403,'This username has expired. Please renew.');
  send(s,{grade:r.grade,school:r.school,name:r.child,exp:r.exp,token:r.token,start:r.start||""});return true}
 if(P=='/api/requests'){send(s,await DB.accounts());return true}
 if(P=='/api/approve'&&q.method=='POST'){const b=await body(q),r=await DB.accountBy('id',String(b.id||''));if(!r)return fail(404,'Not found');
  if(b.grade!==undefined&&b.grade!=="")r.grade=exports.grade(b.grade);if(b.start!==undefined)r.start=startW(b.start);if(b.school)r.school=clean(b.school,80);
  const want=String(b.username||'').toLowerCase().trim();
  if(want){if(!validU(want))return fail(400,'Username must be 3 to 30 letters or numbers, no spaces.');const x=await DB.accountBy('username',want);if(x&&x.id!=r.id)return fail(409,'That username is already taken.');r.username=want}
  if(!r.username)r.username=await uniqueName(r.child);if(!r.token)r.token=crypto.randomBytes(12).toString('hex');
  r.status='approved';r.approved=Date.now();r.exp=Date.now()+365*DAY;r.reason='';await DB.saveAccount(r);
  const em=await mail(r.contact,'Cuenta aprobada / Account approved',msg(r,origin));send(s,{username:r.username,emailed:em,message:msg(r,origin)});return true}
 if(P=='/api/update'&&q.method=='POST'){const b=await body(q),r=await DB.accountBy('id',String(b.id||''));if(!r)return fail(404,'Not found');const old=r.username;
  if(b.username!==undefined&&b.username!==''){const n=String(b.username).toLowerCase().trim();if(!validU(n))return fail(400,'Username must be 3 to 30 letters or numbers, no spaces.');const x=await DB.accountBy('username',n);if(x&&x.id!=r.id)return fail(409,'That username is already taken.');r.username=n}
  if(b.exp!==undefined&&b.exp!==''){const e=dateMs(b.exp);if(!e)return fail(400,'That date is not valid.');r.exp=e}
  if(b.grade!==undefined&&b.grade!=="")r.grade=exports.grade(b.grade);if(b.start!==undefined)r.start=startW(b.start);if(b.school)r.school=clean(b.school,80);if(b.child)r.child=clean(b.child,40);if(b.parent)r.parent=clean(b.parent);if(b.contact)r.contact=clean(b.contact,120);
  await DB.saveAccount(r);if(old&&r.username!=old)await DB.renameProgress(old,r.username);send(s,r);return true}
 if(P=='/api/reject'&&q.method=='POST'){const b=await body(q),r=await DB.accountBy('id',String(b.id||''));if(!r)return fail(404,'Not found');
  r.status='rejected';r.reason=clean(b.reason,200);await DB.saveAccount(r);send(s,{ok:1});return true}
 if(P=='/api/renew'&&q.method=='POST'){const b=await body(q),r=await DB.accountBy('id',String(b.id||''));if(!r||r.status!='approved')return fail(404,'Not found');
  r.exp=Math.max(Date.now(),r.exp)+365*DAY;await DB.saveAccount(r);send(s,{exp:r.exp});return true}
 return false};
