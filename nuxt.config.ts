import {fileURLToPath} from 'node:url';

// The site is generated as static files (nuxt generate) into dist/, which
// wrangler.jsonc serves as Cloudflare Workers Static Assets, as before.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-09',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: {enabled: false},
  telemetry: false,
  app: {
    head: {
      htmlAttrs: {lang: 'en', class: 'dark'},
      // viewport-fit=cover exposes the safe-area insets the floating play bar uses on phones.
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [{name: 'theme-color', content: '#0a1120'}],
      link: [
        {rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml'},
        {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
      ],
    },
  },
  colorMode: {preference: 'dark', fallback: 'dark'},
  // Fonts are self-hosted from @fontsource packages (main.css), so builds need no font API.
  ui: {fonts: false, theme: {colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral']}},
  // Icons are bundled into the client, so the static site never asks an icon API.
  icon: {provider: 'none', clientBundle: {scan: true, icons: ['lucide:play', 'lucide:pause']}},
  nitro: {
    preset: 'static',
    output: {publicDir: fileURLToPath(new URL('./dist', import.meta.url))},
    // The detected cue file and the project guides are served from /outputs, as before.
    publicAssets: [{dir: fileURLToPath(new URL('./outputs', import.meta.url)), baseURL: '/outputs', maxAge: 0}],
    prerender: {routes: ['/', '/costs'], autoSubfolderIndex: false, crawlLinks: false},
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 900,
    },
  },
});
