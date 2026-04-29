import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosRolesService } from './usuarios-roles.service';
import { UsuariosRolesController } from './usuarios-roles.controller';
import { UsuarioRol } from './entities/usuario-rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioRol])],
  controllers: [UsuariosRolesController],
  providers: [UsuariosRolesService],
})
export class UsuariosRolesModule {}
