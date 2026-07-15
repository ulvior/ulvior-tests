import * as fs from 'fs'
import * as path from 'path'
import { ENV } from '../support/env'

export type E2EState = Record<string, any>

const STATE_DIR = path.resolve(__dirname, '../../e2e-reports', ENV.E2E_RUN_ID, 'api-responses')
const STATE_FILE = path.join(STATE_DIR, 'e2e-runtime-state.json')

export function loadE2EState(): E2EState {
  if (!fs.existsSync(STATE_FILE)) return {}
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
}

export function saveE2EState(next: E2EState): E2EState {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2))
  return next
}

export function patchE2EState(patch: E2EState): E2EState {
  const next = { ...loadE2EState(), ...patch, updatedAt: new Date().toISOString() }
  return saveE2EState(next)
}

export function getE2EStateValue<T = any>(key: string): T | undefined {
  return loadE2EState()[key]
}
