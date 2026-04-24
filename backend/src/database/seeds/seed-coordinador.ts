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

    const existe = await queryRunner.manager.findOne(Usuario, { where: { email } });
    if (existe) {
      console.log(`El usuario ${email} ya existe en la base de datos.`);
      await queryRunner.release();
      await app.close();
      return;
    }

    const hash = await bcrypt.hash('12345678', 10);

    const usuario = queryRunner.manager.create(Usuario, {
      email,
      password: hash,
      estado: 1,
    });
    const usuarioGuardado = await queryRunner.manager.save(usuario);
    console.log('✅ Usuario creado.');

    const persona = queryRunner.manager.create(Persona, {
      nombres: 'Admin',
      primer_apellido: 'Coordinador',
      segundo_apellido: 'Sistema',
      documento_identidad: '10000000',
      usuario: usuarioGuardado,
    });
    await queryRunner.manager.save(persona);
    console.log('✅ Perfil de Persona creado.');

    const rolCoordinador = await queryRunner.manager.findOne(Rol, {
      where: { id: RoleId.COORDINADOR },
    });

    if (rolCoordinador) {
      const usuarioRol = queryRunner.manager.create(UsuarioRol, {
        usuario: usuarioGuardado,
        rol: rolCoordinador,
        estado: 1,
      });
      await queryRunner.manager.save(usuarioRol);
      console.log('✅ Rol de Coordinador asignado.');
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
