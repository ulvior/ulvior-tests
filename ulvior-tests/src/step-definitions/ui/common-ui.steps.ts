import assert from 'assert'
import { Given, When, Then } from '@cucumber/cucumber'
import { By, until } from 'selenium-webdriver'
import { UlviorWorld } from '../../support/world'
import { PublicPage } from '../../pages/PublicPage'
import { LoginPage } from '../../pages/LoginPage'
import { renderTemplate } from '../../utils/template'

function page(world: UlviorWorld): PublicPage {
  assert.ok(world.driver, 'Selenium driver no inicializado. Usa el tag @ui.')
  return new PublicPage(world.driver)
}

function xpathLiteral(value: string): string {
  if (!value.includes("'")) return `'${value}'`
  if (!value.includes('"')) return `"${value}"`
  return `concat('${value.replace(/'/g, "', \"'\", '")}')`
}

Given('abro la pagina {string}', async function (this: UlviorWorld, path: string) {
  await page(this).open(path)
})

Given('abro el login', async function (this: UlviorWorld) {
  assert.ok(this.driver, 'Selenium driver no inicializado. Usa el tag @ui.')
  await new LoginPage(this.driver).open()
})

When('completo el input {string} con {string}', async function (this: UlviorWorld, label: string, value: string) {
  const p = page(this)
  const rendered = renderTemplate(value)
  const labelLiteral = xpathLiteral(label)
  const locator = By.xpath(
    `//label[contains(normalize-space(.), ${labelLiteral})]/following::input[1] | ` +
    `//input[@name=${labelLiteral} or @placeholder=${labelLiteral} or @aria-label=${labelLiteral}]`,
  )
  await p.type(locator, rendered)
})

When('hago click en el boton {string}', async function (this: UlviorWorld, text: string) {
  const p = page(this)
  const locator = By.xpath(`//button[contains(normalize-space(.), ${xpathLiteral(text)})]`)
  await p.click(locator)
})

When('hago click en el enlace {string}', async function (this: UlviorWorld, text: string) {
  const p = page(this)
  const locator = By.xpath(`//a[contains(normalize-space(.), ${xpathLiteral(text)})]`)
  await p.click(locator)
})

Then('debo ver el texto {string}', async function (this: UlviorWorld, text: string) {
  assert.ok(await page(this).hasText(text), `No se encontro el texto visible: ${text}`)
})

Then('debo ver el boton {string}', async function (this: UlviorWorld, text: string) {
  assert.ok(await page(this).hasButton(text), `No se encontro el boton visible: ${text}`)
})

Then('la URL debe contener {string}', async function (this: UlviorWorld, fragment: string) {
  assert.ok(this.driver, 'Selenium driver no inicializado. Usa el tag @ui.')
  await this.driver.wait(async () => {
    const url = await this.driver!.getCurrentUrl()
    return url.includes(fragment)
  }, 10000, `La URL no contiene ${fragment}`)
})

Then('espero que la pagina termine de cargar', async function (this: UlviorWorld) {
  assert.ok(this.driver, 'Selenium driver no inicializado. Usa el tag @ui.')
  await this.driver.wait(until.elementLocated(By.css('body')), 10000)
  await this.driver.sleep(600)
})
