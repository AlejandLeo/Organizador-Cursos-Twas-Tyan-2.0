import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../modules/Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../modules/Usuario/personas/entities/persona.entity';
import { Rol } from '../../modules/Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../modules/Usuario/usuarios-roles/entities/usuario-rol.entity';
import { RoleId } from '../../modules/Usuario/usuarios/constants/user-roles.constants';
import { Inscripcion } from '../../modules/Inscripciones/inscripciones/entities/inscripcion.entity';
import { ActividadAcademica } from '../../modules/Academico/actividades-academicas/entities/actividad-academica.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Iniciando script de creación de Estudiante...');

    const email = 'estudiante@gmail.com';

    const existe = await queryRunner.manager.findOne(Usuario, { where: { email } });
    let usuarioGuardado = existe;

    if (!existe) {
      const hash = await bcrypt.hash('12345678', 10);

      const usuario = queryRunner.manager.create(Usuario, {
        email,
        password: hash,
        estado: 1,
      });
      usuarioGuardado = await queryRunner.manager.save(usuario);
      console.log('✅ Usuario creado.');

      const persona = queryRunner.manager.create(Persona, {
        nombres: 'Alumno',
        primer_apellido: 'Prueba',
        segundo_apellido: 'Estudiante',
        documento_identidad: '20000000',
        usuario: usuarioGuardado,
      });
      await queryRunner.manager.save(persona);
      console.log('✅ Perfil de Persona creado.');

      const rol = await queryRunner.manager.findOne(Rol, {
        where: { id: RoleId.ESTUDIANTE },
      });

      if (rol) {
        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol: rol,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
        console.log('✅ Rol de Estudiante asignado.');
      } else {
        console.error('⚠️ ALERTA: No se encontró el Rol de Estudiante en la base de datos.');
      }
    }

    // Limpiar inscripciones anteriores para no chocar con constraints o data vieja
    await queryRunner.manager.delete(Inscripcion, { usuario: { id: usuarioGuardado?.id } });

    // Seeding de Inscripciones para que el dashboard/frontend del estudiante funcione
    console.log('Generando inscripciones de prueba...');
    const actividades = await queryRunner.manager.find(ActividadAcademica);
    if (actividades.length >= 4) {
       // Aprobado
       const ins1 = queryRunner.manager.create(Inscripcion, {
         usuario: usuarioGuardado!,
         actividadAcademica: actividades[0],
         estado: 1,
         razon: 'Deseo aprender.',
         miembro_tyan: 1
       });
       await queryRunner.manager.save(ins1);

       // Pendiente
       const ins2 = queryRunner.manager.create(Inscripcion, {
         usuario: usuarioGuardado!,
         actividadAcademica: actividades[1],
         estado: 0,
         razon: 'Espero me acepten test.',
         miembro_tyan: 0
       });
       await queryRunner.manager.save(ins2);

       // Rechazado
       const ins3 = queryRunner.manager.create(Inscripcion, {
         usuario: usuarioGuardado!,
         actividadAcademica: actividades[2],
         estado: 2,
         razon: 'Para ver.',
         miembro_tyan: 0
       });
       // Inject observacion? No, wait, 'observacion' doesn't exist on Inscripcion maybe? We'll just leave them default, the frontend handles fallback messages
       await queryRunner.manager.save(ins3);

       // Finalizado
       const ins4 = queryRunner.manager.create(Inscripcion, {
         usuario: usuarioGuardado!,
         actividadAcademica: actividades[3],
         estado: 3,
         razon: 'Interesado en finalizarlo.',
         miembro_tyan: 1,
         nota_principal: 95.5
       });
       await queryRunner.manager.save(ins4);

       console.log('✅ Se han creado 4 inscripciones (Aprobado, Pendiente, Rechazado, Finalizado).');
    }

    await queryRunner.commitTransaction();
    console.log(`🎉 Estudiante creado con éxito! (estudiante@gmail.com / 12345678)`);
  } catch (error) {
    console.error('❌ Error al crear el estudiante:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();