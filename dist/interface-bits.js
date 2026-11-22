import {codeParticle,tailCodeParticle,codeVocabulary} from './code-vocabulary.js';
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function makeSlots(){
  const slots=[];
  for(let row=0;row<45;row++)for(let column=0;column<36;column++){
    const group=row<3?0:row<9?1:row<23?2:row<35?3:4;
    slots.push({u:(column+.5)/36,v:(row+.5)/45,group});
  }
  return slots;
}
export function createBitStream({autoCycle=true,product='pos',tailCode=false}={}){
  let slots=makeSlots();const totals=[0,0,0,0,0];slots.forEach(s=>totals[s.group]++);
  let particles=[],settled=[],arrived=0,emitted=0,lastEmission=-1,lastTime=null,issued=0;
  let components=[0,0,0,0,0],counts=[0,0,0,0,0],region=null,completeAt=null,requestedAt=null,theme=product;
  return {
    reset(){particles=[];settled=[];arrived=emitted=issued=0;lastEmission=-1;lastTime=null;components=[0,0,0,0,0];counts=[0,0,0,0,0];region=null;completeAt=requestedAt=null;},
    setLayout(layout){slots=layout.map(s=>({...s}));totals.fill(0);slots.forEach(s=>totals[s.group]++);},
    setProduct(id){theme=Object.hasOwn(codeVocabulary,id)?id:'pos';},
    requestDissolution(time){if(completeAt===null||requestedAt!==null)return false;requestedAt=time;return true;},
    update(time,sources,target,still=false){
      if(still)return {particles:[],settled:[],progress:1,components:[1,1,1,1,1],phase:'software'};
      const dt=lastTime===null?0:clamp(time-lastTime,0,.1);lastTime=time;
      if(!region)region={...target};
      const blend=1-Math.exp(-dt*8);for(const key of ['left','top','width','height'])region[key]+=(target[key]-region[key])*blend;
      if(dt>0&&time>(tailCode?.15:2.4)&&time-lastEmission>(issued<slots.length?.10:tailCode?.16:.5)&&particles.length<1160){
        lastEmission=time;
        for(const source of sources){
          if(source.speed!==undefined&&source.speed<1)continue;
          const intensity=tailCode?clamp(source.fragmentation??.65,.2,1):1;
          const batch=issued<slots.length?(tailCode?Math.round(5+intensity*2):14):(tailCode?3:1);
          for(let grain=0;grain<batch&&particles.length<1200;grain++){
            const id=emitted++,heading=source.heading||0,speed=source.speed??30;
            const port=tailCode&&source.ports?.length?source.ports[id%source.ports.length]:source;
            const slot=issued<slots.length&&(!tailCode||id%3===0)?slots[issued++]:null;
            const direction=port.heading??heading;
            particles.push({id,fishId:source.fishId,product:theme,...(tailCode?tailCodeParticle(theme,id):codeParticle(theme,id)),x:port.x,y:port.y,sx:port.x,sy:port.y,u:port.u,v:port.v,sourceColor:port.color,fragmentation:port.fragmentation,column:id%7,vx:Math.cos(direction)*speed*.4-Math.sin(id*2.1)*7,vy:Math.sin(direction)*speed*.4+Math.cos(id*1.7)*7,rotation:clamp(direction*.1,-.2,.2),age:0,slot,slots:slot?[slot]:[],phase:'emission',alpha:0});
          }
        }
      }
      const active=[];
      for(const p of particles){
        p.age+=dt;
        if(!p.slot){
          const fall=tailCode?ease((p.age-.35)/.9):0;
          p.vx*=Math.exp(-dt*(1.5+fall*2));p.vy+=(tailCode?(22+p.column*7)*fall-p.vy*.7:0)*dt;
          if(!tailCode)p.vy*=Math.exp(-dt*1.5);
          p.x+=p.vx*dt;p.y+=p.vy*dt;p.phase=fall>.25?'rain':'drift';
          p.rotation+=(Math.sin(time*.3+p.id)*.035-p.rotation)*(1-Math.exp(-dt*2));
          const life=tailCode?2.5+p.column*.14:2.3;
          p.alpha=ease(p.age/.2)*(1-ease((p.age-life+1.1)/1.1))*.6;
          if(p.age<life)active.push(p);continue;
        }
        const tx=region.left+p.slot.u*region.width,ty=region.top+p.slot.v*region.height,pull=ease((p.age-.5)/.9);
        p.phase=pull<.1?'emission':Math.hypot(tx-p.x,ty-p.y)>14?'attraction':'organization';
        let remaining=dt;
        while(remaining>1e-7){
          const step=Math.min(remaining,1/60);remaining-=step;
          const swirl=Math.sin(time*.7+p.id*.9)*(1-pull)*5;
          p.vx+=((tx-p.x)*pull*4.6-p.vx*(1+pull*2.8)+swirl)*step;
          p.vy+=((ty-p.y)*pull*4.6-p.vy*(1+pull*2.8)+Math.cos(time*.53+p.id)*5*(1-pull))*step;
          const speed=Math.hypot(p.vx,p.vy);if(speed>180){p.vx*=180/speed;p.vy*=180/speed;}
          p.x+=p.vx*step;p.y+=p.vy*step;
        }
        const orientation=clamp(Math.atan2(p.vy,p.vx)*.08,-.16,.16)*(1-pull);
        p.rotation+=(orientation-p.rotation)*(1-Math.exp(-dt*3));
        p.alpha=ease(p.age/.25)*.74;
        if(p.age>1&&Math.hypot(tx-p.x,ty-p.y)<2&&Math.hypot(p.vx,p.vy)<7){settled.push({...p,landedAt:time});arrived+=p.slots.length;counts[p.slot.group]+=p.slots.length;}
        else active.push(p);
      }
      particles=active;
      if(arrived===slots.length&&completeAt===null)completeAt=time;
      const dissolveAt=autoCycle&&completeAt!==null?completeAt+18:requestedAt;
      const dissolve=dissolveAt===null?0:ease((time-dissolveAt)/6);
      for(let i=0;i<5;i++){
        // Let each region fill with code before it turns into a readable module.
        const destination=ease(((totals[i]?counts[i]/totals[i]:1)-.82)/.18)*(1-dissolve);
        components[i]+=(destination-components[i])*(1-Math.exp(-dt*2.2));
        if(components[i]>.999)components[i]=1;
      }
      const organized=settled.map(p=>({...p,rotation:dissolve>0?Math.sin(p.id)*dissolve*.1:0,x:region.left+p.slot.u*region.width+Math.sin(p.id*2.3)*70*dissolve**2,y:region.top+p.slot.v*region.height+Math.cos(p.id*1.7)*55*dissolve**2,alpha:dissolve>0?ease(dissolve*4)*(1-ease((dissolve-.55)/.45))*.74:arrived===slots.length?0:(1-components[p.slot.group])*.74}));
      const state={particles,settled:organized,progress:arrived/slots.length*(1-dissolve),components:[...components],phase:dissolve>0?'dissolution':arrived===slots.length?'software':arrived>slots.length*.3?'materialization':settled.length?'organization':particles.some(p=>p.phase==='attraction')?'attraction':'emission'};
      if(dissolve===1&&components.every(v=>v<.001)){particles=particles.filter(p=>!p.slot);settled=[];arrived=issued=0;counts=[0,0,0,0,0];components=[0,0,0,0,0];completeAt=requestedAt=null;lastEmission=time;state.recycled=true;}
      return state;
    },
  };
}
