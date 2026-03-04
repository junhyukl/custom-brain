import { Module } from '@nestjs/common';
import { BrainController } from './brain.controller';
import { BrainService } from './brain.service';
import { RouterService } from './router.service';
import { ModelService } from './model.service';
import { MemoryService } from './memory.service';

@Module({
  controllers: [BrainController],
  providers: [BrainService, RouterService, ModelService, MemoryService],
})
export class BrainModule {}
