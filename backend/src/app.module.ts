import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// --- Usuarios y Accesos ---
import { UsuariosModule } from './usuarios/usuarios.module';
import { PersonasModule } from './personas/personas.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosRolesModule } from './usuarios-roles/usuarios-roles.module';
import { AfiliacionesModule } from './afiliaciones/afiliaciones.module';
import { GradosAcademicosModule } from './grados-academicos/grados-academicos.module';

// --- Eventos y Actividades ---
import { EventosModule } from './eventos/eventos.module';
import { CoordinacionesModule } from './coordinaciones/coordinaciones.module';
import { ActividadesAcademicasModule } from './actividades-academicas/actividades-academicas.module';
import { ImparticionesModule } from './imparticiones/imparticiones.module';

// --- Modalidades y Sesiones ---
import { CursoModalidadesModule } from './curso-modalidades/curso-modalidades.module';
import { SesionesAcademicasModule } from './sesiones-academicas/sesiones-academicas.module';

// --- Inscripciones y Asistencias ---
import { InscripcionesModule } from './inscripciones/inscripciones.module';
import { InscripcionModalidadesModule } from './inscripcion-modalidades/inscripcion-modalidades.module';
import { AsistenciasModule } from './asistencias/asistencias.module';

// --- Certificados ---
import { InfoCertificadosModule } from './info-certificados/info-certificados.module';
import { CertificadosModule } from './certificados/certificados.module';
import { UsuariosCertificadosModule } from './usuarios-certificados/usuarios-certificados.module';

// --- Auth ---
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // --- Config ---
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    // --- Usuarios y Accesos ---
    UsuariosModule,
    PersonasModule,
    RolesModule,
    UsuariosRolesModule,
    AfiliacionesModule,
    GradosAcademicosModule,

    // --- Eventos y Actividades ---
    EventosModule,
    CoordinacionesModule,
    ActividadesAcademicasModule,
    ImparticionesModule,

    // --- Modalidades y Sesiones ---
    CursoModalidadesModule,
    SesionesAcademicasModule,

    // --- Inscripciones y Asistencias ---
    InscripcionesModule,
    InscripcionModalidadesModule,
    AsistenciasModule,

    // --- Certificados ---
    InfoCertificadosModule,
    CertificadosModule,
    UsuariosCertificadosModule,

    // --- Auth ---
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
