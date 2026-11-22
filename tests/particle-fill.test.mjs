import test from 'node:test';
import assert from 'node:assert/strict';
import {createBitStream} from '../dist/interface-bits.js';

test('code accumulates across the surface before becoming clean software',()=>{
  const stream=createBitStream({autoCycle:false});
  const target={left:900,top:180,width:420,height:500};
  let maximumVisible=0,full;
  const occupied=new Set();
  for(let frame=0;frame<1500;frame++){
    const state=stream.update(frame/30,[{x:1000,y:300,speed:60,fishId:1}],target);
    const visible=state.settled.filter(p=>p.alpha>.3);
    maximumVisible=Math.max(maximumVisible,visible.length);
    for(const p of visible)occupied.add(`${Math.floor(p.slot.u*4)},${Math.floor(p.slot.v*4)}`);
    assert.ok(state.particles.length<=1200);
    if(state.phase==='software')full=state;
  }
  assert.ok(maximumVisible>300,`expected accumulation, saw ${maximumVisible}`);
  assert.equal(occupied.size,16,'code fills every quadrant of the interface');
  assert.ok(full);assert.equal(full.progress,1);
  assert.ok(full.settled.every(p=>p.alpha===0));
});
