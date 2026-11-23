import test from 'node:test';
import assert from 'node:assert/strict';
import {identityAt,IDENTITY_DURATION,IDENTITY_LOGO_START,IDENTITY_LOGO_SECONDS,attachIdentityMotion,codeTargets,materialAt,inkBaseline,logoBuildAt} from '../dist/identity-motion.js';

test('the final symbol takes five seconds to gather code, settle ink cells and reveal the clean asset',()=>{
  assert.equal(IDENTITY_LOGO_SECONDS,5);
  const early=logoBuildAt(IDENTITY_LOGO_START+.8),middle=logoBuildAt(IDENTITY_LOGO_START+2.8),late=logoBuildAt(IDENTITY_LOGO_START+4.4),end=logoBuildAt(IDENTITY_DURATION);
  assert.equal(early.inkAlpha,0);
  assert.ok(materialAt(early.age,4).codeAlpha>0);
  const settled=Array.from({length:100},(_,seed)=>materialAt(middle.age,seed).solid).filter(Boolean).length;
  assert.ok(settled>0&&settled<100,'code and painted cells coexist during construction');
  assert.equal(middle.inkAlpha,0,'the complete asset cannot cover the assembling cells');
  assert.ok(late.inkAlpha>0&&late.inkAlpha<1);
  assert.equal(end.inkAlpha,1);assert.equal(end.progress,1);
  for(let seed=0;seed<100;seed++)assert.equal(materialAt(end.age,seed).codeAlpha,0);
});

test('large initials and smaller words share an ink center even with descenders',()=>{
  const center=280;
  for(const metrics of [{actualBoundingBoxAscent:112,actualBoundingBoxDescent:0},{actualBoundingBoxAscent:55,actualBoundingBoxDescent:0},{actualBoundingBoxAscent:58,actualBoundingBoxDescent:19}]){
    const baseline=center+inkBaseline(metrics,160);
    const top=baseline-metrics.actualBoundingBoxAscent,bottom=baseline+metrics.actualBoundingBoxDescent;
    assert.equal((top+bottom)/2,center);
  }
});

test('code materializes only into painted pixels and clears after the solid identity is ready',()=>{
  const pixels=new Uint8ClampedArray(16*16*4);
  for(const [x,y,r,g,b] of [[4,4,241,106,43],[8,8,16,44,70]])pixels.set([r,g,b,255],(y*16+x)*4);
  const targets=codeTargets(pixels,16,16,4);
  assert.deepEqual(targets.map(p=>[p.x,p.y]),[[4,4],[8,8]]);
  assert.equal(targets[0].color,'rgb(241 106 43)');
  assert.equal(identityAt(0).letters[0].opacity,0,'no prebuilt KOI before the code arrives');
  for(const p of targets){
    assert.equal(materialAt(0,p.seed).solid,false);
    assert.ok(materialAt(.25,p.seed).codeAlpha>0);
    assert.ok(materialAt(.7,p.seed).progress>materialAt(.25,p.seed).progress);
    assert.equal(materialAt(1.5,p.seed).solid,true);
    assert.equal(materialAt(1.5,p.seed).codeAlpha,0,'no lingering code over the finished identity');
  }
});

test('the reference narrative separates KOI and reveals the actual word sequences in order',()=>{
  assert.equal(identityAt(0).phase,'KOI');
  const split=identityAt(6.7);
  assert.deepEqual(split.words,['Kaizen','','']);
  assert.equal(split.letters[0].x,split.letters[2].x);
  assert.ok(split.letters[0].y<split.letters[1].y&&split.letters[1].y<split.letters[2].y);
  assert.deepEqual(identityAt(9.4).words,['Kernel','Operaciones','Innovación']);
  assert.deepEqual(identityAt(12.7).words,['Kinetic','Operational','Intelligence']);
  assert.equal(identityAt(14).phase,'Identidad KOI Systems','the words transition directly into the logo, without an extra name scene');
  assert.ok(identityAt(14).ending>0);
  assert.equal(identityAt(IDENTITY_DURATION).ending,1);
  assert.equal(identityAt(IDENTITY_DURATION+100).finished,true);
});

test('letters remain continuous, bounded and reversible to the same replay state',()=>{
  for(let t=0;t<IDENTITY_DURATION;t+=.02){
    const a=identityAt(t),b=identityAt(t+.001);
    for(let i=0;i<3;i++){
      assert.ok(Math.hypot(a.letters[i].x-b.letters[i].x,a.letters[i].y-b.letters[i].y)<1);
      assert.ok(a.wordAlpha[i]>=0&&a.wordAlpha[i]<=1);
      assert.ok(a.letters[i].opacity>=0&&a.letters[i].opacity<=1);
    }
  }
  identityAt(18);
  assert.deepEqual(identityAt(0),identityAt(-1));
  assert.equal(identityAt(0).ending,0);
});

test('the official end identity never precedes the word narrative',()=>{
  for(let t=0;t<=IDENTITY_LOGO_START;t+=.1)assert.equal(identityAt(t).ending,0);
  assert.ok(identityAt(14.2).ending>0&&identityAt(14.2).ending<1);
  assert.equal(identityAt(18).letters[0].opacity,0);
  assert.equal(identityAt(18).nameAlpha,undefined);
});

test('the production clock pauses offscreen, restarts, and cancels all motion for reduced preference',t=>{
  class Node{
    style={};dataset={};listeners=new Map();textContent='';
    setAttribute(k,v){this[k]=v;}
    addEventListener(k,fn){this.listeners.set(k,fn);}
    removeEventListener(k){this.listeners.delete(k);}
    fire(k){this.listeners.get(k)?.();}
  }
  const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
  const nodes=Object.fromEntries(['canvas','.film-ending','.identity-controls','.identity-pause','.identity-replay','.identity-status','.identity-explanation'].map(k=>[k,new Node()]));
  nodes.canvas.getContext=()=>ctx;
  const root=new Node(),pref=new Node(),letters=Array.from({length:3},()=>new Node()),words=Array.from({length:3},()=>new Node());
  root.getBoundingClientRect=()=>({width:549,height:412});root.querySelector=s=>nodes[s];
  root.querySelectorAll=s=>s.includes('glyphs')?letters:words;
  const presentation={querySelector:s=>s==='.film-frame'?root:nodes[s]};
  const saved=new Map(),frames=new Map();let id=0,intersection;
  const replacements={document:new Node(),devicePixelRatio:1,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:i=>frames.delete(i),
    IntersectionObserver:class{constructor(cb){intersection=cb;}observe(){}disconnect(){}},ResizeObserver:class{observe(){}disconnect(){}}};
  for(const [key,value] of Object.entries(replacements)){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
  t.after(()=>{for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
  const controller=attachIdentityMotion(presentation,pref);
  const step=now=>{const [key,fn]=frames.entries().next().value;frames.delete(key);fn(now);};
  assert.equal(frames.size,0);
  intersection([{isIntersecting:true}]);step(0);step(9000);
  assert.equal(root.dataset.identityTime,'9.00','clock remains correct even at throttled frame rates');
  nodes['.identity-pause'].fire('click');assert.equal(frames.size,0);assert.equal(root.dataset.state,'paused');
  nodes['.identity-pause'].fire('click');step(20000);assert.equal(root.dataset.identityTime,'9.00');
  intersection([{isIntersecting:false}]);assert.equal(frames.size,0);
  intersection([{isIntersecting:true}]);step(50000);assert.equal(root.dataset.identityTime,'9.00');
  nodes['.identity-replay'].fire('click');assert.equal(root.dataset.identityTime,'0.00');
  step(60000);step(79000);assert.equal(root.dataset.state,'ended');assert.equal(frames.size,0);assert.equal(nodes['.film-ending'].inert,false);
  pref.matches=true;pref.fire('change');assert.equal(root.dataset.state,'reduced');assert.equal(frames.size,0);assert.equal(nodes['.identity-controls'].hidden,true);assert.equal(nodes['.identity-explanation'].open,true);
  controller.dispose();assert.equal(frames.size,0);assert.equal(nodes['.identity-replay'].listeners.size,0);
});
