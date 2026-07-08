import assert from 'assert'
import { Given, When, Then } from '@cucumber/cucumber'
import { By, until, WebElement } from 'selenium-webdriver'
import { UlviorWorld } from '../../support/world'
import { LoginPage } from '../../pages/LoginPage'
import { ENV } from '../../support/env'

const ROLE_HOME: Record<string, string> = {
  admin: '/admin/dashboard',
  empresa: '/empresa/dashboard',
  candidato: '/candidato/home',
}

const ROLE_CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: { email: ENV.TEST_ADMIN_EMAIL, password: ENV.TEST_ADMIN_PASSWORD },
  empresa: { email: ENV.TEST_EMPRESA_EMAIL, password: ENV.TEST_EMPRESA_PASSWORD },
  candidato: { email: ENV.TEST_CANDIDATO_EMAIL, password: ENV.TEST_CANDIDATO_PASSWORD },
}

const RENDER_ERROR_PATTERNS = [
  'Unhandled Runtime Error',
  'Application error',
  'Cannot read properties',
  'ReferenceError:',
  'TypeError:',
  'Error: Failed prop type',
  '1 of 1 error',
  'Module not found',
]

function normalizeRole(role: string): string {
  return role.trim().toLowerCase()
}

function xpathLiteral(value: string): string {
  if (!value.includes("'")) return `'${value}'`
  if (!value.includes('"')) return `"${value}"`
  return `concat('${value.replace(/'/g, "', \"'\", '")}')`
}

function ensureDriver(world: UlviorWorld) {
  assert.ok(world.driver, 'Selenium driver no inicializado. Usa el tag @ui.')
  return world.driver
}

async function bodyText(world: UlviorWorld): Promise<string> {
  const driver = ensureDriver(world)
  await driver.wait(until.elementLocated(By.css('body')), ENV.SELENIUM_TIMEOUT)
  return driver.findElement(By.css('body')).then((el) => el.getText())
}

async function waitForAppSettled(world: UlviorWorld) {
  const driver = ensureDriver(world)
  await driver.wait(async () => {
    const ready = await driver.executeScript('return document.readyState')
    return ready === 'complete' || ready === 'interactive'
  }, ENV.SELENIUM_TIMEOUT)
  await driver.sleep(900)
}

async function visibleElements(driver: ReturnType<typeof ensureDriver>, locator: By): Promise<WebElement[]> {
  const elements = await driver.findElements(locator)
  const visible: WebElement[] = []
  for (const element of elements) {
    try {
      if (await element.isDisplayed()) visible.push(element)
    } catch {
      // element detached, ignore it and let the caller decide.
    }
  }
  return visible
}

async function clickFirstVisible(world: UlviorWorld, locator: By, label: string) {
  const driver = ensureDriver(world)
  await driver.wait(async () => (await visibleElements(driver, locator)).length > 0, ENV.SELENIUM_TIMEOUT, `No se encontro visible: ${label}`)
  const [element] = await visibleElements(driver, locator)
  await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"})', element)
  await driver.sleep(200)
  try {
    await element.click()
  } catch {
    await driver.executeScript('arguments[0].click()', element)
  }
}

async function assertNoRenderErrors(world: UlviorWorld) {
  const driver = ensureDriver(world)
  const text = await bodyText(world)
  const url = await driver.getCurrentUrl()
  const error = RENDER_ERROR_PATTERNS.find((pattern) => text.includes(pattern))
  assert.ok(!error, `La pantalla tiene error de render "${error}" en ${url}`)
  assert.ok(text.trim().length > 0, `La pantalla no renderizo contenido visible en ${url}`)
}

function getBadgeCountFromText(text: string): number {
  const match = text.match(/(\d+|99\+)/)
  if (!match) return 0
  return match[1] === '99+' ? 99 : Number(match[1])
}

Given('inicio sesion como {string}', async function (this: UlviorWorld, role: string) {
  const driver = ensureDriver(this)
  const normalized = normalizeRole(role)
  const credentials = ROLE_CREDENTIALS[normalized]
  assert.ok(credentials, `Rol no soportado para login UI: ${role}`)
  assert.ok(credentials.email && credentials.password, `Credenciales UI no configuradas para ${role}`)

  await new LoginPage(driver).open()
  await new LoginPage(driver).fillEmail(credentials.email)
  await new LoginPage(driver).fillPassword(credentials.password)
  await new LoginPage(driver).submit()

  const expectedHome = ROLE_HOME[normalized]
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl()
    return url.includes(expectedHome) || (!url.includes('/login') && !url.includes('/unauthorized'))
  }, ENV.SELENIUM_TIMEOUT, `Login UI no llevo a un portal autenticado para ${role}`)
  ;(this as any).currentUiRole = normalized
  await waitForAppSettled(this)
  await assertNoRenderErrors(this)
})

When('navego a la pantalla autenticada {string}', async function (this: UlviorWorld, path: string) {
  const driver = ensureDriver(this)
  await driver.get(`${ENV.WEB_URL}${path}`)
  await waitForAppSettled(this)
})

Then('la pantalla autenticada debe renderizar sin errores', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  const url = await driver.getCurrentUrl()
  assert.ok(!url.includes('/login'), `La ruta autenticada envio a login: ${url}`)
  assert.ok(!url.includes('/unauthorized'), `La ruta autenticada envio a unauthorized: ${url}`)
  await assertNoRenderErrors(this)
})

Then('debo seguir autenticado como {string}', async function (this: UlviorWorld, role: string) {
  const driver = ensureDriver(this)
  const normalized = normalizeRole(role)
  const url = await driver.getCurrentUrl()
  const text = await bodyText(this)
  assert.ok(url.includes(`/${normalized}`) || text.toLowerCase().includes(normalized), `No se evidencia el portal ${role}. URL: ${url}`)
})

Then('la pantalla debe mostrar al menos uno de estos textos {string}', async function (this: UlviorWorld, values: string) {
  const driver = ensureDriver(this)
  const expected = values.split('|').map((item) => item.trim()).filter(Boolean)
  await driver.wait(async () => {
    const text = await bodyText(this)
    return expected.some((item) => text.includes(item))
  }, ENV.SELENIUM_TIMEOUT, `No se encontro ninguno de estos textos: ${expected.join(', ')}`)
})

When('busco en la pantalla {string}', async function (this: UlviorWorld, query: string) {
  const driver = ensureDriver(this)
  const inputs = await visibleElements(driver, By.xpath("//input[contains(@placeholder, 'Buscar') or contains(@aria-label, 'Buscar')]"))
  assert.ok(inputs.length > 0, 'No existe input visible de busqueda en la pantalla')
  await inputs[0].clear()
  await inputs[0].sendKeys(query)
  await driver.sleep(1500)
})

When('abro el primer enlace real hacia {string}', async function (this: UlviorWorld, pathFragment: string) {
  const driver = ensureDriver(this)
  const currentUrl = await driver.getCurrentUrl()
  const locator = By.xpath(`//a[contains(@href, ${xpathLiteral(pathFragment)}) and not(contains(@href, ${xpathLiteral(currentUrl)}))]`)
  await clickFirstVisible(this, locator, `primer enlace hacia ${pathFragment}`)
  await waitForAppSettled(this)
})

When('hago click en la accion visible {string}', async function (this: UlviorWorld, label: string) {
  const literal = xpathLiteral(label)
  await clickFirstVisible(
    this,
    By.xpath(`//*[self::button or self::a][contains(normalize-space(.), ${literal}) or @aria-label=${literal}]`),
    label,
  )
  await waitForAppSettled(this)
})

When('hago click en la primera accion de resultado {string}', async function (this: UlviorWorld, label: string) {
  const literal = xpathLiteral(label)
  await clickFirstVisible(
    this,
    By.xpath(`(//*[self::button or self::a][contains(normalize-space(.), ${literal})])[1]`),
    `primera accion ${label}`,
  )
  await waitForAppSettled(this)
})

When('abro la primera fila de resultados', async function (this: UlviorWorld) {
  await clickFirstVisible(
    this,
    By.xpath("(//tbody/tr[not(contains(@class,'skeleton'))] | //div[contains(@class,'cursor-pointer') or @role='button'])[1]"),
    'primera fila de resultados',
  )
  await waitForAppSettled(this)
})

When('abro las notificaciones', async function (this: UlviorWorld) {
  await clickFirstVisible(this, By.css('[aria-label="Notificaciones"]'), 'Notificaciones')
  await waitForAppSettled(this)
})

Then('el panel de notificaciones debe ser usable', async function (this: UlviorWorld) {
  const text = await bodyText(this)
  assert.ok(text.includes('Notificaciones'), 'No se abrio el panel de notificaciones')
  assert.ok(
    text.includes('reciente') || text.includes('Sin notificaciones') || text.includes('Cuando exista actividad importante'),
    'El panel de notificaciones no muestra estado usable',
  )
})

When('recargo notificaciones {int} veces', async function (this: UlviorWorld, times: number) {
  const driver = ensureDriver(this)
  for (let i = 0; i < times; i += 1) {
    await clickFirstVisible(this, By.css('[aria-label="Actualizar notificaciones"]'), 'Actualizar notificaciones')
    await driver.sleep(700)
  }
})

When('marco notificaciones leidas si existen', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  const bellTextBefore = await visibleElements(driver, By.css('[aria-label="Notificaciones"]'))
  ;(this as any).notificationCountBefore = bellTextBefore[0] ? getBadgeCountFromText(await bellTextBefore[0].getText()) : 0
  const buttons = await visibleElements(driver, By.xpath("//button[contains(normalize-space(.), 'Marcar leídas')]"))
  if (buttons.length > 0) {
    await buttons[0].click()
    await driver.sleep(1000)
  }
})

Then('el contador de notificaciones no debe aumentar', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  const bell = await visibleElements(driver, By.css('[aria-label="Notificaciones"]'))
  const before = Number((this as any).notificationCountBefore ?? 0)
  const after = bell[0] ? getBadgeCountFromText(await bell[0].getText()) : 0
  assert.ok(after <= before, `El contador de notificaciones aumento. Antes=${before}, despues=${after}`)
})

Then('debo quedar bloqueado por seguridad', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  await waitForAppSettled(this)
  const url = await driver.getCurrentUrl()
  const text = await bodyText(this)
  const currentRole = (this as any).currentUiRole as string | undefined
  const roleHome = currentRole ? ROLE_HOME[currentRole] : undefined
  assert.ok(
    url.includes('/login') || url.includes('/unauthorized') || text.includes('No tienes acceso') || Boolean(roleHome && url.includes(roleHome)),
    `La ruta no quedo bloqueada por seguridad. URL=${url}`,
  )
})

When('cierro sesion desde UI', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  await clickFirstVisible(
    this,
    By.xpath("//*[self::button or self::a][contains(normalize-space(.), 'Cerrar sesión') or @title='Cerrar sesión' or @aria-label='Cerrar sesión']"),
    'Cerrar sesión',
  )
  const confirmButtons = await visibleElements(
    driver,
    By.xpath("//button[contains(normalize-space(.), 'Cerrar sesión') or contains(normalize-space(.), 'cerrar sesión')]"),
  )
  if (confirmButtons.length > 0) {
    await confirmButtons[0].click()
  }
  await driver.wait(async () => (await driver.getCurrentUrl()).includes('/login'), ENV.SELENIUM_TIMEOUT, 'Logout no llevo a login')
})

Then('el back button no debe mostrar una pantalla privada', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  await driver.navigate().back()
  await waitForAppSettled(this)
  const url = await driver.getCurrentUrl()
  const text = await bodyText(this)
  assert.ok(url.includes('/login') || text.includes('Iniciar sesión'), `Back button mostro una pantalla privada: ${url}`)
})
