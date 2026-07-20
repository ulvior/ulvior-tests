import { ENV } from '../support/env'

const values: Record<string, string> = {
  API_URL: ENV.API_URL,
  AI_URL: ENV.AI_URL,
  WEB_URL: ENV.WEB_URL,
  TEST_EMPRESA_EMAIL: ENV.TEST_EMPRESA_EMAIL,
  TEST_EMPRESA_PASSWORD: ENV.TEST_EMPRESA_PASSWORD,
  TEST_CANDIDATO_EMAIL: ENV.TEST_CANDIDATO_EMAIL,
  TEST_CANDIDATO_PASSWORD: ENV.TEST_CANDIDATO_PASSWORD,
  TEST_ADMIN_EMAIL: ENV.TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD: ENV.TEST_ADMIN_PASSWORD,
  INTERNAL_API_TOKEN: ENV.INTERNAL_API_TOKEN,
  E2E_RUN_ID: ENV.E2E_RUN_ID,
}

export function setTemplateValue(key: string, value: string): void {
  values[key] = value
}

export function renderTemplate(input: string): string {
  return input.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_, key) => values[key] ?? '')
}

export function parseJsonTemplate(input: string): unknown {
  return JSON.parse(renderTemplate(input))
}
