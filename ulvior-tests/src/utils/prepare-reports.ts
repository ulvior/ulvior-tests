import * as fs from 'fs'
import * as path from 'path'

const REPORTS_DIR = path.resolve(__dirname, '../../reports')
const REPORT_DIRS = ['screenshots', 'pdfs', 'json', 'evidence']

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Prepara las carpetas canonicas de reportes sin borrar ni duplicar evidencia.')
  process.exit(0)
}

fs.mkdirSync(REPORTS_DIR, { recursive: true })

for (const dir of REPORT_DIRS) {
  fs.mkdirSync(path.join(REPORTS_DIR, dir), { recursive: true })
}

console.log(`Reportes listos en: ${REPORTS_DIR}`)
