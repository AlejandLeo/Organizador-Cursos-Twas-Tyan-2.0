import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImparticionesService } from './imparticiones.service';
import { ImparticionesController } from './imparticiones.controller';
import { Imparticion } from './entities/imparticion.entity';

import { UsuariosModule } from '../usuarios/usuarios.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Imparticion]),
    UsuariosModule,
    RolesModule,
  ],
  controllers: [ImparticionesController],
  providers: [ImparticionesService],
})
export class ImparticionesModule {}
