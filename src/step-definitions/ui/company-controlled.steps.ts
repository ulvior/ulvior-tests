import assert from 'assert'
import { Then } from '@cucumber/cucumber'
import { ENV } from '../../support/env'
import { UlviorWorld } from '../../support/world'
import { renderTemplate } from '../../utils/template'

async function loginApiAsCompany(world: UlviorWorld) {
  const login = await world.apiClient.post('/auth/login', {
    email: ENV.TEST_EMPRESA_EMAIL,
    password: ENV.TEST_EMPRESA_PASSWORD,
  })
  world.lastApiEvidence = login.evidence
  assert.ok([200, 201].includes(login.response.status), `Login API empresa fallo con ${login.response.status}`)
}

Then('backend empresa debe encontrar busqueda con texto {string}', async function (this: UlviorWorld, expectedText: string) {
  const expected = renderTemplate(expectedText)
  await loginApiAsCompany(this)
  const result = await this.apiClient.get('/empresa/busquedas', { search: expected })
  this.lastApiEvidence = result.evidence
  this.lastResponse = result.response
  assert.strictEqual(result.response.status, 200, `GET /empresa/busquedas fallo con ${result.response.status}`)
  assert.ok(
    JSON.stringify(result.response.data).includes(expected),
    `No se encontro "${expected}" en /empresa/busquedas`,
  )
})
