import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Evento } from '../../../modules/Academico/eventos/entities/evento.entity';
import { ActividadAcademica } from '../../../modules/Academico/actividades-academicas/entities/actividad-academica.entity';
import { Usuario } from '../../../modules/Usuario/usuarios/entities/usuario.entity';
import { Imparticion } from '../../../modules/Academico/imparticiones/entities/imparticion.entity';

export default class EventosSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const eventoRepository = dataSource.getRepository(Evento);
    const actividadRepository = dataSource.getRepository(ActividadAcademica);
    const userRepository = dataSource.getRepository(Usuario);
    const imparticionRepository = dataSource.getRepository(Imparticion);

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
        logo: 'logo CMS.jpg',
        telefono: '+591 76706873',
        email: 'twas-unesco@umsa.bo',
        organizadores: 'TWAS, TYAN, UMSA, FCPN, Carrera de Química, Ingeniería Química, Embajada de Brasil',
        imagen_fondo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80',
        actividades: [
          {
            nombre: 'Simposio sobre Biología Molecular',
            descripcion: 'Conferencias magistrales sobre los últimos avances en el campo.',
            tipo: 'Simposio',
            fecha_inicio: new Date('2025-05-16'),
            fecha_fin: new Date('2025-05-17'),
            imagen: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, documento_identidad: true, celular: true }, custom: [] }
          },
          {
            nombre: 'Taller de Redacción Científica',
            descripcion: 'Estrategias y mejores prácticas para publicar en revistas de alto impacto.',
            tipo: 'Taller',
            fecha_inicio: new Date('2025-05-18'),
            fecha_fin: new Date('2025-05-18'),
            imagen: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true }, custom: [{ label: 'Título del Articulo a Redactar', type: 'text' }] }
          },
          {
            nombre: 'Panel: Cambio Climático en los Andes',
            descripcion: 'Mesa de discusión con expertos locales e internacionales.',
            tipo: 'Panel',
            fecha_inicio: new Date('2025-05-19'),
            fecha_fin: new Date('2025-05-19'),
            imagen: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, pais_origen: true }, custom: [] }
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
            imagen: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, documento_identidad: true }, custom: [] }
          },
          {
            nombre: 'Bootcamp de Programación Reactiva',
            descripcion: 'Taller intensivo para aprender Vue y React enfocados en rendimiento.',
            tipo: 'Bootcamp',
            fecha_inicio: new Date('2026-08-11'),
            fecha_fin: new Date('2026-08-12'),
            imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, celular: true }, custom: [{ label: 'Nivel de Programación', type: 'select', options: ['Básico', 'Intermedio', 'Avanzado'] }] }
          }
        ]
      },
      {
        nombre: 'Diplomado en Inteligencia Artificial y Ciencia de Datos',
        descripcion: 'Programa de postgrado avanzado diseñado para profesionales que buscan dominar las herramientas de IA, Machine Learning y Big Data aplicadas a la industria actual.',
        gestion: '2025',
        version: '4ta Versión',
        ubicacion: 'Virtual / Online',
        direccion: 'Plataforma LMS TYAN',
        fecha_inicio: new Date('2025-06-01'),
        fecha_fin: new Date('2025-12-15'),
        estado: 1,
        logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80',
        imagen_fondo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80',
        actividades: [
          {
            nombre: 'Módulo I: Fundamentos de Python para Data Science',
            descripcion: 'Primer paso en el dominio de la ciencia de datos utilizando el lenguaje más potente del mercado.',
            tipo: 'Diplomado',
            fecha_inicio: new Date('2025-06-01'),
            fecha_fin: new Date('2025-06-30'),
            imagen: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, documento_identidad: true, grado_academico: true }, custom: [] }
          },
          {
            nombre: 'Módulo II: Deep Learning y Redes Neuronales',
            descripcion: 'Estudio profundo de arquitecturas complejas y entrenamiento de modelos inteligentes.',
            tipo: 'Diplomado',
            fecha_inicio: new Date('2025-07-01'),
            fecha_fin: new Date('2025-07-31'),
            imagen: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, afiliacion: true }, custom: [{ label: '¿Tiene conocimientos de Cálculo?', type: 'select', options: ['Si', 'No'] }] }
          }
        ]
      },
      {
        nombre: 'Cumbre Panamericana de Energías Renovables 2025',
        descripcion: 'Encuentro de líderes y expertos internacionales para discutir la transición hacia matrices energéticas sostenibles en el continente.',
        gestion: '2025',
        version: 'I Edición',
        ubicacion: 'Cochabamba, Bolivia',
        direccion: 'Auditorio Central Gran Hotel Cochabamba',
        fecha_inicio: new Date('2025-09-10'),
        fecha_fin: new Date('2025-09-12'),
        estado: 1,
        logo: 'https://images.unsplash.com/photo-1466611653911-954ffaa137a8?w=1600&q=80',
        imagen_fondo: 'https://images.unsplash.com/photo-1466611653911-954ffaa137a8?w=1600&q=80',
        actividades: [
          {
            nombre: 'Seminario: El Potencial del Litio en la Región',
            descripcion: 'Perspectivas económicas y tecnológicas sobre la extracción y uso del litio.',
            tipo: 'Seminario',
            fecha_inicio: new Date('2025-09-10'),
            fecha_fin: new Date('2025-09-10'),
            imagen: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, documento_identidad: true, pais_origen: true }, custom: [] }
          }
        ]
      },
      {
        nombre: 'Workshop Internacional: Biotecnología Avanzada',
        descripcion: 'Taller práctico intensivo sobre edición genética y bioprocesos industriales.',
        gestion: '2025',
        version: 'Edición Verano',
        ubicacion: 'Sucre, Bolivia',
        direccion: 'Laboratorios de Genética Universidad USFX',
        fecha_inicio: new Date('2025-11-20'),
        fecha_fin: new Date('2025-11-25'),
        estado: 1,
        logo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=80',
        imagen_fondo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600&q=80',
        actividades: [
          {
            nombre: 'Taller: Aplicaciones de la Tecnología CRISPR',
            descripcion: 'Hands-on sobre las técnicas más modernas de edición de ADN.',
            tipo: 'Taller',
            fecha_inicio: new Date('2025-11-21'),
            fecha_fin: new Date('2025-11-23'),
            imagen: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&q=80',
            requisitos: { base: { nombres: true, primer_apellido: true, email: true, celular: true, afiliacion: true, grado_academico: true }, custom: [{ label: 'Talla de Mandil', type: 'select', options: ['S', 'M', 'L', 'XL'] }] }
          }
        ]
      }
    ];

    const ponente = await userRepository.findOneBy({ email: 'ponente@gmail.com' });

    for (const data of eventosData) {
      const { actividades, ...eventoInfo } = data;

      let evento = await eventoRepository.findOneBy({ nombre: eventoInfo.nombre });
      if (!evento) {
        evento = await eventoRepository.save(eventoRepository.create(eventoInfo));
        console.log(`Evento creado: ${evento.nombre}`);

        for (const act of actividades) {
          const nuevaActividad = await actividadRepository.save(actividadRepository.create({
            ...act,
            evento: evento,
            horas: 40
          }));
          console.log(`  - Actividad añadida: ${nuevaActividad.nombre}`);
          
          if (ponente) {
            await imparticionRepository.save(imparticionRepository.create({
              actividadAcademica: nuevaActividad,
              usuario: ponente,
              evento: evento
            }));
            console.log(`    - Ponente asignado a la actividad ${nuevaActividad.nombre}`);
          }
        }
      } else {
        console.log(`El evento "${evento.nombre}" ya existe.`);
      }
    }

    console.log('Seeder de Eventos y Actividades completado con éxito.');
  }
}
