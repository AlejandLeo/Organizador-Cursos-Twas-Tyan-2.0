const { Client } = require('pg');
const bcrypt = require('bcrypt');
const email = process.argv[2];
const newPassword = process.argv[3] || '123456789';

if (!email) {
  console.error('Uso: node reset_password.js correo@gmail.com [nueva_clave]');
  process.exit(1);
}

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
    
    const hash = await bcrypt.hash(newPassword, 10);
    
    const res = await client.query('UPDATE usuarios SET password = $1, estado = 1 WHERE email = $2 RETURNING id', [hash, email]);
    
    if (res.rowCount > 0) {
      console.log(`¡Contraseña reseteada con éxito para ${email}!`);
      console.log(`Nueva contraseña: ${newPassword}`);
      console.log(`Estado: Activo`);
    } else {
      console.log(`No se encontró ningún usuario con el correo: ${email}`);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
