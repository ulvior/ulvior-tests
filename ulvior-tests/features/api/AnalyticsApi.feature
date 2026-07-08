# language: es
@api @AnalyticsApi @regression
Característica: AnalyticsApi
  Como QA
  quiero cubrir analytics de empresa desde API
  para bloquear exposición de métricas privadas y validar control de acceso multiempresa.

  Esquema del escenario: Analytics privado requiere sesión válida
    Dado que uso el servicio "api"
    Cuando envio GET a "<ruta>"
    Entonces el status HTTP debe ser uno de "401, 403"

    Ejemplos:
      | ruta                                                    |
      | /analytics/empresa                                      |
      | /analytics/empresa/pipeline                             |
      | /analytics/empresa/empleos/00000000-0000-0000-0000-000000000000 |

  Escenario: Tracking público de vista de empleo responde controladamente
    Dado que uso el servicio "api"
    Cuando envio POST a "/analytics/empleos/00000000-0000-0000-0000-000000000000/view" con JSON:
      """
      {
        "source": "bdd",
        "eventId": "bdd-controlled-event"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201, 400, 404"
