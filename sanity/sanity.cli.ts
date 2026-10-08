import {
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from '@shared/config/sanity-constants'
import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? SANITY_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? SANITY_DATASET,
  },
  deployment: {
    appId: 'REDACTED_SANITY_APP_ID',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
  typegen: {
    enabled: true,
    schema: 'schema.json',
    generates: '../shared/types/sanity.types.ts',
    path: '../next/sanity/queries/**/*.{ts,tsx}',
    overloadClientMethods: true,
  },
  reactStrictMode: true,
  // reactCompiler: true,
})
