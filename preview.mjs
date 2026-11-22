import http from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export const contentTypes={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json','.mp4':'video/mp4','.webm':'video/webm'};
export function parseByteRange(header,size){
  if(!header)return null;
  const match=/^bytes=(\d*)-(\d*)$/.exec(header);if(!match||(!match[1]&&!match[2])||size===0)return false;
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  return Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&start<size&&end>=start?{start,end}:false;
}
export function createPreviewServer(directory=resolve('dist')){
  const root=resolve(directory);
  return http.createServer(async(req,res)=>{
    try{
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
      const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname),file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
      const info=await stat(file);if(!info.isFile())throw Error('Not a file');
      const range=parseByteRange(req.headers.range,info.size);
      if(range===false){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      const headers={'Content-Type':contentTypes[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store','Content-Length':range?range.end-range.start+1:info.size};
      if(range)headers['Content-Range']=`bytes ${range.start}-${range.end}/${info.size}`;
      res.writeHead(range?206:200,headers);if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(file,range||undefined);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
    }catch{if(!res.headersSent)res.writeHead(404);res.end('No encontrado');}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createPreviewServer().listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
