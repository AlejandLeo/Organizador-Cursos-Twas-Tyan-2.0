import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { Persona } from '../../Usuario/personas/entities/persona.entity';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { CrearPonenteDto } from './dto/crear-ponente.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { SolicitudRegistroDto } from './dto/solicitud-registro.dto';

// Entidades adicionales para registro y roles
import { Rol } from '../../Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../Usuario/usuarios-roles/entities/usuario-rol.entity';
import { Afiliacion } from '../../Usuario/afiliaciones/entities/afiliacion.entity';
import { RoleId } from './constants/user-roles.constants';
import * as fs from 'fs';
import { join } from 'path';
import { MailService } from '../../Comun/mail/mail.service';
import { QrService } from '../../Seguridad/qr/qr.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly qrService: QrService,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  CRUD BÁSICO
  // ══════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════
  // PERFIL
  // ══════════════════════════════════════════════════════════

  async actualizarPerfil(
    id_usuario: number,
    data: any,
  ) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id_usuario },
      relations: ['persona', 'afiliaciones'],
    });

    if (!usuario || !usuario.persona) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Bloqueo inteligente: si ya está completado, solo permitiremos actualizar campos que estén vacíos
    const isCompleted = usuario.persona.perfil_completado;

    // 1. Filtrar campos específicos para la entidad Persona
    const camposPersonaValidos = [
      'nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 
      'genero', 'pais_origen', 'pais_residencia', 'fecha_nacimiento', 'celular'
    ];
    
    const datosPersona: any = {};
    camposPersonaValidos.forEach(key => {
      if (data[key] !== undefined) {
        // Bloqueo: si ya está completado y el campo ya tiene valor, no dejamos editar
        if (isCompleted && (usuario.persona as any)[key]) return;

        // Manejo especial para género si viene como string
        if (key === 'genero' && typeof data[key] === 'string') {
           const g = data[key];
           if (g.startsWith('Mas')) datosPersona.genero = 0;
           else if (g.startsWith('Fem')) datosPersona.genero = 1;
           else datosPersona.genero = 2;
        } else {
          datosPersona[key] = data[key];
        }
      }
    });

    if (Object.keys(datosPersona).length > 0) {
      await this.personaRepository.update(usuario.persona.id, datosPersona);
    }

    // 2. Extraer campos para Afiliación
    const institucion = data.institucion || data.afiliacion;
    const { id_grado_academico, tipo_afiliacion, area_tematica, disciplina_cientifica } = data;

    if (
      institucion !== undefined || 
      id_grado_academico !== undefined || 
      tipo_afiliacion !== undefined || 
      area_tematica !== undefined || 
      disciplina_cientifica !== undefined
    ) {
      const afiliacionRepo = this.dataSource.getRepository(Afiliacion);
      let af = usuario.afiliaciones && usuario.afiliaciones.length > 0 
        ? usuario.afiliaciones[0] 
        : null;

      if (af) {
        if (institucion !== undefined) {
          // Bloqueo: si ya está completado y ya tiene institución, ignoramos
          if (!(isCompleted && af.institucion)) af.institucion = institucion;
        }
        if (id_grado_academico !== undefined) {
           if (!(isCompleted && af.id_grado_academico)) af.id_grado_academico = id_grado_academico;
        }
        if (tipo_afiliacion !== undefined) af.tipo_afiliacion = tipo_afiliacion;
        if (area_tematica !== undefined) af.area_tematica = area_tematica;
        if (disciplina_cientifica !== undefined) af.disciplina_cientifica = disciplina_cientifica;
        await afiliacionRepo.save(af);
      } else {
        const newAf = afiliacionRepo.create({
          institucion: institucion || '',
          id_grado_academico,
          tipo_afiliacion,
          area_tematica,
          disciplina_cientifica,
          usuario: usuario,
        });
        await afiliacionRepo.save(newAf);
      }
    }

    // 3. Finalización del perfil
    if (data.finalizar) {
      // Recargar para tener datos actualizados
      const perfilActualizado = await this.getPerfil(id_usuario);
      const p = perfilActualizado.persona;
      const af = (perfilActualizado as any).afiliaciones?.[0];

      if (!p.nombres || !p.primer_apellido || !p.documento_identidad || !p.celular || !af?.institucion) {
        throw new BadRequestException('Debe completar todos los campos obligatorios antes de finalizar.');
      }
      
      await this.personaRepository.update(p.id, { perfil_completado: true });
    }

    return this.getPerfil(id_usuario);
  }

  /**
   * Permite a un administrador o coordinador actualizar los datos de CUALQUIER usuario.
   */
  async actualizarDatosAdmin(id_usuario: number, data: any) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id_usuario },
      relations: ['persona', 'afiliaciones'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario ${id_usuario} no encontrado`);
    }

    // 1. Actualizar Email
    if (data.email && data.email !== usuario.email) {
      usuario.email = data.email;
      await this.usuarioRepository.save(usuario);
    }

    // 2. Extraer datos específicos
    const { institucion, id_grado_academico, especialidad, ...datosPersonaOriginal } = data;

    // 3. Procesar Persona (Sanitización y Mapeo)
    if (usuario.persona) {
      const datosPersona: any = {};
      
      // Mapeo seguro de campos existentes en Persona
      const camposSeguros = ['nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'celular', 'pais_origen', 'pais_residencia'];
      camposSeguros.forEach(c => {
        if (datosPersonaOriginal[c] !== undefined) datosPersona[c] = datosPersonaOriginal[c];
      });

      // Mapeo de Género (Texto -> Número)
      if (datosPersonaOriginal.genero !== undefined) {
        const g = datosPersonaOriginal.genero;
        if (typeof g === 'string') {
          if (g.startsWith('Mas')) datosPersona.genero = 0;
          else if (g.startsWith('Fem')) datosPersona.genero = 1;
          else datosPersona.genero = 2;
        } else {
          datosPersona.genero = g;
        }
      }

      // Manejo de Fecha Nacimiento
      if (datosPersonaOriginal.fecha_nacimiento === '' || datosPersonaOriginal.fecha_nacimiento === null) {
        datosPersona.fecha_nacimiento = null;
      } else if (datosPersonaOriginal.fecha_nacimiento) {
        datosPersona.fecha_nacimiento = datosPersonaOriginal.fecha_nacimiento;
      }

      await this.personaRepository.update(usuario.persona.id, datosPersona);
    }

    // 4. Actualizar Afiliación (Incluyendo especialidad/disciplina)
    if (institucion !== undefined || id_grado_academico !== undefined || especialidad !== undefined) {
      const afRepo = this.dataSource.getRepository(Afiliacion);
      let af = usuario.afiliaciones?.[0];
      
      if (!af) {
        af = afRepo.create({ usuario: usuario });
      }

      if (institucion !== undefined) af.institucion = institucion;
      if (id_grado_academico !== undefined) af.id_grado_academico = id_grado_academico;
      if (especialidad !== undefined) af.disciplina_cientifica = especialidad;

      await afRepo.save(af);
    }

    return this.getPerfil(id_usuario);
  }

  /**
   * Crea un usuario simple (solo credenciales).
   * La contraseña se hashea antes de guardarse. Nunca se guarda en texto plano.
   */
  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const existe = await this.usuarioRepository.findOneBy({
      email: createUsuarioDto.email,
    });
    if (existe) {
      throw new ConflictException(
        `El email '${createUsuarioDto.email}' ya está registrado.`,
      );
    }

    const hash = await bcrypt.hash(createUsuarioDto.password, 10);
    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      password: hash,
    });
    return this.usuarioRepository.save(usuario);
  }

  /**
   * Lista los usuarios ACTIVOS (estado = 1) con su perfil de persona y roles.
   * La contraseña nunca se incluye en la respuesta.
   *
   * @param soloActivos  Si es true (por defecto) filtra por estado = 1.
   *                     Pasar false para administración interna.
   */
  findAll(soloActivos = true): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      where: soloActivos ? { estado: 1 } : undefined,
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
      select: {
        id: true,
        email: true,
        estado: true,
        fecha_creacion: true,
        fecha_actualizacion: true,
        // password nunca se devuelve en listados
      },
    });
  }

  /**
   * Busca un usuario por ID. Incluye persona y sus roles con join.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id },
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }
    return usuario;
  }

  /**
   * Actualiza email y/o estado. Si se cambia el password aquí, también se hashea.
   */
  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    if (updateUsuarioDto.email && updateUsuarioDto.email !== usuario.email) {
      const existe = await this.usuarioRepository.findOneBy({
        email: updateUsuarioDto.email,
      });
      if (existe) {
        throw new ConflictException(
          `El email '${updateUsuarioDto.email}' ya está en uso.`,
        );
      }
    }

    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(
        updateUsuarioDto.password,
        10,
      );
    }

    await this.usuarioRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  /**
   * Elimina un usuario (y su persona por CASCADE definida en la entidad).
   */
  async remove(id: number): Promise<{ mensaje: string }> {
    await this.findOne(id); // valida existencia
    await this.usuarioRepository.delete(id);
    return { mensaje: `Usuario ${id} eliminado correctamente.` };
  }

  /**
   * Deshabilita un usuario (estado = 0) en lugar de eliminarlo físicamente.
   * Uso del coordinador para suspender accesos sin perder historias.
   */
  async deshabilitarUsuario(id: number): Promise<{ mensaje: string }> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.update(id, { estado: 0 });
    
    // Opcional: Notificar por correo
    const nombreCompleto = usuario.persona 
      ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}` 
      : 'Usuario';
    
    await this.mailService.sendAccountRejectionEmail(
      usuario.email,
      nombreCompleto,
      'Tu cuenta ha sido deshabilitada por administración.'
    );
    
    return { mensaje: `Usuario ${id} deshabilitado correctamente.` };
  }

  /**
   * Habilita un usuario (estado = 1).
   * Uso del coordinador para reactivar accesos sin cambiar contraseñas.
   */
  async habilitarUsuario(id: number): Promise<{ mensaje: string }> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.update(id, { estado: 1 });
    
    const nombreCompleto = usuario.persona 
      ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}` 
      : 'Usuario';
    
    await this.mailService.sendAccountReactivationEmail(usuario.email, nombreCompleto);
    
    return { mensaje: `Usuario ${id} habilitado correctamente.` };
  }

  // ══════════════════════════════════════════════════════════
  //  BÚSQUEDA Y FILTRADO (para el panel del Coordinador)
  // ══════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════
  //  BÚSQUEDA Y FILTRADO (para el panel del Coordinador)
  // ══════════════════════════════════════════════════════════

  /**
   * Lista usuarios con filtros: por rol, búsqueda libre y paginación.
   * Nunca devuelve el campo password.
   */
  async findConFiltros(
    filtros: FiltrarUsuariosDto,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { rol, q, page = 1, limit = 20, soloActivos } = filtros;
    const soloActivosBool = soloActivos !== 'false';

    const qb = this.usuarioRepository.createQueryBuilder('u')
      .leftJoinAndSelect('u.persona', 'p')
      .leftJoinAndSelect('u.usuariosRoles', 'ur')
      .leftJoinAndSelect('ur.rol', 'r')
      .leftJoinAndSelect('u.afiliaciones', 'af')
      .leftJoinAndSelect('af.gradoAcademico', 'ga')
      .leftJoinAndSelect('u.inscripciones', 'ins')
      .leftJoinAndSelect('ins.actividadAcademica', 'act')
      .leftJoinAndSelect('act.evento', 'ev')
      .leftJoinAndSelect('u.imparticiones', 'imp')
      .leftJoinAndSelect('imp.actividadAcademica', 'act_imp')
      .leftJoinAndSelect('act_imp.evento', 'ev_imp');

    if (soloActivosBool) {
      qb.where('u.estado = :estado', { estado: 1 });
    }

    if (rol) {
      qb.andWhere('LOWER(r.nombre_rol) = LOWER(:rol)', { rol });
    }

    if (q) {
      qb.andWhere(
        '(LOWER(p.nombres) ILIKE :q OR LOWER(p.primer_apellido) ILIKE :q OR LOWER(u.email) ILIKE :q)',
        { q: `%${q.toLowerCase()}%` },
      );
    }

    const total = await qb.getCount();

    qb.skip((page - 1) * limit).take(limit);

    const data = await qb.getMany();

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  // ══════════════════════════════════════════════════════════
  //  CREACIÓN DIRECTA DE PONENTE (por el Coordinador)
  // ══════════════════════════════════════════════════════════

  /**
   * Crea un usuario tipo Ponente: credenciales + persona + rol Ponente.
   * Se ejecuta dentro de una transacción.
   */
  async crearPonente(dto: CrearPonenteDto): Promise<Omit<Usuario, 'password'>> {
    const existe = await this.usuarioRepository.findOneBy({ email: dto.email });
    if (existe) {
      throw new ConflictException(
        `El email '${dto.email}' ya está registrado.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hash = await bcrypt.hash(dto.password, 10);

      const usuario = queryRunner.manager.create(Usuario, {
        email: dto.email,
        password: hash,
        estado: 1,
      });
      const usuarioGuardado = await queryRunner.manager.save(usuario);

      const { email, password, id_grado_academico, id_rol, ...datosPersona } = dto;
      const persona = queryRunner.manager.create(Persona, {
        ...datosPersona,
        usuario: usuarioGuardado,
      });
      await queryRunner.manager.save(persona);

      // 4️⃣ Crear Afiliación Inicial si se especificó grado académico
      if (id_grado_academico) {
        const afiliacion = queryRunner.manager.create(Afiliacion, {
          id_grado_academico,
          usuario: usuarioGuardado,
          institucion: 'UMSA', // Valor por defecto para agilizar registro
          estado: 1,
        });
        await queryRunner.manager.save(afiliacion);
      }

      // 5️⃣ Asignar Rol
      const rolId = id_rol || RoleId.PONENTE;
      const rolSeleccionado = await queryRunner.manager.findOne(Rol, {
        where: { id: rolId },
      });

      if (rolSeleccionado) {
        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol: rolSeleccionado,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
      }

      // Marcar que requiere cambio de password al ser creado por admin
      await queryRunner.manager.update(Usuario, usuarioGuardado.id, { requiere_cambio_password: true });

      await queryRunner.commitTransaction();

      // Enviar correo de bienvenida al ponente
      try {
        const nombreCompleto = `${dto.nombres} ${dto.primer_apellido}`;
        await this.mailService.sendAccountApprovalEmail(dto.email, nombreCompleto, dto.password);
      } catch (e) {
        console.error('Error enviando correo a ponente:', e);
      }

      return this.getPerfil(usuarioGuardado.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  // ══════════════════════════════════════════════════════════
  //  AUTH
  // ══════════════════════════════════════════════════════════

  /**
   * Login: verifica credenciales y devuelve el usuario sin password.
   *
   * NOTA para producción: aquí deberías generar y devolver un JWT.
   * Por ahora devolvemos el usuario como confirmación de login exitoso.
   */
  async login(loginDto: LoginDto): Promise<any> {
    try {
      // Buscamos por email
      const usuario = await this.usuarioRepository.findOne({
        where: { email: loginDto.email },
        relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
      });

      if (!usuario) {
        throw new UnauthorizedException('Credenciales incorrectas.');
      }

      if (usuario.estado === 0) {
        throw new UnauthorizedException('Tu cuenta está inactiva. Contacta al administrador.');
      }

      if (usuario.estado === 2) {
        throw new UnauthorizedException('Tu solicitud de registro está pendiente de aprobación.');
      }

      let contextoRol = '';
      
<<<<<<< HEAD
      // Lógica de Validación Priorizada:
      // Si el DTO indica un portal (ej: 'Ponente'), intentamos validar esa clave PRIMERO.
      
      if (loginDto.portal === 'Ponente' && usuario.password_ponente && usuario.password_ponente.length > 10) {
        const passPonenteValido = await bcrypt.compare(loginDto.password, usuario.password_ponente);
        if (passPonenteValido) {
          contextoRol = 'Ponente';
        }
      }

      // Si no se validó arriba (porque no era ponente o la clave no coincidió), probamos la principal
      if (!contextoRol) {
        const passPrincipalValida = usuario.password 
          ? await bcrypt.compare(loginDto.password, usuario.password)
          : false;
        
        if (passPrincipalValida) {
          contextoRol = 'Estudiante';

          const esCoordinador = usuario.usuariosRoles?.some((ur: any) => 
            ur.rol?.id === 2 || ur.rol?.nombre_rol === 'Coordinador'
          );
          if (esCoordinador) contextoRol = 'Coordinador';

          const esAdmin = usuario.usuariosRoles?.some((ur: any) => 
            ur.rol?.id === 1 || ur.rol?.nombre_rol === 'Super Usuario'
          );
          if (esAdmin) contextoRol = 'Admin';
        }
      }

      // Fallback final: si aún no tenemos rol y no probamos la de ponente antes, probarla ahora
      if (!contextoRol && loginDto.portal !== 'Ponente' && usuario.password_ponente && usuario.password_ponente.length > 10) {
        const passPonenteValido = await bcrypt.compare(loginDto.password, usuario.password_ponente);
        if (passPonenteValido) {
          contextoRol = 'Ponente';
=======
      // 1. Intentar validar con la contraseña principal (Estudiante / Admin)
      // Nota: password siempre debe existir en la BD.
      const passEstudianteValido = usuario.password 
        ? await bcrypt.compare(loginDto.password, usuario.password)
        : false;
      
      if (passEstudianteValido) {
        contextoRol = 'Estudiante';
        const esAdmin = usuario.usuariosRoles?.some((ur: any) => 
          ur.rol?.id === 1 || ur.rol?.nombre_rol === 'Super Usuario'
        );
        if (esAdmin) contextoRol = 'Admin';
      } else {
        // 2. Intentar validar con la contraseña de ponente (si existe y está configurado)
        if (usuario.password_ponente && usuario.password_ponente.length > 10) {
          try {
            const passPonenteValido = await bcrypt.compare(loginDto.password, usuario.password_ponente);
            if (passPonenteValido) {
              contextoRol = 'Ponente';
            }
          } catch (e) {
            console.error('[AUTH ERROR] Error comparando password_ponente:', e.message);
          }
>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
        }
      }

      if (!contextoRol) {
        throw new UnauthorizedException('Credenciales incorrectas.');
      }

      // Eliminamos passwords antes de devolver
      const { password, password_ponente, ...usuarioSinPassword } = usuario;
      
      console.log(`[AUTH] Acceso exitoso: ${usuario.email} -> Portal: ${contextoRol}`);
      
      return {
        ...usuarioSinPassword,
        rolSugerido: contextoRol
      };
    } catch (error) {
      // Si es un error de credenciales, no lo tratamos como "Crash" para no ensuciar los logs
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[AUTH CRASH] Error crítico en el servidor:', error);
      throw error;
    }
  }

  /**
   * Cambia la contraseña de un usuario verificando la contraseña actual.
   */
  async changePassword(
    id: number,
    dto: ChangePasswordDto,
  ): Promise<{ mensaje: string }> {
    // Para comparar el hash necesitamos traer la contraseña
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id },
      select: ['id', 'password'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    const actual_valida = await bcrypt.compare(
      dto.password_actual,
      usuario.password,
    );
    if (!actual_valida) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }

    const nuevaHash = await bcrypt.hash(dto.password_nuevo, 10);
    await this.usuarioRepository.update(id, { 
      password: nuevaHash,
      requiere_cambio_password: false 
    });

    return { mensaje: 'Contraseña actualizada correctamente.' };
  }

  /**
   * Cambia la contraseña de un usuario SIN verificar la contraseña actual.
   * Exclusivo para el flujo de recuperación por token (forgot-password).
   * La nueva contraseña se hashea con bcrypt antes de persistir.
   */
  async forzarCambioPassword(
    id: number,
    nuevaPassword: string,
    tipo: 'principal' | 'ponente' = 'principal',
  ): Promise<{ mensaje: string }> {
    const hash = await bcrypt.hash(nuevaPassword, 10);
<<<<<<< HEAD
=======

>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
    if (tipo === 'ponente') {
      await this.usuarioRepository.update(id, { password_ponente: hash });
    } else {
      await this.usuarioRepository.update(id, { password: hash });
    }
    return { mensaje: `Contraseña ${tipo} actualizada correctamente.` };
  }

  async habilitarEdicion(id: number) {
    const usuario = await this.findOne(id);
    if (!usuario.persona) throw new NotFoundException('El usuario no tiene un perfil vinculado');
    
    // Desbloqueamos el perfil
    await this.personaRepository.update(usuario.persona.id, { perfil_completado: false });
    return { mensaje: 'Edición habilitada correctamente' };
  }

  async findByEmail(email: string) {
    return await this.usuarioRepository.findOne({
      where: { email },
      relations: ['persona']
<<<<<<< HEAD
=======
    });
    await this.usuarioRepository.update(id, { 
      password: hash,
      requiere_cambio_password: false 
>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
    });
  }

  // ══════════════════════════════════════════════════════════
  //  REGISTRO COMPLETO (Usuario + Persona + Rol + Afiliación)
  // ══════════════════════════════════════════════════════════

  /**
   * Registro unificado: crea un usuario, su perfil de persona,
   * le asigna el rol de Estudiante (ID 4) y opcionalmente su primera afiliación.
   */
  async register(dto: RegisterDto): Promise<Omit<Usuario, 'password'>> {
    const existe = await this.usuarioRepository.findOneBy({ email: dto.email });
    if (existe) {
      throw new ConflictException(
        'El correo electrónico seleccionado ya fue registrado o solicitado previamente.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1️⃣ Hashear contraseña
      const hash = await bcrypt.hash(dto.password, 10);

      // 2️⃣ Crear usuario
      const usuario = queryRunner.manager.create(Usuario, {
        email: dto.email,
        password: hash,
        estado: 1,
      });
      const usuarioGuardado = await queryRunner.manager.save(usuario);

      // 3️⃣ Crear persona vinculada

      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        email,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        password,
        institucion,
        tipo_afiliacion,
        area_tematica,
        disciplina_cientifica,
        id_grado_academico,
        id_rol,
        ...datoPersona
      } = dto;

      const persona = queryRunner.manager.create(Persona, {
        ...datoPersona,
        usuario: usuarioGuardado,
      });
      await queryRunner.manager.save(persona);

      // 4️⃣ Asignar Rol solicitado o Estudiante por defecto
      const rolSeleccionadoId = id_rol ? id_rol : RoleId.ESTUDIANTE;
      const rolSeleccionado = await queryRunner.manager.findOne(Rol, {
        where: { id: rolSeleccionadoId },
      });

      if (rolSeleccionado) {
        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol: rolSeleccionado,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
      }

      // 5️⃣ Crear Afiliación Inicial (si se proveen datos)
      if (institucion) {
        const afiliacion = queryRunner.manager.create(Afiliacion, {
          institucion,
          tipo_afiliacion,
          area_tematica,
          disciplina_cientifica,
          id_grado_academico,
          usuario: usuarioGuardado,
          estado: 1,
        });
        await queryRunner.manager.save(afiliacion);
      }

      await queryRunner.commitTransaction();

      // Notificar al usuario por correo (especialmente útil para logística/ponentes creados por admin)
      try {
        const nombreCompleto = `${dto.nombres} ${dto.primer_apellido}`;
        await this.mailService.sendAccountApprovalEmail(dto.email, nombreCompleto, dto.password);
      } catch (e) {
        console.error('Error enviando correo de bienvenida:', e);
      }

      // Devolvemos el perfil cargado (usando el método existente)
      return this.getPerfil(usuarioGuardado.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Asigna un nuevo rol a un usuario existente verificando que no lo tenga ya.
   */
  async asignarRol(
    usuarioId: number,
    rolId: number,
  ): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.findOne(usuarioId);
    const rol = await this.dataSource
      .getRepository(Rol)
      .findOneBy({ id: rolId });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${rolId} no encontrado.`);
    }

    // Verificar si ya tiene el rol
    const existeRelacion = await this.dataSource
      .getRepository(UsuarioRol)
      .findOne({
        where: {
          usuario: { id: usuarioId },
          rol: { id: rolId },
        },
      });

    if (!existeRelacion) {
      const nuevaRelacion = this.dataSource.getRepository(UsuarioRol).create({
        usuario: usuario,
        rol: rol,
        estado: 1,
      });
      await this.dataSource.getRepository(UsuarioRol).save(nuevaRelacion);
      
      // Notificar al usuario por correo
      try {
        const nombreCompleto = usuario.persona 
          ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}` 
          : 'Usuario';
        await this.mailService.sendRoleDesignationEmail(usuario.email, nombreCompleto, rol.nombre_rol);
      } catch (e) {
        console.error('Error enviando notificación de rol:', e);
      }
    }

    return this.getPerfil(usuarioId);
  }

  // ══════════════════════════════════════════════════════════
  //  PERFIL COMPLETO (join con múltiples tablas)
  // ══════════════════════════════════════════════════════════

  /**
   * Devuelve el perfil completo de un usuario:
   * datos de usuario + persona + roles asignados.
   *
   * Este es un ejemplo de endpoint que consulta múltiples tablas
   * usando TypeORM relations.
   */
  async getPerfil(id: number): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id },
      relations: [
        'persona',
        'usuariosRoles',
        'usuariosRoles.rol',
        'afiliaciones',
        'afiliaciones.gradoAcademico',
        'inscripciones',
        'inscripciones.actividadAcademica',
      ],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...perfil } = usuario;
    return perfil as Omit<Usuario, 'password'>;
  }

  /**
   * Busca un usuario por email sin lanzar excepción si no existe.
   * Útil para flujos de "buscar o crear".
   */
  async findOptionalByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { email },
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
    });
  }

  /**
   * Elimina un rol específico de un usuario.
   * Solo ejecutable por Super Usuario.
   */
  async quitarRol(
    usuarioId: number,
    rolId: number,
  ): Promise<Omit<Usuario, 'password'>> {
    await this.findOne(usuarioId); // valida existencia

    const relacion = await this.dataSource
      .getRepository(UsuarioRol)
      .findOne({
        where: {
          usuario: { id: usuarioId },
          rol: { id: rolId },
        },
      });

    if (!relacion) {
      throw new NotFoundException(
        `El usuario ${usuarioId} no tiene el rol ${rolId} asignado.`,
      );
    }

    await this.dataSource.getRepository(UsuarioRol).delete(relacion.id);
    return this.getPerfil(usuarioId);
  }

  /**
   * Devuelve las inscripciones de un usuario con datos de actividad y notas.
   * Usado por el coordinador para consultar el historial de un estudiante.
   */
  async findInscripciones(usuarioId: number) {
    await this.findOne(usuarioId); // valida existencia
    return this.dataSource.query(
      `SELECT
         i.id,
         i.estado,
         i.nota_principal,
         i.miembro_tyan,
         i.razon,
         i.observacion,
         i.fecha_creacion,
         a.id            AS actividad_id,
         a.nombre        AS actividad_nombre,
         a.descripcion   AS actividad_descripcion,
         e.id            AS evento_id,
         e.nombre        AS evento_nombre
       FROM inscripciones i
       INNER JOIN actividades_academicas a ON a.id = i.id_actividad_academica
       INNER JOIN eventos e ON e.id = a.id_evento
       WHERE i.id_usuario = $1
       ORDER BY i.fecha_creacion DESC`,
      [usuarioId],
    );
  }

  /**
   * Devuelve los certificados emitidos para un usuario.
   * Usado por el coordinador y el propio estudiante.
   */
  async findCertificados(usuarioId: number) {
    await this.findOne(usuarioId); // valida existencia
    return this.dataSource.query(
      `SELECT
         c.id,
         c.codigo_certificado,
         c.tipo,
         c.estado,
         c.fecha_emision,
         a.nombre  AS actividad_nombre,
         e.nombre  AS evento_nombre,
         ic.titulo AS tipo_certificado
       FROM certificados c
       INNER JOIN actividades_academicas a ON a.id = c.id_actividad_academica
       INNER JOIN eventos e ON e.id = a.id_evento
       LEFT  JOIN info_certificados ic ON ic.id = c.id_info_certificado
       WHERE c.id_usuario = $1
       ORDER BY c.fecha_emision DESC`,
      [usuarioId],
    );
  }

  // ══════════════════════════════════════════════════════════
  // FIRMA DIGITAL (PONENTES)
  // ══════════════════════════════════════════════════════════
  async actualizarFirmaLocal(id_usuario: number, filename: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id_usuario },
      relations: ['persona'],
    });

    if (!usuario || !usuario.persona) {
      throw new NotFoundException('Perfil de usuario no encontrado');
    }

    const oldFirma = usuario.persona.firma_dig;

    // Guardar nuevo nombre
    await this.personaRepository.update(usuario.persona.id, {
      firma_dig: filename,
    });

    // Eliminar la firma vieja físicamente si existe
    if (oldFirma && oldFirma !== filename) {
      const p = join(process.cwd(), 'uploads/firmas', oldFirma);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    return true;
  }

  async obtenerRutaFirmaLocal(id_usuario: number): Promise<string | null> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id_usuario },
      relations: ['persona'],
    });

    if (!usuario || !usuario.persona || !usuario.persona.firma_dig) {
      return null;
    }

    const p = join(process.cwd(), 'uploads/firmas', usuario.persona.firma_dig);
    if (fs.existsSync(p)) {
      return p;
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════
  //  SOLICITUD DE REGISTRO (estado = 2 → pendiente de aprobación)
  // ══════════════════════════════════════════════════════════

  /**
   * Registra una solicitud de acceso.
   * Crea el usuario en estado=2 (Pendiente), su persona y asigna el rol Estudiante.
   * La cuenta NO puede iniciar sesión hasta ser aprobada (estado=1).
   * El coordinador la verá en el panel de solicitudes.
   *
   * @param dto      Datos básicos de la solicitud
   * @param docFile  Nombre del archivo de documento de aval subido
   */
  async registrarSolicitud(
    dto: SolicitudRegistroDto,
    docFile: string,
  ): Promise<{ mensaje: string }> {
    const existe = await this.usuarioRepository.findOneBy({ email: dto.email });
    if (existe) {
      throw new ConflictException(
        'El correo electrónico seleccionado ya fue registrado o solicitado previamente.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hash = await bcrypt.hash(dto.password, 10);

      // estado = 2 → Pendiente de aprobación (NO puede loguear)
      const usuario = queryRunner.manager.create(Usuario, {
        email: dto.email,
        password: hash,
        estado: 2,
      });
      const usuarioGuardado = await queryRunner.manager.save(usuario);

      // Guardar datos personales + nombre del documento de aval en firma_dig (reutilizamos el campo como referencia de archivo)
      const persona = queryRunner.manager.create(Persona, {
        nombres: dto.nombres,
        primer_apellido: dto.primer_apellido,
        segundo_apellido: dto.segundo_apellido,
        documento_identidad: dto.documento_identidad,
        genero: dto.genero,
        firma_dig: docFile, // Se reutiliza para almacenar el nombre del doc. de aval
        usuario: usuarioGuardado,
      });
      await queryRunner.manager.save(persona);

      // Asignar rol Estudiante por defecto
      const rol = await queryRunner.manager.findOne(Rol, {
        where: { id: RoleId.ESTUDIANTE },
      });
      if (rol) {
        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
      }

      await queryRunner.commitTransaction();

<<<<<<< HEAD
      // Notificar a administración (opcional/no-bloqueante)
      try {
        const nombreCompleto = `${dto.nombres} ${dto.primer_apellido}`;
        await this.mailService.sendNewRegistrationRequestNotification(nombreCompleto, dto.email);
      } catch (e) {
        console.error('Error enviando notificación de solicitud a admin:', e);
      }

=======
>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
      return {
        mensaje:
          'Su solicitud fue recepcionada correctamente. La confirmación de su cuenta se realizará una vez finalice el proceso de inscripciones y sea validada por administración.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lista los usuarios con estado = 2 (pendientes de aprobación).
   * Solo accesible por Coordinador o Super Usuario.
   */
  async listarSolicitudesPendientes(): Promise<any[]> {
    return this.usuarioRepository.find({
      where: { estado: 2 },
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
      select: {
        id: true,
        email: true,
        estado: true,
        fecha_creacion: true,
      },
      order: { fecha_creacion: 'ASC' },
    });
  }

  /**
   * Aprueba (estado=1) o rechaza (estado=0) una solicitud de registro.
   * Si se rechaza, se puede eliminar físicamente o simplemente inactivar.
   *
   * @param id       ID del usuario pendiente
   * @param accion   'aprobar' | 'rechazar'
   */
   async aprobarRechazarSolicitud(
    id: number,
    accion: 'aprobar' | 'rechazar',
    motivo?: string,
  ): Promise<{ mensaje: string }> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: ['persona'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario ${id} no encontrado.`);
    }

    if (usuario.estado !== 2) {
      throw new BadRequestException(
        'Esta cuenta no está en estado pendiente de aprobación.',
      );
    }

    if (accion === 'aprobar') {
      // SI EL ESTADO ES 2: Es la primera vez (Admisión)
      if (usuario.estado === 2) {
        // Mantenemos la contraseña original que el usuario eligió al registrarse
        await this.usuarioRepository.update(id, { 
          estado: 1, 
          requiere_cambio_password: false 
        });
        
        const nombreCompleto = usuario.persona 
          ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}` 
          : 'Usuario';
          
        await this.mailService.sendAccountApprovalEmail(usuario.email, nombreCompleto, 'La elegida en su registro');
        return { mensaje: 'Solicitud aprobada. El usuario ya puede ingresar con su contraseña original.' };
      } 
      // SI EL ESTADO ERA 0: Es una reactivación
      else {
        await this.usuarioRepository.update(id, { estado: 1 });
        const nombreCompleto = usuario.persona 
          ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}` 
          : 'Usuario';
        await this.mailService.sendAccountReactivationEmail(usuario.email, nombreCompleto);
        return { mensaje: 'Cuenta reactivada y usuario notificado.' };
      }
    } else {
      // Rechazar: estado = -1
      await this.usuarioRepository.update(id, { estado: -1 });
      
      const nombreCompleto = usuario.persona 
        ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}` 
        : 'Usuario';
        
      await this.mailService.sendAccountRejectionEmail(
        usuario.email,
        nombreCompleto,
        motivo || 'La solicitud de registro no cumple con los criterios de validación.'
      );

      return { mensaje: 'Solicitud rechazada (estado -1). El usuario ha sido notificado.' };
    }
  }

  /**
   * Verifica si el CI proporcionado coincide con el documento de identidad del usuario.
   * Se usa como "contraseña de respaldo" para el cambio de rol a Ponente.
   */
  async verificarPasswordRespaldo(id_usuario: number, ci: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: id_usuario },
      relations: ['persona'],
    });

    if (!usuario || !usuario.persona) {
      throw new NotFoundException('Perfil de usuario no encontrado.');
    }

    const ciAlmacenado = usuario.persona.documento_identidad;

    if (!ciAlmacenado) return false;

    // Función para dejar SOLO los números
    const limpiarANumeros = (s: string) => s.replace(/\D/g, '');
    
    const inputNum = limpiarANumeros(ci);
    const dbNum = limpiarANumeros(ciAlmacenado);

    // 1. Si los números limpios coinciden y tienen una longitud válida (mínimo 5 dígitos)
    if (inputNum !== '' && inputNum === dbNum && inputNum.length >= 5) {
      console.log(`[AUDITORÍA] Coincidencia numérica EXITOSA para usuario ${id_usuario}`);
      return true;
    }

    // 2. Fallback: Comparación normalizada (por si el documento tiene letras necesarias como en Pasaportes)
    const normalizar = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (normalizar(ci) === normalizar(ciAlmacenado)) return true;

    console.warn(`[DEBUG] Mismatch CI - User: ${usuario.email} | Input: "${ci}" (Limpio: ${inputNum}) | DB: "${ciAlmacenado}" (Limpio: ${dbNum})`);
    return false;
  }

  /**
   * Activa el portal de ponente para un usuario, estableciendo su contraseña específica
   * y marcando el flag de configurado.
   */
  async activarPortalPonente(id_usuario: number, ci: string, nuevaPassword: string) {
    console.log(`[AUDITORÍA] Intento de ACTIVACIÓN de portal Ponente - Usuario ID: ${id_usuario}`);
    
    // 1. Validar identidad (CI)
    const esValido = await this.verificarPasswordRespaldo(id_usuario, ci);
    if (!esValido) {
      throw new BadRequestException('El documento de identidad no coincide con nuestros registros.');
    }

    // 2. Actualizar contraseña de ponente y marcar como configurado
    const hash = await bcrypt.hash(nuevaPassword, 10);
    await this.usuarioRepository.update(id_usuario, { password_ponente: hash });
    
    // 3. Marcar como configurado en la entidad Persona
    const usuario = await this.usuarioRepository.findOne({ 
      where: { id: id_usuario },
      relations: ['persona']
    });
    
    if (usuario && usuario.persona) {
      usuario.persona.ponente_configurado = true;
      await this.dataSource.getRepository(Persona).save(usuario.persona);
    }

    console.log(`[AUDITORÍA] Portal Ponente ACTIVADO CON CLAVE ESPECÍFICA - Usuario ID: ${id_usuario}`);
    return { mensaje: 'Portal de ponente activado exitosamente.' };
  }
<<<<<<< HEAD

  async getAttendanceToken(usuarioId: number): Promise<string> {
    return this.qrService.generarTokenAsistencia(usuarioId);
  }

  /**
   * Elimina físicamente un usuario y su persona asociada.
   * ÚTIL PARA LIMPIEZA DE DATOS DE PRUEBA.
   */
  async eliminarFisico(id: number) {
    const usuario = await this.findOne(id);
    
    // Al usar onDelete: CASCADE en las relaciones, se borrarían automáticamente,
    // pero para estar seguros borramos persona si existe.
    if (usuario.persona) {
      await this.dataSource.getRepository(Persona).delete(usuario.persona.id);
    }
    
    return this.usuarioRepository.delete(id);
  }
=======
>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
}

