import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const context={window:{},Image:class{set src(value){this.onload();}}};vm.runInNewContext(fs.readFileSync('saved-work-viewer.js','utf8'),context);
test('previously saved profiles and paint load without changing saved data or the active wheel',async()=>{
 const item={id:'old',shape:{h:12},full2:{radii:[3,6,4],inner:[0,5,3],floor:1},c:[120,160,190],communityVisual:{overlay:'data:image/png;base64,AA',finish:'matte'},bottomPaint:'data:image/png;base64,BB'},snapshot=JSON.stringify(item);
 const d=await context.window.TodakSavedWorkData(item);assert.equal(d.rAt(.5),6);assert.equal(d.innerAt(.5),5);assert.equal(d.height,12);assert.equal(d.floor,1);assert.equal(d.finish,'matte');assert(d.overlay);assert(d.bottomOverlay);assert.equal(JSON.stringify(item),snapshot);
});
test('legacy shape-only records also open; missing geometry reports a photo fallback',async()=>{
 const d=await context.window.TodakSavedWorkData({id:'legacy',shape:{h:8,r:[2,3,4]}});assert.equal(d.rAt(1),4);assert.equal(d.innerAt(.5),2.5);await assert.rejects(context.window.TodakSavedWorkData({id:'photo',thumb:'photo.png'}),/missing_geometry/);
});
