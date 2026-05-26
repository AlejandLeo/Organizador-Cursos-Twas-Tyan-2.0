import { PartialType } from '@nestjs/swagger';
import { CreateSesionAcademicaDto } from './create-sesion-academica.dto';

export class UpdateSesionAcademicaDto extends PartialType(CreateSesionAcademicaDto) {}
