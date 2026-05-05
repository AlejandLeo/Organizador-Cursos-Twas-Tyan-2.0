import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciasService } from './asistencias.service';
import { AsistenciasController } from './asistencias.controller';
import { AsistenciasMeController } from './asistencias-me.controller';
import { AsistenciasPonenteController } from './asistencias-ponente.controller';
import { AsistenciasLogisticaController } from './asistencias-logistica.controller';
import { AsistenciasAdminController } from './asistencias-admin.controller';
import { Asistencia } from './entities/asistencia.entity';
import { QrModule } from '../../Comun/qr/qr.module';

@Module({
  imports: [TypeOrmModule.forFeature([Asistencia]), QrModule],
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
