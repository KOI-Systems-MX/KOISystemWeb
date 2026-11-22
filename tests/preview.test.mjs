import test from 'node:test';
import assert from 'node:assert/strict';
import {parseByteRange,contentTypes} from '../preview.mjs';
test('local preview serves original video MIME and valid seek/replay byte ranges',()=>{
  assert.equal(contentTypes['.mp4'],'video/mp4');
  assert.deepEqual(parseByteRange('bytes=0-1023',8681672),{start:0,end:1023});
  assert.deepEqual(parseByteRange('bytes=4000-',8681672),{start:4000,end:8681671});
  assert.deepEqual(parseByteRange('bytes=-512',8681672),{start:8681160,end:8681671});
  assert.equal(parseByteRange('bytes=9000000-',8681672),false);
  assert.equal(parseByteRange('bytes=-0',8681672),false);
  assert.equal(parseByteRange('bytes=200-100',8681672),false);
  assert.equal(parseByteRange(undefined,8681672),null);
});
