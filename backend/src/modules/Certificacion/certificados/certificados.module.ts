import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificadosService } from './certificados.service';
import { CertificadosController } from './certificados.controller';
import { CertificadosMeController } from './certificados-me.controller';
import { CertificadosPonenteController } from './certificados-ponente.controller';
import { CertificadosLogisticaController } from './certificados-logistica.controller';
import { CertificadosAdminController } from './certificados-admin.controller';
import { Certificado } from './entities/certificado.entity';
import { CertificadosEnvioService } from './certificados-envio.service';
import { CertificadosQueueService } from './certificados-queue.service';

@Module({
  imports: [TypeOrmModule.forFeature([Certificado])],
  controllers: [
    CertificadosController,
    CertificadosMeController,
    CertificadosPonenteController,
    CertificadosLogisticaController,
    CertificadosAdminController,
  ],
  providers: [
    CertificadosService,
    CertificadosEnvioService,
    CertificadosQueueService,
  ],
  exports: [CertificadosQueueService],
})
export class CertificadosModule {}
