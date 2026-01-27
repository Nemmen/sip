import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3001);

    // Security
    app.use(helmet());
    app.use(compression());

    // CORS
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
        credentials: true,
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger Documentation
    const config = new DocumentBuilder()
        .setTitle('SIP API')
        .setDescription('Student Internship Portal API Documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('students', 'Student operations')
        .addTag('employers', 'Employer operations')
        .addTag('internships', 'Internship management')
        .addTag('applications', 'Application management')
        .addTag('kyc', 'KYC verification')
        .addTag('escrow', 'Escrow & payments')
        .addTag('messages', 'Messaging system')
        .addTag('notifications', 'Notifications')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(port);

    console.log(`🚀 SIP API running on: http://localhost:${port}`);
    console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
