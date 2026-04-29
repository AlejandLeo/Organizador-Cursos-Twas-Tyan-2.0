import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfoCertificadosService } from './info-certificados.service';
import { InfoCertificadosController } from './info-certificados.controller';
import { InfoCertificado } from './entities/info-certificado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InfoCertificado])],
  controllers: [InfoCertificadosController],
  providers: [InfoCertificadosService],
})
export class InfoCertificadosModule {}
