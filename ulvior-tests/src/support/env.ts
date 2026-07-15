// ─── src/support/env.ts ──────────────────────────────────────────────────────
// Load environment variables from .env.local before anything else.

import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

export const ENV = {
  API_URL:                process.env.API_URL               ?? 'http://localhost:3000',
  AI_URL:                 process.env.AI_URL                ?? 'http://localhost:8000',
  WEB_URL:                process.env.WEB_URL               ?? 'http://localhost:5173',

  TEST_EMPRESA_EMAIL:     process.env.TEST_EMPRESA_EMAIL    ?? '',
  TEST_EMPRESA_PASSWORD:  process.env.TEST_EMPRESA_PASSWORD ?? '',

  TEST_CANDIDATO_EMAIL:   process.env.TEST_CANDIDATO_EMAIL  ?? '',
  TEST_CANDIDATO_PASSWORD:process.env.TEST_CANDIDATO_PASSWORD ?? '',

  TEST_ADMIN_EMAIL:       process.env.TEST_ADMIN_EMAIL      ?? '',
  TEST_ADMIN_PASSWORD:    process.env.TEST_ADMIN_PASSWORD   ?? '',
  INTERNAL_API_TOKEN:     process.env.INTERNAL_API_TOKEN    ?? '',
  E2E_RUN_ID:             process.env.E2E_RUN_ID            ?? 'E2E-20260713-ULVIOR-QA-001',

  HEADLESS:               process.env.HEADLESS !== 'false',
  SELENIUM_TIMEOUT:       parseInt(process.env.SELENIUM_TIMEOUT ?? '30000', 10),
  BROWSER_WIDTH:          parseInt(process.env.BROWSER_WIDTH ?? '1920', 10),
  BROWSER_HEIGHT:         parseInt(process.env.BROWSER_HEIGHT ?? '1200', 10),
  BROWSER_MAXIMIZE:       process.env.BROWSER_MAXIMIZE !== 'false',
}
