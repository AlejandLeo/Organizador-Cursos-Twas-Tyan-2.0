import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../modules/Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../modules/Usuario/personas/entities/persona.entity';
import { Rol } from '../../modules/Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../modules/Usuario/usuarios-roles/entities/usuario-rol.entity';
import { RoleId } from '../../modules/Usuario/usuarios/constants/user-roles.constants';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Iniciando script de creación de múltiples Ponentes...');

    const ponentes = [
      { email: 'warshi@gmail.com', password: 'password123', nombres: 'Warshi', ap1: 'Dandeniya', ap2: '' },
      { email: 'ranga@gmail.com', password: 'password123', nombres: 'Ranga', ap1: 'Ambati', ap2: '' },
      { email: 'pablo@gmail.com', password: 'password123', nombres: 'Pablo', ap1: 'Bolaños', ap2: 'Villegas' },
      { email: 'gloria@gmail.com', password: 'password123', nombres: 'Gloria', ap1: 'Rodrigo', ap2: '' },
      { email: 'federico@gmail.com', password: 'password123', nombres: 'Federico', ap1: 'Brown', ap2: '' },
      { email: 'ponente@gmail.com', password: '12345678', nombres: 'Experto', ap1: 'Prueba', ap2: 'Ponente' } // El original
    ];

    const rol = await queryRunner.manager.findOne(Rol, {
      where: { id: RoleId.PONENTE },
    });

    if (!rol) {
      console.error('⚠️ ALERTA: No se encontró el Rol de Ponente en la base de datos.');
      await queryRunner.rollbackTransaction();
      return;
    }

    for (const p of ponentes) {
        const existe = await queryRunner.manager.findOne(Usuario, { where: { email: p.email } });
        if (existe) {
          console.log(`ℹ️ El usuario ${p.email} ya existe en la base de datos. Saltando...`);
          continue;
        }

        const hash = await bcrypt.hash(p.password, 10);
        const usuario = queryRunner.manager.create(Usuario, {
          email: p.email,
          password: hash,
          estado: 1,
        });
        const usuarioGuardado = await queryRunner.manager.save(usuario);

        const persona = queryRunner.manager.create(Persona, {
          nombres: p.nombres,
          primer_apellido: p.ap1,
          segundo_apellido: p.ap2,
          documento_identidad: Math.floor(10000000 + Math.random() * 90000000).toString(),
          usuario: usuarioGuardado,
        });
        await queryRunner.manager.save(persona);

        const usuarioRol = queryRunner.manager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol: rol,
          estado: 1,
        });
        await queryRunner.manager.save(usuarioRol);
        
        console.log(`✅ Ponente creado: ${p.nombres} ${p.ap1} (${p.email})`);
    }

    await queryRunner.commitTransaction();
    console.log(`🎉 Seeder de ponentes finalizado con éxito!`);
  } catch (error) {
    console.error('❌ Error al crear los ponentes:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();