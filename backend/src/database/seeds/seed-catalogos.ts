import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { GradoAcademico } from '../../modules/Usuario/grados-academicos/entities/grado-academico.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const grados = [
      { id: 1, descripcion: 'Licenciatura', abreviacion: 'Lic.' },
      { id: 2, descripcion: 'Maestría', abreviacion: 'Mtro.' },
      { id: 3, descripcion: 'Doctorado', abreviacion: 'Dr.' },
      { id: 4, descripcion: 'Posdoctorado', abreviacion: 'Ph.D.' },
    ];

    for (const g of grados) {
      let grado = await queryRunner.manager.findOne(GradoAcademico, { where: { id: g.id } });
      if (!grado) {
        grado = queryRunner.manager.create(GradoAcademico, g);
        await queryRunner.manager.save(grado);
        console.log(`✅ Grado guardado: ${g.descripcion}`);
      }
    }

    await queryRunner.commitTransaction();
    console.log('🎉 Todos los grados académicos asegurados.');
  } catch (error) {
    console.error('❌ Error al insertar grados:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
