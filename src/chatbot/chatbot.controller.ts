import { Body, Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) { }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers('x-line-signature') signature: string) {
    this.logger.log('Received webhook');
    return this.chatbotService.handleEvents(body.events, signature);
  }
}
