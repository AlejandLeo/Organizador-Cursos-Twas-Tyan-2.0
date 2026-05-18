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

## Novedades y Funcionalidades Premium Recientes (SGEA)

El sistema ha sido repotenciado con una suite de herramientas avanzadas diseñadas para ofrecer una experiencia premium e institucional:

*   **Rebranding Institucional (SGEA)**: Migración completa de identidad de marca del antiguo nombre "TYAN" a la denominación oficial **SGEA (Sistema de Gestión de Eventos y Actividades)** en todas las cabeceras, layouts y pantallas.
*   **Motor de Certificación PDF 100% Dinámico**: Rediseño completo en [certificados-envio.service.ts](./backend/src/modules/Certificacion/certificados/certificados-envio.service.ts) para procesar plantillas en alta resolución A4, códigos QR con validación en línea y estampados automáticos de firmas de coordinadores y ponentes.
*   **Workplace Canvas Interactivo (Zoom & Scroll Smooth)**: Renovación total del lienzo en [CertificadoWorkplaceView.vue](./frontend/src/views/actividades/CertificadoWorkplaceView.vue) mediante un contenedor de escala física dinámica. Permite zoom suave de 100% a 200% y desplazamiento ultra fluido y nativo en 360 grados sin lag de coordenadas.
*   **Renderizado Resiliente de Firmas**: Las firmas de ponentes y coordinadores cuentan con un sistema de degradación agradable en caso de ausencia de imagen, ocultando placeholders rotos y mostrando firmas vectoriales impecables con sus grados académicos (`Ph.D.`, `M.Sc.`, `Lic.`, etc.) y cargos administrativos.

---

## Tecnologias

El proyecto utiliza una arquitectura moderna de desacoplamiento entre cliente y servidor:

*   **Backend**: NestJS (Node.js) + TypeORM + PostgreSQL.
*   **Frontend**: Vue 3 (Composition API) + TypeScript + Vite + Pinia + TailwindCSS.
*   **Autenticacion**: JSON Web Tokens (JWT).
*   **Estilo**: CSS moderno y responsive.

---

## Dependencias Principales

Para que tu compañero o cualquier desarrollador pueda instalar todo sin problemas, aquí se listan las dependencias clave que se instalarán con `npm install`:

### Backend
*   **Core**: `@nestjs/common`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/passport`
*   **Base de Datos**: `typeorm`, `pg` (PostgreSQL), `typeorm-extension` (para seeds)
*   **Seguridad**: `bcrypt`, `passport-jwt`
*   **Utilidades**: `nodemailer`, `@nestjs-modules/mailer`, `handlebars` (plantillas de correo), `uuid`
*   **Reportes**: `jspdf`, `jspdf-autotable`, `xlsx`
*   **QR**: `html5-qrcode`, `qrcode.vue`

### Frontend
*   **Core**: `vue` (v3), `vue-router`, `pinia` (estado), `axios` (peticiones HTTP)
*   **UI/UX**: `sweetalert2` (alertas), `vue-i18n` (idiomas)
*   **QR**: `html5-qrcode` (lector), `qrcode.vue` (generador)
*   **Reportes**: `jspdf`, `jspdf-autotable`, `xlsx`

> [!NOTE]
> No es necesario instalar estas dependencias una por una. Ejecutar `npm install` en las carpetas `backend` y `frontend` instalará todo automáticamente.

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
