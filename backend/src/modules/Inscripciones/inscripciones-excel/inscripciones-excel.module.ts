import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InscripcionesExcelController } from './inscripciones-excel.controller';
import { InscripcionesExcelService } from './inscripciones-excel.service';

// Entidades
import { Usuario } from '../../Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../Usuario/personas/entities/persona.entity';
import { Afiliacion } from '../../Usuario/afiliaciones/entities/afiliacion.entity';
import { Rol } from '../../Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../Usuario/usuarios-roles/entities/usuario-rol.entity';
import { Inscripcion } from '../inscripciones/entities/inscripcion.entity';
import { ActividadAcademica } from '../../Academico/actividades-academicas/entities/actividad-academica.entity';

// Módulos comunes
import { MailModule } from '../../Comun/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Persona,
      Afiliacion,
      Rol,
      UsuarioRol,
      Inscripcion,
      ActividadAcademica,
    ]),
    MailModule,
  ],
  controllers: [InscripcionesExcelController],
  providers: [InscripcionesExcelService],
  exports: [InscripcionesExcelService],
})
export class InscripcionesExcelModule {}
