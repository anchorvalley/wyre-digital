// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',

  build: {
    format: 'directory',
  },
  vite: {
    ssr: {
      noExternal: ['@notionhq/client', 'notion-to-md'],
    },
  },
});
