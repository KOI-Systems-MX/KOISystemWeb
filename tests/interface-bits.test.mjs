import test from 'node:test';
import assert from 'node:assert/strict';
import {createBitStream} from '../dist/interface-bits.js';
const target={left:980,top:280,width:250,height:250};

test('code trails build a complete interface, stay bounded and reset',()=>{
  const stream=createBitStream();let state;
  for(let frame=0;frame<900;frame++){
    state=stream.update(frame/30,[{x:1050,y:350}],target);
    assert.ok(state.particles.length<=1200);
    state.particles.forEach(p=>{assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.match(p.text,/^[01]$/);});
  }
  assert.equal(state.progress,1);
  stream.reset();assert.equal(stream.update(0,[],target).progress,0);
  assert.equal(stream.update(18,[],target,true).progress,1);
});

test('software holds for contemplation, dissolves gradually and releases its settled bits without unbounded growth',()=>{
  const stream=createBitStream(),phases=new Set();let firstFull=null,firstDissolve=null;
  for(let i=0;i<3600;i++){
    const t=i/30,s=stream.update(t,[{x:1050,y:350,heading:.5,speed:60}],target);phases.add(s.phase);
    assert.ok(s.particles.length<=1200);assert.ok(s.settled.length<=1620);
    if(s.phase==='software'&&firstFull===null)firstFull=t;
    if(s.phase==='dissolution'&&firstDissolve===null){firstDissolve=t;assert.ok(s.settled.every(p=>p.id!==undefined));}
    assert.ok(s.components.every(n=>n>=0&&n<=1));
  }
  assert.ok(firstDissolve-firstFull>=18);assert.ok(phases.has('dissolution'));
});

test('no trail can assemble the interface without a passing koi',()=>{
  const stream=createBitStream();let state;
  for(let frame=0;frame<900;frame++)state=stream.update(frame/30,[],target);
  assert.equal(state.progress,0);assert.equal(state.particles.length,0);
});

test('code fragments retain identity and tail origins through emission, attraction and component organization',()=>{
  const stream=createBitStream({autoCycle:false}),seen=new Set(),last=new Map(),phases=new Set();let state;
  for(let i=0;i<=1200;i++){
    const source={x:820+Math.sin(i/200)*40,y:360,heading:.2,speed:60,fishId:7};
    state=stream.update(i/30,[source],target);phases.add(state.phase);
    for(const p of state.particles){
      assert.equal(p.fishId,7);
      if(!seen.has(p.id)){assert.equal(p.sx,source.x);assert.equal(p.sy,source.y);seen.add(p.id);}
      if(last.has(p.id)){const old=last.get(p.id);assert.ok(Math.hypot(p.x-old.x,p.y-old.y)<7,'no teleporting into a UI slot');assert.equal(p.text,old.text);}
      last.set(p.id,p);
    }
  }
  assert.equal(state.progress,1);assert.ok(state.components.every(n=>n===1));
  for(const name of ['emission','attraction','organization','materialization','software'])assert.ok(phases.has(name),name);
  const stopped=stream.update(40,[],target);assert.deepEqual(stream.update(40,[],target),stopped);
  stream.update(18,[],target,true);assert.deepEqual(stream.update(40,[],target),stopped,'static preview preserves the live sequence');
});
