import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// TODO: after the first `wrangler deploy`, replace `site` with the exact
// workers.dev origin (https://<name>.<account>.workers.dev). It is used for
// canonical URLs, Open Graph URLs and the sitemap.
export default defineConfig({
  site: 'https://scrubkit.workers.dev',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
