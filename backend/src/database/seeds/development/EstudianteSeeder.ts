import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { Persona } from '../../../personas/entities/persona.entity';
import { Rol } from '../../../roles/entities/rol.entity';
import { UsuarioRol } from '../../../usuarios-roles/entities/usuario-rol.entity';
import { Inscripcion } from '../../../inscripciones/entities/inscripcion.entity';
import { ActividadAcademica } from '../../../actividades-academicas/entities/actividad-academica.entity';

export default class EstudianteSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Iniciando script de creación de Estudiante...');

    const userRepository = dataSource.getRepository(Usuario);
    const personaRepository = dataSource.getRepository(Persona);
    const rolRepository = dataSource.getRepository(Rol);
    const usuarioRolRepository = dataSource.getRepository(UsuarioRol);
    const inscripcionRepository = dataSource.getRepository(Inscripcion);
    const actividadRepository = dataSource.getRepository(ActividadAcademica);

    const email = 'estudiante@gmail.com';

    const existe = await userRepository.findOneBy({ email });
    let usuarioGuardado = existe;

    if (!existe) {
      const hash = await bcrypt.hash('12345678', 10);

      const usuario = await userRepository.save(userRepository.create({
        email,
        password: hash,
        estado: 1,
      }));
      usuarioGuardado = usuario;
      console.log('Usuario creado.');

      await personaRepository.save(personaRepository.create({
        nombres: 'Alumno',
        primer_apellido: 'Prueba',
        segundo_apellido: 'Estudiante',
        documento_identidad: '20000000',
        usuario: usuarioGuardado,
      }));
      console.log('Perfil de Persona creado.');

      const rol = await rolRepository.findOneBy({ id: 4 }); // Estudiante

      if (rol) {
        await usuarioRolRepository.save(usuarioRolRepository.create({
          usuario: usuarioGuardado,
          rol: rol,
          estado: 1,
        }));
        console.log('Rol de Estudiante asignado.');
      } else {
        console.error('ALERTA: No se encontró el Rol de Estudiante en la base de datos.');
      }
    }

    if (usuarioGuardado) {
      await inscripcionRepository.delete({ usuario: { id: usuarioGuardado.id } });

      console.log('Generando inscripciones de prueba...');
      const actividades = await actividadRepository.find();
      if (actividades.length >= 4) {
         await inscripcionRepository.save(inscripcionRepository.create({
           usuario: usuarioGuardado,
           actividadAcademica: actividades[0],
           estado: 1,
           razon: 'Deseo aprender.',
           miembro_tyan: 1
         }));

         await inscripcionRepository.save(inscripcionRepository.create({
           usuario: usuarioGuardado,
           actividadAcademica: actividades[1],
           estado: 0,
           razon: 'Espero me acepten test.',
           miembro_tyan: 0
         }));

         await inscripcionRepository.save(inscripcionRepository.create({
           usuario: usuarioGuardado,
           actividadAcademica: actividades[2],
           estado: 2,
           razon: 'Para ver.',
           miembro_tyan: 0
         }));

         await inscripcionRepository.save(inscripcionRepository.create({
           usuario: usuarioGuardado,
           actividadAcademica: actividades[3],
           estado: 3,
           razon: 'Interesado en finalizarlo.',
           miembro_tyan: 1,
           nota_principal: 95.5
         }));

         console.log('Se han creado 4 inscripciones (Aprobado, Pendiente, Rechazado, Finalizado).');
      }
    }

    console.log(`Estudiante creado con éxito! (estudiante@gmail.com / 12345678)`);
  }
}
