import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { Evento } from '../../eventos/entities/evento.entity';
import { ActividadAcademica } from '../../actividades-academicas/entities/actividad-academica.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Imparticion } from '../../imparticiones/entities/imparticion.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const eventosData = [
      {
        nombre: 'Congreso Internacional TWAS-TYAN 2025',
        descripcion: 'Un evento de talla mundial donde la ciencia latinoamericana converge en La Paz para discutir temas de actualidad, desarrollo y sostenibilidad, enfocados en el progreso de la región y sus desafíos futuros.',
        gestion: '2025',
        version: '1ra Edición',
        ubicacion: 'La Paz, Bolivia',
        direccion: 'Campus Central UMSA, Avenida Villazón',
        fecha_inicio: new Date('2025-05-15'),
        fecha_fin: new Date('2025-05-20'),
        estado: 1,
        // Usamos una imagen de stock llamativa para el banner (lo que usa el frontend en "logo / imagen")
        logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80',
        imagen_fondo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80',
        actividades: [
          {
            nombre: 'Simposio sobre Biología Molecular',
            descripcion: 'Conferencias magistrales sobre los últimos avances en el campo.',
            tipo: 'Simposio',
            fecha_inicio: new Date('2025-05-16'),
            fecha_fin: new Date('2025-05-17'),
            imagen: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80'
          },
          {
            nombre: 'Taller de Redacción Científica',
            descripcion: 'Estrategias y mejores prácticas para publicar en revistas de alto impacto.',
            tipo: 'Taller',
            fecha_inicio: new Date('2025-05-18'),
            fecha_fin: new Date('2025-05-18'),
            imagen: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80'
          },
          {
            nombre: 'Panel: Cambio Climático en los Andes',
            descripcion: 'Mesa de discusión con expertos locales e internacionales.',
            tipo: 'Panel',
            fecha_inicio: new Date('2025-05-19'),
            fecha_fin: new Date('2025-05-19'),
            imagen: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'
          }
        ]
      },
      {
        nombre: 'Feria de Innovación Tecnológica 2026',
        descripcion: 'Muestra abierta al público de los proyectos tecnológicos más prometedores desarrollados por jóvenes investigadores de Latinoamérica.',
        gestion: '2026',
        version: '2da Edición',
        ubicacion: 'Santa Cruz, Bolivia',
        direccion: 'Centro de Convenciones Expocruz',
        fecha_inicio: new Date('2026-08-10'),
        fecha_fin: new Date('2026-08-12'),
        estado: 1,
        logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
        imagen_fondo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
        actividades: [
          {
            nombre: 'Conferencia: IA en la educación',
            descripcion: 'Cómo la inteligencia artificial está remodelando el aprendizaje.',
            tipo: 'Conferencia',
            fecha_inicio: new Date('2026-08-10'),
            fecha_fin: new Date('2026-08-10'),
            imagen: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80'
          },
          {
            nombre: 'Bootcamp de Programación Reactiva',
            descripcion: 'Taller intensivo para aprender Vue y React enfocados en rendimiento.',
            tipo: 'Bootcamp',
            fecha_inicio: new Date('2026-08-11'),
            fecha_fin: new Date('2026-08-12'),
            imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'
          }
        ]
      }
    ];

    // Fetch ponente
    const ponente = await queryRunner.manager.findOne(Usuario, { where: { email: 'ponente@gmail.com' } });

    for (const data of eventosData) {
      const { actividades, ...eventoInfo } = data;

      // Buscar si el evento ya existe
      let evento = await queryRunner.manager.findOne(Evento, { where: { nombre: eventoInfo.nombre } });
      if (!evento) {
        evento = queryRunner.manager.create(Evento, eventoInfo);
        await queryRunner.manager.save(evento);
        console.log(`✅ Evento creado: ${evento.nombre}`);

        // Crear sus actividades
        for (const act of actividades) {
          const nuevaActividad = queryRunner.manager.create(ActividadAcademica, {
            ...act,
            evento: evento,
            horas: 40
          });
          await queryRunner.manager.save(nuevaActividad);
          console.log(`  - Actividad añadida: ${nuevaActividad.nombre}`);
          
          // Seed imparticion for ALL activities to ensure frontend fully displays the Ponente section
          if (ponente) {
            const imparticion = queryRunner.manager.create(Imparticion, {
              actividadAcademica: nuevaActividad,
              usuario: ponente,
              rol_imparticion: 1
            });
            await queryRunner.manager.save(imparticion);
            console.log(`    - Ponente asignado a la actividad ${nuevaActividad.nombre}`);
          }
        }
      } else {
        console.log(`ℹ️ El evento "${evento.nombre}" ya existe.`);
      }
    }

    await queryRunner.commitTransaction();
    console.log('🎉 Seeder de Eventos y Actividades completado con éxito.');
  } catch (error) {
    console.error('❌ Error al insertar eventos:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
