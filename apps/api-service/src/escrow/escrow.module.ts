import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { QUEUES } from '@sip/constants';

@Module({
    imports: [
        BullModule.registerQueue({
            name: QUEUES.ESCROW_PAYOUT,
        }),
    ],
    controllers: [EscrowController],
    providers: [EscrowService],
    exports: [EscrowService],
})
export class EscrowModule { }
