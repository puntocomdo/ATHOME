// Reads a local .env file (for running on your own computer). On Hostinger, set these in the app's environment variables instead.
const fs=require('fs');try{for(const l of fs.readFileSync(__dirname+'/.env','utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')}}catch(e){}
