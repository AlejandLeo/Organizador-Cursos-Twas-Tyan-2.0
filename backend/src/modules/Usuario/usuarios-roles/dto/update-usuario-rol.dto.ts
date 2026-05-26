import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioRolDto } from './create-usuario-rol.dto';

export class UpdateUsuarioRolDto extends PartialType(CreateUsuarioRolDto) {}
