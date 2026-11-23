import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneBuildAt} from '../dist/scene-bits.js';

test('the message is readable immediately while the pond materializes progressively',()=>{
  assert.deepEqual(sceneBuildAt(0),{water:0,message:1,identity:0,bits:1});
  const midway=sceneBuildAt(6);
  assert.ok(midway.water>0&&midway.water<1);
  assert.equal(midway.message,1);
  assert.ok(midway.identity>0&&midway.identity<1);
  for(let t=0;t<12;t+=.1){
    const a=sceneBuildAt(t),b=sceneBuildAt(t+.1);
    assert.equal(a.message,1,'the message remains visible during formation and replay');
    for(const key of ['water','message','identity'])assert.ok(b[key]>=a[key]);
    assert.ok(b.bits<=a.bits);
  }
  assert.deepEqual(sceneBuildAt(12),{water:1,message:1,identity:1,bits:0});
});
test('reduced motion bypasses the entire binary build at every point in the timeline',()=>{
  for(const t of [0,2,6,12,100])assert.deepEqual(sceneBuildAt(t,true),{water:1,message:1,identity:1,bits:0});
});
