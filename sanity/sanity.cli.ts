import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'REDACTED_SANITY_PROJECT_ID',
    dataset: 'production',
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
  typegen: {
    enabled: true,
    schema: 'schema.json',
    generates: '../next/sanity.types.ts',
    path: '../next/**/*.{ts,tsx}',
    overloadClientMethods: true,
  },
})
