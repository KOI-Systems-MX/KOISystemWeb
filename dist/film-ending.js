export function attachFilmEnding(root,preference=matchMedia('(prefers-reduced-motion: reduce)')){
  const video=root.querySelector('video'),ending=root.querySelector('.film-ending');
  const play=root.parentElement.querySelector('.film-play'),replay=root.querySelector('.film-replay');
  const listeners=[];
  function on(target,type,fn){target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener(type,fn));}
  function setState(state){
    root.dataset.state=state;const visible=state==='ended'||state==='reduced';
    ending.inert=!visible;ending.setAttribute('aria-hidden',String(!visible));
    video.inert=visible;video.setAttribute('aria-hidden',String(visible));
    replay.textContent=state==='reduced'?'Reproducir video':'Repetir video';
    if(play)play.textContent=state==='paused'?'Continuar presentación':'Reproducir presentación';
  }
  async function start(restart=false){
    if(restart||video.ended)video.currentTime=0;
    setState('playing');
    root.scrollIntoView?.({block:'center',behavior:preference.matches?'auto':'smooth'});
    try{await video.play();video.focus?.({preventScroll:true});}catch{setState(preference.matches?'reduced':'idle');if(play)play.textContent='Reproducir presentación';}
  }
  video.loop=false;
  on(video,'play',()=>setState('playing'));
  on(video,'pause',()=>{if(!video.ended&&root.dataset.state!=='reduced')setState('paused');});
  on(video,'ended',()=>{if(video.ended)setState('ended');});
  if(play)on(play,'click',()=>start());on(replay,'click',()=>start(true));
  on(preference,'change',()=>{if(preference.matches){video.pause();setState('reduced');}else if(root.dataset.state==='reduced')setState('idle');});
  setState(preference.matches?'reduced':'idle');
  return {dispose(){listeners.forEach(remove=>remove());}};
}
if(typeof document!=='undefined'){
  const roots=[...document.querySelectorAll('[data-film-ending]')],instances=roots.map(root=>attachFilmEnding(root));
  window.addEventListener('pagehide',()=>instances.forEach(instance=>instance.dispose()),{once:true});
}
