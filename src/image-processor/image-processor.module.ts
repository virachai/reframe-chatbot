import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';

@Module({
  imports: [HttpModule],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule { }
