# Acta de Revisión del Sprint 1

## 1. Información general

| Campo | Información |
|---|---|
| Código del documento | ACT-SR-001 |
| Proyecto | Vive Zarzal App |
| Sprint | Sprint 1 |
| Fecha de revisión | 2026-11-17 |
| Hora de inicio | 11:00 a. m. |
| Hora de finalización | 11:40 a. m. |
| Modalidad | Remota |
| Scrum Master | Felipe Nuñez Navarro (2460817) |
| Product Owner | Cristian Camilo Cortes Ortiz |
| Repositorio de referencia | `https://github.com/Cristianco9/vive-zarzal-app` |
| Repositorio de desarrollo | `https://github.com/FelOnCrackZ/vive-zarzal-app` |
| GitHub Project | `https://github.com/users/FelOnCrackZ/projects/2` |

## 2. Objetivo de la reunión

Inspeccionar los resultados obtenidos durante el Sprint 1, revisar el Incremento desarrollado, verificar el cumplimiento de los criterios de aceptación de las historias comprometidas y recopilar la retroalimentación del Product Owner para orientar el Sprint 2.

## 3. Participantes

| Nombre completo | Rol | Asistencia |
|---|---|---|
| Cristian Camilo Cortes Ortiz | Product Owner | Presente |
| Felipe Nuñez Navarro (2460817) | Scrum Master | Presente |
| Jorge Humberto Leyes Rojas (2460809) | Developer | Presente |
| Manuel Alejandro Mera Ruiz (2460971) | Developer | Presente |
| Jesus Gabriel Ortiz Saac (2369566) | Developer | Presente |

## 4. Objetivo del Sprint

**Sprint Goal establecido:**

Dejar una base de trabajo confiable para estudiantes novatos, restaurar los elementos del tablero que quedaron pendientes, implementar el middleware de autorización por rol/permiso y dejar listo el backend de favoritos.

**Resultado general:**

**Cumplido al 100% (10 de 10 Story Points completados).** Adicionalmente, el equipo adelantó alcance complementario en el módulo de favoritos (vista de listado) e inició ramas exploratorias para etiquetas y reportes.

## 5. Revisión de los elementos del Sprint Backlog

| ID | Elemento seleccionado | Estado | Story Points | Issue / PR |
|---|---|---|---|---|
| US-101 | Estabilizar el entorno local (Docker, migraciones, seeders, rutas y modelos) | Completado | 2 | Configurado en `main` |
| US-102 | Restaurar seeders y código del foro eliminados | Completado | 2 | `PR #16` |
| US-103 | Middleware de autorización por rol y permiso (`requireRole`, `requirePermission`) | Completado | 3 | `Issue #1 / PR #21` |
| US-104 | Backend y acciones para guardar y quitar publicaciones de favoritos | Completado | 3 | `Issues #8, #9` |

**Total de Story Points planificados:** 10  
**Total de Story Points completados:** 10 (Velocidad del Sprint 1: 10 SP)

### Trabajo adicional desarrollado (fuera del compromiso inicial)

| Elemento | Descripción | Rama / Issue | Estado |
|---|---|---|---|
| Listado de favoritos | Vista y consulta de publicaciones guardadas por el usuario | `Issue #9` | Integrado en `main` |
| Módulo de etiquetas | Avance inicial en asociación de etiquetas a publicaciones | `feature/6-etiquetas-publicaciones` | En rama de desarrollo |
| Módulo de reportes | Avance inicial en creación de reportes de moderación | `feature/reports-create` | En rama de desarrollo |

## 6. Incremento desarrollado

Funcionalidades entregadas e integradas en el Incremento (versión v0.1.0):

| ID | Funcionalidad | Descripción | Evidencia |
|---|---|---|---|
| INC-001 | Entorno y guía de arranque | Configuración estable con Docker Compose, PostgreSQL, migraciones (`npm run migrations:run`) y seeders (`npm run seeds:run`) | Repositorio (`README.md`, `docs/HANDOFF.md`) |
| INC-002 | Restauración del foro y seeders | Recuperación de catálogos iniciales idempotentes y código base del foro sin fallos en pruebas | `PR #16` y ejecución de `npm test` |
| INC-003 | Middleware de autorización | Middlewares `requireRole` y `requirePermission`, documentación en `docs/PERMISSIONS.md` y suite de pruebas | `PR #21`, `authorization.test.js` |
| INC-004 | Gestión de favoritos | Rutas, controladores y botones para guardar, quitar y listar favoritos evitando duplicados | `Issues #8, #9` en rama `main` |

## 7. Validación de criterios de aceptación

| ID | Criterio de aceptación | Resultado | Observaciones |
|---|---|---|---|
| CA-001 | US-101: Proyecto levanta desde cero, migraciones y seeders corren sin error y bloqueos documentados | Aprobado | Verificado en entorno local con Docker y PostgreSQL |
| CA-002 | US-102: Seeders idempotentes (corren dos veces sin duplicar) y `npm test` / `npm run lint` pasan | Aprobado | Verificado con `npm run seeds:run` consecutivos y `npm test` |
| CA-003 | US-103: Usuario autorizado accede, sin rol/permiso recibe `403`, sin sesión redirige a login, con pruebas | Aprobado | Cubierto en `authorization.test.js` (`PR #21`) |
| CA-004 | US-104: Miembro guarda y quita favoritos sin duplicados; sin sesión redirige a login | Aprobado | Incluye además vista de listado (`Issue #9`) |

## 8. Pull Requests y evidencias técnicas

| Pull Request | Descripción | Estado | Revisor |
|---|---|---|---|
| `PR #16` | Restauración de seeders y código base del foro | Merged | Felipe Nuñez Navarro |
| `PR #21` | Implementación de middleware de roles/permisos y pruebas | Merged | Jorge Humberto Leyes Rojas |
| PR Favoritos (`#8`, `#9`) | Backend y vistas de publicaciones favoritas | Merged | Manuel Alejandro Mera Ruiz |

**Otras evidencias:**

- **Pruebas automatizadas (`npm test`):** 46 pruebas ejecutadas, 46 aprobadas (`pass 46`, `fail 0`).
- **Documentación técnica:** `docs/PERMISSIONS.md`, `README.md`, `docs/HANDOFF.md` y `docs/requirements/SRS-sprint-01.md` actualizados en el repositorio.

## 9. Retroalimentación del Product Owner y los interesados

**Aspectos satisfactorios:**

- El Product Owner destacó la rápida adaptación del equipo al stack (Node.js, Express 5, Sequelize y PostgreSQL) y la entrega completa de los 10 Story Points comprometidos.
- Se valoró positivamente la cobertura de pruebas automatizadas del middleware de autorización (`authorization.test.js`) y la documentación de permisos (`docs/PERMISSIONS.md`).

**Observaciones y oportunidades de mejora:**

- **Control de alcance:** El equipo implementó el listado de favoritos (`#9`) e inició ramas para reportes y etiquetas sin consulta previa al Product Owner. Para el Sprint 2 se acuerda ceñirse estrictamente a las historias comprometidas antes de abrir trabajo adicional.
- **Trazabilidad documental:** Realizar la Sprint Review y Retrospectiva puntualmente en la fecha de cierre del Sprint y mantener actualizados los responsables en el tablero desde el día 1.

**Nuevas necesidades identificadas:**

- Priorizar en el Sprint 2 el recorrido completo de exploración pública (detalle de publicación, filtro por categorías, perfil público) y la edición/eliminación de publicaciones propias.

## 10. Elementos pendientes

| ID | Elemento pendiente | Motivo | Acción propuesta |
|---|---|---|---|
| PEND-001 | Ramas `feature/reports-create` y `feature/6-etiquetas-publicaciones` | Trabajo iniciado fuera del alcance del Sprint 1 | Mantener en pausa/backlog hasta que el Product Owner priorice dichos módulos en un Sprint futuro |

## 11. Acuerdos y decisiones

| ID | Acuerdo o decisión | Responsable | Fecha límite |
|---|---|---|---|
| AC-001 | Formalizar cierre documental del Sprint 1 mediante PR de actas y requerimientos en el repositorio | Felipe Nuñez Navarro | 2026-11-17 |
| AC-002 | Consultar siempre al Product Owner antes de iniciar historias fuera del Sprint Backlog | Todo el equipo | Permanente |
| AC-003 | Iniciar planificación y ejecución del Sprint 2 enfocada en exploración y gestión de publicaciones | Todo el equipo | 2026-11-23 |

## 12. Validación y aprobación

| Participante | Rol | Fecha |
|---|---|---|
| Cristian Camilo Cortes Ortiz | Product Owner | 2026-11-17 |
| Felipe Nuñez Navarro | Scrum Master | 2026-11-17 |
| Jorge Humberto Leyes Rojas | Developer | 2026-11-17 |
| Manuel Alejandro Mera Ruiz | Developer | 2026-11-17 |
| Jesus Gabriel Ortiz Saac | Developer | 2026-11-17 |

### Estado de la revisión

- [x] Se presentó el Incremento desarrollado.
- [x] Se revisaron los elementos del Sprint Backlog.
- [x] Se verificaron los criterios de aceptación.
- [x] Se registró la retroalimentación.
- [x] Se identificaron elementos pendientes.
- [x] Se documentaron los acuerdos y decisiones.