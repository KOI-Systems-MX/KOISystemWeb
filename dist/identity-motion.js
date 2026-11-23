const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a,b,t)=>a+(b-a)*t;
const windowAt=(t,a,b,c,d)=>ease((t-a)/(b-a))*(1-ease((t-c)/(d-c)));
const hash=n=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
export const IDENTITY_LOGO_START=13.9;
export const IDENTITY_LOGO_SECONDS=5;
export const IDENTITY_DURATION=IDENTITY_LOGO_START+IDENTITY_LOGO_SECONDS;
export const IDENTITY_LAYOUT=Object.freeze({width:800,height:540,letterSize:160,wordSize:76,wordX:210,rows:Object.freeze([130,280,430])});
export const inkBaseline=(metrics,size)=>(metrics?.actualBoundingBoxAscent??size*.72)/2-(metrics?.actualBoundingBoxDescent??0)/2;

export function materialAt(age,seed){
  const arrival=hash(seed)*.38,progress=ease((age-arrival)/.7);
  return {progress,solid:age>=arrival+.7,codeAlpha:age<0?0:windowAt(age,0,.14,.68+arrival,1.12+arrival)};
}
// Stretch only the final materialization; typography keeps its existing rhythm.
export function logoBuildAt(time){
  const finished=time>=IDENTITY_DURATION;
  const age=finished?1.5:(time-IDENTITY_LOGO_START)*1.5/IDENTITY_LOGO_SECONDS;
  return {age,inkAlpha:ease((age-1.15)/.35),progress:finished?1:clamp((time-IDENTITY_LOGO_START)/IDENTITY_LOGO_SECONDS)};
}
// Destinations come from the actual painted pixels, rather than a rectangular cloud.
export function codeTargets(rgba,width,height,step=7){
  const points=[];
  for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){
    const i=(y*width+x)*4;
    if(rgba[i+3]>80)points.push({x,y,seed:x*3.7+y*11.3,color:`rgb(${rgba[i]} ${rgba[i+1]} ${rgba[i+2]})`});
  }
  return points;
}

// All movement is derived from one clock; replay never accumulates transforms.
export function identityAt(time){
  const t=Math.max(0,time),split=ease((t-3.8)/1.8),vanish=1-ease((t-13.2)/.7);
  let words=['','',''],wordAlpha=[0,0,0],phase='KOI';
  if(t>=5.6&&t<7.6){words=['Kaizen','',''];wordAlpha=[windowAt(t,5.6,6.1,7.1,7.6),0,0];phase='Kaizen';}
  else if(t>=7.6&&t<10.8){words=['Kernel','Operaciones','Innovación'];wordAlpha=words.map((_,i)=>windowAt(t,7.6+i*.35,8.1+i*.35,10.2,10.8));phase='Kernel · Operaciones · Innovación';}
  else if(t>=10.8&&t<13.9){words=['Kinetic','Operational','Intelligence'];wordAlpha=words.map((_,i)=>windowAt(t,10.8+i*.32,11.3+i*.32,13.2,13.9));phase='Kinetic · Operational · Intelligence';}
  else if(t>=IDENTITY_LOGO_START)phase='Identidad KOI Systems';
  return {phase,words,wordAlpha,letters:[0,1,2].map(i=>({
    x:mix([220,400,580][i],100,split),y:mix(270,IDENTITY_LAYOUT.rows[i],split),
    angle:Math.sin(split*Math.PI)*[13,-12,19][i],opacity:vanish*ease((t-1.15)/.35),
    scale:mix(1.1,1,split)})),
    ending:ease((t-IDENTITY_LOGO_START)/.6),
    ribbon:windowAt(t,3.7,4.4,6.8,8),finished:t>=IDENTITY_DURATION};
}

export function attachIdentityMotion(presentation,preference=matchMedia('(prefers-reduced-motion: reduce)')){
  const root=presentation.querySelector('.film-frame'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return {dispose(){}};
  const glyphs=[...root.querySelectorAll('.identity-glyphs text')],words=[...root.querySelectorAll('.identity-words text')];
  const ending=root.querySelector('.film-ending');
  const endingDetails=[...ending.querySelectorAll?.('.identity-final-name, p, .film-ending-actions')||[]];
  const controls=presentation.querySelector('.identity-controls'),pause=presentation.querySelector('.identity-pause'),replay=presentation.querySelector('.identity-replay'),status=presentation.querySelector('.identity-status');
  const explanation=presentation.querySelector('.identity-explanation');
  const logo=ending.querySelector?.('img');
  let elapsed=0,last=null,frame=0,inView=false,paused=false,disposed=false,width=1,height=1,dpr=1,lastPhase='';
  const textCache=new Map();let logoRaster=null,logoBox=null;
  function rasterText(text,size,centered=false){
    const key=`${text}:${size}:${centered}`;if(textCache.has(key))return textCache.get(key);
    if(!text||!document.createElement)return null;
    const source=document.createElement('canvas'),p=source.getContext('2d');if(!p)return null;
    p.font=`800 ${size}px "Segoe UI",Arial,sans-serif`;p.letterSpacing=size===76?'-1px':'0px';
    const metrics=p.measureText(text),baseline=inkBaseline(metrics,size);
    source.width=Math.ceil(metrics.width)+12;source.height=Math.ceil(size*1.35);
    p.font=`800 ${size}px "Segoe UI",Arial,sans-serif`;p.letterSpacing=size===76?'-1px':'0px';p.fillStyle='#f8f7f1';p.fillText(text,6,size);
    const value={source,width:source.width,height:source.height,baseline,ox:centered?-source.width/2:-6,oy:baseline-size,
      points:codeTargets(p.getImageData(0,0,source.width,source.height).data,source.width,source.height,7)};
    textCache.set(key,value);return value;
  }
  function measureLogo(){
    if(!logo?.naturalWidth)return;
    const rect=logo.getBoundingClientRect(),base=root.getBoundingClientRect(),scale=Math.min(width/IDENTITY_LAYOUT.width,height/IDENTITY_LAYOUT.height),dx=(width-IDENTITY_LAYOUT.width*scale)/2,dy=(height-IDENTITY_LAYOUT.height*scale)/2;
    logoBox={x:(rect.left-base.left-dx)/scale,y:(rect.top-base.top-dy)/scale,width:rect.width/scale,height:rect.height/scale};
    if(!logoRaster){
      const source=document.createElement('canvas');source.width=200;source.height=Math.round(200*logo.naturalHeight/logo.naturalWidth);
      const p=source.getContext('2d');p.drawImage(logo,0,0,source.width,source.height);
      logoRaster={source,width:source.width,height:source.height,ox:0,oy:0,points:codeTargets(p.getImageData(0,0,source.width,source.height).data,source.width,source.height,4)};
    }
  }
  function measure(){const rect=root.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);measureLogo();paint();}
  function construct(raster,age,x,y,alpha=1,angle=0,scale=1){
    if(!raster||age<0||age>1.55||alpha<=.001||preference.matches)return;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);ctx.scale(scale,scale);
    const step=raster===logoRaster?4:7;
    ctx.font=`${raster===logoRaster?9:11}px Consolas,monospace`;ctx.textBaseline='middle';ctx.textAlign='center';
    // Several signs converge into each ink cell, then give way to the original pixels.
    for(const p of raster.points){
      const a=materialAt(age,p.seed),px=p.x+raster.ox,py=p.y+raster.oy;
      if(a.solid){ctx.globalAlpha=alpha*(1-ease((age-1.15)/.35));ctx.drawImage(raster.source,p.x,p.y,step,step,px,py,step+.45,step+.45);}
      if(a.codeAlpha>.001){
        const drift=1-a.progress,side=hash(p.seed+9)>.5?1:-1;
        const sx=px-side*(35+hash(p.seed+2)*110)*drift,sy=py+(22+hash(p.seed+4)*65)*drift+Math.sin(age*3+p.seed)*7*drift;
        ctx.globalAlpha=alpha*a.codeAlpha*.72;
        ctx.fillStyle=raster===logoRaster?p.color:hash(p.seed+5)>.82?'#ff9968':'#b9d5e5';
        ctx.fillText(['0','1','{','}','<','>'][Math.floor(hash(p.seed+6)*6)],sx,sy);
      }
    }
    ctx.restore();
  }
  function paint(){
    const state=identityAt(elapsed);
    root.dataset.identityPhase=state.phase;root.dataset.identityTime=elapsed.toFixed(2);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const stageScale=Math.min(width/IDENTITY_LAYOUT.width,height/IDENTITY_LAYOUT.height);ctx.translate((width-IDENTITY_LAYOUT.width*stageScale)/2,(height-IDENTITY_LAYOUT.height*stageScale)/2);ctx.scale(stageScale,stageScale);
    state.letters.forEach((g,i)=>{const raster=rasterText(['K','O','I'][i],IDENTITY_LAYOUT.letterSize,true);glyphs[i].setAttribute('transform',`translate(${g.x} ${g.y}) rotate(${g.angle}) scale(${g.scale})`);glyphs[i].setAttribute('y',raster?.baseline??IDENTITY_LAYOUT.letterSize*.36);glyphs[i].style.opacity=g.opacity;construct(raster,elapsed,g.x,g.y,1,g.angle,g.scale);});
    const wordStart=elapsed<7.6?5.6:elapsed<10.8?7.6:10.8;
    words.forEach((word,i)=>{const age=(elapsed-wordStart-i*.32)*1.45,raster=rasterText(state.words[i],IDENTITY_LAYOUT.wordSize);word.textContent=state.words[i];word.setAttribute('x',IDENTITY_LAYOUT.wordX);word.setAttribute('y',IDENTITY_LAYOUT.rows[i]+(raster?.baseline??IDENTITY_LAYOUT.wordSize*.36));word.style.opacity=state.wordAlpha[i]*ease((age-1.15)/.35);construct(raster,age,IDENTITY_LAYOUT.wordX,IDENTITY_LAYOUT.rows[i],state.wordAlpha[i]);});
    const showEnd=preference.matches||elapsed>=IDENTITY_LOGO_START;
    ending.style.visibility=showEnd?'visible':'hidden';ending.style.opacity=preference.matches?1:state.ending;
    ending.style.pointerEvents=elapsed>=IDENTITY_DURATION||preference.matches?'auto':'none';
    ending.inert=!(elapsed>=IDENTITY_DURATION||preference.matches);ending.setAttribute('aria-hidden',String(ending.inert));
    const logoBuild=logoBuildAt(elapsed);
    root.dataset.logoBuild=logoBuild.progress.toFixed(3);
    for(const detail of endingDetails)detail.style.opacity=preference.matches?1:logoBuild.inkAlpha;
    if(logo){logo.style.opacity=preference.matches?1:logoBuild.inkAlpha;if(logoBox)construct(logoRaster,logoBuild.age,logoBox.x,logoBox.y,1,0,logoBox.width/(logoRaster?.width||1));}
    if(lastPhase!==state.phase||state.finished){lastPhase=state.phase;status.textContent=state.finished?'Presentación terminada':state.phase;}
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;last=null;
    const reduced=preference.matches,finished=elapsed>=IDENTITY_DURATION;
    root.dataset.state=reduced?'reduced':finished?'ended':paused?'paused':'playing';
    controls.hidden=reduced;pause.disabled=finished;pause.textContent=paused?'Reanudar presentación':'Pausar presentación';
    if(!disposed&&!reduced&&!finished&&!paused&&inView&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  function tick(now){
    frame=0;if(last!==null)elapsed=Math.min(IDENTITY_DURATION,elapsed+Math.max(0,(now-last)/1000));last=now;paint();
    if(elapsed>=IDENTITY_DURATION){sync();return;}
    frame=requestAnimationFrame(tick);
  }
  function toggle(){paused=!paused;sync();status.textContent=paused?'Presentación en pausa':`Continuando: ${identityAt(elapsed).phase}`;}
  function restart(){elapsed=0;paused=false;lastPhase='';paint();sync();}
  function preferenceChange(){if(preference.matches){elapsed=IDENTITY_DURATION;explanation.open=true;}paint();sync();}
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.25});observer.observe(root);
  const resize=new ResizeObserver(measure);resize.observe(root);
  pause.addEventListener('click',toggle);replay.addEventListener('click',restart);preference.addEventListener('change',preferenceChange);document.addEventListener('visibilitychange',sync);logo?.addEventListener('load',measure);
  if(preference.matches){elapsed=IDENTITY_DURATION;explanation.open=true;}
  measure();sync();
  return {dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();pause.removeEventListener('click',toggle);replay.removeEventListener('click',restart);preference.removeEventListener('change',preferenceChange);document.removeEventListener('visibilitychange',sync);logo?.removeEventListener('load',measure);textCache.clear();}};
}
if(typeof document!=='undefined'){
  const instances=[...document.querySelectorAll('.identity-presentation')].map(root=>attachIdentityMotion(root));
  window.addEventListener('pagehide',()=>instances.forEach(instance=>instance.dispose()),{once:true});
}
