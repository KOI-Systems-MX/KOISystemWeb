const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function sceneBuildAt(time,still=false){
  if(still)return {water:1,message:1,identity:1,bits:0};
  return {water:ease((time-4)/6),message:ease((time-5)/5),identity:ease((time-3)/4),bits:1-ease((time-7)/4)};
}

// This layer shares the pond clock. Text is sampled from its actual DOM glyphs;
// original logo pixels supply the identity silhouette, without replacing the asset.
export function createSceneBits({hero,panel,scene}){
  const canvas=document.createElement('canvas');canvas.id='scene-bits';canvas.setAttribute('aria-hidden','true');hero.append(canvas);
  const paint=canvas.getContext('2d'),sample=document.createElement('canvas'),ink=sample.getContext('2d',{willReadFrequently:true});
  const header=document.querySelector('.header');
  let width=0,height=0,points=[];
  function measure(){
    const bounds=scene.getBoundingClientRect();width=bounds.width;height=bounds.height;
    const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);paint.setTransform(ratio,0,0,ratio,0,0);
    sample.width=Math.ceil(width);sample.height=Math.ceil(height);points=[];
    for(const [root,type] of [[panel,'message'],[header,'identity']]){
      if(!root)continue;ink.clearRect(0,0,width,height);
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        const node=walker.currentNode,style=getComputedStyle(node.parentElement);
        if(style.display==='none'||style.visibility==='hidden')continue;
        ink.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ink.fillStyle=style.color;ink.textBaseline='top';
        for(let i=0;i<node.textContent.length;i++){
          if(!node.textContent[i].trim())continue;
          const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();
          if(!r.width||!r.height)continue;
          ink.fillText(node.textContent[i],r.left-bounds.left,r.top-bounds.top+Math.max(0,(r.height-parseFloat(style.fontSize))*.4));
        }
      }
      for(const image of root.querySelectorAll('img')){
        if(!image.complete||!image.naturalWidth)continue;const r=image.getBoundingClientRect();
        if(r.width&&r.height)ink.drawImage(image,r.left-bounds.left,r.top-bounds.top,r.width,r.height);
      }
      const pixels=ink.getImageData(0,0,sample.width,sample.height).data;
      for(let y=0;y<height;y+=4)for(let x=0;x<width;x+=4){
        const i=(y*sample.width+x)*4;if(pixels[i+3]<65)continue;
        points.push({x,y,type,rank:hash(x*13+y*37),bit:String((x+y)&1),color:`rgb(${pixels[i]},${pixels[i+1]},${pixels[i+2]})`});
      }
    }
  }
  function draw(time,still){
    const state=sceneBuildAt(time,still);paint.clearRect(0,0,width,height);
    hero.style.setProperty('--water-build',state.water.toFixed(3));panel.style.setProperty('--message-build',state.message.toFixed(3));
    if(header)header.style.setProperty('--identity-build',state.identity.toFixed(3));
    canvas.dataset.time=(still?18:time).toFixed(2);canvas.dataset.phase=state.bits===0?'complete':'binary';
    if(state.bits===0)return;
    paint.font='5px Consolas,monospace';paint.textAlign='center';
    const step=Math.max(18,Math.ceil(Math.sqrt(width*height/2800)));
    for(let y=step/2;y<height;y+=step)for(let x=step/2;x<width;x+=step){
      const rank=hash(x*7+y*11),gather=ease((time-rank*3)/2.2);
      paint.globalAlpha=gather*(1-state.water)*.42;paint.fillStyle=rank>.86?'#a46d48':'#42576b';
      paint.fillText(rank>.5?'1':'0',x+Math.sin(rank*40)*(1-gather)*28,y-(1-gather)*32+Math.sin(x*.005+time*.3)*2);
    }
    for(const p of points){
      const build=p.type==='identity'?state.identity:state.message;
      const gather=ease((time-p.rank*2)/2);paint.globalAlpha=gather*(1-build)*.9;paint.fillStyle=p.color;
      paint.fillText(p.rank>.5?'1':'0',p.x+Math.sin(p.rank*60)*(1-gather)*18,p.y-(1-gather)*22);
    }
    paint.globalAlpha=1;
  }
  return {measure,draw,dispose(){canvas.remove();panel.style.removeProperty('--message-build');if(header)header.style.removeProperty('--identity-build');hero.style.removeProperty('--water-build');}};
}
