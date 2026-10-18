// Vercel serverless function. vercel.json sends every /api/<name> request here with ?name=<name>.
const R=require('../routes');
module.exports=async(req,res)=>{try{
 const o=new URL(req.url,'http://x'),name=String((req.query&&req.query.name)||o.searchParams.get('name')||o.pathname.replace(/^\/api\//,'')).replace(/[^a-z-]/gi,'');
 o.searchParams.delete('name');const qs=o.searchParams.toString(),u=new URL('/api/'+name+(qs?'?'+qs:''),'http://x');
 if(!await R.handle(req,res,u)){res.statusCode=404;res.setHeader('content-type','application/json');res.end('{"error":"Not found"}')}
}catch(e){res.statusCode=500;res.setHeader('content-type','application/json');res.end(JSON.stringify({error:String(e&&e.message||e).slice(0,200)}))}};
