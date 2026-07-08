# Ulvior

Monorepo de Ulvior. Las aplicaciones y la suite automatizada viven en el mismo proyecto:

- `ulvior-web`: frontend Next/React.
- `ulvior-api`: backend/API.
- `ulvior-ai`: servicio AI.
- `ulvior-tests`: pruebas BDD/API/AI/UI y evidencia.

## Pruebas

La suite oficial del proyecto esta en `ulvior-tests`. Desde la raiz del repo se puede ejecutar:

- `npm run test:ui:full`: UI/E2E completa.
- `npm run test:ui:auth`: UI autenticada por rol.
- `npm run test:api`: API BDD.
- `npm run test:ai`: AI BDD.
- `npm run test:all`: BDD completa.
- `npm run test:reports`: regenera PDFs desde evidencia existente.

## Evidencia

Los reportes forman parte del proyecto de pruebas y se guardan en:

- `ulvior-tests/reports/pdfs`: PDFs actuales por feature.
- `ulvior-tests/reports/screenshots`: capturas por feature, escenario y step.
- `ulvior-tests/reports/evidence/evidence.json`: evidencia estructurada.
El comando `npm run clean` de `ulvior-tests` solo prepara las carpetas canonicas de reportes. No crea copias duplicadas dentro del proyecto.
