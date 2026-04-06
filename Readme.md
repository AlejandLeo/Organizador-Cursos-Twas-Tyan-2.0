# Sistema de Gestión de Eventos Académicos 🎓

Plataforma integral diseñada para la organización y administración de eventos académicos, facilitando la gestión de usuarios, actividades, inscripciones, asistencias y la generación de certificados.

## Tecnologías

El proyecto utiliza una arquitectura moderna de desacoplamiento entre cliente y servidor:

* **Backend**: NestJS (Node.js) + TypeORM + PostgreSQL.
* **Frontend**: Vue 3 + TypeScript + Vite + Pinia.
* **Autenticación**: JSON Web Tokens (JWT).
* **Estilo**: CSS moderno y responsive.

---

## Dependencias Principales del Backend

El backend utiliza varias librerías clave del ecosistema de NestJS:

| Paquete | Para qué sirve |
|---|---|
| `@nestjs/common` | Decoradores, pipes, guards y utilidades base de NestJS |
| `@nestjs/core` | Motor interno que arranca la aplicación NestJS |
| `@nestjs/platform-express` | Conecta NestJS con Express para manejar HTTP |
| `@nestjs/typeorm` | Integra TypeORM dentro del sistema de módulos de NestJS |
| `typeorm` | ORM para mapear clases TypeScript a tablas de PostgreSQL |
| `pg` | Driver nativo de PostgreSQL para Node.js (TypeORM lo necesita) |
| `bcrypt` | Hashea (encripta) contraseñas antes de guardarlas en la DB |
| `class-validator` | Valida que los datos enviados en requests tengan el formato correcto |
| `class-transformer` | Transforma objetos planos a instancias de clases y viceversa |
| `dotenv` | Carga las variables de entorno del archivo `.env` |
| `reflect-metadata` | Requerido por TypeScript para que los decoradores funcionen |
| `rxjs` | Librería de programación reactiva, base interna de NestJS |

> **¿Por qué bcrypt?** Las contraseñas nunca se guardan en texto plano. `bcrypt` las convierte en un hash irreversible. Aunque alguien robe la base de datos, no podrá leer las contraseñas.

<!-- 
* `@nestjs/common`
* `@nestjs/core`
* `@nestjs/typeorm`
* `typeorm`
* `pg` (driver de PostgreSQL)
* `dotenv`
* `jsonwebtoken`
* `@nestjs/swagger`
* `swagger-ui-express` -->

---

## Estructura del Proyecto

El repositorio está organizado en dos directorios principales:

### `backend/` (Servidor API)

Desarrollado con NestJS, sigue una arquitectura modular y escalable.

```
backend/
├── src/
│   ├── app.module.ts         ← Módulo raíz (registra todos los bloques)
│   ├── main.ts               ← Punto de entrada de la app
│   ├── database/
│   │   └── migrations/       ← Archivos de migración TypeORM
│   ├── usuarios/             ← Bloque 1: Usuarios y Accesos
│   ├── eventos/              ← Bloque 2: Eventos y Actividades
│   └── ... (17 módulos organizados por lógica de negocio)
├── .env.example              ← Plantilla de variables de entorno
└── docs/database/            ← Diagamas y scripts base (solo referencia)
```

### `frontend/` (Cliente Web)

Basado en Vue 3 con Vite, enfocado en una experiencia de usuario fluida.

```
frontend/
└── src/
    ├── components/   ← Componentes reutilizables
    ├── views/        ← Páginas principales
    ├── stores/       ← Estado global con Pinia
    ├── router/       ← Rutas de navegación
    └── assets/       ← Imágenes y estilos globales
```

---

## Instalación y Configuración

### Prerrequisitos

* Node.js v20 o superior
* npm
* PostgreSQL (instancia activa en tu máquina o servidor)

---

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/AlejandLeo/Organizador-Cursos-Twas-Tyan-2.0.git
cd Organizador-Cursos-Twas-Tyan-2.0
```

---

### Paso 2: Configurar Variables de Entorno del Backend

```bash
cd backend
cp .env.example .env
```

Abre `.env` y completa los valores reales:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=tu_password_real
DATABASE_NAME=eventos_academicos_db
JWT_SECRET=una_cadena_muy_larga_y_secreta
JWT_EXPIRATION=24h
STATE_ENCRYPTION_KEY=una_clave_de_exactamente_32_chars_!!
BCRYPT_SALT_ROUNDS=10
FRONTEND_URL=http://localhost:5173
```

> **Nunca subir el `.env` al repositorio.** Ya está en el `.gitignore`.

---

### Paso 3: Sincronización de la Base de Datos

El sistema está configurado para que TypeORM genere y actualice las tablas automáticamente en el entorno de desarrollo. Solo necesitas crear la base de datos vacía en PostgreSQL.

```bash
# 1. Conecta a PostgreSQL
psql -U postgres

# 2. Crea la base de datos (dentro de psql)
CREATE DATABASE eventos_academicos_db;
```

> **Sincronización Automática:** Al ejecutar `npm run start:dev`, TypeORM comparará tus entidades con la base de datos y aplicará los cambios necesarios automáticamente. No es obligatorio ejecutar scripts SQL manuales fuera de casos de prueba interna.

#### Uso de Migraciones (Recomendado para cambios controlados)
Si prefieres un control granular de los cambios:

```bash
cd backend
npm run migration:run
```

---

### Paso 4: Instalar dependencias del Backend y Arrancar

```bash
cd backend
npm install
npm run start:dev
```

El servidor arranca en: `http://localhost:3000`

---

### Paso 5: Configuración del Frontend

```bash
cd ../frontend
npm install
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## Migraciones de Base de Datos

Las migraciones permiten evolucionar la estructura de la DB **de forma controlada y sin borrar datos**. Están ubicadas en `backend/src/database/migrations/`.

> **¿Cuándo usar migraciones?** Cuando modificas una entidad TypeORM (ejemplo: agregas una columna a `Usuario`). En lugar de modificar manualmente la DB, generas una migración y TypeORM la aplica automáticamente.

### Comandos

```bash
# Generar una nueva migración (detecta cambios en las entidades automáticamente)
npm run migration:generate --name=NombreDescriptivo

# Aplicar todas las migraciones pendientes
npm run migration:run

# Deshacer la última migración (si algo salió mal)
npm run migration:revert
```

### Flujo recomendado al cambiar la base de datos

```
1. Modifica la entidad TypeORM (ej: agrega campo en usuario.entity.ts)
2. npm run migration:generate --name=AgregaCampoTelefono
3. Revisa el archivo generado en src/database/migrations/
4. npm run migration:run
5. Verifica en la DB que el cambio se aplicó
```

---

## Documentación de la API (Swagger)

Una vez que el backend está ejecutándose:

```
http://localhost:3000/api
```

Desde esta interfaz puedes visualizar y probar todos los endpoints.

---

## Scripts útiles

### Backend

```bash
npm run start:dev     # Desarrollo con hot-reload
npm run build         # Compila el proyecto
npm run start:prod    # Ejecuta la versión compilada
npm run lint          # Revisa y corrige estilo de código
npm run test          # Ejecuta las pruebas unitarias
```

---

La base de datos se estructura en 5 bloques modulares (Modelo v2.0):

| Bloque | Tablas | Propósito |
|---|---|---|
| **Bloque 1** | `USUARIOS`, `PERSONAS`, `ROLES`, `USUARIOS_ROLES`, `AFILIACIONES` | Identidad, perfil personal y datos institucionales |
| **Bloque 2** | `EVENTOS`, `COORDINACIONES`, `ACTIVIDADES_ACADEMICAS`, `IMPARTICIONES` | Gestión de eventos, staff y oferta académica |
| **Bloque 3** | `CURSO_MODALIDADES`, `SESIONES_ACADEMICAS` | Configuración de modalidades (nota/asistencia) y cronograma |
| **Bloque 4** | `INSCRIPCIONES`, `INSCRIPCION_MODALIDADES`, `ASISTENCIAS` | Seguimiento de alumnos, notas y asistencia granular |
| **Bloque 5** | `INFO_CERTIFICADOS`, `CERTIFICADOS`, `USUARIOS_CERTIFICADOS` | Diseño de certificados, emisión segura y roles de firma |

> **Seguridad v2.0**:
> * **Privacidad de archivos**: No se guardan rutas. Se usan **UUIDs** para localizar firmas, logos y certificados en el servidor.
> * **Integridad**: Los certificados incluyen un `hash_integridad` (HMAC-SHA256) para evitar alteraciones externas del PDF.

---

## Flujo de Trabajo (GitFlow)

* `main`: Código en producción, siempre estable.
* `dev`: Rama principal de integración.
* `feature/*`: Nuevas funcionalidades.
* `fix/*` o `hotfix/*`: Correcciones de errores.

---

## Convenciones de Commits

Utilizamos **Conventional Commits**:

| Prefijo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `docs` | Cambios en documentación |
| `style` | Cambios de formato |
| `refactor` | Mejora de código sin cambiar funcionalidad |
| `test` | Añadir o corregir pruebas |
| `chore` | Tareas de mantenimiento |

Ejemplo:
```
feat(api): implementar endpoint de registro de asistencia
```
