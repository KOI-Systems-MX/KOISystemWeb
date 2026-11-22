import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist'),base=new URL('https://elizabethfranangel.github.io/KOISystemWeb/');
let checked=0;
async function verify(reference,file){
  if(!reference||/^(?:#|data:|https?:|mailto:|tel:)/i.test(reference))return;
  assert.ok(!reference.startsWith('/'),`Root-relative resource breaks project Pages: ${reference}`);
  const destination=new URL(reference,new URL(file.replaceAll(sep,'/'),base));
  assert.ok(destination.pathname.startsWith(base.pathname),`Resource escapes project: ${reference}`);
  const local=resolve(root,decodeURIComponent(destination.pathname.slice(base.pathname.length)));
  assert.ok(local.startsWith(root+sep),`Invalid resource: ${reference}`);
  assert.ok((await stat(local)).isFile(),`Missing resource: ${reference}`);checked++;
}
for(const name of await readdir(root)){
  const file=resolve(root,name);if(!(await stat(file)).isFile())continue;
  const source=await readFile(file,'utf8');
  const pattern=extname(file)==='.html'?/(?:src|href)=["']([^"']+)["']/g:
    extname(file)==='.js'?/\bfrom\s+["']([^"']+)["']/g:
    extname(file)==='.css'?/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g:null;
  if(pattern)for(const match of source.matchAll(pattern))await verify(match[1]??match[2]??match[3],name);
}
for(const asset of ['koi','lotus-leaf','lotus-flower','lotus-bud','lotus-petal'])await verify(`assets/nelumbo/${asset}-guohua-v1.png`,'index.html');
console.log(`Verified ${checked} local resource references under ${base.pathname}`);
