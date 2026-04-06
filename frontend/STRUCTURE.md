# Estructura del Proyecto Frontend (Vue 3)

Esta documentación describe la nueva organización modular del frontend y su relación con el modelo de datos del backend.

## 1. Arquitectura de Directorios

El proyecto se estructura en **Módulos de Dominio**, agrupando la lógica, vistas y estado por funcionalidad.

```
frontend/src/
├── assets/              # Recursos estáticos (CSS, imágenes)
├── components/          # Componentes UI globales (Botones, Modales, Inputs)
├── composables/         # Composable functions (Hooks) reutilizables
├── layouts/             # Layouts principales (AppLayout, AuthLayout)
├── modules/             # Módulos de Negocio
│   ├── auth/            # Autenticación (Login, Registro, Recuperación)
│   │   ├── components/  # Componentes específicos de auth
│   │   ├── interfaces/  # Tipos TS de auth
│   │   ├── store/       # Store Pinia de auth
│   │   └── views/       # Vistas (Login.vue, Register.vue)
│   ├── usuarios/        # Gestión de Usuarios y Perfiles
│   │   ├── ...
│   ├── eventos/         # Eventos, Versiones y Actividades
│   │   ├── ...
│   ├── inscripciones/   # Proceso de inscripción y pagos
│   │   ├── ...
│   ├── certificados/    # Emisión y validación de certificados
│   │   ├── ...
│   └── admin/           # Panel de administración global
│       ├── ...
├── router/              # Configuración de rutas (Vue Router)
├── stores/              # Stores globales (Configuración, UI)
├── types/               # Tipos TypeScript compartidos
├── views/               # Vistas generales (Home, NotFound)
├── App.vue              # Componente raíz
└── main.ts              # Punto de entrada
```

## 2. Modelo Relacional Frontend

Las interfaces de TypeScript en el frontend reflejan las entidades del backend (NestJS + TypeORM).

### Usuarios y Roles
- **Usuario (`IUsuario`)**:
  - `id_usuario`: UUID
  - `email`: string
  - `estado`: 'activo' | 'inactivo'
  - `roles`: string[]
- **Perfil (`IPerfil`)**:
  - `nombres`: string
  - `apellidos`: string
  - `documento_identidad`: string
  - `usuario_id`: UUID (FK)

### Eventos Académicos
- **Evento (`IEvento`)**:
  - `id_evento`: UUID
  - `nombre`: string
  - `descripcion`: string
  - `logo`: string (url)
- **Versión de Evento (`IVersionEvento`)**:
  - `id_version`: UUID
  - `evento_id`: UUID (FK -> Evento)
  - `gestion`: string (e.g., "2024")
  - `fecha_inicio`: Date
  - `fecha_fin`: Date
  - `ubicacion`: string
- **Actividad (`IActividad`)**:
  - `id_actividad`: UUID
  - `version_id`: UUID (FK -> VersionEvento)
  - `nombre`: string
  - `tipo`: 'conferencia' | 'taller' | 'panel'
  - `fecha`: Date
  - `hora_inicio`: string
  - `hora_fin`: string

### Gestión Académica
- **Inscripción (`IInscripcion`)**:
  - `id_inscripcion`: UUID
  - `usuario_id`: UUID (FK -> Usuario)
  - `version_id`: UUID (FK -> VersionEvento)
  - `fecha_inscripcion`: Date
  - `estado`: 'pendiente' | 'confirmada' | 'cancelada'
- **Asistencia (`IAsistencia`)**:
  - `inscripcion_id`: UUID (FK -> Inscripcion)
  - `actividad_id`: UUID (FK -> Actividad)
  - `presente`: boolean
- **Certificado (`ICertificado`)**:
  - `id_certificado`: UUID
  - `inscripcion_id`: UUID (FK -> Inscripcion)
  - `codigo_validacion`: string (Unique)
  - `url_descarga`: string
  - `fecha_emision`: Date

## 3. Implementación de Stores (Pinia)

Los stores gestionan el estado reactivo de estas entidades:

1.  **`auth.store.ts`**: Maneja el token JWT, el usuario actual y sus permisos.
2.  **`eventos.store.ts`**: Carga la lista de eventos y permite filtrar por gestión/tipo.
3.  **`inscripciones.store.ts`**: Gestiona el carrito de inscripciones y el historial del usuario.
4.  **`ui.store.ts`**: Controla notificaciones (toasts), modales y estado de carga global.

## 4. Instrucciones de Configuración

Para generar la estructura de carpetas física, ejecute el script incluido en la raíz:

```bash
node create_dirs.js
```
