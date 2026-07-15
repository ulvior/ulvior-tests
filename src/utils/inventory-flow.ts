import * as fs from 'fs'
import * as path from 'path'
import { By, until, WebDriver, WebElement } from 'selenium-webdriver'
import { buildDriver } from '../support/driver'
import { ENV } from '../support/env'
import { LoginPage } from '../pages/LoginPage'

type Flow = 'admin' | 'candidato' | 'empresa'

interface ElementInfo {
  index: number
  tag: string
  role: string
  type: string
  text: string
  ariaLabel: string
  title: string
  href: string
  name: string
  id: string
  className: string
  disabled: boolean
  safeClick: boolean
  riskReason?: string
  screenshot?: string
  resultUrl?: string
  resultTextSample?: string
  clickError?: string
}

interface FieldInfo {
  index: number
  tag: string
  type: string
  name: string
  id: string
  placeholder: string
  ariaLabel: string
  label: string
  required: boolean
  disabled: boolean
  valueSample: string
}

interface RouteInventory {
  flow: Flow
  route: string
  url: string
  title: string
  screenshot: string
  buttonsAndLinks: ElementInfo[]
  fields: FieldInfo[]
  forms: number
  bodySample: string
  consoleErrors: string[]
}

const RUN_ID = process.env.E2E_RUN_ID ?? 'E2E-20260713-ULVIOR-QA-001'
const FLOW = ((process.argv[2] ?? 'admin').toLowerCase() as Flow)
const ROOT = path.resolve(__dirname, '../../e2e-inventory', RUN_ID, FLOW)
const SCREEN_DIR = path.join(ROOT, 'screenshots')

const CREDENTIALS: Record<Flow, { email: string; password: string; home: string }> = {
  admin: { email: ENV.TEST_ADMIN_EMAIL, password: ENV.TEST_ADMIN_PASSWORD, home: '/admin/dashboard' },
  candidato: { email: ENV.TEST_CANDIDATO_EMAIL, password: ENV.TEST_CANDIDATO_PASSWORD, home: '/candidato/home' },
  empresa: { email: ENV.TEST_EMPRESA_EMAIL, password: ENV.TEST_EMPRESA_PASSWORD, home: '/empresa/dashboard' },
}

const ROUTES: Record<Flow, string[]> = {
  admin: [
    '/admin/dashboard',
    '/admin/ai-scraping',
    '/admin/candidatos',
    '/admin/empresas',
    '/admin/pipeline',
    '/admin/pipeline/nueva',
    '/admin/solicitudes',
    '/admin/entrevistas',
    '/admin/procesos',
    '/admin/contratos',
    '/admin/facturacion',
    '/admin/pagos',
    '/admin/metricas',
  ],
  candidato: [
    '/candidato/home',
    '/candidato/perfil',
    '/candidato/perfil/editar',
    '/candidato/evaluacion-ai',
    '/candidato/evaluacion-coding',
    '/candidato/test-fit',
    '/candidato/test-fit/completar',
    '/candidato/test-fit/resultado',
    '/candidato/empleos',
    '/candidato/postulaciones',
    '/candidato/procesos',
    '/candidato/entrevistas',
  ],
  empresa: [
    '/empresa/dashboard',
    '/empresa/perfil',
    '/empresa/busquedas',
    '/empresa/busquedas/nueva',
    '/empresa/busquedas/historial',
    '/empresa/profesionales',
    '/empresa/mis-solicitudes',
    '/empresa/entrevistas',
    '/empresa/analytics',
    '/empresa/cuenta-facturacion',
  ],
}

const RISKY_WORDS = [
  'eliminar',
  'borrar',
  'suspender',
  'cancelar',
  'rechazar',
  'pagar',
  'aceptar',
  'confirmar',
  'enviar',
  'crear',
  'guardar',
  'actualizar',
  'ejecutar',
  'evaluar',
  'analizar',
  'postular',
  'solicitar',
  'marcar',
  'cerrar sesión',
]

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

function slug(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 90) || 'item'
}

async function waitSettled(driver: WebDriver) {
  await driver.wait(async () => {
    const state = await driver.executeScript('return document.readyState')
    return state === 'complete' || state === 'interactive'
  }, ENV.SELENIUM_TIMEOUT)
  await driver.sleep(900)
}

async function screenshot(driver: WebDriver, name: string): Promise<string> {
  ensureDir(SCREEN_DIR)
  const file = path.join(SCREEN_DIR, `${slug(name)}.png`)
  fs.writeFileSync(file, Buffer.from(await driver.takeScreenshot(), 'base64'))
  return file
}

function isSafeAction(text: string, type: string, href: string): { safe: boolean; reason?: string } {
  const raw = `${text} ${type} ${href}`.toLowerCase()
  const risky = RISKY_WORDS.find((word) => raw.includes(word))
  if (risky) return { safe: false, reason: `accion requiere caso controlado: ${risky}` }
  if (type.toLowerCase() === 'submit') return { safe: false, reason: 'submit requiere formulario preparado' }
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return { safe: false, reason: 'link externo no navegable en test' }
  return { safe: true }
}

async function login(driver: WebDriver, flow: Flow) {
  const creds = CREDENTIALS[flow]
  if (!creds.email || !creds.password) throw new Error(`Credenciales no configuradas para ${flow}`)
  const loginPage = new LoginPage(driver)
  await loginPage.open()
  await loginPage.fillEmail(creds.email)
  await loginPage.fillPassword(creds.password)
  await loginPage.submit()
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl()
    return !url.includes('/login') && !url.includes('/unauthorized')
  }, ENV.SELENIUM_TIMEOUT)
  await waitSettled(driver)
}

async function collectConsoleErrors(driver: WebDriver): Promise<string[]> {
  try {
    const entries = await driver.manage().logs().get('browser')
    return entries
      .filter((entry) => String(entry.level).toLowerCase().includes('severe'))
      .map((entry) => `${entry.level.name}: ${entry.message}`)
  } catch {
    return []
  }
}

async function collectUi(driver: WebDriver): Promise<{ elements: ElementInfo[]; fields: FieldInfo[]; forms: number; bodySample: string }> {
  return driver.executeScript(`
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const textOf = (el) => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
    const controls = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]'))
      .filter(visible)
      .map((el, index) => ({
        index,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        type: el.getAttribute('type') || '',
        text: textOf(el) || el.getAttribute('value') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        title: el.getAttribute('title') || '',
        href: el.getAttribute('href') || '',
        name: el.getAttribute('name') || '',
        id: el.id || '',
        className: String(el.className || ''),
        disabled: Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true')
      }));
    const labelFor = (el) => {
      if (el.id) {
        const label = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (label) return textOf(label);
      }
      const parentLabel = el.closest('label');
      return parentLabel ? textOf(parentLabel) : '';
    };
    const fields = Array.from(document.querySelectorAll('input, select, textarea'))
      .filter(visible)
      .map((el, index) => ({
        index,
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        name: el.getAttribute('name') || '',
        id: el.id || '',
        placeholder: el.getAttribute('placeholder') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        label: labelFor(el),
        required: Boolean(el.required),
        disabled: Boolean(el.disabled),
        valueSample: (el.value || '').slice(0, 80)
      }));
    return {
      elements: controls,
      fields,
      forms: document.querySelectorAll('form').length,
      bodySample: textOf(document.body).slice(0, 1800)
    };
  `) as Promise<{ elements: ElementInfo[]; fields: FieldInfo[]; forms: number; bodySample: string }>
}

async function findClickableByIndex(driver: WebDriver, index: number): Promise<WebElement | null> {
  const elements = await driver.findElements(By.css('button, a, [role="button"], input[type="button"], input[type="submit"]'))
  const visible: WebElement[] = []
  for (const element of elements) {
    try {
      if (await element.isDisplayed()) visible.push(element)
    } catch {
      // Ignore stale elements.
    }
  }
  return visible[index] ?? null
}

async function exploreSafeActions(driver: WebDriver, route: string, inventory: RouteInventory) {
  const maxClicks = Number(process.env.INVENTORY_MAX_CLICKS ?? '60')
  for (const elementInfo of inventory.buttonsAndLinks.slice(0, maxClicks)) {
    const label = elementInfo.text || elementInfo.ariaLabel || elementInfo.title || elementInfo.href || `${elementInfo.tag}_${elementInfo.index}`
    const risk = isSafeAction(label, elementInfo.type, elementInfo.href)
    elementInfo.safeClick = risk.safe && !elementInfo.disabled
    elementInfo.riskReason = elementInfo.disabled ? 'elemento disabled' : risk.reason
    if (!elementInfo.safeClick) continue

    try {
      await driver.get(`${ENV.WEB_URL}${route}`)
      await waitSettled(driver)
      const clickable = await findClickableByIndex(driver, elementInfo.index)
      if (!clickable) {
        elementInfo.clickError = 'no se encontro el elemento visible al reintentar'
        continue
      }
      await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"})', clickable)
      await driver.sleep(250)
      try {
        await clickable.click()
      } catch {
        await driver.executeScript('arguments[0].click()', clickable)
      }
      await waitSettled(driver)
      elementInfo.resultUrl = await driver.getCurrentUrl()
      const body = await driver.findElement(By.css('body')).getText()
      elementInfo.resultTextSample = body.replace(/\s+/g, ' ').slice(0, 600)
      elementInfo.screenshot = await screenshot(driver, `${route}_${elementInfo.index}_${label}_after_click`)
      await driver.actions().sendKeys('\uE00C').perform().catch(() => undefined)
    } catch (err: any) {
      elementInfo.clickError = err?.message ?? String(err)
      try {
        elementInfo.screenshot = await screenshot(driver, `${route}_${elementInfo.index}_${label}_click_error`)
      } catch {
        // Ignore screenshot failure.
      }
    }
  }
}

async function inventoryRoute(driver: WebDriver, flow: Flow, route: string, routeIndex: number): Promise<RouteInventory> {
  await driver.get(`${ENV.WEB_URL}${route}`)
  await waitSettled(driver)
  await driver.wait(until.elementLocated(By.css('body')), ENV.SELENIUM_TIMEOUT)
  const collected = await collectUi(driver)
  const url = await driver.getCurrentUrl()
  const title = await driver.getTitle()
  const baseShot = await screenshot(driver, `${String(routeIndex + 1).padStart(2, '0')}_${route}_base`)
  const inventory: RouteInventory = {
    flow,
    route,
    url,
    title,
    screenshot: baseShot,
    buttonsAndLinks: collected.elements.map((element) => {
      const label = element.text || element.ariaLabel || element.title || element.href
      const risk = isSafeAction(label, element.type, element.href)
      return { ...element, safeClick: risk.safe && !element.disabled, riskReason: element.disabled ? 'elemento disabled' : risk.reason }
    }),
    fields: collected.fields,
    forms: collected.forms,
    bodySample: collected.bodySample,
    consoleErrors: await collectConsoleErrors(driver),
  }
  await exploreSafeActions(driver, route, inventory)
  return inventory
}

async function main() {
  if (!['admin', 'candidato', 'empresa'].includes(FLOW)) {
    throw new Error('Uso: ts-node src/utils/inventory-flow.ts admin|candidato|empresa')
  }
  ensureDir(ROOT)
  ensureDir(SCREEN_DIR)
  const driver = await buildDriver()
  const inventories: RouteInventory[] = []
  try {
    await login(driver, FLOW)
    for (const [index, route] of ROUTES[FLOW].entries()) {
      console.log(`Inventariando ${FLOW}: ${route}`)
      inventories.push(await inventoryRoute(driver, FLOW, route, index))
      fs.writeFileSync(path.join(ROOT, `${FLOW}-inventory.partial.json`), JSON.stringify(inventories, null, 2))
    }
  } finally {
    await driver.quit()
  }
  const jsonPath = path.join(ROOT, `${FLOW}-inventory.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(inventories, null, 2))

  const summary = inventories.map((item) => [
    item.route,
    `buttons_links=${item.buttonsAndLinks.length}`,
    `safe_clicks=${item.buttonsAndLinks.filter((el) => el.safeClick).length}`,
    `fields=${item.fields.length}`,
    `forms=${item.forms}`,
    `console_errors=${item.consoleErrors.length}`,
  ].join(' | ')).join('\n')
  fs.writeFileSync(path.join(ROOT, `${FLOW}-inventory-summary.txt`), summary)
  console.log(`Inventario guardado: ${jsonPath}`)
  console.log(summary)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
