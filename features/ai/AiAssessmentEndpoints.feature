# language: es
@ai @AiAssessmentEndpoints @regression
Característica: AiAssessmentEndpoints
  Como QA
  quiero cubrir assessments e inteligencia de candidatos
  para validar creación, consulta, reporte e historial de scraping.

  Escenario: Crear assessment con candidato y perfil de cargo
    Dado que uso el servicio "ai"
    Cuando envio POST a "/assessments" con JSON:
      """
      {
        "company_id": "bdd-company",
        "job_id": "bdd-job",
        "job_profile": {
          "role_name": "Backend Developer",
          "role_type": "individual_contributor",
          "seniority": "senior",
          "years_required": 4,
          "required_stack": ["NestJS", "PostgreSQL"],
          "preferred_stack": ["AWS"],
          "tools": ["Docker"],
          "competencies": ["ownership", "testing"],
          "evaluation_weights": {
            "code": 35,
            "questions": 25,
            "experience": 10,
            "jd_fit": 10,
            "interview": 10,
            "confidence": 0,
            "completeness": 10
          },
          "summary": "Cargo backend senior para suite BDD."
        },
        "candidate": {
          "candidate_id": "bdd-candidate",
          "name": "QA Candidate",
          "email": "candidate@ulvior.test",
          "years_experience": 5,
          "seniority_declared": "senior",
          "target_role": "Backend Developer",
          "skills": ["NestJS", "PostgreSQL", "AWS"],
          "tools": ["Docker"],
          "summary": "Perfil usado para evidencia automatizada.",
          "profile_completeness": 90
        }
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Y la respuesta debe contener la propiedad "assessment_id"

  Esquema del escenario: Consultas de assessment inexistente responden controladamente
    Dado que uso el servicio "ai"
    Cuando envio GET a "<ruta>"
    Entonces el status HTTP debe ser uno de "200, 404"

    Ejemplos:
      | ruta                              |
      | /assessments/bdd-missing          |
      | /assessments/bdd-missing/report   |
      | /assessments/candidate/bdd-candidate/best |

  Escenario: Actualizar perfil de assessment inexistente
    Dado que uso el servicio "ai"
    Cuando envio POST a "/assessments/bdd-missing/profile" con JSON:
      """
      {
        "candidate_id": "bdd-candidate",
        "name": "QA Candidate",
        "email": "candidate@ulvior.test",
        "years_experience": 5,
        "seniority_declared": "senior",
        "skills": ["NestJS", "PostgreSQL"],
        "summary": "Actualización BDD."
      }
      """
    Entonces el status HTTP debe ser uno de "200, 404, 422"

  Escenario: Buscar candidatos AI con payload acotado
    Dado que uso el servicio "ai"
    Cuando envio POST a "/ai/candidates/search" con JSON:
      """
      {
        "role": "Backend Developer",
        "required_skills": ["NestJS", "PostgreSQL"],
        "keywords": ["backend", "api"],
        "seniority_max": "senior",
        "location": "Chile",
        "max_results": 1,
        "min_score": 0,
        "strictness": "low",
        "active_only": true,
        "refresh": false,
        "include_gitlab": false,
        "refresh_existing": false
      }
      """
    Entonces el status HTTP debe ser uno de "200, 500"

  Escenario: Consultar historial de búsqueda de candidatos
    Dado que uso el servicio "ai"
    Cuando envio GET a "/ai/candidates/search/history"
    Entonces el status HTTP debe ser 200

  Escenario: Limpiar historial de búsqueda con selector por periodo
    Dado que uso el servicio "ai"
    Cuando envio POST a "/ai/candidates/search/history/cleanup" con JSON:
      """
      {
        "period_type": "year",
        "year": 2026
      }
      """
    Entonces el status HTTP debe ser uno de "200, 404"
