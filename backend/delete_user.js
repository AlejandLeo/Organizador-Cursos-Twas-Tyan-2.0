const { Client } = require('pg');
const email = process.argv[2];

if (!email) {
  console.error('Por favor provee un email: node delete_user.js correo@gmail.com');
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
    
    // Primero obtenemos el id_usuario
    const res = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      console.log(`El usuario ${email} no existe en la base de datos.`);
      process.exit(0);
    }
    
    const userId = res.rows[0].id;
    
    console.log(`Eliminando usuario ${email} (ID: ${userId}) y todos sus registros relacionados...`);
    
    // Al eliminar el usuario, si hay ON DELETE CASCADE configurado, se deberían borrar los relacionados.
    // Pero por si acaso, lo hacemos en orden:
    
    await client.query('DELETE FROM usuarios_roles WHERE usuario_id = $1', [userId]);
    await client.query('DELETE FROM afiliaciones WHERE usuario_id = $1', [userId]);
    await client.query('DELETE FROM personas WHERE usuario_id = $1', [userId]);
    await client.query('DELETE FROM inscripciones WHERE id_usuario = $1', [userId]);
    await client.query('DELETE FROM usuarios WHERE id = $1', [userId]);
    
    console.log(`¡Usuario ${email} eliminado correctamente! Ya puedes volver a registrarte con este correo.`);
    
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
  } finally {
    await client.end();
  }
}

run();
