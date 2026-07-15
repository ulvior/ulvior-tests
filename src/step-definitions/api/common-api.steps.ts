import assert from 'assert'
import { Given, When, Then } from '@cucumber/cucumber'
import { UlviorWorld } from '../../support/world'
import { ApiClient } from '../../utils/api-client'
import { parseJsonTemplate, renderTemplate } from '../../utils/template'

function clientFor(world: UlviorWorld, name: string): ApiClient {
  const normalized = name.toLowerCase()
  if (normalized === 'api') return world.apiClient
  if (normalized === 'ai') return world.aiClient
  throw new Error(`Servicio no soportado: ${name}`)
}

async function request(
  world: UlviorWorld,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
) {
  const client = clientFor(world, (world as any).activeService ?? 'api')
  const renderedPath = renderTemplate(path)

  try {
    const result = await client.request(method, renderedPath, { body })
    world.lastApiEvidence = result.evidence
    world.lastResponse = result.response
  } catch (err: any) {
    if (err.evidence) world.lastApiEvidence = err.evidence
    throw err
  }
}

Given('que uso el servicio {string}', function (this: UlviorWorld, service: string) {
  ;(this as any).activeService = service
})

When('envio GET a {string}', async function (this: UlviorWorld, path: string) {
  await request(this, 'GET', path)
})

When('envio GET a {string} sin JSON', async function (this: UlviorWorld, path: string) {
  await request(this, 'GET', path)
})

When('envio POST a {string} sin JSON', async function (this: UlviorWorld, path: string) {
  await request(this, 'POST', path)
})

When('envio PATCH a {string} sin JSON', async function (this: UlviorWorld, path: string) {
  await request(this, 'PATCH', path)
})

When('envio PUT a {string} sin JSON', async function (this: UlviorWorld, path: string) {
  await request(this, 'PUT', path)
})

When('envio DELETE a {string}', async function (this: UlviorWorld, path: string) {
  await request(this, 'DELETE', path)
})

When('envio DELETE a {string} sin JSON', async function (this: UlviorWorld, path: string) {
  await request(this, 'DELETE', path)
})

When('envio POST a {string} con JSON:', async function (this: UlviorWorld, path: string, docString: string) {
  await request(this, 'POST', path, parseJsonTemplate(docString))
})

When('envio PATCH a {string} con JSON:', async function (this: UlviorWorld, path: string, docString: string) {
  await request(this, 'PATCH', path, parseJsonTemplate(docString))
})

Then('el status HTTP debe ser {int}', function (this: UlviorWorld, status: number) {
  assert.strictEqual(this.lastResponse?.status, status)
})

Then('el status HTTP debe ser uno de {string}', function (this: UlviorWorld, statuses: string) {
  const allowed = statuses.split(',').map(s => Number(s.trim()))
  assert.ok(
    allowed.includes(this.lastResponse?.status),
    `Status ${this.lastResponse?.status} no esta en ${allowed.join(', ')}`,
  )
})

Then('la respuesta debe contener la propiedad {string}', function (this: UlviorWorld, propertyPath: string) {
  const value = propertyPath.split('.').reduce((acc, key) => acc?.[key], this.lastResponse?.data)
  assert.notStrictEqual(value, undefined, `No existe la propiedad ${propertyPath}`)
})

Then('guardo el token de la respuesta desde {string}', function (this: UlviorWorld, propertyPath: string) {
  const token = propertyPath.split('.').reduce((acc, key) => acc?.[key], this.lastResponse?.data)
  assert.ok(typeof token === 'string' && token.length > 0, `No se encontro token en ${propertyPath}`)
  this.token = token
  this.apiClient.setToken(token)
  this.aiClient.setToken(token)
})
