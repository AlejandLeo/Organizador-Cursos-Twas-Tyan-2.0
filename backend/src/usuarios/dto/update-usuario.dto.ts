import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUsuarioDto } from './create-usuario.dto';


export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {


}

