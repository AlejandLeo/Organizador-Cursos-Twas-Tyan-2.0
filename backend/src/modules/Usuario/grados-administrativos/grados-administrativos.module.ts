import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradoAdministrativo } from './entities/grado-administrativo.entity';
import { GradosAdministrativosService } from './grados-administrativos.service';
import { GradosAdministrativosController } from './grados-administrativos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GradoAdministrativo])],
  controllers: [GradosAdministrativosController],
  providers: [GradosAdministrativosService],
  exports: [TypeOrmModule, GradosAdministrativosService],
})
export class GradosAdministrativosModule {}
