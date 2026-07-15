// ─── src/support/hooks.ts ────────────────────────────────────────────────────
// Global Cucumber hooks:
//   Before       — spin up Selenium driver for @ui scenarios
//   BeforeStep   — record step text/keyword on World
//   AfterStep    — capture screenshot (UI) or API evidence and store it
//   After        — quit driver, finalize scenario evidence
//   AfterAll     — trigger PDF generation

import {
  Before, After, BeforeAll, BeforeStep, AfterStep, AfterAll, setDefaultTimeout,
  ITestCaseHookParameter, ITestStepHookParameter,
} from '@cucumber/cucumber'
import * as path from 'path'
import * as fs   from 'fs'
import { UlviorWorld } from './world'
import { buildDriver } from './driver'
import { evidenceStore, StepEvidence } from '../reporters/evidence-store'
import { ENV } from './env'

// ── Ensure output directories exist ──────────────────────────────────────────
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../reports/screenshots')
const PDFS_DIR        = path.resolve(__dirname, '../../reports/pdfs')
const JSON_DIR        = path.resolve(__dirname, '../../reports/json')
const EVIDENCE_DIR    = path.resolve(__dirname, '../../reports/evidence')
;[SCREENSHOTS_DIR, PDFS_DIR, JSON_DIR, EVIDENCE_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }))

setDefaultTimeout(Math.max(ENV.SELENIUM_TIMEOUT, 90000))

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 80)
}

async function waitForVisualEvidence(world: UlviorWorld) {
  if (!world.driver) return
  const driver = world.driver
  const startedAt = Date.now()
  const maxWaitMs = Math.min(ENV.SELENIUM_TIMEOUT, 12000)

  try {
    await driver.wait(async () => {
      const state = await driver.executeScript(`
        const text = (document.body?.innerText || '').trim();
        const visibleBusy = Array.from(document.querySelectorAll('[aria-busy="true"], .animate-pulse, .skeleton, [data-loading="true"]'))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }).length;
        const hasBlockingLoadingText = /^(cargando|loading|procesando|actualizando)(\\.|\\s|$)/i.test(text);
        return {
          ready: document.readyState,
          textLength: text.length,
          visibleBusy,
          hasBlockingLoadingText,
        };
      `) as any

      const readyEnough = state.ready === 'complete' || state.ready === 'interactive'
      const hasContent = Number(state.textLength ?? 0) > 20
      const idleEnough = Number(state.visibleBusy ?? 0) === 0 && !state.hasBlockingLoadingText
      const waitedEnough = Date.now() - startedAt > 1800
      return readyEnough && hasContent && (idleEnough || waitedEnough)
    }, maxWaitMs)
  } catch {
    // If a page uses long-lived skeletons or streams, keep the screenshot rather than hiding evidence.
  }
}

BeforeAll(function () {
  const featuresDir = path.resolve(__dirname, '../../features')
  const featureFiles = findFeatureFiles(featuresDir)
  const invalid = featureFiles
    .map(file => path.basename(file))
    .filter(file => !/^[A-Z][A-Za-z0-9]*\.feature$/.test(file))

  if (invalid.length) {
    throw new Error(`Los archivos .feature deben ser CamelCase: ${invalid.join(', ')}`)
  }
})

function findFeatureFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return findFeatureFiles(fullPath)
    return entry.isFile() && entry.name.endsWith('.feature') ? [fullPath] : []
  })
}

// ── Before (all): init scenario evidence record ───────────────────────────────
Before(async function (this: UlviorWorld, scenario: ITestCaseHookParameter) {
  const pickle   = scenario.pickle
  const uri      = pickle.uri ?? ''                      // e.g. "features/api/AuthLogin.feature"
  const fileName = path.basename(uri)                    // "AuthLogin.feature"
  const featureName = fileName.replace(/\.feature$/i, '')

  this.currentScenarioEvidence = {
    scenarioName: pickle.name,
    featureName,
    featureFile:  fileName,
    tags:         pickle.tags.map(t => t.name),
    status:       'passed',
    steps:        [],
    startedAt:    new Date().toISOString(),
    finishedAt:   '',
  }
})

// ── Before: start Selenium for UI scenarios ───────────────────────────────────
Before({ tags: '@ui' }, async function (this: UlviorWorld, scenario: ITestCaseHookParameter) {
  this.driver = await buildDriver()
})

// ── BeforeStep: note which step is about to run ───────────────────────────────
BeforeStep(async function (this: UlviorWorld, step: ITestStepHookParameter) {
  const s = (step as any).pickleStep
  this.currentStep = {
    text:    s?.text    ?? '',
    keyword: s?.type    ?? 'Step',
  }
  this.currentStepStartedAt = Date.now()
})

// ── AfterStep: collect evidence for the step that just ran ────────────────────
AfterStep(async function (this: UlviorWorld, step: ITestStepHookParameter) {
  const result  = step.result
  const status  = (result?.status?.toLowerCase() ?? 'unknown') as StepEvidence['status']
  const errMsg  = (result as any)?.error ? String((result as any).error) : undefined
  const durationMs = this.currentStepStartedAt ? Date.now() - this.currentStepStartedAt : undefined

  // Screenshot for UI steps, after giving async UI data a chance to render.
  if (this.driver) await waitForVisualEvidence(this)
  const screenshot = this.driver ? await this.captureScreenshot() : undefined

  // Save screenshot to disk for reference
  if (screenshot) {
    const featureDir = safeName(this.currentScenarioEvidence.featureName || 'Feature')
    const scenarioDir = safeName(this.currentScenarioEvidence.scenarioName || 'Scenario')
    const dir = path.join(SCREENSHOTS_DIR, featureDir, scenarioDir)
    fs.mkdirSync(dir, { recursive: true })
    const stepName = safeName(this.currentStep.text || 'step')
    const stepNo = String(this.currentScenarioEvidence.steps.length + 1).padStart(2, '0')
    const filePath = path.join(dir, `${stepNo}_${stepName}.png`)
    fs.writeFileSync(filePath, Buffer.from(screenshot, 'base64'))
  }

  const evidence: StepEvidence = {
    stepText:    this.currentStep.text,
    keyword:     this.currentStep.keyword ?? 'Step',
    status,
    screenshot,
    apiEvidence: this.lastApiEvidence,
    error:       errMsg,
    timestamp:   new Date().toISOString(),
    durationMs,
  }

  this.recordStep(evidence)

  // Reset lastApiEvidence after capturing it
  this.lastApiEvidence = undefined
})

// ── After: finalise scenario, quit driver ────────────────────────────────────
After(async function (this: UlviorWorld, scenario: ITestCaseHookParameter) {
  const result = scenario.result
  this.currentScenarioEvidence.status    = result?.status === 'PASSED' ? 'passed' : 'failed'
  this.currentScenarioEvidence.finishedAt = new Date().toISOString()

  // Capture final screenshot on failure (UI)
  if (this.driver && result?.status !== 'PASSED') {
    const shot = await this.captureScreenshot()
    if (shot) {
      const filePath = path.join(SCREENSHOTS_DIR, `FAIL_${Date.now()}.png`)
      fs.writeFileSync(filePath, Buffer.from(shot, 'base64'))
    }
  }

  evidenceStore.addScenario(this.currentScenarioEvidence)

  if (this.driver) {
    await this.driver.quit()
    this.driver = undefined
  }
})

// ── AfterAll: generate PDFs once all scenarios are done ──────────────────────
AfterAll(async function () {
  const { generateAllPdfs, persistEvidence } = await import('../reporters/pdf-generator')
  const evidencePath = persistEvidence()
  console.log(`\n🧾 Evidence JSON written to: ${evidencePath}`)
  await generateAllPdfs()
  console.log(`\n📄 PDF reports written to: ${PDFS_DIR}`)
})
