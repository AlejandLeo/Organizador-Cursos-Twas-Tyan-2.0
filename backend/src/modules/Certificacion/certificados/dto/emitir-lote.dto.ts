import { IsArray, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EmitirLoteDto {
  @ApiProperty({ example: 1, description: 'ID de la Información de Certificado origen' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_info_certificado: number;

  @ApiProperty({ example: 1, description: 'ID de la Actividad Académica' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id_actividad_academica: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Arreglo con los IDs de los usuarios que recibirán el certificado',
  })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  personasIds: number[];

  @ApiProperty({ example: 'Firma de director' })
  @IsNotEmpty()
  @IsString()
  firma: string;
}
