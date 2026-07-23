import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://margrietprinssen.nl',
  integrations: [
    lit(),
    sitemap({
      // Keep the authenticated admin pages out of the sitemap
      filter: (page) =>
        !page.includes('/add') &&
        !page.includes('/import') &&
        !page.includes('/curate') &&
        !page.includes('/dedupe'),
    }),
  ],
  output: 'static'
});
