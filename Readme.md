# Sistema de Gestion de Eventos Academicos (UMSA)

Bienvenido al repositorio oficial del Organizador de Cursos Tyan 2.0. Esta plataforma esta optimizada para la gestion profesional de eventos academicos, permitiendo el control total de inscripciones, certificados y logistica.

---

## Estructura del Repositorio

Para facilitar el mantenimiento y la escalabilidad, el proyecto se divide en tres niveles de documentacion:

1.  [Backend Documentation](./backend/README.md): Detalles sobre la API (NestJS), base de datos, migraciones y seeders profesionales.
2.  [Frontend Documentation](./frontend/README.md): Guia de la interfaz de usuario (Vue.js), componentes y conexion con el servidor.
3.  [Data Model (Structure)](./frontend/STRUCTURE.md): Explicacion detallada de las entidades y relaciones de la base de datos. (Solo referencia interna).

---

## Prerrequisitos

*   Node.js v20 o superior
*   npm
*   PostgreSQL (instancia activa en tu maquina o servidor)

---

## Inicio Rapido (Quick Start)

Si es tu primera vez en el proyecto, sigue este protocolo:

### 1. Clonar y Configurar
```bash
git clone https://github.com/AlejandLeo/Organizador-Cursos-Twas-Tyan-2.0.git
cd Organizador-Cursos-Twas-Tyan-2.0
```

### 2. Levantar el Backend
Consulta el [README de Backend](./backend/README.md) para configurar el archivo .env y la base de datos.
```bash
cd backend
npm install
# Limpia, migra y carga configuracion base
npm run db:reset
npm run start:dev
```

### 3. Levantar el Frontend
Consulta el [README de Frontend](./frontend/README.md) para mas detalles.
```bash
cd ../frontend
npm install
npm run dev
```

---

## Tecnologias

El proyecto utiliza una arquitectura moderna de desacoplamiento entre cliente y servidor:

*   **Backend**: NestJS (Node.js) + TypeORM + PostgreSQL.
*   **Frontend**: Vue 3 (Composition API) + TypeScript + Vite + Pinia + TailwindCSS.
*   **Autenticacion**: JSON Web Tokens (JWT).
*   **Estilo**: CSS moderno y responsive.

---

## Flujo de Trabajo (GitFlow)

* `main`: Codigo en produccion, siempre estable.
* `dev`: Rama principal de integracion.
* `feature/*`: Nuevas funcionalidades.
* `fix/*`: Correcciones de errores.
* `hotfix/*`: Correcciones de errores criticos.
* `chore/*`: Tareas de mantenimiento, configuracion, dependencias, infraestructura, etc.

---

## Convenciones de Commits

Utilizamos Conventional Commits:

| Prefijo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Correccion de error |
| `docs` | Cambios en documentacion |
| `style` | Cambios de formato |
| `refactor` | Mejora de codigo sin cambiar funcionalidad |
| `test` | Añadir o corregir pruebas |
| `chore` | Tareas de mantenimiento |

Ejemplo:
```
feat(api): implementar endpoint de registro de asistencia
```
