# Acta de Retrospectiva del Sprint 1

## 1. Información general

| Campo | Información |
|---|---|
| Código del documento | ACT-RET-001 |
| Proyecto | Vive Zarzal App |
| Sprint | Sprint 1 |
| Fecha de retrospectiva | 2026-11-17 |
| Hora de inicio | 11:45 a. m. |
| Hora de finalización | 12:15 p. m. |
| Modalidad | Remota |
| Scrum Master | Felipe Nuñez Navarro (2460817) |
| Repositorio de desarrollo | `https://github.com/FelOnCrackZ/vive-zarzal-app` |
| GitHub Project | `https://github.com/users/FelOnCrackZ/projects/2` |

## 2. Objetivo de la reunión

Analizar el desarrollo del Sprint 1 desde la perspectiva interna del equipo de desarrollo, identificar prácticas positivas, dificultades técnicas y de coordinación, y establecer acciones concretas de mejora para el Sprint 2.

## 3. Participantes

| Nombre completo | Rol | Asistencia |
|---|---|---|
| Felipe Nuñez Navarro (2460817) | Scrum Master | Presente |
| Jorge Humberto Leyes Rojas (2460809) | Developer | Presente |
| Manuel Alejandro Mera Ruiz (2460971) | Developer | Presente |
| Jesus Gabriel Ortiz Saac (2369566) | Developer | Presente |

## 4. Evaluación general del Sprint

**Sprint Goal evaluado:**

Dejar una base de trabajo confiable para estudiantes novatos, restaurar los elementos del tablero que quedaron pendientes, implementar el middleware de autorización por rol/permiso y dejar listo el backend de favoritos.

**Percepción general del equipo:**

El equipo considera que el Sprint 1 tuvo una curva de aprendizaje exigente al inicio debido a la configuración del entorno (Docker, PostgreSQL y scripts personalizados de Sequelize en `package.json`), pero una vez superados los bloqueos iniciales se logró un buen ritmo de desarrollo que permitió cumplir todas las historias comprometidas (10/10 SP).

**Nivel de cumplimiento del Sprint Goal:**

100% cumplido (10 Story Points completados de 10 planificados; 28 horas estimadas ejecutadas).

## 5. ¿Qué funcionó bien?

| ID | Aspecto positivo | Impacto en el equipo |
|---|---|---|
| POS-001 | Resolución colaborativa de bloqueos de entorno (Docker, migraciones y seeders) | Permitió que todos los integrantes tuvieran el proyecto corriendo localmente sin detener el avance |
| POS-002 | Implementación de pruebas automatizadas (`authorization.test.js` y `npm test` con 46/46 tests aprobados) | Dio confianza al integrar Pull Requests sin romper funcionalidades existentes del foro |
| POS-003 | Buena capacidad técnica para entregar funcionalidades completas (middleware y favoritos) | Se alcanzó el 100% de los Story Points comprometidos en el primer Sprint |

## 6. ¿Qué dificultades encontramos?

| ID | Dificultad identificada | Causa probable | Impacto |
|---|---|---|---|
| IMP-001 | Bloqueos iniciales con Docker, comandos de terminal en Windows/PowerShell y rutas de configuración de Sequelize | Falta de experiencia previa del equipo con la estructura del proyecto entregado | Retraso en los primeros días del Sprint mientras se estabilizaba el entorno |
| IMP-002 | Desfase de un día en el cierre formal del Sprint y en la actualización de responsables en las actas | Priorización del desarrollo de código sobre el registro administrativo en GitHub Projects y actas | Las ceremonias de Review y Retrospectiva se cerraron el 17 de noviembre en lugar del 16 |
| IMP-003 | Inicio de ramas fuera del alcance del Sprint (`feature/reports-create` y `feature/6-etiquetas-publicaciones`) | Entusiasmo por avanzar en módulos pendientes sin validar prioridad con el Product Owner | Dispersión de esfuerzo y ramas abiertas que deben mantenerse en pausa |

## 7. ¿Qué podemos mejorar?

| ID | Oportunidad de mejora | Beneficio esperado |
|---|---|---|
| MEJ-001 | Asignar responsables de cada tarea en el acta y en GitHub Projects el mismo día del Sprint Planning | Claridad total desde el inicio de quién lidera cada historia y cada Pull Request |
| MEJ-002 | Realizar revisiones cruzadas obligatorias en todos los Pull Requests antes de hacer merge a `main` | Mayor calidad de código, transferencia de conocimiento entre los 4 integrantes y cero errores en integración |
| MEJ-003 | Agendar con anticipación las ceremonias de Review y Retrospectiva el último día del Sprint | Mantener la cadencia Scrum y evitar acumulación de documentación al cierre |

## 8. Evaluación de la colaboración y comunicación

- **Comunicación entre los integrantes:** Fluida y constante por canales informales para resolver dudas técnicas rápidamente; se debe fortalecer el registro escrito en los issues.
- **Distribución y coordinación del trabajo:** Cada integrante asumió un bloque técnico de 7 horas (entorno/restauración, middleware, pruebas/docs y favoritos), aunque faltó dejarlo registrado desde el inicio en el acta.
- **Gestión de impedimentos:** Los problemas de entorno se resolvieron en equipo y se validaron ejecutando la suite completa de pruebas (`npm test`).
- **Uso de GitHub:** Buen uso de ramas y Pull Requests (`#16`, `#21`), mejorando para el Sprint 2 el control de alcance para no abrir ramas fuera del backlog comprometido.

## 9. Acciones de mejora

| ID | Acción de mejora | Responsable | Fecha límite | Estado |
|---|---|---|---|---|
| ACT-001 | Completar los responsables de todas las tareas (`TASK-022` a `TASK-037`) durante la misma reunión de Planning del Sprint 2 | Felipe Nuñez Navarro | 2026-11-23 | Pendiente |
| ACT-002 | Garantizar que cada PR del Sprint 2 tenga al menos un revisor distinto al autor antes del merge | Todo el equipo | 2026-11-30 | Pendiente |
| ACT-003 | Dejar una nota breve de avance cada 2 días en el GitHub Project a modo de seguimiento Daily | Todo el equipo | 2026-11-30 | Pendiente |

## 10. Acuerdos y compromisos

| ID | Acuerdo | Responsable | Fecha límite |
|---|---|---|---|
| AC-001 | Subir las actas del Sprint 1 (`ACT-SP-001`, `ACT-SR-001`, `ACT-RET-001`) al repositorio mediante Pull Request | Felipe Nuñez Navarro | 2026-11-17 |
| AC-002 | Incorporar las acciones de mejora `ACT-001`, `ACT-002` y `ACT-003` en el plan del Sprint 2 | Felipe Nuñez Navarro | 2026-11-23 |

## 11. Validación del acta

| Participante | Rol | Fecha |
|---|---|---|
| Felipe Nuñez Navarro | Scrum Master | 2026-11-17 |
| Jorge Humberto Leyes Rojas | Developer | 2026-11-17 |
| Manuel Alejandro Mera Ruiz | Developer | 2026-11-17 |
| Jesus Gabriel Ortiz Saac | Developer | 2026-11-17 |

### Estado de la retrospectiva

- [x] Se analizaron los resultados del Sprint.
- [x] Se identificaron aspectos positivos.
- [x] Se documentaron dificultades.
- [x] Se identificaron oportunidades de mejora.
- [x] Se definieron acciones concretas.
- [x] Se asignaron responsables.
- [x] Se establecieron fechas de seguimiento.