import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ImageProcessorService } from './image-processor.service';

@Module({
  imports: [HttpModule, CloudinaryModule],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule {}
