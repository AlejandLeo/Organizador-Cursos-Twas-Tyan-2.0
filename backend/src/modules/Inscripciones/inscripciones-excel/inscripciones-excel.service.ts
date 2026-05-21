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
import { MailService } from '../../Comun/mail/mail.service';
import { MailTemplateService } from '../../Comun/mail/mail-template.service';
import { MailQueueService } from '../../Comun/mail/mail-queue.service';

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
    private readonly mailTemplateService: MailTemplateService,
    private readonly mailQueueService: MailQueueService,
  ) { }

  // ══════════════════════════════════════════════════════════════════════════
  //  ESCENARIO 1 — Registro masivo de usuarios desde Excel
  // ══════════════════════════════════════════════════════════════════════════

  async registroMasivoUsuarios(
    fileBuffer: Buffer,
    notificar = false,
    modo: 'verificar' | 'guardar' = 'guardar',
    templateId?: number
  ): Promise<ResultadoImportacion> {
    const filas = this.parsearExcel(fileBuffer);

    if (filas.length === 0) {
      throw new BadRequestException('El archivo Excel está vacío o no tiene filas de datos.');
    }

    const detalle: ResultadoFila[] = [];
    let creados = 0;
    let omitidos = 0;
    let errores = 0;
    let advertenciasCorreo = 0;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i];
        const numFila = i + 2;
        const email = String(fila['email'] || '').trim().toLowerCase();

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

        const existe = await queryRunner.manager.findOne(Usuario, { where: { email } });
        if (existe) {
          detalle.push({ fila: numFila, email, estado: 'error', mensaje: 'El correo electrónico ya está registrado. Elimina esta fila si no deseas crear una cuenta nueva.' });
          errores++;
          continue;
        }

        const savepointName = `row_${i}`;
        await queryRunner.query(`SAVEPOINT ${savepointName}`);

        try {
          const hash = await bcrypt.hash(password, 10);
          const usuario = queryRunner.manager.create(Usuario, {
            email,
            password: hash,
            estado: 1,
            requiere_cambio_password: true,
          });
          const usuarioGuardado = await queryRunner.manager.save(usuario);

          const nombres = String(fila['nombres'] || '').trim();
          const primerApellido = String(fila['primer_apellido'] || '').trim();

          const persona = queryRunner.manager.create(Persona, {
            nombres: nombres || undefined,
            primer_apellido: primerApellido || undefined,
            segundo_apellido: String(fila['segundo_apellido'] || '').trim() || undefined,
            documento_identidad: String(fila['documento_identidad'] || '').trim() || undefined,
            celular: String(fila['celular'] || '').trim() || undefined,
            grado_academico: String(fila['grado_academico'] || fila['grado'] || '').trim() || undefined,
            usuario: usuarioGuardado,
          });
          await queryRunner.manager.save(persona);

          const idRolRaw = fila['id_rol'];
          const rolId = idRolRaw ? Number(idRolRaw) : ROL_ESTUDIANTE_ID;
          const rol = await queryRunner.manager.findOne(Rol, { where: { id: rolId } });
          if (rol) {
            await queryRunner.manager.save(queryRunner.manager.create(UsuarioRol, {
              usuario: usuarioGuardado,
              rol,
              estado: 1,
            }));
          }

          let correoEnviado = false;
          let correoAdvertencia: string | undefined;

          if (notificar && modo === 'guardar') {
            const nombre = nombres || 'Usuario';
            const apellidos = primerApellido || '';
            try {
              await this.mailQueueService.renderAndEnqueue(
                email,
                { nombre, apellidos, email, password },
                templateId,
                'WELCOME'
              );
              correoEnviado = true;
            } catch (mailError) {
              correoAdvertencia = `Error de encolado: ${mailError.message}`;
              advertenciasCorreo++;
            }
          }

          detalle.push({
            fila: numFila,
            email,
            estado: modo === 'verificar' ? 'omitido' : 'creado',
            mensaje: modo === 'verificar' ? 'Válido para ser creado.' : `Usuario creado correctamente.`,
            correoEnviado,
            correoAdvertencia,
          });
          creados++;
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

    return { total: filas.length, creados, omitidos, errores, advertenciasCorreo, detalle };
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
    crearUsuarios = false,
    templateId?: number
  ): Promise<ResultadoImportacion> {
    const filas = this.parsearExcel(fileBuffer);
    if (filas.length === 0) throw new BadRequestException('El archivo Excel está vacío.');

    const detalle: ResultadoFila[] = [];
    let inscritos = 0;
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

        if (!email) {
          detalle.push({ fila: numFila, estado: 'error', mensaje: 'Email vacío.' });
          errores++;
          continue;
        }

        const savepointName = `row_insc_${i}`;
        await queryRunner.query(`SAVEPOINT ${savepointName}`);

        try {
          let usuario = await queryRunner.manager.findOne(Usuario, {
            where: { email },
            relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
          });

          let fueCreado = false;
          let passwordTemporal = '';

          if (!usuario) {
            if (!crearUsuarios) throw new Error(`Usuario "${email}" no encontrado. Activa "Registrar usuarios nuevos".`);

            passwordTemporal = String(fila['password'] || fila['documento_identidad'] || 'Usuario123!').trim();
            const hash = await bcrypt.hash(passwordTemporal, 10);
            usuario = queryRunner.manager.create(Usuario, { email, password: hash, estado: 1, requiere_cambio_password: true });
            const userSaved = await queryRunner.manager.save(usuario);

            const persona = queryRunner.manager.create(Persona, {
              nombres: String(fila['nombres'] || '').trim() || 'Estudiante',
              primer_apellido: String(fila['primer_apellido'] || '').trim() || 'Nuevo',
              segundo_apellido: String(fila['segundo_apellido'] || '').trim() || undefined,
              documento_identidad: String(fila['documento_identidad'] || '').trim() || undefined,
              grado_academico: String(fila['grado_academico'] || fila['grado'] || '').trim() || undefined,
              usuario: userSaved,
            });
            await queryRunner.manager.save(persona);

            const rol = await queryRunner.manager.findOne(Rol, { where: { id: ROL_ESTUDIANTE_ID } });
            if (rol) await queryRunner.manager.save(queryRunner.manager.create(UsuarioRol, { usuario: userSaved, rol, estado: 1 }));
            usuario = { ...userSaved, persona };
            fueCreado = true;
          } else {
            const excelGrado = String(fila['grado_academico'] || fila['grado'] || '').trim();
            if (excelGrado && usuario.persona && !usuario.persona.grado_academico) {
              usuario.persona.grado_academico = excelGrado;
              await queryRunner.manager.save(usuario.persona);
            }
          }

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

          if (!actividad) throw new Error(`Actividad "${nombreActividad}" no encontrada.`);

          const inscripcionExistente = await queryRunner.manager.findOne(Inscripcion, {
            where: { usuario: { id: usuario.id }, actividadAcademica: { id: actividad.id } },
          });

          if (inscripcionExistente) {
            detalle.push({ fila: numFila, email, estado: 'omitido', mensaje: `Ya inscrito en "${actividad.nombre}".` });
            omitidos++;
            await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            continue;
          }

          await queryRunner.manager.save(queryRunner.manager.create(Inscripcion, { usuario, actividadAcademica: actividad, estado: 1, miembro_tyan: 0 }));

          let correoEnviado = false;
          let correoAdvertencia: string | undefined;

          if (notificar && modo === 'guardar') {
            const nombre = usuario.persona?.nombres || 'Usuario';
            const apellidos = usuario.persona?.primer_apellido || '';
            try {
              if (templateId) {
                await this.mailQueueService.renderAndEnqueue(email, { nombre, apellidos, email, password: passwordTemporal, actividad: actividad.nombre, evento: actividad.evento?.nombre }, templateId);
              } else if (fueCreado) {
                await this.mailQueueService.renderAndEnqueue(email, { nombre, apellidos, email, password: passwordTemporal }, undefined, 'WELCOME');
              } else {
                await this.mailQueueService.renderAndEnqueue(email, { nombre, apellidos, actividad: actividad.nombre, evento: actividad.evento?.nombre }, undefined, 'GENERAL');
              }
              correoEnviado = true;
            } catch (mailError) {
              correoAdvertencia = `Error encolando: ${mailError.message}`;
              advertenciasCorreo++;
            }
          }

          detalle.push({
            fila: numFila,
            email,
            estado: modo === 'verificar' ? 'omitido' : (fueCreado ? 'creado' : 'inscrito'),
            mensaje: modo === 'verificar' ? 'Válido.' : 'Procesado correctamente.',
            correoEnviado,
            correoAdvertencia,
          });
          if (fueCreado) creados++;
          inscritos++;
        } catch (error) {
          await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          detalle.push({ fila: numFila, email, estado: 'error', mensaje: error.message });
          errores++;
        }
      }

      if (modo === 'verificar' || errores > 0) await queryRunner.rollbackTransaction();
      else await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }

    return { total: filas.length, inscritos, creados, omitidos, errores, advertenciasCorreo, detalle };
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
            usuario = queryRunner.manager.create(Usuario, { email, password: hash, estado: 1, requiere_cambio_password: true });
            const userSaved = await queryRunner.manager.save(usuario);
            const persona = queryRunner.manager.create(Persona, {
              nombres: String(fila['nombres'] || '').trim() || 'Ponente',
              primer_apellido: String(fila['primer_apellido'] || '').trim() || 'Nuevo',
              segundo_apellido: String(fila['segundo_apellido'] || '').trim() || undefined,
              documento_identidad: String(fila['documento_identidad'] || '').trim() || undefined,
              grado_academico: String(fila['grado_academico'] || fila['grado'] || '').trim() || undefined,
              usuario: userSaved,
            });
            await queryRunner.manager.save(persona);
            const rol = await queryRunner.manager.findOne(Rol, { where: { id: ROL_PONENTE_ID } });
            if (rol) await queryRunner.manager.save(queryRunner.manager.create(UsuarioRol, { usuario: userSaved, rol, estado: 1 }));
            usuario = { ...userSaved, persona };
            fueCreado = true;
          } else {
            const excelGrado = String(fila['grado_academico'] || fila['grado'] || '').trim();
            if (excelGrado && usuario.persona && !usuario.persona.grado_academico) {
              usuario.persona.grado_academico = excelGrado;
              await queryRunner.manager.save(usuario.persona);
            }
          }

          if (!idEvento) throw new Error('Evento no seleccionado.');
          const cacheKey = `ev_${idEvento}_${nombreActividad.toLowerCase()}`;
          let actividad = actividadCache.get(cacheKey);
          if (actividad === undefined) {
            actividad = await queryRunner.manager.findOne(ActividadAcademica, { where: { nombre: ILike(nombreActividad), evento: { id: idEvento } }, relations: ['evento'] });
            actividadCache.set(cacheKey, actividad);
          }

          if (!actividad) throw new Error(`Actividad "${nombreActividad}" no encontrada.`);

          const existente = await queryRunner.manager.findOne(Imparticion, { where: { usuario: { id: usuario.id }, actividadAcademica: { id: actividad.id } } });
          if (existente) {
            detalle.push({ fila: numFila, email, estado: 'omitido', mensaje: 'Ya asignado.' });
            omitidos++;
            await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            continue;
          }

          await queryRunner.manager.save(queryRunner.manager.create(Imparticion, { usuario, actividadAcademica: actividad, evento: actividad.evento }));
          detalle.push({ fila: numFila, email, estado: modo === 'verificar' ? 'omitido' : (fueCreado ? 'creado' : 'asignado'), mensaje: 'Procesado.' });
          if (fueCreado) creados++;
          asignados++;
        } catch (error) {
          await queryRunner.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
          detalle.push({ fila: numFila, email, estado: 'error', mensaje: error.message });
          errores++;
        }
      }
      if (modo === 'verificar' || errores > 0) await queryRunner.rollbackTransaction();
      else await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
    return { total: filas.length, asignados, creados, omitidos, errores, advertenciasCorreo, detalle };
  }

  generarPlantillaUsuarios(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'password', 'nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'celular', 'grado_academico'],
      ['ejemplo@correo.com', 'Clave1234', 'Ana', 'Lopez', '', '1234567', '70000000', 'Lic.']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  generarPlantillaInscripciones(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'nombre_actividad_academica', 'nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'grado_academico'],
      ['ejemplo@correo.com', 'Nombre del Curso', 'Ana', 'Lopez', '', '1234567', 'Lic.']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripción');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  generarPlantillaPonentes(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([
      ['email', 'nombre_actividad_academica', 'nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'grado_academico'],
      ['ejemplo@correo.com', 'Nombre del Curso', 'Ana', 'Lopez', '', '1234567', 'Lic.']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignación');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  private parsearExcel(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const primerHoja = workbook.SheetNames[0];
    const ws = workbook.Sheets[primerHoja];
    return XLSX.utils.sheet_to_json(ws, { defval: '' });
  }
}
