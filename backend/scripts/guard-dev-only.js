/**
 * guard-dev-only.js
 *
 * Guardián de seguridad para comandos destructivos.
 * Verifica que el entorno sea 'development' antes de continuar.
 * Si NODE_ENV=production, aborta la ejecución con código de error.
 *
 * Uso en package.json:
 *   "db:reset": "node scripts/guard-dev-only.js && <comando_destructivo>"
 */
require('dotenv').config();

const env = (process.env.NODE_ENV || 'development').trim();

if (env === 'production') {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════╗');
  console.error('║      OPERACIÓN BLOQUEADA — ENTORNO DE PRODUCCIÓN         ║');
  console.error('╠══════════════════════════════════════════════════════════╣');
  console.error('║  Este comando es DESTRUCTIVO y solo puede ejecutarse     ║');
  console.error('║  en entorno de desarrollo (NODE_ENV=development).        ║');
  console.error('║                                                          ║');
  console.error(`║  NODE_ENV detectado: ${env.padEnd(36)}║`);
  console.error('║                                                          ║');
  console.error('║  Comandos seguros para producción:                       ║');
  console.error('║    npm run migration:revert  (revertir paso a paso)      ║');
  console.error('║    npm run migration:run     (aplicar migraciones)       ║');
  console.error('║    npm run seed:config       (datos base idempotentes)   ║');
  console.error('╚══════════════════════════════════════════════════════════╝');
  console.error('');
  process.exit(1);
}

console.log('');
console.log('[>] Entorno de desarrollo confirmado (NODE_ENV=' + env + ').');
console.log('[X]  Iniciando db:reset — se eliminarán TODOS los datos de la BD...');
console.log('');
