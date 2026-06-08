import { DataSource } from 'typeorm';
import { Seeder, runSeeder } from 'typeorm-extension';

// Seeders base reutilizados desde producción (idempotentes, seguros)
import RoleSeeder from '../production/RoleSeeder';
import CatalogosSeeder from '../production/CatalogosSeeder';

// Seeders exclusivos de desarrollo (datos de prueba)
import SuperadminSeeder from './SuperadminSeeder';
import CoordinadorSeeder from './CoordinadorSeeder';
import PonenteSeeder from './PonenteSeeder';
import EstudianteSeeder from './EstudianteSeeder';
import EventosSeeder from './EventosSeeder';

/**
 * MainSeeder de DESARROLLO
 *
 * Propósito: Poblar la base de datos con datos realistas para desarrollo y
 * pruebas locales. Incluye datos de configuración base + usuarios y eventos
 * de ejemplo.
 *
 * Orden de ejecución:
 *   1. RoleSeeder       → Datos base (reutilizado de production/)
 *   2. CatalogosSeeder  → Datos base (reutilizado de production/)
 *   3. SuperadminSeeder → Admin de dev (admin@tyan.org / admin123)
 *   4. CoordinadorSeeder
 *   5. PonenteSeeder
 *   6. EstudianteSeeder
 *   7. EventosSeeder    → Depende de coordinadores y ponentes
 *
 * ⚠️  CleanUsersSeeder está EXCLUIDO de este flujo por seguridad.
 *     Ejecútalo manualmente si necesitas limpiar datos:
 *     npx ts-node -r tsconfig-paths/register ./node_modules/typeorm-extension/bin/cli.cjs seed:run -d ./typeorm.config.ts -n CleanUsersSeeder
 *
 * Idempotencia: Todos los seeders verifican existencia antes de insertar.
 * Es seguro re-ejecutar este MainSeeder sin generar duplicados.
 *
 * Uso:
 *   npm run seed:dev    (NODE_ENV=development)
 */
export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🛠️  [DEV] Iniciando seeds de desarrollo          ');
    console.log('═══════════════════════════════════════════════════');

    console.log('\n📦 Paso 1/7 — Roles base...');
    await runSeeder(dataSource, RoleSeeder);

    console.log('\n📦 Paso 2/7 — Catálogos base...');
    await runSeeder(dataSource, CatalogosSeeder);

    console.log('\n📦 Paso 3/7 — Super Admin de dev...');
    await runSeeder(dataSource, SuperadminSeeder);

    console.log('\n📦 Paso 4/7 — Coordinadores...');
    await runSeeder(dataSource, CoordinadorSeeder);

    console.log('\n📦 Paso 5/7 — Ponentes...');
    await runSeeder(dataSource, PonenteSeeder);

    console.log('\n📦 Paso 6/7 — Estudiantes...');
    await runSeeder(dataSource, EstudianteSeeder);

    console.log('\n📦 Paso 7/7 — Eventos...');
    await runSeeder(dataSource, EventosSeeder);

    console.log('');
    console.log('✅ [DEV] Todos los seeds de desarrollo completados.');
    console.log('   Admin: admin@tyan.org / admin123');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }
}
