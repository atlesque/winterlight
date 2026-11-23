<script setup>
import {CHANNELS,PROPS,COLORS,MULTI} from '~~/src/original/layout.js';

// One lamp per channel, grouped by prop, so the detected states can be read
// alongside the model. update() runs every animation frame, so it touches
// only the lamps whose state changed, straight on the DOM.
const groups=PROPS.map(p=>({...p,lamps:CHANNELS.map((c,i)=>({c,i})).filter(({c})=>c.prop===p.id).map(({c,i})=>({i,name:c.name,wide:c.kind==='strip',
 label:c.kind==='letter'?c.model.char:c.kind==='strip'?c.name.replace(/ strip(s)?$/,''):c.kind==='star'?'★':c.id.split('-').at(-1).replace(/^0/,'')}))}));
const lamps=[];
const shown=new Uint8Array(CHANNELS.length).fill(255),shownLevel=new Uint8Array(CHANNELS.length);
// A lamp's opacity follows the detected brightness, so fades read on the board too.
function update(values,level){CHANNELS.forEach((c,i)=>{const v=values[i],l=v?level[i]:0;if(v===shown[i]&&l===shownLevel[i])return;const el=lamps[i];if(!el)return;shown[i]=v;shownLevel[i]=l;
 const col=c.palette==='multi'?(v===2?COLORS.blue:v===3?`linear-gradient(90deg,${COLORS.yellow} 50%,${COLORS.blue} 50%)`:COLORS.yellow):COLORS[c.palette];
 el.classList.toggle('on',!!v);el.style.background=v?col:'';el.style.opacity=v?.35+.65*l/100:'';el.style.setProperty('--glow',v?(c.palette==='multi'&&v===2?COLORS.blue:COLORS[c.palette]||COLORS.yellow):'transparent');el.title=`${c.name}${v?` · ${l}%${c.palette==='multi'?` (${MULTI[v]})`:''}`:' · off'}`;});}
defineExpose({update});

// Picking: a lamp picks its channel, a group's title picks the whole prop; the
// show page lights the picked ones fully on the houses and dims the rest.
const props=defineProps({picked:{type:Array,default:()=>[]}});
const emit=defineEmits(['pick']);
const isPicked=i=>props.picked.includes(i);
const groupPicked=g=>g.lamps.every(l=>isPicked(l.i));
</script>

<template>
  <div id="board" class="board" :class="{picking:picked.length}">
    <div v-for="g in groups" :key="g.id" class="board-group">
      <button type="button" class="group-title" :data-prop="g.id" :aria-pressed="groupPicked(g)" :aria-label="`Highlight all ${g.name}`" @click="emit('pick',g.lamps.map(l=>l.i))">{{ g.name }} · {{ g.addressing }}</button>
      <div>
        <button v-for="lamp in g.lamps" :key="lamp.i" :ref="el=>{lamps[lamp.i]=el;}" type="button" class="lamp" :class="{wide:lamp.wide,picked:isPicked(lamp.i)}" :data-i="lamp.i" :title="lamp.name" :aria-label="`Highlight ${lamp.name}`" :aria-pressed="isPicked(lamp.i)" @click="emit('pick',[lamp.i])">{{ lamp.label }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board{display:grid;gap:14px}
.group-title{display:block;font-size:10px;color:var(--ui-text-dimmed);margin-bottom:6px;letter-spacing:.2px;background:none;border:0;padding:0;text-align:left;cursor:pointer}
.group-title:hover,.group-title[aria-pressed=true]{color:var(--gold-soft)}
.board-group div{display:flex;flex-wrap:wrap;gap:4px}
.lamp{cursor:pointer;font-family:inherit;line-height:1;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#ffffff08;border:1px solid #ffffff12;font-size:9px;color:#6d8296;display:inline-flex;align-items:center;justify-content:center;transition:box-shadow .2s,border-color .2s}
.lamp.on{color:#16110a;border-color:transparent;box-shadow:0 0 10px var(--glow),0 0 2px var(--glow)}
.lamp.wide{min-width:62px}
.lamp:hover{border-color:#ffffff40}
/* While props are picked, the others fade back and the picked ones get a ring. */
.board.picking .lamp:not(.picked){filter:saturate(.35) brightness(.6)}
.lamp.picked{outline:2px solid #fff6e4;outline-offset:2px}
.lamp:focus-visible,.group-title:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
</style>
