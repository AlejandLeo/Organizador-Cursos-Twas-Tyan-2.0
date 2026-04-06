import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotaDto {
  @ApiProperty({ example: 95, description: 'Nota final obtenida' })
  @IsNotEmpty()
  @IsNumber()
  nota_principal: number;

  @ApiProperty({ example: 'uuid-inscripcion-123', description: 'ID de la inscripción asociada' })
  @IsNotEmpty()
  @IsString()
  id_inscripcion: string;
}
