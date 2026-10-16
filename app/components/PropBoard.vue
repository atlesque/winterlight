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
</script>

<template>
  <div id="board" class="board">
    <div v-for="g in groups" :key="g.id" class="board-group">
      <small>{{ g.name }} · {{ g.addressing }}</small>
      <div>
        <span v-for="lamp in g.lamps" :key="lamp.i" :ref="el=>{lamps[lamp.i]=el;}" class="lamp" :class="{wide:lamp.wide}" :data-i="lamp.i" :title="lamp.name">{{ lamp.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board{display:grid;gap:14px}
.board-group small{display:block;font-size:10px;color:var(--ui-text-dimmed);margin-bottom:6px;letter-spacing:.2px}
.board-group div{display:flex;flex-wrap:wrap;gap:4px}
.lamp{min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#ffffff08;border:1px solid #ffffff12;font-size:9px;color:#6d8296;display:inline-flex;align-items:center;justify-content:center;transition:box-shadow .2s,border-color .2s}
.lamp.on{color:#16110a;border-color:transparent;box-shadow:0 0 10px var(--glow),0 0 2px var(--glow)}
.lamp.wide{min-width:62px}
</style>
