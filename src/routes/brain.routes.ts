import { Body, Controller, Get, Post } from '@nestjs/common';
import { AgentMemoryService } from '../brain/agentMemory.service';
import { RagService } from '../brain/rag.service';
import { MemoryEvaluatorService } from '../brain/memoryEvaluator.service';
import { AskBrainService } from '../brain/askBrain.service';
import { ChatDto } from '../brain/dto/chat.dto';
import { AskDto } from '../brain/dto/ask.dto';

@Controller('brain')
export class BrainRoutes {
  constructor(
    private readonly agentMemory: AgentMemoryService,
    private readonly rag: RagService,
    private readonly memoryEvaluator: MemoryEvaluatorService,
    private readonly askBrain: AskBrainService,
  ) {}

  @Post('chat')
  async chat(@Body() body: ChatDto) {
    this.agentMemory.append('user', body.message);
    const reply = await this.rag.query(body.message);
    this.agentMemory.append('assistant', reply);

    // User/Agent → LLM(reply) → Memory Evaluator → Important? → store | ignore
    const turn = `User: ${body.message}\nAssistant: ${reply}`;
    const { important, stored } = await this.memoryEvaluator.evaluateAndMaybeStore(turn);

    return { reply, memory: { important, stored } };
  }

  @Get('memory')
  getMemory() {
    return { messages: this.agentMemory.getMessages() };
  }

  /** askBrain(question): searchMemory → askLLM(context+question) → autoMemory(question+answer) → return answer */
  @Post('ask')
  async ask(@Body() body: AskDto) {
    const answer = await this.askBrain.askBrain(body.question);
    return { answer };
  }
}
