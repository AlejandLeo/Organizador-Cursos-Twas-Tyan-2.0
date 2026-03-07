# Sistema de Gestión de Eventos Académicos 🎓

Plataforma integral diseñada para la organización y administración de eventos académicos, facilitando la gestión de usuarios, actividades, inscripciones, asistencias y la generación de certificados.

## Tecnologías

El proyecto utiliza una arquitectura moderna de desacoplamiento entre cliente y servidor:

- **Backend**: [NestJS](https://nestjs.com/) (Node.js) + [TypeORM](https://typeorm.io/) + PostgreSQL.
- **Frontend**: [Vue 3](https://vuejs.org/) + TypeScript + [Vite](https://vitejs.dev/) + [Pinia](https://pinia.vuejs.org/).
- **Autenticación**: JSON Web Tokens (JWT).
- **Estilo**: CSS moderno y responsive.

## Estructura del Proyecto

El repositorio está organizado en dos directorios principales:

### `backend/` (Servidor API)
Desarrollado con NestJS, sigue una arquitectura modular y escalable.
- `src/`: Código fuente del servidor.
  - `app.module.ts`: Módulo raíz de la aplicación.
  - `main.ts`: Punto de entrada de la aplicación.
- `test/`: Pruebas unitarias y de integración (E2E).
- `.env.example`: Plantilla de configuración de variables de entorno.

### `frontend/` (Cliente Web)
Basado en Vue 3 con Vite, enfocado en una experiencia de usuario fluida.
- `src/`: Código fuente del cliente.
  - `components/`: Componentes reutilizables de la interfaz.
  - `views/`: Páginas principales de la aplicación.
  - `stores/`: Gestión de estado global con Pinia.
  - `router/`: Configuración de rutas de navegación.
  - `assets/`: Recursos estáticos (imágenes, estilos globales).
- `public/`: Archivos estáticos servidos directamente.

## Instalación y Configuración

### Prerrequisitos
- Node.js (v20 o superior recomendado)
- npm o yarn
- Instancia de PostgreSQL funcional

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/AlejandLeo/Organizador-Cursos-Twas-Tyan-2.0.git
cd Organizador-Cursos-Twas-Tyan-2.0
```

### Paso 2: Configuración del Backend
1. Navega al directorio del backend e instala las dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Configura las variables de entorno:
   - Copia `.env.example` a `.env`.
   - Edita `.env` con tus credenciales de base de datos y clave secreta JWT.
3. Inicia el servidor en modo desarrollo:
   ```bash
   npm run start:dev
   ```

### Paso 3: Configuración del Frontend
1. Navega al directorio del frontend e instala las dependencias:
   ```bash
   cd ../frontend
   npm install
   ```
2. Inicia el servidor de desarrollo (Vite):
   ```bash
   npm run dev
   ```
   *Por defecto, el frontend estará disponible en `http://localhost:5173`.*

## Modelo Relacional

La base de datos se compone de módulos clave:
- **Usuarios y Roles**: Gestión de identidades y permisos.
- **Eventos y Versiones**: Estructura principal de los eventos académicos.
- **Actividades y Sesiones**: Detalle cronológico y lógico de lo que ocurre en los eventos.
- **Inscripciones y Asistencias**: Seguimiento de la participación de los usuarios.
- **Certificados y Calificaciones**: Resultados finales y acreditación.

## Flujo de Trabajo (GitFlow)

Seguimos el modelo de ramificación GitFlow para asegurar la estabilidad:
- `main`: Código en producción, siempre estable.
- `develop`: Rama principal de integración para desarrollo.
- `feature/*`: Desarrollo de nuevas funcionalidades.
- `fix/*` o `hotfix/*`: Correcciones de errores.

### Convenciones de Commits
Utilizamos **Conventional Commits** para mantener un historial legible:
- `feat`: Nueva funcionalidad.
- `fix`: Corrección de error.
- `docs`: Cambios en documentación.
- `style`: Cambios de formato (sin afectar lógica).
- `refactor`: Mejora de código sin cambiar funcionalidad.
- `test`: Añadir o corregir pruebas.
- `chore`: Tareas de mantenimiento o configuración.

*Ejemplo: `feat(api): implementar endpoint de registro de asistencia`*