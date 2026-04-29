import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../../modules/Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../../modules/Usuario/personas/entities/persona.entity';
import { Rol } from '../../../modules/Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../../modules/Usuario/usuarios-roles/entities/usuario-rol.entity';

export default class CoordinadorSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando script de creación de Coordinador...');

    const userRepository = dataSource.getRepository(Usuario);
    const personaRepository = dataSource.getRepository(Persona);
    const rolRepository = dataSource.getRepository(Rol);
    const usuarioRolRepository = dataSource.getRepository(UsuarioRol);

    const email = 'coordinador@gmail.com';

    const existe = await userRepository.findOneBy({ email });
    if (existe) {
      console.log(`El usuario ${email} ya existe en la base de datos.`);
      return;
    }

    const hash = await bcrypt.hash('12345678', 10);

    const usuario = await userRepository.save(userRepository.create({
      email,
      password: hash,
      estado: 1,
    }));
    console.log('Usuario creado.');

    await personaRepository.save(personaRepository.create({
      nombres: 'Admin',
      primer_apellido: 'Coordinador',
      segundo_apellido: 'Sistema',
      documento_identidad: '10000000',
      usuario: usuario,
    }));
    console.log('Perfil de Persona creado.');

    const rolCoordinador = await rolRepository.findOneBy({ id: 2 }); // Coordinador

    if (rolCoordinador) {
      await usuarioRolRepository.save(usuarioRolRepository.create({
        usuario: usuario,
        rol: rolCoordinador,
        estado: 1,
      }));
      console.log('Rol de Coordinador asignado.');
    } else {
      console.error('ALERTA: No se encontró el Rol de Coordinador en la base de datos.');
    }

    console.log(`Coordinador creado con éxito!`);
  }
}
