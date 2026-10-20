#!/usr/bin/env node
'use strict';
const {audit,printAudit,reserve}=require('./brain-contract');
function main(){
 const [op='audit',type='both',root=process.cwd()]=process.argv.slice(2),types=type==='both'?['issues','plans']:[type];
 if(!['audit','reserve'].includes(op)||types.some(x=>!['issues','plans'].includes(x)))throw Error('Usage: node brain-tracker.js audit|reserve issues|plans|both [root]');
 if(op==='reserve'&&types.length!==1)throw Error('Choose a single tracker for ID reservation');
 const out=types.map(k=>op==='audit'?printAudit(audit(root,k)):reserve(root,k));
 console.log(JSON.stringify(out.length===1?out[0]:out,null,2));
}
try{main();}catch(e){console.error('brain-tracker:',e.message);process.exitCode=1;}
