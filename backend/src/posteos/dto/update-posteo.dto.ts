import { PartialType } from '@nestjs/swagger';
import { CreatePosteoDto } from './create-posteo.dto';

export class UpdatePosteoDto extends PartialType(CreatePosteoDto) {}
