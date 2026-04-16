import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  create(data: CreateRolDto): Promise<Rol> {
    const rol = this.rolRepository.create(data);
    return this.rolRepository.save(rol);
  }

  findAll(): Promise<Rol[]> {
    return this.rolRepository.find();
  }

  async findOne(id: number): Promise<Rol> {
    const rol = await this.rolRepository.findOneBy({ id: id });
    if (!rol) {
      throw new NotFoundException(`Rol con id ${id} no encontrado.`);
    }
    return rol;
  }

  async update(id: number, data: UpdateRolDto): Promise<Rol> {
    await this.findOne(id);
    await this.rolRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ mensaje: string }> {
    await this.findOne(id);
    await this.rolRepository.delete(id);
    return { mensaje: `Rol con id ${id} eliminado correctamente.` };
  }

  /**
   * Obtiene un rol y lista todos los usuarios que lo tienen asignado (JOIN).
   */
  async getUsuariosPorRol(id: number): Promise<Rol> {
    const rol = await this.rolRepository.findOne({
      where: { id },
      relations: [
        'usuariosRoles',
        'usuariosRoles.usuario',
        'usuariosRoles.usuario.persona',
      ],
    });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${id} no encontrado.`);
    }

    return rol;
  }
}
