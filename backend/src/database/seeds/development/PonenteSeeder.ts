import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { Persona } from '../../../personas/entities/persona.entity';
import { Rol } from '../../../roles/entities/rol.entity';
import { UsuarioRol } from '../../../usuarios-roles/entities/usuario-rol.entity';

export default class PonenteSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando script de creación de múltiples Ponentes...');

    const userRepository = dataSource.getRepository(Usuario);
    const personaRepository = dataSource.getRepository(Persona);
    const rolRepository = dataSource.getRepository(Rol);
    const usuarioRolRepository = dataSource.getRepository(UsuarioRol);

    const ponentes = [
      { email: 'warshi@gmail.com', password: 'password123', nombres: 'Warshi', ap1: 'Dandeniya', ap2: '' },
      { email: 'ranga@gmail.com', password: 'password123', nombres: 'Ranga', ap1: 'Ambati', ap2: '' },
      { email: 'pablo@gmail.com', password: 'password123', nombres: 'Pablo', ap1: 'Bolaños', ap2: 'Villegas' },
      { email: 'gloria@gmail.com', password: 'password123', nombres: 'Gloria', ap1: 'Rodrigo', ap2: '' },
      { email: 'federico@gmail.com', password: 'password123', nombres: 'Federico', ap1: 'Brown', ap2: '' },
      { email: 'ponente@gmail.com', password: '12345678', nombres: 'Experto', ap1: 'Prueba', ap2: 'Ponente' }
    ];

    const rol = await rolRepository.findOneBy({ id: 5 }); // Ponente

    if (!rol) {
      console.error('ALERTA: No se encontró el Rol de Ponente en la base de datos.');
      return;
    }

    for (const p of ponentes) {
        const existe = await userRepository.findOneBy({ email: p.email });
        if (existe) {
          console.log(`El usuario ${p.email} ya existe en la base de datos. Saltando...`);
          continue;
        }

        const hash = await bcrypt.hash(p.password, 10);
        const usuario = await userRepository.save(userRepository.create({
          email: p.email,
          password: hash,
          estado: 1,
        }));

        await personaRepository.save(personaRepository.create({
          nombres: p.nombres,
          primer_apellido: p.ap1,
          segundo_apellido: p.ap2,
          documento_identidad: Math.floor(10000000 + Math.random() * 90000000).toString(),
          usuario: usuario,
        }));

        await usuarioRolRepository.save(usuarioRolRepository.create({
          usuario: usuario,
          rol: rol,
          estado: 1,
        }));
        
        console.log(`Ponente creado: ${p.nombres} ${p.ap1} (${p.email})`);
    }

    console.log(`Seeder de ponentes finalizado con éxito!`);
  }
}
