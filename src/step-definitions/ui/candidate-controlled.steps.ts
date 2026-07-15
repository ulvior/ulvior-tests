import assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import { When, Then } from '@cucumber/cucumber'
import { By, until, WebElement } from 'selenium-webdriver'
import { UlviorWorld } from '../../support/world'
import { ENV } from '../../support/env'
import { renderTemplate } from '../../utils/template'

const ROLE_CREDENTIALS = {
  candidato: { email: ENV.TEST_CANDIDATO_EMAIL, password: ENV.TEST_CANDIDATO_PASSWORD },
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

async function waitSettled(world: UlviorWorld) {
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
      // Ignore stale nodes.
    }
  }
  return visible
}

function xpathLiteral(value: string): string {
  if (!value.includes("'")) return `'${value}'`
  if (!value.includes('"')) return `"${value}"`
  return `concat('${value.replace(/'/g, "', \"'\", '")}')`
}

async function clickIfVisible(world: UlviorWorld, label: string): Promise<boolean> {
  const driver = ensureDriver(world)
  const literal = xpathLiteral(label)
  const elements = await visibleElements(
    driver,
    By.xpath(`//*[self::button or self::a][contains(normalize-space(.), ${literal}) or @title=${literal} or @aria-label=${literal}]`),
  )
  if (!elements.length) return false
  await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"})', elements[0])
  await driver.sleep(150)
  try {
    await elements[0].click()
  } catch {
    await driver.executeScript('arguments[0].click()', elements[0])
  }
  await waitSettled(world)
  return true
}

async function fastClickIfVisible(world: UlviorWorld, labels: string[]): Promise<boolean> {
  const driver = ensureDriver(world)
  const clicked = await driver.executeScript(`
    const labels = arguments[0].map((item) => String(item).toLowerCase());
    const candidates = Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .filter((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || item.disabled) return false;
        const text = [item.innerText, item.textContent, item.getAttribute('aria-label'), item.getAttribute('title')]
          .join(' ')
          .toLowerCase();
        return labels.some((label) => text.includes(label));
      });
    const target = candidates[0];
    if (!target) return false;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.click();
    return true;
  `, labels)
  if (clicked) await waitSettled(world)
  return Boolean(clicked)
}

async function loginApiAsCandidate(world: UlviorWorld) {
  const creds = ROLE_CREDENTIALS.candidato
  const login = await world.apiClient.post('/auth/login', creds)
  world.lastApiEvidence = login.evidence
  assert.ok([200, 201].includes(login.response.status), `Login API candidato fallo con ${login.response.status}`)
}

function extractFunctionName(challenge: any): string {
  const explicit = String(challenge?.function_name ?? '').trim()
  if (explicit) return explicit
  const starter = String(challenge?.starter_code ?? '')
  const match = starter.match(/function\s+([a-zA-Z_$][\w$]*)\s*\(/)
    ?? starter.match(/(?:def|func)\s+([a-zA-Z_][\w]*)\s*\(/)
  return match?.[1] ?? 'solve'
}

function buildDynamicJavaScriptSolution(challenge: any): string {
  const functionName = extractFunctionName(challenge)
  const language = String(challenge?.language ?? '').toLowerCase()

  if (language === 'python') {
    if (/payment|order|orden/i.test(functionName) || /payment|order|orden/i.test(String(challenge?.title ?? challenge?.description ?? ''))) {
      return `def ${functionName}(order):
    errors = []
    if not isinstance(order, dict):
        return {"isValid": False, "errors": ["order debe ser un objeto"]}

    items = order.get("items")
    currency = order.get("currency")
    amount = order.get("amount", order.get("total"))

    if not isinstance(order.get("id"), str) or not order.get("id").strip():
        errors.append("id debe ser string no vacio")
    if currency not in ["USD", "EUR", "GBP", "CLP"]:
        errors.append("currency invalida")
    if not isinstance(items, list) or len(items) == 0:
        errors.append("items debe contener al menos un item")

    subtotal = 0.0
    if isinstance(items, list):
        for index, item in enumerate(items):
            if not isinstance(item, dict):
                errors.append(f"item {index} debe ser objeto")
                continue
            quantity = item.get("quantity")
            price = item.get("price", item.get("unit_price"))
            if not isinstance(quantity, int) or quantity <= 0:
                errors.append(f"quantity item {index} invalida")
            if not isinstance(price, (int, float)) or price < 0:
                errors.append(f"price item {index} invalido")
            subtotal += (price if isinstance(price, (int, float)) else 0) * (quantity if isinstance(quantity, int) else 0)

    discount = order.get("discount", 0)
    if discount is None:
        discount = 0
    if not isinstance(discount, (int, float)) or discount < 0 or discount > subtotal:
        errors.append("discount invalido")
        discount = 0

    total = round(subtotal - discount, 2)
    if isinstance(amount, (int, float)) and abs(total - float(amount)) > 0.01:
        errors.append("total informado no coincide con items")

    return {"isValid": len(errors) == 0, "errors": errors, "total": total, "currency": currency}`
    }

    return `def ${functionName}(input):
    if isinstance(input, list):
        return [item for item in input if isinstance(item, dict)]
    if isinstance(input, dict):
        return {"isValid": True, "errors": []}
    return {"isValid": False, "errors": ["input invalido"]}`
  }

  if (language === 'ruby') {
    return `def ${functionName}(input)
  if input.is_a?(Array)
    return input.select { |item| item.is_a?(Hash) }
  end
  return { isValid: true, errors: [] } if input.is_a?(Hash)
  { isValid: false, errors: ['input invalido'] }
end`
  }

  if (/validateOrder/i.test(functionName)) {
    return `function ${functionName}(order) {
  const errors = [];
  const required = ['id', 'items', 'amount', 'currency'];
  if (!order || typeof order !== 'object' || Array.isArray(order)) {
    return { isValid: false, errors: ['order debe ser un objeto'] };
  }
  for (const field of required) {
    if (!(field in order)) errors.push('Falta el campo obligatorio: ' + field);
  }
  if (typeof order.id !== 'string' || !order.id.trim()) errors.push('id debe ser string no vacío');
  if (!['USD', 'EUR', 'GBP'].includes(order.currency)) errors.push('currency debe ser uno de: USD, EUR, GBP');
  if (typeof order.amount !== 'number' || !Number.isFinite(order.amount) || order.amount < 0) {
    errors.push('amount debe ser número positivo');
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    errors.push('items debe contener al menos un item');
  }
  let total = 0;
  if (Array.isArray(order.items)) {
    order.items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push('item ' + index + ' debe ser objeto');
        return;
      }
      if (typeof item.productId !== 'string' || !item.productId.trim()) {
        errors.push('productId en item ' + index + ' es requerido');
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        errors.push('quantity en item ' + index + ' debe ser entero positivo');
      }
      if (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) {
        errors.push('price en item ' + index + ' debe ser número positivo');
      }
      total += (Number(item.price) || 0) * (Number(item.quantity) || 0);
    });
  }
  if (typeof order.amount === 'number' && Number.isFinite(order.amount) && Math.abs(total - order.amount) > 0.01) {
    errors.push('El amount (' + order.amount + ') no coincide con la suma de items (' + total + ')');
  }
  if (order.discountCode !== undefined && !/^[a-z0-9]{5,10}$/i.test(String(order.discountCode))) {
    errors.push('discountCode debe tener entre 5 y 10 caracteres alfanuméricos');
  }
  return { isValid: errors.length === 0, errors };
}`
  }

  return `function ${functionName}(input) {
  if (Array.isArray(input)) {
    return input.filter((item) => item && typeof item === 'object');
  }
  if (input && typeof input === 'object') {
    return { isValid: true, errors: [] };
  }
  return { isValid: false, errors: ['input inválido'] };
}`
}

async function markCodingAlreadyPersistedIfPresent(world: UlviorWorld): Promise<boolean> {
  await loginApiAsCandidate(world)
  const coding = await world.apiClient.get('/candidato/evaluacion-coding')
  world.lastApiEvidence = coding.evidence
  if (coding.response.status !== 200) return false
  const execution = coding.response.data?.execution_result
  const hasPersistedExecution = Boolean(
    execution
    && Number(execution.exitCode ?? execution.exit_code) === 0
    && !String(execution.stderr ?? '').trim(),
  )
  const hasPersistedAnalysis = Boolean(coding.response.data?.analysis)
  if (hasPersistedExecution && hasPersistedAnalysis) {
    ;(world as any).codingAlreadyPersisted = true
    return true
  }
  return false
}

async function getCandidateProfile(world: UlviorWorld) {
  await loginApiAsCandidate(world)
  const result = await world.apiClient.get('/candidato/perfil')
  world.lastApiEvidence = result.evidence
  world.lastResponse = result.response
  assert.strictEqual(result.response.status, 200, `GET /candidato/perfil fallo con ${result.response.status}`)
  return result.response.data
}

async function getCandidateDocuments(world: UlviorWorld) {
  await loginApiAsCandidate(world)
  const result = await world.apiClient.get('/candidato/documentos')
  world.lastApiEvidence = result.evidence
  world.lastResponse = result.response
  assert.strictEqual(result.response.status, 200, `GET /candidato/documentos fallo con ${result.response.status}`)
  return result.response.data
}

When('subo el CV fixture candidato {string}', async function (this: UlviorWorld, fixtureName: string) {
  const driver = ensureDriver(this)
  const filePath = path.resolve(__dirname, '../../../fixtures', fixtureName)
  const fileBase64 = fs.readFileSync(filePath).toString('base64')
  const fileInput = await driver.wait(
    until.elementLocated(By.css('input[type="file"][accept*="pdf"]')),
    ENV.SELENIUM_TIMEOUT,
    'No se encontro input file PDF del candidato',
  )
  await driver.executeScript(`
    const input = arguments[0];
    const fileName = arguments[1];
    const base64 = arguments[2];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const file = new File([bytes], fileName, { type: 'application/pdf' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    Object.defineProperty(input, 'files', { value: transfer.files, configurable: true });
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  `, fileInput, fixtureName, fileBase64)
  await driver.wait(async () => {
    const documentos = await getCandidateDocuments(this)
    return Boolean(documentos?.cv_disponible)
  }, ENV.SELENIUM_TIMEOUT, 'El backend no reflejo la carga del CV')
  await waitSettled(this)
})

When('analizo el CV desde UI si esta pendiente', async function (this: UlviorWorld) {
  const clicked =
    await clickIfVisible(this, 'Rellenar perfil')
    || await clickIfVisible(this, 'Rellenar perfil con CV')
    || await clickIfVisible(this, 'Reintentar')
    || await clickIfVisible(this, 'Actualizar perfil desde CV')

  if (clicked) {
    await clickIfVisible(this, 'Actualizar perfil con CV')
    const driver = ensureDriver(this)
    await driver.wait(async () => {
      const docs = await getCandidateDocuments(this)
      return docs?.cv_analysis_status === 'ANALYZED' || docs?.cvAnalysisStatus === 'ANALYZED'
    }, 120000, 'El CV no llego a estado ANALYZED en backend')
  }
})

When('guardo el perfil candidato desde UI', async function (this: UlviorWorld) {
  const clicked = await clickIfVisible(this, 'Guardar cambios')
  assert.ok(clicked, 'No se encontro accion Guardar cambios')
  const driver = ensureDriver(this)
  await driver.wait(async () => {
    const url = await driver.getCurrentUrl()
    const text = await bodyText(this)
    return url.includes('/candidato/perfil') || text.includes('Perfil actualizado') || text.includes('Mi perfil')
  }, ENV.SELENIUM_TIMEOUT, 'Guardar perfil no mostro estado estable')
})

When('relleno campos obligatorios generados desde CV si estan vacios', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  await driver.executeScript(`
    const fill = (selector, value) => {
      document.querySelectorAll(selector).forEach((input) => {
        if (input.disabled || String(input.value ?? '').trim()) return;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    };
    fill('input[name^="experiencia."][name$=".empresa"]', 'Ulvior QA E2E');
    fill('input[name^="experiencia."][name$=".periodo"]', '2022 - presente');
    fill('input[name^="experiencia."][name$=".rol"]', 'Backend Engineer');
    fill('input[name^="educacion."][name$=".institucion"]', 'Ulvior Academy');
    fill('input[name^="educacion."][name$=".carrera"]', 'Ingenieria de Software');
  `)
  await driver.sleep(500)
})

When('cargo una solucion JavaScript valida en el editor coding', { timeout: 90000 }, async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  await waitSettled(this)
  if (await markCodingAlreadyPersistedIfPresent(this)) return

  await fastClickIfVisible(this, ['Comenzar desafío', 'Editor', 'Código', '2 · Código', '2 Código'])

  await loginApiAsCandidate(this)
  const coding = await this.apiClient.get('/candidato/evaluacion-coding')
  this.lastApiEvidence = coding.evidence
  assert.strictEqual(coding.response.status, 200, `GET /candidato/evaluacion-coding fallo con ${coding.response.status}`)
  const assessmentId = coding.response.data?.assessment_id
  const challenge = coding.response.data?.challenge ?? {}
  assert.ok(assessmentId, 'No existe assessment_id para persistir borrador coding')

  const code = buildDynamicJavaScriptSolution(challenge)

  await driver.executeScript(`
    const assessmentId = arguments[0];
    const code = arguments[1];
    window.localStorage.setItem('ulvior:coding-eval:' + assessmentId, JSON.stringify({
      code,
      answers: {},
      executionResult: null,
      lastExecutedCode: '',
      outputTab: 'terminal'
    }));
  `, assessmentId, code)
  await driver.executeScript(`
    const code = arguments[0];
    const monaco = window.monaco?.editor?.getModels?.()[0];
    if (monaco) monaco.setValue(code);
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = code;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `, code)
  await waitSettled(this)
  if (await markCodingAlreadyPersistedIfPresent(this)) return
  await fastClickIfVisible(this, ['Comenzar desafío', 'Editor', 'Código', '2 · Código', '2 Código'])
  await waitSettled(this)
  await driver.wait(async () => {
    const text = await driver.executeScript('return document.body?.innerText || ""')
    return String(text).includes('Ejecutar')
  }, ENV.SELENIUM_TIMEOUT, 'Editor coding no quedo usable')
})

When('ejecuto el codigo candidato desde UI', { timeout: 90000 }, async function (this: UlviorWorld) {
  if ((this as any).codingAlreadyPersisted) return
  const driver = ensureDriver(this)
  const clickExecute = async () => {
    const clicked = await driver.executeScript(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const button = buttons.find((item) => (item.innerText || item.textContent || '').includes('Ejecutar') && !item.disabled);
      if (!button) return false;
      button.scrollIntoView({ block: 'center', inline: 'center' });
      button.click();
      return true;
    `)
    return Boolean(clicked)
  }
  assert.ok(await clickExecute(), 'No se encontro boton Ejecutar habilitado')
  await loginApiAsCandidate(this)
  const hasExecution = async () => {
    const result = await this.apiClient.get('/candidato/evaluacion-coding')
    this.lastApiEvidence = result.evidence
    return Boolean(result.response.data?.execution_result)
  }
  await driver.sleep(1500)
  if (!(await hasExecution())) {
    await clickExecute()
  }
  await driver.wait(async () => {
    return hasExecution()
  }, 60000, 'La ejecucion de codigo no persistio execution_result en backend')
})

When('evaluo el codigo candidato con IA si esta habilitado', async function (this: UlviorWorld) {
  if ((this as any).codingAlreadyPersisted) return
  const clicked =
    await clickIfVisible(this, 'Evaluar con IA')
    || await clickIfVisible(this, 'Enviar corrección final')
    || await clickIfVisible(this, 'Enviar corrección')
  if (!clicked) return
  const driver = ensureDriver(this)
  await driver.wait(async () => {
    const text = await bodyText(this)
    return text.includes('Resultado') || text.includes('Preguntas') || text.includes('Score') || text.includes('Generando preguntas')
  }, 120000, 'La evaluacion AI de coding no dejo resultado visible')
})

Then('backend candidato debe conservar CV disponible y analizado', async function (this: UlviorWorld) {
  const documentos = await getCandidateDocuments(this)
  const perfil = await getCandidateProfile(this)
  const hasCv = Boolean(documentos?.cv_disponible || perfil?.cv_disponible)
  const status = documentos?.cv_analysis_status ?? perfil?.cv_analysis_status ?? perfil?.cvAnalysisStatus
  assert.ok(hasCv, 'Backend no conserva cv_disponible=true')
  assert.strictEqual(status, 'ANALYZED', `CV no esta ANALYZED. Estado=${status}`)
})

Then('backend candidato debe conservar CV disponible', async function (this: UlviorWorld) {
  const documentos = await getCandidateDocuments(this)
  const perfil = await getCandidateProfile(this)
  const hasCv = Boolean(documentos?.cv_disponible || perfil?.cv_disponible)
  assert.ok(hasCv, 'Backend no conserva cv_disponible=true')
})

Then('backend perfil candidato debe contener {string}', async function (this: UlviorWorld, expectedValue: string) {
  const expected = renderTemplate(expectedValue)
  const perfil = await getCandidateProfile(this)
  assert.ok(JSON.stringify(perfil).includes(expected), `Perfil backend no contiene "${expected}"`)
})

Then('backend evaluacion AI candidato debe responder 200 y reconocer CV', async function (this: UlviorWorld) {
  await loginApiAsCandidate(this)
  const result = await this.apiClient.get('/candidato/evaluacion-ai')
  this.lastApiEvidence = result.evidence
  this.lastResponse = result.response
  assert.strictEqual(result.response.status, 200, `GET /candidato/evaluacion-ai fallo con ${result.response.status}`)
  const profile = result.response.data?.report?.evidence_profile ?? result.response.data?.evidence_profile
  assert.ok(profile?.has_cv_analysis, `Evaluacion AI no reconoce CV analizado: ${JSON.stringify(profile)}`)
})

Then('backend coding candidato debe tener ejecucion exitosa', async function (this: UlviorWorld) {
  await loginApiAsCandidate(this)
  const result = await this.apiClient.get('/candidato/evaluacion-coding')
  this.lastApiEvidence = result.evidence
  this.lastResponse = result.response
  assert.strictEqual(result.response.status, 200, `GET /candidato/evaluacion-coding fallo con ${result.response.status}`)
  const execution = result.response.data?.execution_result
  assert.ok(execution, 'Backend no persistio execution_result')
  assert.strictEqual(Number(execution.exitCode ?? execution.exit_code), 0, `Execution exitCode no es 0: ${JSON.stringify(execution)}`)
})

Then('backend candidato debe tener evidencia coding completa y score comercial', async function (this: UlviorWorld) {
  await loginApiAsCandidate(this)
  const coding = await this.apiClient.get('/candidato/evaluacion-coding')
  this.lastApiEvidence = coding.evidence
  this.lastResponse = coding.response
  assert.strictEqual(coding.response.status, 200, `GET /candidato/evaluacion-coding fallo con ${coding.response.status}`)

  const data = coding.response.data ?? {}
  const execution = data.execution_result
  const analysis = data.analysis ?? data.code_analysis ?? data.analysis_result
  const questions = data.questions ?? data.question_session?.questions ?? data.technical_questions ?? []
  const answers = data.answers ?? data.question_answers ?? data.question_session?.answers ?? {}
  const answeredCount = Array.isArray(questions)
    ? questions.filter((question: any, index: number) => {
      const id = question?.id ?? question?.question_id ?? String(index)
      const inline = question?.answer ?? question?.respuesta
      return Boolean(inline || answers?.[id] || answers?.[String(index)] || answers?.[index])
    }).length
    : 0

  assert.ok(execution, 'Backend no conserva execution_result de coding')
  assert.strictEqual(Number(execution.exitCode ?? execution.exit_code), 0, `Coding no ejecuto OK: ${JSON.stringify(execution)}`)
  assert.ok(analysis, 'Backend no conserva analisis de codigo')
  assert.ok(!Array.isArray(questions) || questions.length === 0 || answeredCount === questions.length, `Preguntas coding no respondidas completas: ${answeredCount}/${questions.length}`)

  const perfil = await getCandidateProfile(this)
  const score = Number(perfil?.fit_score ?? perfil?.fitScore ?? 0)
  assert.ok(score >= 60, `Candidato no alcanza minimo comercial 60/100. Score actual=${score}`)
})

Then('la consola del navegador no debe tener errores severos', async function (this: UlviorWorld) {
  const driver = ensureDriver(this)
  const entries = await driver.manage().logs().get('browser')
  const severe = entries.filter((entry) => String(entry.level).toLowerCase().includes('severe'))
  this.lastApiEvidence = {
    method: 'BROWSER_LOGS',
    url: await driver.getCurrentUrl(),
    headers: {},
    status: severe.length ? 500 : 200,
    response: severe.map((entry) => entry.message),
    durationMs: 0,
  }
  assert.deepStrictEqual(severe.map((entry) => entry.message), [], 'La consola tiene errores severos')
})
