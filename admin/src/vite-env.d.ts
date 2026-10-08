/// <reference types="vite/client" />

// Typed access to import.meta.env.VITE_* variables from .env
interface ImportMetaEnv {
  readonly VITE_FUNCTIONS_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
