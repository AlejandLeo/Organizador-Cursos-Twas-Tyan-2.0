import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciasService } from './asistencias.service';
import { AsistenciasController } from './asistencias.controller';
import { AsistenciasMeController } from './asistencias-me.controller';
import { AsistenciasPonenteController } from './asistencias-ponente.controller';
import { AsistenciasLogisticaController } from './asistencias-logistica.controller';
import { AsistenciasAdminController } from './asistencias-admin.controller';
import { Asistencia } from './entities/asistencia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asistencia])],
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
