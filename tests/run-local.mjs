import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readdir} from 'node:fs/promises';
const state=`.wrangler/test-${randomUUID()}`;
const wrangler=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js'];
const run=(args,env=process.env)=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{stdio:'inherit',env});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(`Child exited ${code}`)))});
for(const sql of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())await run([...wrangler,'d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to',state,'--file',`drizzle/${sql}`]);
const server=spawn(process.execPath,[...wrangler,'dev','--config','dist/server/wrangler.json','--local','--persist-to',state,'--ip','127.0.0.1','--inspector-port','0','--port','5174'],{stdio:'ignore'});
server.on('error',e=>console.error(e));
try{let ready=false;for(let i=0;i<60;i++){try{const r=await fetch('http://127.0.0.1:5174/api/state');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw Error('Test server did not become ready. Ensure port 5174 is free.');await run(['tests/api.integration.mjs'],{...process.env,SLOTWISE_TEST_URL:'http://127.0.0.1:5174'});}finally{server.kill('SIGTERM');}
