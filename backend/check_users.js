const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'eventos_academicos_db',
  password: '123456',
  port: 5432,
});

async function run() {
  try {
    await client.connect();
    
    const res = await client.query('SELECT id, email, password, estado FROM usuarios ORDER BY id DESC LIMIT 5');
    console.log(res.rows);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
