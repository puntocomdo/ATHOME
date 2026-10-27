// Finds kid-friendly pictures on Pixabay with PIXABAY_API_KEY and keeps a copy of each one (Supabase Storage on Vercel, public/photos on your computer).
const DB=require('./db'),PIX=process.env.PIXABAY_API_URL||'https://pixabay.com/api/';
const okHost=u=>{try{return new URL(u).hostname.endsWith('pixabay.com')||process.env.PIXABAY_ALLOW_ANY==='1'}catch(e){return false}};
// Kid-friendly: safe search on, cartoon-style illustrations first (photos only fill in), and any picture
// tagged with scary, violent or adult things is skipped, unless that tag is the word itself (e.g. "skeleton").
const BAD=/^(blood|bloody|gun|guns|rifle|pistol|weapon|weapons|bullet|knife|sword|war|soldier|army|military|tank|bomb|explosion|horror|scary|creepy|fear|zombie|skull|skeleton|death|dead|die|corpse|grave|cemetery|coffin|halloween|demon|devil|evil|witch|ghost|monster|vampire|alcohol|beer|wine|whiskey|whisky|cocktail|liquor|drunk|bar|pub|cigarette|cigar|smoking|smoke|tobacco|drug|drugs|syringe|injection|pills|bikini|lingerie|underwear|swimsuit|sexy|sensual|erotic|nude|naked|kiss|kissing|romance|couple|violence|violent|fight|fighting|injury|wound|accident|crime|prison|jail|police car|hunting|hunter|dead animal|meat|slaughter|sangre|arma|pistola|cuchillo|guerra|muerte|muerto|calavera|cerveza|vino|alcohol|cigarro|droga|desnudo|beso|miedo|terror)$/i;
const kidOk=(h,q)=>{const own=new Set(String(q).toLowerCase().split(/\s+/));return !String(h.tags||'').toLowerCase().split(/\s*,\s*/).some(t=>t&&!own.has(t)&&BAD.test(t))};
const pix=async(q,lang,type)=>{const r=await fetch(`${PIX}?key=${encodeURIComponent(process.env.PIXABAY_API_KEY)}&q=${encodeURIComponent(q)}&image_type=${type}&safesearch=true&order=popular&per_page=20&lang=${lang=='es'?'es':'en'}`);
 if(r.status==429)throw new Error("Pixabay: demasiadas búsquedas. Espera un minuto. / Too many requests, wait one minute.");if(!r.ok)throw new Error("Pixabay error "+r.status+(r.status==400&&/key/i.test(await r.text())?": la llave PIXABAY_API_KEY no es válida / invalid key":""));
 return((await r.json()).hits||[]).filter(h=>kidOk(h,q)).map(h=>({id:h.id,thumb:h.previewURL,full:String(h.webformatURL).replace('_640','_340'),type}))};
exports.search=async(q,lang)=>{if(!process.env.PIXABAY_API_KEY)throw new Error("Falta PIXABAY_API_KEY en Vercel (Settings → Environment Variables) y luego Redeploy. / Add PIXABAY_API_KEY in Vercel, then Redeploy.");
 let hits=(await pix(q,lang,'illustration')).slice(0,8);if(hits.length<8)hits=hits.concat((await pix(q,lang,'photo')).slice(0,8-hits.length));return hits};
exports.store=async(w,url)=>{if(!okHost(url))throw new Error('That photo address is not allowed.');const r=await fetch(url);if(!r.ok)throw new Error('Could not download the photo.');
 const name=`${w.lang}-${String(w.word).replace(/[^a-z0-9]+/gi,'_')}-${w.id}.jpg`,photo=await DB.uploadPhoto(name,Buffer.from(await r.arrayBuffer()));await DB.setPhoto(w.id,photo);return photo};
// One word at a time (12 at once made Pixabay refuse them all). `after` skips words that already failed in this run.
const FATAL=/PIXABAY_API_KEY|demasiadas|invalid key/i;
exports.auto=async(n=10,after=0)=>{const list=await DB.noPhotoWords(n,after);let done=0,failed=0,error='',last=+after||0,stop=false;
 for(const w of list){last=w.id;try{const h=await exports.search(w.word,w.lang);if(!h[0]){await DB.markSight(w.id);failed++;continue}await exports.store(w,h[0].full);done++}
  catch(e){failed++;error=String(e.message||e).slice(0,200);if(FATAL.test(error)){stop=true;break}}}
 return{done,failed,error,stop,last,more:list.length==n,remaining:await DB.countNoPhoto()}};
