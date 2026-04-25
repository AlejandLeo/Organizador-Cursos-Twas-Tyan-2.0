import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Persona } from '../../personas/entities/persona.entity';
import { Rol } from '../../roles/entities/rol.entity';
import { UsuarioRol } from '../../usuarios-roles/entities/usuario-rol.entity';
import { RoleId } from '../../usuarios/constants/user-roles.constants';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Iniciando script de creación de Coordinador...');

    const email = 'coordinador@gmail.com';

    let usuario = await queryRunner.manager.findOne(Usuario, { where: { email } });
    const hash = await bcrypt.hash('12345678', 10);

    if (usuario) {
      console.log(`Actualizando contraseña para ${email}...`);
      usuario.password = hash;
      await queryRunner.manager.save(usuario);
    } else {
      usuario = queryRunner.manager.create(Usuario, {
        email,
        password: hash,
        estado: 1,
      });
      await queryRunner.manager.save(usuario);
      console.log('✅ Usuario creado.');
    }

    let persona = await queryRunner.manager.findOne(Persona, { where: { usuario: { id: usuario.id } } });

    if (!persona) {
      persona = queryRunner.manager.create(Persona, {
        nombres: 'Admin',
        primer_apellido: 'Coordinador',
        segundo_apellido: 'Sistema',
        documento_identidad: '10000000',
        usuario: usuario,
      });
      await queryRunner.manager.save(persona);
      console.log('✅ Perfil de Persona creado.');
    } else {
      console.log('ℹ️ Perfil de Persona ya existe.');
    }

    const rolCoordinador = await queryRunner.manager.findOne(Rol, {
      where: { id: RoleId.COORDINADOR },
    });

    if (rolCoordinador) {
      const existeRol = await queryRunner.manager.findOne(UsuarioRol, {
        where: { 
          usuario: { id: usuario.id },
          rol: { id: RoleId.COORDINADOR }
        }
      });

      if (!existeRol) {
        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuario,
          rol: rolCoordinador,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
        console.log('✅ Rol de Coordinador asignado.');
      } else {
        console.log('ℹ️ El usuario ya tiene asignado el rol de Coordinador.');
      }
    } else {
      console.error('⚠️ ALERTA: No se encontró el Rol de Coordinador en la base de datos.');
    }

    await queryRunner.commitTransaction();
    console.log(`🎉 Coordinador creado con éxito!`);
  } catch (error) {
    console.error('❌ Error al crear el coordinador:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
