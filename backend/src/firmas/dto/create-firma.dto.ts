import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFirmaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUrl()
  url_firma: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id_usuario: string;
}
