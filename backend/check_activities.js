const { Client } = require('pg');
require('dotenv').config();

async function checkActivities() {
    const client = new Client({
        connectionString: "postgresql://postgres:123456@localhost:5432/eventos_academicos_db"
    });

    try {
        await client.connect();
        const res = await client.query('SELECT id, nombre, estado FROM actividades_academicas ORDER BY id DESC LIMIT 5');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkActivities();
