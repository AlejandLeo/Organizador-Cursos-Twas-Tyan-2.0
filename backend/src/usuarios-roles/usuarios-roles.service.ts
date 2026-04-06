import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioRol } from './entities/usuario-rol.entity';

@Injectable()
export class UsuariosRolesService {
  constructor(
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepository: Repository<UsuarioRol>,
  ) {}

  create(data: Partial<UsuarioRol>) {
    const ur = this.usuarioRolRepository.create(data);
    return this.usuarioRolRepository.save(ur);
  }

  findAll() {
    return this.usuarioRolRepository.find();
  }

  findOne(id: number) {
    return this.usuarioRolRepository.findOneBy({ id_usuario_rol: id });
  }

  update(id: number, data: Partial<UsuarioRol>) {
    return this.usuarioRolRepository.update(id, data);
  }

  remove(id: number) {
    return this.usuarioRolRepository.delete(id);
  }
}
