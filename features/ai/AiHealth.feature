# language: es
@ai @AiHealth
Característica: AiHealth
  Como equipo de QA
  quiero evidencia BDD de los endpoints AI
  para reportar salud y pricing en un PDF independiente.

  Escenario: Health del microservicio AI responde con estado
    Dado que uso el servicio "ai"
    Cuando envio GET a "/health"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "status"

  Escenario: Estimación de fee captura payload y cálculo
    Dado que uso el servicio "ai"
    Cuando envio POST a "/ai/pricing/estimate-fee" con JSON:
      """
      {
        "roleKey": "backend_developer",
        "displayTitle": "Backend Developer",
        "seniority": "senior",
        "workMode": "REMOTE",
        "urgency": "NORMAL",
        "stack": ["NestJS", "PostgreSQL", "AWS"],
        "englishLevel": "ADVANCED",
        "roleType": "INDIVIDUAL_CONTRIBUTOR"
      }
      """
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "estimatedFee"
