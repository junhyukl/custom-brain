import { Body, Controller, Get, Post, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { toErrorMessage } from '../common/error.util';
import { AgentMemoryService } from '../brain/agentMemory.service';
import { RagService } from '../brain/rag.service';
import { MemoryEvaluatorService } from '../brain/memoryEvaluator.service';
import { AskBrainService } from '../brain/askBrain.service';
import { BrainOrganizeService } from '../brain/brain-organize.service';
import { ChatDto } from '../brain/dto/chat.dto';
import { AskDto } from '../brain/dto/ask.dto';

@Controller('brain')
export class BrainRoutes {
  private readonly logger = new Logger(BrainRoutes.name);

  constructor(
    private readonly agentMemory: AgentMemoryService,
    private readonly rag: RagService,
    private readonly memoryEvaluator: MemoryEvaluatorService,
    private readonly askBrain: AskBrainService,
    private readonly brainOrganize: BrainOrganizeService,
  ) {}

  @Post('chat')
  async chat(@Body() body: ChatDto) {
    try {
      this.agentMemory.append('user', body.message);
      const reply = await this.rag.query(body.message);
      this.agentMemory.append('assistant', reply);
      const turn = `User: ${body.message}\nAssistant: ${reply}`;
      const { important, stored } = await this.memoryEvaluator.evaluateAndMaybeStore(turn);
      return { reply, memory: { important, stored } };
    } catch (err) {
      const message = toErrorMessage(err);
      this.logger.warn(`chat failed: ${message}`);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('memory')
  getMemory() {
    return { messages: this.agentMemory.getMessages() };
  }

  @Post('ask')
  async ask(@Body() body: AskDto) {
    try {
      const answer = await this.askBrain.askBrain(body.question);
      this.agentMemory.append('user', body.question);
      this.agentMemory.append('assistant', answer);
      return { answer };
    } catch (err) {
      const message = toErrorMessage(err);
      this.logger.warn(`ask failed: ${message}`);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** v3: Self-Learning — 클러스터·타임라인·지식그래프·요약 한 번에 실행 */
  @Post('organize')
  async organize() {
    try {
      const result = await this.brainOrganize.organize();
      return { status: 'brain organized', ...result };
    } catch (err) {
      const message = toErrorMessage(err);
      this.logger.warn(`organize failed: ${message}`);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
