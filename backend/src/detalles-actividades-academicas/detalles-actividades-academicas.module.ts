import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetallesActividadesAcademicasService } from './detalles-actividades-academicas.service';
import { DetallesActividadesAcademicasController } from './detalles-actividades-academicas.controller';
import { DetalleActividadAcademica } from './entities/detalle-actividad-academica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DetalleActividadAcademica])],
  controllers: [DetallesActividadesAcademicasController],
  providers: [DetallesActividadesAcademicasService],
})
export class DetallesActividadesAcademicasModule {}
