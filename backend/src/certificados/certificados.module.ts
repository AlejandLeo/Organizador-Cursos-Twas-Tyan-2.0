import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificadosService } from './certificados.service';
import { CertificadosController } from './certificados.controller';
import { Certificado } from './entities/certificado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificado])],
  controllers: [CertificadosController],
  providers: [CertificadosService],
})
export class CertificadosModule {}
