const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Cargar el archivo .env actual
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Probador de Conexión SMTP ---');
console.log('Host:', process.env.MAIL_HOST);
console.log('Port:', process.env.MAIL_PORT);
console.log('User:', process.env.MAIL_USER);
console.log('From:', process.env.MAIL_FROM);
console.log('---------------------------------');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('Verificando autenticación...');

transporter.verify((error, success) => {
  if (error) {
    console.error('[X] ERROR DE AUTENTICACIÓN:');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Comando:', error.command);

    if (error.message.includes('BadCredentials') || error.message.includes('535')) {
      console.log('\n> SUGERENCIA:');
      console.log('1. Verifica que MAIL_USER sea el correo completo (ej: usuario@gmail.com).');
      console.log('2. Si usas Gmail, verifica que la "Contraseña de Aplicación" sea de 16 letras.');
      console.log('3. Asegúrate de que no haya espacios adicionales al final de las líneas en el archivo .env.');
    }
  } else {
    console.log('[CONEXIÓN EXITOSA] El servidor SMTP está listo para enviar correos.');
  }
  process.exit();
});
