import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Rol } from '../../../modules/Usuario/roles/entities/rol.entity';

export default class RoleSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Rol);

    const roles = [
      { id: 1, nombre_rol: 'Super Usuario' },
      { id: 2, nombre_rol: 'Coordinador' },
      { id: 3, nombre_rol: 'Logistica' },
      { id: 4, nombre_rol: 'Estudiante' },
      { id: 5, nombre_rol: 'Ponente' },
    ];

    /**
     * Profesionalización: Uso de upsert para asegurar idempotencia.
     * Se insertan los registros o se actualizan si el 'id' ya existe,
     * evitando duplicados en ejecuciones repetitivas.
     */
    await repository.upsert(roles, ['id']);

    console.log('Roles sincronizados con éxito (upsert completo).');
    console.log('Todos los roles asegurados.');
  }
}
