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
