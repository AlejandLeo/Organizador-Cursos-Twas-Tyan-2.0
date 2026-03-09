import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  nota_principal: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_inscripcion: string;
}
