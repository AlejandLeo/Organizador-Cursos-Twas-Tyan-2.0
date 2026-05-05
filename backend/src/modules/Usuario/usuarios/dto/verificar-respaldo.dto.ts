import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerificarRespaldoDto {
  @ApiProperty({
    description: 'Documento de Identidad (CI) con extensión si aplica',
    example: '1234567LP',
  })
  @IsNotEmpty({ message: 'La contraseña de respaldo es obligatoria.' })
  @IsString()
  ci: string;
}
