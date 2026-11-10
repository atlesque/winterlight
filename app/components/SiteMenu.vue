<script setup>
// The menu button at the top right of every page: opens a small list of the site's pages.
const PAGES=[
  {label:'Light show',description:'The 3D show on both houses',icon:'i-lucide-sparkles',to:'/',paths:['/','/index.html']},
  {label:'LED cost estimate',description:'LEDs and euro costs per prop',icon:'i-lucide-gift',to:'/costs.html',paths:['/costs','/costs.html']},
  {label:'Wiring plan',description:'Boxes, power and pixel runs',icon:'i-lucide-cable',to:'/wiring.html',paths:['/wiring','/wiring.html']},
  {label:'Show software',description:'Data, services and the show file',icon:'i-lucide-network',to:'/software.html',paths:['/software','/software.html']},
  {label:'Build runbook',description:'From ordering to the first test run',icon:'i-lucide-list-checks',to:'/runbook.html',paths:['/runbook','/runbook.html']},
  {label:'3D prints',description:'PETG parts for the A1',icon:'i-lucide-printer',to:'/print.html',paths:['/print','/print.html']},
  {label:'Measure the house',description:'What to measure, on the 3D model',icon:'i-lucide-ruler',to:'/measure.html',paths:['/measure','/measure.html']},
];
const route=useRoute();
const open=ref(false);
const items=computed(()=>[PAGES.map(p=>({...p,external:true,current:p.paths.includes(route.path),class:p.paths.includes(route.path)?'is-current':''}))]);
</script>

<template>
  <UDropdownMenu v-model:open="open" :items="items" :content="{align:'end',sideOffset:10}" :external-icon="false" :modal="false"
    :ui="{content:'site-menu w-72 p-1.5',group:'p-0',item:'site-menu-item',itemLeadingIcon:'site-menu-icon',itemLabel:'site-menu-label',itemDescription:'site-menu-desc'}">
    <button class="menu-button" :class="{open}" type="button" aria-label="Menu">
      <UIcon :name="open?'i-lucide-x':'i-lucide-menu'" class="menu-icon" />
      <span class="menu-word">Menu</span>
    </button>
    <template #item-trailing="{item}">
      <UIcon v-if="item.current" name="i-lucide-star" class="site-menu-star" aria-label="This page" />
    </template>
  </UDropdownMenu>
</template>

<style scoped>
.menu-button{display:inline-flex;align-items:center;gap:7px;flex-shrink:0;height:38px;padding:0 14px 0 12px;border-radius:999px;cursor:pointer;
 font-size:12px;color:var(--gold-soft);background:linear-gradient(90deg,#f43f4514,#efc19714);border:1px solid #efc19733;transition:color .2s,border-color .2s,box-shadow .2s}
.menu-button:hover,.menu-button.open{color:var(--gold);border-color:#efc19777;box-shadow:0 0 18px #efc19733}
.menu-icon{width:17px;height:17px}
@media (max-width:720px){.menu-button{height:34px;padding:0 9px}.menu-word{display:none}}
</style>
