import test from 'node:test';
import assert from 'node:assert/strict';
import {formationAt,materialAt} from '../dist/formation.js';
import {createSwimmers,advanceSwimmers,spinePoint} from '../dist/swimming.js';

test('every koi translates before any colour has materialised',()=>{
  const box={left:410,right:870,top:240,bottom:720},bounds={width:1280,height:960};
  const fish=createSwimmers(box,bounds),initial=fish.map(f=>spinePoint(f,0));
  assert.ok(formationAt(0).density>0,'a sparse moving school exists on frame zero');
  for(let frame=1;frame<=60;frame++)advanceSwimmers(fish,box,frame/30,bounds);
  fish.forEach((f,i)=>{
    const p=spinePoint(f,0),travel=Math.hypot(p.x-initial[i].x,p.y-initial[i].y);
    assert.ok(travel>60,`koi ${i} must translate visibly within two seconds; got ${travel}`);
    assert.equal(materialAt(2,.5,.5,f.seed),0,'movement precedes the painted body');
    assert.ok(f.path.length<600,'history is bounded');
  });
});

test('reconstruction restores the whole school and the formation timeline',()=>{
  const box={left:410,right:870,top:240,bottom:720},bounds={width:1280,height:960};
  const initial=createSwimmers(box,bounds),fish=createSwimmers(box,bounds);
  for(let frame=1;frame<=450;frame++)advanceSwimmers(fish,box,frame/30,bounds);
  const rebuilt=createSwimmers(box,bounds);
  assert.deepEqual(rebuilt,initial);assert.equal(formationAt(0).phase,0);assert.equal(formationAt(18).phase,4);
  assert.equal(materialAt(18,.1,.2,4),1);
});

test('ink front is continuous and cannot change the swimming state',()=>{
  for(let time=0;time<12;time+=.05){const a=materialAt(time,.4,.5,2),b=materialAt(time+.05,.4,.5,2);assert.ok(b>=a);assert.ok(b-a<.03);}
});
