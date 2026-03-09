import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { UpdateUsuarioRolDto } from './dto/update-usuario-rol.dto';

@Injectable()
export class UsuariosRolesService {
  constructor(
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepository: Repository<UsuarioRol>,
  ) {}

  create(createUsuarioRolDto: CreateUsuarioRolDto) {
    return this.usuarioRolRepository.save(createUsuarioRolDto);
  }

  findAll() {
    return this.usuarioRolRepository.find();
  }

  findOne(id: string) {
    return this.usuarioRolRepository.findOneBy({ id_usuario_rol: id });
  }

  update(id: string, updateUsuarioRolDto: UpdateUsuarioRolDto) {
    return this.usuarioRolRepository.update(id, updateUsuarioRolDto);
  }

  remove(id: string) {
    return this.usuarioRolRepository.delete(id);
  }
}
