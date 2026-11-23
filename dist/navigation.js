// A reading line below the fixed header avoids selecting a section from a tiny sliver.
export function sectionAtReadingLine(sections,viewportHeight,headerBottom){
  const line=headerBottom+Math.min(100,Math.max(0,viewportHeight-headerBottom)*.18);
  return sections.find(section=>section.top<=line&&section.bottom>line)?.id||null;
}

export function attachSectionNavigation(header,main,backToTop=null){
  const links=[...header.querySelectorAll('nav a[href^="#"], .header-cta[href^="#"]')].filter(link=>link.hash.length>1);
  const sections=[...main.querySelectorAll(':scope > section')];
  let frame=0,active=null,disposed=false;
  function update(){
    frame=0;
    const rects=sections.map(section=>{
      const rect=section.getBoundingClientRect();return {id:section.id,top:rect.top,bottom:rect.bottom};
    });
    const headerBottom=header.getBoundingClientRect().bottom;
    if(backToTop)backToTop.hidden=(rects[0]?.bottom??Infinity)>headerBottom;
    const id=sectionAtReadingLine(rects,window.innerHeight,headerBottom);
    if(id===active)return;
    active=id;
    for(const link of links){
      if(link.hash===`#${id}`)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  }
  function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(update);}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('pageshow',schedule);
  const resize=new ResizeObserver(schedule);resize.observe(main);resize.observe(header);
  schedule();
  return {dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('hashchange',schedule);window.removeEventListener('pageshow',schedule);}};
}
if(typeof document!=='undefined'){
  const header=document.querySelector('.header'),main=document.querySelector('main');
  if(header&&main){const controller=attachSectionNavigation(header,main,document.querySelector('.back-to-top'));window.addEventListener('pagehide',()=>controller.dispose(),{once:true});}
}
