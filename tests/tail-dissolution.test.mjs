import test from 'node:test';
import assert from 'node:assert/strict';
import {tailField,tailPoint,tailEmitter,paintDissolvingTail,tailColor} from '../dist/tail-dissolution.js';
import {createSwimmers,advanceSwimmers} from '../dist/swimming.js';
import {createBitStream} from '../dist/interface-bits.js';

test('organic erosion stays in the fin and changes smoothly in material space',()=>{
  for(let t=0;t<20;t+=.13)for(let v=0;v<=1;v+=.07){
    assert.equal(tailField(.32,v,t,3),0);
    assert.equal(tailField(.8,v,t,3),0);
    assert.ok(tailField(.05,v,t,3)>.08);
    assert.ok(Math.abs(tailField(.1,v,t+.033,3)-tailField(.1,v,t,3))<.025);
    assert.ok(Math.abs(tailField(.15,v+.001,t,3)-tailField(.15,v,t,3))<.04);
  }
});
test('emission ports remain on the moving fin through independent turns',()=>{
  const box={left:80,right:400,top:150,bottom:500,allowUnderpass:true},bounds={width:1440,height:900,left:440};
  const fish=createSwimmers(box,bounds),points=[{u:.04,v:.35},{u:.10,v:.6},{u:.17,v:.43},{u:.21,v:.57}];
  for(let frame=0;frame<1800;frame++){
    const t=frame/30;advanceSwimmers(fish,box,t,bounds);
    for(const f of fish){
      const emitter=tailEmitter(f,points,t);assert.equal(emitter.fishId,f.id);assert.ok(emitter.ports.length);
      for(const p of emitter.ports){const q=tailPoint(f,p.u,p.v);assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<1e-8);assert.ok(p.fragmentation>.18);}
    }
  }
});
test('tail code splits into falling rain and software, freezes, resets and stays bounded',()=>{
  const stream=createBitStream({autoCycle:false,tailCode:true}),target={left:900,top:180,width:420,height:500};
  let full=false,rain=false,majority=false,fall=false,previous=new Map(),state;
  for(let frame=0;frame<5400;frame++){
    const t=frame/30,heading=t<5?0:Math.PI;
    const ports=[{x:820+Math.sin(t)*20,y:300,u:.08,v:.4,heading,fragmentation:.7},{x:825,y:307,u:.13,v:.6,heading,fragmentation:.5}];
    state=stream.update(t,[{...ports[0],ports,speed:60,fishId:2}],target);
    assert.ok(state.particles.length<=1200);assert.ok(state.settled.length<=1620);
    const natural=state.particles.filter(p=>!p.slot);rain ||= natural.some(p=>p.phase==='rain');
    majority ||= natural.length>state.particles.length*.5&&natural.length>20;
    for(const p of state.particles){
      assert.ok(p.u<.3);assert.ok(p.text.length>0);
      if(p.age>1.5&&!p.slot&&p.vy>10)fall=true;
      const old=previous.get(p.id);if(old)assert.ok(Math.hypot(p.x-old.x,p.y-old.y)<7,'old trail must not rotate or teleport with a turning koi');
    }
    previous=new Map(state.particles.map(p=>[p.id,{x:p.x,y:p.y}]));
    if(state.phase==='software'){full=true;assert.ok(state.settled.every(p=>p.alpha===0));}
  }
  assert.ok(full&&rain&&majority&&fall);
  const frozen=structuredClone(stream.update(180,[],target));assert.deepEqual(stream.update(180,[],target),frozen);
  assert.deepEqual(stream.update(18,[],target,true).particles,[]);
  for(let frame=1;frame<=180;frame++)state=stream.update(180+frame/30,[],target);
  assert.equal(state.particles.length,0,'detached rain expires after emission stops');
  stream.reset();assert.equal(stream.update(0,[],target).progress,0);
});

test('fin pigment progressively releases while every body pixel keeps its original RGBA',()=>{
  const width=222,height=148,data=new Uint8ClampedArray(width*height*4).fill(220),original=data.slice();let result;
  const paint={canvas:{width,height},clearRect(){},drawImage(){},getImageData(){return {data};},putImageData(frame){result=frame.data;}};
  paintDissolvingTail(paint,{},9,2);
  let eroded=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    for(let channel=0;channel<3;channel++)assert.equal(result[i+channel],original[i+channel]);
    if(x/width>=.32)assert.equal(result[i+3],original[i+3]);
    else if(result[i+3]<original[i+3])eroded++;
  }
  assert.ok(eroded>5000);
  const levels=Array.from({length:300},(_,i)=>tailField(.03,.4,i/10,2));
  assert.ok(Math.min(...levels)>.8,'the terminal fin must never return to an intact silhouette');
  const breathing=Array.from({length:300},(_,i)=>tailField(.19,.4,i/10,2));
  assert.ok(Math.max(...breathing)-Math.min(...breathing)>.08,'the transition nearer the fin root keeps breathing');
});
test('released code carries fin colour toward cyan then a muted distant trace without a colour jump',()=>{
  const read=value=>value.match(/\d+/g).map(Number);
  let previous=read(tailColor(0,'rgb(180,95,55)',1));
  for(let i=1;i<=300;i++){
    const next=read(tailColor(i/100,'rgb(180,95,55)',1));
    assert.ok(next.every((v,j)=>Math.abs(v-previous[j])<=3));previous=next;
  }
  const near=read(tailColor(.7,'rgb(180,95,55)',1)),far=read(tailColor(3,'rgb(180,95,55)',1));
  assert.ok(Math.max(...far)-Math.min(...far)<Math.max(...near)-Math.min(...near));
});

test('birth renderer never paints an intact terminal fin, even while the body is forming',()=>{
  const width=50,height=30;
  function render(time){
    const data=new Uint8ClampedArray(width*height*4).fill(220);
    const paint={canvas:{width,height},clearRect(){},drawImage(){},getImageData(){return {data};},putImageData(){}};
    paintDissolvingTail(paint,{},time,2,true);return data;
  }
  const start=render(0),complete=render(11),later=render(16);
  for(let i=3;i<start.length;i+=4)assert.equal(start[i],0,'the koi cannot start as a finished image');
  assert.ok(complete[(15*width+2)*4+3]<60,'the terminal fin is already disintegrating as the body completes');
  const forming=render(8);
  assert.ok(forming[(15*width+2)*4+3]<60,'the forming fin never has an intact intermediate state');
  assert.ok(later[(15*width+2)*4+3]<60);
  for(let y=0;y<height;y++)for(let x=Math.ceil(width*.32);x<width;x++)assert.equal(later[(y*width+x)*4+3],220);
});

test('pigment caching reuses original pixels without accumulating erosion or retaining an incomplete body',()=>{
  const width=60,height=40,data=new Uint8ClampedArray(width*height*4).fill(220),image={};let draws=0,reads=0;
  const paint={canvas:{width,height},clearRect(){},drawImage(){draws++;},getImageData(){reads++;return {data};},putImageData(){}};
  paintDissolvingTail(paint,image,8,2,true);const first=data.slice();
  paintDissolvingTail(paint,image,8,2,true);assert.deepEqual(data,first);
  paintDissolvingTail(paint,image,18,2,true);
  for(let y=0;y<height;y++)for(let x=Math.ceil(width*.32);x<width;x++)assert.equal(data[(y*width+x)*4+3],220);
  assert.equal(draws,1);assert.equal(reads,1);
});
