import { Injectable, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(imageBuffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'reframe-chatbot/original' },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed: No result'));
          resolve(result);
        },
      );
      uploadStream.end(imageBuffer);
    });
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
