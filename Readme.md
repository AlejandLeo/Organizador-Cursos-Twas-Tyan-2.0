# Sistema de Gestión de Eventos Académicos 🎓

Plataforma integral diseñada para la organización y administración de eventos académicos, facilitando la gestión de usuarios, actividades, inscripciones, asistencias y la generación de certificados.

## Tecnologías

El proyecto utiliza una arquitectura moderna de desacoplamiento entre cliente y servidor:

* **Backend**: NestJS (Node.js) + TypeORM + PostgreSQL.
* **Frontend**: Vue 3 + TypeScript + Vite + Pinia.
* **Autenticación**: JSON Web Tokens (JWT).
* **Estilo**: CSS moderno y responsive.

<!--
Esta sección describe las tecnologías principales del proyecto.
Se mantiene simple para que cualquier desarrollador entienda rápidamente
el stack utilizado en backend y frontend.
-->

---

## Dependencias Principales del Backend

<!--
Esta sección ayuda a que los desarrolladores entiendan qué librerías
importantes usa el backend. No es obligatorio, pero es común en proyectos
de backend para explicar la arquitectura.
-->

El backend utiliza varias librerías clave del ecosistema de NestJS:

* `@nestjs/common`
* `@nestjs/core`
* `@nestjs/typeorm`
* `typeorm`
* `pg` (driver de PostgreSQL)
* `dotenv`
* `jsonwebtoken`
* `@nestjs/swagger`
* `swagger-ui-express`

Estas dependencias permiten la conexión con la base de datos, la autenticación mediante JWT y la generación automática de documentación de la API.

---

## Estructura del Proyecto

El repositorio está organizado en dos directorios principales:

### `backend/` (Servidor API)

Desarrollado con NestJS, sigue una arquitectura modular y escalable.

* `src/`: Código fuente del servidor.

  * `app.module.ts`: Módulo raíz de la aplicación.
  * `main.ts`: Punto de entrada de la aplicación.
* `test/`: Pruebas unitarias y de integración (E2E).
* `.env.example`: Plantilla de configuración de variables de entorno.

<!--
Si el proyecto crece, aquí también se pueden documentar carpetas como:
modules/
database/
migrations/
-->

### `frontend/` (Cliente Web)

Basado en Vue 3 con Vite, enfocado en una experiencia de usuario fluida.

* `src/`: Código fuente del cliente.

  * `components/`: Componentes reutilizables de la interfaz.
  * `views/`: Páginas principales de la aplicación.
  * `stores/`: Gestión de estado global con Pinia.
  * `router/`: Configuración de rutas de navegación.
  * `assets/`: Recursos estáticos (imágenes, estilos globales).
* `public/`: Archivos estáticos servidos directamente.

---

## Instalación y Configuración

### Prerrequisitos

* Node.js (v20 o superior recomendado)
* npm o yarn
* Instancia de PostgreSQL funcional

<!--
Aquí se listan los requisitos mínimos para que otro desarrollador
pueda ejecutar el proyecto en su computadora.
-->

---

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/AlejandLeo/Organizador-Cursos-Twas-Tyan-2.0.git
cd Organizador-Cursos-Twas-Tyan-2.0
```

---

### Paso 2: Configuración del Backend

1. Navega al directorio del backend e instala las dependencias:

```bash
cd backend
npm install
```

2. Configura las variables de entorno:

Copia `.env.example` a `.env`.

```bash
cp .env.example .env
```

Edita el archivo `.env` con las credenciales de tu base de datos.

Ejemplo:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=eventos
JWT_SECRET=secretkey
```

3. Inicia el servidor en modo desarrollo:

```bash
npm run start:dev
```

---

## Migraciones de Base de Datos

<!--
Esta sección explica cómo manejar la base de datos usando migraciones
de TypeORM. Es importante cuando se trabaja en equipo.
-->

El proyecto utiliza migraciones para gestionar cambios en la estructura de la base de datos.

Las migraciones se encuentran en:

```
backend/src/database/migrations
```

### Generar una migración

```bash
npm run migration:generate
```

### Ejecutar migraciones

```bash
npm run migration:run
```

### Revertir una migración

```bash
npm run migration:revert
```

Esto permite mantener sincronizada la estructura de la base de datos entre todos los desarrolladores del proyecto.

---

## Documentación de la API

<!--
Swagger permite visualizar y probar los endpoints de la API
directamente desde el navegador.
-->

La documentación interactiva de la API está disponible mediante Swagger.

Una vez que el servidor backend esté ejecutándose, puedes acceder a:

```
http://localhost:3000/api
```

Desde esta interfaz es posible:

* visualizar todos los endpoints disponibles
* probar solicitudes HTTP
* revisar las estructuras de datos utilizadas por la API

---

## Scripts útiles

<!--
Esta sección explica algunos scripts importantes definidos
en package.json del backend.
-->

### Backend

Ejecutar servidor en desarrollo:

```bash
npm run start:dev
```

Compilar el proyecto:

```bash
npm run build
```

Ejecutar versión compilada:

```bash
npm run start:prod
```

---

## Paso 3: Configuración del Frontend

1. Navega al directorio del frontend e instala las dependencias:

```bash
cd ../frontend
npm install
```

2. Inicia el servidor de desarrollo:

```bash
npm run dev
```

Por defecto, el frontend estará disponible en:

```
http://localhost:5173
```

---

## Modelo Relacional

La base de datos se compone de módulos clave:

* **Usuarios y Roles**: Gestión de identidades y permisos.
* **Eventos y Versiones**: Estructura principal de los eventos académicos.
* **Actividades y Sesiones**: Detalle cronológico y lógico de lo que ocurre en los eventos.
* **Inscripciones y Asistencias**: Seguimiento de la participación de los usuarios.
* **Certificados y Calificaciones**: Resultados finales y acreditación.

---

## Flujo de Trabajo (GitFlow)

Seguimos el modelo de ramificación GitFlow para asegurar la estabilidad:

* `main`: Código en producción, siempre estable.
* `develop`: Rama principal de integración para desarrollo.
* `feature/*`: Desarrollo de nuevas funcionalidades.
* `fix/*` o `hotfix/*`: Correcciones de errores.

---

## Convenciones de Commits

Utilizamos **Conventional Commits** para mantener un historial legible:

* `feat`: Nueva funcionalidad.
* `fix`: Corrección de error.
* `docs`: Cambios en documentación.
* `style`: Cambios de formato.
* `refactor`: Mejora de código sin cambiar funcionalidad.
* `test`: Añadir o corregir pruebas.
* `chore`: Tareas de mantenimiento o configuración.

Ejemplo:

```
feat(api): implementar endpoint de registro de asistencia
```
