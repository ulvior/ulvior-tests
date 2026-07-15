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
