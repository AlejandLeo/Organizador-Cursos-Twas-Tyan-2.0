import { Module } from '@nestjs/common';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PersonasModule } from './personas/personas.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosRolesModule } from './usuarios-roles/usuarios-roles.module';
import { AfiliacionesModule } from './afiliaciones/afiliaciones.module';
import { GradosAcademicosModule } from './grados-academicos/grados-academicos.module';

@Module({
  imports: [
    UsuariosModule,
    PersonasModule,
    RolesModule,
    UsuariosRolesModule,
    AfiliacionesModule,
    GradosAcademicosModule,
  ],
  exports: [
    UsuariosModule,
    PersonasModule,
    RolesModule,
    UsuariosRolesModule,
    AfiliacionesModule,
    GradosAcademicosModule,
  ],
})
export class UsuarioModule {}
