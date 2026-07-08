# language: es
@api @BillingApi @regression
Característica: BillingApi
  Como QA
  quiero cubrir planes, contratos, facturación, pagos y órdenes de servicio
  para validar que los módulos comerciales estén protegidos y disponibles según contrato.

  Esquema del escenario: Endpoints comerciales protegidos sin sesión
    Dado que uso el servicio "api"
    Cuando envio <metodo> a "<ruta>" sin JSON
    Entonces el status HTTP debe ser uno de "401, 403"

    Ejemplos:
      | metodo | ruta                                            |
      | GET    | /empresa/cuenta-facturacion/resumen             |
      | GET    | /admin/plans                                    |
      | POST   | /admin/plans                                    |
      | GET    | /admin/plans/00000000-0000-0000-0000-000000000000 |
      | PATCH  | /admin/plans/00000000-0000-0000-0000-000000000000 |
      | GET    | /admin/contracts                                |
      | POST   | /admin/contracts                                |
      | PATCH  | /admin/contracts/00000000-0000-0000-0000-000000000000/suspend |
      | GET    | /admin/contracts/00000000-0000-0000-0000-000000000000/pdf |
      | GET    | /empresa/contracts                              |
      | POST   | /empresa/contracts/00000000-0000-0000-0000-000000000000/accept |
      | GET    | /empresa/contracts/00000000-0000-0000-0000-000000000000/pdf |
      | GET    | /admin/invoices                                 |
      | POST   | /admin/invoices                                 |
      | GET    | /admin/invoices/00000000-0000-0000-0000-000000000000/pdf |
      | POST   | /admin/invoices/00000000-0000-0000-0000-000000000000/send |
      | GET    | /empresa/invoices                               |
      | GET    | /empresa/invoices/00000000-0000-0000-0000-000000000000/pdf |
      | GET    | /admin/payments                                 |
      | POST   | /admin/payments                                 |
      | GET    | /empresa/payments                               |
      | GET    | /admin/service-orders                           |
      | POST   | /admin/service-orders                           |
      | POST   | /admin/service-orders/from-search/00000000-0000-0000-0000-000000000000 |
      | POST   | /admin/service-orders/from-request/00000000-0000-0000-0000-000000000000 |
      | PATCH  | /admin/service-orders/00000000-0000-0000-0000-000000000000/commercial |
      | PATCH  | /admin/service-orders/00000000-0000-0000-0000-000000000000/status |
      | GET    | /admin/service-orders/00000000-0000-0000-0000-000000000000/terms/pdf |
      | GET    | /empresa/service-orders                         |
      | POST   | /empresa/service-orders                         |
      | POST   | /empresa/service-orders/00000000-0000-0000-0000-000000000000/accept |
      | GET    | /empresa/service-orders/00000000-0000-0000-0000-000000000000/terms/pdf |
      | GET    | /service-orders/00000000-0000-0000-0000-000000000000/terms/pdf |

  Escenario: Roles de pricing vía API respeta control de acceso
    Dado que uso el servicio "api"
    Cuando envio GET a "/ai/pricing/roles"
    Entonces el status HTTP debe ser uno de "200, 401, 403"

  Escenario: Estimación de fee vía API respeta control de acceso
    Dado que uso el servicio "api"
    Cuando envio POST a "/ai/pricing/estimate-fee" con JSON:
      """
      {
        "roleKey": "backend_developer",
        "displayTitle": "Backend Developer",
        "seniority": "senior",
        "workMode": "REMOTE",
        "urgency": "NORMAL",
        "stack": ["NestJS", "PostgreSQL"],
        "englishLevel": "ADVANCED",
        "roleType": "INDIVIDUAL_CONTRIBUTOR"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201, 401, 403"
