import * as fs from 'fs'
import * as path from 'path'
import PDFDocument from 'pdfkit'
import { ScenarioEvidence, StepEvidence } from './evidence-store'

type FlowKey = 'admin' | 'candidato' | 'empresa'

interface FlowConfig {
  key: FlowKey
  title: string
  output: string
  objective: string
  scope: string[]
  data: string[]
}

const RUN_ID = process.env.E2E_RUN_ID ?? 'E2E-20260713-ULVIOR-QA-001'
const ROOT = path.resolve(__dirname, '../../e2e-reports', RUN_ID)
const PDF_DIR = path.join(ROOT, 'pdfs')
const EVIDENCE_DIR = path.join(ROOT, 'api-responses')
const LOG_DIR = path.join(ROOT, 'logs')

const C = {
  ink: '#0f172a',
  muted: '#64748b',
  text: '#111827',
  soft: '#f8fafc',
  line: '#cbd5e1',
  blue: '#155e75',
  green: '#15803d',
  red: '#b91c1c',
  amber: '#a16207',
  white: '#ffffff',
}

const FLOWS: FlowConfig[] = [
  {
    key: 'admin',
    title: '01 Admin E2E Report',
    output: '01-admin-e2e-report.pdf',
    objective: 'Validar backoffice admin, navegación, módulos operativos, seguridad API y evidencia de notificaciones.',
    scope: [
      'Login admin y sesión persistente',
      'Dashboard, métricas, scraping AI, candidatos, empresas, pipeline, solicitudes, entrevistas, procesos, contratos, facturación y pagos',
      'Detalle real de candidato, empresa y pipeline cuando existen datos',
      'Notificaciones: apertura, refresh y marcado de lectura',
      'Contratos HTTP protegidos del backoffice admin',
    ],
    data: [
      `Run ID: ${RUN_ID}`,
      'Usuario admin de .env.local',
      'Datos reales existentes del ambiente local/Railway usado por la API',
    ],
  },
  {
    key: 'candidato',
    title: '02 Candidato E2E Report',
    output: '02-candidato-e2e-report.pdf',
    objective: 'Validar portal candidato, perfil, evaluación AI, evaluación coding, empleos, procesos, entrevistas, notificaciones y contratos API.',
    scope: [
      'Login candidato y sesión persistente',
      'Home, perfil, edición, evaluación AI, evaluación coding, test fit, empleos, postulaciones, procesos y entrevistas',
      'Búsqueda de empleos y apertura de postulación real cuando existen datos',
      'Notificaciones: apertura, refresh y marcado de lectura',
      'Contratos HTTP protegidos de candidato, incluyendo CV, AI y coding',
    ],
    data: [
      `Run ID: ${RUN_ID}`,
      'Usuario candidato de .env.local',
      'Datos reales asociados al candidato en el ambiente probado',
    ],
  },
  {
    key: 'empresa',
    title: '03 Empresa E2E Report',
    output: '03-empresa-e2e-report.pdf',
    objective: 'Validar portal empresa, búsquedas, profesionales, solicitudes, entrevistas, analytics, facturación y contratos API.',
    scope: [
      'Login empresa y sesión persistente',
      'Dashboard, perfil, búsquedas, historial, profesionales, solicitudes, entrevistas, analytics y cuenta/facturación',
      'Perfil profesional real, solicitud y detalle de búsqueda cuando existen datos',
      'Notificaciones: apertura, refresh y marcado de lectura',
      'Contratos HTTP protegidos de empresa, billing, analytics y notificaciones',
    ],
    data: [
      `Run ID: ${RUN_ID}`,
      'Usuario empresa de .env.local',
      'Datos reales asociados a la empresa en el ambiente probado',
    ],
  },
]

function loadEvidence(key: FlowKey): ScenarioEvidence[] {
  const file = path.join(EVIDENCE_DIR, `${key}-evidence.json`)
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function statusOf(scenarios: ScenarioEvidence[]): 'Pasó' | 'Falló' | 'Bloqueado' {
  if (!scenarios.length) return 'Bloqueado'
  return scenarios.some((s) => s.status === 'failed') ? 'Falló' : 'Pasó'
}

function statusColor(status: string): string {
  if (status === 'Pasó' || status === 'passed') return C.green
  if (status === 'Falló' || status === 'failed') return C.red
  return C.amber
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

function truncate(text: string, max = 900): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n... [truncado]`
}

function json(value: unknown, max = 900): string {
  try {
    return truncate(typeof value === 'string' ? value : JSON.stringify(value, null, 2), max)
  } catch {
    return String(value)
  }
}

function addHeader(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.rect(0, 0, doc.page.width, 132).fill(C.ink)
  doc.rect(0, 128, doc.page.width, 4).fill(C.blue)
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(10).text('ULVIOR QA E2E', 42, 34)
  doc.fillColor('#bae6fd').font('Helvetica').fontSize(8).text(RUN_ID, 42, 50)
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(22).text(title, 42, 74, { width: doc.page.width - 84 })
  doc.fillColor('#ccfbf1').font('Helvetica').fontSize(9).text(subtitle, 42, 104, { width: doc.page.width - 84 })
  doc.y = 158
}

function section(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 40)
  doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(13).text(title, 42)
  doc.moveDown(0.4)
}

function bulletList(doc: PDFKit.PDFDocument, items: string[]) {
  doc.font('Helvetica').fontSize(9).fillColor(C.text)
  for (const item of items) {
    ensureSpace(doc, 18)
    doc.text(`- ${item}`, 52, doc.y, { width: doc.page.width - 104 })
    doc.moveDown(0.18)
  }
  doc.moveDown(0.4)
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - 44) doc.addPage()
}

function metricRow(doc: PDFKit.PDFDocument, metrics: [string, string, string][]) {
  const gap = 8
  const width = (doc.page.width - 84 - gap * (metrics.length - 1)) / metrics.length
  const y = doc.y
  metrics.forEach(([label, value, color], index) => {
    const x = 42 + index * (width + gap)
    doc.roundedRect(x, y, width, 46, 5).fillAndStroke(C.soft, C.line)
    doc.fillColor(color).font('Helvetica-Bold').fontSize(value.length > 15 ? 8 : 14).text(value, x + 9, y + 9, { width: width - 18 })
    doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7).text(label.toUpperCase(), x + 9, y + 31, { width: width - 18 })
  })
  doc.y = y + 56
}

function drawCaseTable(doc: PDFKit.PDFDocument, flow: FlowConfig, scenarios: ScenarioEvidence[]) {
  section(doc, 'Tabla de casos de prueba')
  const headerY = doc.y
  const widths = [54, 150, 62, 58, 190]
  const labels = ['ID', 'Pantalla/API', 'UI/API', 'Estado', 'Evidencia']
  drawRow(doc, labels, widths, headerY, true)
  doc.y = headerY + 24
  scenarios.forEach((scenario, index) => {
    ensureSpace(doc, 42)
    const hasUi = scenario.steps.some((s) => s.screenshot)
    const hasApi = scenario.steps.some((s) => s.apiEvidence)
    const failed = scenario.steps.find((s) => s.status === 'failed')
    const evidence = [
      `${scenario.steps.length} pasos`,
      hasUi ? 'capturas UI' : '',
      hasApi ? 'HTTP' : '',
      failed?.error ? `error: ${failed.error.slice(0, 70)}` : '',
    ].filter(Boolean).join(' | ')
    const values = [
      `${flow.key.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      scenario.scenarioName,
      hasUi && hasApi ? 'UI/API' : hasUi ? 'UI' : hasApi ? 'API' : 'N/A',
      scenario.status === 'passed' ? 'Pasó' : 'Falló',
      evidence,
    ]
    drawRow(doc, values, widths, doc.y, false, scenario.status)
    doc.y += 38
  })
  if (!scenarios.length) {
    doc.fillColor(C.amber).font('Helvetica').fontSize(9).text('No se encontró evidencia ejecutada para este flujo.', 52)
  }
  doc.moveDown(0.8)
}

function drawRow(doc: PDFKit.PDFDocument, values: string[], widths: number[], y: number, header = false, status?: string) {
  let x = 42
  const height = header ? 22 : 34
  values.forEach((value, index) => {
    doc.rect(x, y, widths[index], height).fillAndStroke(header ? '#e2e8f0' : C.white, C.line)
    const color = index === 3 && status ? statusColor(status) : C.text
    doc.fillColor(color).font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(header ? 7.5 : 7)
      .text(value, x + 4, y + 5, { width: widths[index] - 8, height: height - 8, ellipsis: true })
    x += widths[index]
  })
}

function drawDetailedEvidence(doc: PDFKit.PDFDocument, scenarios: ScenarioEvidence[]) {
  section(doc, 'Evidencia detallada')
  for (const scenario of scenarios) {
    ensureSpace(doc, 70)
    doc.roundedRect(42, doc.y, doc.page.width - 84, 36, 5).fillAndStroke(C.soft, C.line)
    doc.fillColor(statusColor(scenario.status)).font('Helvetica-Bold').fontSize(8).text(scenario.status.toUpperCase(), 52, doc.y + 8)
    doc.fillColor(C.ink).font('Helvetica-Bold').fontSize(9).text(scenario.scenarioName, 104, doc.y + 8, { width: doc.page.width - 160 })
    doc.fillColor(C.muted).font('Helvetica').fontSize(7).text(`${scenario.featureFile} | ${scenario.startedAt} -> ${scenario.finishedAt}`, 104, doc.y + 22, { width: doc.page.width - 160 })
    doc.y += 46
    scenario.steps.forEach((step, i) => drawStep(doc, step, i + 1))
    doc.moveDown(0.8)
  }
}

function drawStep(doc: PDFKit.PDFDocument, step: StepEvidence, index: number) {
  ensureSpace(doc, 46)
  doc.fillColor(statusColor(step.status)).font('Helvetica-Bold').fontSize(7).text(`${index}. ${step.status.toUpperCase()}`, 52)
  doc.fillColor(C.text).font('Helvetica').fontSize(8).text(`${step.keyword} ${step.stepText}`, 112, doc.y - 9, { width: doc.page.width - 164 })
  if (step.error) {
    doc.moveDown(0.2)
    doc.fillColor(C.red).font('Courier').fontSize(7).text(truncate(step.error, 500), 62, doc.y, { width: doc.page.width - 124 })
  }
  if (step.apiEvidence) {
    doc.moveDown(0.2)
    const ev = step.apiEvidence
    doc.fillColor(C.blue).font('Helvetica-Bold').fontSize(7).text(`${ev.method} ${ev.url} -> HTTP ${ev.status} (${ev.durationMs} ms)`, 62, doc.y, { width: doc.page.width - 124 })
    doc.fillColor(C.muted).font('Courier').fontSize(6.4).text(json({ request: ev.body, response: ev.response }, 700), 62, doc.y + 10, { width: doc.page.width - 124 })
    doc.moveDown(0.7)
  }
  if (step.screenshot) {
    ensureSpace(doc, 186)
    try {
      const top = doc.y + 3
      doc.image(Buffer.from(step.screenshot, 'base64'), 62, top, { fit: [doc.page.width - 124, 172], align: 'center' })
      doc.y = top + 182
    } catch {
      doc.fillColor(C.muted).font('Helvetica').fontSize(7).text('[captura no renderizable]', 62)
    }
  }
  doc.moveDown(0.35)
}

async function writePdf(fileName: string, title: string, subtitle: string, draw: (doc: PDFKit.PDFDocument) => void) {
  ensureDir(PDF_DIR)
  const out = path.join(PDF_DIR, fileName)
  const doc = new PDFDocument({ size: 'A4', margins: { top: 42, bottom: 42, left: 42, right: 42 } })
  const stream = fs.createWriteStream(out)
  doc.pipe(stream)
  addHeader(doc, title, subtitle)
  draw(doc)
  doc.end()
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
  console.log(out)
}

async function generateFlow(flow: FlowConfig) {
  const scenarios = loadEvidence(flow.key)
  const totalSteps = scenarios.reduce((sum, s) => sum + s.steps.length, 0)
  const failedScenarios = scenarios.filter((s) => s.status === 'failed')
  const apiSteps = scenarios.reduce((sum, s) => sum + s.steps.filter((step) => step.apiEvidence).length, 0)
  const uiSteps = scenarios.reduce((sum, s) => sum + s.steps.filter((step) => step.screenshot).length, 0)

  await writePdf(flow.output, flow.title, `${flow.objective}`, (doc) => {
    section(doc, 'Resumen ejecutivo')
    metricRow(doc, [
      ['Estado', statusOf(scenarios), statusColor(statusOf(scenarios))],
      ['Escenarios', String(scenarios.length), C.blue],
      ['Pasos', String(totalSteps), C.blue],
      ['Fallos', String(failedScenarios.length), failedScenarios.length ? C.red : C.green],
    ])
    metricRow(doc, [
      ['Evidencia UI', String(uiSteps), C.blue],
      ['Evidencia API', String(apiSteps), C.blue],
      ['Logs/email', fs.existsSync(LOG_DIR) ? 'capturados si existen' : 'sin carpeta', C.amber],
      ['Veredicto', statusOf(scenarios), statusColor(statusOf(scenarios))],
    ])
    section(doc, 'Alcance probado')
    bulletList(doc, flow.scope)
    section(doc, 'Datos usados')
    bulletList(doc, flow.data)
    drawCaseTable(doc, flow, scenarios)
    section(doc, 'Bugs encontrados')
    const failed = scenarios.flatMap((scenario) => scenario.steps
      .filter((step) => step.status === 'failed')
      .map((step) => `${scenario.scenarioName}: ${step.stepText} -> ${step.error ?? 'falló sin detalle'}`))
    bulletList(doc, failed.length ? failed : ['No se detectaron fallos en los escenarios ejecutados. Revisar bloqueos explícitos si faltó cobertura por datos del ambiente.'])
    section(doc, 'Recomendaciones')
    bulletList(doc, failed.length
      ? ['Corregir fallos listados y re-ejecutar el flujo antes de moverlo a listo.', 'Ampliar datos E2E si un botón/formulario queda sin registro real disponible.']
      : ['Mantener esta corrida como baseline y ampliar con casos destructivos/controlados en ambiente dedicado.'])
    drawDetailedEvidence(doc, scenarios)
  })
}

async function generateMaster() {
  const all = FLOWS.map((flow) => ({ flow, scenarios: loadEvidence(flow.key) }))
  await writePdf('00-e2e-master-index.pdf', '00 E2E Master Index', 'Índice maestro de corrida, trazabilidad y veredicto final.', (doc) => {
    section(doc, 'Identificación')
    bulletList(doc, [
      `Run ID: ${RUN_ID}`,
      `Fecha/hora generación: ${new Date().toISOString()}`,
      `API_URL: ${process.env.API_URL ?? 'http://localhost:3000'}`,
      `WEB_URL: ${process.env.WEB_URL ?? 'http://localhost:5173'}`,
      `AI_URL: ${process.env.AI_URL ?? 'http://127.0.0.1:8000'}`,
    ])
    section(doc, 'Resumen por flujo')
    const headerY = doc.y
    drawRow(doc, ['Flujo', 'Escenarios', 'Pasos', 'Estado', 'PDF'], [110, 80, 70, 70, 210], headerY, true)
    doc.y = headerY + 24
    all.forEach(({ flow, scenarios }) => {
      ensureSpace(doc, 38)
      drawRow(doc, [
        flow.key,
        String(scenarios.length),
        String(scenarios.reduce((sum, s) => sum + s.steps.length, 0)),
        statusOf(scenarios),
        flow.output,
      ], [110, 80, 70, 70, 210], doc.y, false, statusOf(scenarios) === 'Pasó' ? 'passed' : 'failed')
      doc.y += 36
    })
    section(doc, 'Trazabilidad')
    bulletList(doc, [
      'Orden ejecutado y documentado: Admin -> Candidato -> Empresa.',
      'Los PDFs de flujo contienen capturas por paso UI y evidencia HTTP por paso API.',
      'Los datos E2E quedan marcados con el Run ID cuando el caso crea o documenta registros nuevos.',
    ])
    section(doc, 'Bugs críticos/altos/medios/bajos')
    const failures = all.flatMap(({ flow, scenarios }) => scenarios.flatMap((scenario) => scenario.steps
      .filter((step) => step.status === 'failed')
      .map((step) => `[${flow.key}] ${scenario.scenarioName}: ${step.stepText}`)))
    bulletList(doc, failures.length ? failures : ['No se registraron pasos fallidos en la evidencia consolidada.'])
    section(doc, 'Estado final')
    const finalStatus = all.some(({ scenarios }) => !scenarios.length || scenarios.some((s) => s.status === 'failed'))
      ? 'No listo / requiere corrección o re-ejecución de bloqueos'
      : 'Casi listo / evidencia E2E ejecutada sin fallos en esta corrida'
    bulletList(doc, [finalStatus])
  })
}

async function main() {
  ensureDir(PDF_DIR)
  for (const flow of FLOWS) await generateFlow(flow)
  await generateMaster()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
