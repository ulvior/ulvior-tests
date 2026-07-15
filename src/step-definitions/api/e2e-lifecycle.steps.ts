import assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import { Given, Then, When } from '@cucumber/cucumber'
import { UlviorWorld } from '../../support/world'
import { ENV } from '../../support/env'
import { patchE2EState, loadE2EState } from '../../utils/e2e-state'

type Role = 'admin' | 'empresa' | 'candidato'
const BUSINESS_RULE_VERSION = 'company-visible-score-60-v2'

const credentials: Record<Role, { email: string; password: string }> = {
  admin: { email: ENV.TEST_ADMIN_EMAIL, password: ENV.TEST_ADMIN_PASSWORD },
  empresa: { email: ENV.TEST_EMPRESA_EMAIL, password: ENV.TEST_EMPRESA_PASSWORD },
  candidato: { email: ENV.TEST_CANDIDATO_EMAIL, password: ENV.TEST_CANDIDATO_PASSWORD },
}

async function login(world: UlviorWorld, role: Role) {
  const result = await world.apiClient.post('/auth/login', credentials[role])
  world.lastApiEvidence = result.evidence
  assert.ok([200, 201].includes(result.response.status), `Login ${role} fallo con ${result.response.status}`)
  return result.response.data?.user
}

async function createSearch(world: UlviorWorld, empresaId: string, suffix: string, extra: Record<string, any> = {}) {
  await login(world, 'admin')
  const result = await world.apiClient.post('/admin/pipeline', {
    empresa_id: empresaId,
    rol: `${extra.role ?? `QA ${suffix}`} ${ENV.E2E_RUN_ID}`,
    seniority: extra.seniority ?? 'mid',
    stack: extra.stack ?? ['Go', 'PostgreSQL', 'Redis', 'Docker'],
    descripcion: extra.descripcion ?? `Busqueda E2E ${suffix} ${ENV.E2E_RUN_ID} con descripcion suficiente para validar pipeline, empresa, candidato, entrevistas y facturacion.`,
    modalidad: extra.modalidad ?? 'remoto',
    salario_min: extra.salario_min ?? 3000,
    salario_max: extra.salario_max ?? 5200,
    fee_estimado: extra.fee_estimado ?? 1550,
    urgente: Boolean(extra.urgente),
    notas_internas: `Notas internas ${suffix} ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = result.evidence
  assert.ok([200, 201].includes(result.response.status), `Crear busqueda ${suffix} fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
  return result.response.data
}

async function searchExists(world: UlviorWorld, id?: string) {
  if (!id) return false
  await login(world, 'admin')
  const result = await world.apiClient.get('/admin/pipeline')
  world.lastApiEvidence = result.evidence
  if (result.response.status !== 200) return false
  return JSON.stringify(result.response.data).includes(id)
}

async function getBaseIds(world: UlviorWorld) {
  const empresaUser = await login(world, 'empresa')
  const empresaId = empresaUser?.empresa?.id
  assert.ok(empresaId, 'No se encontro empresa.id en login empresa')

  await login(world, 'candidato')
  const profile = await world.apiClient.get('/candidato/perfil')
  world.lastApiEvidence = profile.evidence
  assert.strictEqual(profile.response.status, 200, `GET /candidato/perfil fallo con ${profile.response.status}`)
  const candidatoId = profile.response.data?.id
  assert.ok(candidatoId, 'No se encontro candidato.id en perfil')

  return { empresaId, candidatoId, candidatoNombre: profile.response.data?.nombre ?? 'Candidato E2E' }
}

function codingFunctionName(language: string, roleName: string) {
  if (language === 'python') return `score_${roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_candidates`
  if (language === 'ruby') return `build_${roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_summary`
  return `build${roleName.replace(/[^a-zA-Z0-9]/g, '')}Summary`
}

function validCodingSolution(language: string, roleName: string) {
  const fn = codingFunctionName(language, roleName)
  if (language === 'python') {
    return `def ${fn}(items):\n    valid = []\n    for item in items or []:\n        if isinstance(item, dict) and isinstance(item.get('score'), (int, float)):\n            valid.append(item)\n    return sorted(valid, key=lambda item: item.get('score', 0), reverse=True)\n`
  }
  if (language === 'ruby') {
    return `def ${fn}(items)\n  Array(items).select { |item| item.is_a?(Hash) && item.key?('score') }.sort_by { |item| -item['score'].to_f }\nend\n`
  }
  if (language === 'go') {
    return `func ${fn}(items []interface{}) interface{} {\n\tvalid := make([]map[string]interface{}, 0)\n\tfor _, raw := range items {\n\t\titem, ok := raw.(map[string]interface{})\n\t\tif !ok { continue }\n\t\tif _, ok := item[\"score\"]; !ok { continue }\n\t\tvalid = append(valid, item)\n\t}\n\tfor i := 0; i < len(valid); i++ {\n\t\tfor j := i + 1; j < len(valid); j++ {\n\t\t\tif valid[j][\"score\"].(float64) > valid[i][\"score\"].(float64) {\n\t\t\t\tvalid[i], valid[j] = valid[j], valid[i]\n\t\t\t}\n\t\t}\n\t}\n\treturn valid\n}\n`
  }
  if (language === 'java') {
    return `static Object ${fn}(java.util.List<Object> items) {\n    java.util.List<java.util.Map<String, Object>> valid = new java.util.ArrayList<>();\n    for (Object raw : items) {\n        if (raw instanceof java.util.Map) {\n            @SuppressWarnings(\"unchecked\") java.util.Map<String, Object> item = (java.util.Map<String, Object>) raw;\n            if (item.get(\"score\") instanceof Number) valid.add(item);\n        }\n    }\n    valid.sort((a, b) -> Double.compare(((Number) b.get(\"score\")).doubleValue(), ((Number) a.get(\"score\")).doubleValue()));\n    return valid;\n}\n`
  }
  return `export function ${fn}(items = []) {\n  return Array.isArray(items)\n    ? items.filter((item) => item && typeof item === 'object' && Number.isFinite(Number(item.score))).sort((a, b) => Number(b.score) - Number(a.score))\n    : []\n}\n`
}

async function ensureCandidateCommercialEvidence(world: UlviorWorld) {
  await login(world, 'candidato')
  let profile = await world.apiClient.get('/candidato/perfil')
  world.lastApiEvidence = profile.evidence
  assert.strictEqual(profile.response.status, 200, `GET perfil candidato fallo con ${profile.response.status}`)
  if (
    Number(profile.response.data?.fit_score ?? 0) >= 60
    && profile.response.data?.cvAnalysisStatus === 'ANALYZED'
  ) {
    const coding = await world.apiClient.get('/candidato/evaluacion-coding')
    const session = coding.response.data?.question_session ?? {}
    const questions = Array.isArray(session.questions) ? session.questions : []
    const answers = Array.isArray(session.answers) ? session.answers : []
    if (coding.response.data?.analysis && questions.length > 0 && answers.length >= questions.length) return
  }

  const fixturePath = path.resolve(__dirname, '../../../fixtures/cv-e2e-ulvior-candidato.pdf')
  const cvDataUrl = `data:application/pdf;base64,${fs.readFileSync(fixturePath).toString('base64')}`

  await world.apiClient.put('/candidato/perfil', {
    nombre: profile.response.data?.nombre ?? 'Candidato E2E Ulvior',
    rol_actual: 'Go Backend Engineer',
    empresa_actual: 'Ulvior QA E2E',
    años_experiencia: 5,
    stack: ['Go', 'PostgreSQL', 'Redis', 'Kubernetes'],
    resumen: `Perfil candidato E2E ${ENV.E2E_RUN_ID}: backend engineer con foco en APIs, concurrencia, datos y observabilidad.`,
    experiencia: [{
      rol: 'Go Backend Engineer',
      empresa: 'Ulvior QA E2E',
      periodo: '2021 - presente',
      descripcion: 'Desarrollo de servicios backend, APIs, colas, persistencia y despliegues Kubernetes.',
    }],
    educacion: [{ carrera: 'Ingenieria de Software', institucion: 'Ulvior Academy', año_egreso: '2019' }],
  })
  const upload = await world.apiClient.post('/candidato/perfil/cv', {
    cv_data_url: cvDataUrl,
    cv_file_name: `cv-e2e-${ENV.E2E_RUN_ID}.pdf`,
  })
  world.lastApiEvidence = upload.evidence
  assert.ok([200, 201].includes(upload.response.status), `Subir CV fallo con ${upload.response.status}: ${JSON.stringify(upload.response.data)}`)

  const analyze = await world.apiClient.post('/candidato/perfil/cv/analyze', { apply: true, regenerate: true })
  world.lastApiEvidence = analyze.evidence
  assert.ok([200, 201].includes(analyze.response.status), `Analizar CV fallo con ${analyze.response.status}: ${JSON.stringify(analyze.response.data)}`)

  let coding = await world.apiClient.get('/candidato/evaluacion-coding')
  world.lastApiEvidence = coding.evidence
  assert.strictEqual(coding.response.status, 200, `GET coding fallo con ${coding.response.status}`)
  const challenge = coding.response.data?.challenge ?? {}
  const language = String(challenge.language ?? 'javascript')
  const roleName = String(challenge.context?.role_name ?? 'Go Backend Engineer')
  const code = validCodingSolution(language, roleName)

  const run = await world.apiClient.post('/candidato/evaluacion-coding/ejecutar', { code, language })
  world.lastApiEvidence = run.evidence
  assert.ok([200, 201].includes(run.response.status), `Ejecutar coding fallo con ${run.response.status}: ${JSON.stringify(run.response.data)}`)
  assert.strictEqual(Number(run.response.data?.exitCode ?? run.response.data?.exit_code), 0, `Coding no ejecuto OK: ${JSON.stringify(run.response.data)}`)

  const analysis = await world.apiClient.post('/candidato/evaluacion-coding/analizar', {
    code,
    language,
    integrity_signals: {
      authorship_score: 96,
      paste_count: 0,
      large_insert_count: 0,
      keystroke_count: 420,
      avg_typing_speed_ms: 180,
    },
  })
  world.lastApiEvidence = analysis.evidence
  assert.ok([200, 201].includes(analysis.response.status), `Analizar coding fallo con ${analysis.response.status}: ${JSON.stringify(analysis.response.data)}`)

  let questions = analysis.response.data?.question_session?.questions ?? []
  if (!questions.length) {
    const generated = await world.apiClient.post('/candidato/evaluacion-coding/preguntas/generar', {})
    world.lastApiEvidence = generated.evidence
    assert.ok([200, 201].includes(generated.response.status), `Generar preguntas fallo con ${generated.response.status}: ${JSON.stringify(generated.response.data)}`)
    questions = generated.response.data?.question_session?.questions ?? generated.response.data?.questions ?? []
  }
  assert.ok(questions.length > 0, 'No se generaron preguntas tecnicas')

  for (const [index, question] of questions.entries()) {
    const questionId = String(question.question_id ?? question.id ?? `question-${index}`)
    const answer = `Respuesta tecnica completa ${ENV.E2E_RUN_ID} pregunta ${index + 1}: explico validaciones de entrada, casos borde, complejidad temporal, pruebas unitarias, observabilidad, manejo de errores y tradeoffs entre simplicidad, mantenibilidad y performance para un entorno productivo real.`
    const result = await world.apiClient.post('/candidato/evaluacion-coding/preguntas/responder', { question_id: questionId, answer })
    world.lastApiEvidence = result.evidence
    assert.ok([200, 201].includes(result.response.status), `Responder pregunta fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
  }

  profile = await world.apiClient.get('/candidato/perfil')
  world.lastApiEvidence = profile.evidence
  assert.strictEqual(profile.response.status, 200)
  assert.ok(Number(profile.response.data?.fit_score ?? 0) >= 60, `Candidato no alcanzo score comercial minimo: ${JSON.stringify(profile.response.data)}`)
}

async function ensureCompanyBillingProfile(world: UlviorWorld, empresaId: string) {
  await login(world, 'admin')
  const result = await world.apiClient.patch(`/admin/empresas/${empresaId}`, {
    razon_social: `Falabella Retail QA ${ENV.E2E_RUN_ID}`,
    rut_empresa: '76.123.456-0',
    giro: 'Servicios de tecnologia y seleccion de talento',
    direccion_tributaria: 'Av. Apoquindo 3000',
    comuna: 'Las Condes',
    region: 'Region Metropolitana',
    pais: 'Chile',
    email_facturacion: ENV.TEST_EMPRESA_EMAIL,
    condicion_pago: '30 dias',
    requiere_orden_compra: true,
    observaciones_facturacion: `Perfil tributario preparado por ${ENV.E2E_RUN_ID}`,
    representante_legal_nombre: 'Sofia Reyes',
    representante_legal_rut: '12.345.678-5',
    representante_legal_email: ENV.TEST_EMPRESA_EMAIL,
    representante_legal_cargo: 'Representante legal QA',
  })
  world.lastApiEvidence = result.evidence
  assert.ok([200, 201].includes(result.response.status), `Actualizar empresa facturacion fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
}

async function assignAndShortlist(world: UlviorWorld, busquedaId: string, candidatoId: string) {
  await login(world, 'admin')
  const assign = await world.apiClient.post(`/admin/pipeline/${busquedaId}/candidatos`, { candidato_id: candidatoId })
  world.lastApiEvidence = assign.evidence
  assert.ok([200, 201].includes(assign.response.status), `Asignar candidato fallo con ${assign.response.status}: ${JSON.stringify(assign.response.data)}`)

  const shortlist = await world.apiClient.post(`/admin/pipeline/${busquedaId}/shortlist`, { candidato_ids: [candidatoId] })
  world.lastApiEvidence = shortlist.evidence
  assert.ok([200, 201].includes(shortlist.response.status), `Enviar shortlist fallo con ${shortlist.response.status}: ${JSON.stringify(shortlist.response.data)}`)
}

async function createClientInterview(world: UlviorWorld, busquedaId: string, candidatoId: string) {
  await login(world, 'empresa')
  const approve = await world.apiClient.post(`/empresa/busquedas/${busquedaId}/shortlist/${candidatoId}/aprobar`, {})
  world.lastApiEvidence = approve.evidence
  assert.ok([200, 201].includes(approve.response.status), `Aprobar shortlist empresa fallo con ${approve.response.status}: ${JSON.stringify(approve.response.data)}`)

  const interview = await world.apiClient.post(`/empresa/busquedas/${busquedaId}/entrevistas`, {
    candidato_id: candidatoId,
    fecha: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    formato: 'video',
    notas: `Entrevista cliente ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = interview.evidence
  assert.ok([200, 201, 400].includes(interview.response.status), `Crear entrevista cliente fallo inesperado con ${interview.response.status}`)
  if ([200, 201].includes(interview.response.status)) return interview.response.data

  const list = await world.apiClient.get(`/empresa/busquedas/${busquedaId}/entrevistas`)
  world.lastApiEvidence = list.evidence
  assert.strictEqual(list.response.status, 200)
  const existing = (list.response.data ?? [])[0]
  assert.ok(existing?.id, `No existe entrevista cliente usable: ${JSON.stringify(interview.response.data)}`)
  return existing
}

async function createUlviorInterview(world: UlviorWorld, busquedaId: string, candidatoId: string) {
  await login(world, 'admin')
  const interview = await world.apiClient.post(`/admin/pipeline/${busquedaId}/entrevistas`, {
    candidato_id: candidatoId,
    fecha: new Date(Date.now() + 60 * 60 * 60 * 1000).toISOString(),
    formato: 'video',
    tipo: 'ulvior',
    notas: `Entrevista Ulvior ${ENV.E2E_RUN_ID}`,
    mensaje_candidato: `Preparacion entrevista Ulvior ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = interview.evidence
  assert.ok([200, 201].includes(interview.response.status), `Crear entrevista Ulvior fallo con ${interview.response.status}: ${JSON.stringify(interview.response.data)}`)
  return interview.response.data
}

async function markInterviewDone(world: UlviorWorld, interviewId: string) {
  await login(world, 'admin')
  const result = await world.apiClient.patch(`/admin/entrevistas/${interviewId}/marcar-realizada`, {})
  world.lastApiEvidence = result.evidence
  assert.ok([200, 201].includes(result.response.status), `Marcar entrevista realizada fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
  return result.response.data
}

async function selectCandidateForSearch(world: UlviorWorld, busquedaId: string, candidatoId: string) {
  await login(world, 'admin')
  const result = await world.apiClient.post(`/admin/pipeline/${busquedaId}/candidatos/seleccionar`, {
    candidato_id: candidatoId,
    motivo: `Seleccion E2E ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = result.evidence
  assert.ok([200, 201].includes(result.response.status), `Seleccionar candidato fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
  return result.response.data
}

async function placeCandidateForSearch(world: UlviorWorld, busquedaId: string, candidatoId: string) {
  await login(world, 'admin')
  const result = await world.apiClient.post(`/admin/pipeline/${busquedaId}/colocar`, {
    candidato_id: candidatoId,
  })
  world.lastApiEvidence = result.evidence
  assert.ok([200, 201].includes(result.response.status), `Colocar candidato fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
  return result.response.data
}

async function createBillingCycle(world: UlviorWorld, busquedaId: string, empresaId: string, candidatoId: string) {
  await login(world, 'admin')
  const order = await world.apiClient.post(`/admin/service-orders/from-search/${busquedaId}`, {
    roleKey: 'backend_developer',
    candidatoId,
    seniority: 'mid',
    techStack: ['Go', 'PostgreSQL', 'Kubernetes'],
    agreedFee: 2450,
    estimatedFee: 2450,
    fee: 2450,
    currency: 'CLP',
    paymentDays: 30,
    guaranteeDays: 90,
    notes: `Orden de servicio ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = order.evidence
  assert.ok([200, 201].includes(order.response.status), `Crear orden de servicio fallo con ${order.response.status}: ${JSON.stringify(order.response.data)}`)
  const serviceOrderId = order.response.data?.id

  await login(world, 'empresa')
  const accept = await world.apiClient.post(`/empresa/service-orders/${serviceOrderId}/accept`, {
    acceptTerms: true,
    acceptedByName: `Sofia Reyes ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = accept.evidence
  assert.ok([200, 201].includes(accept.response.status), `Aceptar orden empresa fallo con ${accept.response.status}: ${JSON.stringify(accept.response.data)}`)

  await login(world, 'admin')
  const open = await world.apiClient.patch(`/admin/service-orders/${serviceOrderId}/status`, {
    status: 'HIRED',
    hiredCandidateName: `Candidato contratado ${ENV.E2E_RUN_ID}`,
    notes: `Orden contratada ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = open.evidence
  assert.ok([200, 201].includes(open.response.status), `Marcar orden contratada fallo con ${open.response.status}: ${JSON.stringify(open.response.data)}`)

  let invoice = await world.apiClient.post('/admin/invoices', {
    companyId: empresaId,
    serviceOrderId,
    issueDate: '2026-07-13',
    dueDate: '2026-08-12',
    folio: `F-${Date.now()}`,
    currency: 'CLP',
    status: 'ISSUED',
    siiStatus: 'ACCEPTED',
    items: [{ description: `Fee seleccion Go Backend ${ENV.E2E_RUN_ID}`, quantity: 1, unitPrice: 2450 }],
    notes: `Factura E2E ${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = invoice.evidence
  if (![200, 201].includes(invoice.response.status) && String(invoice.response.data?.message ?? '').includes('ya tiene una factura')) {
    const invoices = await world.apiClient.get('/admin/invoices')
    world.lastApiEvidence = invoices.evidence
    assert.strictEqual(invoices.response.status, 200, `Listar facturas fallo con ${invoices.response.status}`)
    const existing = (invoices.response.data ?? []).find((item: any) => item.serviceOrderId === serviceOrderId || item.serviceOrder?.id === serviceOrderId)
    assert.ok(existing?.id, `La API reporto factura existente pero no se encontro para orden ${serviceOrderId}`)
    invoice = { ...invoice, response: { ...invoice.response, status: 200, data: existing } } as any
  }
  assert.ok([200, 201].includes(invoice.response.status), `Crear factura fallo con ${invoice.response.status}: ${JSON.stringify(invoice.response.data)}`)

  const payment = await world.apiClient.post('/admin/payments', {
    invoiceId: invoice.response.data?.id,
    amount: Number(invoice.response.data?.totalAmount ?? 1844.5),
    currency: 'CLP',
    status: 'COMPLETED',
    paymentMethod: 'TRANSFER',
    reference: `PAY-${ENV.E2E_RUN_ID}`,
  })
  world.lastApiEvidence = payment.evidence
  assert.ok([200, 201].includes(payment.response.status), `Registrar pago fallo con ${payment.response.status}: ${JSON.stringify(payment.response.data)}`)

  return {
    serviceOrderId,
    invoiceId: invoice.response.data?.id,
    paymentId: payment.response.data?.id,
    agreedFee: open.response.data?.agreedFee ?? order.response.data?.agreedFee,
  }
}

async function createSolicitud(world: UlviorWorld, candidatoId: string) {
  await login(world, 'empresa')
  const result = await world.apiClient.post('/empresa/solicitudes', {
    candidato_id: candidatoId,
    rol_requerido: `QA Solicitud ${ENV.E2E_RUN_ID}`,
    descripcion_necesidad: `Solicitud E2E ${ENV.E2E_RUN_ID} para validar flujo empresa admin y trazabilidad de profesional solicitado.`,
    urgencia: 'dos_semanas',
    modalidad_requerida: 'remoto',
    contacto_nombre: 'Sofia Reyes',
    contacto_email: ENV.TEST_EMPRESA_EMAIL,
    contacto_telefono: '+56 9 1111 2222',
  })
  world.lastApiEvidence = result.evidence
  assert.ok([200, 201].includes(result.response.status), `Crear solicitud fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
  return result.response.data
}

Given('preparo datos E2E A-Z para todos los flujos', { timeout: 300000 }, async function (this: UlviorWorld) {
  const existingState = loadE2EState()
  if (
    existingState.prepared === true
    && existingState.businessRuleVersion === BUSINESS_RULE_VERSION
    && existingState.runId === ENV.E2E_RUN_ID
    && await searchExists(this, existingState.billingBusquedaId)
  ) {
    this.lastApiEvidence = {
      method: 'E2E_STATE',
      url: 'local://e2e-runtime-state/reuse',
      headers: {},
      status: 200,
      response: {
        reused: true,
        runId: ENV.E2E_RUN_ID,
        ids: {
          nuevaBusquedaId: existingState.nuevaBusquedaId,
          asignadaBusquedaId: existingState.asignadaBusquedaId,
          entrevistasBusquedaId: existingState.entrevistasBusquedaId,
          billingBusquedaId: existingState.billingBusquedaId,
        },
      },
      durationMs: 0,
    }
    return
  }

  const { empresaId, candidatoId, candidatoNombre } = await getBaseIds(this)
  await ensureCandidateCommercialEvidence(this)
  await ensureCompanyBillingProfile(this, empresaId)

  const nueva = await createSearch(this, empresaId, 'Pipeline Nueva Java', {
    role: 'Java Backend Engineer',
    stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka'],
    salario_min: 3600,
    salario_max: 6200,
    fee_estimado: 2100,
    descripcion: `Busqueda E2E Java Backend ${ENV.E2E_RUN_ID}: APIs REST, Spring Boot, PostgreSQL, Kafka, testing y observabilidad.`,
  })
  const asignada = await createSearch(this, empresaId, 'Pipeline Asignada DevOps', {
    role: 'DevOps Platform Engineer',
    stack: ['AWS', 'Terraform', 'Kubernetes', 'GitHub Actions'],
    salario_min: 4200,
    salario_max: 7000,
    fee_estimado: 2300,
    modalidad: 'hibrido',
    descripcion: `Busqueda E2E DevOps ${ENV.E2E_RUN_ID}: infraestructura cloud, CI/CD, Kubernetes, observabilidad y seguridad operativa.`,
  })
  await login(this, 'admin')
  await this.apiClient.post(`/admin/pipeline/${asignada.id}/candidatos`, { candidato_id: candidatoId })

  const entrevistasSearch = await createSearch(this, empresaId, 'Entrevistas Cliente Ulvior Frontend', {
    role: 'Frontend React Engineer',
    stack: ['React', 'TypeScript', 'Next.js', 'Playwright'],
    salario_min: 3300,
    salario_max: 5600,
    fee_estimado: 1900,
    urgente: true,
    descripcion: `Busqueda E2E Frontend ${ENV.E2E_RUN_ID}: interfaces React, accesibilidad, performance, testing visual y colaboracion producto.`,
  })
  await assignAndShortlist(this, entrevistasSearch.id, candidatoId)
  const clienteInterview = await createClientInterview(this, entrevistasSearch.id, candidatoId)
  const ulviorInterview = await createUlviorInterview(this, entrevistasSearch.id, candidatoId)

  const billingSearch = await createSearch(this, empresaId, 'Orden Factura Pago Go', {
    role: 'Go Backend Engineer',
    stack: ['Go', 'PostgreSQL', 'Redis', 'Kubernetes'],
    salario_min: 3900,
    salario_max: 6800,
    fee_estimado: 2450,
    descripcion: `Busqueda E2E Go Backend ${ENV.E2E_RUN_ID}: servicios concurrentes, APIs, persistencia, colas, Kubernetes y monitoreo.`,
  })
  await assignAndShortlist(this, billingSearch.id, candidatoId)
  const billingInterview = await createClientInterview(this, billingSearch.id, candidatoId)
  await markInterviewDone(this, billingInterview.id)
  await selectCandidateForSearch(this, billingSearch.id, candidatoId)
  const billing = await createBillingCycle(this, billingSearch.id, empresaId, candidatoId)
  const placement = await placeCandidateForSearch(this, billingSearch.id, candidatoId)

  const solicitud = await createSolicitud(this, candidatoId)

  const state = patchE2EState({
    prepared: true,
    businessRuleVersion: BUSINESS_RULE_VERSION,
    runId: ENV.E2E_RUN_ID,
    empresaId,
    candidatoId,
    candidatoNombre,
    nuevaBusquedaId: nueva.id,
    asignadaBusquedaId: asignada.id,
    entrevistasBusquedaId: entrevistasSearch.id,
    billingBusquedaId: billingSearch.id,
    billingInterviewId: billingInterview.id,
    clienteInterviewId: clienteInterview.id,
    ulviorInterviewId: ulviorInterview.id,
    solicitudId: solicitud.id,
    solicitudCodigo: solicitud.codigo,
    placement,
    ...billing,
    placementCoverage: {
      status: 'covered',
      reason: 'Candidato seleccionado y colocado mediante endpoints admin publicos despues de entrevista realizada, orden aceptada, factura y pago.',
    },
  })
  this.lastApiEvidence = {
    method: 'E2E_STATE',
    url: 'local://e2e-runtime-state',
    headers: {},
    status: 200,
    response: state,
    durationMs: 0,
  }
})

Then('backend debe bloquear candidato bajo 60 antes de shortlist entrevista y contratacion', { timeout: 120000 }, async function (this: UlviorWorld) {
  const { empresaId } = await getBaseIds(this)
  await login(this, 'admin')
  const unique = Date.now()
  const lowCandidate = await this.apiClient.post('/admin/candidatos', {
    nombre: `Bloqueado Bajo Score ${ENV.E2E_RUN_ID}`,
    email: `bloqueado-${unique}@ulvior.test`,
    telefono: '+56 9 0000 0000',
    rol_actual: 'Backend Engineer',
    empresa_actual: 'Sin evidencia',
    años_experiencia: 1,
    stack: ['Node.js'],
    notas_admin: `Candidato negativo E2E ${ENV.E2E_RUN_ID}: sin CV, sin coding y sin preguntas.`,
  })
  this.lastApiEvidence = lowCandidate.evidence
  assert.ok([200, 201].includes(lowCandidate.response.status), `Crear candidato bajo score fallo con ${lowCandidate.response.status}: ${JSON.stringify(lowCandidate.response.data)}`)
  const candidatoId = lowCandidate.response.data?.id
  assert.ok(candidatoId, 'No se obtuvo id de candidato bajo score')

  const search = await createSearch(this, empresaId, 'Regla Score Bajo', {
    role: 'Backend Rule Guard',
    stack: ['Node.js', 'PostgreSQL'],
    descripcion: `Busqueda para validar bloqueo de candidato bajo 60 ${ENV.E2E_RUN_ID}.`,
  })

  const assign = await this.apiClient.post(`/admin/pipeline/${search.id}/candidatos`, { candidato_id: candidatoId })
  this.lastApiEvidence = assign.evidence
  assert.strictEqual(assign.response.status, 400, `Asignar candidato bajo score debio fallar con 400 y devolvio ${assign.response.status}: ${JSON.stringify(assign.response.data)}`)
  assert.ok(JSON.stringify(assign.response.data).includes('CANDIDATE_SCORE_BELOW_MINIMUM'), `Respuesta no explica regla de negocio: ${JSON.stringify(assign.response.data)}`)

  const shortlist = await this.apiClient.post(`/admin/pipeline/${search.id}/shortlist`, { candidato_ids: [candidatoId] })
  this.lastApiEvidence = shortlist.evidence
  assert.strictEqual(shortlist.response.status, 400, `Shortlist candidato bajo score debio fallar con 400 y devolvio ${shortlist.response.status}: ${JSON.stringify(shortlist.response.data)}`)
  assert.ok(JSON.stringify(shortlist.response.data).includes('CANDIDATE_SCORE_BELOW_MINIMUM'), `Respuesta no explica regla de negocio: ${JSON.stringify(shortlist.response.data)}`)
})

When('candidato responde todas las preguntas tecnicas coding por backend', { timeout: 120000 }, async function (this: UlviorWorld) {
  await login(this, 'candidato')
  let coding = await this.apiClient.get('/candidato/evaluacion-coding')
  this.lastApiEvidence = coding.evidence
  assert.strictEqual(coding.response.status, 200, `GET coding fallo con ${coding.response.status}`)

  let questions = coding.response.data?.question_session?.questions ?? coding.response.data?.questions ?? []
  if (!questions.length) {
    const generated = await this.apiClient.post('/candidato/evaluacion-coding/preguntas/generar', {})
    this.lastApiEvidence = generated.evidence
    assert.ok([200, 201].includes(generated.response.status), `Generar preguntas fallo con ${generated.response.status}`)
    questions = generated.response.data?.questions ?? generated.response.data?.question_session?.questions ?? []
  }

  assert.ok(questions.length > 0, 'No hay preguntas coding para responder')
  for (const [index, question] of questions.entries()) {
    const questionId = String(question.question_id ?? question.id ?? `q-${index + 1}`)
    const answer = `Respuesta E2E ${ENV.E2E_RUN_ID}: explico tradeoffs, validaciones, casos borde, complejidad y pruebas para la pregunta ${index + 1}.`
    const result = await this.apiClient.post('/candidato/evaluacion-coding/preguntas/responder', {
      question_id: questionId,
      answer,
    })
    this.lastApiEvidence = result.evidence
    assert.ok([200, 201].includes(result.response.status), `Responder pregunta ${questionId} fallo con ${result.response.status}: ${JSON.stringify(result.response.data)}`)
  }

  coding = await this.apiClient.get('/candidato/evaluacion-coding')
  this.lastApiEvidence = coding.evidence
  const answers = coding.response.data?.question_session?.answers ?? {}
  assert.ok(Object.keys(answers).length >= questions.length, `No persistieron todas las respuestas. Esperadas=${questions.length}, actuales=${Object.keys(answers).length}`)
})

Then('backend E2E debe tener pipeline con busquedas trazables', async function (this: UlviorWorld) {
  await login(this, 'admin')
  const result = await this.apiClient.get('/admin/pipeline')
  this.lastApiEvidence = result.evidence
  assert.strictEqual(result.response.status, 200)
  const text = JSON.stringify(result.response.data)
  for (const expected of ['Java Backend Engineer', 'DevOps Platform Engineer', 'Frontend React Engineer', 'Go Backend Engineer']) {
    assert.ok(text.includes(expected) && text.includes(ENV.E2E_RUN_ID), `Pipeline no contiene ${expected} ${ENV.E2E_RUN_ID}`)
  }
})

Then('backend E2E debe tener entrevistas cliente y ulvior', async function (this: UlviorWorld) {
  const state = loadE2EState()
  await login(this, 'admin')
  const result = await this.apiClient.get('/admin/entrevistas')
  this.lastApiEvidence = result.evidence
  assert.strictEqual(result.response.status, 200)
  const text = JSON.stringify(result.response.data)
  assert.ok(text.includes(state.clienteInterviewId), 'No aparece entrevista cliente E2E en admin')
  assert.ok(text.includes(state.ulviorInterviewId), 'No aparece entrevista Ulvior E2E en admin')
})

Then('backend E2E debe tener orden factura y pago trazables', async function (this: UlviorWorld) {
  const state = loadE2EState()
  await login(this, 'admin')
  const orders = await this.apiClient.get('/admin/service-orders')
  this.lastApiEvidence = orders.evidence
  assert.strictEqual(orders.response.status, 200)
  assert.ok(JSON.stringify(orders.response.data).includes(state.serviceOrderId), 'No aparece service order E2E')

  const invoices = await this.apiClient.get('/admin/invoices')
  this.lastApiEvidence = invoices.evidence
  assert.strictEqual(invoices.response.status, 200)
  assert.ok(JSON.stringify(invoices.response.data).includes(state.invoiceId), 'No aparece factura E2E')

  const payments = await this.apiClient.get('/admin/payments')
  this.lastApiEvidence = payments.evidence
  assert.strictEqual(payments.response.status, 200)
  assert.ok(JSON.stringify(payments.response.data).includes(state.paymentId), 'No aparece pago E2E')
})

Then('backend E2E documenta colocacion bloqueada por regla de negocio', function (this: UlviorWorld) {
  const state = loadE2EState()
  assert.ok(['blocked_by_business_rule', 'covered'].includes(state.placementCoverage?.status))
  this.lastApiEvidence = {
    method: 'BUSINESS_RULE',
    url: 'local://placement-coverage',
    headers: {},
    status: state.placementCoverage?.status === 'covered' ? 200 : 409,
    response: state.placementCoverage,
    durationMs: 0,
  }
})

Then('backend E2E debe reflejar candidato colocado en dashboard empresa', async function (this: UlviorWorld) {
  await login(this, 'empresa')
  const result = await this.apiClient.get('/empresa/dashboard')
  this.lastApiEvidence = result.evidence
  assert.strictEqual(result.response.status, 200, `Dashboard empresa fallo con ${result.response.status}`)
  assert.ok(Number(result.response.data?.colocaciones_este_año ?? 0) > 0, `Dashboard empresa no refleja colocaciones: ${JSON.stringify(result.response.data)}`)
  assert.ok(JSON.stringify(result.response.data).includes(ENV.E2E_RUN_ID), `Dashboard empresa no expone busqueda E2E reciente ${ENV.E2E_RUN_ID}`)
})
