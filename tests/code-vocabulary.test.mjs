import test from 'node:test';
import assert from 'node:assert/strict';
import {createBitStream} from '../dist/interface-bits.js';
import {codeVocabulary,fragmentOverlaps} from '../dist/code-vocabulary.js';
test('all four products form from stable individual binary particles',()=>{
  for(const product of Object.keys(codeVocabulary)){
    const stream=createBitStream({autoCycle:false,product}),seen=new Set();let state;
    for(let frame=0;frame<1000;frame++){
      state=stream.update(frame/30,[{x:950,y:350,heading:.2,speed:60,fishId:2}],{left:900,top:180,width:420,height:500});
      assert.ok(state.particles.length<=1200);
      for(const p of [...state.particles,...state.settled]){
        assert.equal(p.product,product);assert.match(p.text,/^[01]$/);seen.add(p.text);
        assert.ok(Number.isFinite(p.rotation));
      }
    }
    assert.equal(seen.size,2);assert.equal(state.progress,1);assert.ok(state.settled.every(p=>p.alpha===0),'consumed bits are invisible on the completed UI');
  }
});
test('the cleanup guard considers complete rotated words, including words centered outside the UI',()=>{
  const ui={left:900,top:200,width:420,height:500};
  assert.equal(fragmentOverlaps({text:'calculateTotal()',x:880,y:300,rotation:.15},11.5,ui),true);
  assert.equal(fragmentOverlaps({text:'calculateTotal()',x:700,y:300,rotation:.15},11.5,ui),false);
  assert.equal(fragmentOverlaps({text:'renderDashboard()',x:1000,y:185,rotation:.2},11.5,ui),true);
});
