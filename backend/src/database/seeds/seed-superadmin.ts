import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Usuario } from '../../modules/Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../modules/Usuario/personas/entities/persona.entity';
import { Rol } from '../../modules/Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../modules/Usuario/usuarios-roles/entities/usuario-rol.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const adminEmail = 'admin@tyan.org';
    const passwordHash = await bcrypt.hash('admin123', 10);

    // 1. Crear el rol si no existe
    let adminRole = await queryRunner.manager.findOne(Rol, { where: { id: 1 } });
    if (!adminRole) {
      adminRole = queryRunner.manager.create(Rol, { id: 1, nombre_rol: 'Super Usuario' });
      await queryRunner.manager.save(adminRole);
    }

    // 2. Crear al usuario si no existe
    let adminUser = await queryRunner.manager.findOne(Usuario, { where: { email: adminEmail } });
    
    if (!adminUser) {
      adminUser = queryRunner.manager.create(Usuario, {
        email: adminEmail,
        password: passwordHash,
        estado: 1,
      });
      await queryRunner.manager.save(adminUser);
    }

    // 3. Crear o actualizar su perfil en 'Persona'
    let persona = await queryRunner.manager.findOne(Persona, { where: { usuario: { id: adminUser.id } } });

    if (!persona) {
        persona = queryRunner.manager.create(Persona, {
          nombres: 'Alejandro Leonardo',
          primer_apellido: 'Tyan',
          segundo_apellido: 'Admin',
          usuario: adminUser,
        });
        await queryRunner.manager.save(persona);
    } else {
        persona.nombres = 'Alejandro Leonardo';
        persona.primer_apellido = 'Tyan';
        persona.segundo_apellido = 'Admin';
        await queryRunner.manager.save(persona);
    }

    // 4. Asignarle el rol
    let usuarioRol = await queryRunner.manager.findOne(UsuarioRol, { where: { usuario: { id: adminUser.id }, rol: { id: adminRole.id } } });
    if (!usuarioRol) {
        usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: adminUser,
          rol: adminRole,
        });
        await queryRunner.manager.save(usuarioRol);
    }
    
    console.log('✅ Super Usuario admin@tyan.org verificado y actualizado con nombre: Alejandro Leonardo Tyan Admin');

    await queryRunner.commitTransaction();
    console.log('🎉 Seeder de Super Usuario completado.');
  } catch (error) {
    console.error('❌ Error al insertar super administrador:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
