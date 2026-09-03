import './styles/main.css'

import { dashboardTool } from '@sanity/dashboard'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import { netlifyWidget } from 'sanity-plugin-dashboard-widget-netlify'
import { media } from 'sanity-plugin-media'
import { references } from 'sanity-plugin-references'
import { smartAssetManager } from 'sanity-plugin-smart-asset-manager'
import { CustomDuplicateAction } from './actions/customDuplicate'
import { CustomToolMenu } from './components/CustomToolMenu'
import { defaultDocumentNode } from './defaultDocumentNode'
import { PortableTextPlugins } from './schemas/portable-text/plugins/plugins'
import { schemaTypes } from './schemaTypes'
import { customStructureTool } from './structure-tool/structure-tool'

export default defineConfig({
  name: 'scriptr',
  title: 'Scriptr',

  projectId: 'REDACTED_SANITY_PROJECT_ID',
  dataset: 'production',

  reactStrictMode: true,
  babel: { reactCompiler: true },
  reactCompilerOptions: { target: '19' },
  form: {
    components: {
      portableText: PortableTextPlugins,
    },
  },

  beta: {
    create: {
      startInCreateEnabled: false,
    },
  },

  plugins: [
    structureTool({
      structure: customStructureTool,
      defaultDocumentNode,
    }),
    smartAssetManager(),
    media(),
    visionTool(),
    references(),
    presentationTool({
      previewUrl: {
        origin: // TODO: Change this when staging is live
          process.env.SANITY_STUDIO_PREVIEW_ORIGIN ??
          'https://staging-tontine-com.netlify.app/',
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
    dashboardTool({
      title: 'Deploy',
      widgets: [
        netlifyWidget({
          sites: [
            {
              // TODO: Change this when staging is live and add prod deploy also
              title: 'Placeholder',
              name: 'tontine-production',
              url: 'https://tontine.com/',
              apiId: 'f0567eac-c53b-4ad88bb29e9',
              buildHookId: '6435968097f4af',
              branch: 'production',
            },
          ],
        }),
      ],
    }),
  ],
  document: {
    comments: {
      enabled: false,
    },
    actions: (prev) => {
      const withCustomDuplicate = prev?.map((originalAction) =>
        originalAction?.action === 'duplicate'
          ? CustomDuplicateAction
          : originalAction
      )
      return withCustomDuplicate
    },
  },
  releases: {
    enabled: false,
  },
  scheduledDrafts: {
    enabled: false,
  },
  tasks: {
    enabled: false,
  },
  scheduledPublishing: {
    enabled: false,
  },
  announcements: {
    enabled: false,
  },
  schema: {
    types: schemaTypes,
  },
  studio: {
    components: {
      toolMenu: CustomToolMenu,
    },
  },
})
