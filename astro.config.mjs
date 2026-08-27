// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages PROJECT site: the repo is served from https://<user>.github.io/<repo>/
// `site` is the bare origin and `base` is the repo sub-path. Astro joins the two for
// sitemap/canonical URLs; everything else must go through src/lib/url.ts.
export default defineConfig({
  site: 'https://aumniguest.github.io',
  base: '/blog/',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // /search/ is a client-side tool, not content, and is marked noindex.
      filter: (page) => !page.endsWith('/search/'),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
