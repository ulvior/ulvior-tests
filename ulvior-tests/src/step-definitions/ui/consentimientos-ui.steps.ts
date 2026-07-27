import assert from 'assert'
import { Given, When, Then } from '@cucumber/cucumber'
import { By, until, WebElement } from 'selenium-webdriver'
import { UlviorWorld } from '../../support/world'
import { ENV } from '../../support/env'
import { renderTemplate, setTemplateValue } from '../../utils/template'

function xpathLiteral(value: string): string {
  if (!value.includes("'")) return `'${value}'`
  if (!value.includes('"')) return `"${value}"`
  return `concat('${value.replace(/'/g, "', \"'\", '")}')`
}

function ensureDriver(world: UlviorWorld) {
  assert.ok(world.driver, 'Selenium driver no inicializado. Usa el tag @ui.')
  return world.driver
}

async function visibleElements(driver: ReturnType<typeof ensureDriver>, locator: By): Promise<WebElement[]> {
  const elements = await driver.findElements(locator)
  const visible: WebElement[] = []
  for (const element of elements) {
    try {
      if (await element.isDisplayed()) visible.push(element)
    } catch {
      // Detached element; ignore and let the caller wait again if needed.
    }
  }
  return visible
}

async function clickVisible(world: UlviorWorld, locator: By, label: string) {
  const driver = ensureDriver(world)
  await driver.wait(
    async () => (await visibleElements(driver, locator)).length > 0,
    ENV.SELENIUM_TIMEOUT,
    `No se encontro visible: ${label}`,
  )
  const [element] = await visibleElements(driver, locator)
  await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"})', element)
  await driver.sleep(150)
  try {
    await element.click()
  } catch {
    await driver.executeScript('arguments[0].click()', element)
  }
  await driver.sleep(500)
}

Given('genero una invitacion UI de empresa', async function (this: UlviorWorld) {
  const email = `qa.ui.empresa.${Date.now()}@ulvior.test`

  const login = await this.apiClient.post('/auth/login', {
    email: ENV.TEST_ADMIN_EMAIL,
    password: ENV.TEST_ADMIN_PASSWORD,
  })
  this.lastApiEvidence = login.evidence
  assert.strictEqual(login.response.status, 201, `No se pudo iniciar sesion admin para generar invitacion UI: ${login.response.status}`)

  const invitation = await this.apiClient.post('/admin/invitaciones', { email })
  this.lastApiEvidence = invitation.evidence
  assert.strictEqual(invitation.response.status, 201, `No se pudo generar invitacion UI: ${invitation.response.status}`)

  const code = invitation.response.data?.codigo
  assert.ok(typeof code === 'string' && code.length > 0, 'La invitacion UI no devolvio codigo')
  setTemplateValue('UI_EMPRESA_INVITE_CODE', code)
  setTemplateValue('UI_EMPRESA_INVITE_EMAIL', email)
})

Given('abro el registro de empresa generado para UI', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  const code = renderTemplate('{{UI_EMPRESA_INVITE_CODE}}')
  assert.ok(code && !code.includes('{{'), 'No hay codigo de invitacion UI generado')
  await driver.get(`${ENV.WEB_URL}/registro/empresa/${code}`)
  await driver.wait(until.elementLocated(By.css('body')), ENV.SELENIUM_TIMEOUT)
  await driver.sleep(1200)
})

Then('debo ver checkbox asociado al texto {string}', async function (this: UlviorWorld, text: string) {
  const driver = ensureDriver(this)
  const literal = xpathLiteral(text)
  const locator = By.xpath(`//label[contains(normalize-space(.), ${literal})]//input[@type='checkbox']`)
  await driver.wait(
    async () => (await visibleElements(driver, locator)).length > 0,
    ENV.SELENIUM_TIMEOUT,
    `No se encontro checkbox asociado al texto: ${text}`,
  )
})

When('selecciono la opcion visible {string}', async function (this: UlviorWorld, text: string) {
  const literal = xpathLiteral(text)
  await clickVisible(
    this,
    By.xpath(`//*[self::button or self::label or @role='option'][normalize-space(.)=${literal} or contains(normalize-space(.), ${literal})]`),
    text,
  )
})

Then('la URL no debe contener {string}', async function (this: UlviorWorld, fragment: string) {
  const driver = ensureDriver(this)
  await driver.sleep(500)
  const url = await driver.getCurrentUrl()
  assert.ok(!url.includes(fragment), `La URL no deberia contener ${fragment}: ${url}`)
})
