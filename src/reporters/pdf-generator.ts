import * as path from 'path'
import * as fs from 'fs'
import PDFDocument from 'pdfkit'
import { evidenceStore, ScenarioEvidence, StepEvidence } from './evidence-store'

const PDFS_DIR = path.resolve(__dirname, '../../reports/pdfs')
const EVIDENCE_DIR = path.resolve(__dirname, '../../reports/evidence')
const EVIDENCE_FILE = path.join(EVIDENCE_DIR, 'evidence.json')

const C = {
  ink: '#0F172A',
  primary: '#155E75',
  accent: '#0F766E',
  success: '#15803D',
  fail: '#B91C1C',
  skip: '#64748B',
  text: '#111827',
  muted: '#64748B',
  soft: '#F8FAFC',
  codeBg: '#F1F5F9',
  border: '#CBD5E1',
  white: '#FFFFFF',
}

function statusColor(status: string): string {
  if (status === 'passed') return C.success
  if (status === 'failed') return C.fail
  return C.skip
}

function statusBadge(status: string): string {
  if (status === 'passed') return 'PASSED'
  if (status === 'failed') return 'FAILED'
  if (status === 'skipped') return 'SKIPPED'
  return 'PENDING'
}

function formatDuration(ms?: number): string {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function scenarioDuration(scenario: ScenarioEvidence): string {
  const started = Date.parse(scenario.startedAt)
  const finished = Date.parse(scenario.finishedAt)
  if (Number.isNaN(started) || Number.isNaN(finished)) return '-'
  return formatDuration(finished - started)
}

function truncateJson(obj: unknown, maxChars = 1800): string {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  if (str.length <= maxChars) return str
  return `${str.slice(0, maxChars)}\n... [truncado]`
}

function safePdfName(featureFile: string): string {
  return featureFile.replace(/\.feature$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_')
}

async function generatePdfForFeature(featureFile: string, scenarios: ScenarioEvidence[]): Promise<void> {
  const featureName = featureFile.replace(/\.feature$/i, '')
  const outPath = path.join(PDFS_DIR, `${safePdfName(featureFile)}.pdf`)
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    autoFirstPage: true,
  })

  const stream = fs.createWriteStream(outPath)
  doc.pipe(stream)

  const passed = scenarios.filter(s => s.status === 'passed').length
  const failed = scenarios.filter(s => s.status === 'failed').length
  const totalSteps = scenarios.reduce((a, s) => a + s.steps.length, 0)
  const failedSteps = scenarios.reduce((a, s) => a + s.steps.filter(step => step.status === 'failed').length, 0)
  const uiSteps = scenarios.reduce((a, s) => a + s.steps.filter(step => step.screenshot).length, 0)
  const apiSteps = scenarios.reduce((a, s) => a + s.steps.filter(step => step.apiEvidence).length, 0)

  drawHeader(doc, featureFile)
  doc.y = 185
  sectionTitle(doc, 'Resumen Ejecutivo')
  metricRow(doc, [
    ['Escenarios', String(scenarios.length), C.primary],
    ['Passed', String(passed), C.success],
    ['Failed', String(failed), failed ? C.fail : C.success],
    ['Pasos', String(totalSteps), C.accent],
  ])
  metricRow(doc, [
    ['Pasos fallidos', String(failedSteps), failedSteps ? C.fail : C.success],
    ['Evidencia UI', String(uiSteps), C.primary],
    ['Evidencia API', String(apiSteps), C.primary],
    ['Feature', featureName, C.ink],
  ], 44)

  doc.moveDown(0.8)
  doc.fillColor(C.muted).fontSize(9).font('Helvetica')
    .text(`Generado: ${new Date().toLocaleString('es-CL')} | Archivo: ${featureFile}`, 50)
  doc.moveDown(1.2)

  for (const [sIdx, scenario] of scenarios.entries()) {
    ensureSpace(doc, 95)
    scenarioHeader(doc, sIdx + 1, scenario)

    if (scenario.tags.length) {
      doc.fillColor(C.muted).fontSize(8).font('Helvetica')
        .text(`Tags: ${scenario.tags.join(', ')}`, 64)
      doc.moveDown(0.5)
    }

    for (const [stepIdx, step] of scenario.steps.entries()) {
      ensureSpace(doc, 70)
      stepHeader(doc, stepIdx + 1, step)

      if (step.error) {
        doc.fillColor(C.fail).fontSize(8).font('Courier')
          .text(`ERROR ${step.error.slice(0, 500)}`, 70, doc.y, {
            width: doc.page.width - 140,
            lineBreak: true,
          })
        doc.moveDown(0.5)
      }

      if (step.apiEvidence) {
        drawApiEvidence(doc, step.apiEvidence)
      }

      if (step.screenshot) {
        drawScreenshot(doc, step.screenshot)
      }

      doc.moveDown(0.5)
    }

    doc.fillColor(C.muted).fontSize(8).font('Helvetica')
      .text(`Inicio: ${scenario.startedAt} | Fin: ${scenario.finishedAt} | Duracion: ${scenarioDuration(scenario)}`, 64)
    doc.moveDown(1.2)
  }

  doc.end()

  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  console.log(`  PDF generado: ${outPath}`)
}

function drawHeader(doc: InstanceType<typeof PDFDocument>, featureFile: string) {
  doc.rect(0, 0, doc.page.width, 150).fill(C.ink)
  doc.rect(0, 145, doc.page.width, 5).fill(C.accent)
  doc.fillColor(C.white).fontSize(11).font('Helvetica-Bold').text('ULVIOR QA', 50, 36)
  doc.fillColor('#CCFBF1').fontSize(9).font('Helvetica').text('BDD Evidence Report', 50, 53)
  doc.fillColor(C.white).fontSize(25).font('Helvetica-Bold')
    .text(featureFile, 50, 82, { width: doc.page.width - 100 })
  doc.fillColor('#BAE6FD').fontSize(10).font('Helvetica')
    .text('Cucumber + Selenium + API Evidence + PDF por feature', 50, 118)
}

function sectionTitle(doc: InstanceType<typeof PDFDocument>, title: string) {
  doc.fillColor(C.ink).fontSize(14).font('Helvetica-Bold').text(title, 50)
  doc.moveDown(0.6)
}

function metricRow(doc: InstanceType<typeof PDFDocument>, metrics: [string, string, string][], height = 52) {
  const gap = 8
  const width = (doc.page.width - 100 - gap * (metrics.length - 1)) / metrics.length
  const y = doc.y
  metrics.forEach(([label, value, color], idx) => {
    const x = 50 + idx * (width + gap)
    doc.roundedRect(x, y, width, height, 6).fillAndStroke(C.soft, C.border)
    doc.fillColor(color).fontSize(value.length > 12 ? 9 : 15).font('Helvetica-Bold')
      .text(value, x + 10, y + 10, { width: width - 20, ellipsis: true })
    doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold')
      .text(label.toUpperCase(), x + 10, y + height - 17, { width: width - 20 })
  })
  doc.y = y + height + 10
}

function scenarioHeader(doc: InstanceType<typeof PDFDocument>, index: number, scenario: ScenarioEvidence) {
  const y = doc.y
  const color = scenario.status === 'passed' ? C.success : C.fail
  doc.roundedRect(50, y, doc.page.width - 100, 44, 6).fillAndStroke(C.white, C.border)
  doc.rect(50, y, 5, 44).fill(color)
  doc.fillColor(color).fontSize(8).font('Helvetica-Bold')
    .text(statusBadge(scenario.status), 64, y + 9)
  doc.fillColor(C.ink).fontSize(11).font('Helvetica-Bold')
    .text(`Escenario ${index}: ${scenario.scenarioName}`, 118, y + 8, { width: doc.page.width - 230 })
  doc.fillColor(C.muted).fontSize(8).font('Helvetica')
    .text(`Duracion ${scenarioDuration(scenario)} | Pasos ${scenario.steps.length}`, 118, y + 26)
  doc.y = y + 52
}

function stepHeader(doc: InstanceType<typeof PDFDocument>, index: number, step: StepEvidence) {
  const y = doc.y
  const color = statusColor(step.status)
  doc.roundedRect(60, y, doc.page.width - 120, 34, 5).fillAndStroke(C.soft, C.border)
  doc.fillColor(color).fontSize(7.5).font('Helvetica-Bold')
    .text(statusBadge(step.status), 70, y + 9)
  doc.fillColor(C.ink).fontSize(9).font('Helvetica-Bold')
    .text(`Paso ${index}: ${step.keyword} ${step.stepText}`, 122, y + 8, { width: doc.page.width - 245 })
  doc.fillColor(C.muted).fontSize(8).font('Helvetica')
    .text(formatDuration(step.durationMs), doc.page.width - 122, y + 9, { width: 62, align: 'right' })
  doc.y = y + 42
}

function drawApiEvidence(doc: InstanceType<typeof PDFDocument>, ev: NonNullable<StepEvidence['apiEvidence']>) {
  ensureSpace(doc, 140)
  const y = doc.y
  doc.roundedRect(65, y, doc.page.width - 130, 22, 4).fillAndStroke('#E0F2FE', '#7DD3FC')
  doc.fillColor(C.primary).fontSize(8).font('Helvetica-Bold')
    .text(`${ev.method} ${ev.url} -> HTTP ${ev.status} (${formatDuration(ev.durationMs)})`, 72, y + 7, {
      width: doc.page.width - 144,
      ellipsis: true,
    })
  doc.y = y + 30

  if (ev.body) {
    doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold').text('REQUEST BODY', 70)
    doc.moveDown(0.1)
    codeBlock(doc, truncateJson(ev.body))
  }

  doc.fillColor(C.muted).fontSize(7.5).font('Helvetica-Bold').text('RESPONSE', 70)
  doc.moveDown(0.1)
  codeBlock(doc, truncateJson(ev.response))
}

function drawScreenshot(doc: InstanceType<typeof PDFDocument>, screenshot: string) {
  ensureSpace(doc, 245)
  const imgBuf = Buffer.from(screenshot, 'base64')
  const imgY = doc.y
  try {
    doc.roundedRect(65, imgY, doc.page.width - 130, 235, 5).stroke(C.border)
    doc.image(imgBuf, 70, imgY + 8, {
      fit: [doc.page.width - 140, 220],
      align: 'center',
    })
    doc.y = imgY + 245
  } catch {
    doc.fillColor(C.muted).fontSize(8).font('Helvetica').text('[Screenshot no pudo renderizarse]', 70)
  }
}

function codeBlock(doc: InstanceType<typeof PDFDocument>, text: string) {
  const padding = 6
  const textWidth = doc.page.width - 142
  const lines = text.split('\n').flatMap(line => {
    const approxCharsPerLine = 100
    if (line.length <= approxCharsPerLine) return [line]
    const wrapped: string[] = []
    for (let i = 0; i < line.length; i += approxCharsPerLine) {
      wrapped.push(line.slice(i, i + approxCharsPerLine))
    }
    return wrapped
  })
  const lineHeight = 9
  const blockH = Math.min(lines.length * lineHeight + padding * 2, 230)
  ensureSpace(doc, blockH + 10)

  const top = doc.y
  doc.roundedRect(70, top, doc.page.width - 140, blockH, 4).fill(C.codeBg)
  doc.fillColor(C.text).fontSize(7).font('Courier')
    .text(lines.join('\n'), 70 + padding, top + padding, {
      width: textWidth,
      height: blockH - padding * 2,
      lineBreak: true,
    })
  doc.y = top + blockH + 8
}

function ensureSpace(doc: InstanceType<typeof PDFDocument>, needed: number) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage()
  }
}

export async function generateAllPdfs(): Promise<void> {
  fs.mkdirSync(PDFS_DIR, { recursive: true })
  const byFeature = evidenceStore.byFeature()

  if (byFeature.size === 0) {
    console.log('No hay evidencia para generar PDFs.')
    return
  }

  console.log(`\nGenerando ${byFeature.size} PDF(s)...`)

  for (const [featureFile, scenarios] of byFeature.entries()) {
    try {
      await generatePdfForFeature(featureFile, scenarios)
    } catch (err) {
      console.error(`  Error generando PDF para ${featureFile}:`, err)
    }
  }
}

export function persistEvidence(): string {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidenceStore.getAll(), null, 2))
  return EVIDENCE_FILE
}

export function loadPersistedEvidence(): boolean {
  if (!fs.existsSync(EVIDENCE_FILE)) return false
  evidenceStore.load(JSON.parse(fs.readFileSync(EVIDENCE_FILE, 'utf8')))
  return true
}
