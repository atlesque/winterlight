<script setup>
// A small (i) button that opens a short explanation, so the panels stay minimal.
defineProps({text:{type:String,required:true},label:{type:String,default:'More info'}});
</script>

<template>
  <UPopover :content="{side:'top',align:'center',sideOffset:6}" arrow>
    <button type="button" class="info-tip" :aria-label="label" @click.stop><UIcon name="i-lucide-info" /></button>
    <template #content>
      <p class="info-tip-text">{{ text }}</p>
    </template>
  </UPopover>
</template>

<style scoped>
.info-tip{display:inline-grid;place-items:center;width:18px;height:18px;padding:0;border:0;border-radius:50%;background:none;color:#7f93a8;font-size:14px;vertical-align:middle;flex-shrink:0;transition:color .15s}
.info-tip:hover,.info-tip[data-state=open]{color:var(--gold)}
.info-tip-text{max-width:260px;margin:0;padding:10px 12px;font-size:12px;line-height:1.55;color:var(--ui-text-toned)}
</style>
