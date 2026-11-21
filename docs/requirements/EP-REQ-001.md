# Especificación de Épicas y Requerimientos — Sprint 1 (Vive Zarzal App)

## 1. Épicas del Proyecto (Alcance Sprint 1)

| ID Épica | Nombre de la Épica | Descripción | Historias asociadas |
|---|---|---|---|
| EP-01 | Infraestructura, Entorno y Base Técnica | Garantizar un entorno de desarrollo reproducible (Docker, PostgreSQL, Sequelize) y la integridad del código base del foro gastronómico. | US-101, US-102 |
| EP-02 | Seguridad, Autenticación y Control de Acceso | Gestionar roles, permisos y protección de rutas mediante middlewares reutilizables y autenticación JWT. | US-103 |
| EP-03 | Interacción Comunitaria del Foro | Permitir a los miembros registrados interactuar con las publicaciones gastronómicas (favoritos, consulta y gestión). | US-104 |

---

## 2. Requerimientos Funcionales (RF)

| ID | Nombre | Descripción | Historia vinculada |
|---|---|---|---|
| RF-01 | Inicialización de base de datos y catálogos | El sistema debe permitir ejecutar migraciones y seeders idempotentes para poblar las 21 tablas de dominio y catálogos iniciales sin duplicar datos. | US-101, US-102 |
| RF-02 | Control de acceso basado en roles y permisos | El sistema debe restringir el acceso a rutas protegidas validando el rol (`requireRole`) o permiso (`requirePermission`) del usuario autenticado. | US-103 |
| RF-03 | Redirección de usuarios no autenticados | El sistema debe redirigir al formulario de inicio de sesión a cualquier visitante sin sesión activa que intente acceder a una ruta protegida. | US-103, US-104 |
| RF-04 | Guardar publicación en favoritos | El sistema debe permitir a un miembro autenticado marcar una publicación como favorita sin generar registros duplicados. | US-104 |
| RF-05 | Quitar y listar publicaciones favoritas | El sistema debe permitir a un miembro autenticado eliminar una publicación de sus favoritos y consultar su listado de publicaciones guardadas. | US-104 |

---

## 3. Requerimientos No Funcionales (RNF)

| ID | Categoría | Descripción | Criterio de verificación |
|---|---|---|---|
| RNF-01 | Portabilidad y Despliegue | El entorno de base de datos PostgreSQL debe ejecutarse mediante contenedores Docker Compose para asegurar paridad entre los equipos de desarrollo. | Levantamiento exitoso con `docker compose up -d` |
| RNF-02 | Mantenibilidad y Estándares | El código fuente en Node.js (Express 5) debe cumplir las reglas de estilo definidas en ESLint y respetar la arquitectura MVC existente. | Ejecución sin errores de `npm run lint` |
| RNF-03 | Confiabilidad y Pruebas | Las funcionalidades críticas (restauración, permisos y favoritos) deben contar con pruebas automatizadas mediante Node.js Test Runner. | 100% de pruebas aprobadas en `npm test` (46/46) |
| RNF-04 | Seguridad | Las contraseñas deben almacenarse cifradas con `bcryptjs` y las sesiones gestionarse mediante tokens `JWT` firmados, retornando HTTP `403` ante accesos no autorizados. | Validado en `tests/authorization.test.js` |

---

## 4. Clasificación de Historias del Sprint 1

| ID | Tipo | Épica | Requerimientos | Título | SP |
|---|---|---|---|---|---|
| US-101 | Historia Técnica | EP-01 | RF-01, RNF-01 | Estabilización del entorno local (Docker, migraciones, seeders, rutas y modelos) | 2 |
| US-102 | Historia Técnica | EP-01 | RF-01, RNF-02, RNF-03 | Restauración de seeders idempotentes y código base del foro | 2 |
| US-103 | Historia Técnica | EP-02 | RF-02, RF-03, RNF-04 | Middleware de autorización por rol y permiso (`requireRole`, `requirePermission`) | 3 |
| US-104 | Historia de Usuario | EP-03 | RF-03, RF-04, RF-05 | Guardar, quitar y consultar publicaciones favoritas | 3 |