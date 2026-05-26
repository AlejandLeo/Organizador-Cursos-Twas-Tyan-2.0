import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActividadesAcademicasService } from './actividades-academicas.service';
import { ActividadesAcademicasController } from './actividades-academicas.controller';
import { ActividadAcademica } from './entities/actividad-academica.entity';

import { MailModule } from '../../Comun/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActividadAcademica]),
    MailModule
  ],
  controllers: [ActividadesAcademicasController],
  providers: [ActividadesAcademicasService],
})
export class ActividadesAcademicasModule {}
