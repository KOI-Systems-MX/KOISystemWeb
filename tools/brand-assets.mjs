// Lossless PNG cropping only: original RGBA samples and color-profile chunks survive.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc=b=>{let n=0xffffffff;for(const v of b)n=crcTable[(n^v)&255]^(n>>>8);return (n^0xffffffff)>>>0;};
const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
export function decodePNG(bytes){
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Expected PNG');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(bytes[24]!==8||bytes[25]!==6||bytes[28]!==0)throw Error('Expected non-interlaced 8-bit RGBA PNG');
  const data=[],profiles=[];
  for(let offset=8;offset<bytes.length;){const length=bytes.readUInt32BE(offset),kind=bytes.toString('ascii',offset+4,offset+8),chunk=bytes.subarray(offset+8,offset+8+length);if(kind==='IDAT')data.push(chunk);if(['sRGB','gAMA','cHRM','iCCP','pHYs'].includes(kind))profiles.push({kind,bytes:Buffer.from(chunk)});offset+=length+12;}
  const raw=zlib.inflateSync(Buffer.concat(data)),stride=width*4,rgba=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];
    for(let x=0;x<stride;x++){
      const a=x>=4?rgba[y*stride+x-4]:0,b=y?rgba[(y-1)*stride+x]:0,c=y&&x>=4?rgba[(y-1)*stride+x-4]:0;
      const predict=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];if(predict===undefined)throw Error('Unsupported PNG filter');
      rgba[y*stride+x]=(raw[y*(stride+1)+1+x]+predict)&255;
    }
  }return {width,height,rgba,profiles};
}
function chunk(kind,data){const type=Buffer.from(kind),size=Buffer.alloc(4),checksum=Buffer.alloc(4);size.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([size,type,data,checksum]);}
export function encodePNG({width,height,rgba,profiles=[]}){
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const stride=width*4,raw=Buffer.alloc((stride+1)*height);
  for(let y=0;y<height;y++){raw[y*(stride+1)]=1;for(let x=0;x<stride;x++)raw[y*(stride+1)+1+x]=(rgba[y*stride+x]-(x>=4?rgba[y*stride+x-4]:0))&255;}
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),...profiles.map(p=>chunk(p.kind,p.bytes)),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
export function cropPNG(image,rect){
  const rgba=Buffer.alloc(rect.width*rect.height*4);
  for(let y=0;y<rect.height;y++)image.rgba.copy(rgba,y*rect.width*4,((rect.y+y)*image.width+rect.x)*4,((rect.y+y)*image.width+rect.x+rect.width)*4);
  return {width:rect.width,height:rect.height,rgba,profiles:image.profiles};
}
function bounds(image,top=0,bottom=image.height){
  let left=image.width,right=-1,first=image.height,last=-1;
  for(let y=top;y<bottom;y++)for(let x=0;x<image.width;x++)if(image.rgba[(y*image.width+x)*4+3]>=4){left=Math.min(left,x);right=Math.max(right,x);first=Math.min(first,y);last=Math.max(last,y);}
  left=Math.max(0,left-4);right=Math.min(image.width-1,right+4);first=Math.max(top,first-4);last=Math.min(bottom-1,last+4);
  return {x:left,y:first,width:right-left+1,height:last-first+1};
}
function audit(image){
  const gaps=[];let start=-1;
  for(let y=Math.floor(image.height*.55);y<image.height*.86;y++){
    let visible=false;for(let x=0;x<image.width;x++)if(image.rgba[(y*image.width+x)*4+3]){visible=true;break;}
    if(!visible&&start<0)start=y;if(visible&&start>=0){gaps.push({start,end:y,length:y-start});start=-1;}
  }
  const gap=gaps.sort((a,b)=>b.length-a.length)[0];if(!gap)throw Error('No clean transparent separation; retain the complete official image');
  const split=Math.floor((gap.start+gap.end)/2);
  return {split,transparentGap:gap,symbol:bounds(image,0,split),wordmark:bounds(image,split),full:bounds(image)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const source=path.resolve('dist/assets/logo-koi-systems.png'),bytes=fs.readFileSync(source),image=decodePNG(bytes),regions=audit(image);
  const manifest={source:'../logo-koi-systems.png',sourceSHA256:sha(bytes),sourceSize:[image.width,image.height],cornerAlpha:image.rgba[3],method:'lossless crop around alpha >= 4 with 4px safety margin; exact RGBA inside; no internal mask, repainting, recoloring or resampling',excludedAlphaMaximum:3,...regions,assets:{}};
  if(process.argv.includes('--write')){
    const directory=path.resolve('dist/assets/brand');fs.mkdirSync(directory,{recursive:true});
    for(const [name,rect] of Object.entries(regions).filter(([name])=>['symbol','wordmark','full'].includes(name))){
      const imageCrop=cropPNG(image,rect),encoded=encodePNG(imageCrop),decoded=decodePNG(encoded);
      if(!decoded.rgba.equals(imageCrop.rgba))throw Error('Logo samples changed');
      const file=`koi-official-${name}.png`;fs.writeFileSync(path.join(directory,file),encoded);manifest.assets[name]={file,rect,rgbaSHA256:sha(imageCrop.rgba),bytes:encoded.length};
    }
    fs.writeFileSync(path.join(directory,'provenance.json'),JSON.stringify(manifest,null,2)+'\n');
  }console.log(JSON.stringify(manifest,null,2));
}
