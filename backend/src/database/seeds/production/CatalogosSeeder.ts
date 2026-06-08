import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { GradoAcademico } from '../../../modules/Usuario/grados-academicos/entities/grado-academico.entity';

export default class CatalogosSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(GradoAcademico);

    const grados = [
      { id: 1, descripcion: 'Licenciatura', abreviacion: 'Lic.' },
      { id: 2, descripcion: 'Maestría', abreviacion: 'Mtro.' },
      { id: 3, descripcion: 'Doctorado', abreviacion: 'Dr.' },
      { id: 4, descripcion: 'Posdoctorado', abreviacion: 'Ph.D.' },
      { id: 5, descripcion: 'Bachillerato', abreviacion: 'Bach.' },
      { id: 6, descripcion: 'Técnico', abreviacion: 'Téc.' },
      { id: 7, descripcion: 'Técnico Superior Universitario', abreviacion: 'TSU' },
      { id: 8, descripcion: 'Especialidad', abreviacion: 'Esp.' },
      { id: 9, descripcion: 'Ingeniería', abreviacion: 'Ing.' },
      { id: 10, descripcion: 'Pasante', abreviacion: 'Pas.' },
    ];

    /**
     * Upsert atómico: inserta o actualiza en una sola operación (1 query).
     * Consistente con RoleSeeder. Si se añaden nuevos grados o se corrige
     * la abreviación de uno existente, se aplica automáticamente al re-ejecutar.
     */
    await repository.upsert(grados, ['id']);

    console.log('✅ Grados académicos sincronizados (upsert completo).');
    console.log('Todos los grados académicos asegurados.');
  }
}
