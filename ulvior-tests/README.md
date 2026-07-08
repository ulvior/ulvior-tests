# Ulvior BDD Automated Tests

Suite BDD escalable para API, AI y UI con Cucumber, Gherkin, Selenium y reportes PDF por feature.

## Comandos

- `npm test`: ejecuta todas las features y genera evidencia.
- `npm run test:api`: ejecuta escenarios con tag `@api`.
- `npm run test:ai`: ejecuta escenarios con tag `@ai`.
- `npm run test:ui`: ejecuta escenarios con tag `@ui`.
- `npm run test:report`: regenera PDFs desde `reports/evidence/evidence.json`.
- `npm run clean`: prepara las carpetas canonicas de reportes sin borrar ni duplicar evidencia.

## Arquitectura

- `features/api`, `features/ai`, `features/ui`: features Gherkin. Cada archivo debe llamarse en CamelCase, por ejemplo `AuthApi.feature`.
- `src/step-definitions`: steps separados por dominio. Los steps comunes de API tambien se reutilizan para AI.
- `src/pages`: Page Objects Selenium reutilizables.
- `src/support`: World, hooks, driver y variables de entorno.
- `src/reporters`: almacenamiento de evidencia y generacion de PDF.
- `reports/screenshots`: pantallazos UI por feature, escenario y paso.
- `reports/evidence/evidence.json`: evidencia estructurada de cada step.
- `reports/pdfs`: un PDF por cada `.feature`.

## Cobertura actual

- 15 features BDD.
- 219 escenarios.
- 671 pasos.
- 15 PDFs generados en una corrida completa.

La corrida completa validada fue `npm test` con resultado `219 scenarios (219 passed)` y `671 steps (671 passed)`.

## Evidencia

Cada step guarda su resultado. En UI, Selenium toma screenshot despues de cada paso. En API y AI, el cliente HTTP guarda metodo, URL, headers, body, status, response y duracion. Al finalizar Cucumber, la suite agrupa escenarios por `.feature` y genera un PDF independiente para cada feature.

## Variables

Configura `API_URL`, `AI_URL`, `WEB_URL`, credenciales de prueba y `HEADLESS` en `.env.local`.
