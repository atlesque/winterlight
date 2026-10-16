<script setup>
import {createScene} from '~~/src/scene.js';
import {createOriginalScene} from '~~/src/original/scene.js';
import {HOUSES} from '~/composables/useShowPlayer.js';

// One page, both houses: the original filmed house and ours run the same
// channels, the same detected cue file and the same video clock. The toggle
// shows one of them or both stacked; src/props.js places each prop on ours.
const SITE='https://winterlight.alexander-df0.workers.dev';
const TITLE='Winterlight · 3D Christmas light show synced to Wizards in Winter';
const DESCRIPTION='An interactive 3D Christmas light show synced to Wizards in Winter. Switch between the original filmed house and a Belgian house running the same show prop for prop, or watch both in split view.';
const ORIGINAL_CUES="Prop brightness is detected from the original video, one value per frame. The lights follow that video, or its soundtrack if the video isn't loaded.";
const houses={
 original:{createScene:createOriginalScene,page:{label:'3D model of the original filmed house',heading:'h2',title:'Original house',subtitle:'3D model traced from the filmed video',
  overlayNote:'Lights from the model over the original video, lined up frame by frame. Difference turns matching light dark.'}},
 ours:{createScene,page:{label:"3D model of our house with the original show's props",heading:'h1',title:'Our house',subtitle:'Same props and timing as the original'}},
};
const modes={
 ours:{title:TITLE,videoView:'Street view',scaleTag:'Concept dimensions · facade and garden props',
  cueNote:`Each prop on our house matches one in the original and uses its timing. ${ORIGINAL_CUES}`,
  allOnHint:'Every prop lit at full brightness'},
 original:{title:'Winterlight · The original Wizards in Winter house in 3D',videoView:'Video view',scaleTag:'Layout traced from the filmed show · dimensions estimated',
  cueNote:ORIGINAL_CUES,allOnHint:'Reference: compare with the final frame of the video'},
 split:{title:TITLE,videoView:'Front view',scaleTag:'Original on top · our house below',
  cueNote:`${ORIGINAL_CUES} Both houses use the same values.`,allOnHint:'Every prop lit at full brightness on both houses'},
};
const TOGGLE=[{mode:'ours',label:'Our house',icon:'i-lucide-house'},{mode:'original',label:'Original',icon:'i-lucide-film'},{mode:'split',label:'Split view',icon:'i-lucide-rows-2'}];

const player=useShowPlayer({houses,modes});
const {el,state,page}=player;

const IMAGE=`${SITE}/og-image.jpg`;
useHead({
 title:()=>page.value.title,
 link:[{rel:'canonical',href:`${SITE}/`}],
 script:[{type:'application/ld+json',innerHTML:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'Winterlight',url:`${SITE}/`,description:DESCRIPTION,image:IMAGE,inLanguage:'en'})}],
});
useSeoMeta({
 description:DESCRIPTION,ogType:'website',ogSiteName:'Winterlight',ogLocale:'en_GB',ogTitle:TITLE,ogDescription:DESCRIPTION,ogUrl:`${SITE}/`,
 ogImage:IMAGE,ogImageType:'image/jpeg',ogImageWidth:1200,ogImageHeight:630,ogImageAlt:'3D model of a house with a wireframe Christmas tree, a peace sign, Christmas circles and HAPPY HOLIDAYS letters lit up',
 twitterCard:'summary_large_image',twitterTitle:TITLE,twitterDescription:DESCRIPTION,twitterImage:IMAGE,
});
</script>

<template>
  <div id="app" class="show-page">
    <FestiveSky />
    <AppHeader>
      <div class="house-toggle" role="group" aria-label="House">
        <button v-for="t in TOGGLE" :key="t.mode" :data-mode="t.mode" :aria-pressed="state.mode===t.mode" @click="player.setMode(t.mode)">
          <UIcon :name="t.icon" class="toggle-icon" />{{ t.label }}
        </button>
      </div>
    </AppHeader>

    <main class="show-main">
      <section class="stage" :class="{overlay:state.overlayOn}" :data-mode="state.mode" aria-label="3D light show">
        <div class="panes">
          <section v-for="id in HOUSES" v-show="player.shows(id)" :id="`pane-${id}`" :key="id"
            :ref="id==='original'?(e=>{el.originalPane.value=e;}):undefined"
            class="pane" :class="{overlay:id==='original'&&state.overlayOn,difference:id==='original'&&state.overlayDiff}"
            :style="id==='original'?{'--model-mix':state.overlayMix/100}:undefined" :data-house="id" :aria-label="houses[id].page.label">
            <canvas v-if="id==='original'" id="overlay-video" :ref="e=>{el.overlayCanvas.value=e;}" class="overlay-video" :hidden="!state.overlayOn" />
            <div :id="`viewport-${id}`" :ref="e=>{el.viewports[id].value=e;}" class="viewport" />
            <div class="scene-heading">
              <component :is="houses[id].page.heading" class="eyebrow scene-title"><span class="dot" /> {{ houses[id].page.title }}</component>
              <p>{{ houses[id].page.subtitle }}</p>
            </div>
            <div v-if="id==='original'" v-show="state.overlayOn" id="overlay-controls" class="overlay-controls">
              <label class="mix">Model opacity <USlider v-model="state.overlayMix" :min="0" :max="100" size="xs" class="w-28" aria-label="Model opacity" /></label>
              <UCheckbox v-model="state.overlayDiff" label="Difference" size="xs" />
              <small id="overlay-note">{{ state.overlayNote }}</small>
            </div>
          </section>
        </div>
        <div class="scene-controls">
          <UButton id="view-video" size="xs" color="neutral" variant="soft" icon="i-lucide-scan-eye" :label="page.videoView" @click="player.pressView('video')" />
          <UButton id="view-orbit" size="xs" color="neutral" variant="soft" icon="i-lucide-trees" label="Garden view" @click="player.pressView('orbit')" />
          <UButton id="view-yard" size="xs" color="neutral" variant="soft" icon="i-lucide-footprints" label="Yard view" @click="player.pressView('yard')" />
          <UButton v-show="player.shows('original')" id="view-overlay" size="xs" :color="state.overlayOn?'primary':'neutral'" :variant="state.overlayOn?'subtle':'soft'" icon="i-lucide-layers" label="Overlay video" :aria-pressed="state.overlayOn" @click="player.pressView('overlay')" />
        </div>
        <div class="scene-footer"><span>Drag to orbit · Scroll to zoom · ← → step one frame</span><span id="scale-tag" class="scale-tag">{{ page.scaleTag }}</span></div>
        <div v-if="state.sceneError" id="scene-error">{{ state.sceneError }}</div>
      </section>

      <aside class="sidebar">
        <a class="cost-link" href="/costs.html"><UIcon name="i-lucide-gift" /> LED cost estimate <UIcon name="i-lucide-arrow-right" /></a>

        <div class="source-card">
          <span class="music-icon"><UIcon name="i-lucide-music-4" /></span>
          <div><strong>Wizards in Winter <InfoTip :text="page.cueNote" label="How the timing works" /></strong><small id="cue-info">{{ state.cueInfo }}</small></div>
          <UBadge id="cue-chip" :label="state.cueChip" color="primary" variant="subtle" size="sm" class="chip" />
        </div>

        <div class="video-panel">
          <video id="video" :ref="e=>{el.video.value=e;}" playsinline preload="auto" muted />
          <div v-show="state.videoEmpty" id="video-empty" class="video-empty">
            <div class="load-row">
              <label class="load-video"><UIcon name="i-lucide-upload" /> Load the original video<input id="video-file" :ref="e=>{el.videoFile.value=e;}" type="file" accept="video/mp4,video/*" @change="player.pickVideo"></label>
              <InfoTip text="Your MP4 of the official video. It stays on this computer and is remembered in this browser." label="About loading the video" />
            </div>
          </div>
        </div>
        <p class="note video-status"><span id="video-status">{{ state.videoStatus }}</span> <button v-show="state.videoChange" id="video-change" class="text-button" @click="player.changeVideo">Change video</button></p>
        <p v-if="state.playbackError" id="cue-note" class="note">{{ state.playbackError }}</p>

        <div class="settings">
          <label class="range-label" for="brightness">Light intensity <span id="brightness-value">{{ state.brightness }}%</span></label>
          <USlider id="brightness" v-model="state.brightness" :min="5" :max="100" size="sm" aria-label="Light intensity" />
          <div class="switch-row">
            <span class="label-with-tip">All props on <InfoTip :text="page.allOnHint" label="About all props on" /></span>
            <USwitch id="all-on" v-model="state.allOn" aria-label="All props on" />
          </div>
        </div>
        <div class="field-title">Props <span id="frame-label" class="note">{{ state.frameLabel }}</span></div>
        <PropBoard :ref="e=>{el.board.value=e;}" />
      </aside>
    </main>

    <footer class="transport">
      <button id="play" class="play-button" :class="{playing:state.playing}" :aria-label="state.playing?'Pause show':'Play show'" :disabled="!state.ready" @click="player.togglePlay">
        <UIcon :name="state.playing?'i-lucide-pause':'i-lucide-play'" />
      </button>
      <UButton id="restart" icon="i-lucide-rotate-ccw" color="neutral" variant="ghost" size="lg" aria-label="Restart show" @click="player.restart" />
      <div class="frame-step">
        <UButton id="frame-back" icon="i-lucide-chevron-left" color="neutral" variant="soft" size="xs" aria-label="Back one frame" title="Back one frame (←)" @click="player.step(-1)" />
        <span id="frame-number" class="frame-number" title="Video frame">{{ state.frame }}</span>
        <UButton id="frame-forward" icon="i-lucide-chevron-right" color="neutral" variant="soft" size="xs" aria-label="Forward one frame" title="Forward one frame (→)" @click="player.step(1)" />
      </div>
      <div class="timeline-wrap">
        <div class="timeline-top"><strong id="range-name">{{ state.rangeName }}</strong><span><b id="time">{{ state.time }}</b> / <span id="duration">{{ state.duration }}</span></span></div>
        <input id="timeline" :ref="e=>{el.timeline.value=e;}" class="timeline" type="range" aria-label="Show position" min="0" max="185" step="0.01" value="0"
          @pointerdown="player.scrubStart" @input="player.scrub" @change="player.scrubDone">
        <div class="timeline-labels"><span id="range-start">{{ state.rangeStart }}</span><span id="range-end">{{ state.rangeEnd }}</span></div>
      </div>
      <label class="volume" aria-label="Volume"><UIcon name="i-lucide-volume-2" /><USlider id="volume" v-model="state.volume" :min="0" :max="100" size="xs" aria-label="Volume" /></label>
    </footer>
    <audio id="audio" :ref="e=>{el.audio.value=e;}" preload="metadata" src="/media/wizards-in-winter.m4a" />
  </div>
</template>
