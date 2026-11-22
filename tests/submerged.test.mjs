import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwimmers,advanceSwimmers,spinePoint,resizeSwimmers} from '../dist/swimming.js';

test('the submerged surface has a clear swimming margin on desktop and landscape screens',()=>{
  for(const bounds of [{width:1440,height:900,left:658},{width:1280,height:720,left:600},{width:844,height:390,left:456}]){
    const box={left:84,right:bounds.left-24,top:110,bottom:bounds.height-110,allowUnderpass:true};
    const fish=createSwimmers(box,bounds);
    for(let i=0;i<3600;i++){
      advanceSwimmers(fish,box,i/30,bounds);
      for(const f of fish)for(let k=0;k<=12;k++)for(const side of [-1,1]){
        const p=spinePoint(f,(k/12-.5)*f.length,side*f.length*.38);
        assert.ok(p.x>box.right,'koi and fins never overlap the reading surface');
        assert.ok(p.x>=0&&p.x<=bounds.width&&p.y>=0&&p.y<=bounds.height,'the school stays inside the visible pond');
      }
    }
    assert.ok(fish.every(f=>f.travel>f.length*20),'the scene never stops after formation');
    const oldTime=fish[0].lastTime;
    const phone={width:390,height:844,left:0};
    resizeSwimmers(fish,bounds,phone);resizeSwimmers(fish,phone,bounds);
    assert.equal(fish[0].lastTime,oldTime,'resizing does not restart formation or locomotion');
  }
});
