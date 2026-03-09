import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetallesNotasService } from './detalles-notas.service';
import { DetallesNotasController } from './detalles-notas.controller';
import { DetalleNota } from './entities/detalle-nota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DetalleNota])],
  controllers: [DetallesNotasController],
  providers: [DetallesNotasService],
})
export class DetallesNotasModule {}
