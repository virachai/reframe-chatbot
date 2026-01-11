import { Module } from '@nestjs/common';
import { ImageProcessorModule } from '../image-processor/image-processor.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [ImageProcessorModule],
  providers: [ChatbotService],
  controllers: [ChatbotController],
})
export class ChatbotModule { }
