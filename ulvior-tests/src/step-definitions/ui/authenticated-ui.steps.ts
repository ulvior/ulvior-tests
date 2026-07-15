import assert from 'assert'
import { Given, When, Then } from '@cucumber/cucumber'
import { By, Key, until, WebElement } from 'selenium-webdriver'
import { UlviorWorld } from '../../support/world'
import { LoginPage } from '../../pages/LoginPage'
import { ENV } from '../../support/env'
import { renderTemplate } from '../../utils/template'

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
  const expected = values.split('|').map((item) => renderTemplate(item.trim())).filter(Boolean)
  await driver.wait(async () => {
    const text = await bodyText(this)
    return expected.some((item) => text.includes(item))
  }, ENV.SELENIUM_TIMEOUT, `No se encontro ninguno de estos textos: ${expected.join(', ')}`)
})

When('busco en la pantalla {string}', async function (this: UlviorWorld, query: string) {
  const driver = ensureDriver(this)
  const rendered = renderTemplate(query)
  const filled = await driver.executeScript(`
    const query = arguments[0];
    const candidates = Array.from(document.querySelectorAll('input, textarea'))
      .filter((item) => {
        const rect = item.getBoundingClientRect();
        const text = [item.placeholder, item.getAttribute('aria-label'), item.name, item.id].join(' ').toLowerCase();
        return rect.width > 0 && rect.height > 0 && !item.disabled && text.includes('buscar');
      });
    const input = candidates[0];
    if (!input) return false;
    input.scrollIntoView({ block: 'center', inline: 'center' });
    input.focus();
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  `, rendered)
  assert.ok(filled, 'No existe input visible de busqueda en la pantalla')
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

When('hago click en la accion visible {string} si existe', async function (this: UlviorWorld, label: string) {
  const driver = ensureDriver(this)
  const literal = xpathLiteral(label)
  const elements = await visibleElements(
    driver,
    By.xpath(`//*[self::button or self::a][contains(normalize-space(.), ${literal}) or @aria-label=${literal}]`),
  )
  if (!elements.length) return
  await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"})', elements[0])
  const clicked = await driver.executeScript(`
    const element = arguments[0];
    if (!element || element.disabled) return false;
    element.click();
    return true;
  `, elements[0])
  if (clicked) await driver.sleep(700)
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
  const clicked = await driver.executeScript(`
    const button = Array.from(document.querySelectorAll('button'))
      .find((item) => (item.innerText || item.textContent || '').includes('Marcar leídas'));
    if (!button || button.disabled) return false;
    button.scrollIntoView({ block: 'center', inline: 'center' });
    button.click();
    return true;
  `)
  if (clicked) await driver.sleep(1000)
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

When('completo el campo con name {string} con {string}', async function (this: UlviorWorld, name: string, value: string) {
  const driver = ensureDriver(this)
  const rendered = renderTemplate(value)
  const element = await driver.wait(
    until.elementLocated(By.css(`[name="${name}"]`)),
    ENV.SELENIUM_TIMEOUT,
    `No se encontro campo name=${name}`,
  )
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', element)
  await element.clear()
  await element.sendKeys(rendered)
  await driver.sleep(250)
})

When('completo el primer campo con placeholder {string} con {string}', async function (this: UlviorWorld, placeholder: string, value: string) {
  const driver = ensureDriver(this)
  const rendered = renderTemplate(value)
  const element = await driver.wait(
    until.elementLocated(By.xpath(`(//input[@placeholder=${xpathLiteral(placeholder)}] | //textarea[@placeholder=${xpathLiteral(placeholder)}])[1]`)),
    ENV.SELENIUM_TIMEOUT,
    `No se encontro campo placeholder=${placeholder}`,
  )
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', element)
  await element.clear()
  await element.sendKeys(rendered)
  await driver.sleep(250)
})

When('selecciono la primera opcion valida del select name {string}', async function (this: UlviorWorld, name: string) {
  const driver = ensureDriver(this)
  const select = await driver.wait(
    until.elementLocated(By.css(`select[name="${name}"]`)),
    ENV.SELENIUM_TIMEOUT,
    `No se encontro select name=${name}`,
  )
  await driver.wait(async () => {
    return await driver.executeScript(`
      const select = arguments[0];
      return Array.from(select.options).some((item) => item.value && !item.disabled);
    `, select)
  }, ENV.SELENIUM_TIMEOUT, `Select ${name} no cargo opciones validas`)
  const selected = await driver.executeScript(`
    const select = arguments[0];
    const option = Array.from(select.options).find((item) => item.value && !item.disabled);
    if (!option) return null;
    select.value = option.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return { value: option.value, text: option.textContent };
  `, select)
  assert.ok(selected, `Select ${name} no tiene opcion valida`)
  await driver.sleep(350)
})

When('selecciono en el select name {string} la opcion que contiene {string}', async function (this: UlviorWorld, name: string, text: string) {
  const driver = ensureDriver(this)
  const select = await driver.wait(
    until.elementLocated(By.css(`select[name="${name}"]`)),
    ENV.SELENIUM_TIMEOUT,
    `No se encontro select name=${name}`,
  )
  const rendered = renderTemplate(text)
  const selected = await driver.executeScript(`
    const select = arguments[0];
    const expected = arguments[1].toLowerCase();
    const option = Array.from(select.options).find((item) => item.textContent.toLowerCase().includes(expected) || item.value.toLowerCase().includes(expected));
    if (!option) return null;
    select.value = option.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return { value: option.value, text: option.textContent };
  `, select, rendered)
  assert.ok(selected, `Select ${name} no tiene opcion que contiene ${rendered}`)
  await driver.sleep(350)
})

When('marco el checkbox name {string}', async function (this: UlviorWorld, name: string) {
  const driver = ensureDriver(this)
  const checkbox = await driver.wait(
    until.elementLocated(By.css(`input[type="checkbox"][name="${name}"]`)),
    ENV.SELENIUM_TIMEOUT,
    `No se encontro checkbox name=${name}`,
  )
  const checked = await checkbox.isSelected()
  if (!checked) await checkbox.click()
  await driver.sleep(250)
})

When('agrego tags en el campo con placeholder {string} con {string}', async function (this: UlviorWorld, placeholder: string, values: string) {
  const driver = ensureDriver(this)
  const rendered = renderTemplate(values)
  const input = await driver.wait(
    until.elementLocated(By.css(`input[placeholder="${placeholder}"]`)),
    ENV.SELENIUM_TIMEOUT,
    `No se encontro input de tags placeholder=${placeholder}`,
  )
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', input)
  for (const raw of rendered.split(',').map((item) => item.trim()).filter(Boolean)) {
    await input.sendKeys(raw)
    await input.sendKeys(Key.ENTER)
    await driver.sleep(180)
  }
})

Then('backend admin debe encontrar en pipeline el texto {string}', async function (this: UlviorWorld, expectedText: string) {
  const expected = renderTemplate(expectedText)
  const login = await this.apiClient.post('/auth/login', {
    email: ENV.TEST_ADMIN_EMAIL,
    password: ENV.TEST_ADMIN_PASSWORD,
  })
  this.lastApiEvidence = login.evidence
  assert.ok([200, 201].includes(login.response.status), `Login API admin fallo con ${login.response.status}`)
  const result = await this.apiClient.get('/admin/pipeline')
  this.lastApiEvidence = result.evidence
  this.lastResponse = result.response
  assert.ok([200, 204].includes(result.response.status), `GET /admin/pipeline fallo con ${result.response.status}`)
  assert.ok(
    JSON.stringify(result.response.data).includes(expected),
    `No se encontro "${expected}" en /admin/pipeline`,
  )
})

Then('diagnostico el formulario de nueva busqueda admin', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  const snapshot = await driver.executeScript(`
    const valueOf = (selector) => document.querySelector(selector)?.value ?? null;
    const text = (selector) => Array.from(document.querySelectorAll(selector)).map((el) => (el.innerText || el.textContent || '').trim()).filter(Boolean);
    return {
      empresa_id: valueOf('[name="empresa_id"]'),
      rol: valueOf('[name="rol"]'),
      seniority: valueOf('[name="seniority"]'),
      modalidad: valueOf('[name="modalidad"]'),
      descripcionLength: valueOf('[name="descripcion"]')?.length ?? null,
      salario_min: valueOf('[name="salario_min"]'),
      salario_max: valueOf('[name="salario_max"]'),
      fee_estimado: valueOf('[name="fee_estimado"]'),
      urgente: document.querySelector('[name="urgente"]')?.checked ?? null,
      notasLength: valueOf('[name="notas_internas"]')?.length ?? null,
      tags: text('span'),
      bodySample: (document.body.innerText || '').slice(0, 1600)
    }
  `)
  const formSnapshot = snapshot as any
  this.lastApiEvidence = {
    method: 'UI',
    url: await driver.getCurrentUrl(),
    headers: {},
    status: 200,
    response: formSnapshot,
    durationMs: 0,
  }
  assert.ok(formSnapshot, 'No se pudo leer formulario admin')
})
