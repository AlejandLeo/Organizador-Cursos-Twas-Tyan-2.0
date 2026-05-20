import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificadosService } from './certificados.service';
import { CertificadosController } from './certificados.controller';
import { CertificadosMeController } from './certificados-me.controller';
import { CertificadosPonenteController } from './certificados-ponente.controller';
import { CertificadosLogisticaController } from './certificados-logistica.controller';
import { CertificadosAdminController } from './certificados-admin.controller';
import { CertificadosPublicController } from './certificados-public.controller';
import { Certificado } from './entities/certificado.entity';
import { CertificadosEnvioService } from './certificados-envio.service';
import { CertificadosQueueService } from './certificados-queue.service';
import { CertificadosPdfService } from './certificados-pdf.service';
import { Inscripcion } from '../../Inscripciones/inscripciones/entities/inscripcion.entity';
import { Imparticion } from '../../Academico/imparticiones/entities/imparticion.entity';
import { CoordinacionEvento } from '../../Academico/coordinaciones/entities/coordinacion.entity';
import { MailLog } from '../../Comun/mail/entities/mail-log.entity';
import { MailQueue } from '../../Comun/mail/entities/mail-queue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificado, Inscripcion, Imparticion, CoordinacionEvento, MailLog, MailQueue])],
  controllers: [
    CertificadosController,
    CertificadosMeController,
    CertificadosPonenteController,
    CertificadosLogisticaController,
    CertificadosAdminController,
    CertificadosPublicController,
  ],
  providers: [
    CertificadosService,
    CertificadosEnvioService,
    CertificadosQueueService,
    CertificadosPdfService,
  ],
  exports: [CertificadosQueueService],
})
export class CertificadosModule {}
