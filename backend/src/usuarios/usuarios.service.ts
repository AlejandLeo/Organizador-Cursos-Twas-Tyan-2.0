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
import { Persona } from '../personas/entities/persona.entity';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { CrearPonenteDto } from './dto/crear-ponente.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';

// Entidades adicionales para registro y roles
import { Rol } from '../roles/entities/rol.entity';
import { UsuarioRol } from '../usuarios-roles/entities/usuario-rol.entity';
import { Afiliacion } from '../afiliaciones/entities/afiliacion.entity';
import { RoleId } from './constants/user-roles.constants';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    private readonly dataSource: DataSource,
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

    // 1. Filtrar campos específicos para la entidad Persona
    const camposPersonaValidos = [
      'nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 
      'genero', 'pais_origen', 'pais_residencia', 'fecha_nacimiento', 'celular'
    ];
    
    const datosPersona: any = {};
    camposPersonaValidos.forEach(key => {
      if (data[key] !== undefined) {
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
    // Notar que 'afiliacion' se mapea a 'institucion'
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
        // Actualizar existente
        if (institucion !== undefined) af.institucion = institucion;
        if (id_grado_academico !== undefined) af.id_grado_academico = id_grado_academico;
        if (tipo_afiliacion !== undefined) af.tipo_afiliacion = tipo_afiliacion;
        if (area_tematica !== undefined) af.area_tematica = area_tematica;
        if (disciplina_cientifica !== undefined) af.disciplina_cientifica = disciplina_cientifica;
        await afiliacionRepo.save(af);
      } else {
        // Crear nueva
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
    await this.findOne(id);
    await this.usuarioRepository.update(id, { estado: 0 });
    return { mensaje: `Usuario ${id} deshabilitado correctamente.` };
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

      await queryRunner.commitTransaction();
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
  async login(loginDto: LoginDto): Promise<Omit<Usuario, 'password'>> {
    // Buscamos por email — no usamos findBy directo para poder cargar relaciones
    const usuario = await this.usuarioRepository.findOne({
      where: { email: loginDto.email },
      relations: ['persona', 'usuariosRoles', 'usuariosRoles.rol'],
    });

    console.log('--- INTENTO DE LOGIN ---');
    console.log('Email:', loginDto.email);

    if (!usuario) {
      console.log('Error: Usuario no encontrado en la BD.');
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    console.log('Usuario encontrado. ID:', usuario.id);
    console.log('Estado:', usuario.estado);

    if (usuario.estado === 0) {
      console.log('Error: Usuario inactivo.');
      throw new UnauthorizedException(
        'Tu cuenta está inactiva. Contacta al administrador.',
      );
    }

    const passwordValido = await bcrypt.compare(
      loginDto.password,
      usuario.password,
    );

    if (!passwordValido) {
      console.log('Error: La contraseña NO coincide.');
      console.log('Password enviada:', loginDto.password);
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    console.log('✅ LOGIN EXITOSO');

    // Eliminamos password del objeto antes de devolver
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword as Omit<Usuario, 'password'>;
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
    await this.usuarioRepository.update(id, { password: nuevaHash });

    return { mensaje: 'Contraseña actualizada correctamente.' };
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
        `El email '${dto.email}' ya está registrado.`,
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
}
