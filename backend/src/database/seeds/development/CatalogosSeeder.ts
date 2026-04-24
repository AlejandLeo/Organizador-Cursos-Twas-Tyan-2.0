import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { GradoAcademico } from '../../../grados-academicos/entities/grado-academico.entity';

export default class CatalogosSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(GradoAcademico);

    const grados = [
      { id: 1, descripcion: 'Licenciatura', abreviacion: 'Lic.' },
      { id: 2, descripcion: 'Maestría', abreviacion: 'Mtro.' },
      { id: 3, descripcion: 'Doctorado', abreviacion: 'Dr.' },
      { id: 4, descripcion: 'Posdoctorado', abreviacion: 'Ph.D.' },
    ];

    for (const g of grados) {
      const exists = await repository.findOneBy({ id: g.id });
      if (!exists) {
        await repository.save(repository.create(g));
        console.log(`Grado guardado: ${g.descripcion}`);
      }
    }

    console.log('Todos los grados académicos asegurados.');
  }
}
