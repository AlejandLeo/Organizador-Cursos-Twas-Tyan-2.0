import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { SesionesAcademicasController } from './sesiones-academicas.controller';
import { SesionesAcademicasMeController } from './sesiones-academicas-me.controller';
import { SesionesAcademicasPonenteController } from './sesiones-academicas-ponente.controller';
import { SesionesAcademicasLogisticaController } from './sesiones-academicas-logistica.controller';
import { SesionesAcademicasAdminController } from './sesiones-academicas-admin.controller';
import { SesionAcademica } from './entities/sesion-academica.entity';
import { CoordinacionEvento } from '../coordinaciones/entities/coordinacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SesionAcademica, CoordinacionEvento])],
  controllers: [
    SesionesAcademicasController,
    SesionesAcademicasMeController,
    SesionesAcademicasPonenteController,
    SesionesAcademicasLogisticaController,
    SesionesAcademicasAdminController,
  ],
  providers: [SesionesAcademicasService],
})
export class SesionesAcademicasModule {}
