import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {decodePNG,cropPNG} from '../tools/brand-assets.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('official symbol and wordmark retain original RGBA geometry, color and transparency',()=>{
  const bytes=fs.readFileSync(new URL('../dist/assets/logo-koi-systems.png',import.meta.url));
  const source=decodePNG(bytes),manifest=JSON.parse(fs.readFileSync(new URL('../dist/assets/brand/provenance.json',import.meta.url)));
  assert.equal(sha(bytes),'fdca454f30bb797409f39a8fb8663172e680d1217e5b4aaa75b995def0093a56');
  assert.equal(manifest.sourceSHA256,sha(bytes));assert.equal(source.rgba[3],0,'the presentation background is transparent');
  for(const asset of Object.values(manifest.assets)){
    const crop=cropPNG(source,asset.rect),output=decodePNG(fs.readFileSync(new URL(`../dist/assets/brand/${asset.file}`,import.meta.url)));
    assert.equal(output.width,asset.rect.width);assert.equal(output.height,asset.rect.height);
    assert.ok(output.rgba.equals(crop.rgba),'no repainting, resampling, recoloring or internal alpha mask');
    assert.equal(sha(output.rgba),asset.rgbaSHA256);
    assert.deepEqual(output.profiles,source.profiles);
  }
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(source.rgba[(y*source.width+x)*4+3]>=4){
    const r=y<manifest.split?manifest.symbol:manifest.wordmark;
    assert.ok(x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height,'every source sample with alpha >= 4 is retained');
  }
});
test('source delivery excludes video and shows static identity without broken media requests',()=>{
  assert.equal(fs.existsSync(new URL('../dist/assets/media/koi-nosotros-original.mp4',import.meta.url)),false);
  assert.equal(fs.existsSync(new URL('../dist/assets/media/provenance.json',import.meta.url)),false);
  const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.equal(html.includes('<video'),false);assert.equal(html.includes('assets/media/'),false);
  assert.ok(html.includes('class="film-frame" data-state="reduced"'));
});
