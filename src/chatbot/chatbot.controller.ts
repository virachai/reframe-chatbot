import type { WebhookEvent } from '@line/bot-sdk';
import { Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import type { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('webhook')
  async handleWebhook(
    @Body() body: { events: WebhookEvent[] },
    @Headers('x-line-signature') signature: string,
  ) {
    this.logger.log('Received webhook');
    return this.chatbotService.handleEvents(body.events, signature);
  }
}
