import { PartialType } from '@nestjs/swagger';
import { CreateFirmaDto } from './create-firma.dto';

export class UpdateFirmaDto extends PartialType(CreateFirmaDto) {}
