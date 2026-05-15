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
import { MailService } from '../../Comun/mail/mail.service';

// ─── Tipos de resultado ───────────────────────────────────────────────────────

export interface ResultadoFila {
  fila: number;
  email?: string;
  estado: 'creado' | 'inscrito' | 'omitido' | 'error';
  mensaje: string;
  correoEnviado?: boolean;
  correoAdvertencia?: string;
}

export interface ResultadoImportacion {
  total: number;
  creados?: number;
  inscritos?: number;
  omitidos: number;
  errores: number;
  advertenciasCorreo: number;
  detalle: ResultadoFila[];
}

// ─── Constante de rol por defecto ─────────────────────────────────────────────
const ROL_ESTUDIANTE_ID = 4;

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
      const existe = await this.usuarioRepo.findOne({ where: { email } });
      if (existe) {
        detalle.push({ fila: numFila, email, estado: 'omitido', mensaje: 'El email ya está registrado en el sistema.' });
        omitidos++;
        continue;
      }

      // ── Transacción: crear usuario + persona + afiliacion + rol ───────
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

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
        const persona = queryRunner.manager.create(Persona, {
          nombres: nombres || undefined,
          primer_apellido: primerApellido || undefined,
          segundo_apellido: String(fila['segundo_apellido'] || '').trim() || undefined,
          documento_identidad: String(fila['documento_identidad'] || '').trim() || undefined,
          genero: genero !== null && !isNaN(genero) ? genero : undefined,
          pais_origen: String(fila['pais_origen'] || '').trim() || undefined,
          pais_residencia: String(fila['pais_residencia'] || '').trim() || undefined,
          fecha_nacimiento: String(fila['fecha_nacimiento'] || '').trim() || undefined,
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

        await queryRunner.commitTransaction();
        creados++;

        // ── Notificación por correo ──────────────────────────────────
        let correoEnviado = false;
        let correoAdvertencia: string | undefined;

        if (notificar) {
          const nombreCompleto = `${nombres} ${primerApellido}`.trim() || email;
          try {
            await this.mailService.sendAccountApprovalEmail(email, nombreCompleto, password);
            correoEnviado = true;
          } catch (mailError) {
            correoAdvertencia = mailError.message?.includes('Límite diario')
              ? 'Límite diario de correos alcanzado. No se envió notificación.'
              : `Error de correo: ${mailError.message}`;
            advertenciasCorreo++;
            this.logger.warn(`[EXCEL REGISTRO] Correo no enviado a ${email}: ${mailError.message}`);
          }
        }

        detalle.push({
          fila: numFila,
          email,
          estado: 'creado',
          mensaje: `Usuario creado correctamente${rol ? ` con rol "${rol.nombre_rol}"` : ''}.`,
          correoEnviado,
          correoAdvertencia,
        });
      } catch (error) {
        await queryRunner.rollbackTransaction();
        detalle.push({
          fila: numFila,
          email,
          estado: 'error',
          mensaje: error.message || 'Error desconocido al crear el usuario.',
        });
        errores++;
        this.logger.error(`[EXCEL REGISTRO] Error en fila ${numFila} (${email}): ${error.message}`);
      } finally {
        await queryRunner.release();
      }
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
  ): Promise<ResultadoImportacion> {
    const filas = this.parsearExcel(fileBuffer);

    if (filas.length === 0) {
      throw new BadRequestException(
        'El archivo Excel está vacío o no tiene filas de datos.',
      );
    }

    const detalle: ResultadoFila[] = [];
    let inscritos = 0;
    let omitidos = 0;
    let errores = 0;
    let advertenciasCorreo = 0;

    // Cache de actividades para no re-consultar en cada fila
    const actividadCache = new Map<string, ActividadAcademica | null>();

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

      if (!nombreActividad) {
        detalle.push({ fila: numFila, email, estado: 'error', mensaje: 'nombre_actividad_academica vacío.' });
        errores++;
        continue;
      }

      // ── Buscar usuario ───────────────────────────────────────────────
      const usuario = await this.usuarioRepo.findOne({
        where: { email },
        relations: ['persona'],
      });
      if (!usuario) {
        detalle.push({ fila: numFila, email, estado: 'error', mensaje: 'Usuario no encontrado en el sistema.' });
        errores++;
        continue;
      }

      // ── Buscar actividad académica (con cache) ───────────────────────
      const cacheKey = nombreActividad.toLowerCase();
      let actividad: ActividadAcademica | null | undefined;

      if (actividadCache.has(cacheKey)) {
        actividad = actividadCache.get(cacheKey);
      } else {
        actividad = await this.actividadRepo.findOne({
          where: { nombre: ILike(nombreActividad) },
          relations: ['evento'],
        });
        actividadCache.set(cacheKey, actividad);
      }

      if (!actividad) {
        detalle.push({
          fila: numFila,
          email,
          estado: 'error',
          mensaje: `Actividad académica "${nombreActividad}" no encontrada.`,
        });
        errores++;
        continue;
      }

      // ── Verificar si ya está inscrito ────────────────────────────────
      const inscripcionExistente = await this.inscripcionRepo.findOne({
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
          mensaje: `Ya tiene una inscripción en "${actividad.nombre}".`,
        });
        omitidos++;
        continue;
      }

      // ── Crear inscripción ────────────────────────────────────────────
      try {
        const inscripcion = this.inscripcionRepo.create({
          usuario,
          actividadAcademica: actividad,
          estado: 1,
          miembro_tyan: 0,
        });
        await this.inscripcionRepo.save(inscripcion);
        inscritos++;

        // ── Notificación por correo ──────────────────────────────────
        let correoEnviado = false;
        let correoAdvertencia: string | undefined;

        if (notificar) {
          const nombre = usuario.persona
            ? `${usuario.persona.nombres || ''} ${usuario.persona.primer_apellido || ''}`.trim()
            : email;
          const eventoNombre = actividad['evento']?.nombre || 'Evento';
          try {
            await this.mailService.sendEnrollmentConfirmedEmail(
              email,
              nombre || email,
              actividad.nombre,
              eventoNombre,
            );
            correoEnviado = true;
          } catch (mailError) {
            correoAdvertencia = mailError.message?.includes('Límite diario')
              ? 'Límite diario de correos alcanzado. No se envió notificación.'
              : `Error de correo: ${mailError.message}`;
            advertenciasCorreo++;
            this.logger.warn(`[EXCEL INSCRIPCION] Correo no enviado a ${email}: ${mailError.message}`);
          }
        }

        detalle.push({
          fila: numFila,
          email,
          estado: 'inscrito',
          mensaje: `Inscrito correctamente en "${actividad.nombre}".`,
          correoEnviado,
          correoAdvertencia,
        });
      } catch (error) {
        detalle.push({
          fila: numFila,
          email,
          estado: 'error',
          mensaje: error.message || 'Error desconocido al crear la inscripción.',
        });
        errores++;
        this.logger.error(`[EXCEL INSCRIPCION] Error en fila ${numFila}: ${error.message}`);
      }
    }

    return {
      total: filas.length,
      inscritos,
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
      ['email', 'nombre_actividad_academica'],
      ['estudiante@correo.com', 'Taller de Machine Learning'],
      ['otro@correo.com', 'Curso de Bioinformática'],
    ]);
    ws['!cols'] = [{ wch: 35 }, { wch: 45 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripción Masiva');
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
