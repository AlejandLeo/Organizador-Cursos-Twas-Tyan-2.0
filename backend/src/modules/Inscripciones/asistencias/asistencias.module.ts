import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciasService } from './asistencias.service';
import { AsistenciasController } from './asistencias.controller';
import { AsistenciasMeController } from './asistencias-me.controller';
import { AsistenciasPonenteController } from './asistencias-ponente.controller';
import { AsistenciasLogisticaController } from './asistencias-logistica.controller';
import { AsistenciasAdminController } from './asistencias-admin.controller';
import { Asistencia } from './entities/asistencia.entity';
<<<<<<< HEAD
import { QrModule } from '../../Seguridad/qr/qr.module';
import { SesionAcademica } from '../../Academico/sesiones-academicas/entities/sesion-academica.entity';
import { InscripcionModalidad } from '../inscripcion-modalidades/entities/inscripcion-modalidad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asistencia, SesionAcademica, InscripcionModalidad]),
    QrModule
  ],
=======
import { QrModule } from '../../Comun/qr/qr.module';

@Module({
  imports: [TypeOrmModule.forFeature([Asistencia]), QrModule],
>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
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
