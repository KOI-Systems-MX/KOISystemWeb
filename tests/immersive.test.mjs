import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwimmers,advanceSwimmers,spinePoint,resizeSwimmers} from '../dist/swimming.js';

test('immersive koi keep their painted footprint in the pond across portrait and landscape sizes',()=>{
  for(const bounds of [{width:1440,height:900},{width:375,height:667},{width:844,height:390}]){
    const box={left:bounds.width/2-180,right:bounds.width/2+180,top:90,bottom:bounds.height-90,allowUnderpass:true};
    const fish=createSwimmers(box,bounds);let underpasses=0;
    for(let i=0;i<3600;i++){
      advanceSwimmers(fish,box,i/30,bounds);
      for(const f of fish){
        const center=spinePoint(f,0);
        if(center.x>box.left&&center.x<box.right&&center.y>box.top&&center.y<box.bottom)underpasses++;
        for(let k=0;k<=10;k++)for(const side of [-1,1]){
          const p=spinePoint(f,(k/10-.5)*f.length,side*f.length*.38);
          assert.ok(p.x>=0&&p.x<=bounds.width&&p.y>=0&&p.y<=bounds.height,'body and fin envelope stays inside the scene');
        }
      }
    }
    assert.ok(underpasses>0,'the paper occludes koi swimming beneath it');
    assert.ok(fish.every(f=>f.travel>f.length*20),'swimming continues after formation');
  }
});

test('viewport resizing preserves spine proportions, identity and the running timeline',()=>{
  const from={width:1440,height:900},to={width:390,height:844};
  const box={left:490,right:950,top:200,bottom:700,allowUnderpass:true},fish=createSwimmers(box,from);
  for(let i=1;i<=600;i++)advanceSwimmers(fish,box,i/30,from);
  const snapshots=fish.map(f=>structuredClone(f));
  resizeSwimmers(fish,from,to);
  fish.forEach((f,i)=>{
    const prior=snapshots[i],scale=f.length/prior.length;
    assert.equal(f.lastTime,20);assert.equal(f.wave,prior.wave);assert.equal(f.id,prior.id);
    for(let k=1;k<f.path.length;k++){
      const a=f.path[k],b=f.path[k-1],c=prior.path[k],d=prior.path[k-1];
      assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-d.x,c.y-d.y)*scale)<1e-8);
    }
  });
  resizeSwimmers(fish,to,from);
  fish.forEach((f,i)=>assert.ok(Math.abs(f.length-snapshots[i].length)<1e-8,'round trips do not progressively shrink koi'));
});
