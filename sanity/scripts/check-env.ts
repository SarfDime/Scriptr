import { reportStudioEnvironment } from '../lib/startup-report.ts'

/**
 * Mirrors the env files the Studio CLI loads for the same mode (Vite's order:
 * `.env`, then mode-specific files), so the report describes what the Studio
 * will actually see. A missing file is normal.
 */
const loadEnvFile = (file: string) => {
  try {
    process.loadEnvFile(file)
  } catch {
    // Absent files are expected; the report says which variables ended up unset.
  }
}

const mode = process.argv[2] === 'build' ? 'production' : 'development'

loadEnvFile('.env')
loadEnvFile('.env.local')
if (mode === 'production') {
  loadEnvFile('.env.production')
  loadEnvFile('.env.production.local')
}

reportStudioEnvironment()
