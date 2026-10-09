import './style.css';
import {createScene} from './scene.js';
import {proposalProps,proposalLayout} from './props-proposal.js';
import {propColors} from './props.js';

const $=id=>document.getElementById(id),pixels=proposalLayout(),colors=new Float32Array(pixels.length*3);
function select(prop){
  $('prop-select').value=prop.id;
  $('inspector').replaceChildren();
  const title=document.createElement('h3');title.textContent=prop.name;
  const detail=document.createElement('p');detail.textContent=`${prop.count} pixels. ${prop.detail}`;
  $('inspector').append(title,detail);
}
for(const prop of proposalProps){const option=document.createElement('option');option.value=prop.id;option.textContent=prop.name;$('prop-select').append(option);}
$('prop-select').onchange=e=>{const prop=proposalProps.find(p=>p.id===e.target.value);if(prop)select(prop);};
let scene;
try{scene=createScene($('viewport'),pixels,select,{preview:true});scene.view('front');}
catch(error){$('scene-error').hidden=false;$('scene-error').textContent=`Preview needs WebGL: ${error.message}`;}
for(const name of ['front','orbit','overhead'])$(name).onclick=()=>scene?.view(name);
function colour(){
  const white=$('look').value==='white';
  for(const p of pixels)colors.set((white?[1,1,1]:propColors(p.prop)[p.local]).map(c=>c*.5),p.index*3);
}
$('look').onchange=colour;colour();
function draw(){requestAnimationFrame(draw);scene?.draw(colors);}draw();
