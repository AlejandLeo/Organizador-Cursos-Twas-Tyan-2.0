import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosCertificadosService } from './usuarios-certificados.service';
import { UsuariosCertificadosController } from './usuarios-certificados.controller';
import { UsuarioCertificado } from './entities/usuario-certificado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioCertificado])],
  controllers: [UsuariosCertificadosController],
  providers: [UsuariosCertificadosService],
  exports: [UsuariosCertificadosService],
})
export class UsuariosCertificadosModule {}
