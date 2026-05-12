import * as typeorm from 'typeorm';
import * as extension from 'typeorm-extension';
import * as dotenv from 'dotenv';

dotenv.config();

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
  seeds: ['src/database/seeds/production/*.ts', 'src/database/seeds/development/*.ts'],
  factories: ['src/database/factories/**/*.ts'],
};

export default new typeorm.DataSource(options);