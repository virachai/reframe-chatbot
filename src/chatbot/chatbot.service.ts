import {
  Client,
  type ImageEventMessage,
  type MessageEvent,
  validateSignature,
  type WebhookEvent,
} from '@line/bot-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageProcessorService } from '../image-processor/image-processor.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly lineClient: Client;

  constructor(
    private configService: ConfigService,
    private imageProcessorService: ImageProcessorService,
  ) {
    const accessToken = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN');
    const channelSecret = this.configService.get<string>('LINE_CHANNEL_SECRET');

    if (!accessToken || !channelSecret) {
      throw new Error('LINE credentials are missing');
    }

    this.lineClient = new Client({
      channelAccessToken: accessToken,
      channelSecret: channelSecret,
    });
  }

  async handleEvents(events: WebhookEvent[], signature: string) {
    const channelSecret = this.configService.get<string>('LINE_CHANNEL_SECRET')!;
    if (!validateSignature(JSON.stringify({ events }), channelSecret, signature)) {
      // this.logger.error('Invalid signature');
      // return;
    }

    for (const event of events) {
      if (event.type === 'message') {
        await this.handleMessage(event);
      }
    }
  }

  private async handleMessage(event: MessageEvent) {
    const { message, replyToken } = event;

    if (message.type === 'image') {
      await this.processImageMessage(event, message as ImageEventMessage, replyToken);
    } else if (message.type === 'text') {
      await this.lineClient.replyMessage(replyToken, {
        type: 'text',
        text: 'Please send me a photo to reframe professionally!',
      });
    }
  }

  private async processImageMessage(
    event: MessageEvent,
    message: ImageEventMessage,
    replyToken: string,
  ) {
    try {
      // Send initial response
      await this.lineClient.replyMessage(replyToken, {
        type: 'text',
        text: 'Analyzing your photo professionally... 📸',
      });

      // Get image content from LINE
      const stream = await this.lineClient.getMessageContent(message.id);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      const buffer = Buffer.concat(chunks);

      // Upload to Cloudinary
      const uploadResult = await this.imageProcessorService.uploadImage(buffer);
      this.logger.log('Image uploaded to Cloudinary:', uploadResult.public_id);

      // Generate Rule of Thirds variations
      const variations = await this.imageProcessorService.getRuleOfThirdsVariations(
        uploadResult.public_id,
      );

      // Send variations back to LINE as a carousel
      const userId = event.source.userId;
      if (!userId) return;

      await this.lineClient.pushMessage(userId, {
        type: 'template',
        altText: 'Here are your professional reframes',
        template: {
          type: 'carousel',
          columns: variations.slice(0, 5).map((v) => ({
            thumbnailImageUrl: v.url,
            imageBackgroundColor: '#000000',
            title: v.zone,
            text: 'Professional Composition',
            actions: [
              {
                type: 'uri',
                label: 'View Full Image',
                uri: v.url,
              },
            ],
          })),
        },
      });
    } catch (error) {
      this.logger.error('Error processing image:', error);
    }
  }
}
