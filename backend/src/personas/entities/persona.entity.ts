import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

/**
 * PERSONAS — datos personales del usuario.
 *
 * ¿Por qué separar PERSONAS de USUARIOS?
 * USUARIOS guarda *credenciales* (email + password).
 * PERSONAS guarda *datos personales* (nombre, DNI, etc.).
 * Así, si mañana cambias el sistema de login, los datos personales
 * no se ven afectados.
 *
 * Relación 1-a-1 con USUARIOS: un usuario = una persona.
 * ON DELETE CASCADE: si se elimina el usuario, su perfil se elimina también.
 *
 * firma_dig: UUID que apunta al archivo de firma digital en el servidor.
 * No se guarda la ruta directa por seguridad.
 */
@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ length: 100, nullable: true })
  nombres: string;

  @Column({ length: 100, nullable: true })
  primer_apellido: string;

  @Column({ length: 100, nullable: true })
  segundo_apellido: string;

  @Column({ length: 50, nullable: true })
  documento_identidad: string;

  /**
   * Género del usuario:
   * 0: Masculino
   * 1: Femenino
   * 2: Otro
   * 3: Prefiero no decir
   */
  @Column({ type: 'integer', nullable: true })
  genero: number;

  @Column({ length: 100, nullable: true })
  pais_origen: string;

  @Column({ length: 100, nullable: true })
  pais_residencia: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ length: 20, nullable: true })
  celular: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;

  /** UUID para localizar el archivo de firma digital en el servidor. */
  @Column({ length: 255, nullable: true })
  firma_dig: string;

  /** Flag para indicar si el usuario ya finalizó su registro de perfil. */
  @Column({ type: 'boolean', default: false })
  perfil_completado: boolean;

  // ── Relación ─────────────────────────────────────────────────────────────

  /**
   * OneToOne con UNIQUE en la FK garantiza la relación 1-a-1.
   * @JoinColumn indica que la columna id_usuario vive en esta tabla (PERSONAS).
   * onDelete: 'CASCADE' → si se borra el usuario, se borra la persona.
   */
  @OneToOne(() => Usuario, (usuario) => usuario.persona, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
