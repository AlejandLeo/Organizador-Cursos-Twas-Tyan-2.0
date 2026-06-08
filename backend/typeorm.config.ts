import * as typeorm from 'typeorm';
import * as extension from 'typeorm-extension';
import * as dotenv from 'dotenv';

dotenv.config();

// Determina el entorno actual. Por defecto asume 'development' si no está definido.
const isProd = process.env.NODE_ENV === 'production';

/**
 * Configuración del DataSource para el CLI de TypeORM y typeorm-extension.
 *
 * - seeds: apunta al MainSeeder del entorno activo, que internamente
 *   orquesta el orden correcto de ejecución.
 * - synchronize: SIEMPRE false aquí. El auto-sync lo controla app.module.ts
 *   en tiempo de ejecución del servidor NestJS, no el CLI.
 */
const options: typeorm.DataSourceOptions & extension.SeederOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  seeds: isProd
    ? ['src/database/seeds/production/MainSeeder.ts']
    : ['src/database/seeds/development/MainSeeder.ts'],
  factories: ['src/database/factories/**/*.ts'],
};

export default new typeorm.DataSource(options);