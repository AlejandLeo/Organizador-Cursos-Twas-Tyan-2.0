import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Evento } from '../../../Academico/eventos/entities/evento.entity';
import { Certificado } from '../../../Certificacion/certificados/entities/certificado.entity';

/**
 * INFO_CERTIFICADOS — plantilla de texto para un evento.
 *
 * Cambio v2: la FK cambia de id_version_evento → id_evento.
 * (Se eliminó VERSIONES_EVENTOS.)
 *
 * cabecera: texto del encabezado del certificado.
 * tenor: cuerpo del texto. Usa marcadores como [NOMBRE], [TIPO], [ACTIVIDAD].
 *
 * Ejemplo de tenor:
 *   "Se certifica que [NOMBRE] ha participado como [TIPO] en
 *    [ACTIVIDAD], celebrado en La Paz, Bolivia, del 14 al 18 de julio de 2025."
 *
 * NestJS reemplaza los marcadores con los datos reales al generar el PDF.
 */
@Entity('info_certificados')
export class InfoCertificado {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'text', nullable: true })
  cabecera: string;

  @Column({ type: 'text', nullable: true })
  tenor: string;

  /** Imagen de fondo del certificado (URL o nombre de archivo) */
  @Column({ type: 'text', nullable: true })
  fondo_url: string;

  /** Tipo de rol al que aplica: 1=Asistente, 2=Expositor, 3=Organizador, 4=Docente, etc. */
  @Column({ type: 'integer', nullable: true })
  tipo: number;

  /** Flag para distinguir si es certificado de Excelencia Académica (1) o Participación Regular (0) */
  @Column({ type: 'integer', default: 0 })
  es_excelencia: number;

  /** JSON con las posiciones (x,y), fuentes y otros metadatos del diseño visual del certificado */
  @Column({ type: 'jsonb', nullable: true })
  configuracion: any;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** Esta plantilla pertenece a un evento. */
  @ManyToOne(() => Evento, (evento) => evento.infosCertificados)
  @JoinColumn({ name: 'id_evento' })
  evento: Evento;

  @OneToMany(() => Certificado, (cert) => cert.infoCertificado)
  certificados: Certificado[];

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
