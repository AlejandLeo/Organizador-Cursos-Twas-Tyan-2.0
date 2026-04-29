import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Usuario } from '../../../modules/Usuario/usuarios/entities/usuario.entity';

export default class CleanUsersSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    console.log('Limpiando usuarios sembrados...');
    const userRepo = dataSource.getRepository(Usuario);
    for (const email of ['coordinador@gmail.com', 'estudiante@gmail.com', 'ponente@gmail.com', 'warshi@gmail.com', 'ranga@gmail.com', 'pablo@gmail.com', 'gloria@gmail.com', 'federico@gmail.com']) {
        const u = await userRepo.findOne({ where: { email } });
        if (u) {
            await dataSource.query('DELETE FROM usuarios_roles WHERE id_usuario = $1', [u.id]);
            await userRepo.remove(u);
            console.log(`Usuario eliminado: ${email}`);
        }
    }
  }
}
