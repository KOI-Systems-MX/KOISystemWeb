import {ease} from './formation.js';

// Only delivered, real tail fragments supply construction time. Geometry is
// captured from the current product, so code resolves into its actual modules.
export function createComponentConstruction(){
  let blueprint=[],clock=0,credit=0,last=null,owner=null,flight=[],used=new Set(),dissolveAt=null,entry={u:.5,v:.5},serial=0,received=0;
  let materialCode=[];
  const duration=12.6;
  function reset(){clock=credit=received=serial=0;last=null;owner=null;flight=[];materialCode=[];used.clear();dissolveAt=null;}
  return {
    reset,
    setBlueprint(nodes){blueprint=nodes.map(node=>({...node,cache:null}));},
    requestDissolution(t){if(clock<duration||dissolveAt!==null)return false;dissolveAt=t;return true;},
    update(t,sources,target,particles,still=false){
      const dt=last===null?0:Math.max(0,Math.min(.1,t-last));
      const finish=still||clock>=duration;
      const masks=[],assembly=[],transfers=[];
      if(!still){
        last=t;
        if(owner!==null&&!flight.length&&!sources.some(s=>s.fishId===owner&&s.ports?.some(p=>p.x>target.left-48&&p.x<target.left+target.width+48&&p.y>target.top-48&&p.y<target.top+target.height+48)))owner=null;
        if(dt>0&&clock+credit+flight.length*1.65<duration&&dissolveAt===null&&flight.length<4){
          const candidate=particles.find(p=>!used.has(p.id)&&p.age<.32&&(owner===null||p.fishId===owner)&&
            sources.some(s=>s.fishId===p.fishId&&s.ports?.some(port=>Math.hypot(port.x-Math.max(target.left,Math.min(target.left+target.width,port.x)),port.y-Math.max(target.top,Math.min(target.top+target.height,port.y)))<=48))&&
            p.x>target.left-40&&p.x<target.left+target.width+40&&p.y>target.top-40&&p.y<target.top+target.height+40);
          if(candidate){
            owner=candidate.fishId;used.add(candidate.id);
            let tx=Math.max(target.left+8,Math.min(target.left+target.width-8,candidate.x));
            let ty=Math.max(target.top+8,Math.min(target.top+target.height-8,candidate.y));
            // An in-window tail still contributes visibly, over a short arc.
            if(Math.hypot(tx-candidate.x,ty-candidate.y)<8){
              const dx=target.left+target.width/2-tx,dy=target.top+target.height/2-ty,d=Math.max(1,Math.hypot(dx,dy));
              tx+=dx/d*22;ty+=dy/d*22;
            }
            flight.push({...candidate,sourceId:candidate.id,id:serial++,sx:candidate.x,sy:candidate.y,tx,ty,age:0,handoff:true});
          }
        }
        flight=flight.filter(p=>{
          p.age+=dt;
          if(p.age>=.85){credit+=1.65;materialCode.push({sourceId:p.sourceId,text:p.text,fishId:p.fishId});if(!received)entry={u:(p.tx-target.left)/target.width,v:(p.ty-target.top)/target.height};received++;return false;}
          return true;
        });
        if(credit>0){const step=Math.min(dt,credit,duration-clock);clock+=step;credit-=step;}
        for(const p of flight){const u=ease(p.age/.85);transfers.push({...p,x:p.sx+(p.tx-p.sx)*u,y:p.sy+(p.ty-p.sy)*u-Math.sin(u*Math.PI)*4,alpha:Math.min(1,p.age/.12)*.8});}
      }
      const dissolve=dissolveAt===null?0:ease((t-dissolveAt)/2.8);
      const stage=Math.min(6,Math.floor(clock/1.8));
      for(const node of blueprint){
        if(still||clock>=duration){masks.push({id:node.id,width:node.width,height:node.height,cells:[],complete:true});continue;}
        const cols=Math.max(1,Math.ceil(node.width/12)),rows=Math.max(1,Math.ceil(node.height/12)),cells=[];
        const key=`${entry.u}:${entry.v}`;
        if(node.cache?.key===key)cells.push(...node.cache.cells);
        else {for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
          const x=col*node.width/cols,y=row*node.height/rows,w=node.width/cols,h=node.height/rows;
          const edge=row===0||col===0||row===rows-1||col===cols-1;
          const group=node.bed?(edge?0:1):node.stage;
          const u=(node.x+x-target.left)/target.width,v=(node.y+y-target.top)/target.height;
          cells.push({x,y,w,h,group,distance:Math.hypot(u-entry.u,v-entry.v),id:row*cols+col});
        }
        // Stable spatial ranking fans out from the received fragment.
        cells.sort((a,b)=>a.group-b.group||a.distance-b.distance||a.id-b.id);node.cache={key,cells};}
        const totals=new Map(),counts=new Map();for(const c of cells)totals.set(c.group,(totals.get(c.group)||0)+1);
        const visible=[];
        for(const cell of cells){
          const rank=(counts.get(cell.group)||0);counts.set(cell.group,rank+1);
          const progress=still||clock>=duration?1:Math.max(0,Math.min(1,(clock-cell.group*1.8)/1.8));
          const at=rank/totals.get(cell.group),local=(progress-at)*totals.get(cell.group);
          if(progress>=1||local>=1)visible.push(cell);
          else if(progress>0&&local>-10&&local<1&&assembly.length<70&&dissolveAt===null){
            const settle=ease(Math.max(0,Math.min(1,(local+10)/11)));
            const material=materialCode[cell.id%materialCode.length];
            if(!material)continue;
            assembly.push({id:cell.id,...material,assembly:true,handoff:true,kind:'code',age:0,
              x:node.x+cell.x+cell.w/2+(1-settle)*8,y:node.y+cell.y+cell.h/2-(1-settle)*10,
              alpha:.7,scale:1-settle*.65,rotation:0});
          }
        }
        masks.push({id:node.id,width:node.width,height:node.height,cells:visible,complete:visible.length===cells.length});
      }
      const progress=still?1:clock/duration;
      const state={particles:particles.filter(p=>!used.has(p.id)),settled:[],transfers,assembly,masks,received,stage,
        builder:finish?null:owner,progress:progress*(1-dissolve),components:Array(5).fill(progress*(1-dissolve)),
        phase:still||clock>=duration?'software':received?'materialization':'emission',surface:still?1:Math.max(0,Math.min(1,(clock-1.8)/1.8))*(1-dissolve)};
      if(dissolveAt!==null){state.phase='dissolution';state.progress=1-dissolve;}
      if(dissolve===1){reset();state.recycled=true;state.masks=[];}
      // Keep the source-id bookkeeping bounded across long, contemplative sessions.
      if(used.size>2000){const live=new Set(particles.map(p=>p.id));used=new Set([...used].filter(id=>live.has(id)));}
      return state;
    },
  };
}
