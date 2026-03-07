import { Body, Controller, Get, Post } from '@nestjs/common';
import { AgentMemoryService } from '../brain/agentMemory.service';
import { RagService } from '../brain/rag.service';
import { MemoryEvaluatorService } from '../brain/memoryEvaluator.service';
import { AskBrainService } from '../brain/askBrain.service';
import { BrainOrganizeService } from '../brain/brain-organize.service';
import { ChatDto } from '../brain/dto/chat.dto';
import { AskDto } from '../brain/dto/ask.dto';

@Controller('brain')
export class BrainRoutes {
  constructor(
    private readonly agentMemory: AgentMemoryService,
    private readonly rag: RagService,
    private readonly memoryEvaluator: MemoryEvaluatorService,
    private readonly askBrain: AskBrainService,
    private readonly brainOrganize: BrainOrganizeService,
  ) {}

  @Post('chat')
  async chat(@Body() body: ChatDto) {
    this.agentMemory.append('user', body.message);
    const reply = await this.rag.query(body.message);
    this.agentMemory.append('assistant', reply);
    const turn = `User: ${body.message}\nAssistant: ${reply}`;
    const { important, stored } = await this.memoryEvaluator.evaluateAndMaybeStore(turn);
    return { reply, memory: { important, stored } };
  }

  @Get('memory')
  getMemory() {
    return { messages: this.agentMemory.getMessages() };
  }

  @Post('ask')
  async ask(@Body() body: AskDto) {
    const answer = await this.askBrain.askBrain(body.question);
    this.agentMemory.append('user', body.question);
    this.agentMemory.append('assistant', answer);
    return { answer };
  }

  /** v3: Self-Learning — 클러스터·타임라인·지식그래프·요약 한 번에 실행 */
  @Post('organize')
  async organize() {
    const result = await this.brainOrganize.organize();
    return { status: 'brain organized', ...result };
  }
}
