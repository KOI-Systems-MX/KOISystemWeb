import test from 'node:test';
import assert from 'node:assert/strict';
import {createHydrodynamics,rippleAt,HYDRO_DEFAULTS,koiPersonality} from '../dist/hydrodynamics.js';
import {createSwimmers,advanceSwimmers,spinePoint} from '../dist/swimming.js';
const bounds={width:1440,height:900},box={left:80,right:550,top:150,bottom:650,allowUnderpass:true};
const fish=(id,x,y)=>({id,seed:id+.7,x,y,angle:0,length:160,speed:56,cruise:56,personality:{curiosity:.9,sensitivity:1,perception:360,reactionDelay:.08,recovery:3}});
function tap(h,x,y,t=0,type='mouse'){h.down(x,y,t,{pointerType:type});return h.up(x,y,t+.08,t+.08,{bounds});}
function shock(h,x,y,t=0){h.move(x-200,y,t,t,{bounds});return h.move(x,y,t+.02,t+.02,{bounds});}

test('stationary contact makes expanding concentric ripples and only nearby koi become curious',()=>{
  const h=createHydrodynamics(),near=fish(0,500,400),far=fish(1,1300,700),e=tap(h,660,400);
  assert.equal(e.kind,'tap');assert.equal(rippleAt(e,.2).ratio,1);
  assert.ok(rippleAt(e,1).radius>rippleAt(e,.2).radius);assert.ok(rippleAt(e,1).fade<rippleAt(e,.2).fade);
  h.update([near,far],1.1,.1,bounds);
  assert.equal(near.response.state,'CURIOUS');assert.equal(far.response.state,'WANDERING');
  assert.ok(near.response.x>0&&Math.abs(near.response.y)>0,'approach includes tangential exploration');
  assert.ok(near.response.speedScale<1);
  near.x=620;h.update([near,far],1.2,.1,bounds);assert.equal(near.response.state,'INSPECTING');
});
test('fast pointer movement alone startles nearby koi, overrides curiosity and then recovers',()=>{
  const h=createHydrodynamics(),near=fish(0,500,400),far=fish(1,1300,700);
  tap(h,580,400);h.update([near,far],.7,.1,bounds);assert.equal(near.response.state,'INSPECTING');
  assert.equal(shock(h,470,400,1).kind,'shock');
  h.update([near,far],1.3,.1,bounds);assert.equal(near.response.state,'STARTLED');
  h.update([near,far],1.7,.1,bounds);assert.equal(near.response.state,'FLEEING');
  assert.ok(near.response.x>0&&near.response.speedScale>1&&near.response.effort>0);
  assert.equal(far.response.state,'WANDERING');
  h.update([near,far],4,.1,bounds);assert.equal(near.response.state,'RECOVERING');
  h.update([near,far],8,.1,bounds);assert.equal(near.response.state,'WANDERING');
});
test('jitter, touch scroll, blocked controls and isolated stale cursor samples cannot startle koi',()=>{
  const h=createHydrodynamics();
  for(let i=0;i<100;i++)h.move(500+Math.sin(i)*2,400,i*.016,i*.016,{bounds});
  assert.equal(h.ripples.length,0);
  h.reset();h.down(100,100,0,{pointerType:'touch'});h.move(450,600,.02,.02,{pointerType:'touch',bounds});
  assert.equal(h.up(450,600,.04,.04,{bounds}),null);assert.equal(h.ripples.length,0);
  tap(h,300,300,1,'touch');assert.equal(h.ripples.length,1);
  h.reset();h.down(100,100,0,{blocked:true});assert.equal(h.up(100,100,.1,.1,{bounds}),null);
  h.move(100,100,0,0,{bounds});h.move(1000,500,2,2,{bounds});assert.equal(h.ripples.length,0);
});
test('spatial sampling, hysteresis and cooldown bound disturbances and personality is reproducible',()=>{
  const h=createHydrodynamics();
  for(let i=0;i<1000;i++)h.move(300+(i%20)*25,400,i*.01,i*.01,{bounds});
  assert.ok(h.ripples.length<=HYDRO_DEFAULTS.maxDisturbances);
  assert.ok(h.ripples.every((e,i,a)=>i===0||e.born-a[i-1].born>=HYDRO_DEFAULTS.shockCooldown));
  assert.deepEqual(koiPersonality(fish(0,0,0)),koiPersonality(fish(0,0,0)));
  assert.notDeepEqual(koiPersonality(fish(0,0,0)),koiPersonality(fish(1,0,0)));
});
test('reactive movement uses bounded steering, accelerates the articulated body and stays in the pond',()=>{
  const h=createHydrodynamics(),school=createSwimmers(box,bounds),f=school[0],cruise=f.cruise;
  shock(h,f.x-50,f.y);let peak=cruise,maxWave=1,prior=school.map(k=>({x:k.x,y:k.y}));
  for(let frame=1;frame<=360;frame++){
    const t=frame/30;h.update(school,t,1/30,bounds);advanceSwimmers(school,box,t,bounds);
    peak=Math.max(peak,f.speed);maxWave=Math.max(maxWave,f.waveAmplitude);
    school.forEach((k,i)=>{
      assert.ok(Math.hypot(k.x-prior[i].x,k.y-prior[i].y)<6,'reaction cannot teleport a head');
      assert.ok(k.speed<=k.cruise*k.hydroPersonality.maxFlee+.001,'reaction respects each koi maximum speed');
      const p=spinePoint(k,0);assert.ok(p.x>0&&p.x<bounds.width&&p.y>0&&p.y<bounds.height);
    });prior=school.map(k=>({x:k.x,y:k.y}));
  }
  assert.ok(peak>cruise*1.05);assert.ok(maxWave>1.01);
  assert.equal(f.response.state,'WANDERING');
});

test('resize keeps live perturbations and curiosity anchors aligned, and reduced mode can clear responses',()=>{
  const h=createHydrodynamics(),near=fish(0,500,400);tap(h,660,400);h.update([near],1.1,.1,bounds);
  const before={...h.ripples[0]},target={...near.response.target};
  h.resize(bounds,{width:390,height:844},[near]);
  assert.equal(h.ripples[0].x,before.x*390/1440);assert.equal(h.ripples[0].born,before.born);
  assert.equal(near.response.target.x,target.x*390/1440);assert.equal(h.pointer,null);
  h.reset([near]);assert.equal(h.ripples.length,0);assert.equal(near.response,null);assert.equal(near.waveAmplitude,1);
});
