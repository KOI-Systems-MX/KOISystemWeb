import test from 'node:test';
import assert from 'node:assert/strict';
import {attachFilmEnding} from '../dist/film-ending.js';
class Events{
  listeners=new Map();attributes={};
  addEventListener(k,fn){if(!this.listeners.has(k))this.listeners.set(k,new Set());this.listeners.get(k).add(fn);}
  removeEventListener(k,fn){this.listeners.get(k)?.delete(fn);}
  setAttribute(k,v){this.attributes[k]=v;}
  async fire(k){await Promise.all([...this.listeners.get(k)||[]].map(fn=>fn()));}
}
function setup(reduced=false){
  const video=new Events(),ending=new Events(),play=new Events(),replay=new Events(),preference=new Events();
  Object.assign(video,{ended:false,currentTime:0,loop:true,plays:0,paused:true,async play(){this.plays++;this.paused=false;this.ended=false;await this.fire('play');},pause(){this.paused=true;this.fire('pause');}});
  preference.matches=reduced;
  const root={dataset:{},parentElement:{querySelector:()=>play},querySelector:s=>({'video':video,'.film-ending':ending,'.film-replay':replay})[s]};
  const controller=attachFilmEnding(root,preference);return {root,video,ending,play,replay,preference,controller};
}
test('cinematic logo appears only at the real end, persists, and resets on every replay',async()=>{
  const h=setup();assert.equal(h.root.dataset.state,'idle');assert.equal(h.ending.inert,true);assert.equal(h.video.loop,false);
  await h.play.fire('click');assert.equal(h.root.dataset.state,'playing');
  h.video.currentTime=8;await h.video.fire('ended');assert.equal(h.ending.inert,true,'a premature event cannot show the logo');
  for(let cycle=0;cycle<2;cycle++){
    h.video.currentTime=16.67;h.video.ended=true;await h.video.fire('ended');
    assert.equal(h.root.dataset.state,'ended');assert.equal(h.ending.inert,false);assert.equal(h.video.currentTime,16.67);
    await h.replay.fire('click');assert.equal(h.video.currentTime,0);assert.equal(h.ending.inert,true);assert.equal(h.root.dataset.state,'playing');
  }
  h.controller.dispose();assert.equal(h.video.listeners.get('ended').size,0);
});
test('reduced motion starts with the static official identity and allows manual video playback',async()=>{
  const h=setup(true);assert.equal(h.root.dataset.state,'reduced');assert.equal(h.video.plays,0);assert.equal(h.ending.inert,false);
  await h.replay.fire('click');assert.equal(h.video.plays,1);assert.equal(h.ending.inert,true);
  await h.preference.fire('change');assert.equal(h.root.dataset.state,'reduced');assert.equal(h.video.paused,true);
});
