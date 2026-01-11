import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { firstValueFrom } from 'rxjs';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  private readonly bedrockClient: BedrockRuntimeClient;

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async uploadImage(imageBuffer: Buffer): Promise<UploadApiResponse> {
    return this.cloudinaryService.uploadBuffer(imageBuffer, 'reframe-chatbot/original');
  }

  async uploadFromUrl(url: string): Promise<UploadApiResponse> {
    return cloudinary.uploader.upload(url, {
      folder: 'reframe-chatbot/original',
    });
  }

  /**
   * Generates Rule of Thirds variations
   * We use Cloudinary's 'g_auto:person' to detect the person.
   * To achieve true Rule of Thirds, we'd ideally want to shift the person to the intersections.
   */
  /**
   * Default Option: Amazon Rekognition via Cloudinary Add-on
   * Supports both Auto Tagging and Object Detection (Coordinates)
   */
  async detectWithRekognition(buffer: Buffer) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'reframe-chatbot/detection',
            aws_rek_detection: 0.5, // Detect objects and bounding boxes
            aws_rek_tagging: 0.5, // Generate tags for search
            auto_tagging: 0.5,
          },
          (error, result) => {
            if (error) return reject(error);

            // Extract detection data (bounding boxes) and tags
            const detectionData = result?.info?.detection?.object_detection?.data || [];
            const tags = result?.tags || [];

            resolve({ tags, detections: detectionData });
          },
        )
        .end(buffer);
    });
  }

  /**
   * Option 1: Cloudinary AI Object Detection
   */
  async detectWithCloudinary(buffer: Buffer) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'reframe-chatbot/detection',
            detection: 'gs_object_detection', // Google Scene & Object Detection
            auto_tagging: 0.5,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.info?.detection?.object_detection?.data || []);
          },
        )
        .end(buffer);
    });
  }

  /**
   * Option 2: AWS Lambda Object Detection (MediaPipe)
   */
  async detectWithLambda(imageBuffer: Buffer) {
    const apiUrl = this.configService.get<string>('AWS_LAMBDA_API_URL');
    const apiKey = this.configService.get<string>('AWS_LAMBDA_API_KEY');

    if (!apiUrl || !apiKey) {
      this.logger.warn('AWS Lambda API configuration is missing');
      return null;
    }

    try {
      const base64Image = imageBuffer.toString('base64');
      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          { image: base64Image },
          {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error calling AWS Lambda:', error.message);
      return null;
    }
  }

  /**
   * Option 3: Amazon Bedrock (Claude 3 Vision) for Sophisticated Detection/Captioning
   */
  async detectWithBedrock(imageBuffer: Buffer) {
    try {
      const modelId =
        this.configService.get<string>('BEDROCK_MODEL_ID') ||
        'anthropic.claude-3-haiku-20240307-v1:0';
      const base64Image = imageBuffer.toString('base64');

      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: 'Detect all objects in this image and return as a JSON list of objects with labels and brief descriptions of their positions.',
              },
            ],
          },
        ],
      };

      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await this.bedrockClient.send(command);
      const decodedResponse = new TextDecoder().decode(response.body);
      return JSON.parse(decodedResponse);
    } catch (error) {
      this.logger.error('Error calling Amazon Bedrock:', error.message);
      return null;
    }
  }

  async getRuleOfThirdsVariations(publicId: string) {
    // Professional zones
    const variations = [
      {
        zone: 'Top-Left Power Point',
        transform: [
          {
            width: 1080,
            height: 1350,
            crop: 'fill',
            gravity: 'auto:person',
            zoom: '0.8',
          },
          // Note: Real "positioning" in third usually requires knowing coordinates.
          // Cloudinary's g_auto:person is a great start.
        ],
      },
      {
        zone: 'Top-Right Power Point',
        transform: [
          {
            width: 1080,
            height: 1350,
            crop: 'fill',
            gravity: 'auto:person',
            zoom: '0.9',
          },
        ],
      },
      {
        zone: 'Left Vertical Third',
        transform: [
          {
            width: 1080,
            height: 1920,
            crop: 'fill',
            gravity: 'auto:person',
            aspect_ratio: '9:16',
          },
        ],
      },
      {
        zone: 'Right Vertical Third',
        transform: [
          {
            width: 1080,
            height: 1920,
            crop: 'fill',
            gravity: 'auto:person',
            aspect_ratio: '9:16',
          },
        ],
      },
      {
        zone: 'Atmospheric Storytelling',
        transform: [
          {
            width: 1920,
            height: 1080,
            crop: 'fill',
            gravity: 'auto:person',
            zoom: '0.5',
          },
        ],
      },
    ];

    return variations.map((v) => ({
      zone: v.zone,
      url: cloudinary.url(publicId, {
        transformation: v.transform,
        secure: true,
      }),
    }));
  }
}
