import {ease} from './formation.js';
import {tailCodeParticle,codeVocabulary} from './code-vocabulary.js';
import {createComponentConstruction} from './component-construction.js';

// Tail evaporation stays local. The optional construction cue is restricted to
// one nearby fin; the target is never a long-distance particle attractor.
export function createLocalTailScene({product='pos',nearbyBuild=false,buildAfter=0,componentBuild=false}={}){
  const construction=componentBuild?createComponentConstruction():null;
  let particles=[],serial=0,lastTime=null,cycleStart=null,dissolveAt=null,theme=product;
  let builder=null,transfers=[],lastTransfer=-1;
  const emissions=new Map(),portHistory=new Map(),particlePool=[];
  const radius=source=>Math.max(26,Math.min(64+12*(source.effort??0),(source.length??140)*.42+12*(source.effort??0)));
  function nearbyPort(source,target){
    const ports=source.ports?.length?source.ports:[source];
    return ports.map(port=>{
      const x=Math.max(target.left+8,Math.min(target.left+target.width-8,port.x));
      const y=Math.max(target.top+8,Math.min(target.top+target.height-8,port.y));
      return {port,x,y,distance:Math.hypot(x-port.x,y-port.y)};
    }).sort((a,b)=>a.distance-b.distance)[0];
  }
  function reset(){construction?.reset();particles=[];transfers=[];builder=null;lastTransfer=-1;serial=0;lastTime=cycleStart=dissolveAt=null;emissions.clear();portHistory.clear();particlePool.length=0;}
  return {
    reset,
    setBlueprint(nodes){construction?.setBlueprint(nodes);},
    setProduct(id){theme=Object.hasOwn(codeVocabulary,id)?id:'pos';},
    requestDissolution(time){if(construction)return construction.requestDissolution(time);if(cycleStart===null||time-cycleStart<6||dissolveAt!==null)return false;dissolveAt=time;return true;},
    update(time,sources,target,still=false){
      if(still)return construction?construction.update(time,sources,target,[],true):{particles:[],settled:[],transfers:[],assembly:[],builder:null,progress:1,components:[1,1,1,1,1],phase:'software'};
      if(cycleStart===null){
        if(!nearbyBuild)cycleStart=time;
        else if(time>=buildAfter){
          const candidate=sources.filter(source=>source.speed>=1).map(source=>({source,near:nearbyPort(source,target)}))
            .filter(candidate=>candidate.near.distance<=48).sort((a,b)=>a.near.distance-b.near.distance)[0];
          if(candidate){cycleStart=time;builder=candidate.source.fishId;}
        }
      }
      const dt=lastTime===null?0:Math.max(0,Math.min(.1,time-lastTime));lastTime=time;
      const anchors=new Map(sources.map(source=>[source.fishId,source]));
      for(const id of emissions.keys())if(!anchors.has(id))emissions.delete(id);
      for(const id of portHistory.keys())if(!anchors.has(id))portHistory.delete(id);
      const measured=new Map();
      for(const source of sources){
        const history=portHistory.get(source.fishId),positions=new Map();
        const ports=(source.ports?.length?source.ports:[source]).map((port,i)=>{
          const key=`${port.u??i}:${port.v??0}`,prior=history?.positions.get(key),delta=time-(history?.time??time);
          positions.set(key,{x:port.x,y:port.y});
          let vx=source.vx??Math.cos(port.heading??0)*source.speed,vy=source.vy??Math.sin(port.heading??0)*source.speed;
          if(prior&&delta>0&&delta<=.1){vx=(port.x-prior.x)/delta;vy=(port.y-prior.y)/delta;}
          const magnitude=Math.hypot(vx,vy),limit=Math.max(20,source.speed*1.8),scale=magnitude>limit?limit/magnitude:1;
          return {...port,vx:vx*scale,vy:vy*scale};
        });
        measured.set(source.fishId,ports);
        if(!history||time>history.time)portHistory.set(source.fishId,{time,positions});
      }
      for(const source of sources){
        if(dt===0||source.speed<1||time-(emissions.get(source.fishId)??-1)<.26-.04*(source.effort??0))continue;
        emissions.set(source.fishId,time);
        const existing=particles.filter(p=>p.fishId===source.fishId).length;
        for(let j=0;j<2&&existing+j<12&&particles.length<64;j++){
          const id=serial++,ports=measured.get(source.fishId),port=ports[id%ports.length];
          const heading=port.heading??source.heading??0,speed=source.speed??30;
          const token=tailCodeParticle(theme,id);if(token.text.length>6)token.text='const';
          const normalX=-Math.sin(heading),normalY=Math.cos(heading);
          const particle=particlePool.pop()||{};
          Object.assign(particle,{id,fishId:source.fishId,product:theme,...token,
            x:port.x,y:port.y,sx:port.x,sy:port.y,u:port.u,v:port.v,sourceColor:port.color,
            vx:port.vx*.28+normalX*Math.sin(id*2.1)*2,vy:port.vy*.28+normalY*Math.sin(id*2.1)*2,normalX,normalY,
            age:0,life:1.05+(id%3)*.12+(source.effort??0)*.25,column:id%3,rotation:0,alpha:0,slot:null,slots:[],phase:'drift',range:radius(source)});
          particles.push(particle);
        }
      }
      particles=particles.filter(p=>{
        p.age+=dt;const source=anchors.get(p.fishId),ports=source?.ports?.length?source.ports:source?[source]:[];
        const dispersion=Math.sin(p.id*1.7+p.age*2)*ease(p.age/.6)*2.2;
        p.vx*=Math.exp(-dt*1.8);p.vy*=Math.exp(-dt*1.8);
        p.x+=(p.vx+p.normalX*dispersion)*dt;p.y+=(p.vy+p.normalY*dispersion)*dt;p.phase='wake';
        // Fade before reaching the local radius, even when the koi turns away.
        // World-space positions are never rotated or snapped back toward the fish.
        const distance=ports.length?Math.min(...ports.map(port=>Math.hypot(p.x-port.x,p.y-port.y))):Math.hypot(p.x-p.sx,p.y-p.sy);
        const proximity=1-ease((distance-p.range*.55)/(p.range*.45));
        p.alpha=ease(p.age/.12)*(1-ease((p.age-p.life+.7)/.7))*proximity*.42;
        const alive=p.age<p.life&&distance<p.range;
        if(!alive&&particlePool.length<64)particlePool.push(p);
        return alive;
      });
      if(construction)return construction.update(time,sources,target,particles);
      const age=cycleStart===null?0:time-cycleStart,dissolve=dissolveAt===null?0:ease((time-dissolveAt)/2.8);
      if(nearbyBuild&&builder!==null&&dissolveAt===null&&age<4.2&&dt>0&&time-lastTransfer>.22&&transfers.length<4){
        const source=anchors.get(builder),near=source?nearbyPort(source,target):null;
        if(near&&near.distance<=48){
          lastTransfer=time;let tx=near.x,ty=near.y;
          if(near.distance<8){
            const dx=target.left+target.width*.5-near.port.x,dy=target.top+target.height*.5-near.port.y,d=Math.max(1,Math.hypot(dx,dy));
            tx=near.port.x+dx/d*24;ty=near.port.y+dy/d*24;
          }
          const id=serial++;transfers.push({id,fishId:builder,handoff:true,kind:'code',text:id%2?'1':'0',
            sx:near.port.x,sy:near.port.y,x:near.port.x,y:near.port.y,tx,ty,sourceColor:near.port.color,age:0,alpha:0,rotation:0});
        }
      }
      transfers=transfers.filter(p=>{
        p.age+=dt;const u=ease(p.age/.85);p.x=p.sx+(p.tx-p.sx)*u;p.y=p.sy+(p.ty-p.sy)*u-Math.sin(u*Math.PI)*5;
        p.alpha=ease(p.age/.1)*(1-ease((p.age-.5)/.35))*.6;
        return p.age<.85&&age<6&&dissolveAt===null;
      });
      const components=[.4,.9,1.5,2.1,2.7].map(delay=>ease((age-delay)/2.1)*(1-dissolve));
      // A nearby fin seeds a local binary assembly inside the window. Bits fill
      // only the moving construction front, then clear as the actual UI resolves.
      const assembly=[];
      if(nearbyBuild&&cycleStart!==null&&dissolveAt===null&&age<5.8){
        const gap=Math.max(8,target.width/48),rows=Math.floor(target.height/gap),cols=Math.floor(target.width/gap);
        for(let row=1;row<rows;row++)for(let col=1;col<cols;col++){
          const group=Math.min(4,Math.floor(row/rows*5)),reveal=components[group];
          const offset=col/cols-reveal;
          if(reveal<=0||reveal>=.995||offset<-.07||offset>.27)continue;
          const id=row*cols+col;
          const alpha=Math.sin(Math.PI*(offset+.07)/.34)*.72;
          assembly.push({id,fishId:builder,assembly:true,handoff:true,kind:'bit',text:id%2?'1':'0',
            x:target.left+col*gap,y:target.top+row*gap+Math.sin(age*2+id)*offset*9,
            age,alpha,rotation:0});
        }
      }
      const state={particles,settled:[],transfers,assembly,builder:age<6?builder:null,components,progress:components.reduce((sum,v)=>sum+v,0)/5,
        phase:dissolveAt!==null?'dissolution':cycleStart===null?'emission':age>=6?'software':'materialization'};
      if(dissolve===1){cycleStart=nearbyBuild?null:time;dissolveAt=null;builder=null;transfers=[];lastTransfer=-1;state.recycled=true;}
      return state;
    },
  };
}
