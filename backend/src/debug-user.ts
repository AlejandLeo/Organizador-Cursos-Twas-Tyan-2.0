import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Persona } from './modules/Usuario/personas/entities/persona.entity';
import { Usuario } from './modules/Usuario/usuarios/entities/usuario.entity';

async function debugUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const personaRepo = dataSource.getRepository(Persona);
  const userRepo = dataSource.getRepository(Usuario);

  const user = await userRepo.findOne({ where: { email: 'kevinS@gmail.com' }, relations: ['persona'] });
  
  if (user && user.persona) {
    console.log(`USER: ${user.email}`);
    console.log(`CI ALMACENADO: "${user.persona.documento_identidad}"`);
    
    // Si queremos arreglarlo para la prueba:
    // await personaRepo.update(user.persona.id, { documento_identidad: '1234567' });
    // console.log('CI actualizado a 1234567 para pruebas.');
  } else {
    console.log('Usuario no encontrado o sin perfil de persona.');
  }

  await app.close();
}

debugUser();
