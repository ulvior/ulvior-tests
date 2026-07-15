# language: es
@ui @ui-auth @AdminControlledActions
Característica: AdminControlledActions
  Como QA Lead
  quiero probar acciones admin que requieren datos controlados
  para cubrir formularios y botones que el inventario no debe disparar a ciegas.

  Escenario: Admin no puede avanzar candidatos bajo score minimo comercial
    Entonces backend debe bloquear candidato bajo 60 antes de shortlist entrevista y contratacion

  Escenario: Admin prepara datos A-Z y valida pipeline entrevistas facturacion pagos
    Dado preparo datos E2E A-Z para todos los flujos
    Entonces backend E2E debe tener pipeline con busquedas trazables
    Y backend E2E debe tener entrevistas cliente y ulvior
    Y backend E2E debe tener orden factura y pago trazables
    Y backend E2E documenta colocacion bloqueada por regla de negocio
    Y backend E2E debe reflejar candidato colocado en dashboard empresa
    Dado inicio sesion como "admin"
    Cuando navego a la pantalla autenticada "/admin/pipeline"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Java Backend Engineer|DevOps Platform Engineer|Frontend React Engineer|Go Backend Engineer|E2E-20260713-ULVIOR-QA-001"
    Cuando navego a la pantalla autenticada "/admin/entrevistas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Entrevistas|Con Ulvior|Con cliente|Pendiente|Confirmada"
    Cuando navego a la pantalla autenticada "/admin/facturacion"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Facturación|Factura|ISSUED|PAID|F-"
    Cuando navego a la pantalla autenticada "/admin/pagos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Pagos|COMPLETED|TRANSFER|PAY-E2E-20260713-ULVIOR-QA-001"

  Escenario: Admin cancela la creacion de busqueda sin crear datos
    Dado inicio sesion como "admin"
    Cuando navego a la pantalla autenticada "/admin/pipeline/nueva"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando completo el campo con name "rol" con "QA {{E2E_RUN_ID}} Cancel Smoke"
    Y hago click en la accion visible "Cancelar"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la URL debe contener "/admin/pipeline"

  Escenario: Admin crea busqueda E2E con formulario completo y valida backend
    Dado inicio sesion como "admin"
    Cuando navego a la pantalla autenticada "/admin/pipeline/nueva"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando selecciono la primera opcion valida del select name "empresa_id"
    Y completo el campo con name "rol" con "QA {{E2E_RUN_ID}} Backend Engineer"
    Y selecciono la primera opcion valida del select name "seniority"
    Y selecciono la primera opcion valida del select name "modalidad"
    Y agrego tags en el campo con placeholder "Node.js, React, PostgreSQL..." con "Node.js, NestJS, PostgreSQL"
    Y completo el campo con name "descripcion" con "Busqueda E2E controlada {{E2E_RUN_ID}} para validar formulario admin, persistencia backend y trazabilidad."
    Y completo el campo con name "salario_min" con "3000"
    Y completo el campo con name "salario_max" con "4500"
    Y completo el campo con name "fee_estimado" con "1200"
    Y marco el checkbox name "urgente"
    Y completo el campo con name "notas_internas" con "Notas QA {{E2E_RUN_ID}} creadas desde prueba automatizada."
    Entonces diagnostico el formulario de nueva busqueda admin
    Y hago click en la accion visible "Crear búsqueda"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y backend admin debe encontrar en pipeline el texto "QA {{E2E_RUN_ID}} Backend Engineer"
