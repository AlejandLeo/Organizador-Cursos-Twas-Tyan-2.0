import { DataSource } from 'typeorm';
import { Evento } from '../eventos/entities/evento.entity';

async function dump() {
    const ds = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: '123456',
        database: 'eventos_academicos_db',
        entities: [Evento]
    });

    try {
        await ds.initialize();
        const repo = ds.getRepository(Evento);
        const all = await repo.find();
        console.log('--- EVENTOS START ---');
        console.log(JSON.stringify(all, null, 2));
        console.log('--- EVENTOS END ---');
    } catch (e) {
        console.error(e);
    } finally {
        await ds.destroy();
    }
}

dump();
