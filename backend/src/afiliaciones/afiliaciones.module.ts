import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfiliacionesService } from './afiliaciones.service';
import { AfiliacionesController } from './afiliaciones.controller';
import { Afiliacion } from './entities/afiliacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Afiliacion])],
  controllers: [AfiliacionesController],
  providers: [AfiliacionesService],
  exports: [AfiliacionesService],
})
export class AfiliacionesModule {}
