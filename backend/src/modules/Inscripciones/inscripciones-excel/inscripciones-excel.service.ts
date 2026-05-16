import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';

import { Usuario } from '../../Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../Usuario/personas/entities/persona.entity';
import { Afiliacion } from '../../Usuario/afiliaciones/entities/afiliacion.entity';
import { Rol } from '../../Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../Usuario/usuarios-roles/entities/usuario-rol.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';
import { ActividadAcademica } from '../../Academico/actividades-academicas/entities/actividad-academica.entity';
import { Imparticion } from '../../Academico/imparticiones/entities/imparticion.entity';
import { Evento } from '../../Academico/eventos/entities/evento.entity';
import { MailService } from '../../Comun/mail/mail.service';

// ─── Tipos de resultado ───────────────────────────────────────────────────────

export interface ResultadoFila {
  fila: number;
  email?: string;
  estado: 'creado' | 'inscrito' | 'asignado' | 'omitido' | 'error';
  mensaje: string;
  correoEnviado?: boolean;
  correoAdvertencia?: string;
}

export interface ResultadoImportacion {
  total: number;
  creados?: number;
  inscritos?: number;
  asignados?: number;
  omitidos: number;
  errores: number;
  advertenciasCorreo: number;
  detalle: ResultadoFila[];
}

// ─── Constante de rol por defecto ─────────────────────────────────────────────
const ROL_ESTUDIANTE_ID = 4;
const ROL_PONENTE_ID = 5;

@Injectable()
export class InscripcionesExcelService {
  private readonly logger = new Logger(InscripcionesExcelService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Afiliacion)
    private readonly afiliacionRepo: Repository<Afiliacion>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepo: Repository<UsuarioRol>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepo: Repository<Inscripcion>,
    @InjectRepository(ActividadAcademica)
    private readonly actividadRepo: Repository<ActividadAcademica>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  ESCENARIO 1 — Registro masivo de usuarios desde Excel
  // ══════════════════════════════════════════════════════════════════════════

  async registroMasivoUsuarios(
    fileBuffer: Buffer,
    notificar = false,
    modo: 'verificar' | 'guardar' = 'guardar'
  ): Promise<ResultadoImportacion> {
    const filas = this.parsearExcel(fileBuffer);

    if (filas.length === 0) {
      throw new BadRequestException(
        'El archivo Excel está vacío o no tiene filas de datos.',
      );
    }

    const detalle: ResultadoFila[] = [];
    let creados = 0;
    let omitidos = 0;
    let errores = 0;
    let advertenciasCorreo = 0;

    // ── Transacción Global ────────────────────────────────────────
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numFila = i + 2; // +2: encabezado en fila 1, datos desde fila 2
        const email = String(fila['email'] || '').trim().toLowerCase();

        // ── Validación básica ────────────────────────────────────────────
        if (!email) {
          detalle.push({ fila: numFila, estado: 'error', mensaje: 'Email vacío o inválido.' });
          errores++;
          continue;
        }

        const password = String(fila['password'] || '').trim();
        if (!password || password.length < 6) {
          detalle.push({ fila: numFila, email, estado: 'error', mensaje: 'Contraseña ausente o menor a 6 caracteres.' });
          errores++;
          continue;
        }

        const generoRaw = fila['genero'];
        const genero = generoRaw !== undefined && generoRaw !== '' ? Number(generoRaw) : null;

        // ── Verificar si ya existe ────────────────────────────────────────
        // Usamos manager para buscar dentro de la transacción actual
        const existe = await queryRunner.manager.findOne(Usuario, { where: { email } });
        if (existe) {
          detalle.push({ fila: numFila, email, estado: 'omitido', mensaje: 'El email ya está registrado en el sistema.' });
          omitidos++;
          continue;
        }

        // ── Creación en Savepoint ─────────────────────────────────────────
        const savepointName = `row_${i}`;
        await queryRunner.query(`SAVEPOINT ${savepointName}`);

        try {
          const hash = await bcrypt.hash(password, 10);

          // 1. Usuario
          const usuario = queryRunner.manager.create(Usuario, {
            email,
            password: hash,
            estado: 1,
            requiere_cambio_password: true,
          });
          const usuarioGuardado = await queryRunner.manager.save(usuario);

          // 2. Persona
          const nombres = String(fila['nombres'] || '').trim();
          const primerApellido = String(fila['primer_apellido'] || '').trim();
          
          // Parsear fecha de nacimiento para manejar objetos Date de Excel y strings
          let fechaNacimientoStr: string | undefined = undefined;
          const fnRaw = fila['fecha_nacimiento'];
          if (fnRaw) {
            let d: Date | null = null;
            if (fnRaw instanceof Date) {
              d = fnRaw;
            } else if (typeof fnRaw === 'number') {
              d = new Date(Math.round((fnRaw - 25569) * 86400 * 1000));
            } else if (typeof fnRaw === 'string') {
              const parts = fnRaw.split('/');
              if (parts.length === 3) {
                d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
              } else {
                d = new Date(fnRaw);
              }
            }
            if (d && !isNaN(d.getTime())) {
              fechaNacimientoStr = d.toISOString().split('T')[0];
            } else {
              fechaNacimientoStr = String(fnRaw).trim();
            }
          }

          const persona = queryRunner.manager.create(Persona, {
            nombres: nombres || undefined,
            primer_apellido: primerApellido || undefined,
            segundo_apellido: String(fila['segundo_apellido'] || '').trim() || undefined,
            documento_identidad: String(fila['documento_identidad'] || '').trim() || undefined,
            genero: genero !== null && !isNaN(genero) ? genero : undefined,
            pais_origen: String(fila['pais_origen'] || '').trim() || undefined,
            pais_residencia: String(fila['pais_residencia'] || '').trim() || undefined,
            fecha_nacimiento: fechaNacimientoStr,
            celular: String(fila['celular'] || '').trim() || undefined,
            usuario: usuarioGuardado,
          });
          await queryRunner.manager.save(persona);

          // 3. Afiliación (opcional)
          const institucion = String(fila['institucion'] || '').trim();
          if (institucion) {
            const idGradoRaw = fila['id_grado_academico'];
            const afiliacion = queryRunner.manager.create(Afiliacion, {
              institucion,
              tipo_afiliacion: String(fila['tipo_afiliacion'] || '').trim() || undefined,
              area_tematica: String(fila['area_tematica'] || '').trim() || undefined,
              disciplina_cientifica: String(fila['disciplina_cientifica'] || '').trim() || undefined,
              id_grado_academico: idGradoRaw ? Number(idGradoRaw) : undefined,
              usuario: usuarioGuardado,
            });
            await queryRunner.manager.save(afiliacion);
          }

          // 4. Rol
          const idRolRaw = fila['id_rol'];
          const rolId = idRolRaw ? Number(idRolRaw) : ROL_ESTUDIANTE_ID;
          const rol = await queryRunner.manager.findOne(Rol, { where: { id: rolId } });
          if (rol) {
            const usuarioRol = queryRunner.manager.create(UsuarioRol, {
              usuario: usuarioGuardado,
              rol,
              estado: 1,
            });
            await queryRunner.manager.save(usuarioRol);
          }

          // ── Envío de Correo Diferido ───────────────────────────────
          let correoEnviado = false;
          let correoAdvertencia: string | undefined;

          // Solo notificamos si el modo es guardar (luego lo haremos fuera de la transaccion idealmente, pero aqui simulamos)
          if (notificar && modo === 'guardar') {
            const nombreCompleto = `${nombres} ${primerApellido}`.trim() || email;
            try {
              await this.mailService.sendAccountApprovalEmail(email, nombreCompleto, password);
              correoEnviado = true;
            } catch (mailError) {
              correoAdvertencia = mailError.message?.includes('Límite diario')
                ? 'Límite diario de correos alcanzado. No se envió notificación.'
                : `Error de correo: ${mailError.message}`;
              advertenciasCorreo++;
            }
          }

          detalle.push({
            fila: numFila,
            email,
            estado: modo === 'verificar' ? 'omitido' : 'creado',
            mensaje: modo === 'verificar' ? 'Válido para ser creado.' : `Usuario creado correctamente${rol ? ` con rol "${rol.nombre_rol}"` : ''}.`,
            correoEnviado,
            correoAdvertencia,
          });
          creados++;
        } catch (error) {
          await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          detalle.push({
            fila: numFila,
            email,
            estado: 'error',
            mensaje: error.message || 'Error de base de datos al crear el usuario.',
          });
          errores++;
        }
      }

      // ── Decisión Final: Todo o Nada ─────────────────────────────────
      if (modo === 'verificar' || errores > 0) {
        await queryRunner.rollbackTransaction();
        if (modo === 'guardar' && errores > 0) {
          // Si intentaba guardar y hubo errores, cambiamos el estado de los "creados" a "omitidos"
          detalle.forEach(d => {
            if (d.estado === 'creado') {
              d.estado = 'omitido';
              d.mensaje = 'Omitido debido a errores en otras filas (Modo Estricto).';
            }
          });
          creados = 0;
        }
      } else {
        await queryRunner.commitTransaction();
      }

    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return {
      total: filas.length,
      creados,
      omitidos,
      errores,
      advertenciasCorreo,
      detalle,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ESCENARIO 2 — Inscripción masiva a actividad académica desde Excel
  // ══════════════════════════════════════════════════════════════════════════

  async inscripcionMasivaEvento(
    fileBuffer: Buffer,
    notificar = false,
    idActividad?: number,
    idEvento?: number,
    modo: 'verificar' | 'guardar' = 'guardar',
    crearUsuarios = false
  ): Promise<ResultadoImportacion> {
    const filas = this.parsearExcel(fileBuffer);

    if (filas.length === 0) {
      throw new BadRequestException(
        'El archivo Excel está vacío o no tiene filas de datos.',
      );
    }

    const detalle: ResultadoFila[] = [];
    let inscritos = 0;
    let creados = 0;
    let omitidos = 0;
    let errores = 0;
    let advertenciasCorreo = 0;

    // Cache de actividades para no re-consultar en cada fila
    const actividadCache = new Map<string, ActividadAcademica | null>();

    // ── Transacción Global ────────────────────────────────────────
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numFila = i + 2;
        const email = String(fila['email'] || '').trim().toLowerCase();
        const nombreActividad = String(fila['nombre_actividad_academica'] || '').trim();

        if (!email) {
          detalle.push({ fila: numFila, estado: 'error', mensaje: 'Email vacío.' });
          errores++;
          continue;
        }

        if (!nombreActividad && !idActividad) {
          detalle.push({ fila: numFila, email, estado: 'error', mensaje: 'nombre_actividad_academica vacío y no hay id_actividad seleccionado.' });
          errores++;
          continue;
        }

        // ── Creación en Savepoint ─────────────────────────────────────────
        const savepointName = `row_insc_${i}`;
        await queryRunner.query(`SAVEPOINT ${savepointName}`);

        try {
          // ── 1. Buscar o Crear usuario ───────────────────────────────────────────
          let usuario = await queryRunner.manager.findOne(Usuario, {
            where: { email },
            relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
          });

          let fueCreado = false;
          let passwordTemporal = '';

          if (!usuario) {
            // Si no se permite crear usuarios, lanzamos error
            if (!crearUsuarios) {
              throw new Error(`Usuario con email "${email}" no encontrado. Activa "Registrar usuarios nuevos" para crearlo automáticamente.`);
            }

            // Si no existe, lo creamos (Similar a registroMasivoUsuarios)
            passwordTemporal = String(fila['password'] || fila['documento_identidad'] || 'Usuario123!').trim();
            const hash = await bcrypt.hash(passwordTemporal, 10);

            usuario = queryRunner.manager.create(Usuario, {
              email,
              password: hash,
              estado: 1,
              requiere_cambio_password: true,
            });
            const usuarioGuardado = await queryRunner.manager.save(usuario);

            const persona = queryRunner.manager.create(Persona, {
              nombres: String(fila['nombres'] || '').trim() || 'Estudiante',
              primer_apellido: String(fila['primer_apellido'] || '').trim() || 'Nuevo',
              segundo_apellido: String(fila['segundo_apellido'] || '').trim() || undefined,
              documento_identidad: String(fila['documento_identidad'] || '').trim() || undefined,
              celular: String(fila['celular'] || '').trim() || undefined,
              usuario: usuarioGuardado,
            });
            await queryRunner.manager.save(persona);

            // Asignar rol estudiante
            const rol = await queryRunner.manager.findOne(Rol, { where: { id: ROL_ESTUDIANTE_ID } });
            if (rol) {
              const usuarioRol = queryRunner.manager.create(UsuarioRol, {
                usuario: usuarioGuardado,
                rol,
                estado: 1,
              });
              await queryRunner.manager.save(usuarioRol);
            }
            usuario = { ...usuarioGuardado, persona };
            fueCreado = true;
          } else {
            // Validar que el usuario existente tenga el rol de Estudiante (4)
            const tieneRolEstudiante = usuario.usuariosRoles?.some(ur => ur.rol?.id === ROL_ESTUDIANTE_ID);
            if (!tieneRolEstudiante) {
              throw new Error(`El usuario existe pero no tiene el rol de "Estudiante". No se puede inscribir.`);
            }
          }

          // ── 2. Buscar actividad académica (siempre por nombre dentro del evento) ─────────
          let actividad: ActividadAcademica | null | undefined;

          if (idEvento) {
            const cacheKey = `ev_${idEvento}_${nombreActividad.toLowerCase()}`;
            if (actividadCache.has(cacheKey)) {
              actividad = actividadCache.get(cacheKey);
            } else {
              actividad = await queryRunner.manager.findOne(ActividadAcademica, {
                where: { 
                  nombre: ILike(nombreActividad),
                  evento: { id: idEvento }
                },
                relations: ['evento'],
              });
              actividadCache.set(cacheKey, actividad);
            }
          } else {
            throw new Error('Debe seleccionarse un evento para buscar la actividad.');
          }

          if (!actividad) {
            throw new Error(idEvento 
              ? `Actividad "${nombreActividad}" no encontrada en el evento seleccionado.` 
              : `Actividad "${nombreActividad}" no encontrada.`);
          }

          // ── 3. Verificar si ya está inscrito ────────────────────────────────
          const inscripcionExistente = await queryRunner.manager.findOne(Inscripcion, {
            where: {
              usuario: { id: usuario.id },
              actividadAcademica: { id: actividad.id },
            },
          });

          if (inscripcionExistente) {
            detalle.push({
              fila: numFila,
              email,
              estado: 'omitido',
              mensaje: `El usuario ya está inscrito en "${actividad.nombre}".`,
            });
            omitidos++;
            await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            continue;
          }

          // ── 4. Inscribir ──────────────────────────────────────────────────
          const inscripcion = queryRunner.manager.create(Inscripcion, {
            usuario,
            actividadAcademica: actividad,
            estado: 1,
            miembro_tyan: 0,
          });
          await queryRunner.manager.save(inscripcion);

          // ── 5. Notificación ──────────────────────────────────────────────
          let correoEnviado = false;
          let correoAdvertencia: string | undefined;

          if (notificar && modo === 'guardar') {
            const nombre = usuario.persona
              ? `${usuario.persona.nombres || ''} ${usuario.persona.primer_apellido || ''}`.trim()
              : email;
            const eventoNombre = actividad['evento']?.nombre || 'Evento';
            
            try {
              if (fueCreado) {
                // Si fue creado, enviamos datos de acceso
                await this.mailService.sendAccountApprovalEmail(email, nombre, passwordTemporal);
              } else {
                // Si ya existía, solo confirmación de inscripción
                await this.mailService.sendEnrollmentConfirmedEmail(email, nombre, actividad.nombre, eventoNombre);
              }
              correoEnviado = true;
            } catch (mailError) {
              correoAdvertencia = mailError.message?.includes('Límite diario')
                ? 'Límite diario de correos alcanzado.'
                : `Error correo: ${mailError.message}`;
              advertenciasCorreo++;
            }
          }

          detalle.push({
            fila: numFila,
            email,
            estado: modo === 'verificar' ? 'omitido' : (fueCreado ? 'creado' : 'inscrito'),
            mensaje: modo === 'verificar' 
              ? `Válido para ${fueCreado ? 'crear e inscribir' : 'inscribir'} en "${actividad.nombre}".` 
              : `${fueCreado ? 'Usuario creado e inscrito' : 'Inscrito'} correctamente en "${actividad.nombre}".`,
            correoEnviado,
            correoAdvertencia,
          });

          if (fueCreado) creados++;
          inscritos++;

        } catch (error) {
          await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          detalle.push({
            fila: numFila,
            email,
            estado: 'error',
            mensaje: error.message || 'Error al procesar fila.',
          });
          errores++;
        }
      }

      // ── Decisión Final ─────────────────────────────────────────────
      if (modo === 'verificar' || errores > 0) {
        await queryRunner.rollbackTransaction();
        if (modo === 'guardar' && errores > 0) {
          detalle.forEach(d => {
            if (d.estado === 'inscrito' || d.estado === 'creado') {
              d.estado = 'omitido';
              d.mensaje = 'Omitido por errores en otras filas.';
            }
          });
          inscritos = 0;
          creados = 0;
        }
      } else {
        await queryRunner.commitTransaction();
      }

    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return {
      total: filas.length,
      inscritos,
      creados,
      omitidos,
      errores,
      advertenciasCorreo,
      detalle,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Generación de plantillas Excel
  // ══════════════════════════════════════════════════════════════════════════

  generarPlantillaUsuarios(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        'email', 'password', 'nombres', 'primer_apellido', 'segundo_apellido',
        'documento_identidad', 'genero', 'pais_origen', 'pais_residencia',
        'fecha_nacimiento', 'celular', 'institucion', 'tipo_afiliacion',
        'area_tematica', 'disciplina_cientifica', 'id_grado_academico', 'id_rol',
      ],
      [
        'ejemplo@correo.com', 'Clave1234', 'Ana María', 'López', 'García',
        '12345678', 1, 'Bolivia', 'Bolivia', '2000-05-15', '77712345',
        'Universidad Mayor de San Andrés', 'Universidad', 'Ciencias Exactas',
        'Informática', 2, 4,
      ],
    ]);

    // Ancho de columnas
    ws['!cols'] = Array(17).fill({ wch: 22 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro Usuarios');

    // Hoja de referencia de géneros
    const wsRef = XLSX.utils.aoa_to_sheet([
      ['Código género', 'Descripción'],
      [0, 'Masculino'],
      [1, 'Femenino'],
      [2, 'Otro'],
      [3, 'Prefiero no decir'],
      ['', ''],
      ['Código rol', 'Descripción'],
      [4, 'Estudiante (por defecto)'],
      [3, 'Ponente'],
      [2, 'Coordinador'],
    ]);
    wsRef['!cols'] = [{ wch: 18 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referencia');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  generarPlantillaInscripciones(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        'email', 'nombre_actividad_academica', 'nombres', 'primer_apellido', 
        'segundo_apellido', 'documento_identidad'
      ],
      [
        'estudiante_nuevo@correo.com', 'Taller de Machine Learning', 'Juan', 'Perez',
        'Villazón', '12345678'
      ],
      [
        'usuario_existente@correo.com', 'Curso de Bioinformática', '', '', '', ''
      ],
    ]);
    ws['!cols'] = [
      { wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 20 }, 
      { wch: 20 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripción Masiva');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Gestión de Ponentes
  // ══════════════════════════════════════════════════════════════════════════

  async asignacionMasivaPonentes(
    fileBuffer: Buffer,
    notificar = false,
    idEvento?: number,
    modo: 'verificar' | 'guardar' = 'guardar',
    crearUsuarios = false
  ): Promise<ResultadoImportacion> {
    const filas = this.parsearExcel(fileBuffer);
    if (filas.length === 0) throw new BadRequestException('El archivo Excel está vacío.');

    const detalle: ResultadoFila[] = [];
    let asignados = 0;
    let creados = 0;
    let omitidos = 0;
    let errores = 0;
    let advertenciasCorreo = 0;
    const actividadCache = new Map<string, ActividadAcademica | null>();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numFila = i + 2;
        const email = String(fila['email'] || '').trim().toLowerCase();
        const nombreActividad = String(fila['nombre_actividad_academica'] || '').trim();

        if (!email || !nombreActividad) {
          detalle.push({ fila: numFila, estado: 'error', mensaje: 'Email o nombre de actividad vacío.' });
          errores++;
          continue;
        }

        const savepointName = `row_pon_${i}`;
        await queryRunner.query(`SAVEPOINT ${savepointName}`);

        try {
          // 1. Buscar o Crear usuario
          let usuario = await queryRunner.manager.findOne(Usuario, {
            where: { email },
            relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
          });

          let fueCreado = false;
          let passwordTemporal = '';

          if (!usuario) {
            if (!crearUsuarios) throw new Error(`Ponente "${email}" no encontrado. Activa el registro automático.`);
            
            passwordTemporal = String(fila['password'] || fila['documento_identidad'] || 'Ponente123!').trim();
            const hash = await bcrypt.hash(passwordTemporal, 10);

            usuario = queryRunner.manager.create(Usuario, {
              email,
              password: hash,
              estado: 1,
              requiere_cambio_password: true,
            });
            const usuarioGuardado = await queryRunner.manager.save(usuario);

            const persona = queryRunner.manager.create(Persona, {
              nombres: String(fila['nombres'] || '').trim() || 'Ponente',
              primer_apellido: String(fila['primer_apellido'] || '').trim() || 'Nuevo',
              segundo_apellido: String(fila['segundo_apellido'] || '').trim() || undefined,
              documento_identidad: String(fila['documento_identidad'] || '').trim() || undefined,
              usuario: usuarioGuardado,
            });
            await queryRunner.manager.save(persona);

            const rol = await queryRunner.manager.findOne(Rol, { where: { id: ROL_PONENTE_ID } });
            if (rol) {
              await queryRunner.manager.save(queryRunner.manager.create(UsuarioRol, {
                usuario: usuarioGuardado,
                rol,
                estado: 1,
              }));
            }
            usuario = { ...usuarioGuardado, persona };
            fueCreado = true;
          } else {
            // Validar rol ponente (2)
            const tieneRolPonente = usuario.usuariosRoles?.some(ur => ur.rol?.id === ROL_PONENTE_ID);
            if (!tieneRolPonente) throw new Error(`El usuario existe pero no tiene el rol de "Ponente".`);
          }

          // 2. Actividad
          if (!idEvento) throw new Error('Evento no seleccionado.');
          const cacheKey = `ev_${idEvento}_${nombreActividad.toLowerCase()}`;
          let actividad = actividadCache.get(cacheKey);
          if (actividad === undefined) {
            actividad = await queryRunner.manager.findOne(ActividadAcademica, {
              where: { nombre: ILike(nombreActividad), evento: { id: idEvento } },
              relations: ['evento'],
            });
            actividadCache.set(cacheKey, actividad);
          }

          if (!actividad) throw new Error(`Actividad "${nombreActividad}" no encontrada en el evento.`);

          // 3. Duplicado
          const existente = await queryRunner.manager.findOne(Imparticion, {
            where: { usuario: { id: usuario.id }, actividadAcademica: { id: actividad.id } }
          });

          if (existente) {
            detalle.push({ fila: numFila, email, estado: 'omitido', mensaje: 'Ya está asignado como ponente a esta actividad.' });
            omitidos++;
            await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            continue;
          }

          // 4. Asignar
          const imparticion = queryRunner.manager.create(Imparticion, {
            usuario,
            actividadAcademica: actividad,
            evento: actividad.evento,
          });
          await queryRunner.manager.save(imparticion);

          detalle.push({
            fila: numFila,
            email,
            estado: modo === 'verificar' ? 'omitido' : (fueCreado ? 'creado' : 'asignado'),
            mensaje: modo === 'verificar' ? 'Válido para asignación.' : 'Asignado correctamente.',
          });

          if (fueCreado) creados++;
          asignados++;

        } catch (error) {
          await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          detalle.push({ fila: numFila, email, estado: 'error', mensaje: error.message });
          errores++;
        }
      }

      if (modo === 'verificar' || errores > 0) {
        await queryRunner.rollbackTransaction();
      } else {
        await queryRunner.commitTransaction();
      }
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return { total: filas.length, asignados, creados, omitidos, errores, advertenciasCorreo, detalle };
  }

  generarPlantillaPonentes(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'nombre_actividad_academica', 'nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad'],
      ['ponente_ejemplo@correo.com', 'Taller de IA', 'Maria', 'Gomez', 'Lopez', '87654321'],
    ]);
    ws['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignación de Ponentes');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Utilidades privadas
  // ══════════════════════════════════════════════════════════════════════════

  private parsearExcel(buffer: Buffer): Record<string, any>[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      const primerHoja = workbook.SheetNames[0];
      if (!primerHoja) throw new BadRequestException('El archivo no contiene hojas.');
      const ws = workbook.Sheets[primerHoja];
      return XLSX.utils.sheet_to_json(ws, { defval: '' });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Error al leer el archivo Excel: ${error.message}`);
    }
  }
}
