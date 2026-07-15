# language: es
@api @CompanyBackendE2E @regression
Característica: CompanyBackendE2E
  Como QA Lead
  quiero validar backend empresa con sesión real
  para comprobar búsquedas, profesionales, solicitudes, analytics, billing y notificaciones.

  Escenario: Empresa consulta módulos principales con cookie real
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_EMPRESA_EMAIL}}",
        "password": "{{TEST_EMPRESA_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio GET a "/auth/me"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "rol"
    Cuando envio GET a "/empresa/dashboard"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/perfil"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/busquedas"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/busquedas/historial"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/profesionales"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/solicitudes"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/entrevistas"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/analytics/empresa"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/cuenta-facturacion/resumen"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/service-orders"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/contracts"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/invoices"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/empresa/payments"
    Entonces el status HTTP debe ser uno de "200, 204"
    Cuando envio GET a "/notificaciones"
    Entonces el status HTTP debe ser uno de "200, 204"
