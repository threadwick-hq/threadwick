/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override for the "Open Studio" CTA destination. See src/config.ts. */
  readonly VITE_STUDIO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
