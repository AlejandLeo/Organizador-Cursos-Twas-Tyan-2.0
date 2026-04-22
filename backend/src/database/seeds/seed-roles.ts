import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Rol } from '../../roles/entities/rol.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const roles = [
      { id: 1, nombre_rol: 'Super Usuario' },
      { id: 2, nombre_rol: 'Coordinador' },
      { id: 3, nombre_rol: 'Logistica' },
      { id: 4, nombre_rol: 'Estudiante' },
      { id: 5, nombre_rol: 'Ponente' }
    ];

    for (const r of roles) {
      let rol = await queryRunner.manager.findOne(Rol, { where: { id: r.id } });
      if (!rol) {
        rol = queryRunner.manager.create(Rol, r);
        await queryRunner.manager.save(rol);
        console.log(`✅ Rol guardado: ${r.nombre_rol}`);
      }
    }

    await queryRunner.commitTransaction();
    console.log('🎉 Todos los roles aseguros.');
  } catch (error) {
    console.error('❌ Error al insertar roles:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
