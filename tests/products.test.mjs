import test from 'node:test';
import assert from 'node:assert/strict';
import {products,createProductDirector} from '../dist/products.js';
import {createBitStream} from '../dist/interface-bits.js';
const zone={left:100,right:300,top:100,bottom:300};
const outside=[{id:0,x:50,y:180,speed:60}],inside=[{id:0,x:160,y:180,speed:60},{id:1,x:240,y:190,speed:55}];

test('simultaneous koi entries queue only one transformation after a minimum readable dwell',()=>{
  const d=createProductDirector();d.observe(0,outside,zone,true);
  assert.equal(d.observe(2,inside,zone,true),false);
  assert.equal(d.observe(15,inside,zone,true),false);
  assert.equal(d.observe(16,inside,zone,true),true);
  assert.equal(d.observe(17,inside,zone,true),false);
  assert.equal(d.complete(24),1);assert.equal(d.complete(25),1);
  assert.equal(d.observe(25,inside,zone,true),false,'remaining inside is not another crossing');
});

test('successive guarded crossings cycle through four actual products and reset deterministically',()=>{
  const d=createProductDirector();let time=0;
  for(const index of [1,2,3,0]){
    d.observe(time,outside,zone,true);assert.equal(d.observe(time+1,inside,zone,true),false);
    assert.equal(d.observe(time+17,inside,zone,true),true);
    assert.equal(d.complete(time+25),index);time+=30;
  }
  assert.match(products[0].html,/pos-catalog/);assert.match(products[0].html,/pos-ticket/);
  assert.match(products[1].html,/ship-plan/);assert.match(products[1].html,/pick-list/);
  assert.match(products[2].html,/<table>/);assert.match(products[2].html,/transfer-strip/);
  assert.match(products[3].html,/finance-chart/);assert.match(products[3].html,/approval-list/);
  d.reset();assert.equal(d.index,0);
});

test('activation cooldown prevents a second transition even with an immediate new crossing',()=>{
  const d=createProductDirector({minimumDwell:0,cooldown:8});
  d.observe(0,outside,zone,true);assert.equal(d.observe(1,inside,zone,true),true);d.complete(2);
  d.observe(3,outside,zone,true);assert.equal(d.observe(4,inside,zone,true),false);
  assert.equal(d.observe(9,inside,zone,true),false);assert.equal(d.observe(10,inside,zone,true),true);
});

test('controlled code assembly holds indefinitely without a koi-triggered transition request',()=>{
  const stream=createBitStream({autoCycle:false}),target={left:900,top:200,width:420,height:500};let state;
  const source=[{x:1000,y:350,speed:60,heading:.2}];
  for(let i=0;i<=2700;i++)state=stream.update(i/30,source,target);
  assert.equal(state.phase,'software');assert.equal(state.progress,1);
  assert.equal(stream.requestDissolution(90),true);assert.equal(stream.requestDissolution(90),false);
  let cycles=0;
  for(let i=2701;i<3100;i++){state=stream.update(i/30,source,target);if(state.recycled)cycles++;}
  assert.equal(cycles,1);
});
