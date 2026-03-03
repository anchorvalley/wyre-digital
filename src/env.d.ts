/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NOTION_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
