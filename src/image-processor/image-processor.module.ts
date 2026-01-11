import { Module } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';

@Module({
  providers: [ImageProcessorService],
})
export class ImageProcessorModule {}
