<script setup>
defineProps({note:{type:String,default:''}});
</script>

<template>
  <header class="app-header">
    <div class="bar">
      <a class="brand" href="/">
        <span class="mark"><UIcon name="i-lucide-snowflake" /></span>
        <span class="word">Winterlight<small>CHRISTMAS SHOW STUDIO</small></span>
      </a>
      <div v-if="note" class="header-note"><UIcon name="i-lucide-sparkles" /> {{ note }}</div>
      <slot />
    </div>
    <StringLights class="header-garland" :count="36" />
  </header>
</template>

<style scoped>
.app-header{position:relative;z-index:3;flex-shrink:0;background:linear-gradient(180deg,#0b1324f2,#0b1324c4);backdrop-filter:blur(10px);border-bottom:1px solid #ffffff0d}
.bar{height:68px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.brand{display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none}
.mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;font-size:21px;color:#ffd9a8;
 background:radial-gradient(circle at 30% 25%,#e5484d55,transparent 60%),linear-gradient(145deg,#1c2a44,#121c30);border:1px solid #efc19733;box-shadow:0 0 18px #efc19722,inset 0 1px 0 #ffffff14}
.mark :deep(svg){animation:spin 24s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.word{font-family:var(--font-display);font-weight:600;font-size:23px;letter-spacing:-.4px;color:#f6efe2;line-height:1}
.word small{display:block;font-family:var(--font-sans);color:#7f93a8;font-size:8px;font-weight:600;letter-spacing:2.6px;margin-top:5px}
.header-note{display:flex;align-items:center;gap:7px;font-size:12px;color:#93a4b6;font-style:italic;font-family:var(--font-display)}
.header-note :deep(svg){color:#efc197}
.header-garland{position:absolute;left:0;right:0;top:calc(100% - 4px);z-index:4;height:22px}
@media (max-width:1000px){.header-note{display:none}}
@media (max-width:720px){.bar{height:60px;padding:0 16px}.word{font-size:20px}.mark{width:34px;height:34px;font-size:18px}}
@media (max-width:420px){.word small{display:none}}
@media (prefers-reduced-motion:reduce){.mark :deep(svg){animation:none}}
</style>
