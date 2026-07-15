import * as fs from 'fs'
import * as path from 'path'

const REPORTS_DIR = path.resolve(__dirname, '../../reports')
const REPORT_DIRS = ['screenshots', 'pdfs', 'json', 'evidence']
const RUN_ID = process.env.E2E_RUN_ID ?? 'E2E-20260713-ULVIOR-QA-001'
const E2E_REPORTS_DIR = path.resolve(__dirname, '../../e2e-reports', RUN_ID)
const E2E_GENERATED_DIRS = ['screenshots', 'api-responses', 'logs', 'emails', 'pdfs']

type Flow = 'full' | 'admin' | 'candidato' | 'empresa'

const FLOW_FEATURES: Record<Exclude<Flow, 'full'>, string[]> = {
  admin: ['AdminBackendE2E', 'AdminAuthenticatedFlow', 'AdminControlledActions'],
  candidato: ['CandidateBackendE2E', 'CandidateAuthenticatedFlow', 'CandidateControlledActions'],
  empresa: ['CompanyBackendE2E', 'CompanyAuthenticatedFlow', 'CompanyControlledActions'],
}

const FLOW_E2E_FILES: Record<Exclude<Flow, 'full'>, string[]> = {
  admin: ['admin-evidence.json', '01-admin-e2e-report.pdf'],
  candidato: ['candidato-evidence.json', '02-candidato-e2e-report.pdf'],
  empresa: ['empresa-evidence.json', '03-empresa-e2e-report.pdf'],
}

function emptyDir(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

function parseFlow(): Flow {
  const rawArg = process.argv.find((arg) => arg.startsWith('--flow='))
  const raw = (rawArg?.split('=')[1] ?? process.env.E2E_FLOW ?? 'full').toLowerCase()
  if (raw === 'admin' || raw === 'candidato' || raw === 'empresa' || raw === 'full') return raw
  throw new Error(`Flujo de limpieza no soportado: ${raw}. Usa full, admin, candidato o empresa.`)
}

function removeIfExists(target: string) {
  fs.rmSync(target, { recursive: true, force: true })
}

function cleanFlow(flow: Exclude<Flow, 'full'>) {
  const features = FLOW_FEATURES[flow]
  const files = FLOW_E2E_FILES[flow]

  for (const feature of features) {
    removeIfExists(path.join(REPORTS_DIR, 'screenshots', feature))
    removeIfExists(path.join(REPORTS_DIR, 'pdfs', `${feature}.pdf`))
  }

  removeIfExists(path.join(REPORTS_DIR, 'json', `final-${flow}-flow.json`))
  removeIfExists(path.join(E2E_REPORTS_DIR, 'api-responses', files[0]))
  removeIfExists(path.join(E2E_REPORTS_DIR, 'pdfs', files[1]))
  removeIfExists(path.join(E2E_REPORTS_DIR, 'pdfs', '00-e2e-master-index.pdf'))

  fs.mkdirSync(path.join(REPORTS_DIR, 'screenshots'), { recursive: true })
  fs.mkdirSync(path.join(REPORTS_DIR, 'pdfs'), { recursive: true })
  fs.mkdirSync(path.join(REPORTS_DIR, 'json'), { recursive: true })
  fs.mkdirSync(path.join(REPORTS_DIR, 'evidence'), { recursive: true })
  for (const dir of E2E_GENERATED_DIRS) {
    fs.mkdirSync(path.join(E2E_REPORTS_DIR, dir), { recursive: true })
  }
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Limpia capturas/PDF/JSON generados. --flow=full limpia todo; --flow=admin|candidato|empresa limpia solo ese flujo.')
  process.exit(0)
}

fs.mkdirSync(REPORTS_DIR, { recursive: true })

const flow = parseFlow()

if (flow === 'full') {
  for (const dir of REPORT_DIRS) {
    emptyDir(path.join(REPORTS_DIR, dir))
  }

  for (const dir of E2E_GENERATED_DIRS) {
    emptyDir(path.join(E2E_REPORTS_DIR, dir))
  }
  removeIfExists(path.join(E2E_REPORTS_DIR, 'api-responses', 'e2e-runtime-state.json'))
} else {
  cleanFlow(flow)
}

console.log(`Limpieza ${flow} aplicada en: ${REPORTS_DIR}`)
console.log(`Evidencia E2E preparada en: ${E2E_REPORTS_DIR}`)
