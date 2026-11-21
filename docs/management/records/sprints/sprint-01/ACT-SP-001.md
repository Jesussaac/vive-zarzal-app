# Acta de Planificación del Sprint 1

## 1. Información general

| Campo | Información |
|---|---|
| Código del documento | ACT-SP-001 |
| Proyecto | Vive Zarzal App |
| Sprint | Sprint 1 |
| Fecha de reunión | 2026-11-02 |
| Hora de inicio | 7:00 p. m. |
| Hora de finalización | 8:30 p. m. |
| Modalidad | Remota |
| Duración del Sprint | 2026-11-02 al 2026-11-16 |
| Scrum Master | Felipe Nuñez Navarro (2460817) |
| Product Owner | Cristian Camilo Cortes Ortiz |
| Repositorio de referencia | `https://github.com/Cristianco9/vive-zarzal-app` |
| Repositorio de desarrollo | `https://github.com/FelOnCrackZ/vive-zarzal-app` |
| GitHub Project | `https://github.com/users/FelOnCrackZ/projects/2` |

## 2. Participantes

| Nombre completo | Identificación | Rol | Asistencia |
|---|---|---|---|
| Cristian Camilo Cortes Ortiz | No aplica | Product Owner | Presente |
| Felipe Nuñez Navarro | 2460817 | Scrum Master | Presente |
| Jorge Humberto Leyes Rojas | 2460809 | Developer | Presente |
| Manuel Alejandro Mera Ruiz | 2460971 | Developer | Presente |
| Jesus Gabriel Ortiz Saac | 2369566 | Developer | Presente |

## 3. Objetivo del Sprint

**Sprint Goal:** dejar una base de trabajo confiable para estudiantes novatos, restaurar los elementos del tablero que quedaron pendientes, implementar el middleware de autorización por rol/permiso y dejar listo el backend de favoritos.

## 4. Punto de partida del tablero

El Sprint 1 toma como punto de partida el tablero actual:

- **Backlog:** 5 elementos.
- **Ready:** 5 elementos.
- **In progress:** 1 de 3.
- **In review:** 0 de 5.
- **Done:** 10 elementos.

Los elementos **Done** no se re-planifican. Los elementos seleccionados para este sprint son los que están en curso o listos, más tareas de onboarding técnico.

## 5. Elementos seleccionados (Sprint Backlog)

| ID | Épica | Tipo | RF / RNF | Historia / elemento | Origen | Prioridad | SP | Issue / PR |
|---|---|---|---|---|---|---|---|---|
| US-101 | EP-01 | Historia Técnica | RF-01, RNF-01 | Como equipo, queremos entender y estabilizar el entorno local (Docker, migraciones, seeders, rutas y modelos) para trabajar sin bloqueos. | Onboarding | Alta | 2 | Configurado en `main` |
| US-102 | EP-01 | Historia Técnica | RF-01, RNF-02, RNF-03 | Como equipo, queremos restaurar los seeders y el código del foro eliminados, para que el proyecto vuelva a un estado coherente. | GB-14, GB-17 | Alta | 2 | `PR #16` |
| US-103 | EP-02 | Historia Técnica | RF-02, RF-03, RNF-04 | Como administrador, quiero un middleware de autorización por rol y permiso, para proteger rutas según el rol del usuario. | GB-18 / GB-21 | Alta | 3 | `Issue #1 / PR #21` |
| US-104 | EP-03 | Historia de Usuario | RF-03, RF-04, RF-05 | Como miembro, quiero guardar y quitar publicaciones de favoritos, para consultarlas después. | GB-15 | Alta | 3 | `Issues #8, #9` |

**Total:** 10 Story Points.

## 6. Descomposición de actividades

| ID | Actividad | Responsable | Estimación |
|---|---|---|---|
| TASK-101 | Leer `README.md`, `docs/HANDOFF.md` y `docs/resources/Database/DATABASE.md`; anotar dudas. | Jorge Humberto Leyes Rojas | 2 h |
| TASK-102 | Levantar Docker, ejecutar migraciones y seeders; documentar errores y solución. | Felipe Nuñez Navarro | 3 h |
| TASK-103 | Recorrido guiado por `app.js`, routers, controladores de auth y modelos. | Jesus Gabriel Ortiz Saac | 2 h |
| TASK-104 | Restaurar seeders eliminados y verificar que sean idempotentes. | Manuel Alejandro Mera Ruiz | 2 h |
| TASK-105 | Restaurar código del foro eliminado y comprobar que `npm test` no rompa. | Manuel Alejandro Mera Ruiz | 2 h |
| TASK-106 | Revisar modelos `Role`, `Permission`, `UserRole` y asociaciones. | Felipe Nuñez Navarro | 2 h |
| TASK-107 | Implementar `requireRole` y `requirePermission` como middleware reutilizable. | Manuel Alejandro Mera Ruiz | 4 h |
| TASK-108 | Escribir pruebas del middleware: permitido, denegado y sin sesión. | Jesus Gabriel Ortiz Saac | 3 h |
| TASK-109 | Implementar guardar/quitar favorito en controlador y ruta. | Jorge Humberto Leyes Rojas | 3 h |
| TASK-110 | Probar favoritos: guardar, quitar, duplicado y sin sesión. | Jorge Humberto Leyes Rojas | 2 h |
| TASK-111 | Documentar rutas y middleware en README/HANDOFF. | Jesus Gabriel Ortiz Saac | 2 h |
| TASK-112 | Preparar demostración corta del Sprint. | Felipe Nuñez Navarro | 1 h |

**Total estimado:** 28 h.

## 7. Criterios de aceptación (Gherkin)

### US-101 — Estabilización del entorno local (Historia Técnica)
* **Escenario 1: Despliegue limpio del entorno y base de datos**
  * **Dado que** un desarrollador clona el repositorio y configura el archivo `.env`
  * **Cuando** levanta los contenedores con Docker Compose y ejecuta `npm run migrations:run` y `npm run seeds:run`
  * **Entonces** la base de datos PostgreSQL se inicializa con sus 21 tablas y catálogos base sin errores, y los bloqueos resueltos quedan documentados en el repositorio.

### US-102 — Restauración de seeders y código del foro (Historia Técnica)
* **Escenario 1: Idempotencia en la ejecución de seeders**
  * **Dado que** la base de datos ya contiene los registros iniciales sembrados
  * **Cuando** se ejecuta el comando `npm run seeds:run` por segunda vez consecutiva
  * **Entonces** el proceso finaliza exitosamente sin duplicar registros ni generar errores de restricción única.
* **Escenario 2: Integridad de pruebas y estilo de código**
  * **Dado que** los archivos y seeders del foro han sido restaurados en el proyecto
  * **Cuando** se ejecutan `npm run lint` y `npm test`
  * **Entonces** ambas verificaciones finalizan sin errores ni pruebas fallidas.

### US-103 — Middleware de autorización por rol y permiso (Historia Técnica)
* **Escenario 1: Acceso permitido a usuario autorizado**
  * **Dado que** un usuario autenticado posee el rol o permiso requerido por la ruta
  * **Cuando** realiza una petición HTTP hacia dicha ruta protegida
  * **Entonces** el middleware permite continuar el flujo y responde con el recurso solicitado (código `200`).
* **Escenario 2: Acceso denegado por falta de rol o permiso (`403`)**
  * **Dado que** un usuario autenticado no cuenta con el rol ni el permiso exigido por la ruta
  * **Cuando** intenta acceder a la ruta protegida
  * **Entonces** el middleware bloquea la petición y retorna una respuesta de acceso denegado con estado HTTP `403`.
* **Escenario 3: Redirección de visitante sin sesión**
  * **Dado que** un visitante no ha iniciado sesión (sin token JWT válido)
  * **Cuando** intenta acceder a una ruta protegida por el middleware
  * **Entonces** el sistema redirige automáticamente al formulario de inicio de sesión (`/auth/login`).

### US-104 — Gestión de publicaciones favoritas (Historia de Usuario)
* **Escenario 1: Guardar una publicación como favorita**
  * **Dado que** un miembro autenticado visualiza una publicación del foro que aún no está en sus favoritos
  * **Cuando** ejecuta la acción de agregar a favoritos
  * **Entonces** el sistema registra la relación en la base de datos sin permitir duplicados y confirma la operación.
* **Escenario 2: Quitar una publicación de favoritos**
  * **Dado que** un miembro autenticado tiene una publicación marcada como favorita
  * **Cuando** ejecuta la acción de quitar de favoritos
  * **Entonces** el sistema elimina dicho registro de su lista de favoritos.
* **Escenario 3: Intento de acción sin sesión activa**
  * **Dado que** un visitante sin sesión intenta marcar o desmarcar una publicación como favorita
  * **Cuando** envía la solicitud al servidor
  * **Entonces** el sistema rechaza la operación y lo redirige al inicio de sesión.

## 8. Definición de terminado (DoD)

- [x] Cumple criterios de aceptación en formato Gherkin.
- [x] `npm run lint` y `npm test` pasan sin errores.
- [x] Pull Request revisado por otro integrante.
- [x] Documentación actualizada.
- [x] Issue actualizado en GitHub Projects.

## 9. Plan de trabajo

| Fecha | Actividad |
|---|---|
| 2026-11-02 | Planificación, onboarding y lectura de documentación |
| 2026-11-03 al 2026-11-04 | Setup, Docker, migraciones y restauración de seeders/código |
| 2026-11-05 al 2026-11-08 | Middleware de autorización y pruebas |
| 2026-11-09 al 2026-11-12 | Backend de favoritos y pruebas |
| 2026-11-13 al 2026-11-15 | Documentación, pruebas finales y demo |
| 2026-11-16 | Cierre técnico y preparación de actas de Review y Retrospectiva |

## 10. Riesgos

| ID | Riesgo | Impacto | Acción |
|---|---|---|---|
| RISK-101 | El equipo es novato en Node/Express y Docker. | Medio | Pair programming y tareas guiadas. |
| RISK-102 | La restauración de código puede generar conflictos. | Medio | Revisar con `git diff` y PR pequeño. |
| RISK-103 | Middleware de permisos mal implementado. | Alto | Pruebas con tres usuarios y revisión cruzada. |
| RISK-104 | Favoritos duplicados por falta de restricción única. | Medio | Verificar índice único y probar duplicado. |

## 11. Acuerdos

- Una rama por historia.
- PR revisado por otro integrante.
- Actualizar el tablero al mover cada issue.
- Consultar al Product Owner antes de agregar alcance.

## 12. Aprobación

| Participante | Rol | Fecha |
|---|---|---|
| Cristian Camilo Cortes Ortiz | Product Owner | 2026-11-02 |
| Felipe Nuñez Navarro | Scrum Master | 2026-11-02 |
| Jorge Humberto Leyes Rojas | Developer | 2026-11-02 |
| Manuel Alejandro Mera Ruiz | Developer | 2026-11-02 |
| Jesus Gabriel Ortiz Saac | Developer | 2026-11-02 |