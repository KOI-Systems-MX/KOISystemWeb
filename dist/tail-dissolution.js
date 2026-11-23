import {ease,materialFrontier} from './formation.js';
import {anatomyPoint} from './swimming.js';

// All coordinates are in the original painted fish's material space: u=0 is tail.
export function tailField(u,v,time,seed=0){
  const cycle=ease(.5+.5*Math.sin(time*.38+seed));
  const reach=1-ease((u-.015)/(.24+.055*cycle));
  // The caudal tip never returns to an intact silhouette, even between pulses.
  const tide=.55+.43*cycle;
  const grain=.5+.25*Math.sin(u*117+v*39+time*.65+seed)+.25*Math.sin(v*73-u*41-time*.43);
  const dissolvedTip=(1-ease((u-.08)/.17))*(.87+.08*(grain-.5));
  return Math.max(0,Math.min(.97,Math.max(dissolvedTip,reach*(tide+.30*(grain-.5)))));
}
export function tailPoint(f,u,v){
  return anatomyPoint(f,u,v);
}
export function tailEmitter(f,points,time){
  // A sparse, fixed set of pigment samples follows the articulated fin; emissions
  // alternate among them instead of coming from an arbitrary point behind the koi.
  const ports=points.map(p=>({...tailPoint(f,p.u,p.v),u:p.u,v:p.v,color:p.color,fragmentation:tailField(p.u,p.v,time,f.seed)})).filter(p=>p.fragmentation>.35);
  const primary=ports[Math.floor(time*7+f.id)%Math.max(1,ports.length)]||tailPoint(f,.08,.5);
  return {...primary,ports,fishId:f.id,length:f.length,speed:f.speed,effort:f.response?.effort??0,vx:Math.cos(primary.heading)*f.speed,vy:Math.sin(primary.heading)*f.speed};
}

const pigmentFrames=new WeakMap();
export function paintDissolvingTail(paint,image,time,seed,birth=false){
  const width=paint.canvas.width,height=paint.canvas.height;
  let cached=pigmentFrames.get(paint);
  if(!cached||cached.width!==width||cached.height!==height||cached.image!==image||cached.seed!==seed){
    paint.clearRect(0,0,width,height);paint.globalCompositeOperation='source-over';paint.globalAlpha=1;paint.drawImage(image,0,0,width,height);
    const frame=paint.getImageData(0,0,width,height),original=frame.data.slice(),frontiers=new Float32Array(width*height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)frontiers[y*width+x]=materialFrontier(x/width,y/height,seed);
    cached={width,height,image,seed,frame,original,frontiers,forming:false};pigmentFrames.set(paint,cached);
  }
  const {frame,original,frontiers}=cached,pixels=frame.data;
  // Erode the alpha of the original pigment, pixel by pixel. The head/body are
  // untouched; the irregular, moving field leaves translucent islands in the fin.
  const forming=birth&&time<10.8+seed*.07;
  if(cached.forming&&!forming)pixels.set(original);
  for(let y=0;y<height;y++)for(let x=0;x<(forming?width:width*.32);x++){
    const i=(y*width+x)*4,amount=x/width<.32?tailField(x/width,y/height,time,seed):0;
    pixels[i+3]=original[i+3]*(1-amount)*(forming?ease((time-frontiers[y*width+x])/3.4):1);
  }
  cached.forming=forming;
  paint.putImageData(frame,0,0);
  paint.globalCompositeOperation='source-over';paint.globalAlpha=1;
}
export function tailColor(age,pigment,id){
  const original=(pigment?.match(/[\d.]+/g)||['16','44','70']).slice(0,3).map(Number);
  const fresh=id%7===0?[211,117,72]:[97,124,148],old=id%7===0?[162,109,83]:[73,96,118];
  const release=ease(age/.65),fade=ease((age-.8)/2);
  const rgb=fresh.map((value,i)=>{
    const from=original[i]*.45+value*.55,to=value+(old[i]-value)*fade;
    return Math.round(from+(to-from)*release);
  });
  return `rgb(${rgb.join(',')})`;
}
