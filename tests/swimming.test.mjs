import test from 'node:test';
import assert from 'node:assert/strict';
import { createSwimmers, advanceSwimmers, spinePoint } from '../dist/swimming.js';

test('painted bodies stay outside desktop and mobile panels through three minutes of swimming', () => {
  for (const box of [
    {left:370,top:160,right:910,bottom:640},
    {left:362,top:120,right:918,bottom:620},
    {left:390,top:200,right:890,bottom:600},
  ]) {
    const fish = createSwimmers(box);
    let previous = fish.map(f => spinePoint(f,0));
    for(let frame=0;frame<5400;frame++) {
      advanceSwimmers(fish,box,frame/30);
      fish.forEach((f,index) => {
        const head=spinePoint(f,0);
        assert.ok(Number.isFinite(head.x) && Number.isFinite(head.y));
        assert.ok(Math.hypot(head.x-previous[index].x,head.y-previous[index].y)<3,'no teleporting between frames');
        previous[index]=head;
        // Conservative footprint includes the transparent fin margins and the tail wave.
        for(let section=0;section<=10;section++)for(const side of [-1,0,1]) {
          const p=spinePoint(f,(section/10-.5)*f.length,side*(f.length/3+14));
          assert.ok(p.x<=box.left || p.x>=box.right || p.y<=box.top || p.y>=box.bottom,'fish intersects the panel');
        }
      });
    }
    assert.equal(new Set(fish.map(f=>f.direction)).size,2);
    assert.ok(Math.max(...fish.map(f=>f.speed))-Math.min(...fish.map(f=>f.speed))>4,'independent speeds remain varied');
    assert.equal(new Set(fish.map(f=>f.direction)).size,2);
  }
});

test('pause and layout changes keep positions finite without accumulating a time jump', () => {
  const box={left:370,top:160,right:910,bottom:640}, fish=createSwimmers(box);
  advanceSwimmers(fish,box,0);advanceSwimmers(fish,box,1/60);
  const positions=fish.map(f=>spinePoint(f,0));
  advanceSwimmers(fish,box,1/60);
  assert.deepEqual(fish.map(f=>spinePoint(f,0)),positions);
  const resized={left:420,top:220,right:860,bottom:580};
  advanceSwimmers(fish,resized,2/60);
  fish.forEach(f=>assert.ok(Number.isFinite(spinePoint(f,0).heading)));
});
