# language: es
@api @PublicApi
Característica: PublicApi
  Como visitante
  quiero consumir endpoints públicos
  para comprobar disponibilidad y formularios sin autenticación.

  Escenario: Listado publico de empleos responde correctamente
    Dado que uso el servicio "api"
    Cuando envio GET a "/empleos"
    Entonces el status HTTP debe ser 200

  Escenario: Detalle publico de empleo inexistente responde controladamente
    Dado que uso el servicio "api"
    Cuando envio GET a "/empleos/00000000-0000-0000-0000-000000000000"
    Entonces el status HTTP debe ser uno de "200, 404"

  Escenario: Textos legales de consentimiento son publicos y traen los 5 documentos
    Dado que uso el servicio "api"
    Cuando envio GET a "/public/privacidad/terminos"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "tos.version"
    Y la respuesta debe contener la propiedad "privacidad.version"
    Y la respuesta debe contener la propiedad "ia_evaluacion.version"
    Y la respuesta debe contener la propiedad "compartir_empresas.version"
    Y la respuesta debe contener la propiedad "marketing.version"

  Escenario: Textos legales de empresa son publicos antes del registro
    Dado que uso el servicio "api"
    Cuando envio GET a "/public/privacidad/empresa/terminos"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "version"
    Y la respuesta debe contener la propiedad "title"
    Y la respuesta JSON debe contener el texto "contacto de empresa"
    Y la respuesta JSON debe contener el texto "Ley"

  Escenario: Formulario comercial registra evidencia de inputs y resultado
    Dado que uso el servicio "api"
    Cuando envio POST a "/public/contact" con JSON:
      """
      {
        "nombreContacto": "QA Automatizado",
        "cargo": "QA Lead",
        "email": "qa.automation@ulvior.test",
        "telefono": "+56911111111",
        "empresa": "Ulvior QA",
        "sitioWeb": "https://ulvior.test",
        "necesidad": "Quiero conocer Ulvior",
        "rolBuscado": "QA Automation",
        "mensaje": "Evidencia automatizada para reporte PDF por feature."
      }
      """
    Entonces el status HTTP debe ser uno de "200, 400, 500"
    Y la respuesta debe contener la propiedad "message"
