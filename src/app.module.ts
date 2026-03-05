import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrainModule } from './brain/brain.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [BrainModule, ToolsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
