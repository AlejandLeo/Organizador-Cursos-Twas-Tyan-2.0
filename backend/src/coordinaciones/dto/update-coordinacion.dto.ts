import { PartialType } from '@nestjs/swagger';
import { CreateCoordinacionDto } from './create-coordinacion.dto';

export class UpdateCoordinacionDto extends PartialType(CreateCoordinacionDto) {}
