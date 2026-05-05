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
    
    // IDs de los usuarios de prueba que se ven en tu base de datos
    const idsAEliminar = [13, 14, 15, 16, 17, 18, 19];
    
    console.log(`Eliminando usuarios de prueba: ${idsAEliminar.join(', ')}...`);
    
    for (const id of idsAEliminar) {
      // Borrar registros relacionados en orden para evitar errores de llaves foráneas
      await client.query('DELETE FROM usuarios_roles WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM afiliaciones WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM personas WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM inscripciones WHERE id_usuario = $1', [id]);
      await client.query('DELETE FROM imparticiones WHERE id_usuario = $1', [id]);
      
      // Finalmente borrar el usuario
      await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
    }
    
    console.log('¡Todos los usuarios de prueba fueron eliminados exitosamente de la base de datos!');
    console.log('Ya puedes empezar desde cero con tus registros.');
    
  } catch (err) {
    console.error('Ocurrió un error al limpiar los usuarios:', err);
  } finally {
    await client.end();
  }
}

run();
