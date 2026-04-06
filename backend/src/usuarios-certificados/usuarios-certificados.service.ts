import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioCertificado } from './entities/usuario-certificado.entity';

@Injectable()
export class UsuariosCertificadosService {
  constructor(
    @InjectRepository(UsuarioCertificado)
    private readonly usuariosCertificadosRepository: Repository<UsuarioCertificado>,
  ) {}
}
