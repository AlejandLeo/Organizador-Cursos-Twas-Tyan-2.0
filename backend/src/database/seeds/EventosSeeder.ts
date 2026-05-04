import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Evento } from '../../modules/Academico/eventos/entities/evento.entity';
import { ActividadAcademica } from '../../modules/Academico/actividades-academicas/entities/actividad-academica.entity';
import { Usuario } from '../../modules/Usuario/usuarios/entities/usuario.entity';
import { Imparticion } from '../../modules/Academico/imparticiones/entities/imparticion.entity';

export default class EventosSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. LIMPIEZA DE DATOS EXISTENTES
      await queryRunner.manager.delete(Imparticion, {});
      await queryRunner.manager.delete(ActividadAcademica, {});
      await queryRunner.manager.delete(Evento, {});
      console.log('🗑️ Base de datos de eventos limpiada.');

      const eventosData = [
        {
          nombre: 'Congreso Internacional TWAS-TYAN',
          nombre_2: 'Avances en Ciencia y Tecnología',
          descripcion: 'El evento insignia de TYAN que reúne a los investigadores más brillantes de Latinoamérica para discutir el futuro de la ciencia y la innovación regional.',
          gestion: '2025',
          version: '1ra Edición',
          ubicacion: 'La Paz, Bolivia',
          direccion: 'Campus Central UMSA, Avenida Villazón',
          fecha_inicio: new Date('2025-05-15'),
          fecha_fin: new Date('2025-05-20'),
          estado: 1,
          sigla: 'TWAS-TYAN',
          institucion_badge: 'Evento Oficial OEA/TYAN',
          color_principal: '#0070b4',
          color_sigla: '#000000',
          color_texto_header: '#0070b4',
          color_titulo_2: '#ffffff',
          color_badge_gestion: '#0070b4',
          color_badge_institucion: '#0ea5e9',
          color_badge_fecha: '#10b981',
          logo: 'logo%20fcpn.png',
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
            }
          ]
        },
        {
          nombre: 'Hackathon Boliviana de IA',
          nombre_2: 'Hackeando el Futuro',
          descripcion: 'Competencia intensa de 48 horas resolviendo problemas reales con Inteligencia Artificial.',
          gestion: '2025',
          version: 'II Edición',
          ubicacion: 'Santa Cruz, Bolivia',
          direccion: 'Centro de Convenciones Expocruz',
          fecha_inicio: new Date('2025-08-20'),
          fecha_fin: new Date('2025-08-22'),
          estado: 1,
          sigla: 'HACK-IA',
          institucion_badge: 'Organizado por UMSA-TYAN',
          color_principal: '#7c3aed',
          color_sigla: '#ffffff',
          color_texto_header: '#7c3aed',
          color_titulo_2: '#ffffff',
          color_badge_gestion: '#7c3aed',
          color_badge_institucion: '#4f46e5',
          color_badge_fecha: '#7c3aed',
          logo: 'Logo%20UMSA.png',
          imagen_fondo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
          actividades: [
            {
              nombre: 'Bootcamp: NLP y Large Language Models',
              descripcion: 'Aprende a construir tus propios modelos de lenguaje con expertos.',
              tipo: 'Taller',
              fecha_inicio: new Date('2025-08-20'),
              fecha_fin: new Date('2025-08-20'),
              imagen: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
              requisitos: { base: { nombres: true, primer_apellido: true, email: true }, custom: [] }
            }
          ]
        },
        {
          nombre: 'Cumbre de Energías Limpias',
          nombre_2: 'Transición Sostenible',
          descripcion: 'Encuentro estratégico para debatir la implementación de matrices energéticas renovables.',
          gestion: '2025',
          version: 'I Edición',
          ubicacion: 'Cochabamba, Bolivia',
          direccion: 'Gran Hotel Cochabamba',
          fecha_inicio: new Date('2025-11-10'),
          fecha_fin: new Date('2025-11-12'),
          estado: 1,
          sigla: 'CEL-2025',
          institucion_badge: 'Evento Internacional',
          color_principal: '#f59e0b',
          color_sigla: '#ffffff',
          color_texto_header: '#f59e0b',
          color_titulo_2: '#ffffff',
          color_badge_gestion: '#f59e0b',
          color_badge_institucion: '#d97706',
          color_badge_fecha: '#b45309',
          logo: 'logo%20fcpn.png',
          imagen_fondo: 'https://images.unsplash.com/photo-1466611653911-954ffaa137a8?w=1600&q=80',
          actividades: [
            {
              nombre: 'Foro: El Futuro del Litio en Bolivia',
              descripcion: 'Perspectivas industriales y de investigación científica.',
              tipo: 'Panel',
              fecha_inicio: new Date('2025-11-11'),
              fecha_fin: new Date('2025-11-11'),
              imagen: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=800&q=80',
              requisitos: { base: { nombres: true, primer_apellido: true, email: true }, custom: [] }
            }
          ]
        }
      ];

      const ponente = await queryRunner.manager.findOne(Usuario, { where: { email: 'ponente@gmail.com' } });

      for (const data of eventosData) {
        const { actividades, ...eventoInfo } = data;
        const evento = queryRunner.manager.create(Evento, eventoInfo);
        await queryRunner.manager.save(evento);
        console.log(`✅ Evento creado: ${evento.nombre}`);

        for (const act of actividades) {
          const nuevaActividad = queryRunner.manager.create(ActividadAcademica, {
            ...act,
            evento: evento,
            horas: 40
          });
          await queryRunner.manager.save(nuevaActividad);
          
          if (ponente) {
            await queryRunner.manager.save(queryRunner.manager.create(Imparticion, {
              actividadAcademica: nuevaActividad,
              usuario: ponente,
              rol_imparticion: 1
            }));
          }
        }
      }

      await queryRunner.commitTransaction();
      console.log('🎉 Seeder de 3 eventos completado con éxito.');
    } catch (error) {
      console.error('❌ Error al insertar eventos:', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
