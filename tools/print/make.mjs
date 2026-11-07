// Renders the PETG parts of the 3D prints page (src/print/parts.js) with OpenSCAD.
// Usage: node tools/print/make.mjs [part-id ...]
//   → outputs/print/<part>.stl and manifest.json (size, volume, grams), plus the
//     .scad sources so they can be changed and rendered again, and all of it in
//     winterlight-prints.zip (needs `zip`).
// Needs `openscad` on the PATH. The page draws its own previews from the STLs.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {PARTS,BED,FILAMENT} from '../../src/print/parts.js';

const src=fileURLToPath(new URL('./',import.meta.url)),out=fileURLToPath(new URL('../../outputs/print/',import.meta.url));

// Size and volume of an ASCII or binary STL.
export function measure(buf){
 const tris=[];
 if(buf.subarray(0,5).toString()==='solid'&&buf.includes('facet')){
  const v=[...buf.toString().matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)].map(m=>[+m[1],+m[2],+m[3]]);
  for(let i=0;i<v.length;i+=3)tris.push([v[i],v[i+1],v[i+2]]);
 }else{
  const n=buf.readUInt32LE(80);
  for(let i=0;i<n;i++){const o=84+i*50+12,p=k=>[0,1,2].map(j=>buf.readFloatLE(o+k*12+j*4));tris.push([p(0),p(1),p(2)]);}
 }
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];let vol=0;
 for(const [a,b,c] of tris){
  for(const p of [a,b,c])for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],p[j]);hi[j]=Math.max(hi[j],p[j]);}
  vol+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
 }
 return {size:hi.map((v,j)=>Math.round((v-lo[j])*10)/10),volume:Math.abs(vol)/1000,triangles:tris.length};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 mkdirSync(out,{recursive:true});
 const only=process.argv.slice(2);
 const manifestPath=`${out}manifest.json`,manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):{};
 copyFileSync(`${src}lib.scad`,`${out}lib.scad`);
 for(const p of PARTS){
  if(only.length&&!only.includes(p.id))continue;
  const defs=Object.entries(p.params).flatMap(([k,v])=>['-D',`${k}=${v}`]);
  const scad=`${src}${p.scad}.scad`,stl=`${out}${p.id}.stl`;
  // The copy next to the STL has the model's values filled in.
  const text=readFileSync(scad,'utf8').replace(/^(\w+) = [^;]+;/gm,(line,k)=>k in p.params?`${k} = ${p.params[k]};`:line);
  writeFileSync(`${out}${p.id}.scad`,text);
  console.log(`${p.id}: rendering…`);
  execFileSync('openscad',['-o',stl,...defs,scad],{stdio:['ignore','ignore','inherit']});
  const m=measure(readFileSync(stl));
  if(m.size.some((v,j)=>v>[BED.x,BED.y,BED.z][j]))throw new Error(`${p.id} is ${m.size.join(' × ')} mm, bigger than the ${BED.name}'s bed`);
  // Walls, top and bottom make most of these parts solid; infill fills the rest at 25–40%.
  const grams=Math.round(m.volume*FILAMENT.density*.8);
  manifest[p.id]={size:m.size,volume:Math.round(m.volume*10)/10,grams};
  console.log(`${p.id}: ${m.size.join(' × ')} mm, ${manifest[p.id].volume} cm³, about ${grams} g`);
 }
 // Only the parts still on the list.
 const kept=Object.fromEntries(PARTS.filter(p=>manifest[p.id]).map(p=>[p.id,manifest[p.id]]));
 writeFileSync(manifestPath,JSON.stringify(kept,null,1)+'\n');
 try{
  const files=['lib.scad',...PARTS.flatMap(p=>[`${p.id}.stl`,`${p.id}.scad`])];
  execFileSync('zip',['-q','-X','-FS','winterlight-prints.zip',...files],{cwd:out});
 }catch(e){console.warn(`No zip: ${e.message.split('\n')[0]}`);}
}
