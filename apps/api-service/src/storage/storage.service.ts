import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private s3Client: S3Client;
    private bucket: string;

    constructor(private configService: ConfigService) {
        this.bucket = this.configService.get('S3_BUCKET') || 'sip-assets';

        this.s3Client = new S3Client({
            endpoint: this.configService.get('S3_ENDPOINT'),
            region: this.configService.get('S3_REGION', 'sgp1'),
            credentials: {
                accessKeyId: this.configService.get('S3_ACCESS_KEY') || '',
                secretAccessKey: this.configService.get('S3_SECRET_KEY') || '',
            },
        });
    }

    async uploadFile(
        file: Buffer,
        key: string,
        contentType: string,
    ): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file,
                ContentType: contentType,
                ACL: 'private',
            });

            await this.s3Client.send(command);

            this.logger.log(`File uploaded successfully: ${key}`);

            return `${this.configService.get('S3_ENDPOINT')}/${this.bucket}/${key}`;
        } catch (error) {
            this.logger.error(`File upload failed: ${key}`, error);
            throw error;
        }
    }

    async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn,
            });

            return signedUrl;
        } catch (error) {
            this.logger.error(`Failed to generate signed URL: ${key}`, error);
            throw error;
        }
    }

    async deleteFile(key: string): Promise<void> {
        // Implement delete logic if needed
        this.logger.log(`Deleting file: ${key}`);
    }
}
