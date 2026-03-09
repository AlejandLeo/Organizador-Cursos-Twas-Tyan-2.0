import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PosteosService } from './posteos.service';
import { CreatePosteoDto } from './dto/create-posteo.dto';
import { UpdatePosteoDto } from './dto/update-posteo.dto';

@Controller('posteos')
export class PosteosController {
  constructor(private readonly posteosService: PosteosService) {}

  @Post()
  create(@Body() createPosteoDto: CreatePosteoDto) {
    return this.posteosService.create(createPosteoDto);
  }

  @Get()
  findAll() {
    return this.posteosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.posteosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePosteoDto: UpdatePosteoDto) {
    return this.posteosService.update(id, updatePosteoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.posteosService.remove(id);
  }
}
