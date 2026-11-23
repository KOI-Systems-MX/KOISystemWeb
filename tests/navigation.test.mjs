import test from 'node:test';
import assert from 'node:assert/strict';
import {sectionAtReadingLine} from '../dist/navigation.js';

test('a small incoming section does not take over before the reading line reaches it',()=>{
  const sections=[{id:'nosotros',top:-300,bottom:230},{id:'solucion',top:230,bottom:1200}];
  assert.equal(sectionAtReadingLine(sections,900,96),'nosotros');
  assert.equal(sectionAtReadingLine(sections.map(s=>({...s,top:s.top-50,bottom:s.bottom-50})),900,96),'solucion');
});
test('desktop and mobile header offsets select the section at the actual reading position',()=>{
  const sections=[{id:'nosotros',top:-400,bottom:185},{id:'solucion',top:185,bottom:1000}];
  assert.equal(sectionAtReadingLine(sections,900,96),'solucion');
  assert.equal(sectionAtReadingLine(sections,844,76),'nosotros');
});
test('the hero, gaps and unlinked sections never leave an unrelated menu item selected',()=>{
  assert.equal(sectionAtReadingLine([{id:'inicio',top:0,bottom:800}],900,96),'inicio');
  assert.equal(sectionAtReadingLine([{id:'',top:0,bottom:800}],900,96),null);
  assert.equal(sectionAtReadingLine([{id:'nosotros',top:260,bottom:1000}],900,96),null);
  assert.equal(sectionAtReadingLine([{id:'demo',top:0,bottom:800}],900,96),'demo');
});
