import {ease} from './formation.js';

export const HYDRO_DEFAULTS=Object.freeze({
  slowSpeed:180,fastSpeed:1100,releaseSpeed:580,filterSeconds:.055,
  shockCooldown:.45,shockSpacing:44,tapSlop:8,tapSeconds:.45,
  maxDisturbances:8,curiosityLife:7,shockLife:3.2,propagationSpeed:220,
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=n=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
export function koiPersonality(f){
  const seed=f.seed??f.id??0;
  return {curiosity:.3+hash(seed)*.65,sensitivity:.75+hash(seed+2)*.45,
    perception:f.length*(1.6+hash(seed+4)),maxFlee:1.5+hash(seed+6)*.35,
    recovery:3+hash(seed+8)*2,reactionDelay:.08+hash(seed+10)*.4,
    orbit:hash(seed+12)>.5?1:-1,...f.personality};
}
export function rippleAt(r,time){
  const age=time-r.born,life=r.life??5;if(age<0||age>life)return null;
  if(!r.kind)return {age,life,radius:5+age*23,ratio:.68,fade:1-age/life};
  const extent=r.extent??230,tau=r.kind==='tap'?1.8:.7;
  return {age,life,radius:5+extent*(1-Math.exp(-age/tau)),ratio:r.kind==='tap'?1:.62,
    fade:Math.exp(-age/(life*.42))*(1-age/(life*1.3))};
}
export function createHydrodynamics(options={}){
  const config={...HYDRO_DEFAULTS,...options};
  let events=[],pool=[],serial=0,pointer=null,press=null,armed=true,lastShock=-Infinity,lastSite=null;
  let lastInput='none';
  function clearPointer(){pointer=null;press=null;armed=true;}
  function reset(school=[]){events=[];pool=[];serial=0;lastShock=-Infinity;lastSite=null;lastInput='none';clearPointer();for(const f of school){f.response=null;f.waveAmplitude=1;}}
  function emit(kind,x,y,time,intensity,dirX=0,dirY=0,bounds={width:1280,height:900}){
    const scale=clamp(Math.min(bounds.width,bounds.height)/800,.6,1.3);
    const event=pool.pop()||{};
    Object.assign(event,{id:++serial,kind,x,y,born:time,strength:intensity,
      dirX,dirY,angle:Math.atan2(dirY,dirX),life:kind==='tap'?config.curiosityLife:config.shockLife,
      extent:(kind==='tap'?260:200)*scale,radius:(kind==='tap'?440:330)*scale,span:0});
    if(events.length>=config.maxDisturbances)pool.push(events.shift());
    events.push(event);lastInput=kind;return event;
  }
  function move(x,y,eventTime,sceneTime,{pointerType='mouse',blocked=false,bounds={width:1280,height:900}}={}){
    if(blocked){clearPointer();return null;}
    if(press)press.distance=Math.max(press.distance,Math.hypot(x-press.x,y-press.y));
    const prior=pointer;pointer={x,y,time:eventTime,speed:0,dirX:0,dirY:0};
    if(!prior||pointerType==='touch')return null;
    const dt=eventTime-prior.time,distance=Math.hypot(x-prior.x,y-prior.y);
    if(dt<=0||dt>.25)return null;
    const speed=prior.speed+(distance/Math.max(.004,dt)-prior.speed)*(1-Math.exp(-dt/config.filterSeconds));
    pointer.speed=speed;pointer.dirX=distance?(x-prior.x)/distance:prior.dirX;pointer.dirY=distance?(y-prior.y)/distance:prior.dirY;
    const scale=clamp(Math.min(bounds.width,bounds.height)/800,.6,1.3);
    pointer.regime=speed<config.slowSpeed*scale?'slow':speed<config.fastSpeed*scale?'moderate':'fast';
    if(speed<config.releaseSpeed*scale)armed=true;
    const spaced=!lastSite||Math.hypot(x-lastSite.x,y-lastSite.y)>=config.shockSpacing*scale;
    if(speed>=config.fastSpeed*scale&&spaced&&sceneTime-lastShock>=config.shockCooldown&&(armed||sceneTime-lastShock>.85)){
      armed=false;lastShock=sceneTime;lastSite={x,y};
      const disturbance=emit('shock',x,y,sceneTime,clamp(speed/(config.fastSpeed*scale)-.2,.6,1.5),pointer.dirX,pointer.dirY,bounds);
      disturbance.span=Math.min(distance,60*scale);return disturbance;
    }
    return null;
  }
  function down(x,y,eventTime,{pointerType='mouse',blocked=false}={}){
    if(blocked){clearPointer();return;}
    press={x,y,time:eventTime,pointerType,distance:0};
  }
  function up(x,y,eventTime,sceneTime,{blocked=false,bounds}={}){
    const start=press;press=null;
    if(!start||blocked)return null;
    if(start.distance>config.tapSlop||Math.hypot(x-start.x,y-start.y)>config.tapSlop||eventTime-start.time>config.tapSeconds)return null;
    return emit('tap',x,y,sceneTime,.85,0,0,bounds);
  }
  function update(fish,time,dt,bounds){
    events=events.filter(e=>{if(time-e.born<=e.life)return true;pool.push(e);return false;});
    for(const f of fish){
      const p=f.hydroPersonality||(f.hydroPersonality=koiPersonality(f));
      if(f.hydroLength&&f.hydroLength!==f.length)p.perception*=f.length/f.hydroLength;
      f.hydroLength=f.length;
      const response=f.response||(f.response={state:'WANDERING',since:time,effort:0,speedScale:1,x:0,y:0,seen:new Set(),threat:null,target:null});
      const activeIds=new Set(events.map(e=>e.id));for(const id of response.seen)if(!activeIds.has(id))response.seen.delete(id);
      for(const e of events){
        if(response.seen.has(e.id))continue;
        const distance=Math.hypot(f.x-e.x,f.y-e.y),reach=Math.min(e.radius,p.perception*(e.kind==='shock'?1.15:1.35));
        if(distance>reach)continue;
        if(time-e.born<distance/config.propagationSpeed+p.reactionDelay)continue;
        response.seen.add(e.id);
        const influence=(1-distance/reach)*e.strength;
        if(e.kind==='shock'&&influence*p.sensitivity>.12){
          response.state='STARTLED';response.since=time;response.threat={x:e.x,y:e.y,dirX:e.dirX,dirY:e.dirY,intensity:clamp(influence*p.sensitivity,.2,1)};response.target=null;
        }else if(e.kind==='tap'&&p.curiosity>.43&&influence*p.curiosity>.09&&['WANDERING','CURIOUS','INSPECTING'].includes(response.state)){
          response.state='CURIOUS';response.since=time;response.target={x:e.x,y:e.y,expires:e.born+config.curiosityLife};
        }
      }
      let desiredEffort=0;response.x=response.y=0;response.speedScale=1;response.wander=1;
      const age=time-response.since;
      if(response.state==='STARTLED'&&age>.3){response.state='FLEEING';}
      if(response.state==='FLEEING'&&age>1.4+(response.threat?.intensity||0)*.8){response.state='RECOVERING';response.since=time;}
      if(response.state==='RECOVERING'&&time-response.since>p.recovery){response.state='WANDERING';response.threat=null;}
      if(['STARTLED','FLEEING','RECOVERING'].includes(response.state)&&response.threat){
        const threat=response.threat,fade=response.state==='RECOVERING'?1-ease((time-response.since)/p.recovery):ease(age/.22);
        desiredEffort=threat.intensity*fade;
        let dx=f.x-threat.x,dy=f.y-threat.y,d=Math.hypot(dx,dy);
        if(d<1){dx=-threat.dirX||Math.cos(f.angle+Math.PI);dy=-threat.dirY||Math.sin(f.angle+Math.PI);d=Math.hypot(dx,dy);}
        response.x=(dx/d-dy/d*p.orbit*.16)*2.1*desiredEffort;
        response.y=(dy/d+dx/d*p.orbit*.16)*2.1*desiredEffort;
        response.speedScale=1+(p.maxFlee-1)*desiredEffort;response.wander=1-desiredEffort*.72;
      }else if(response.target&&['CURIOUS','INSPECTING'].includes(response.state)){
        const target=response.target,dx=target.x-f.x,dy=target.y-f.y,d=Math.max(1,Math.hypot(dx,dy)),want=f.length*.55;
        if(d<want*1.5&&response.state==='CURIOUS'){response.state='INSPECTING';response.since=time;}
        if(time>target.expires){response.state='WANDERING';response.target=null;}
        else{
          const gain=.9+p.curiosity,radial=clamp((d-want)/want,-.6,1);
          response.x=(dx/d*radial-dy/d*p.orbit*.52)*gain;
          response.y=(dy/d*radial+dx/d*p.orbit*.52)*gain;
          response.wander=.35;response.speedScale=response.state==='INSPECTING'?.58:.8;
        }
      }
      response.effort+=(desiredEffort-response.effort)*(1-Math.exp(-Math.max(0,dt)*5));
    }
  }
  function resize(from,to,school=[]){
    const sx=to.width/from.width,sy=to.height/from.height,scale=Math.min(to.width,to.height)/Math.min(from.width,from.height);
    for(const e of events){e.x*=sx;e.y*=sy;e.extent*=scale;e.radius*=scale;e.span*=scale;}
    for(const f of school)for(const point of [f.response?.target,f.response?.threat])if(point){point.x*=sx;point.y*=sy;}
    clearPointer();
  }
  return {config,move,down,up,update,reset,resize,clearPointer,get ripples(){return events;},get pointer(){return pointer;},get lastInput(){return lastInput;}};
}
