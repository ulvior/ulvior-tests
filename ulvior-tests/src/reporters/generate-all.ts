import { generateAllPdfs, loadPersistedEvidence } from './pdf-generator'

async function main() {
  if (!loadPersistedEvidence()) {
    console.log('No hay evidencia persistida. Ejecuta cucumber-js primero.')
    return
  }

  await generateAllPdfs()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
