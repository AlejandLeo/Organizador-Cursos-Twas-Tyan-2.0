import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { Persona } from '../../../personas/entities/persona.entity';
import { Rol } from '../../../roles/entities/rol.entity';
import { UsuarioRol } from '../../../usuarios-roles/entities/usuario-rol.entity';
import * as bcrypt from 'bcrypt';

export default class SuperadminSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const adminEmail = 'admin@tyan.org';
    const passwordHash = await bcrypt.hash('admin123', 10);

    const userRepository = dataSource.getRepository(Usuario);
    const personaRepository = dataSource.getRepository(Persona);
    const rolRepository = dataSource.getRepository(Rol);
    const usuarioRolRepository = dataSource.getRepository(UsuarioRol);

    // 1. Crear el rol si no existe
    let adminRole = await rolRepository.findOneBy({ id: 1 });
    if (!adminRole) {
      adminRole = await rolRepository.save(rolRepository.create({ id: 1, nombre_rol: 'Super Usuario' }));
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

    // 4. Asignarle el rol
    let usuarioRol = await usuarioRolRepository.findOne({ 
      where: { usuario: { id: adminUser.id }, rol: { id: adminRole.id } } 
    });
    if (!usuarioRol) {
      await usuarioRolRepository.save(usuarioRolRepository.create({
        usuario: adminUser,
        rol: adminRole,
      }));
    }

    console.log('Super Usuario admin@tyan.org verificado y actualizado con nombre: Alejandro Leonardo Tyan Admin');
    console.log('Seeder de Super Usuario completado.');
  }
}
