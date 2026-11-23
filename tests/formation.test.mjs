import test from 'node:test';
import assert from 'node:assert/strict';
import {formationAt,materialAt,koiBirthAt} from '../dist/formation.js';
import {createSwimmers,advanceSwimmers,spinePoint} from '../dist/swimming.js';

test('code follows a living spine from the start and motion grows without waiting for pigment',()=>{
  const box={left:410,right:870,top:240,bottom:720},bounds={width:1280,height:960};
  const fish=createSwimmers(box,bounds),initial=fish.map(f=>spinePoint(f,0));
  assert.ok(koiBirthAt(0).density>0,'sparse code exists on frame zero');
  for(let frame=1;frame<=60;frame++){
    const time=frame/30;
    advanceSwimmers(fish,box,time,bounds,f=>koiBirthAt(time,f.seed).motion);
  }
  fish.forEach((f,i)=>{
    const p=spinePoint(f,0),travel=Math.hypot(p.x-initial[i].x,p.y-initial[i].y);
    assert.ok(travel>20,'the code silhouette must move visibly before pigment appears');
    assert.equal(materialAt(2,.5,.5,f.seed),0,'no painted body appears during code gathering');
    const birth=koiBirthAt(12,f.seed);assert.ok(birth.swimming);
    for(let u=0;u<=1;u+=.1)for(let v=0;v<=1;v+=.1)assert.equal(materialAt(birth.swimAt,u,v,f.seed),1);
    assert.equal(koiBirthAt(0,f.seed).tail,1,'tail code exists from the first formation frame');
    assert.equal(koiBirthAt(birth.swimAt,f.seed).tail,1,'completion cannot activate a separate tail effect');
    assert.equal(koiBirthAt(birth.swimAt+4,f.seed).tail,1);
    assert.ok(f.path.length<600,'history is bounded');
  });
  for(let time=0;time<14;time+=.05){
    const a=koiBirthAt(time,2),b=koiBirthAt(time+.05,2);
    assert.ok(a.motion>=.3&&a.motion<=1);assert.ok(b.motion>=a.motion&&b.motion-a.motion<.01);
  }
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
