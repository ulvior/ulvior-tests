# language: es
@api @AdminBackendE2E @regression
Característica: AdminBackendE2E
  Como QA Lead
  quiero validar backend admin con sesión real
  para comprobar que la UI del backoffice coincide con contratos disponibles.

  Escenario: Admin consulta módulos principales con cookie real
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_ADMIN_EMAIL}}",
        "password": "{{TEST_ADMIN_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio GET a "/auth/me"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "rol"
    Cuando envio GET a "/admin/metricas"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/candidatos"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/empresas"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/pipeline"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/solicitudes"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/entrevistas"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/ai/evaluaciones"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/ai/scraping/historial"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/admin/service-orders"
    Entonces el status HTTP debe ser uno de "200, 204"
