import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalTailScene} from '../dist/local-tail-scene.js';
const target={left:1000,top:200,width:420,height:500};
const source=(t,id=0)=>({fishId:id,x:120+Math.sin(t)*30+id*170,y:300+Math.cos(t*.6)*25,length:160,speed:70,heading:t<5?0:Math.PI,ports:[{x:120+Math.sin(t)*30+id*170,y:300+Math.cos(t*.6)*25,u:.06,v:.4,heading:t<5?0:Math.PI}]});

test('a distant koi leaves only a bounded local trail, independent of the software target',()=>{
  const a=createLocalTailScene(),b=createLocalTailScene();let maximum=0;
  for(let frame=0;frame<5400;frame++){
    const t=frame/30,sources=Array.from({length:4},(_,i)=>source(t,i));
    const state=a.update(t,sources,target),other=b.update(t,sources,{...target,left:4000});
    assert.deepEqual(state,other,'the interface cannot attract or influence any tail particle');
    maximum=Math.max(maximum,state.particles.length);assert.ok(state.particles.length<=64);
    assert.equal(state.settled.length,0);
    for(const s of sources)assert.ok(state.particles.filter(p=>p.fishId===s.fishId).length<=12);
    for(const p of state.particles){
      const anchor=sources[p.fishId];assert.equal(p.slot,null);assert.deepEqual(p.slots,[]);
      assert.ok(Math.hypot(p.x-anchor.x,p.y-anchor.y)<p.range);assert.ok(p.range<=64);
      assert.ok(p.text.length<=6);assert.ok(p.age<1.3);assert.ok(p.alpha<=.42);
    }
  }
  assert.ok(maximum>0&&maximum<45,'a restrained scene replaces the old swarm');
});
test('UI assembles without transfers, holds until requested, and recycles smoothly',()=>{
  const stream=createLocalTailScene();let state;
  stream.update(0,[],target);assert.equal(stream.requestDissolution(2),false);
  for(let frame=1;frame<=900;frame++)state=stream.update(frame/30,[],target);
  assert.equal(state.phase,'software');assert.equal(state.progress,1);assert.ok(state.components.every(v=>v===1));
  assert.equal(stream.requestDissolution(30),true);assert.equal(stream.requestDissolution(30),false);
  state=stream.update(31.4,[],target);assert.equal(state.phase,'dissolution');assert.ok(state.progress>0&&state.progress<1);
  state=stream.update(33,[],target);assert.equal(state.recycled,true);assert.ok(state.components.every(v=>v===0));
  state=stream.update(34,[],target);assert.equal(state.phase,'materialization');assert.ok(state.components.some(v=>v>0));
});
test('pause and static view preserve the local simulation, expiry and reset leave no particles',()=>{
  const stream=createLocalTailScene();let state;
  for(let frame=0;frame<=120;frame++)state=stream.update(frame/30,[source(frame/30)],target);
  const frozen=structuredClone(stream.update(4,[],target));assert.deepEqual(stream.update(4,[],target),frozen);
  assert.equal(stream.update(18,[],target,true).particles.length,0);assert.deepEqual(stream.update(4,[],target),frozen);
  for(let frame=1;frame<=60;frame++)state=stream.update(4+frame/30,[],target);
  assert.equal(state.particles.length,0);stream.reset();assert.equal(stream.update(0,[],target).progress,0);
});

test('initial pond formation finishes before even a nearby koi starts building',()=>{
  const stream=createLocalTailScene({nearbyBuild:true,buildAfter:10});
  const near={fishId:2,x:980,y:320,speed:65,ports:[{x:980,y:320,heading:0}]};
  for(let frame=0;frame<300;frame++){
    const state=stream.update(frame/30,[near],target);
    assert.equal(state.progress,0);assert.equal(state.builder,null);assert.equal(state.transfers.length,0);
  }
  const started=stream.update(10,[near],target);
  assert.equal(started.builder,2);assert.equal(started.phase,'materialization');assert.ok(started.transfers.length>0);
});

test('nearby construction waits for a close fin and accepts only one builder per cycle',()=>{
  const stream=createLocalTailScene({nearbyBuild:true});let state;
  for(let frame=0;frame<=600;frame++)state=stream.update(frame/30,[source(frame/30)],target);
  assert.equal(state.progress,0);assert.equal(state.phase,'emission');assert.equal(state.transfers.length,0);
  const near=(id,x)=>({fishId:id,x,y:320,length:160,speed:65,ports:[{x,y:320,heading:0,u:.08,v:.5}]});
  let seen=0;
  for(let frame=1;frame<=210;frame++){
    const t=20+frame/30,sources=[source(t),near(2,980),near(3,frame<20?960:1005)];
    state=stream.update(t,sources,target);
    assert.ok(state.transfers.length<=4);
    for(const p of state.transfers){
      seen++;assert.equal(p.fishId,2,'a closer second koi must not steal the active build');
      assert.ok(p.sx>=target.left-48);assert.ok(Math.hypot(p.tx-p.sx,p.ty-p.sy)<=48);
      assert.ok(Math.hypot(p.x-p.sx,p.y-p.sy)<54);assert.ok(p.age<.85);
    }
  }
  assert.ok(seen>0);assert.equal(state.phase,'software');assert.equal(state.progress,1);
  assert.equal(state.transfers.length,0);assert.equal(state.builder,null);
});
test('a builder that swims away stops transferring, without preventing completion or reset',()=>{
  const stream=createLocalTailScene({nearbyBuild:true});let state,afterLeaving=new Set();
  const near=(x)=>({fishId:1,x,y:300,length:160,speed:70,ports:[{x,y:300,heading:0,u:.1,v:.5}]});
  for(let frame=0;frame<=240;frame++){
    const t=frame/30;state=stream.update(t,[near(t<1?980:400)],target);
    if(t>2)for(const p of state.transfers)afterLeaving.add(p.id);
  }
  assert.equal(afterLeaving.size,0);assert.equal(state.phase,'software');assert.equal(state.transfers.length,0);
  stream.reset();state=stream.update(0,[source(0)],target);
  assert.equal(state.progress,0);assert.equal(state.builder,null);assert.equal(state.transfers.length,0);
});

test('binary construction stays inside the prototype and clears when its UI is complete',()=>{
  const stream=createLocalTailScene({nearbyBuild:true});
  const near={fishId:2,x:980,y:320,speed:65,ports:[{x:980,y:320,heading:0}]};
  stream.update(0,[near],target);
  let maximum=0;
  for(let frame=1;frame<=210;frame++){
    const state=stream.update(frame/30,[near],target);
    maximum=Math.max(maximum,state.assembly.length);
    for(const p of state.assembly){
      assert.match(p.text,/^[01]$/);assert.equal(p.fishId,2);
      assert.ok(p.x>target.left&&p.x<target.left+target.width);
      assert.ok(p.y>target.top&&p.y<target.top+target.height);
    }
    if(state.phase==='software')assert.equal(state.assembly.length,0);
  }
  assert.ok(maximum>200&&maximum<1000);
  assert.equal(stream.update(8,[near],target,true).assembly.length,0);
});
