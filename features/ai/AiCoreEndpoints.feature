# language: es
@ai @AiCoreEndpoints @regression
Característica: AiCoreEndpoints
  Como QA
  quiero cubrir análisis, matching, pricing, entrevistas, CV y preguntas del microservicio AI
  para validar que los contratos críticos respondan antes de mover ambiente.

  Escenario: Analizar código técnico
    Dado que uso el servicio "ai"
    Cuando envio POST a "/analyze/code" con JSON:
      """
      {
        "code": "function sum(a, b) { return a + b; } console.log(sum(2, 3));",
        "language": "javascript",
        "candidate_id": "bdd-candidate",
        "integrity_signals": {
          "authorship_score": 95,
          "paste_count": 0,
          "large_insert_count": 0,
          "keystroke_count": 42,
          "avg_typing_speed_ms": 160
        }
      }
      """
    Entonces el status HTTP debe ser uno de "200, 404"
    Y la respuesta debe contener la propiedad "score"

  Escenario: Parsear descripción de cargo
    Dado que uso el servicio "ai"
    Cuando envio POST a "/jobs/parse" con JSON:
      """
      {
        "company_id": "bdd-company",
        "title": "Backend Developer",
        "jd_text": "Buscamos Backend Developer senior con experiencia en NestJS, PostgreSQL, APIs REST, testing automatizado, buenas prácticas de arquitectura y comunicación con equipos ágiles."
      }
      """
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "job_profile"

  Escenario: Calcular match candidato contra búsqueda
    Dado que uso el servicio "ai"
    Cuando envio POST a "/match" con JSON:
      """
      {
        "candidate": {
          "skills": ["NestJS", "PostgreSQL", "AWS"],
          "years_experience": 5,
          "seniority": "senior",
          "evaluation_score": 88,
          "level": "senior"
        },
        "search": {
          "required_stack": ["NestJS", "PostgreSQL"],
          "preferred_stack": ["AWS", "Redis"],
          "seniority": "senior",
          "years_required": 4
        }
      }
      """
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "match_score"

  Escenario: Analizar CV por URL
    Dado que uso el servicio "ai"
    Cuando envio POST a "/ai/cv/analyze" con JSON:
      """
      {
        "candidateId": "bdd-candidate",
        "cvUrl": "https://example.com/cv.pdf",
        "fileType": "pdf"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 422, 500"

  Escenario: Generar preguntas técnicas
    Dado que uso el servicio "ai"
    Cuando envio POST a "/questions/generate" con JSON:
      """
      {
        "assessment_id": "bdd-assessment",
        "max_questions": 3,
        "focus_areas": ["NestJS", "PostgreSQL"]
      }
      """
    Entonces el status HTTP debe ser uno de "200, 404"

  Escenario: Generar preguntas adaptativas desde código frontend real
    Dado que uso el servicio "ai"
    Cuando envio POST a "/assessments" con JSON:
      """
      {
        "company_id": "bdd-company-frontend",
        "job_id": "bdd-job-frontend",
        "candidate": {
          "candidate_id": "bdd-frontend-candidate",
          "name": "Frontend Candidate",
          "years_experience": 3,
          "seniority_declared": "middle",
          "target_role": "Frontend Engineer",
          "skills": ["React", "TypeScript"],
          "tools": [],
          "summary": "Frontend engineer focused on UI logic, state and data transformation."
        },
        "job_profile": {
          "role_name": "Frontend Engineer",
          "role_type": "frontend",
          "seniority": "middle",
          "years_required": 3,
          "required_stack": ["React", "TypeScript"],
          "preferred_stack": [],
          "tools": ["React", "TypeScript"],
          "competencies": ["code_quality", "ui_state_management", "testing"],
          "evaluation_weights": {
            "code": 25,
            "questions": 20,
            "experience": 15,
            "jd_fit": 15,
            "interview": 20,
            "confidence": 5
          },
          "summary": "Frontend role"
        }
      }
      """
    Entonces el status HTTP debe ser 201
    Y guardo la propiedad "assessment_id" como "FRONTEND_ASSESSMENT_ID"
    Cuando envio POST a "/questions/generate" con JSON:
      """
      {
        "assessment_id": "{{ FRONTEND_ASSESSMENT_ID }}",
        "max_questions": 4,
        "focus_areas": ["React", "TypeScript"],
        "submitted_code": "export function normalizeProductCards(items) { if (!Array.isArray(items)) return []; return items.filter((item) => item && item.visible).map((item) => ({ id: item.id, title: item.title || 'Sin titulo' })); }",
        "language": "typescript",
        "challenge": {
          "title": "Desafio tecnico para Frontend Engineer",
          "language": "typescript"
        },
        "code_analysis": {
          "score": 78,
          "language_detected": "typescript",
          "feedback": {
            "summary": "Transforma datos con validaciones basicas.",
            "strengths": ["Valida listas"],
            "improvements": ["Agregar tests"]
          }
        }
      }
      """
    Entonces el status HTTP debe ser 200
    Y la respuesta JSON debe contener el texto "normalizeProductCards"
    Y la respuesta JSON no debe contener el texto "Spring Boot"
    Y la respuesta JSON no debe contener el texto "EKS"
    Y la respuesta JSON no debe contener el texto "microservicios"

  Escenario: Responder pregunta técnica
    Dado que uso el servicio "ai"
    Cuando envio POST a "/questions/answer" con JSON:
      """
      {
        "assessment_id": "bdd-assessment",
        "question_id": "q-1",
        "answer": "Explicaría transacciones, índices, migraciones y separación clara entre servicios y repositorios."
      }
      """
    Entonces el status HTTP debe ser uno de "200, 404"

  Escenario: Registrar score de entrevista
    Dado que uso el servicio "ai"
    Cuando envio POST a "/interviews/score" con JSON:
      """
      {
        "assessment_id": "bdd-assessment",
        "interviewer": "QA Automation",
        "communication": 85,
        "technical_depth": 88,
        "architecture": 82,
        "ownership": 90,
        "consistency": 86,
        "notes": "Evidencia BDD para score de entrevista."
      }
      """
    Entonces el status HTTP debe ser uno de "200, 404"
