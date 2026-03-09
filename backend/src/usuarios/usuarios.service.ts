import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  create(createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioRepository.save(createUsuarioDto);
  }

  findAll() {
    return this.usuarioRepository.find();
  }

  findOne(id: string) {
    return this.usuarioRepository.findOneBy({ id_usuario: id });
  }

  update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioRepository.update(id, updateUsuarioDto);
  }

  remove(id: string) {
    return this.usuarioRepository.delete(id);
  }
}
