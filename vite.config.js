import {defineConfig} from 'vite';
import {cpSync} from 'node:fs';
export default defineConfig({
  plugins:[{name:'copy-project-guides',closeBundle(){cpSync('outputs','dist/outputs',{recursive:true});}}],
  build:{rollupOptions:{output:{manualChunks(id){if(id.includes('/three/examples/'))return 'three-effects';if(id.includes('/node_modules/three/'))return 'three-core';}}}},
});
