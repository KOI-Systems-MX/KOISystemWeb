import {rippleAt} from './hydrodynamics.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createFloaters(definitions,previous=[]){
  return definitions.map(d=>{
    const old=previous.find(p=>p.seed===d.seed),s=old?d.r/old.r:1;
    return {...d,dx:(old?.dx||0)*s,dy:(old?.dy||0)*s,vx:(old?.vx||0)*s,vy:(old?.vy||0)*s,tilt:old?.tilt||0,spin:old?.spin||0};
  });
}
export function advanceFloaters(plants,fish,ripples,time,delta,field){
  let remaining=Math.max(0,Math.min(delta,.1));
  while(remaining>1e-7){
    const dt=Math.min(remaining,1/60);remaining-=dt;const t=time-remaining;
    for(const f of plants){
      const x=f.x+f.dx,y=f.y+f.dy,seed=f.seed;
      const spring=.68+(seed%3)*.13,damping=1.65+(seed%4)*.17;
      let fx=field(x+seed*23,y,t*(.83+seed*.017))*4.5;
      let fy=field(x,y+seed*31,t*(1.07-seed*.009))*3.3;
      let torque=(field(x+12,y,t)-field(x-12,y,t))*.13;
      for(const koi of fish){
        const rx=x-koi.x,ry=y-koi.y,d=Math.hypot(rx,ry),reach=f.r+koi.length*.65+45;
        if(d>=reach||d<1)continue;
        const influence=(1-d/reach)**2*clamp(koi.speed/Math.max(1,koi.length*.4),0,2);
        const ux=Math.cos(koi.heading),uy=Math.sin(koi.heading);
        fx+=(ux*.7+rx/d*.3)*influence*7;fy+=(uy*.7+ry/d*.3)*influence*7;
        torque+=(rx/d*uy-ry/d*ux)*influence*.11;
      }
      for(const ripple of ripples){
        const wave=rippleAt(ripple,t);if(!wave)continue;const {age}=wave;
        const rx=x-ripple.x,ry=y-ripple.y,d=Math.hypot(rx,ry);if(d<1)continue;
        const band=Math.max(0,1-Math.abs(d-wave.radius)/Math.max(18,f.r*.8));
        const force=band*Math.exp(-age*.5)*ripple.strength*5;
        fx+=rx/d*force;fy+=ry/d*force;torque+=Math.sin(seed+age)*force*.012;
      }
      const weight=f.flower?.65:1;
      f.vx+=(fx*weight-spring*f.dx-damping*f.vx)*dt;f.vy+=(fy*weight-spring*f.dy-damping*f.vy)*dt;
      f.dx+=f.vx*dt;f.dy+=f.vy*dt;
      f.spin+=(torque*weight-1.1*f.tilt-2*f.spin)*dt;f.tilt+=f.spin*dt;
      const limit=f.flower?5:9,distance=Math.hypot(f.dx,f.dy);
      if(distance>limit){const s=limit/distance;f.dx*=s;f.dy*=s;f.vx*=.94;f.vy*=.94;}
      f.tilt=clamp(f.tilt,f.flower?-.035:-.065,f.flower?.035:.065);
    }
  }
}
