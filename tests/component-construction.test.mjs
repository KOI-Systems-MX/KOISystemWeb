import test from 'node:test';
import assert from 'node:assert/strict';
import {createComponentConstruction} from '../dist/component-construction.js';
const target={left:800,top:120,width:420,height:500};
const blueprint=[{id:0,bed:true,x:800,y:120,width:420,height:500},...Array.from({length:5},(_,i)=>({id:i+1,stage:i+2,x:820,y:150+i*80,width:380,height:65}))];
const source={fishId:3,ports:[{x:810,y:300}]};
const fragment=id=>({id,fishId:3,text:'const',age:.1,x:810,y:300});
test('only actual delivered nearby tail code advances seven ordered component stages',()=>{
  const c=createComponentConstruction();c.setBlueprint(blueprint);
  for(let t=0;t<20;t+=.1)assert.equal(c.update(t,[source],target,[]).progress,0);
  let state,max=0,prior=0;
  for(let frame=0;frame<500;frame++){
    state=c.update(20+frame/30,[source],target,[fragment(frame)]);
    max=Math.max(max,state.assembly.length);assert.ok(state.progress>=prior);prior=state.progress;
    assert.ok(state.transfers.length<=4);
    for(const p of state.transfers){assert.equal(p.text,'const');assert.ok(Number.isInteger(p.sourceId));assert.ok(Math.hypot(p.x-p.sx,p.y-p.sy)<60);}
    for(const p of state.assembly){assert.equal(p.text,'const');assert.ok(Number.isInteger(p.sourceId));assert.equal(p.fishId,3);}
    for(const mask of state.masks)for(const cell of mask.cells)assert.ok(cell.group<=state.stage);
  }
  assert.equal(state.phase,'software');assert.ok(state.masks.every(m=>m.complete));assert.equal(state.assembly.length,0);assert.ok(max>0&&max<=70);
});

test('nearby tail code contributes during formation without a ten-second timer gate',()=>{
  const c=createComponentConstruction();c.setBlueprint(blueprint);let state;
  for(let i=0;i<60;i++)state=c.update(i/30,[source],target,[fragment(i)]);
  assert.ok(state.received>0);assert.ok(state.progress>0);assert.equal(state.phase,'materialization');
});
test('distant fish cannot fund construction; pause, reset and static rendering preserve the contract',()=>{
  const c=createComponentConstruction();c.setBlueprint(blueprint);
  for(let i=0;i<100;i++)assert.equal(c.update(10+i/30,[{fishId:3,ports:[{x:200,y:300}]}],target,[fragment(i)]).received,0);
  let state;
  for(let i=0;i<60;i++)state=c.update(14+i/30,[source],target,[fragment(i+100)]);
  const frozen=structuredClone(state);assert.deepEqual(c.update(14+59/30,[source],target,[fragment(159)]),frozen);
  const still=c.update(30,[],target,[],true);assert.equal(still.progress,1);assert.ok(still.masks.every(m=>m.complete));
  c.reset();assert.equal(c.update(0,[],target,[]).progress,0);
});

test('one delivered fragment cannot reveal a finished panel and dissolution clears its geometry',()=>{
  const c=createComponentConstruction();c.setBlueprint(blueprint);
  c.update(10,[source],target,[]);
  c.update(10.1,[source],target,[fragment(1)]);
  let state;
  for(let i=1;i<=150;i++)state=c.update(10.1+i/30,[],target,[]);
  assert.equal(state.received,1);assert.ok(state.progress>0&&state.progress<.2);
  const progress=state.progress;
  assert.equal(c.update(20,[],target,[]).progress,progress,'no timer can complete an unfunded panel');
  assert.equal(c.requestDissolution(20),false);
  for(let i=1;i<=500;i++)state=c.update(20+i/30,[source],target,[fragment(i+10)]);
  assert.equal(c.requestDissolution(37),true);
  state=c.update(40,[],target,[]);assert.equal(state.recycled,true);assert.deepEqual(state.masks,[]);
  assert.equal(c.update(40.1,[],target,[]).progress,0);
});
