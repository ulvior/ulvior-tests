# language: es
@ui @ui-auth @CompanyAuthenticatedFlow
Característica: CompanyAuthenticatedFlow
  Como empresa autenticada
  quiero recorrer mi portal real
  para validar visualmente dashboard, búsquedas, profesionales, entrevistas, billing y analytics.

  Escenario: Empresa navega todas sus pantallas principales con sesión real
    Dado preparo datos E2E A-Z para todos los flujos
    Dado inicio sesion como "empresa"
    Entonces debo seguir autenticado como "empresa"
    Cuando navego a la pantalla autenticada "/empresa/dashboard"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Dashboard|Búsquedas activas|Nueva búsqueda"
    Y backend E2E debe reflejar candidato colocado en dashboard empresa
    Cuando navego a la pantalla autenticada "/empresa/perfil"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Perfil|Empresa|Editar perfil"
    Cuando navego a la pantalla autenticada "/empresa/busquedas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Búsquedas|Nueva búsqueda|Buscar"
    Cuando navego a la pantalla autenticada "/empresa/busquedas/nueva"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Nueva búsqueda|Nombre del rol|Crear búsqueda"
    Cuando navego a la pantalla autenticada "/empresa/busquedas/historial"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Historial|Búsquedas|Rol"
    Cuando navego a la pantalla autenticada "/empresa/profesionales"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Profesionales|Buscar|Solicitar"
    Cuando navego a la pantalla autenticada "/empresa/mis-solicitudes"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Solicitudes|Mis solicitudes|Pendiente"
    Cuando navego a la pantalla autenticada "/empresa/entrevistas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Entrevistas|Confirmadas|Pendientes"
    Cuando navego a la pantalla autenticada "/empresa/analytics"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Analytics|Empleos activos|Pipeline|Búsquedas activas|Colocaciones"
    Cuando navego a la pantalla autenticada "/empresa/cuenta-facturacion"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Cuenta|Facturación|Contratos|Orden"

  Escenario: Empresa valida profesionales disponibles y estado sin resultados
    Dado inicio sesion como "empresa"
    Cuando navego a la pantalla autenticada "/empresa/profesionales"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando busco en la pantalla "developer"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "No hay profesionales con estos filtros|Ver perfil|Profesionales disponibles"

  Escenario: Empresa abre una búsqueda real y sus vistas dependientes
    Dado inicio sesion como "empresa"
    Cuando navego a la pantalla autenticada "/empresa/busquedas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando abro la primera fila de resultados
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Detalles del rol|Stack requerido|Shortlist"
    Cuando navego a la pantalla autenticada "/empresa/busquedas"
    Y abro la primera fila de resultados
    Entonces la pantalla autenticada debe renderizar sin errores

  Escenario: Empresa abre y refresca notificaciones con sesión real
    Dado inicio sesion como "empresa"
    Cuando abro las notificaciones
    Entonces el panel de notificaciones debe ser usable
    Cuando recargo notificaciones 2 veces
    Entonces el panel de notificaciones debe ser usable
    Cuando marco notificaciones leidas si existen
    Entonces el contador de notificaciones no debe aumentar
