import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Asegurar carpetas de uploads
  const uploadDirs = ['uploads', 'uploads/perfiles', 'uploads/fondos', 'uploads/eventos', 'uploads/cursos', 'uploads/imagenes', 'uploads/inscripciones'];
  uploadDirs.forEach(dir => {
    const p = path.join(process.cwd(), dir);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  });

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Organizador de Cursos - API')
    .setDescription(
      'Documentación interactiva del backend del Organizador de Cursos',
    )
    .setVersion('2.0')
    .addBearerAuth() // Soporte para JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
