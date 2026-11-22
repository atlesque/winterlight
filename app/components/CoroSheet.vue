<script setup>
import {CORO_SHEETS,SHEET,BAND,HOLE,coroOutline} from '~~/src/coro.js';

// One coro sheet with its pieces drawn at their real outlines, laid side by
// side as in the sheet plan (src/coro.js). The step-by-step guide passes the
// piece being cut (focus, its slot on the sheet) and the pieces already cut.
const props=defineProps({sheet:{type:Number,required:true},focus:{type:Number,default:null},cut:{type:Array,default:()=>[]},holes:{type:Boolean,default:false}});
const outline=Object.fromEntries(CORO_SHEETS.flatMap(s=>s.pieces).map(p=>[p.kind,coroOutline(p)]));
const placed=computed(()=>{const s=CORO_SHEETS[props.sheet];let x=(SHEET.w-s.width)/2;return s.pieces.map((p,i)=>{const at={p,i,x,y:(SHEET.h-p.h)/2};x+=p.w+s.gap;return at;});});
const state=i=>props.focus===i?'focus':props.cut.includes(i)?'cut':props.focus===null?'':'later';
</script>

<template>
  <svg class="coro-sheet" :viewBox="`-20 -20 ${SHEET.w+40} ${SHEET.h+40}`" role="img" :aria-label="`Sheet ${sheet+1}`">
    <rect class="board" :width="SHEET.w" :height="SHEET.h" rx="6" />
    <g class="flutes"><line v-for="x in 27" :key="x" :x1="x*50" :x2="x*50" y1="0" :y2="SHEET.h" /></g>
    <g v-for="a in placed" :key="a.i" :class="['piece',state(a.i)]" :transform="`translate(${a.x} ${a.y})`">
      <g class="band" :stroke-width="BAND"><polyline v-for="(l,k) in outline[a.p.kind].lines" :key="k" :points="l.map(q=>q.join(',')).join(' ')" /></g>
      <circle v-for="(b,k) in outline[a.p.kind].bulbs" :key="`b${k}`" class="band-dot" :cx="b[0]" :cy="b[1]" :r="BAND/2" />
      <template v-if="holes&&focus===a.i"><circle v-for="(s,k) in outline[a.p.kind].spots" :key="`s${k}`" class="hole" :cx="s[0]" :cy="s[1]" :r="HOLE/2+3" /></template>
    </g>
  </svg>
</template>

<style scoped>
.coro-sheet{width:100%;height:auto;display:block}
.board{fill:#ffffff08;stroke:#ffffff30;stroke-width:3}
.flutes line{stroke:#ffffff0c;stroke-width:2}
.band{fill:none;stroke:#e8e6dfcc;stroke-linecap:round;stroke-linejoin:round}
.band-dot{fill:#e8e6dfcc}
.piece{transition:opacity .3s}
.piece.later{opacity:.28}
.piece.cut{opacity:.5}
.piece.cut .band{stroke:#7fd0a0}.piece.cut .band-dot{fill:#7fd0a0}
.piece.focus .band{stroke:#f0c49a}.piece.focus .band-dot{fill:#f0c49a}
.hole{fill:#0d1626;stroke:#fbf4e8;stroke-width:4}
</style>
