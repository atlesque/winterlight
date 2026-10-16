<script setup>
// A garland of fairy lights hanging in scallops, each bulb twinkling on its own beat.
const props=defineProps({count:{type:Number,default:30}});
const COLORS=['#ff4b4b','#ffc860','#2fd27a','#4f7dff','#ffe2b0'];
const rand=seeded(2412);
const bulbs=computed(()=>Array.from({length:props.count},(_,i)=>({left:(i+.5)/props.count*100,color:COLORS[i%COLORS.length],delay:+(rand()*4).toFixed(2),duration:+(2.4+rand()*2.6).toFixed(2)})));
// One sagging curve per bulb, drawn in a stretched 100-unit-per-bulb box.
const path=computed(()=>Array.from({length:props.count},(_,i)=>`${i?'':'M0 2 '}Q${i*100+50} 22 ${i*100+100} 2`).join(' '));
</script>

<template>
  <div class="garland" aria-hidden="true">
    <svg :viewBox="`0 0 ${count*100} 24`" preserveAspectRatio="none"><path :d="path" /></svg>
    <span v-for="(b,i) in bulbs" :key="i" class="bulb" :style="{left:b.left+'%','--c':b.color,animationDelay:b.delay+'s',animationDuration:b.duration+'s'}" />
  </div>
</template>

<style scoped>
.garland{position:relative;height:26px;pointer-events:none}
svg{position:absolute;inset:0 0 auto;width:100%;height:14px;overflow:visible}
path{fill:none;stroke:#2e3b2f;stroke-width:1.6;vector-effect:non-scaling-stroke}
.bulb{position:absolute;top:10px;width:7px;height:11px;margin-left:-3.5px;border-radius:45% 45% 50% 50%/40% 40% 60% 60%;background:var(--c);
 box-shadow:0 0 8px 1px var(--c),0 0 18px 2px color-mix(in srgb,var(--c) 45%,transparent);animation:glow ease-in-out infinite}
.bulb::before{content:'';position:absolute;top:-3px;left:1.5px;width:4px;height:4px;border-radius:1px;background:#3b4636}
@keyframes glow{0%,100%{opacity:1;filter:brightness(1.1)}50%{opacity:.45;filter:brightness(.7)}}
@media (prefers-reduced-motion:reduce){.bulb{animation:none}}
</style>
