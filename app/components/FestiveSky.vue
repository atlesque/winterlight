<script setup>
// The night behind the page: a soft aurora, twinkling stars and slow snow.
// It sits behind everything (never over the 3D scenes) and stands still for
// visitors who prefer reduced motion.
const rand=seeded(1225);
const r=(a,b)=>+(a+rand()*(b-a)).toFixed(2);
const stars=Array.from({length:70},()=>({left:r(0,100),top:r(0,70),size:r(1,2.4),delay:r(0,6),duration:r(2.5,6)}));
const flakes=Array.from({length:46},()=>({left:r(0,100),size:r(2,5.5),delay:r(-30,0),duration:r(16,34),drift:r(-40,40),opacity:r(.25,.7)}));
</script>

<template>
  <div class="sky" aria-hidden="true">
    <div class="aurora a1" /><div class="aurora a2" /><div class="aurora a3" />
    <span v-for="(s,i) in stars" :key="'s'+i" class="star" :style="{left:s.left+'%',top:s.top+'%',width:s.size+'px',height:s.size+'px',animationDelay:s.delay+'s',animationDuration:s.duration+'s'}" />
    <span v-for="(f,i) in flakes" :key="'f'+i" class="flake" :style="{left:f.left+'%',width:f.size+'px',height:f.size+'px',opacity:f.opacity,animationDelay:f.delay+'s',animationDuration:f.duration+'s','--drift':f.drift+'px'}" />
    <div class="hills" />
  </div>
</template>

<style scoped>
.sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;
 background:radial-gradient(120% 70% at 50% -10%,#1b2a52 0%,#101a33 38%,#0a1120 70%),#0a1120}
.aurora{position:absolute;border-radius:50%;filter:blur(70px);opacity:.32;mix-blend-mode:screen;animation:drift 38s ease-in-out infinite alternate}
.a1{width:55vw;height:28vh;left:-8vw;top:-6vh;background:radial-gradient(closest-side,#2bd48a,transparent)}
.a2{width:48vw;height:26vh;right:-10vw;top:4vh;background:radial-gradient(closest-side,#5b6cff,transparent);animation-duration:46s;animation-delay:-12s}
.a3{width:40vw;height:30vh;left:30vw;bottom:-14vh;background:radial-gradient(closest-side,#e5484d,transparent);opacity:.14;animation-duration:52s}
@keyframes drift{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(4vw,2vh,0) scale(1.08)}100%{transform:translate3d(-3vw,-1vh,0) scale(.96)}}
.star{position:absolute;border-radius:50%;background:#fff6e0;box-shadow:0 0 6px #fff6e0aa;animation:twinkle ease-in-out infinite}
@keyframes twinkle{0%,100%{opacity:.15}50%{opacity:.9}}
.flake{position:absolute;top:-12px;border-radius:50%;background:radial-gradient(circle,#ffffff 0%,#ffffffcc 40%,transparent 72%);animation:fall linear infinite;will-change:transform}
@keyframes fall{0%{transform:translate3d(0,-2vh,0)}50%{transform:translate3d(var(--drift),50vh,0)}100%{transform:translate3d(0,104vh,0)}}
.hills{position:absolute;left:-5%;right:-5%;bottom:-1px;height:120px;opacity:.5;
 background:radial-gradient(60% 120px at 20% 100%,#16233a 0 98%,transparent 100%),radial-gradient(55% 100px at 75% 100%,#131f34 0 98%,transparent 100%)}
@media (prefers-reduced-motion:reduce){.aurora,.star{animation:none}.flake{display:none}}
</style>
