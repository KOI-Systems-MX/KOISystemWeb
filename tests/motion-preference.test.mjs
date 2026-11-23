import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createSwimmers,advanceSwimmers,spinePoint,anatomyPoint,fillAnatomyMesh,resizeSwimmers} from '../dist/swimming.js';
import {createLocalTailScene} from '../dist/local-tail-scene.js';
import {createBitStream} from '../dist/interface-bits.js';
import {formationAt,materialAt,koiBirthAt,ease} from '../dist/formation.js';
import {waterField,protectReading,drawWaterSurface,createPondFloor} from '../dist/pond-water.js';
import {createFloaters,advanceFloaters} from '../dist/vegetation.js';
import {products,mountProduct,captureProductSlots,createProductDirector} from '../dist/products.js';
import {tailField,tailPoint,tailEmitter,paintDissolvingTail,tailColor} from '../dist/tail-dissolution.js';
import {tailCodeParticle} from '../dist/code-vocabulary.js';
import {fragmentOverlaps} from '../dist/code-vocabulary.js';
import {createHydrodynamics,rippleAt} from '../dist/hydrodynamics.js';

// Run the actual scene controller with browser/paint adapters. This checks the
// reduced-motion contract without changing the user's operating-system setting.
async function sceneHarness(reduced){
  const gradient={addColorStop(){}};
  const paint=new Proxy({getImageData:()=>({data:new Uint8ClampedArray(4)}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
  const rect={left:0,top:0,right:1280,bottom:720,width:1280,height:720};
  const element=(bounds=rect)=>({dataset:{},style:{values:{},setProperty(k,v){this.values[k]=v;}},children:[],disabled:false,textContent:'',attributes:{},listeners:new Map(),classList:{add(){}},getBoundingClientRect:()=>bounds,setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},addEventListener(k,fn){this.listeners.set(k,fn);},querySelector(){return status;},querySelectorAll:()=>[],getContext:()=>paint});
  const status=element(),hero=element(),panel=element({...rect,left:84,right:550,top:100,bottom:590,width:466,height:490});hero.dataset={submerged:'true',immersive:'true'};
  const nodes={'#koi-canvas':element(),'#koi-overpass':element(),'.koi-scene':element(),'.hero':hero,'.hero-copy':panel,'#pond-surface':element(),'#software-code':element(),'#pond-floor':element(),'#koi-pause':element(),'#koi-replay':element(),'#koi-static':element(),'.software-interface':element(),'#koi-phase':element()};
  const frames=new Map();let serial=0;
  const preference={matches:reduced,listeners:new Map(),addEventListener(k,f){this.listeners.set(k,f);},removeEventListener(){}};
  const context=vm.createContext({
    console,Math,Promise,Uint8ClampedArray,devicePixelRatio:1,
    document:{hidden:false,querySelector:s=>nodes[s],createElement:()=>element(),addEventListener(){},removeEventListener(){}},window:{addEventListener(){}},
    Image:class{width=100;height=100;decode(){return Promise.resolve();}},
    ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}},
    matchMedia:()=>preference,requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),
    tailField,tailPoint,tailEmitter,paintDissolvingTail,tailColor,tailCodeParticle,createSwimmers,advanceSwimmers,spinePoint,anatomyPoint,fillAnatomyMesh,resizeSwimmers,createBitStream,createLocalTailScene,formationAt,materialAt,koiBirthAt,ease,waterField,protectReading,drawWaterSurface,createFloaters,advanceFloaters,products,mountProduct,captureProductSlots,createProductDirector,fragmentOverlaps,createHydrodynamics,rippleAt,
    createSceneBits:()=>({measure(){},draw(){},dispose(){}}),
    createPondFloor:()=>({mode:'test-adapter',draw(){},dispose(){}}),
  });
  const code=(await readFile(new URL('../dist/koi.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
  await vm.runInContext(code,context);
  return {nodes,frames,preference,step(stamp){const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(stamp));}};
}

test('OS reduced motion paints floor, koi and surface once at the same final time without scheduling animation',async()=>{
  const h=await sceneHarness(true);
  assert.equal(h.frames.size,0);
  assert.equal(h.nodes['.koi-scene'].dataset.mode,'static');
  for(const selector of ['#pond-floor','.koi-scene','#pond-surface','#software-code','#koi-overpass'])assert.equal(h.nodes[selector].dataset.time,'18.00');
  assert.equal(h.nodes['.software-interface'].style.values['--rows'],'1.000');
  assert.equal(h.nodes['#koi-pause'].disabled,true);
  assert.equal(h.nodes['#koi-replay'].disabled,true);
});

test('the production controller emits tail code during the initial, incomplete formation',async()=>{
  const h=await sceneHarness(false);
  for(let t=0;t<=1500;t+=40)h.step(t);
  const scene=h.nodes['.koi-scene'];
  assert.equal(scene.dataset.koiBirth,'forming');
  assert.ok(Number(scene.dataset.tailParticles)>0,'the real controller cannot delay tail emission until the body completes');
  assert.ok(Number.isFinite(Number(scene.dataset.codeReceived)));
});

test('pausing and changing the motion preference controls every water layer with the running scene',async()=>{
  const h=await sceneHarness(false);
  for(let t=0;t<=8000;t+=40)h.step(t);
  const time=h.nodes['.koi-scene'].dataset.time;
  assert.ok(Number(time)>7.8);
  assert.equal(h.nodes['#pond-floor'].dataset.time,time);assert.equal(h.nodes['#pond-surface'].dataset.time,time);assert.equal(h.nodes['#koi-overpass'].dataset.time,time);
  const flora=h.nodes['.koi-scene'].dataset.vegetation,ui=structuredClone(h.nodes['.software-interface'].style.values);
  h.nodes['#koi-pause'].listeners.get('click')();assert.equal(h.frames.size,0);
  assert.equal(h.nodes['#pond-surface'].dataset.time,time);assert.equal(h.nodes['#koi-overpass'].dataset.time,time);
  assert.equal(h.nodes['.koi-scene'].dataset.vegetation,flora);assert.deepEqual(h.nodes['.software-interface'].style.values,ui);
  assert.equal(h.nodes['#software-code'].dataset.time,time);
  h.preference.matches=true;h.preference.listeners.get('change')();
  assert.equal(h.frames.size,0);assert.equal(h.nodes['#pond-surface'].dataset.time,'18.00');
});

test('actual pointermove handlers can startle a forming koi without pointerdown or click',async()=>{
  const h=await sceneHarness(false);
  for(let t=0;t<=1500;t+=40)h.step(t);
  const event=(x,timeStamp)=>({clientX:x,clientY:230,timeStamp,pointerType:'mouse',target:{closest:()=>null}});
  const move=h.nodes['.hero'].listeners.get('pointermove');
  move(event(100,2000));move(event(300,2020));
  let reacted=false;
  for(let t=1520;t<=3500;t+=40){h.step(t);reacted||=/STARTLED|FLEEING/.test(h.nodes['.koi-scene'].dataset.behavior);}
  assert.equal(h.nodes['.koi-scene'].dataset.koiBirth,'forming');
  assert.equal(h.nodes['.koi-scene'].dataset.stimulus,'shock');assert.ok(reacted);
});

test('the actual water renderer supplies a working Canvas fallback when WebGL2 is unavailable',()=>{
  const original=globalThis.document;let fills=0,replaced=false;
  const gradient={addColorStop(){}};
  const ctx=new Proxy({createLinearGradient:()=>gradient,fillRect(){fills++;},lineTo(x,y){assert.ok(Number.isFinite(x)&&Number.isFinite(y));}},{get:(o,k)=>k in o?o[k]:()=>{}});
  const fallback={width:375,height:667,setAttribute(){},getContext:()=>ctx};
  globalThis.document={createElement:()=>fallback};
  try{
    const renderer=createPondFloor({id:'pond-floor',getContext:()=>null,replaceWith(e){replaced=e===fallback;}});
    assert.equal(renderer.mode,'canvas2d');assert.ok(replaced);
    renderer.draw(0);renderer.draw(18);renderer.dispose();assert.equal(fills,2);
  }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});
