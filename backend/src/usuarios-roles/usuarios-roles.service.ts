import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../roles/entities/rol.entity';

@Injectable()
export class UsuariosRolesService {
  constructor(
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepository: Repository<UsuarioRol>,
  ) {}

  /**
   * Asignar un rol a un usuario.
   * Primero verifica que la combinación usuario/rol no exista ya.
   */
  async create(data: CreateUsuarioRolDto): Promise<UsuarioRol> {
    const existe = await this.usuarioRolRepository.findOne({
      where: {
        usuario: { id: data.id_usuario },
        rol: { id: data.id_rol },
      },
    });

    if (existe) {
      throw new BadRequestException('El usuario ya tiene asignado este rol.');
    }

    const ur = this.usuarioRolRepository.create({
      estado: data.estado ?? 1,
      // Para relaciones en TypeORM al hacer un save, podemos pasar un objeto con el ID
      usuario: { id: data.id_usuario } as Usuario,
      rol: { id: data.id_rol } as Rol,
    });

    return this.usuarioRolRepository.save(ur);
  }

  /**
   * Lista todas las asignaciones con los datos del usuario y del rol.
   */
  findAll(): Promise<UsuarioRol[]> {
    return this.usuarioRolRepository.find({
      relations: ['usuario', 'usuario.persona', 'rol'],
    });
  }

  async findOne(id: number): Promise<UsuarioRol> {
    const ur = await this.usuarioRolRepository.findOne({
      where: { id: id },
      relations: ['usuario', 'rol'],
    });

    if (!ur) {
      throw new NotFoundException(`Asignación con id ${id} no encontrada.`);
    }
    return ur;
  }

  /**
   * Actualiza el estado de una asignación (ej. para inhabilitar temporalmente a alguien).
   */
  async update(id: number, data: UpdateUsuarioRolDto): Promise<UsuarioRol> {
    await this.findOne(id);

    // Convertimos DTO a objeto compatible con TypeORM (por los decoradores relations)
    const updateData: any = {};
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.id_usuario) updateData.usuario = { id: data.id_usuario };
    if (data.id_rol) updateData.rol = { id: data.id_rol };

    await this.usuarioRolRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Revocar un rol eliminando el registro (o se podría solo cambiar estado).
   */
  async remove(id: number): Promise<{ mensaje: string }> {
    await this.findOne(id);
    await this.usuarioRolRepository.delete(id);
    return { mensaje: `Rol revocado (asignación ${id} eliminada).` };
  }
}
