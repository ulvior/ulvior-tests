# language: es
@api @CandidateBackendE2E @regression
Característica: CandidateBackendE2E
  Como QA Lead
  quiero validar backend candidato con sesión real
  para comprobar perfil, CV, evaluación AI, coding, procesos y notificaciones.

  Escenario: Candidato consulta módulos principales con cookie real
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_CANDIDATO_EMAIL}}",
        "password": "{{TEST_CANDIDATO_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio GET a "/auth/me"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "rol"
    Cuando envio GET a "/candidato/home"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/perfil"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/documentos"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/evaluacion-ai"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/evaluacion-coding"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/procesos"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/empleos"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/postulaciones"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/candidato/entrevistas"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/notificaciones"
    Entonces el status HTTP debe ser uno de "200, 204"
