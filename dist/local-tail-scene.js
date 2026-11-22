import {ease} from './formation.js';
import {tailCodeParticle,codeVocabulary} from './code-vocabulary.js';

// Local fin evaporation and UI transitions deliberately have no spatial link.
// The target rectangle is never an attractor or a particle destination.
export function createLocalTailScene({product='pos'}={}){
  let particles=[],serial=0,lastTime=null,cycleStart=null,dissolveAt=null,theme=product;
  const emissions=new Map();
  const radius=source=>Math.max(26,Math.min(64,(source.length??140)*.42));
  function reset(){particles=[];serial=0;lastTime=cycleStart=dissolveAt=null;emissions.clear();}
  return {
    reset,
    setProduct(id){theme=Object.hasOwn(codeVocabulary,id)?id:'pos';},
    requestDissolution(time){if(cycleStart===null||time-cycleStart<6||dissolveAt!==null)return false;dissolveAt=time;return true;},
    update(time,sources,_target,still=false){
      if(still)return {particles:[],settled:[],progress:1,components:[1,1,1,1,1],phase:'software'};
      if(cycleStart===null)cycleStart=time;
      const dt=lastTime===null?0:Math.max(0,Math.min(.1,time-lastTime));lastTime=time;
      const anchors=new Map(sources.map(source=>[source.fishId,source]));
      for(const id of emissions.keys())if(!anchors.has(id))emissions.delete(id);
      for(const source of sources){
        if(dt===0||source.speed<1||time-(emissions.get(source.fishId)??-1)<.26)continue;
        emissions.set(source.fishId,time);
        const existing=particles.filter(p=>p.fishId===source.fishId).length;
        for(let j=0;j<2&&existing+j<12&&particles.length<64;j++){
          const id=serial++,port=source.ports?.length?source.ports[id%source.ports.length]:source;
          const heading=port.heading??source.heading??0,speed=source.speed??30;
          const token=tailCodeParticle(theme,id);if(token.text.length>6)token.text='const';
          particles.push({id,fishId:source.fishId,product:theme,...token,
            x:port.x,y:port.y,sx:port.x,sy:port.y,u:port.u,v:port.v,sourceColor:port.color,
            vx:Math.cos(heading)*speed*.3+Math.sin(id*2.1)*2,vy:Math.sin(heading)*speed*.3+Math.cos(id*1.7)*2,
            age:0,life:1.05+(id%3)*.12,column:id%3,rotation:0,alpha:0,slot:null,slots:[],phase:'drift',range:radius(source)});
        }
      }
      particles=particles.filter(p=>{
        p.age+=dt;const source=anchors.get(p.fishId),ports=source?.ports?.length?source.ports:source?[source]:[];
        const fall=ease((p.age-.18)/.5);
        p.vx*=Math.exp(-dt*2.4);p.vy+=((9+p.column*3)*fall-p.vy*1.5)*dt;
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.phase=fall>.3?'rain':'drift';
        // Fade before reaching the local radius, even when the koi turns away.
        // World-space positions are never rotated or snapped back toward the fish.
        const distance=ports.length?Math.min(...ports.map(port=>Math.hypot(p.x-port.x,p.y-port.y))):Math.hypot(p.x-p.sx,p.y-p.sy);
        const proximity=1-ease((distance-p.range*.55)/(p.range*.45));
        p.alpha=ease(p.age/.12)*(1-ease((p.age-p.life+.7)/.7))*proximity*.42;
        return p.age<p.life&&distance<p.range;
      });
      const age=time-cycleStart,dissolve=dissolveAt===null?0:ease((time-dissolveAt)/2.8);
      const components=[.4,.9,1.5,2.1,2.7].map(delay=>ease((age-delay)/2.1)*(1-dissolve));
      const state={particles,settled:[],components,progress:components.reduce((sum,v)=>sum+v,0)/5,
        phase:dissolveAt!==null?'dissolution':age>=6?'software':'materialization'};
      if(dissolve===1){cycleStart=time;dissolveAt=null;state.recycled=true;}
      return state;
    },
  };
}
