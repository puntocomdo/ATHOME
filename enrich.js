// Step 1: Claude writes definition + sentence + photo search words. Step 2: Pexels photos. Safe to stop and run again.
const PO=process.env.PHOTOS_ONLY==='1',L=require('./lib'),MODEL=process.env.MODEL||'claude-haiku-5-5',GRADE=process.env.GRADE,LIMIT=+(process.env.LIMIT||1e9);
async function claude(p){const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01'},
 body:JSON.stringify({model:MODEL,max_tokens:4000,messages:[{role:'user',content:p}]})});const j=await r.json();if(!r.ok)throw new Error(JSON.stringify(j));return j.content.map(c=>c.text||'').join('')}
(async()=>{
 const db=L.init();let n=0;const groups={};
 for(const [k,v] of Object.entries(db)){if(PO||v.done||(GRADE&&v.grade!=GRADE)||n>=LIMIT)continue;n++;(groups[v.lang+'|'+v.grade]=groups[v.lang+'|'+v.grade]||[]).push(k)}
 for(const [g,keys] of Object.entries(groups)){const [lang,grade]=g.split('|');
  for(let i=0;i<keys.length;i+=25){const batch=keys.slice(i,i+25);
   const prompt=`You write vocabulary cards for school children in grade ${grade}. Language of the words: ${lang}.
For each word give: "definition" (one short, simple sentence a child can understand, written in ${lang}, never using the word itself), "sentence" (one short, school-friendly example sentence in ${lang} that uses the word), "query" (a 1-3 word ENGLISH stock-photo search phrase showing a concrete thing or action that matches the meaning, or "" if the word is abstract or a function word like "of", "they", "who"), "sight" (true if no photo is possible).
Answer with ONLY a JSON array: [{"word":"","definition":"","sentence":"","query":"","sight":false}]
Words: ${batch.map(k=>db[k].word).join(', ')}`;
   try{const t=(await claude(prompt)).replace(/```json|```/g,'').trim(),arr=JSON.parse(t);
    for(const a of arr){const k=L.key(lang,a.word);if(!db[k])continue;const v=db[k];v.def=v.def||a.definition;v.sent=v.sent||a.sentence;v.query=a.query||'';v.sight=!!a.sight||!a.query;v.done=true}
    L.save(db);console.log(g,'batch',i/25+1,'of',Math.ceil(keys.length/25))}catch(e){console.log('batch failed, will retry next run:',String(e).slice(0,200))}}}
 if(process.env.PHOTOS==='0'||(!PO&&!process.env.ANTHROPIC_API_KEY&&false))return console.log('Skipping photos.');
 const need=Object.entries(db).filter(([k,v])=>(PO||v.done)&&v.def&&!v.sight&&(PO||v.query)&&!v.photo&&(!GRADE||v.grade==GRADE));
 console.log(need.length,'photos to fetch (about 18 seconds each, Pexels limit is 200/hour)');
 for(const [k,v] of need){for(let tries=0;tries<3;tries++){
   try{const ph=await L.pexels(v.query||v.word,v.lang);if(ph[0]){v.photo=await L.download(ph[0].medium,k);v.by=ph[0].by;v.url=ph[0].url}else v.sight=true;L.save(db);break}
   catch(e){if(String(e).includes('RATE')){console.log('Pexels limit reached, waiting 10 minutes...');await L.sleep(600000)}else{console.log(v.word,String(e).slice(0,120));break}}}
  await L.sleep(process.env.PIXABAY_API_KEY?700:18500)}
 console.log('Done. Now run: node server.js and review the cards.')})();
