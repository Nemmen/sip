import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
    constructor(private readonly storageService: StorageService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: any,
        @CurrentUser() user: any,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Validate file type (only PDFs and common document formats)
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                'Invalid file type. Only PDF and Word documents are allowed.',
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('File size exceeds 5MB limit');
        }

        // Generate unique key
        const timestamp = Date.now();
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `resumes/${user.id}/${timestamp}-${sanitizedFilename}`;

        // Upload to S3
        const url = await this.storageService.uploadFile(
            file.buffer,
            key,
            file.mimetype,
        );

        return {
            url,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }
}
