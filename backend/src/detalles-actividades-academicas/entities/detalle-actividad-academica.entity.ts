// Entidad obsoleta (DETALLES_ACTIVIDADES renombrado a CURSO_MODALIDADES en v2). No usar.
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('detalles_actividades_obsoletas')
export class DetalleActividadAcademica {
  @PrimaryGeneratedColumn()
  id_detalle_actividad_academica: number;
}
