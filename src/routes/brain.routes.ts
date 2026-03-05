import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { AgentMemoryService } from '../brain/agentMemory.service';
import { MemoryService } from '../brain/memory.service';
import { RagService } from '../brain/rag.service';
import { MemoryEvaluatorService } from '../brain/memoryEvaluator.service';
import { AskBrainService } from '../brain/askBrain.service';
import { MongoQueryService } from '../brain/mongoQuery.service';
import { CodeRagService } from '../brain/codeRag.service';
import { CodeIndexService } from '../brain/codeIndex.service';
import { FamilyMemoryService } from '../brain/familyMemory.service';
import { ChatDto } from '../brain/dto/chat.dto';
import { AskDto } from '../brain/dto/ask.dto';
import { MongoAskDto } from '../brain/dto/mongoAsk.dto';
import { CodeAskDto } from '../brain/dto/codeAsk.dto';
import { CodeIndexDto } from '../brain/dto/codeIndex.dto';
import { StoreMemoryDto } from '../brain/dto/storeMemory.dto';
import { SearchMemoryDto } from '../brain/dto/searchMemory.dto';
import { BrainQueryDto } from '../brain/dto/brainQuery.dto';
import { AddFamilyFolderDto } from '../brain/dto/addFamilyFolder.dto';
import { AddFamilyPhotoDto } from '../brain/dto/addFamilyPhoto.dto';
import { AddFamilyDocumentDto } from '../brain/dto/addFamilyDocument.dto';
import { BRAIN_QUERY_TYPES, type BrainQueryType } from '../common/constants';

@Controller('brain')
export class BrainRoutes {
  constructor(
    private readonly agentMemory: AgentMemoryService,
    private readonly memory: MemoryService,
    private readonly rag: RagService,
    private readonly memoryEvaluator: MemoryEvaluatorService,
    private readonly askBrain: AskBrainService,
    private readonly mongoQuery: MongoQueryService,
    private readonly codeRag: CodeRagService,
    private readonly codeIndex: CodeIndexService,
    private readonly familyMemory: FamilyMemoryService,
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

  /** 메모리 저장 (text + metadata). AutoMemory 외에 수동 저장용 */
  @Post('store')
  async store(@Body() body: StoreMemoryDto) {
    await this.memory.store(body.text, body.metadata ?? {});
    return { status: 'stored' };
  }

  /** 메모리 검색 (RAG/ask에서 사용하는 searchMemory) */
  @Post('search')
  async search(@Body() body: SearchMemoryDto) {
    const result = await this.memory.search(body.query);
    return result;
  }

  /** 통합 쿼리: type에 따라 ask | mongo | code 로 라우팅. OpenClaw queryBrain(type, question) 용 */
  @Post('query')
  async query(@Body() body: BrainQueryDto) {
    const { type, question } = body;
    if (!BRAIN_QUERY_TYPES.includes(type as BrainQueryType)) {
      throw new BadRequestException(
        `Unknown type: ${type}. Use ${BRAIN_QUERY_TYPES.join(' | ')}`,
      );
    }
    const handlers: Record<
      BrainQueryType,
      () => Promise<{ answer: string; mongoQuery?: unknown; result?: unknown }>
    > = {
      ask: async () => ({ answer: await this.askBrain.askBrain(question) }),
      mongo: async () => {
        const result = await this.mongoQuery.askDatabase(question);
        return { ...result, answer: result.answer };
      },
      code: async () => ({ answer: await this.codeRag.askCodeBrain(question) }),
    };
    return handlers[type as BrainQueryType]();
  }

  /** askBrain(question): searchMemory → askLLM(context+question) → autoMemory(question+answer) → return answer */
  @Post('ask')
  async ask(@Body() body: AskDto) {
    const answer = await this.askBrain.askBrain(body.question);
    return { answer };
  }

  /** User → Brain API → Mongo Query Generator → MongoDB 실행 → LLM 결과 분석 → Answer */
  @Post('mongo')
  async mongo(@Body() body: MongoAskDto) {
    return this.mongoQuery.askDatabase(body.question);
  }

  /** Code Brain: Code Loader → Parser → Vector Store → RAG (질문 답변) */
  @Post('code')
  async code(@Body() body: CodeAskDto) {
    const answer = await this.codeRag.askCodeBrain(body.question);
    return { answer };
  }

  /** 프로젝트 경로 인덱싱 (로드 → 파싱 → 벡터 저장). body.rootPath 기본값: process.cwd() */
  @Post('code/index')
  async indexCode(@Body() body: CodeIndexDto) {
    const rootPath = body.rootPath ?? process.cwd();
    return this.codeIndex.indexProject(rootPath);
  }

  /** 가족 사진 폴더 일괄 추가 (사진 + PDF/TXT/MD) */
  @Post('family/addFolder')
  async addFamilyFolder(@Body() body: AddFamilyFolderDto) {
    const person = body.person ?? 'all';
    return this.familyMemory.addFamilyFolder(body.folderPath, person);
  }

  /** 가족 사진 1건 추가 (경로 → LLM 설명 → 메모리 저장) */
  @Post('family/addPhoto')
  async addFamilyPhoto(@Body() body: AddFamilyPhotoDto) {
    const person = body.person ?? 'all';
    return this.familyMemory.addFamilyPhoto(body.filePath, person);
  }

  /** 가족 문서 1건 추가 (PDF/TXT/MD → 요약 → 메모리 저장) */
  @Post('family/addDocument')
  async addFamilyDocument(@Body() body: AddFamilyDocumentDto) {
    const person = body.person ?? 'all';
    return this.familyMemory.addFamilyDocument(body.filePath, person);
  }
}
