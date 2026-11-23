import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwimmers,advanceSwimmers,anatomyPoint,fillAnatomyMesh} from '../dist/swimming.js';
import {tailPoint} from '../dist/tail-dissolution.js';
import {createLocalTailScene} from '../dist/local-tail-scene.js';
const bounds={width:1440,height:900,left:0},box={left:80,right:570,top:180,bottom:650,allowUnderpass:true};

test('mesh, emerging code and fin emission share the same articulated material coordinates',()=>{
  const fish=createSwimmers(box,bounds),mesh=new Float32Array(33*7*2);
  for(let frame=0;frame<900;frame++){
    advanceSwimmers(fish,box,frame/30,bounds);
    if(frame%30)continue;
    for(const f of fish){
      assert.equal(fillAnatomyMesh(f,32,6,mesh),mesh,'the existing vertex buffer is reused');
      for(let col=0;col<=32;col++)for(let row=0;row<=6;row++){
        const point=anatomyPoint(f,col/32,row/6),i=(col*7+row)*2;
        assert.ok(Math.hypot(point.x-mesh[i],point.y-mesh[i+1])<.0001);
        if(col<10)assert.deepEqual(tailPoint(f,col/32,row/6),point);
      }
    }
  }
});
test('pectoral fins have independent phases without displacing the central torso',()=>{
  const f=createSwimmers(box,bounds)[0],center=anatomyPoint(f,.73,.5),left=anatomyPoint(f,.73,.1),right=anatomyPoint(f,.73,.9);
  f.finPhase+=.6;
  assert.deepEqual(anatomyPoint(f,.73,.5),center);
  const l=anatomyPoint(f,.73,.1),r=anatomyPoint(f,.73,.9);
  const dl=Math.hypot(l.x-left.x,l.y-left.y),dr=Math.hypot(r.x-right.x,r.y-right.y);
  assert.ok(dl>.05&&dr>.05);assert.ok(Math.abs(dl-dr)>.01);
});
test('tail wake rotates with the swimming trajectory instead of falling along a fixed screen axis',()=>{
  const a=createLocalTailScene(),b=createLocalTailScene(),target={left:1100,top:150,width:300,height:500};
  let seen=0;
  for(let frame=0;frame<240;frame++){
    const t=frame/30,x=400+Math.sin(t*.5)*50,y=400+Math.cos(t*.5)*50,heading=t*.5;
    const source={fishId:0,x,y,length:160,speed:30,ports:[{x,y,heading,u:.06,v:.4}]};
    const rotated={...source,x:800-y,y:x,ports:[{...source.ports[0],x:800-y,y:x,heading:heading+Math.PI/2}]};
    const s=a.update(t,[source],target),other=b.update(t,[rotated],target);
    assert.equal(s.particles.length,other.particles.length);
    for(let i=0;i<s.particles.length;i++){
      const p=s.particles[i],q=other.particles[i];seen++;
      assert.equal(p.phase,'wake');assert.ok(Math.hypot(q.x-(800-p.y),q.y-p.x)<1e-7);
      assert.ok(p.age<1.3);
    }
  }
  assert.ok(seen>100);
});
