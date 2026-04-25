import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    console.log('Limpiando usuarios sembrados...');
    const userRepo = dataSource.getRepository(Usuario);
    for (const email of ['coordinador@gmail.com', 'estudiante@gmail.com', 'ponente@gmail.com']) {
        const u = await userRepo.findOne({ where: { email } });
        if (u) {
            // First delete related records from usuarios_roles to satisfy foreign key constraints
            await dataSource.query('DELETE FROM usuarios_roles WHERE id_usuario = $1', [u.id]);
            // Then delete the user
            await userRepo.remove(u);
            console.log(`Usuario eliminado: ${email}`);
        }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await app.close();
  }
}
bootstrap();
