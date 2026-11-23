import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {PROJECT_SLIDES,wrapSlide,attachProjectGallery,deckOffset,createGalleryAutoplay} from '../dist/projects.js';

test('stable cards occupy five symmetric positions through every turn of the deck',()=>{
  for(let active=0;active<5;active++){
    const positions=Array.from({length:5},(_,i)=>deckOffset(i,active));
    assert.deepEqual([...positions].sort((a,b)=>a-b),[-2,-1,0,1,2]);assert.equal(positions[active],0);
  }
});
test('automatic rotation advances every second and pauses for reading, dialogs, hidden pages and reduced motion',()=>{
  let calls=0,id=0;const timers=new Map();
  const clock=createGalleryAutoplay(()=>calls++,{setInterval(fn,delay){assert.equal(delay,1000);timers.set(++id,fn);return id;},clearInterval(key){timers.delete(key);}});
  assert.equal(timers.size,0);clock.block('offscreen',false);assert.equal(timers.size,1);
  [...timers.values()][0]();assert.equal(calls,1);
  for(const reason of ['hover','focus','dialog','hidden','user','reduced','offscreen']){clock.block(reason,true);assert.equal(timers.size,0);clock.block(reason,false);assert.equal(timers.size,1);}
  clock.block('hover',true);clock.block('dialog',true);clock.block('hover',false);assert.equal(timers.size,0);
  clock.block('dialog',false);assert.equal(timers.size,1);clock.dispose();assert.equal(timers.size,0);
});

test('five distinct screenshots belong to real modules of the provided prototype',()=>{
  const source=fs.readFileSync(new URL('../dist/prototypes/operations/index.html',import.meta.url),'utf8');
  const hashes=new Set();
  for(const slide of PROJECT_SLIDES){
    assert.ok(source.includes(`id:'${slide.id}'`));
    const bytes=fs.readFileSync(new URL(`../dist/assets/projects/${slide.image}.jpg`,import.meta.url));
    assert.ok(bytes.length>10000);hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(hashes.size,5);assert.equal(wrapSlide(-1),4);assert.equal(wrapSlide(5),0);
});

function setup(){
  class Node{
    listeners=new Map();attributes={};dataset={};hidden=true;textContent='';
    addEventListener(k,fn){this.listeners.set(k,fn);}
    removeEventListener(k){this.listeners.delete(k);}
    setAttribute(k,v){this.attributes[k]=v;}
    removeAttribute(k){delete this.attributes[k];}
    fire(k,e={}){this.listeners.get(k)?.(e);}
    focus(){this.focused=true;}
    showModal(){this.open=true;}
    close(){this.open=false;this.fire('close');}
  }
  const names=['#project-image','.project-preview','#project-image-dialog','#project-dialog-image','#project-slide-title','#project-dialog-title','#project-slide-description','#project-position','#project-original','#project-prev','#project-next','#project-dialog-prev','#project-dialog-next','#project-carousel','#project-dialog-close','.project-controls','.project-dots'];
  const nodes=Object.fromEntries(names.map(name=>[name,new Node()])),dots=Array.from({length:5},()=>new Node());
  const root={dataset:{},querySelector:s=>nodes[s],querySelectorAll:s=>s==='[data-project-slide]'?dots:[]};
  return {nodes,dots,root,controller:attachProjectGallery(root)};
}
test('carousel buttons, keyboard and dots update the image, caption and position together',()=>{
  const h=setup(),n=h.nodes;
  assert.equal(h.root.dataset.projectSlide,'dashboard');
  n['#project-prev'].fire('click');assert.equal(h.root.dataset.projectSlide,'seguimiento');
  n['#project-next'].fire('click');assert.equal(h.root.dataset.projectSlide,'dashboard');
  h.dots[3].fire('click');assert.equal(n['#project-slide-title'].textContent,'Inventario multialmacén');
  assert.ok(n['#project-image'].src.endsWith('inventario.jpg'));
  assert.equal(h.dots.filter(dot=>dot.attributes['aria-current']).length,1);
  n['#project-carousel'].fire('keydown',{key:'ArrowRight',preventDefault(){}});
  assert.equal(h.root.dataset.projectSlide,'seguimiento');
  n['#project-carousel'].fire('keydown',{key:'ArrowLeft',target:{closest:()=>({})},preventDefault(){assert.fail('editing a field must remain independent');}});
  assert.equal(h.root.dataset.projectSlide,'seguimiento');
  h.controller.dispose();assert.equal(n['#project-next'].listeners.size,0);
});
test('enlarged images share carousel state and closing restores focus to the gallery',()=>{
  const {nodes:n}=setup();n['.project-preview'].fire('click');assert.equal(n['#project-image-dialog'].open,true);
  n['#project-dialog-next'].fire('click');assert.equal(n['#project-dialog-title'].textContent,'Cotizaciones');
  assert.equal(n['#project-dialog-image'].src,n['#project-image'].src);
  n['#project-dialog-close'].fire('click');assert.equal(n['#project-image-dialog'].open,false);assert.equal(n['.project-preview'].focused,true);
});
test('a vertical touch gesture preserves the page while a horizontal gesture changes the slide',()=>{
  const h=setup(),preview=h.nodes['.project-preview'];
  preview.fire('pointerdown',{clientX:100,clientY:100,pointerId:1});preview.fire('pointerup',{clientX:105,clientY:200,pointerId:1});
  assert.equal(h.root.dataset.projectSlide,'dashboard');
  preview.fire('pointerdown',{clientX:200,clientY:100,pointerId:2});preview.fire('pointerup',{clientX:80,clientY:104,pointerId:2});
  assert.equal(h.root.dataset.projectSlide,'cotizacion');preview.fire('click');assert.notEqual(h.nodes['#project-image-dialog'].open,true);
});
