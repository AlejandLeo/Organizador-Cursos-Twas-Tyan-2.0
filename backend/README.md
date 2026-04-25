# Backend: Organizador de Cursos Tyan

Este directorio contiene el nucleo del sistema, desarrollado con NestJS y TypeORM. Se ha optimizado para ser ligero, seguro y altamente escalable.

---

## Optimizacion de Dependencias

Para mantener un entorno de produccion ligero, hemos separado estrictamente las librerias:

*   **Runtime (dependencies)**: Paquetes esenciales para la ejecucion (NestJS, TypeORM, Bcrypt, UUID, etc.).
*   **Desarrollo (devDependencies)**: Librerias como @faker-js/faker y tipos @types/* se excluyen del build final, reduciendo el tamaño del servidor de despliegue.

---

## Arquitectura de Datos

La base de datos sigue un flujo profesional:

1.  **Migraciones (src/database/migrations)**: Archivos DDL puros. **NO BORRAR** para preservar el historial de sincronizacion.
2.  **Seeders (src/database/seeds)**:
    *   **Production (/production)**: Datos vitales (Roles, Configuracion maestros).
    *   **Development (/development)**: Datos de prueba (Faker users, eventos mock).

---

## Scripts de NPM

| Comando | Descripcion |
| :--- | :--- |
| `npm run migration:run` | Ejecuta los cambios de estructura pendientes. |
| `npm run seed:config` | Carga unicamente los datos vitales (Ej: Roles). |
| `npm run seed:dev` | Carga configuracion base y datos de prueba. |
| `npm run db:reset` | Resetea la DB (Drop), corre migraciones y carga datos base. |
| `npm run start:dev` | Arranca el servidor en modo desarrollo (Hot-reload). |
| `npm run build` | Genera el build optimizado para produccion. |

---

## Estructura de la Base de Datos (Bloques)

| Bloque | Tablas | Proposito |
|---|---|---|
| **Bloque 1** | USUARIOS, PERSONAS, ROLES, USUARIOS_ROLES, AFILIACIONES | Identidad, perfil personal y datos institucionales |
| **Bloque 2** | EVENTOS, COORDINACIONES, ACTIVIDADES_ACADEMICAS, IMPARTICIONES | Gestion de eventos, staff y oferta academica |
| **Bloque 3** | CURSO_MODALIDADES, SESIONES_ACADEMICAS | Configuracion de modalidades y cronograma |
| **Bloque 4** | INSCRIPCIONES, INSCRIPCION_MODALIDADES, ASISTENCIAS | Seguimiento de alumnos, notas y asistencia |
| **Bloque 5** | INFO_CERTIFICADOS, CERTIFICADOS, USUARIOS_CERTIFICADOS | Diseño de certificados y emision segura |

---

## Configuracion de la Base de Datos

El sistema requiere una instancia de PostgreSQL activa. Antes de iniciar, debes crear la base de datos vacia.

### 1. Creacion Manual (Recomendado)
```bash
# Conecta a PostgreSQL
psql -U postgres

# Crea la base de datos con las especificaciones correctas
CREATE DATABASE eventos_academicos_db
WITH 
    OWNER = tu_usuario
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;
```

> **Sincronizacion Automatica**: Al ejecutar `npm run start:dev`, TypeORM comparara tus entidades con la base de datos y aplicara los cambios necesarios automaticamente.

---

## Configuracion (.env)

Crea un archivo .env basado en .env.example:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_password
DATABASE_NAME=eventos_academicos_db
JWT_SECRET=secreto_seguro
```

---

## Swagger Documentation

Una vez iniciado el servidor, accede a la documentacion interactiva en:
`http://localhost:3000/api`

---

## Migraciones de Base de Datos

Las migraciones permiten evolucionar la estructura de la DB de forma controlada.

### Comandos de Migracion
```bash
# Generar una nueva migracion
npm run migration:generate --name=NombreDescriptivo

# Aplicar migraciones pendientes
npm run migration:run

# Deshacer la ultima migracion
npm run migration:revert
```

---

## Scripts de Utilidad para Desarrolladores

*   **Volcado de Datos (Dump Events)**: Permite visualizar rapidamente los eventos y sus requisitos configurados en la base de datos sin SQL manual.
*   **Comando**: `npx ts-node src/scripts/dump_eventos.ts`

---

## Seguridad v2.0

*   **Privacidad de archivos**: No se guardan rutas en la base de datos. Se usan **UUIDs** para localizar firmas, logos y certificados en el servidor.
*   **Integridad**: Los certificados incluyen un `hash_integridad` (HMAC-SHA256) para evitar alteraciones externas del PDF y garantizar su autenticidad.

---

[Volver al Menu Principal](../Readme.md)
