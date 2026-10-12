# AGENTS.md — Router de contexto de Ulvior

## Invariante de autenticación y CAPTCHA — no negociable

- No modificar, reemplazar, desactivar, omitir ni crear bypasses para el login
  o Cloudflare Turnstile sin una instrucción explícita y específica del usuario.
- Desarrollo debe usar las claves oficiales de prueba de Turnstile cuando la
  API lo exige: el CAPTCHA se valida sin bloquear las pruebas locales.
- Producción debe conservar sus claves y validación reales. Nunca copiar una
  clave de producción a un archivo local, ejemplo o repositorio.

## Invariante de worktrees — no negociable

- Por defecto se trabaja con **ramas en el checkout principal** de cada repo
  (`ulvior-web`, `ulvior-api`, `ulvior-ai`, `ulvior-worker-desafios`): rama →
  commit → push → PR. Antes de cambiar de rama, revisar `git status`; si hay
  trabajo sin commit del usuario, preguntar antes de tocarlo.
- Un `git worktree` se crea **solo si es imprescindible** tener dos ramas vivas
  al mismo tiempo (por ejemplo, servir `main` mientras el checkout principal
  tiene trabajo en curso). Nunca por costumbre ni "por si acaso".
- **Limpieza obligatoria:** apenas los cambios del worktree están fusionados en
  `main` (o termina la verificación para la que se creó), se detiene lo que
  corre desde él y se elimina con `git worktree remove` + `git worktree prune`.
  Al terminar una tarea no debe quedar ningún worktree propio.
- Nunca eliminar ni mover carpetas principales: la raíz `ulvior`,
  `ulvior-web`, `ulvior-api`, `ulvior-ai`, `ulvior-worker-desafios`,
  `ulvior-opportunity-radar`, `ulvior-architecture`, `ulvior-challenges`,
  `ulvior-tests`, `challenge-solutions` y `videos`.

## Invariante de puertos locales — no negociable

- Para Ulvior se usan exclusivamente los puertos oficiales: Web `5173` y API
  `3000`.
- No crear ni utilizar instancias alternativas en otros puertos para desarrollo,
  QA o demostraciones. Antes de probar, verificar que esas dos instancias sean
  las que sirven el código correcto.
- El usuario autoriza detener cualquier proceso local de Ulvior que ocupe un
  puerto distinto de los oficiales. No detener procesos de los puertos `5173`
  ni `3000` salvo instrucción expresa.

Este repositorio raíz contiene un índice factual del monorepo Ulvior, generado
desde `origin/main` de cada submódulo. Antes de investigar código a mano,
usa este índice como primer paso.

## 1. Validar vigencia

Lee primero [`generated-at.md`](generated-at.md). Contiene el commit de
`origin/main` documentado para cada repositorio. Si vas a apoyarte en el
índice para algo sensible (seguridad, scoring, migraciones, producción,
privacidad) o el trabajo toca un repo cuyo `origin/main` pudo haber avanzado,
corre los comandos que ese archivo indica y compara. Si el commit real
difiere del documentado, el índice para ese repo está desactualizado —
no lo uses como fuente de verdad, ve directo al código.

## 2. Cargar solo el documento necesario

No leas todos los documentos ni repositorios completos por defecto. Carga
únicamente el archivo que corresponde a la pregunta:

| Necesitas saber sobre... | Archivo |
|---|---|
| Qué repositorio es dueño de qué, stack, dependencias entre repos | [repositories.md](repositories.md) |
| Arquitectura, dominios de negocio, qué servicio hace qué | [services.md](services.md) |
| Rutas web y endpoints de API | [routes.md](routes.md) |
| Entidades persistentes, modelo de datos | [entities.md](entities.md) |
| Roles, guards, fronteras de autorización | [permissions.md](permissions.md) |
| Variables de entorno, configuración, despliegue | [environment-variables.md](environment-variables.md) |
| Eventos de producto/analítica (PostHog) | [events.md](events.md) |

Si una tarea toca varias áreas (ej. una entidad nueva expuesta por un
endpoint nuevo), carga solo los 2-3 documentos relevantes, no el set
completo.

## 3. Después del índice: código real, no el índice completo

El índice te dice **dónde mirar**, nunca reemplaza mirar el código. Después
de ubicar el archivo/entidad/endpoint relevante en el índice, abre y lee
únicamente esos archivos y líneas específicas en el repositorio real. No
asumas que el índice describe el comportamiento exacto actual — puede haber
quedado desactualizado desde que se generó.

## 4. Confirmación obligatoria contra código real

Para cualquier cambio sensible — seguridad, scoring/evaluación, migraciones
de base de datos, cambios que tocan producción, o privacidad de datos de
candidatos/empresas — el índice es solo punto de partida. Antes de proponer
o aplicar el cambio, verifica el comportamiento exacto leyendo el código
fuente real (no el resumen), igual que si el índice no existiera.

## Ejemplo de uso

> "Revisa el error de Calendar en la API. Usa primero el contexto mínimo
> del proyecto y después valida únicamente el código relacionado."

Flujo esperado: leer `generated-at.md` → leer `services.md` (o `routes.md`
si el error es de un endpoint) para ubicar el dominio de Calendar dentro de
`ulvior-api` → abrir solo esos archivos reales → diagnosticar sobre el
código, no sobre el resumen.
