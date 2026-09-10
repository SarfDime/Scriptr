declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ANALYZE?: string
      NEXT_PUBLIC_API_URL?: string
      NEXT_PUBLIC_ENVIRONMENT_TYPE?: string
      NEXT_PUBLIC_SANITY_DATASET?: string
      NEXT_PUBLIC_SANITY_PROJECT_ID?: string
      SANITY_AUTH_TOKEN?: string
      REVALIDATE_SECRET?: string
    }
  }
}

export {}
