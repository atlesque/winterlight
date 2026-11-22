<script setup>
// A step-by-step guide: one step on screen at a time, a checkbox per task,
// Back and Next, and a row of numbered pills to jump between steps. Ticks and
// the open step are kept by useGuideTicks under storageKey, so reopening the
// page carries on where you left off. Ticks are shared between devices through
// the site's Worker when it can be reached (see useGuideTicks).
//
//   <StepGuide :steps="[{id,title,intro?,tasks:[{id,html,note?}]}]" storage-key="..." >
//     <template #step-<id>>extra content under that step's tasks</template>
//   </StepGuide>
//
// Task html is the site's own text (links, <b>, <code>), never user input.
const props=defineProps({steps:{type:Array,required:true},storageKey:{type:String,required:true}});
const slots=useSlots();

const key=(s,t)=>`${props.storageKey}/${s.id}/${t.id}`;
const taskIds=new Set(props.steps.flatMap(s=>s.tasks.map(t=>key(s,t))));
const {done,toggle:flip,reset:clear,step:openId,open,mode,status}=useGuideTicks(props.storageKey,[...taskIds]);
const current=computed(()=>Math.max(0,props.steps.findIndex(s=>s.id===openId.value)));
const stepDone=s=>s.tasks.every(t=>done[key(s,t)]);
const stepCount=s=>s.tasks.filter(t=>done[key(s,t)]).length;
const total=computed(()=>[...taskIds].filter(k=>done[k]).length);
const step=computed(()=>props.steps[current.value]);
const allDone=computed(()=>total.value===taskIds.size);
const top=ref(null);
function go(i){
 open(props.steps[Math.max(0,Math.min(props.steps.length-1,i))].id);
 // Bring the step's top into view when it starts above the screen.
 nextTick(()=>{const el=top.value;if(el&&el.getBoundingClientRect().top<0)el.scrollIntoView({behavior:'smooth',block:'start'});});
}
const toggle=(s,t)=>flip(key(s,t));
function reset(){if(!confirm('Untick every step and start again from step 1?'))return;clear();go(0);}
</script>

<template>
  <div ref="top" class="step-guide">
    <nav class="pills" aria-label="Steps">
      <button v-for="(s,i) in steps" :key="s.id" type="button" class="pill" :class="{current:i===current,done:stepDone(s)}"
        :aria-current="i===current?'step':undefined" :title="s.title" @click="go(i)">
        <UIcon v-if="stepDone(s)" name="i-lucide-check" class="pill-check" /><span v-else>{{ i+1 }}</span>
        <span class="pill-label">{{ s.title }}</span>
      </button>
    </nav>
    <div class="progress" role="progressbar" :aria-valuenow="total" aria-valuemin="0" :aria-valuemax="taskIds.size" aria-label="Tasks done">
      <i :style="{width:`${total/taskIds.size*100}%`}" />
    </div>

    <section class="glass step-card" :aria-labelledby="`step-${step.id}`">
      <p class="step-count">Step {{ current+1 }} of {{ steps.length }} · {{ stepCount(step) }} of {{ step.tasks.length }} done</p>
      <h2 :id="`step-${step.id}`">{{ step.title }}</h2>
      <p v-if="step.intro" class="step-intro" v-html="step.intro" />
      <ul class="tasks">
        <li v-for="t in step.tasks" :key="t.id" :class="{done:done[key(step,t)]}">
          <label>
            <input type="checkbox" :checked="!!done[key(step,t)]" @change="toggle(step,t)">
            <span class="box"><UIcon name="i-lucide-check" class="box-check" /></span>
            <span class="task-text"><span v-html="t.html" /><small v-if="t.note" class="task-note" v-html="t.note" /></span>
          </label>
        </li>
      </ul>
      <div v-if="slots[`step-${step.id}`]" class="step-extra"><slot :name="`step-${step.id}`" /></div>

      <div class="step-nav">
        <UButton v-if="current>0" icon="i-lucide-arrow-left" label="Back" color="neutral" variant="subtle" @click="go(current-1)" />
        <span class="spacer" />
        <UButton v-if="current<steps.length-1" trailing-icon="i-lucide-arrow-right" :label="stepDone(step)?'Next step':'Next'" :variant="stepDone(step)?'solid':'subtle'" @click="go(current+1)" />
        <span v-else-if="allDone" class="finished"><UIcon name="i-lucide-party-popper" /> All {{ taskIds.size }} tasks done</span>
      </div>
    </section>
    <p v-if="status" class="guide-foot error">{{ status }}</p>
    <p class="guide-foot">{{ total }} of {{ taskIds.size }} tasks done<template v-if="mode==='shared'">, shared with every device signed in to the runbook.</template><template v-else-if="mode==='local'">, saved in this browser only. <a href="/runbook.html">Sign in through the runbook</a> to share ticks between devices.</template><template v-else>.</template> <button type="button" class="text-button" @click="reset">Start again</button></p>
  </div>
</template>

<style scoped>
.step-guide{margin-top:26px;scroll-margin-top:90px}
.pills{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px}
.pill{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;height:36px;padding:0 14px 0 6px;border-radius:999px;border:1px solid var(--hairline);background:#ffffff06;color:#a3b3c3;font-size:12px;transition:border-color .2s,color .2s,background .2s}
.pill>span:first-child,.pill-check{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:700;background:#ffffff10;color:#d6dfe6}
.pill-check{padding:5px;background:#7ee08122;color:#7ee081}
.pill:hover{color:#eef3f7;border-color:#efc19755}
.pill.current{color:#fbf4e8;border-color:#efc19799;background:#efc19714}
.pill.current>span:first-child{background:var(--gold);color:#10141c}
.progress{height:3px;border-radius:2px;background:#ffffff10;margin:10px 2px 0;overflow:hidden}
.progress i{display:block;height:100%;background:linear-gradient(90deg,#7ee081,var(--gold));transition:width .3s}
.step-card{padding:22px 24px;margin-top:14px}
.step-count{margin:0 0 6px;font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#8397a9}
.step-card h2{margin:0 0 10px}
.step-intro{margin:0 0 14px;font-size:13px;line-height:1.7;color:#a3b3c3;max-width:820px}
.tasks{list-style:none;margin:0 0 6px;padding:0;max-width:880px}
.tasks li+li{border-top:1px solid #ffffff0a}
.tasks label{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:start;padding:11px 0;cursor:pointer;font-size:13.5px;line-height:1.65;color:#d6dfe6}
.tasks input{position:absolute;opacity:0;pointer-events:none}
.box{display:grid;place-items:center;width:22px;height:22px;margin-top:1px;border-radius:7px;border:1.5px solid #efc19777;background:#ffffff06;transition:background .15s,border-color .15s}
.box-check{width:14px;height:14px;color:#10141c;opacity:0;transition:opacity .15s}
.tasks input:focus-visible+.box{outline:2px solid var(--gold);outline-offset:2px}
.tasks li.done .box{background:#7ee081;border-color:#7ee081}
.tasks li.done .box-check{opacity:1}
.tasks li.done .task-text{color:#7f91a2}
.task-text{overflow-wrap:anywhere}
.task-note{display:block;margin-top:2px;font-size:12px;line-height:1.55;color:#8397a9}
.task-text :deep(b){color:#eef3f7;font-weight:600}
.tasks li.done .task-text :deep(b){color:#9fb0bf}
.task-text :deep(a),.step-intro :deep(a){color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.task-text :deep(code),.step-intro :deep(code){font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;color:#e8d3b5}
.step-extra{margin-top:12px}
.step-nav{display:flex;align-items:center;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid #ffffff12}
.spacer{flex:1}
.finished{display:inline-flex;align-items:center;gap:8px;color:#7ee081;font-size:13px;font-weight:600}
.guide-foot{margin:10px 2px 0;font-size:11px;color:var(--ui-text-muted)}
.guide-foot a{color:var(--gold-soft);text-decoration:underline;text-underline-offset:3px}
.guide-foot.error{color:#f59e8b}
@media (max-width:720px){.step-card{padding:18px 16px}.pill-label{display:none}.pill{padding:0 6px}.pill.current .pill-label{display:inline}.pill.current{padding-right:14px}}
</style>
