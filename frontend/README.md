# Frontend: Organizador de Cursos Tyan

Interfaz de usuario moderna desarrollada con Vue 3, Vite y Pinia. Enfocada en ofrecer una experiencia fluida para los estudiantes y administradores de la UMSA.

---

## Instalacion y Desarrollo

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar en modo desarrollo
```bash
npm run dev
```
La aplicacion estara disponible en: [http://localhost:5173](http://localhost:5173)

---

## Caracteristicas principales (UX)

1.  **Autocompletado Inteligente**: El formulario de pre-inscripcion detecta los requisitos y precarga datos desde el perfil del estudiante.
2.  **Sincronizacion de Perfil**: Las correcciones realizadas durante la inscripcion se guardan en el perfil global.
3.  **Respaldo de Requisitos (Fallback)**: El sistema garantiza un set basico de seguridad si no hay requisitos configurados.
4.  **Diseño Responsive Premium**: Uso de micro-animaciones y layouts fluidos.

---

## Stack Tecnologico (Frontend)

| Paquete | Para que sirve |
|---|---|
| vue (v3) | Framework principal para la interfaz de usuario |
| vue-router | Gestion de rutas y navegacion |
| pinia | Almacenamiento y gestion del estado global |
| axios | Cliente HTTP para peticiones al Backend |
| sweetalert2 | Dialogos y alertas visuales |
| tailwindcss | Framework de utilidades CSS |

---

## Produccion

Para generar el paquete optimizado para despliegue:

```bash
npm run build
```

El resultado se encontrara en la carpeta dist/.

---

## Documentacion Adicional

Para entender el modelo de datos y la logica de negocio, revisa [STRUCTURE.md](./STRUCTURE.md).

---
[Volver al Menu Principal](../Readme.md)
