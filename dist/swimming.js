const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angleDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

export function edgeOfPanel(x,y,box){
  let dx=x-clamp(x,box.left,box.right),dy=y-clamp(y,box.top,box.bottom),distance=Math.hypot(dx,dy);
  if(distance<.001){
    const edges=[{distance:x-box.left,dx:-1,dy:0},{distance:box.right-x,dx:1,dy:0},{distance:y-box.top,dx:0,dy:-1},{distance:box.bottom-y,dx:0,dy:1}];
    const nearest=edges.reduce((a,b)=>a.distance<b.distance?a:b);
    return {distance:-nearest.distance,nx:nearest.dx,ny:nearest.dy};
  }
  return {distance,nx:dx/distance,ny:dy/distance};
}

function historyAt(f,behind){
  const target=f.travel-behind,path=f.path;
  if(target<=path[0].d)return path[0];
  let lo=0,hi=path.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(path[mid].d<target)lo=mid;else hi=mid;}
  const a=path[lo],b=path[hi],u=clamp((target-a.d)/Math.max(.00001,b.d-a.d),0,1);
  return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
}

function swimmerLength(bounds){
  const width=bounds.width-(bounds.left||0);
  return Math.min(bounds.width<700?112:186,width*(width<700?.24:.145),bounds.height*.24);
}

export function resizeSwimmers(fish,from,to){
  const scale=swimmerLength(to)/swimmerLength(from);
  for(const f of fish){
    const x=(to.left||0)+(f.x-(from.left||0))*(to.width-(to.left||0))/(from.width-(from.left||0)),y=f.y*to.height/from.height;
    // Rescale the spine uniformly around the moving head, never stretch x/y separately.
    for(const p of f.path){p.x=x+(p.x-f.x)*scale;p.y=y+(p.y-f.y)*scale;p.d*=scale;}
    f.x=x;f.y=y;f.length*=scale;f.travel*=scale;f.speed*=scale;f.cruise*=scale;f.bounds=to;
    if(f.box.allowUnderpass){
      let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
      for(let k=0;k<=12;k++)for(const side of [-1,1]){
        const p=spinePoint(f,(k/12-.5)*f.length,side*f.length*.38);
        left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);
      }
      const dx=left<(to.left||0)+8?(to.left||0)+8-left:right>to.width-8?to.width-8-right:0;
      const dy=top<8?8-top:bottom>to.height-8?to.height-8-bottom:0;
      f.x+=dx;f.y+=dy;for(const p of f.path){p.x+=dx;p.y+=dy;}
    }
  }
}

export function createSwimmers(box,bounds={width:1280,height:800}){
  const origin=bounds.left||0,w=bounds.width-origin,h=bounds.height,small=bounds.width<700;
  const length=swimmerLength(bounds);
  const margin=length*.64;
  const lanes=box.allowUnderpass?[
    {x:w*.22,y:h*.32,angle:-Math.PI/2},
    {x:w*.78,y:h*.66,angle:Math.PI/2},
    {x:Math.max(length*1.2,w*.28),y:h*.78,angle:0},
    {x:Math.min(w-length*1.2,w*.72),y:h*.22,angle:Math.PI},
  ]:[
    {x:box.left-margin-30,y:box.top+(box.bottom-box.top)*.32,angle:-1.65},
    {x:box.right+margin+22,y:box.top+(box.bottom-box.top)*.71,angle:1.55},
    {x:box.left-margin-72,y:box.bottom-24,angle:-1.1},
    {x:box.right+margin+58,y:box.top+10,angle:2.0},
  ];
  return lanes.slice(0,small?3:4).map((start,index)=>{
    if(box.allowUnderpass)start={...start,x:start.x+origin};
    const l=length*[1,.91,1.08,.96][index],speed=l*(.35+index*.025);
    const f={...start,id:index,blue:index%2===1,seed:.7+index*2.73,length:l,speed,cruise:speed,yaw:0,wave:index*1.7,finPhase:index*2.13,travel:0,lastTime:0,path:[],box,bounds,direction:index%2?1:-1};
    for(let d=l*1.8;d>=0;d-=2)f.path.push({x:f.x-Math.cos(f.angle)*d,y:f.y-Math.sin(f.angle)*d,d:-d});
    f.path.push({x:f.x,y:f.y,d:0});
    return f;
  });
}

export function advanceSwimmers(fish,box,time,bounds=fish[0]?.bounds,motion=()=>1){
  // A frame gap is subdivided, so steering and trajectory do not depend on FPS.
  for(const f of fish){
    const motionScale=clamp(motion(f,time),.05,1);
    if(f.travel===0)f.speed=f.cruise*motionScale;
    let remaining=clamp(time-f.lastTime,0,.15);f.lastTime=time;f.box=box;f.bounds=bounds;
    while(remaining>1e-7){
      const dt=Math.min(remaining,1/60);remaining-=dt;
      const t=time-remaining,w=bounds.width,h=bounds.height,L=f.length,origin=bounds.left||0;
      const wander=.58*Math.sin(t*.19+f.seed)+.25*Math.sin(t*.071+f.seed*2);
      const response=f.response,weight=response?.wander??1;
      let vx=Math.cos(f.angle+wander*.32)*weight,vy=Math.sin(f.angle+wander*.32)*weight;
      const clearance=Math.min(f.x-origin,w-f.x,f.y,h-f.y);
      const reactionSafety=clamp((clearance-L*.9)/(L*.8),0,1);
      const bank=L*(box.allowUnderpass?1.6:.58);
      const bankX=f.x+(box.allowUnderpass?Math.cos(f.angle)*L*.6:0),bankY=f.y+(box.allowUnderpass?Math.sin(f.angle)*L*.6:0);
      vx+=clamp((origin+bank-bankX)/bank,0,2)*2.2-clamp((bankX-w+bank)/bank,0,2)*2.2;
      vy+=clamp((bank-bankY)/bank,0,2)*2.2-clamp((bankY-h+bank)/bank,0,2)*2.2;
      const look=L*1.25;
      const e=edgeOfPanel(f.x+Math.cos(f.angle)*look,f.y+Math.sin(f.angle)*look,box);
      const safety=L*1.25+20;
      if(!box.allowUnderpass&&e.distance<safety+L*.38){
        const pressure=clamp(1-(e.distance-safety)/(L*.38),0,3);
        const a={x:-e.ny,y:e.nx},b={x:e.ny,y:-e.nx};
        const tangent=(a.x*Math.cos(f.angle)+a.y*Math.sin(f.angle)>b.x*Math.cos(f.angle)+b.y*Math.sin(f.angle))?a:b;
        vx+=e.nx*pressure*3+tangent.x*pressure*1.8;
        vy+=e.ny*pressure*3+tangent.y*pressure*1.8;
      }
      if(response){vx+=response.x*reactionSafety;vy+=response.y*reactionSafety;}
      for(const other of fish){if(other===f)continue;const dx=f.x-other.x,dy=f.y-other.y,d=Math.hypot(dx,dy),space=(L+other.length)*.3;if(d>1&&d<space){const force=(1-d/space)*1.6;vx+=dx/d*force;vy+=dy/d*force;}}
      const delta=angleDifference(Math.atan2(vy,vx),f.angle),limit=f.speed/(L*.38);
      const desiredYaw=clamp(delta*2,-limit,limit);
      f.yaw+=(desiredYaw-f.yaw)*(1-Math.exp(-dt*4));
      f.angle+=f.yaw*dt;
      // Independent, broad pauses in pace; no stopping or synchronized cycles.
      const rest=.17*Math.max(0,Math.sin(t*(.14+f.id*.007)+f.seed*1.9))**6;
      const reactiveSpeed=1+((response?.speedScale??1)-1)*reactionSafety;
      let target=f.cruise*motionScale*reactiveSpeed*(1-rest+.13*Math.sin(t*.31+f.seed))*(1-Math.min(.22,Math.abs(f.yaw)*.22));
      if(response)target=Math.min(target,f.cruise*motionScale*(f.hydroPersonality?.maxFlee??1.85));
      const change=(target-f.speed)*(1-Math.exp(-dt*(response?.state==='STARTLED'?2.6:1.4)));
      f.speed+=response&&response.state!=='WANDERING'?clamp(change,-f.cruise*1.5*dt,f.cruise*1.8*dt):change;
      const effort=(response?.effort??0)*reactionSafety;
      f.waveAmplitude=(f.waveAmplitude??1)+(1+effort*.28-(f.waveAmplitude??1))*(1-Math.exp(-dt*4));
      f.x+=Math.cos(f.angle)*f.speed*dt;f.y+=Math.sin(f.angle)*f.speed*dt;
      f.travel+=f.speed*dt;f.wave+=dt*(2.3+f.speed/L*4.7)*(.4+.6*motionScale)*(1+effort*.16);
      f.finPhase+=dt*(1.35+f.speed/L*2.1+effort*.5);
      f.path.push({x:f.x,y:f.y,d:f.travel});
      while(f.path.length>3&&f.path[1].d<f.travel-L*1.9)f.path.shift();
    }
  }
}

export function spinePoint(f,longitudinal,lateral=0){
  const behind=f.length*.48-longitudinal;
  const p=historyAt(f,behind),a=historyAt(f,behind-2),b=historyAt(f,behind+2);
  const heading=Math.atan2(a.y-b.y,a.x-b.x);
  return {x:p.x-Math.sin(heading)*lateral,y:p.y+Math.cos(heading)*lateral,heading};
}

// Shared material coordinates for painted mesh, emerging code and tail ports.
// u=0 tail, u=1 head; v=.5 is the centerline. No animation lives in the renderer.
function anatomySection(f,u){
  const tail=1-u,phase=f.wave-tail*5.2;
  const amplitude=f.length*.038*(f.waveAmplitude??1);
  const wave=Math.sin(phase)*tail*tail*amplitude;
  const slope=amplitude*(-2*tail*Math.sin(phase)+5.2*tail*tail*Math.cos(phase))/f.length;
  const finPhase=f.finPhase??f.wave*.63+f.seed;
  const pectoral=Math.exp(-(((u-.73)/.115)**2));
  const dorsal=Math.exp(-(((u-.49)/.17)**2));
  const p=spinePoint(f,(u-.5)*f.length);
  return {p,wave,slope,length:f.length,
    left:pectoral*(Math.sin(finPhase+.4)*.065+Math.max(-.06,Math.min(.06,-(f.yaw||0)*.045)))+dorsal*Math.sin(finPhase*.77+1.5)*.025,
    right:pectoral*(Math.sin(finPhase*1.09+2.1)*.065+Math.max(-.06,Math.min(.06,(f.yaw||0)*.045)))+dorsal*.4*Math.sin(finPhase*.77+1.5)*.025};
}
function sectionPoint(section,v){
  const {p,length,wave,slope}=section;
  const periphery=Math.max(0,Math.min(1,(Math.abs(v-.5)-.1)/.24));
  const lateral=(v-.5)*length*2/3*(1+(v<.5?section.left:section.right)*periphery)+wave;
  return {x:p.x-Math.sin(p.heading)*lateral,y:p.y+Math.cos(p.heading)*lateral,heading:p.heading+Math.atan(slope)};
}
export function anatomyPoint(f,u,v=.5){return sectionPoint(anatomySection(f,u),v);}
export function fillAnatomyMesh(f,columns,rows,mesh){
  for(let col=0;col<=columns;col++){
    const section=anatomySection(f,col/columns);
    for(let row=0;row<=rows;row++){
      const q=sectionPoint(section,row/rows),i=(col*(rows+1)+row)*2;
      mesh[i]=q.x;mesh[i+1]=q.y;
    }
  }
  return mesh;
}
