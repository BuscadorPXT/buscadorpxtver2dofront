import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from '../settings/entities/system-settings.entity';

@Injectable()
export class UploadService {
  private s3Client: S3Client;

  constructor(
    @InjectRepository(SystemSettings)
    private settingsRepository: Repository<SystemSettings>,
  ) {
    this.initializeS3Client();
  }

  private async initializeS3Client() {
    const settings = await this.getR2Settings();
    
    if (settings.r2AccountId && settings.r2AccessKeyId && settings.r2SecretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${settings.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: settings.r2AccessKeyId,
          secretAccessKey: settings.r2SecretAccessKey,
        },
      });
    }
  }

  private async getR2Settings() {
    const settings = await this.settingsRepository.findOne({ 
      where: [{ id: 1 }, { key: 'system' }] 
    });
    return {
      r2AccountId: settings?.r2AccountId || '',
      r2AccessKeyId: settings?.r2AccessKeyId || '',
      r2SecretAccessKey: settings?.r2SecretAccessKey || '',
      r2BucketName: settings?.r2BucketName || '',
      r2PublicUrl: settings?.r2PublicUrl || '',
    };
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'partners'): Promise<string> {
    if (!this.s3Client) {
      await this.initializeS3Client();
    }

    if (!this.s3Client) {
      throw new InternalServerErrorException('R2 not configured');
    }

    const settings = await this.getR2Settings();
    
    if (!settings.r2BucketName) {
      throw new InternalServerErrorException('R2 bucket name not configured');
    }

    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${file.originalname.replace(/\s+/g, '-')}`;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: settings.r2BucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      await upload.done();

      const publicUrl = settings.r2PublicUrl 
        ? `${settings.r2PublicUrl}/${fileName}`
        : `https://${settings.r2AccountId}.r2.cloudflarestorage.com/${settings.r2BucketName}/${fileName}`;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3Client) {
      await this.initializeS3Client();
    }

    if (!this.s3Client) {
      return;
    }

    const settings = await this.getR2Settings();
    
    if (!settings.r2BucketName) {
      return;
    }

    try {
      const fileName = fileUrl.split('/').slice(-2).join('/');
      
      const command = new DeleteObjectCommand({
        Bucket: settings.r2BucketName,
        Key: fileName,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from R2:', error);
    }
  }

  async reinitialize(): Promise<void> {
    await this.initializeS3Client();
  }
}
