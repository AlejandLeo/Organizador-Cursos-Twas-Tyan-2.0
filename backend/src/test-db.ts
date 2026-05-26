import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Persona } from './modules/Usuario/personas/entities/persona.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo = app.get(getRepositoryToken(Persona));
  const personas = await repo.find({ relations: ['usuario'] });
  console.log('--- PERSONAS FIRMAS ---');
  for (const p of personas) {
    if (p.firma_dig) {
      console.log(`ID Usuario: ${p.usuario?.id}, Nombre: ${p.nombres} ${p.primer_apellido}, firma_dig: ${p.firma_dig}`);
    }
  }
  await app.close();
}
bootstrap();
