import {STEP_IDS,PURCHASES} from '../src/runbook/runbook.js';

// The site is static (nuxt generate into dist/), served as Workers Static
// Assets. Only /api/* reaches this Worker (run_worker_first in wrangler.jsonc):
// the runbook's ticks and expense switches, kept in D1 so every device sees
// the same state. Cloudflare Access ("Winterlight runbook": /runbook,
// /runbook.html and /api/runbook, Alex only) signs people in before a request
// gets here. As a second check, a request with no sign-in from Access at all
// (its JWT header, identity header or CF_Authorization cookie) is refused,
// unless RUNBOOK_OPEN=1 (local wrangler dev, in .dev.vars). On workers.dev the
// identity header alone isn't always passed on, so any of the three will do.
const STEPS=new Set(STEP_IDS),BUYS=new Set(PURCHASES.map(p=>p.id)),KINDS=new Set(['private','business']);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const signedIn=(request,env)=>{const h=request.headers;return env.RUNBOOK_OPEN==='1'||Boolean(h.get('cf-access-jwt-assertion')||h.get('cf-access-authenticated-user-email')||/(?:^|;\s*)CF_Authorization=/.test(h.get('cookie')||''));};

export async function readState(db){
 const {results}=await db.prepare('SELECT kind,id,value FROM runbook_state').all();
 const done={},expense={};
 for(const r of results){if(r.kind==='done'&&STEPS.has(r.id))done[r.id]=r.value==='1';else if(r.kind==='expense'&&BUYS.has(r.id)&&KINDS.has(r.value))expense[r.id]=r.value;}
 return {done,expense};
}

// A change is {done:{stepId:true|false}, expense:{purchaseId:'private'|'business'|null}}.
// null puts the purchase back on its default tag.
export function statements(db,change){
 const out=[],up=db.prepare("INSERT INTO runbook_state (kind,id,value,updated_at) VALUES (?1,?2,?3,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(kind,id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at");
 const del=db.prepare("DELETE FROM runbook_state WHERE kind='expense' AND id=?1");
 for(const [id,v] of Object.entries(change?.done||{})){if(!STEPS.has(id)||typeof v!=='boolean')throw new Error(`bad step ${id}`);out.push(up.bind('done',id,v?'1':'0'));}
 for(const [id,v] of Object.entries(change?.expense||{})){if(!BUYS.has(id)||!(v===null||KINDS.has(v)))throw new Error(`bad expense ${id}`);out.push(v===null?del.bind(id):up.bind('expense',id,v));}
 if(out.length>200)throw new Error('too many changes');
 return out;
}

export default {
 async fetch(request,env){
  const {pathname}=new URL(request.url);
  if(pathname!=='/api/runbook')return json({error:'not found'},404);
  if(!env.RUNBOOK_DB)return json({error:'no database bound'},503);
  if(!signedIn(request,env)){console.warn('runbook API refused: no Access sign-in',[...request.headers.keys()].filter(k=>k.startsWith('cf-')));return json({error:'sign in through Cloudflare Access'},401);}
  if(request.method==='GET')return json(await readState(env.RUNBOOK_DB));
  if(request.method!=='PATCH')return json({error:'method not allowed'},405);
  let stmts;
  try{stmts=statements(env.RUNBOOK_DB,await request.json());}catch(e){return json({error:e.message},400);}
  if(stmts.length)await env.RUNBOOK_DB.batch(stmts);
  return json(await readState(env.RUNBOOK_DB));
 },
};
