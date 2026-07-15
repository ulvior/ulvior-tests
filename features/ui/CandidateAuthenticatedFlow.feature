# language: es
@ui @ui-auth @CandidateAuthenticatedFlow
Característica: CandidateAuthenticatedFlow
  Como candidato autenticado
  quiero recorrer mi portal real
  para validar visualmente que todas las pantallas principales cargan sin errores.

  Escenario: Candidato navega todas sus pantallas principales con sesión real
    Dado inicio sesion como "candidato"
    Entonces debo seguir autenticado como "candidato"
    Cuando navego a la pantalla autenticada "/candidato/home"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Inicio|Completa tu Test|Ulvior"
    Cuando navego a la pantalla autenticada "/candidato/perfil"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Perfil|Mi perfil|Editar perfil"
    Cuando navego a la pantalla autenticada "/candidato/perfil/editar"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Editar perfil|Guardar|Experiencia"
    Cuando navego a la pantalla autenticada "/candidato/evaluacion-ai"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Evaluación AI|Ulvior AI|evidencia"
    Cuando navego a la pantalla autenticada "/candidato/evaluacion-coding"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Evaluación coding|Coding|código"
    Cuando navego a la pantalla autenticada "/candidato/test-fit"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Test de Fit|Fit|resultado"
    Cuando navego a la pantalla autenticada "/candidato/test-fit/completar"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Pregunta|Siguiente|Salir|Fit"
    Cuando navego a la pantalla autenticada "/candidato/test-fit/resultado"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Resultado|Fit|Test"
    Cuando navego a la pantalla autenticada "/candidato/empleos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Empleos|Buscar|Postular"
    Cuando navego a la pantalla autenticada "/candidato/postulaciones"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Postulaciones|Mis postulaciones|Enviada"
    Cuando navego a la pantalla autenticada "/candidato/procesos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Procesos|Mis procesos|Evaluación"
    Cuando navego a la pantalla autenticada "/candidato/entrevistas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Entrevistas|entrevista|Confirmar"

  Escenario: Candidato usa búsqueda de empleos, abre detalle real y pantalla de postulación
    Dado inicio sesion como "candidato"
    Cuando navego a la pantalla autenticada "/candidato/empleos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando busco en la pantalla "QA"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando abro la primera fila de resultados
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Postular al empleo|Test de Fit|Cancelar postulación|Completa el Test|Ya postulaste|Detalles"

  Escenario: Candidato abre y refresca notificaciones con sesión real
    Dado inicio sesion como "candidato"
    Cuando abro las notificaciones
    Entonces el panel de notificaciones debe ser usable
    Cuando recargo notificaciones 2 veces
    Entonces el panel de notificaciones debe ser usable
    Cuando marco notificaciones leidas si existen
    Entonces el contador de notificaciones no debe aumentar
