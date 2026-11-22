import test from 'node:test';
import assert from 'node:assert/strict';
import {createFloaters,advanceFloaters} from '../dist/vegetation.js';
import {waterField} from '../dist/pond-water.js';
const definitions=[{x:500,y:120,r:52,seed:1},{x:620,y:180,r:30,seed:2},{x:760,y:100,r:35,seed:3,flower:true}];

test('floating plants respond independently and remain bounded for three minutes',()=>{
  const plants=createFloaters(definitions);
  for(let i=1;i<=5400;i++){
    advanceFloaters(plants,[],[],i/30,1/30,waterField);
    for(const f of plants){assert.ok(Math.hypot(f.dx,f.dy)<=(f.flower?5:9)+1e-6);assert.ok(Number.isFinite(f.tilt));}
  }
  assert.equal(new Set(plants.map(f=>`${f.dx.toFixed(2)},${f.dy.toFixed(2)}`)).size,3);
  const frozen=structuredClone(plants);advanceFloaters(plants,[],[],180,0,waterField);assert.deepEqual(plants,frozen);
});

test('a passing koi transfers a directional wake, then the plants return to equilibrium',()=>{
  const positive=createFloaters(definitions),negative=createFloaters(definitions),quiet=createFloaters(definitions);
  for(let i=1;i<=30;i++){
    const koi={x:505,y:128,length:140,speed:60};
    advanceFloaters(positive,[{...koi,heading:0}],[],i/30,1/30,()=>0);
    advanceFloaters(negative,[{...koi,heading:Math.PI}],[],i/30,1/30,()=>0);
    advanceFloaters(quiet,[{...koi,heading:0,speed:0}],[],i/30,1/30,()=>0);
  }
  assert.ok(positive[0].dx>0);assert.ok(negative[0].dx<0);assert.equal(quiet[0].dx,0);
  assert.ok(Math.hypot(positive[0].dx,positive[0].dy)>.5);
  for(let i=31;i<=900;i++)advanceFloaters(positive,[],[],i/30,1/30,()=>0);
  assert.ok(Math.hypot(positive[0].dx,positive[0].dy)<.001);
  assert.ok(Math.abs(positive[0].tilt)<.001);
  assert.deepEqual(createFloaters(definitions),createFloaters(definitions));
});

test('propagating pond ripples excite the same damped vegetation system',()=>{
  const plants=createFloaters([{x:50,y:0,r:30,seed:1}]);
  for(let i=1;i<=90;i++)advanceFloaters(plants,[],[{x:0,y:0,born:0,strength:1}],i/30,1/30,()=>0);
  assert.ok(plants[0].dx>.1);
});
