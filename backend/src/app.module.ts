import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// --- Usuarios y Accesos ---
import { UsuariosModule } from './modules/Usuario/usuarios/usuarios.module';
import { PersonasModule } from './modules/Usuario/personas/personas.module';
import { RolesModule } from './modules/Usuario/roles/roles.module';
import { UsuariosRolesModule } from './modules/Usuario/usuarios-roles/usuarios-roles.module';
import { AfiliacionesModule } from './modules/Usuario/afiliaciones/afiliaciones.module';
import { GradosAcademicosModule } from './modules/Usuario/grados-academicos/grados-academicos.module';

// --- Eventos y Actividades ---
import { EventosModule } from './modules/Academico/eventos/eventos.module';
import { CoordinacionesModule } from './modules/Academico/coordinaciones/coordinaciones.module';
import { ActividadesAcademicasModule } from './modules/Academico/actividades-academicas/actividades-academicas.module';
import { ImparticionesModule } from './modules/Academico/imparticiones/imparticiones.module';

// --- Modalidades y Sesiones ---
import { CursoModalidadesModule } from './modules/Academico/curso-modalidades/curso-modalidades.module';
import { SesionesAcademicasModule } from './modules/Academico/sesiones-academicas/sesiones-academicas.module';

// --- Inscripciones y Asistencias ---
import { InscripcionesModule } from './modules/Inscripciones/inscripciones/inscripciones.module';
import { InscripcionModalidadesModule } from './modules/Inscripciones/inscripcion-modalidades/inscripcion-modalidades.module';
import { AsistenciasModule } from './modules/Inscripciones/asistencias/asistencias.module';

// --- Certificados ---
import { InfoCertificadosModule } from './modules/Certificacion/info-certificados/info-certificados.module';
import { CertificadosModule } from './modules/Certificacion/certificados/certificados.module';
import { UsuariosCertificadosModule } from './modules/Certificacion/usuarios-certificados/usuarios-certificados.module';

// --- Auth ---
import { AuthModule } from './modules/Seguridad/auth/auth.module';

// --- Archivos ---
import { UploadsModule } from './modules/Comun/uploads/uploads.module';
import { MailModule } from './modules/Comun/mail/mail.module';

// --- Dashboard ---
import { CoordinadorModule } from './modules/Academico/coordinador/coordinador.module';

// --- Comun ---
import { QrModule } from './modules/Comun/qr/qr.module';

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

    // --- Archivos ---
    UploadsModule,
    MailModule,

    // --- Especiales ---
    CoordinadorModule,
    QrModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
