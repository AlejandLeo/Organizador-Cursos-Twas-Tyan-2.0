import { PartialType } from '@nestjs/swagger';
import { CreateImparticionDto } from './create-imparticion.dto';

export class UpdateImparticionDto extends PartialType(CreateImparticionDto) {}
