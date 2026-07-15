# language: es
@ui @ui-auth @AdminAuthenticatedFlow
Característica: AdminAuthenticatedFlow
  Como admin autenticado
  quiero recorrer el backoffice real
  para validar visualmente scraping, candidatos, empresas, pipeline, solicitudes, entrevistas y módulos comerciales.

  Escenario: Admin navega todas sus pantallas principales con sesión real
    Dado inicio sesion como "admin"
    Entonces debo seguir autenticado como "admin"
    Cuando navego a la pantalla autenticada "/admin/dashboard"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Dashboard|Nueva búsqueda|Ulvior"
    Cuando navego a la pantalla autenticada "/admin/ai-scraping"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "AI / Scraping|Filtros de scraping|Historial"
    Cuando navego a la pantalla autenticada "/admin/candidatos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Candidatos|Buscar|Asignar"
    Cuando navego a la pantalla autenticada "/admin/empresas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Empresas|Generar invitación|Empresa"
    Cuando navego a la pantalla autenticada "/admin/pipeline"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Pipeline|Nueva búsqueda|Shortlist"
    Cuando navego a la pantalla autenticada "/admin/pipeline/nueva"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Nueva búsqueda|Crear búsqueda|Nombre del rol"
    Cuando navego a la pantalla autenticada "/admin/solicitudes"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Solicitudes|Gestionar|Pendiente"
    Cuando navego a la pantalla autenticada "/admin/entrevistas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Entrevistas|Detalle de la entrevista|Candidato"
    Cuando navego a la pantalla autenticada "/admin/procesos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Procesos|Pipeline|Búsqueda"
    Cuando navego a la pantalla autenticada "/admin/contratos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Contratos|Planes|Contrato"
    Cuando navego a la pantalla autenticada "/admin/facturacion"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Facturación|Factura|Invoices"
    Cuando navego a la pantalla autenticada "/admin/pagos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Pagos|Pago|Payments"
    Cuando navego a la pantalla autenticada "/admin/metricas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Métricas|Pipeline|Shortlist"

  Escenario: Admin abre detalle real de candidato, edición y asignación
    Dado inicio sesion como "admin"
    Cuando navego a la pantalla autenticada "/admin/candidatos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando busco en la pantalla "Node"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando hago click en la primera accion de resultado "Ver"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Editar perfil|Asignar a búsqueda|Score"
    Cuando hago click en la accion visible "Editar perfil"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Editar candidato|Guardar|Perfil"

  Escenario: Admin abre detalle real de empresa y evidencia invitaciones/comercial
    Dado inicio sesion como "admin"
    Cuando navego a la pantalla autenticada "/admin/empresas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando abro la primera fila de resultados
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Información general|Datos legales|Facturación|Procesos de headhunting"

  Escenario: Admin abre detalle real de pipeline y sus vistas de shortlist/garantía
    Dado inicio sesion como "admin"
    Cuando navego a la pantalla autenticada "/admin/pipeline"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando abro la primera fila de resultados
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Detalles|Shortlist|Asignar candidato|Marcar"

  Escenario: Admin abre y refresca notificaciones con sesión real
    Dado inicio sesion como "admin"
    Cuando abro las notificaciones
    Entonces el panel de notificaciones debe ser usable
    Cuando recargo notificaciones 2 veces
    Entonces el panel de notificaciones debe ser usable
    Cuando marco notificaciones leidas si existen
    Entonces el contador de notificaciones no debe aumentar
