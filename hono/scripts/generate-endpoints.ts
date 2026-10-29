/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: <Needed since the code uses template literals for dynamic paths with dynamic segments like :id> */

import { QUERY_CONFIG } from '@scriptr/shared/config/api'
import { camelCase, capitalize } from '@shared/utils/common-utils'
import fs from 'fs'
import path from 'path'
import { app } from '../src'

function getLeafName(segments: Array<string>) {
  if (segments.length === 0) return 'index'
  const nameParts: Array<string> = []
  const paramParts: Array<string> = []

  for (const seg of segments) {
    if (seg.startsWith(':')) paramParts.push(camelCase(seg.slice(1)))
    else nameParts.push(camelCase(seg))
  }

  if (nameParts.length === 0)
    return `by${paramParts.map(capitalize).join('And')}`

  let baseName = nameParts.map((s, i) => (i === 0 ? s : capitalize(s))).join('')
  if (paramParts.length > 0)
    baseName += `By${paramParts.map(capitalize).join('And')}`
  return baseName
}

function generateApiRoutes() {
  const uniquePaths = Array.from(new Set(app.routes.map((r) => r.path)))
    .filter((p) => {
      if (!p.includes('*')) return true

      const parts = p.split('/').filter(Boolean)
      const isApi = parts[0] === 'api'
      const trailingSegments = isApi ? parts.slice(1) : parts

      if (
        trailingSegments.includes('*') &&
        trailingSegments.indexOf('*') <= 1
      ) {
        return false
      }

      return true
    })
    .map((p) => (p.endsWith('/*') ? p.replace('/*', '/:key') : p))

  const unionMembers = uniquePaths
    .map((p) => {
      const hasParam = p.includes(':')
      if (hasParam) {
        const templatePath = p.replace(/:[^/]+/g, '${string}')
        return `  | \`${templatePath}\``
      }
      return `  | '${p}'`
    })
    .join('\n')

  let output = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY\n\n`

  output += `import type { RatingTargetType } from './api'\n\n`

  output += `export type ApiEndpoint =\n${unionMembers};\n\n`

  output += `export function withQuery(
  path: ApiEndpoint,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (!params) return path
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) => \`\${encodeURIComponent(k)}=\${encodeURIComponent(String(v))}\`
    )
    .join('&')
  return query ? (\`\${path}?\${query}\` as const) : path
}\n\n`

  const routeGroups: Record<
    string,
    Array<{ path: string; params: Array<string>; name: string }>
  > = {}

  for (const p of uniquePaths) {
    const parts = p.split('/').filter(Boolean)
    const isApi = parts[0] === 'api'
    const namespace = isApi ? parts[1] : parts[0]
    const trailingSegments = isApi ? parts.slice(2) : parts.slice(1)

    if (!namespace) continue
    if (!routeGroups[namespace]) routeGroups[namespace] = []

    const params = trailingSegments
      .filter((seg) => seg.startsWith(':'))
      .map((seg) => seg.slice(1))

    routeGroups[namespace].push({
      path: p,
      params,
      name: getLeafName(trailingSegments),
    })
  }

  output += `export const apiRoutes = {\n`

  for (const [namespace, routes] of Object.entries(routeGroups)) {
    output += `  ${camelCase(namespace)}: {\n`

    for (const route of routes) {
      const queryConf = QUERY_CONFIG[route.path]

      if (queryConf) {
        if (route.params.length > 0) {
          const pathArgs = route.params
            .map((p) => `${camelCase(p)}: string | number`)
            .join(', ')
          const templatePath = route.path.replace(/:([a-zA-Z0-9_]+)/g, '${$1}')
          output += `    ${route.name}: (${pathArgs}, ${queryConf.args}) => withQuery(\`${templatePath}\`, ${queryConf.paramsObj}),\n`
        } else {
          output += `    ${route.name}: (${queryConf.args}) => withQuery('${route.path}', ${queryConf.paramsObj}),\n`
        }
      } else if (route.params.length > 0) {
        const args = route.params
          .map((p) => `${camelCase(p)}: string | number`)
          .join(', ')
        const templatePath = route.path.replace(/:([a-zA-Z0-9_]+)/g, '${$1}')
        output += `    ${route.name}: (${args}) => \`${templatePath}\` as const,\n`
      } else {
        output += `    ${route.name}: '${route.path}',\n`
      }
    }
    output += `  },\n`
  }
  output += `} as const;\n\n`
  output += `export type ApiRoutes = typeof apiRoutes;\n`

  // Resolved from this file, not the cwd: `pnpm --filter @scriptr/api exec`
  // runs scripts from `hono/`, not the repo root.
  const outputPath = path.resolve(
    import.meta.dirname,
    '../../shared/config/api-routes.ts'
  )
  fs.writeFileSync(outputPath, output)
  // biome-ignore lint/suspicious/noConsole: console log for successful generation
  console.log(`✅ Generated API routes successfully to ${outputPath}`)
}

generateApiRoutes()
