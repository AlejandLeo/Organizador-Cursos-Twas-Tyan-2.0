import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUsuarioDto } from './create-usuario.dto';
import { UpdatePerfilDto } from './update-perfil.dto';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {

  @ApiPropertyOptional({ type: UpdatePerfilDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePerfilDto)
  perfil?: UpdatePerfilDto;
}

