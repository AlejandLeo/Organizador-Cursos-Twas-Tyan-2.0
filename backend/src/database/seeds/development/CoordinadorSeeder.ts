import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../../modules/Usuario/usuarios/entities/usuario.entity';
import { Persona } from '../../../modules/Usuario/personas/entities/persona.entity';
import { Rol } from '../../../modules/Usuario/roles/entities/rol.entity';
import { UsuarioRol } from '../../../modules/Usuario/usuarios-roles/entities/usuario-rol.entity';

export default class CoordinadorSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando script de creación de Coordinadores...');

    const userRepository = dataSource.getRepository(Usuario);
    const personaRepository = dataSource.getRepository(Persona);
    const rolRepository = dataSource.getRepository(Rol);
    const usuarioRolRepository = dataSource.getRepository(UsuarioRol);

    let rolCoordinador = await rolRepository.findOne({
      where: [
        { nombre_rol: 'Coordinador' },
        { nombre_rol: 'coordinador' }
      ]
    });

    if (!rolCoordinador) {
      console.error('ALERTA: No se encontró el Rol de Coordinador en la base de datos.');
      return;
    }

    const coordinadoresData = [
      {
        email: 'coordinador@gmail.com',
        nombres: 'Admin',
        primer_apellido: 'Coordinador',
        segundo_apellido: 'Sistema',
        documento_identidad: '10000000',
      },
      {
        email: 'coordinador2@gmail.com',
        nombres: 'Coordinador2',
        primer_apellido: 'Sistema',
        segundo_apellido: '',
        documento_identidad: '10000002',
      }
    ];

    for (const data of coordinadoresData) {
      const existe = await userRepository.findOneBy({ email: data.email });
      let usuario: Usuario | null = existe;

      if (!existe) {
        const hash = await bcrypt.hash('12345678', 10);
        usuario = await userRepository.save(userRepository.create({
          email: data.email,
          password: hash,
          estado: 1,
        }));
        console.log(`Usuario ${data.email} creado.`);

        await personaRepository.save(personaRepository.create({
          nombres: data.nombres,
          primer_apellido: data.primer_apellido,
          segundo_apellido: data.segundo_apellido || undefined,
          documento_identidad: data.documento_identidad,
          usuario: usuario,
        }));
        console.log(`Perfil de Persona creado para ${data.email}.`);
      } else {
        console.log(`El usuario ${data.email} ya existe en la base de datos. Asegurando rol de Coordinador...`);
      }

      if (!usuario) {
        console.error(`Error: No se pudo obtener el usuario para ${data.email}`);
        continue;
      }

      // Asegurar que tenga el rol de coordinador
      const tieneRol = await usuarioRolRepository.findOne({
        where: {
          usuario: { id: usuario.id },
          rol: { id: rolCoordinador.id }
        }
      });

      if (!tieneRol) {
        await usuarioRolRepository.save(usuarioRolRepository.create({
          usuario: usuario,
          rol: rolCoordinador,
          estado: 1,
        }));
        console.log(`Rol de Coordinador asignado a ${data.email}.`);
      } else {
        console.log(`El usuario ${data.email} ya tiene asignado el rol de Coordinador.`);
      }
    }

    console.log(`Creación y validación de Coordinadores completada con éxito!`);
  }
}
