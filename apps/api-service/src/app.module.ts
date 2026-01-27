import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InternshipsModule } from './internships/internships.module';
import { ApplicationsModule } from './applications/applications.module';
import { KycModule } from './kyc/kyc.module';
import { EscrowModule } from './escrow/escrow.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Rate Limiting
        ThrottlerModule.forRoot([
            {
                ttl: 60000, // 1 minute
                limit: 100, // 100 requests per minute
            },
        ]),

        // Redis & Queues
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
            },
        }),

        // Core Modules
        PrismaModule,
        AuthModule,
        UsersModule,
        InternshipsModule,
        ApplicationsModule,
        KycModule,
        EscrowModule,
        MessagingModule,
        NotificationsModule,
        AuditModule,
        StorageModule,
        QueueModule,
        WebsocketModule,
    ],
})
export class AppModule { }
