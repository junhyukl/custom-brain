import { Controller, Post, Body } from '@nestjs/common';
import { BrainService } from './brain.service';
import { ChatDto } from './dto/chat.dto';

@Controller('brain')
export class BrainController {
  constructor(private readonly brainService: BrainService) {}

  @Post('chat')
  async chat(@Body() body: ChatDto) {
    return this.brainService.handle(body.message);
  }
}