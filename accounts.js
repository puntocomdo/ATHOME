// Sign-up requests, approval, login with PIN. Data: DATA_DIR/accounts.json
const fs=require('fs'),crypto=require('crypto'),DD=process.env.DATA_DIR||__dirname+'/data',F=DD+'/accounts.json',DAY=864e5;
const read=()=>{try{return JSON.parse(fs.readFileSync(F,'utf8'))}catch(e){return[]}},write=a=>fs.writeFileSync(F,JSON.stringify(a,null,1));
const rnd=n=>crypto.randomBytes(n).toString('hex'),hits={};
const limited=(k,max,ms)=>{const n=Date.now();hits[k]=(hits[k]||[]).filter(t=>n-t<ms);if(hits[k].length>=max)return true;hits[k].push(n);return false};
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'').slice(0,12)||'student';
const clean=(s,n=80)=>String(s||'').replace(/[<>]/g,'').trim().slice(0,n);
async function mail(to,subject,text){const k=process.env.RESEND_API_KEY,from=process.env.MAIL_FROM;if(!k||!from||!/@/.test(to||''))return false;
 try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+k},body:JSON.stringify({from,to:[to.trim()],subject,text})});return r.ok}catch(e){return false}}
const msg=(r,o)=>`Hola ${r.parent}, la cuenta de ${r.child} fue aprobada.\nUsuario: ${r.username}\nPIN: ${r.pin}\nEntra en: ${o}\nVálida por 1 año.\n\nHello ${r.parent}, ${r.child}'s account is approved.\nUsername: ${r.username}\nPIN: ${r.pin}\nOpen: ${o}\nValid for 1 year.`;
const pinOk=(r,p)=>{const x=Buffer.from(String(r.pin||'')),y=Buffer.from(String(p||'').trim());return x.length>0&&x.length==y.length&&crypto.timingSafeEqual(x,y)};
exports.okToken=(user,token)=>!!token&&!!user&&read().some(r=>r.username==user&&r.token==token&&r.status=='approved'&&Date.now()<r.exp);
exports.handle=async(q,s,u,p,body,send)=>{
 const P=u.pathname,ip=q.socket.remoteAddress||'?',origin=(q.headers['x-forwarded-proto']||'http')+'://'+q.headers.host;
 const fail=(c,m)=>{s.writeHead(c,{'content-type':'application/json'});s.end(JSON.stringify({error:m}));return true};
 if(P=='/api/signup'&&q.method=='POST'){const b=await body(q);if(b.website){send(s,{ok:1});return true}
  if(limited('su'+ip,5,36e5))return fail(429,'Too many requests. Please try again later.');
  const r={id:rnd(4).toUpperCase().replace(/(.{4})/,'$1-'),parent:clean(b.parent),contact:clean(b.contact,120),child:clean(b.child,40),grade:Math.min(5,Math.max(1,+b.grade||1)),school:clean(b.school,80),status:'pending',created:Date.now()};
  if(!r.parent||!r.contact||!r.child||!r.school)return fail(400,'Please fill in every box.');
  const a=read();a.push(r);write(a);send(s,{code:r.id});return true}
 if(P=='/api/signup-status'){if(limited('st'+ip,30,36e5))return fail(429,'Too many requests.');
  const r=read().find(x=>x.id==String(p.get('code')||'').toUpperCase().trim());if(!r)return fail(404,'Request not found.');
  const o={status:r.status,child:r.child};if(r.status=='pending')o.hoursLeft=Math.max(0,Math.ceil(24-(Date.now()-r.created)/36e5));
  if(r.status=='approved'){o.username=r.username;o.pin=r.pin;o.exp=r.exp}if(r.status=='rejected')o.reason=r.reason||'';send(s,o);return true}
 if(P=='/api/login'&&q.method=='POST'){const b=await body(q);if(limited('lg'+ip+clean(b.user,30),10,6e5)||limited('lgip'+ip,30,6e5))return fail(429,'Too many tries. Please wait a few minutes.');
  const r=read().find(x=>x.username&&x.username==String(b.user||'').toLowerCase().trim());
  if(!r)return fail(401,'This username is not active yet.');if(r.status=='rejected')return fail(403,'This account was not approved.');if(r.status!='approved')return fail(403,'Your account is waiting for approval.');
  if(Date.now()>r.exp)return fail(403,'This username has expired. Please renew.');
  if(!pinOk(r,b.pin))return fail(401,'Wrong PIN.');
  send(s,{grade:r.grade,school:r.school,name:r.child,exp:r.exp,token:r.token});return true}
 if(P=='/api/requests'){send(s,read().sort((a,b)=>b.created-a.created));return true}
 if(P=='/api/approve'&&q.method=='POST'){const b=await body(q),a=read(),r=a.find(x=>x.id==b.id);if(!r)return fail(404,'Not found');
  if(b.grade)r.grade=Math.min(5,Math.max(1,+b.grade));if(b.school)r.school=clean(b.school,80);
  if(!r.username){let n;do{n=slug(r.child)+String(1000+crypto.randomInt(9000))}while(a.some(x=>x.username==n));r.username=n;r.token=rnd(12)}
  if(!r.pin)r.pin=String(1000+crypto.randomInt(9000));
  r.status='approved';r.approved=Date.now();r.exp=Date.now()+365*DAY;r.reason='';write(a);
  const em=await mail(r.contact,'Cuenta aprobada / Account approved',msg(r,origin));send(s,{username:r.username,pin:r.pin,emailed:em,message:msg(r,origin)});return true}
 if(P=='/api/reject'&&q.method=='POST'){const b=await body(q),a=read(),r=a.find(x=>x.id==b.id);if(!r)return fail(404,'Not found');
  r.status='rejected';r.reason=clean(b.reason,200);write(a);send(s,{ok:1});return true}
 if(P=='/api/renew'&&q.method=='POST'){const b=await body(q),a=read(),r=a.find(x=>x.id==b.id);if(!r||r.status!='approved')return fail(404,'Not found');
  r.exp=Math.max(Date.now(),r.exp)+365*DAY;write(a);send(s,{exp:r.exp});return true}
 return false};
