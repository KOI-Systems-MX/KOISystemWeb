import {createSwimmers,advanceSwimmers,spinePoint,resizeSwimmers} from './swimming.js?v=submerged-02';
import {createLocalTailScene} from './local-tail-scene.js';
import {products,mountProduct,createProductDirector} from './products.js?v=08';
import {fragmentOverlaps} from './code-vocabulary.js?v=09';
import {createSceneBits} from './scene-bits.js';
import {tailField,tailPoint,tailEmitter,paintDissolvingTail,tailColor} from './tail-dissolution.js';
import {createFloaters,advanceFloaters} from './vegetation.js?v=05';
import {formationAt,materialAt,ease} from './formation.js';
import {waterField,createPondFloor,drawWaterSurface,protectReading} from './pond-water.js?v=04';

(async()=>{
  const canvas=document.querySelector('#koi-canvas'),scene=document.querySelector('.koi-scene');
  const ctx=canvas?.getContext('2d');if(!ctx)return;
  const hero=document.querySelector('.hero'),panel=document.querySelector('.hero-copy');
  const sceneBits=createSceneBits({hero,panel,scene});
  const surface=document.querySelector('#pond-surface'),surfacePaint=surface?.getContext('2d');
  const fishCanvas=document.querySelector('#koi-overpass'),fishPaint=fishCanvas?.getContext('2d');
  const codeCanvas=document.querySelector('#software-code'),codePaint=codeCanvas?.getContext('2d');let bitFrame;
  const floorSource=document.querySelector('#pond-floor'),floorRenderer=createPondFloor(floorSource),floorCanvas=floorRenderer.canvas||floorSource;
  floorCanvas.dataset.renderer=floorRenderer.mode;
  let readingZones=[],softwareTarget,activationZone,layoutDirty=true;
  const pause=document.querySelector('#koi-pause'),replay=document.querySelector('#koi-replay'),staticButton=document.querySelector('#koi-static');
  const software=document.querySelector('.software-interface'),caption=document.querySelector('#koi-phase');
  const director=createProductDirector();
  function showProduct(index){
    const p=mountProduct(software.querySelector('.product-stage'),index);software.dataset.product=p.id;
    software.querySelector('.software-chrome b').textContent=`KOI / ${p.name}`;
    software.setAttribute('aria-label',`Prototipo ilustrativo: ${p.name}, construido con el código de los koi`);layoutDirty=true;
    bitStream.setProduct(p.id);
  }
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),fixed=()=>preference.matches||staticMode;
  let staticMode=false,paused=false,visible=true,disposed=false,frame=0,lastStamp=0,elapsed=0;
  let W=1280,H=900,box,fish=[],flora=[],ripples=[],lastRipple=[],plantCode=[];
  let washTime=0,softwareStage=-1,geometryDirty=true,lastBuild='',paintCost=0;
  const art={},chars='01',bitStream=createLocalTailScene(),tailFrames=new Map();
  showProduct(0);
  const wash=document.createElement('canvas'),washPaint=wash.getContext('2d');
  const offscreen=document.createElement('canvas'),samplePaint=offscreen.getContext('2d',{willReadFrequently:true});
  const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  pause.disabled=replay.disabled=staticButton.disabled=true;scene.setAttribute('aria-busy','true');
  try{
    await Promise.all(Object.entries({koi:'koi',leaf:'lotus-leaf',flower:'lotus-flower',bud:'lotus-bud',petal:'lotus-petal'}).map(async([key,file])=>{
      const image=new Image();image.src=`assets/nelumbo/${file}-guohua-v1.png`;await image.decode();art[key]=image;
    }));
  }catch(error){caption.textContent='ESTANQUE EN ACUARELA';scene.setAttribute('aria-busy','false');console.error('KOI artwork',error);return;}

  function sampleImage(image,width,height,step){
    offscreen.width=width;offscreen.height=height;samplePaint.clearRect(0,0,width,height);samplePaint.drawImage(image,0,0,width,height);
    const pixels=samplePaint.getImageData(0,0,width,height).data,points=[];
    for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){const i=(y*width+x)*4;if(pixels[i+3]<85)continue;const rank=hash(x*19+y*37);points.push({u:x/width,v:y/height,rank,char:chars[Math.floor(rank*chars.length)],color:`rgb(${pixels[i]},${pixels[i+1]},${pixels[i+2]})`,alpha:pixels[i+3]/255});}
    return points;
  }
  const koiCode=sampleImage(art.koi,222,148,3),leafCode=sampleImage(art.leaf,100,100,3),flowerCode=sampleImage(art.flower,90,90,3);
  const tailPixels=koiCode.filter(p=>p.u<.3&&p.alpha>.35);
  const tailPorts=tailPixels.filter((p,i)=>i%Math.max(1,Math.floor(tailPixels.length/18))===0).slice(0,18);

  // The whole viewport is swimmable; the reading mask protects only the text.
  function swimmingBounds(){return {width:W,height:H,left:0};}

  function readReadingZones(){
    const r=scene.getBoundingClientRect(),p=panel.getBoundingClientRect();
    readingZones=[...panel.children].map(e=>{
      const z=e.getBoundingClientRect();
      return {left:z.left-r.left,right:z.right-r.left,top:Math.max(p.top,z.top)-r.top,bottom:Math.min(p.bottom,z.bottom)-r.top};
    }).filter(z=>z.bottom>z.top);
  }

  function measureSoftware(){
    const r=scene.getBoundingClientRect(),window=software.querySelector('.software-window'),sw=window.getBoundingClientRect();
    softwareTarget={left:sw.left-r.left,top:sw.top-r.top,width:sw.width,height:sw.height};
    activationZone={left:softwareTarget.left-90,right:softwareTarget.left+softwareTarget.width+50,top:softwareTarget.top-115,bottom:softwareTarget.top+softwareTarget.height*.32};
    layoutDirty=false;
  }

  function measure(){
    const r=scene.getBoundingClientRect(),p=panel.getBoundingClientRect();
    if(!r.width||!r.height)return;
    const oldW=W,oldH=H;W=r.width;H=r.height;
    box={left:p.left-r.left-10,right:p.right-r.left+10,top:p.top-r.top-10,bottom:p.bottom-r.top+10,allowUnderpass:hero.dataset.immersive==='true'};
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    if(surfacePaint){surface.width=canvas.width;surface.height=canvas.height;surfacePaint.setTransform(ratio,0,0,ratio,0,0);}
    if(fishPaint){fishCanvas.width=canvas.width;fishCanvas.height=canvas.height;fishPaint.setTransform(ratio,0,0,ratio,0,0);}
    if(codePaint){codeCanvas.width=canvas.width;codeCanvas.height=canvas.height;codePaint.setTransform(ratio,0,0,ratio,0,0);}
    readReadingZones();
    measureSoftware();
    const floorRatio=Math.min(1,1600/W);floorCanvas.width=Math.round(W*floorRatio);floorCanvas.height=Math.round(H*floorRatio);
    wash.width=Math.ceil(W);wash.height=Math.ceil(H);
    if(fish.length)resizeSwimmers(fish,fish[0].bounds,swimmingBounds());
    else fish=createSwimmers(box,swimmingBounds());
    for(const ripple of ripples){ripple.x*=W/oldW;ripple.y*=H/oldH;}
    const scale=Math.max(.45,Math.min(1,W/1100,H/650));
    flora=[
      {x:W*.075,y:H*.18,r:63*scale,angle:-.5,seed:1},
      {x:W*.15,y:H*.28,r:35*scale,angle:1.8,seed:2},
      {x:W*.18,y:H*.14,r:39*scale,flower:true,angle:.2,seed:3},
      {x:W*.88,y:H*.78,r:72*scale,angle:2.7,seed:4},
      {x:W*.83,y:H*.86,r:32*scale,angle:-.3,seed:5},
      {x:W*.94,y:H*.64,r:38*scale,flower:true,angle:.4,seed:6},
      {x:W*.89,y:H*.14,r:41*scale,angle:1.2,seed:7},
    ];
    if(W<700){const leaf=Math.min(44,W*.1,H*.1);flora=[{x:leaf+10,y:Math.min(120,H*.22),r:leaf,angle:.4,seed:1},{x:W*.79,y:Math.min(108,H*.24),r:Math.min(27,leaf),flower:true,seed:3},{x:W-leaf-10,y:H*.79,r:leaf,angle:2.1,seed:4},{x:leaf+10,y:H*.86,r:leaf*.7,angle:-.4,seed:6}];}
    if(hero.dataset.submerged==='true'&&W>=760){
      const open=box.right+24,span=W-open;
      flora[0]={...flora[0],x:open+span*.13,y:H*.16,r:52*scale};
      flora[1]={...flora[1],x:open+span*.23,y:H*.25,r:30*scale};
      flora[2]={...flora[2],x:open+span*.33,y:H*.13,r:35*scale};
      flora[3]={...flora[3],x:open+span*.42,y:H*.81};
      flora[4]={...flora[4],x:open+span*.35,y:H*.88};
      flora[5]={...flora[5],x:W*.94,y:H*.28};
    }
    geometryDirty=false;
    sceneBits.measure();
    plantCode=createFloaters(flora,plantCode).map(f=>({...f,points:f.flower?flowerCode:leafCode}));
  }

  function bodyPoint(f,u,lateral=0){
    const tail=1-u,wave=Math.sin(f.wave-tail*5.2)*tail*tail*f.length*.038;
    return spinePoint(f,(u-.5)*f.length,lateral+wave);
  }
  function drawFish(f,t,still,paint=ctx){
    const length=f.length,height=length*2/3;
    let tailFrame=null;
    if(!still){
      let cached=tailFrames.get(f.id);
      if(!cached){const image=document.createElement('canvas');image.width=222;image.height=148;cached={image,paint:image.getContext('2d',{willReadFrequently:true}),stamp:-1};tailFrames.set(f.id,cached);}
      const stamp=Math.floor(t*8);if(cached.stamp!==stamp){paintDissolvingTail(cached.paint,art.koi,t,f.seed);cached.stamp=stamp;}
      tailFrame=cached.image;
    }
    // The head/body keep their original pigment. Only material u<.32 is eroded.
    for(let j=0;j<72;j++){
      const u=j/72,image=!still&&u<.32?tailFrame:art.koi;
      const q=bodyPoint(f,u);paint.save();paint.translate(q.x,q.y);paint.rotate(q.heading);paint.globalAlpha=.94;
      paint.drawImage(image,u*image.width,0,image.width/72,image.height,-.25,-height/2,length/72+.5,height);paint.restore();
    }
    if(!still){
      paint.font=`${W<700?4.5:5.5}px Consolas,monospace`;paint.textAlign='center';paint.textBaseline='middle';
      tailPixels.forEach((p,i)=>{
        if(i%21!==0)return;const fragment=tailField(p.u,p.v,t,f.seed),q=tailPoint(f,p.u,p.v);
        const mark={text:[';','{','}','0','1','(',')','=>'][i%8],x:q.x,y:q.y};
        if(fragmentOverlaps(mark,5.5,softwareTarget)||readingZones.some(r=>fragmentOverlaps(mark,5.5,r)))return;
        paint.globalAlpha=fragment*p.alpha*.86;paint.fillStyle=i%9===0?'#b3784a':i%3===0?'#4a9ba4':'#285c68';
        paint.fillText(mark.text,q.x,q.y);
      });
    }
    paint.globalAlpha=1;
  }
  function plants(t,still){
    for(const f of plantCode){
      const x=f.x+(still?0:f.dx),y=f.y+(still?0:f.dy);
      const state=formationAt(t,f.seed),ink=still?1:ease((t-(3+f.seed*.12))/6.7);
      ctx.save();ctx.translate(x+2,y+5);ctx.rotate((f.angle||0)+(still?0:f.tilt));ctx.scale(1,.65);
      const shadow=ctx.createRadialGradient(0,0,f.r*.1,0,0,f.r*.9);shadow.addColorStop(0,'#315d4b14');shadow.addColorStop(1,'#315d4b00');ctx.globalAlpha=ink;ctx.fillStyle=shadow;ctx.fillRect(-f.r,-f.r,f.r*2,f.r*2);ctx.restore();
      ctx.save();ctx.translate(x,y);ctx.rotate((f.angle||0)+(still?0:f.tilt));
      if(ink<1){ctx.font='4px Consolas,monospace';ctx.textAlign='center';for(const p of f.points){if(p.rank>state.density)continue;ctx.globalAlpha=(1-ink)*p.alpha*.7;ctx.fillStyle=p.color;ctx.fillText(p.char,(p.u-.5)*f.r*2,(p.v-.5)*f.r*2-(1-state.gather)*18);}ctx.globalAlpha=1;}
      ctx.globalAlpha=ink*.9;
      if(!f.flower)ctx.drawImage(art.leaf,-f.r,-f.r,f.r*2,f.r*2);
      else{
        const bloom=still?.84:.82+.045*Math.sin(t*.067+f.seed*1.1);
        for(let ring=0;ring<2;ring++)for(let k=0;k<(ring?7:9);k++){
          ctx.save();ctx.rotate(k*Math.PI*2/(ring?7:9)+ring*.3);ctx.globalAlpha=ink*ease(bloom*2)*.65;
          const l=f.r*(ring?.77:1.05)*(.5+.5*bloom),w=f.r*.7*(.3+.7*bloom);ctx.drawImage(art.petal,-w/2,-l,w,l);ctx.restore();
        }
        ctx.globalAlpha=ink*ease(bloom*1.6);const s=f.r*1.85*(.4+.6*bloom);ctx.drawImage(art.flower,-s/2,-s/2,s,s);
        ctx.globalAlpha=ink*(1-ease(bloom*2.2));ctx.drawImage(art.bud,-f.r*.7,-f.r*.7,f.r*1.4,f.r*1.4);
      }
      ctx.restore();
    }
  }
  function waves(t,still){
    const form=still?1:formationAt(t).environment;
    const g=ctx.createRadialGradient(W*.5,H*.5,10,W*.5,H*.5,W*.65);g.addColorStop(0,'#e5ece322');g.addColorStop(1,'#d9e5df34');ctx.globalAlpha=form;ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(const ring of ripples){const age=t-ring.born;if(age<0||age>5)continue;for(let j=0;j<3;j++){ctx.strokeStyle=`rgba(95,137,127,${(1-age/5)*ring.strength*.14})`;ctx.beginPath();ctx.ellipse(ring.x,ring.y,5+age*23+j*8,3+age*16+j*5,ring.angle,0,Math.PI*2);ctx.stroke();}}
    ctx.globalAlpha=1;
  }
  function softwareBits(t,still,dt){
    const sources=fish.map(f=>tailEmitter(f,tailPorts,t));
    const state=bitStream.update(t,sources,softwareTarget,still),build=state.progress.toFixed(3);
    if(!still&&dt>0){
      const heads=fish.map(f=>({...spinePoint(f,0),id:f.id,speed:f.speed}));
      if(director.observe(t,heads,activationZone,state.phase==='software'&&state.components.every(v=>v>=.995)))bitStream.requestDissolution(t);
      if(state.recycled){showProduct(director.complete(t));measureSoftware();}
    }
    if(build!==lastBuild){software.style.setProperty('--build',build);lastBuild=build;}
    const variables=['frame','header','cards','chart','rows'];state.components.forEach((v,i)=>software.style.setProperty(`--${variables[i]}`,v.toFixed(3)));
    if(state.phase!==softwareStage){softwareStage=state.phase;software.dataset.phase=state.phase;software.removeAttribute('data-stage');software.querySelector('.software-build-status').textContent={emission:'Código en movimiento',attraction:'El código converge',organization:'El código se organiza',materialization:'Componentes que toman forma',software:'Del código a tu software',dissolution:'El software vuelve al agua'}[state.phase];}
    bitFrame=state;
    scene.dataset.tailParticles=String(state.particles.length);
    scene.dataset.tailRain=String(state.particles.filter(p=>!p.slot).length);
    software.dataset.progress=build;
  }
  function draw(t,dt=0){
    const began=typeof performance==='undefined'?0:performance.now();
    if(geometryDirty)measure();const still=fixed();
    // Crucially, locomotion has no dependency on density, ink or colour.
    if(!still&&dt>0)advanceSwimmers(fish,box,t,swimmingBounds());
    if(!still&&dt>0){
      ripples=ripples.filter(r=>t-r.born<5);
      fish.forEach((f,i)=>{if(t-(lastRipple[i]??-5)>2.7+i*.27){const q=spinePoint(f,f.length*.3);ripples.push({x:q.x,y:q.y,born:t,angle:q.heading,strength:.28});lastRipple[i]=t;}});
      advanceFloaters(plantCode,fish.map(f=>({...spinePoint(f,0),speed:f.speed,length:f.length})),ripples,t,dt,waterField);
    }
    floorRenderer.draw(still?18:t);floorCanvas.dataset.time=(still?18:t).toFixed(2);
    ctx.clearRect(0,0,W,H);
    waves(t,still);
    if(dt>0&&t!==washTime){washPaint.globalCompositeOperation='destination-out';washPaint.fillStyle=`rgba(0,0,0,${1-Math.exp(-dt*.8)})`;washPaint.fillRect(0,0,W,H);washPaint.globalCompositeOperation='source-over';
      if(t>5)for(const f of fish){const p=spinePoint(f,-f.length*.35);washPaint.fillStyle=f.blue?'#4c6d7908':'#ad775b08';washPaint.beginPath();washPaint.ellipse(p.x,p.y,f.length*.12,f.length*.04,p.heading,0,Math.PI*2);washPaint.fill();}washTime=t;}
    ctx.globalAlpha=.12;ctx.drawImage(wash,0,0);ctx.globalAlpha=1;
    if(fishPaint)fishPaint.clearRect(0,0,W,H);
    for(const f of fish)drawFish(f,t,still,fishPaint||ctx);
    // Lettering belongs to the pond floor: a crossing koi stays whole above it.
    if(fishPaint)fishCanvas.dataset.time=(still?18:t).toFixed(2);
    plants(t,still);softwareBits(t,still,dt);
    protectReading(ctx,readingZones,.96);
    if(surfacePaint){drawWaterSurface(surfacePaint,{width:W,height:H},still?18:t,readingZones,ripples,[{...softwareTarget,build:bitFrame.components[0]}]);surface.dataset.time=(still?18:t).toFixed(2);}
    if(codePaint){
      codePaint.clearRect(0,0,W,H);const fontSize=Math.max(8,Math.min(11.5,softwareTarget.width/34));codePaint.textAlign='center';
      for(const p of [...bitFrame.particles,...bitFrame.settled]){
        if(p.alpha<.001)continue;
        if(fragmentOverlaps(p,fontSize,softwareTarget))continue;
        const size=p.kind==='grain'?fontSize*.58:p.kind==='code'?fontSize*(.55+(p.id%3)*.06):fontSize;
        codePaint.font=`${size}px Consolas,monospace`;
        codePaint.save();codePaint.translate(p.x,p.y);codePaint.rotate(p.rotation||0);codePaint.globalAlpha=p.alpha;
        codePaint.fillStyle=tailColor(p.age,p.sourceColor,p.id);codePaint.fillText(p.text,0,0);
        if(!p.slot&&p.age>.4){
          const fall=ease((p.age-.4)/.5),count=2+p.column%2;
          for(let row=1;row<count;row++){
            const mark={...p,text:row%3?'1':'0',x:p.x,y:p.y-row*size*1.35*fall,rotation:0};
            if(fragmentOverlaps(mark,size,softwareTarget))continue;
            codePaint.globalAlpha=p.alpha*fall*(1-row/count)*.28;codePaint.fillText((p.id+row)%3?'0':'1',0,-row*size*1.35*fall);
          }
        }
        codePaint.restore();
      }
      if(still){
        codePaint.font='5px Consolas,monospace';codePaint.fillStyle='#456f76';
        for(const f of fish){const q=tailPoint(f,.05,.5);
          for(let j=0;j<3;j++){
            const mark={text:j===2?';':String(j),x:q.x-Math.cos(q.heading)*(6+j*7),y:q.y-Math.sin(q.heading)*(6+j*7)+j*2};
            if(fragmentOverlaps(mark,5,softwareTarget))continue;
            codePaint.globalAlpha=.24-j*.05;codePaint.fillText(mark.text,mark.x,mark.y);
          }
        }
      }
      codePaint.globalAlpha=1;protectReading(codePaint,readingZones,.98);codeCanvas.dataset.time=(still?18:t).toFixed(2);
    }
    const state=formationAt(t);caption.textContent=still?'ESTANQUE EN ACUARELA':['SIGNOS EN MOVIMIENTO','AGRUPACIONES QUE YA NADAN','SILUETAS VIVAS','DEL SIGNO A LA ACUARELA','LAS IDEAS SIGUEN FLUYENDO'][state.phase];
    // Read-only diagnostics for visual QA, never used to drive the animation.
    scene.dataset.time=t.toFixed(2);scene.dataset.phase=String(state.phase);
    scene.dataset.koiOverWindow=String(fish.filter(f=>[0,.25,.45].some(u=>{
      const p=bodyPoint(f,u);return p.x>softwareTarget.left&&p.x<softwareTarget.left+softwareTarget.width&&p.y>softwareTarget.top&&p.y<softwareTarget.top+softwareTarget.height;
    })).length);
    sceneBits.draw(still?18:t,still);
    scene.dataset.vegetation=plantCode.map(f=>`${f.seed}:${f.dx.toFixed(2)},${f.dy.toFixed(2)},${f.tilt.toFixed(3)}`).join(';');
    if(typeof performance!=='undefined'){paintCost=paintCost*.9+(performance.now()-began)*.1;scene.dataset.paintMs=paintCost.toFixed(2);}
  }
  function tick(now){
    frame=0;if(disposed||paused||fixed()||!visible){lastStamp=0;return;}
    if(!lastStamp)lastStamp=now;
    const dt=Math.min((now-lastStamp)/1000,.10);
    if(dt>=1/30){
      const next=elapsed+dt;
      draw(next,next-elapsed);elapsed=next;lastStamp=now;
    }
    frame=requestAnimationFrame(tick);
  }
  function start(){cancelAnimationFrame(frame);frame=0;lastStamp=0;if(!paused&&!fixed()&&visible)frame=requestAnimationFrame(tick);else draw(fixed()?18:elapsed);}
  function controls(){const still=fixed();pause.disabled=replay.disabled=still;staticButton.disabled=preference.matches;pause.textContent=paused?'Reanudar animación':'Pausar animación';pause.setAttribute('aria-pressed',String(paused));staticButton.textContent=preference.matches?'Movimiento reducido':staticMode?'Volver a la animación':'Ver sin animación';staticButton.setAttribute('aria-pressed',String(still));scene.dataset.mode=still?'static':'animated';}
  function rebuild(){elapsed=0;fish=createSwimmers(box,swimmingBounds());plantCode=createFloaters(flora).map(f=>({...f,points:f.flower?flowerCode:leafCode}));ripples=[];lastRipple=[];bitStream.reset();director.reset();showProduct(0);measureSoftware();softwareStage=-1;washTime=0;washPaint.clearRect(0,0,W,H);paused=false;tailFrames.clear();controls();draw(0);start();}
  pause.addEventListener('click',()=>{paused=!paused;controls();start();});replay.addEventListener('click',rebuild);
  staticButton.addEventListener('click',()=>{staticMode=!staticMode;paused=false;controls();start();});
  const dialog=document.querySelector('#prototype-dialog'),expand=document.querySelector('#prototype-expand'),closeDialog=document.querySelector('#prototype-close');let resumeAfterDialog=false,inspectedProduct=0;
  function inspectProduct(index){inspectedProduct=(index+products.length)%products.length;mountProduct(dialog.querySelector('.product-stage'),inspectedProduct);dialog.querySelector('strong').textContent=products[inspectedProduct].name;dialog.querySelector('.prototype-position').textContent=`${String(inspectedProduct+1).padStart(2,'0')} / 04`;}
  if(dialog&&expand&&closeDialog){
    expand.addEventListener('click',()=>{resumeAfterDialog=!paused&&!fixed();if(resumeAfterDialog){paused=true;controls();start();}inspectProduct(director.index);dialog.showModal();});
    closeDialog.addEventListener('click',()=>dialog.close());
    dialog.querySelector('#prototype-prev').addEventListener('click',()=>inspectProduct(inspectedProduct-1));dialog.querySelector('#prototype-next').addEventListener('click',()=>inspectProduct(inspectedProduct+1));
    dialog.addEventListener('close',()=>{if(resumeAfterDialog){paused=false;controls();start();}resumeAfterDialog=false;});
  }
  const onPreference=()=>{controls();start();};preference.addEventListener('change',onPreference);
  const onVisibility=()=>{visible=!document.hidden&&inView;start();};let inView=true;document.addEventListener('visibilitychange',onVisibility);
  const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;onVisibility();});visibility.observe(hero);
  const observer=new ResizeObserver(()=>{geometryDirty=true;if(paused||fixed())draw(fixed()?18:elapsed);});observer.observe(hero);observer.observe(panel);
  panel.addEventListener('scroll',()=>{readReadingZones();if(paused||fixed())draw(fixed()?18:elapsed);},{passive:true});
  hero.addEventListener('pointerdown',event=>{if(fixed()||paused||event.target.closest('button,a,input,select,textarea'))return;const r=scene.getBoundingClientRect();ripples.push({x:event.clientX-r.left,y:event.clientY-r.top,born:elapsed,angle:0,strength:1});if(ripples.length>24)ripples.shift();});
  window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);bitStream.reset();tailFrames.clear();sceneBits.dispose();floorRenderer.dispose();observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',onVisibility);preference.removeEventListener('change',onPreference);},{once:true});
  measure();scene.classList.add('koi-ready');if(surfacePaint)hero.classList.add('water-ready');scene.setAttribute('aria-busy','false');controls();draw(fixed()?18:0);start();
})();
