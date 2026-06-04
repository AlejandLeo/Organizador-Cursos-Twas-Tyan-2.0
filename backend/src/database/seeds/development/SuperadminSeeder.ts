import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from '../../../modules/Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../../modules/Usuario/personas/entities/persona.entity';
import { Rol } from '../../../modules/Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../../modules/Usuario/usuarios-roles/entities/usuario-rol.entity';
import * as bcrypt from 'bcrypt';

// ID de Super Usuario según la migración principal (NO crear rol ID=1)
const SUPER_USUARIO_ROL_ID = 6;

export default class SuperadminSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const adminEmail = 'admin@tyan.org';
    const passwordHash = await bcrypt.hash('admin123', 10);

    const userRepository = dataSource.getRepository(Usuario);
    const personaRepository = dataSource.getRepository(Persona);
    const rolRepository = dataSource.getRepository(Rol);
    const usuarioRolRepository = dataSource.getRepository(UsuarioRol);

    // 1. Verificar que exista el rol Super Usuario (ID=6) en la BD
    const adminRole = await rolRepository.findOneBy({ id: SUPER_USUARIO_ROL_ID });
    if (!adminRole) {
      throw new Error(`[SuperadminSeeder] ERROR: Rol 'Super Usuario' (ID=${SUPER_USUARIO_ROL_ID}) no encontrado. Ejecuta primero la migración de roles.`);
    }

    // 2. Crear al usuario si no existe
    let adminUser = await userRepository.findOneBy({ email: adminEmail });
    if (!adminUser) {
      adminUser = await userRepository.save(userRepository.create({
        email: adminEmail,
        password: passwordHash,
        estado: 1,
      }));
    }

    // 3. Crear o actualizar su perfil en 'Persona'
    let persona = await personaRepository.findOne({ where: { usuario: { id: adminUser.id } } });
    if (!persona) {
      persona = await personaRepository.save(personaRepository.create({
        nombres: 'Alejandro Leonardo',
        primer_apellido: 'Tyan',
        segundo_apellido: 'Admin',
        usuario: adminUser,
      }));
    } else {
      persona.nombres = 'Alejandro Leonardo';
      persona.primer_apellido = 'Tyan';
      persona.segundo_apellido = 'Admin';
      await personaRepository.save(persona);
    }

    // 4. Asignarle el rol Super Usuario (ID=6) si aún no lo tiene
    const tieneRolCorrecto = await usuarioRolRepository.findOne({
      where: { usuario: { id: adminUser.id }, rol: { id: SUPER_USUARIO_ROL_ID } }
    });
    if (!tieneRolCorrecto) {
      await usuarioRolRepository.save(usuarioRolRepository.create({
        usuario: adminUser,
        rol: adminRole,
      }));
      console.log(`[SuperadminSeeder] Rol Super Usuario (ID=${SUPER_USUARIO_ROL_ID}) asignado a ${adminEmail}.`);
    }

    // 5. Limpiar asignaciones huérfanas (rol null o rol ID=1 que ya no debería existir)
    const todasAsignaciones = await usuarioRolRepository.find({
      where: { usuario: { id: adminUser.id } },
      relations: ['rol'],
    });
    for (const ur of todasAsignaciones) {
      if (!ur.rol || ur.rol.id === 1) {
        await usuarioRolRepository.delete(ur.id);
        console.log(`[SuperadminSeeder] Eliminada asignación huérfana UsuarioRol id=${ur.id} (rol_id=${ur.rol?.id ?? 'null'})`);
      }
    }

    console.log('Super Usuario admin@tyan.org verificado y actualizado con nombre: Alejandro Leonardo Tyan Admin');
    console.log('Seeder de Super Usuario completado.');
  }
}
