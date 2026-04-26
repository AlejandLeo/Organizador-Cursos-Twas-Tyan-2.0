import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesService } from './inscripciones.service';
import { InscripcionesController } from './inscripciones.controller';
import { Inscripcion } from './entities/inscripcion.entity';
import { SesionAcademica } from '../sesiones-academicas/entities/sesion-academica.entity';
import { Asistencia } from '../asistencias/entities/asistencia.entity';
import { InscripcionModalidad } from '../inscripcion-modalidades/entities/inscripcion-modalidad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inscripcion,
      SesionAcademica,
      Asistencia,
      InscripcionModalidad,
    ]),
  ],
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
  exports: [InscripcionesService],
})
export class InscripcionesModule {}
