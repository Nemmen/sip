import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { QUEUES } from '@sip/constants';

@Module({
    imports: [
        BullModule.registerQueue({
            name: QUEUES.KYC_CHECK,
        }),
    ],
    controllers: [KycController],
    providers: [KycService],
    exports: [KycService],
})
export class KycModule { }
