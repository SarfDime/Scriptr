import { defineCliConfig } from 'sanity/cli'
import { sanityAppId, sanityDataset, sanityProjectId } from './env'

export default defineCliConfig({
  api: {
    projectId: sanityProjectId,
    dataset: sanityDataset,
  },
  deployment: {
    ...(sanityAppId ? { appId: sanityAppId } : {}),
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
