import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrainModule } from './brain/brain.module';

@Module({
  imports: [BrainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
