# language: es
@ui @company-controlled @CompanyControlledActions
Característica: CompanyControlledActions
  Como QA E2E
  quiero ejecutar acciones controladas del flujo empresa
  para validar formularios, botones críticos, persistencia y backend con evidencia UI/API.

  Escenario: Empresa consume datos A-Z de busquedas entrevistas orden facturas y pagos
    Dado preparo datos E2E A-Z para todos los flujos
    Dado inicio sesion como "empresa"
    Cuando navego a la pantalla autenticada "/empresa/dashboard"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Dashboard|Búsquedas activas|Entrevistas|Solicitudes"
    Y backend E2E debe reflejar candidato colocado en dashboard empresa
    Cuando navego a la pantalla autenticada "/empresa/busquedas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando busco en la pantalla "E2E-20260713-ULVIOR-QA-001"
    Entonces la pantalla debe mostrar al menos uno de estos textos "E2E-20260713-ULVIOR-QA-001|QA"
    Cuando navego a la pantalla autenticada "/empresa/profesionales"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Profesionales|Diego Herrera|Backend Engineer|Solicitar"
    Cuando navego a la pantalla autenticada "/empresa/entrevistas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Entrevistas|Agenda|cliente|Pendiente|Confirmada"
    Cuando navego a la pantalla autenticada "/empresa/mis-solicitudes"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Solicitudes|QA Solicitud|E2E-20260713-ULVIOR-QA-001"
    Cuando navego a la pantalla autenticada "/empresa/cuenta-facturacion"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Cuenta|Facturación|Orden|Factura|Pago|2450|COMPLETED"
    Entonces backend E2E debe tener orden factura y pago trazables

  Escenario: Empresa valida y crea una busqueda trazable desde UI
    Dado inicio sesion como "empresa"
    Cuando navego a la pantalla autenticada "/empresa/busquedas/nueva"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando hago click en la accion visible "Crear búsqueda"
    Entonces la pantalla debe mostrar al menos uno de estos textos "Mínimo 3 caracteres|Selecciona un nivel|Mínimo 10 caracteres|Mínimo 50 caracteres"
    Cuando completo el campo con name "nombre_rol" con "QA E2E Backend Golang {{E2E_RUN_ID}}"
    Y selecciono en el select name "seniority" la opcion que contiene "Middle"
    Y selecciono en el select name "modalidad" la opcion que contiene "Remoto"
    Y completo el campo con name "stack" con "Go, PostgreSQL, Redis, Docker, Kubernetes"
    Y completo el campo con name "descripcion" con "Busqueda E2E trazable para validar el flujo empresa completo, desde formulario hasta persistencia backend y listado visible para seguimiento QA."
    Y completo el campo con name "salario_min" con "3000"
    Y completo el campo con name "salario_max" con "5200"
    Y marco el checkbox name "urgente"
    Y hago click en la accion visible "Crear búsqueda"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y backend empresa debe encontrar busqueda con texto "QA E2E Backend Golang {{E2E_RUN_ID}}"
    Cuando navego a la pantalla autenticada "/empresa/busquedas"
    Y busco en la pantalla "QA E2E Backend Golang {{E2E_RUN_ID}}"
    Entonces la pantalla debe mostrar al menos uno de estos textos "QA E2E Backend Golang {{E2E_RUN_ID}}"
    Y la consola del navegador no debe tener errores severos
