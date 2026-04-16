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

    if (!usuario) {
      // Usamos mensaje genérico para no revelar si el email existe
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (usuario.estado === 0) {
      throw new UnauthorizedException(
        'Tu cuenta está inactiva. Contacta al administrador.',
      );
    }

    const passwordValido = await bcrypt.compare(
      loginDto.password,
      usuario.password,
    );
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Eliminamos password del objeto antes de devolver
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
  //  REGISTRO COMPLETO (Usuario + Persona en transacción)
  // ══════════════════════════════════════════════════════════

  /**
   * Registro completo: crea un usuario Y su persona en una sola transacción.
   *
   * Si algo falla en la mitad (ej: error de BD al crear persona),
   * el rollback deshace también la creación del usuario.
   * Esto garantiza que nunca quede un usuario sin persona ni viceversa.
   */
  async register(dto: RegisterDto): Promise<Omit<Usuario, 'password'>> {
    const existe = await this.usuarioRepository.findOneBy({ email: dto.email });
    if (existe) {
      throw new ConflictException(
        `El email '${dto.email}' ya está registrado.`,
      );
    }

    // Usamos QueryRunner para la transacción
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

      // 3️⃣ Crear persona vinculada al usuario
      const { email, password, ...datoPersona } = dto;
      const persona = queryRunner.manager.create(Persona, {
        ...datoPersona,
        usuario: usuarioGuardado,
      });
      await queryRunner.manager.save(persona);

      // 4️⃣ Commit: si llegamos aquí, todo salió bien
      await queryRunner.commitTransaction();

      // Devolver sin password
      const { password: _, ...result } = usuarioGuardado;
      return result as Omit<Usuario, 'password'>;
    } catch (error) {
      // Rollback: deshace AMBAS inserciones si algo falló
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Siempre liberar la conexión
      await queryRunner.release();
    }
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
      ],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado.`);
    }

    const { password, ...perfil } = usuario;
    return perfil as Omit<Usuario, 'password'>;
  }
}
