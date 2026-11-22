import {ease} from './formation.js';
import {spinePoint} from './swimming.js';

// All coordinates are in the original painted fish's material space: u=0 is tail.
export function tailField(u,v,time,seed=0){
  const cycle=ease(.5+.5*Math.sin(time*.38+seed));
  const reach=1-ease((u-.015)/(.24+.055*cycle));
  const tide=.32+.57*cycle;
  const grain=.5+.25*Math.sin(u*117+v*39+time*.65+seed)+.25*Math.sin(v*73-u*41-time*.43);
  return Math.max(0,Math.min(.97,reach*(tide+.30*(grain-.5))));
}
export function tailPoint(f,u,v){
  const wave=Math.sin(f.wave-(1-u)*5.2)*(1-u)**2*f.length*.038;
  return spinePoint(f,(u-.5)*f.length,(v-.5)*f.length*2/3+wave);
}
export function tailEmitter(f,points,time){
  // A sparse, fixed set of pigment samples follows the articulated fin; emissions
  // alternate among them instead of coming from an arbitrary point behind the koi.
  const ports=points.map(p=>({...tailPoint(f,p.u,p.v),u:p.u,v:p.v,color:p.color,fragmentation:tailField(p.u,p.v,time,f.seed)})).filter(p=>p.fragmentation>.18);
  const primary=ports[Math.floor(time*7+f.id)%Math.max(1,ports.length)]||tailPoint(f,.08,.5);
  return {...primary,ports,fishId:f.id,length:f.length,speed:f.speed,vx:Math.cos(primary.heading)*f.speed,vy:Math.sin(primary.heading)*f.speed};
}

export function paintDissolvingTail(paint,image,time,seed){
  const width=paint.canvas.width,height=paint.canvas.height;
  paint.clearRect(0,0,width,height);paint.globalCompositeOperation='source-over';paint.globalAlpha=1;paint.drawImage(image,0,0,width,height);
  const frame=paint.getImageData(0,0,width,height),pixels=frame.data;
  // Erode the alpha of the original pigment, pixel by pixel. The head/body are
  // untouched; the irregular, moving field leaves translucent islands in the fin.
  for(let y=0;y<height;y++)for(let x=0;x<width*.32;x++){
    const i=(y*width+x)*4,amount=tailField(x/width,y/height,time,seed);
    pixels[i+3]*=1-amount;
  }
  paint.putImageData(frame,0,0);
  paint.globalCompositeOperation='source-over';paint.globalAlpha=1;
}
export function tailColor(age,pigment,id){
  const original=(pigment?.match(/[\d.]+/g)||['40','92','104']).slice(0,3).map(Number);
  const fresh=id%7===0?[179,120,74]:[74,155,164],old=id%7===0?[155,128,96]:[63,100,103];
  const release=ease(age/.65),fade=ease((age-.8)/2);
  const rgb=fresh.map((value,i)=>{
    const from=original[i]*.45+value*.55,to=value+(old[i]-value)*fade;
    return Math.round(from+(to-from)*release);
  });
  return `rgb(${rgb.join(',')})`;
}
