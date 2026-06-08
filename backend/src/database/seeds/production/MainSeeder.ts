import { DataSource } from 'typeorm';
import { Seeder, runSeeder } from 'typeorm-extension';
import RoleSeeder from './RoleSeeder';
import CatalogosSeeder from './CatalogosSeeder';
import SuperAdminSeeder from './SuperAdminSeeder';

/**
 * MainSeeder de PRODUCCIÓN / CONFIGURACIÓN BASE
 *
 * Propósito: Poblar únicamente los datos estructurales mínimos que el sistema
 * necesita para funcionar correctamente en cualquier entorno.
 *
 * Orden de ejecución (importante — hay dependencias entre seeders):
 *   1. RoleSeeder       → Crea los roles base (requerido por SuperAdminSeeder)
 *   2. CatalogosSeeder  → Crea grados académicos y otros catálogos
 *   3. SuperAdminSeeder → Crea el usuario administrador raíz
 *
 * Idempotencia: Todos los seeders hijos usan upsert o verificación previa,
 * por lo que este MainSeeder es seguro de re-ejecutar sin duplicar datos.
 *
 * Uso:
 *   npm run seed:config          (NODE_ENV=production)
 *   npm run migration:run        (siempre antes del seed en prod)
 */
export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🚀 [PROD] Iniciando seeds de configuración base  ');
    console.log('═══════════════════════════════════════════════════');

    await runSeeder(dataSource, RoleSeeder);
    await runSeeder(dataSource, CatalogosSeeder);
    await runSeeder(dataSource, SuperAdminSeeder);

    console.log('');
    console.log('✅ [PROD] Seeds de configuración completados exitosamente.');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }
}
