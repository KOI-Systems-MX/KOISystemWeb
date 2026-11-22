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
    const f={...start,id:index,blue:index%2===1,seed:.7+index*2.73,length:l,speed,cruise:speed,yaw:0,wave:index*1.7,travel:0,lastTime:0,path:[],box,bounds,direction:index%2?1:-1};
    for(let d=l*1.8;d>=0;d-=2)f.path.push({x:f.x-Math.cos(f.angle)*d,y:f.y-Math.sin(f.angle)*d,d:-d});
    f.path.push({x:f.x,y:f.y,d:0});
    return f;
  });
}

export function advanceSwimmers(fish,box,time,bounds=fish[0]?.bounds){
  // A frame gap is subdivided, so steering and trajectory do not depend on FPS.
  for(const f of fish){
    let remaining=clamp(time-f.lastTime,0,.15);f.lastTime=time;f.box=box;f.bounds=bounds;
    while(remaining>1e-7){
      const dt=Math.min(remaining,1/60);remaining-=dt;
      const t=time-remaining,w=bounds.width,h=bounds.height,L=f.length,origin=bounds.left||0;
      const wander=.58*Math.sin(t*.19+f.seed)+.25*Math.sin(t*.071+f.seed*2);
      let vx=Math.cos(f.angle+wander*.32),vy=Math.sin(f.angle+wander*.32);
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
      for(const other of fish){if(other===f)continue;const dx=f.x-other.x,dy=f.y-other.y,d=Math.hypot(dx,dy),space=(L+other.length)*.3;if(d>1&&d<space){const force=(1-d/space)*1.6;vx+=dx/d*force;vy+=dy/d*force;}}
      const delta=angleDifference(Math.atan2(vy,vx),f.angle),limit=f.speed/(L*.38);
      const desiredYaw=clamp(delta*2,-limit,limit);
      f.yaw+=(desiredYaw-f.yaw)*(1-Math.exp(-dt*4));
      f.angle+=f.yaw*dt;
      const target=f.cruise*(1+.13*Math.sin(t*.31+f.seed))*(1-Math.min(.22,Math.abs(f.yaw)*.22));
      f.speed+=(target-f.speed)*(1-Math.exp(-dt*1.4));
      f.x+=Math.cos(f.angle)*f.speed*dt;f.y+=Math.sin(f.angle)*f.speed*dt;
      f.travel+=f.speed*dt;f.wave+=dt*(2.3+f.speed/L*4.7);
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
