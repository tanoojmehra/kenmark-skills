'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fork}=require('node:child_process'),c=require('./brain-contract');
function fixture(kind='issues',last=0,next=last+1){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'brain-contract-')),dir=path.join(root,'brain',kind);
 fs.mkdirSync(path.join(dir,'completed'),{recursive:true});
 fs.writeFileSync(path.join(dir,'INDEX.md'),'# Tracker\n\n| Field | Value |\n| --- | --- |\n| Last Assigned ID | '+String(last).padStart(3,'0')+' |\n| Next ID | '+String(next).padStart(3,'0')+' |\n\n## Active\n| ID | Title | Status |\n| --- | --- | --- |\n');
 return {root,dir,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
for(const [last,next] of [[8,9],[98,99],[99,100],[998,999],[999,1000],[3752,3753],[9999,10000]]){
 test('numeric ID transition '+last+' -> '+next,()=>{
  const f=fixture('issues',last,last+1);try{
   assert.equal(c.audit(f.root,'issues').nextId,next);
   assert.equal(c.reserve(f.root,'issues').displayId,String(next).padStart(3,'0'));
   assert.equal(c.audit(f.root,'issues').nextId,next+1);
  }finally{f.cleanup();}
 });
}
test('complete filename prefixes and malformed names',()=>{
 assert.equal(c.parseName('3752-example.md').id,3752);
 assert.equal(c.parseName('10000-example.md').id,10000);
 for(const bad of ['00-test.md','000-test.md','1-test.md','42-test.md','3752-foo_bar.md','3752-.md','3752-bad--slug.md','3752-foo.txt'])
  assert.equal(c.parseName(bad),null,bad);
});
test('ledger parses ID tables but not unrelated title numerals',()=>{
 const f=fixture();try{
  fs.appendFileSync(path.join(f.dir,'INDEX.md'),'| 042 | Fix 9999 bugs in 2026 | open |\n');
  assert.deepEqual(c.audit(f.root,'issues').index.indexIds,[42]);
  assert.equal(c.audit(f.root,'issues').nextId,43);
 }finally{f.cleanup();}
});
test('two-column ID tables reserve historical rows',()=>{
 const f=fixture();try{
  fs.appendFileSync(path.join(f.dir,'INDEX.md'),'\n## Completed\n| ID | Title |\n| --- | --- |\n| 3752 | About 10000 tests |\n');
  assert.deepEqual(c.audit(f.root,'issues').absentFiles,[3752]);
  assert.equal(c.audit(f.root,'issues').nextId,3753);
 }finally{f.cleanup();}
});
test('files missing from INDEX reserve high ID',()=>{
 const f=fixture();try{
  fs.writeFileSync(path.join(f.dir,'completed','3752-existing.md'),'# Historical');
  const a=c.audit(f.root,'issues');assert.deepEqual(a.missingFromIndex,[3752]);assert.equal(a.nextId,3753);
 }finally{f.cleanup();}
});
test('INDEX entries without files still reserve IDs',()=>{
 const f=fixture();try{
  fs.appendFileSync(path.join(f.dir,'INDEX.md'),'| 009 | Gone but reserved | done |\n');
  assert.deepEqual(c.audit(f.root,'issues').absentFiles,[9]);assert.equal(c.audit(f.root,'issues').nextId,10);
 }finally{f.cleanup();}
});
test('legacy duplicate IDs preserved in active and completed',()=>{
 const f=fixture();try{
  fs.writeFileSync(path.join(f.dir,'001-first.md'),'first');fs.writeFileSync(path.join(f.dir,'completed','001-second.md'),'second');
  const a=c.audit(f.root,'issues');assert.equal(a.duplicates.length,1);assert.equal(a.duplicates[0].paths.length,2);
  assert.equal(fs.readFileSync(path.join(f.dir,'001-first.md'),'utf8'),'first');
  assert.equal(fs.readFileSync(path.join(f.dir,'completed','001-second.md'),'utf8'),'second');
 }finally{f.cleanup();}
});
test('missing and corrupted ledger fail closed',()=>{
 const f=fixture();try{
  fs.unlinkSync(path.join(f.dir,'INDEX.md'));assert.throws(()=>c.reserve(f.root,'issues'),/Missing or invalid ledger/);
  fs.writeFileSync(path.join(f.dir,'INDEX.md'),'| Last Assigned ID | garbage |\n| Next ID | -1 |\n');
  assert.throws(()=>c.reserve(f.root,'issues'),/Missing or invalid ledger/);
 }finally{f.cleanup();}
});
test('malformed filenames are reported and block allocation',()=>{
 const f=fixture();try{fs.writeFileSync(path.join(f.dir,'10000-Wrong_NAME.md'),'bad');
  assert.equal(c.audit(f.root,'issues').malformed.length,1);assert.throws(()=>c.reserve(f.root,'issues'),/Malformed/);
 }finally{f.cleanup();}
});
test('concurrent allocations receive unique IDs',async()=>{
 const f=fixture('plans',999,1000);try{
  const run=()=>new Promise((resolve,reject)=>{
   const p=fork(path.join(__dirname,'brain-tracker.js'),['reserve','plans',f.root],{silent:true});let out='',err='';
   p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);
   p.on('exit',code=>code===0?resolve(JSON.parse(out).id):reject(Error(err)));
  });
  const ids=await Promise.all(Array.from({length:12},run));
  assert.equal(new Set(ids).size,12);assert.equal(Math.min(...ids),1000);assert.equal(Math.max(...ids),1011);
  assert.equal(c.audit(f.root,'plans').nextId,1012);
 }finally{f.cleanup();}
});
test('read-only audit leaves user authored bytes intact',()=>{
 const f=fixture();try{
  const doc=path.join(f.dir,'001-legacy.md');fs.writeFileSync(doc,'CUSTOM LEGACY\n');
  const before=fs.readFileSync(doc),index=fs.readFileSync(path.join(f.dir,'INDEX.md'));
  c.audit(f.root,'issues');c.audit(f.root,'issues');
  assert.deepEqual(fs.readFileSync(doc),before);assert.deepEqual(fs.readFileSync(path.join(f.dir,'INDEX.md')),index);
 }finally{f.cleanup();}
});
test('fenced and blockquote tables do not reserve IDs',()=>{
 const f=fixture();try{
  fs.appendFileSync(path.join(f.dir,'INDEX.md'),'\n```markdown\n| ID | Title |\n| --- | --- |\n| 9999 | sample |\n```\n> | ID | Title |\n> | 8888 | sample |\n| ID | Title |\n| --- | --- |\n| 075 | Real row |\n');
  assert.equal(c.audit(f.root,'issues').nextId,76);
 }finally{f.cleanup();}
});
test('duplicated ledger rows are diagnosed and refuse reservation',()=>{
 const f=fixture();try{
  fs.appendFileSync(path.join(f.dir,'INDEX.md'),'| Last Assigned ID | 002 |\n');
  assert.match(c.audit(f.root,'issues').errors.join(';'),/Duplicate Last Assigned ID/);
  assert.throws(()=>c.reserve(f.root,'issues'),/Missing or invalid ledger/);
 }finally{f.cleanup();}
});
test('frontmatter identity and folder status disagreements are flagged',()=>{
 const f=fixture();try{
  const doc=path.join(f.dir,'3752-mismatched.md');
  fs.writeFileSync(doc,'---\nid: "042"\nstatus: completed\n---\nHistory');
  const a=c.audit(f.root,'issues');assert.equal(a.mismatchedFrontmatter.length,1);assert.equal(a.statusConflicts.length,1);
  assert.throws(()=>c.reserve(f.root,'issues'),/Conflicting artifact frontmatter/);
 }finally{f.cleanup();}
});
test('legacy missing frontmatter remains valid and reserves its ID',()=>{
 const f=fixture('plans',1000,1001);try{
  fs.writeFileSync(path.join(f.dir,'completed','3752-old-plan.md'),'# Historical plan\n');
  const a=c.audit(f.root,'plans');assert.equal(a.legacyMetadata.length,1);assert.equal(a.nextId,3753);
  assert.equal(c.reserve(f.root,'plans').id,3753);
 }finally{f.cleanup();}
});
test('IDs sort numerically and archived documents reserve history',()=>{
 const f=fixture();try{
  fs.mkdirSync(path.join(f.dir,'archive'));
  fs.writeFileSync(path.join(f.dir,'archive','10000-archived.md'),'# Archive');
  fs.writeFileSync(path.join(f.dir,'completed','3752-completed.md'),'# Completed');
  fs.writeFileSync(path.join(f.dir,'999-earlier.md'),'# Earlier');
  const a=c.audit(f.root,'issues');assert.deepEqual(a.missingFromIndex,[999,3752,10000]);assert.equal(a.nextId,10001);
 }finally{f.cleanup();}
});
test('archive duplicates reported with both paths',()=>{
 const f=fixture();try{
  fs.mkdirSync(path.join(f.dir,'archive'));
  fs.writeFileSync(path.join(f.dir,'archive','3752-old.md'),'first');
  fs.writeFileSync(path.join(f.dir,'completed','3752-completed.md'),'second');
  const a=c.audit(f.root,'issues');assert.equal(a.duplicates.length,1);assert.equal(a.duplicates[0].paths.length,2);
 }finally{f.cleanup();}
});
