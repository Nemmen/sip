import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '@sip/constants';
import { EscrowProcessor } from './processors/escrow.processor';
import { KycProcessor } from './processors/kyc.processor';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
    imports: [
        BullModule.registerQueue(
            { name: QUEUES.ESCROW_PAYOUT },
            { name: QUEUES.KYC_CHECK },
            { name: QUEUES.NOTIFICATIONS },
            { name: QUEUES.AI_MATCHING },
        ),
    ],
    providers: [EscrowProcessor, KycProcessor, NotificationProcessor],
    exports: [BullModule],
})
export class QueueModule { }
