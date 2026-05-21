import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from '../../../modules/Usuario/usuarios/entities/usuario.entity';
import { Rol } from '../../../modules/Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../../modules/Usuario/usuarios-roles/entities/usuario-rol.entity';
import * as bcrypt from 'bcrypt';

export default class SuperAdminSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const usuarioRepository = dataSource.getRepository(Usuario);
    const rolRepository = dataSource.getRepository(Rol);
    const usuarioRolRepository = dataSource.getRepository(UsuarioRol);

    // 1. Obtener el correo del entorno (prioriza SUPERADMIN_EMAIL sobre MAIL_USER)
    const email = process.env.SUPERADMIN_EMAIL || process.env.MAIL_USER;

    if (!email) {
      console.warn('⚠️ No se ha definido SUPERADMIN_EMAIL ni MAIL_USER en .env');
      console.warn('No se puede crear el Super Usuario por defecto.');
      return;
    }

    const passwordOriginal = process.env.SUPERADMIN_PASSWORD || email;

    // 2. Buscar si el usuario ya existe
    const existe = await usuarioRepository.findOneBy({ email });
    if (existe) {
      console.log(`El usuario ${email} ya existe en la base de datos. Saltando seeder.`);
      return;
    }

    // 3. Buscar el rol de Super Usuario (ID 1)
    const superRol = await rolRepository.findOneBy({ id: 1 });
    if (!superRol) {
      console.error('❌ El rol de Super Usuario (ID 1) no existe. Ejecute el RoleSeeder primero.');
      return;
    }

    // 4. Crear el usuario
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(passwordOriginal as string, saltRounds);

    const nuevoUsuario = usuarioRepository.create({
      email,
      password: passwordHash,
      estado: 1, // Activo
    });

    const guardadoUsuario = await usuarioRepository.save(nuevoUsuario);

    // 5. Asignar el rol
    const usuarioRol = usuarioRolRepository.create({
      usuario: guardadoUsuario,
      rol: superRol,
      estado: 1,
    });
    await usuarioRolRepository.save(usuarioRol);

    console.log(`✅ Super Usuario creado exitosamente!`);
    console.log(`   Email: ${email}`);
    console.log(`   Password temporal: ${passwordOriginal}`);
    console.log(`   Por favor, cambie esta contraseña inmediatamente tras el primer inicio de sesión.`);
  }
}
