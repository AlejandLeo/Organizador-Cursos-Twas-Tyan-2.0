import { Module } from '@nestjs/common';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PersonasModule } from './personas/personas.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosRolesModule } from './usuarios-roles/usuarios-roles.module';
import { AfiliacionesModule } from './afiliaciones/afiliaciones.module';
import { GradosAcademicosModule } from './grados-academicos/grados-academicos.module';
import { GradosAdministrativosModule } from './grados-administrativos/grados-administrativos.module';

@Module({
  imports: [
    UsuariosModule,
    PersonasModule,
    RolesModule,
    UsuariosRolesModule,
    AfiliacionesModule,
    GradosAcademicosModule,
    GradosAdministrativosModule,
  ],
  exports: [
    UsuariosModule,
    PersonasModule,
    RolesModule,
    UsuariosRolesModule,
    AfiliacionesModule,
    GradosAcademicosModule,
    GradosAdministrativosModule,
  ],
})
export class UsuarioModule {}
