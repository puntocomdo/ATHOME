// Fetches one photo per word from Pixabay or Pexels. Safe to stop and run again.
const L=require('./lib'),GRADE=process.env.GRADE,LIMIT=+(process.env.LIMIT||1e9);
(async()=>{
 if(!process.env.PIXABAY_API_KEY&&!process.env.PEXELS_API_KEY)return console.log('Set PIXABAY_API_KEY or PEXELS_API_KEY first.');
 const db=L.init();
 const need=Object.entries(db).filter(([k,v])=>!v.sight&&!v.photo&&(!GRADE||v.grade==GRADE)).slice(0,LIMIT);
 console.log(need.length,'photos to fetch');
 for(const [k,v] of need){for(let tries=0;tries<3;tries++){
   try{const ph=await L.pexels(v.query||v.word,v.lang);if(ph[0]){v.photo=await L.download(ph[0].medium,k);v.by=ph[0].by;v.url=ph[0].url}else v.sight=true;L.save(db);break}
   catch(e){if(String(e).includes('RATE')){console.log('Rate limit reached, waiting 10 minutes...');await L.sleep(600000)}else{console.log(v.word,String(e).slice(0,120));break}}}
  await L.sleep(process.env.PIXABAY_API_KEY?700:18500)}
 console.log('Done. Now run: node server.js and review the cards.')})();
