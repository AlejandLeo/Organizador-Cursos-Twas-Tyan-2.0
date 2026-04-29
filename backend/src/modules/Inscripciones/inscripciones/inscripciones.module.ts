import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesService } from './inscripciones.service';
import { InscripcionesController } from './inscripciones.controller';
import { InscripcionesEstudianteController } from './inscripciones-estudiante.controller';
import { InscripcionesPonenteController } from './inscripciones-ponente.controller';
import { InscripcionesAdminController } from './inscripciones-admin.controller';
import { Inscripcion } from './entities/inscripcion.entity';
import { SesionAcademica } from '../../Academico/sesiones-academicas/entities/sesion-academica.entity';
import { Asistencia } from '../../Inscripciones/asistencias/entities/asistencia.entity';
import { InscripcionModalidad } from '../../Inscripciones/inscripcion-modalidades/entities/inscripcion-modalidad.entity';
import { Imparticion } from '../../Academico/imparticiones/entities/imparticion.entity';
import { Usuario } from '../../Usuario/usuarios/entities/usuario.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inscripcion,
      SesionAcademica,
      Asistencia,
      InscripcionModalidad,
      Imparticion,
      Usuario,
    ]),
  ],
  controllers: [
    InscripcionesController,
    InscripcionesEstudianteController,
    InscripcionesPonenteController,
    InscripcionesAdminController
  ],
  providers: [InscripcionesService],
  exports: [InscripcionesService],
})
export class InscripcionesModule {}
