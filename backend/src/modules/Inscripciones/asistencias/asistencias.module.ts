import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciasService } from './asistencias.service';
import { AsistenciasController } from './asistencias.controller';
import { AsistenciasMeController } from './asistencias-me.controller';
import { AsistenciasPonenteController } from './asistencias-ponente.controller';
import { AsistenciasLogisticaController } from './asistencias-logistica.controller';
import { AsistenciasAdminController } from './asistencias-admin.controller';
import { Asistencia } from './entities/asistencia.entity';
import { QrModule } from '../../Seguridad/qr/qr.module';
import { SesionAcademica } from '../../Academico/sesiones-academicas/entities/sesion-academica.entity';
import { InscripcionModalidad } from '../inscripcion-modalidades/entities/inscripcion-modalidad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asistencia, SesionAcademica, InscripcionModalidad]),
    QrModule
  ],
  controllers: [
    AsistenciasController,
    AsistenciasMeController,
    AsistenciasPonenteController,
    AsistenciasLogisticaController,
    AsistenciasAdminController,
  ],
  providers: [AsistenciasService],
})
export class AsistenciasModule {}
