import './styles/main.css'

import { dashboardTool } from '@sanity/dashboard'
import { visionTool } from '@sanity/vision'
import { ACADEMIC_TYPES, type AcademicEntityType } from '@shared/config/api'
import { defineConfig } from 'sanity'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import { netlifyWidget } from 'sanity-plugin-dashboard-widget-netlify'
import { media } from 'sanity-plugin-media'
import { mermaidContentModel } from 'sanity-plugin-mermaid-content-model'
import { references } from 'sanity-plugin-references'
import { smartAssetManager } from 'sanity-plugin-smart-asset-manager'
import {
  createCheckedDeleteAction,
  createCheckedPublishAction,
  createDeleteInDatabaseAction,
  createInDatabaseAction,
  syncWithDatabaseAction,
} from './actions/academicEntitySync'
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
    mermaidContentModel(),
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
    actions: (prev, context) => {
      if (!ACADEMIC_TYPES.includes(context.schemaType as AcademicEntityType)) {
        return prev
      }

      const entityType = context.schemaType as AcademicEntityType

      const originalPublish = prev.find((action) => action.action === 'publish')

      const checkedPublish = originalPublish
        ? createCheckedPublishAction(originalPublish)
        : null
      const createInDb = createInDatabaseAction(entityType)
      const syncWithDb = syncWithDatabaseAction(entityType)
      const checkedDelete = createCheckedDeleteAction(entityType)
      const deleteInDb = createDeleteInDatabaseAction(entityType)
      const customDuplicate = CustomDuplicateAction

      // - When dbId is missing: `createInDb` is index 0 -> renders as the Main Button.
      // - When dbId exists: `createInDb` returns null, so `publish` becomes index 0 -> renders as the Main Button.
      return [
        createInDb,
        checkedPublish,
        syncWithDb,
        checkedDelete,
        deleteInDb,
        customDuplicate,
      ].filter((action): action is NonNullable<typeof action> =>
        Boolean(action)
      )
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
