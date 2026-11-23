export const PROJECT_SLIDES=Object.freeze([
  {id:'dashboard',image:'dashboard',title:'Panel general',description:'Ventas, compras, inventario y pendientes reunidos en una vista para entender el estado de la operación.'},
  {id:'cotizacion',image:'cotizacion',title:'Cotizaciones',description:'Preparación de propuestas por empresa y cliente, con varias partidas, condiciones de entrega y un resumen de importes.'},
  {id:'compras',image:'compras',title:'Compras y recepción',description:'Un recorrido por proveedor, pago, destino y recepción para seguir cada compra y su documentación.'},
  {id:'ubicaciones',image:'inventario',title:'Inventario multialmacén',description:'Existencias físicas, apartados y disponibilidad por ubicación, con una vista de las transferencias entre almacenes.'},
  {id:'seguimiento',image:'seguimiento',title:'Seguimiento de operaciones',description:'Un tablero que distingue orden, cobro y entrega para mantener a la vista las operaciones con pendientes.'},
]);
export const wrapSlide=(index,length=PROJECT_SLIDES.length)=>((index%length)+length)%length;
export function deckOffset(card,active,length=PROJECT_SLIDES.length){const offset=wrapSlide(card-active,length);return offset>Math.floor(length/2)?offset-length:offset;}
export function createGalleryAutoplay(advance,timing={setInterval:(fn,delay)=>setInterval(fn,delay),clearInterval:id=>clearInterval(id)}){
  let timer=null;const blocks=new Set(['offscreen']);
  function block(reason,blocked){
    if(blocked)blocks.add(reason);else blocks.delete(reason);
    if(blocks.size&&timer!==null){timing.clearInterval(timer);timer=null;}
    if(!blocks.size&&timer===null)timer=timing.setInterval(advance,1000);
  }
  return {block,dispose(){blocks.add('disposed');if(timer!==null)timing.clearInterval(timer);timer=null;}};
}

export function attachProjectGallery(root){
  let index=0,press=null,lastSwipe=-Infinity,paused=false;
  const query=s=>root.querySelector(s);
  let image=query('#project-image'),preview=query('.project-preview');
  const dialog=query('#project-image-dialog'),dialogImage=query('#project-dialog-image');
  const dots=[...root.querySelectorAll('[data-project-slide]')];
  const cards=[...root.querySelectorAll('[data-project-card]')],carousel=query('#project-carousel'),pause=query('#project-autoplay');
  const listeners=[];
  const on=(node,event,fn)=>{node.addEventListener(event,fn);listeners.push(()=>node.removeEventListener(event,fn));};
  const clock=createGalleryAutoplay(()=>show(index+1));
  const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  function motion(){clock.block('reduced',!!preference?.matches);if(pause)pause.hidden=!!preference?.matches;}
  motion();
  function show(next){
    index=wrapSlide(next);const slide=PROJECT_SLIDES[index],src=`assets/projects/${slide.image}.jpg`,alt=`${slide.title}: ${slide.description}`;
    if(cards.length){
      image.removeAttribute('id');
      cards.forEach((card,i)=>{const offset=deckOffset(i,index);card.style.setProperty('--deck-position',offset);card.style.setProperty('--deck-distance',Math.abs(offset));card.classList.toggle('is-active',offset===0);card.classList.toggle('project-preview',offset===0);card.setAttribute('aria-label',`${offset===0?'Ampliar captura':'Ver pantalla'}: ${PROJECT_SLIDES[i].title}`);});
      preview=cards[index];image=preview.querySelector('img');image.id='project-image';
    }
    image.src=dialogImage.src=src;image.alt=dialogImage.alt=alt;
    preview.setAttribute('aria-label',`Ampliar captura: ${slide.title}`);
    query('#project-slide-title').textContent=query('#project-dialog-title').textContent=slide.title;
    query('#project-slide-description').textContent=slide.description;
    query('#project-position').textContent=`${String(index+1).padStart(2,'0')} / ${String(PROJECT_SLIDES.length).padStart(2,'0')}`;
    query('#project-position').setAttribute('aria-label',`Pantalla ${index+1} de ${PROJECT_SLIDES.length}: ${slide.title}`);
    query('#project-original').href=src;
    dots.forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});
    root.dataset.projectSlide=slide.id;
  }
  function key(event){if(event.target?.closest('input,textarea,select,[contenteditable="true"]'))return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}}
  on(query('#project-prev'),'click',()=>show(index-1));on(query('#project-next'),'click',()=>show(index+1));
  on(query('#project-dialog-prev'),'click',()=>show(index-1));on(query('#project-dialog-next'),'click',()=>show(index+1));
  dots.forEach((dot,i)=>on(dot,'click',()=>show(i)));
  on(carousel,'keydown',key);on(dialog,'keydown',key);
  for(const [i,card] of (cards.length?cards:[preview]).entries()){
    on(card,'click',()=>{if(performance.now()-lastSwipe<350)return;if(cards.length&&i!==index){show(i);return;}clock.block('dialog',true);dialog.showModal();query('#project-dialog-close').focus();});
  }
  on(query('#project-dialog-close'),'click',()=>dialog.close());
  on(dialog,'close',()=>{preview.focus({preventScroll:true});clock.block('dialog',false);});
  const gesture=query('.project-deck')||preview;
  on(gesture,'pointerdown',e=>{press={x:e.clientX,y:e.clientY,id:e.pointerId};});
  on(gesture,'pointercancel',()=>{press=null;});
  on(gesture,'pointerup',e=>{if(!press||press.id!==e.pointerId)return;const dx=e.clientX-press.x,dy=e.clientY-press.y;press=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){lastSwipe=performance.now();show(index+(dx<0?1:-1));}});
  on(carousel,'pointerenter',e=>{if(e.pointerType!=='touch')clock.block('hover',true);});on(carousel,'pointerleave',()=>clock.block('hover',false));
  on(carousel,'focusin',()=>clock.block('focus',true));on(carousel,'focusout',e=>{if(!carousel.contains(e.relatedTarget))clock.block('focus',false);});
  if(pause)on(pause,'click',()=>{paused=!paused;clock.block('user',paused);if(!paused){clock.block('hover',false);clock.block('focus',false);}pause.textContent=paused?'Reanudar':'Pausar';pause.setAttribute('aria-pressed',String(paused));});
  let observer=null;
  if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>clock.block('offscreen',!entries[0].isIntersecting),{threshold:.25});observer.observe(carousel);}
  if(typeof document!=='undefined'){const visibility=()=>clock.block('hidden',document.hidden);visibility();on(document,'visibilitychange',visibility);}
  if(preference)on(preference,'change',motion);
  // Automatic changes stay quiet for assistive technology; the selected card is labelled.
  query('#project-position').setAttribute('aria-live','off');
  query('.project-controls').hidden=false;query('.project-dots').hidden=false;show(0);
  return {dispose(){clock.dispose();observer?.disconnect();listeners.forEach(remove=>remove());}};
}
if(typeof document!=='undefined'){
  const root=document.querySelector('.projects-section');
  if(root){const gallery=attachProjectGallery(root);window.addEventListener('pagehide',()=>gallery.dispose(),{once:true});}
}
