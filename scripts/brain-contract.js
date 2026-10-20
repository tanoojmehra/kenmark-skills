'use strict';
// Optional portable helper; Markdown/filesystem/Git remain canonical.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ARTIFACT_RE=/^([0-9]{3,})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const VALID_TYPES=new Set(['issues','plans']);
function formatId(n){if(!Number.isSafeInteger(n)||n<1)throw Error('Expected positive safe-integer ID');return String(n).padStart(3,'0');}
function numericId(value){if(typeof value!=='string'||!/^\d+$/.test(value))return null;const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null;}
function parseName(name){const m=ARTIFACT_RE.exec(name);if(!m)return null;const id=numericId(m[1]);return id===null?null:{id,displayId:m[1],slug:m[2],canonical:m[1]===formatId(id)};}
function trackerDir(root,type){if(!VALID_TYPES.has(type))throw Error('Invalid tracker: '+type);return path.join(root,'brain',type);}
function parseIndex(content){
 let last=null,next=null,lastCount=0,nextCount=0,header=null,fenced=false;
 const ledgerErrors=[],indexIds=[];
 for(const raw of String(content||'').split(/\r?\n/)){
  if(/^\s*(?:```|~~~)/.test(raw)){fenced=!fenced;header=null;continue;}
  if(fenced||/^\s*>/.test(raw)){header=null;continue;}
  if(!/^\s*\|.*\|\s*$/.test(raw)){header=null;continue;}
  const cells=raw.replace(/^\s*\||\|\s*$/g,'').split('|').map(x=>x.trim().replace(/^\*\*(.*?)\*\*$/,'$1'));
  if(cells.every(c=>/^:?-{3,}:?$/.test(c)))continue;
  if(cells.length>=2){
   if(/^Last Assigned ID$/i.test(cells[0])){lastCount++;const n=numericId(cells[1]);if(n===null&&!/^0+$/.test(cells[1]))ledgerErrors.push('Invalid Last Assigned ID');else last=n||0;}
   if(/^Next ID$/i.test(cells[0])){nextCount++;const n=numericId(cells[1]);if(n===null)ledgerErrors.push('Invalid Next ID');else next=n;}
   if(/^ID$/i.test(cells[0])){header='artifact';continue;}
   if(header==='artifact'){const n=numericId(cells[0]);if(n!==null)indexIds.push(n);}
  }
 }
 if(lastCount>1)ledgerErrors.push('Duplicate Last Assigned ID ledger fields');
 if(nextCount>1)ledgerErrors.push('Duplicate Next ID ledger fields');
 if(last===null)ledgerErrors.push('Missing Last Assigned ID');
 if(next===null)ledgerErrors.push('Missing Next ID');
 if(last!==null&&next!==null&&next<=last)ledgerErrors.push('Next ID must exceed Last Assigned ID');
 return {last,next,indexIds,ledgerErrors};
}
function listRecords(dir){
 if(!fs.existsSync(dir))return [];
 return fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.md')&&x.name!=='INDEX.md')
 .map(x=>({name:x.name,absolutePath:path.join(dir,x.name),parsed:parseName(x.name)}));
}
function documentMetadata(file){
 const content=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
 const m=/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/.exec(content);
 if(!m)return {hasFrontmatter:false,id:null,status:null};
 const meta={hasFrontmatter:true,id:null,status:null};
 for(const line of m[1].split(/\r?\n/)){
  const v=/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/.exec(line);
  if(!v||!['id','status'].includes(v[1]))continue;
  let value=v[2];if((value[0]==='"'&&value.at(-1)==='"')||(value[0]==="'"&&value.at(-1)==="'"))value=value.slice(1,-1);
  meta[v[1]]=v[1]==='id'?numericId(value):value;
  if(v[1]==='id'&&meta.id===null)meta.malformedId=true;
 }
 return meta;
}
function audit(root,type){
 const dir=trackerDir(root,type),indexPath=path.join(dir,'INDEX.md');
 const hasIndex=fs.existsSync(indexPath),index=parseIndex(hasIndex?fs.readFileSync(indexPath,'utf8'):'');
 const records=[
  ...listRecords(dir).map(x=>({...x,folder:'active'})),
  ...listRecords(path.join(dir,'completed')).map(x=>({...x,folder:'completed'})),
  ...listRecords(path.join(dir,'archive')).map(x=>({...x,folder:'archive'}))
 ];
 const malformed=records.filter(x=>!x.parsed),noncanonical=[],mismatchedFrontmatter=[],statusConflicts=[],legacyMetadata=[];
 const groups=new Map();
 for(const rec of records){
  if(!rec.parsed)continue;
  const meta=documentMetadata(rec.absolutePath);rec.metadata=meta;
  if(!meta.hasFrontmatter)legacyMetadata.push(path.relative(root,rec.absolutePath));
  if(meta.malformedId||(meta.id!==null&&meta.id!==rec.parsed.id))mismatchedFrontmatter.push({path:path.relative(root,rec.absolutePath),filenameId:rec.parsed.id,frontmatterId:meta.id});
  if(meta.status){const done=type==='issues'?['completed','done'].includes(meta.status):['done','superseded','cancelled','completed'].includes(meta.status);
   if((rec.folder==='completed'&&!done)||(rec.folder==='active'&&done))statusConflicts.push({path:path.relative(root,rec.absolutePath),status:meta.status,folder:rec.folder});
  }
  if(!rec.parsed.canonical)noncanonical.push(rec);
  const items=groups.get(rec.parsed.id)||[];items.push(rec);groups.set(rec.parsed.id,items);
 }
 const duplicates=[...groups].filter(([,items])=>items.length>1).map(([id,items])=>({id,paths:items.map(x=>path.relative(root,x.absolutePath))}));
 const missingFromIndex=[...groups.keys()].filter(id=>!index.indexIds.includes(id)).sort((a,b)=>a-b);
 const absentFiles=[...new Set(index.indexIds)].filter(id=>!groups.has(id)).sort((a,b)=>a-b);
 const greatest=Math.max(0,index.last||0,(index.next||1)-1,...index.indexIds,...groups.keys());
 if(greatest>=Number.MAX_SAFE_INTEGER)throw Error('ID space exhausted');
 return {type,hasIndex,index,records,malformed,noncanonical,duplicates,mismatchedFrontmatter,statusConflicts,legacyMetadata,missingFromIndex,absentFiles,nextId:greatest+1,
  errors:[...index.ledgerErrors,...(!hasIndex?['Missing INDEX.md']:[])],
  warnings:[...(index.last!==null&&index.last<greatest?['Ledger behind observed IDs']:[]),...(index.next!==null&&index.next<=greatest?['Next ID behind observed IDs']:[])]};
}
function printAudit(a){return {
 type:a.type,indexPresent:a.hasIndex,active:a.records.filter(x=>x.folder==='active').length,completed:a.records.filter(x=>x.folder==='completed').length,archived:a.records.filter(x=>x.folder==='archive').length,
 lastAssigned:a.index.last,ledgerNext:a.index.next,recommendedNext:formatId(a.nextId),
 duplicateIds:a.duplicates,malformedFilenames:a.malformed.map(x=>x.absolutePath),noncanonicalFilenames:a.noncanonical.map(x=>x.absolutePath),
 mismatchedFrontmatter:a.mismatchedFrontmatter,statusConflicts:a.statusConflicts,legacyMetadata:a.legacyMetadata,missingFromIndex:a.missingFromIndex.map(formatId),indexWithoutFile:a.absentFiles.map(formatId),errors:a.errors,warnings:a.warnings
};}
function replaceLedger(content,allocated){
 const last=/(\|\s*Last Assigned ID\s*\|\s*)(\d+)(\s*\|)/i,next=/(\|\s*Next ID\s*\|\s*)(\d+)(\s*\|)/i;
 if(!last.test(content)||!next.test(content))throw Error('Ledger fields missing; approve repair before allocation');
 return content.replace(last,(_,a,b,c)=>a+formatId(allocated)+c).replace(next,(_,a,b,c)=>a+formatId(allocated+1)+c);
}
function writeAtomic(file,body){
 const tmp=file+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';let fd;
 try{fd=fs.openSync(tmp,'wx',0o600);fs.writeFileSync(fd,body);fs.fsyncSync(fd);fs.closeSync(fd);fd=null;fs.renameSync(tmp,file);}
 finally{if(fd!==undefined&&fd!==null)fs.closeSync(fd);if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
}
function sleepMs(ms){const arr=new Int32Array(new SharedArrayBuffer(4));Atomics.wait(arr,0,0,ms);}
function withLock(root,type,callback,timeoutMs=5000){
 const dir=path.join(root,'brain','.locks');fs.mkdirSync(dir,{recursive:true});const lock=path.join(dir,type+'-allocation.lock'),deadline=Date.now()+timeoutMs;
 while(true){try{fs.mkdirSync(lock);break;}catch(e){if(e.code!=='EEXIST')throw e;if(Date.now()>deadline)throw Error('Allocation lock busy; inspect owner; do not remove live lock');sleepMs(25);}}
 try{fs.writeFileSync(path.join(lock,'owner.json'),JSON.stringify({pid:process.pid,created:new Date().toISOString()}));return callback();}
 finally{fs.rmSync(lock,{recursive:true,force:true});}
}
function reserve(root,type){return withLock(root,type,()=>{
 const a=audit(root,type);
 if(!a.hasIndex||a.index.ledgerErrors.length||a.index.last===null||a.index.next===null)throw Error('Missing or invalid ledger; audit and approve repair');
 if(a.malformed.length)throw Error('Malformed artifact names require review');
 if(a.mismatchedFrontmatter.length)throw Error('Conflicting artifact frontmatter IDs require review');
 const id=a.nextId,indexPath=path.join(trackerDir(root,type),'INDEX.md');
 const prior=fs.readFileSync(indexPath,'utf8');
 writeAtomic(indexPath,replaceLedger(prior,id));return {id,displayId:formatId(id),type,reserved:true,existingDuplicates:a.duplicates};
});}
module.exports={ARTIFACT_RE,formatId,numericId,parseName,parseIndex,audit,printAudit,reserve,replaceLedger};
