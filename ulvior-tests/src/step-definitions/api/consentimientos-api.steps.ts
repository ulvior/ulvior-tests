import assert from 'assert'
import { Then } from '@cucumber/cucumber'
import { UlviorWorld } from '../../support/world'

// Acepta tanto la respuesta de GET /candidato/privacidad (lista completa en
// `consentimientos`) como la respuesta puntual de otorgar/revocar (un solo
// objeto `{ tipo, otorgado, ... }`), ya que ambas aparecen en los escenarios.
Then('el consentimiento {string} debe estar {string}', function (this: UlviorWorld, tipo: string, estadoEsperado: string) {
  const data = this.lastResponse?.data as any
  const lista = data?.consentimientos as Array<{ tipo: string; otorgado: boolean }> | undefined

  const fila = Array.isArray(lista)
    ? lista.find((c) => c.tipo === tipo)
    : data?.tipo === tipo ? data : undefined

  assert.ok(fila, `No se encontro el consentimiento de tipo "${tipo}" en la respuesta`)

  const esperado = estadoEsperado === 'otorgado'
  assert.strictEqual(
    fila.otorgado,
    esperado,
    `El consentimiento "${tipo}" deberia estar ${estadoEsperado} pero otorgado=${fila.otorgado}`,
  )
})
