import { Test, TestingModule } from '@nestjs/testing';
import { CodeRagService } from './codeRag.service';
import { CodeMemoryService } from './codeMemory.service';
import { LlmClient } from '../llm/llmClient';

describe('CodeRagService', () => {
  let service: CodeRagService;
  let codeMemory: jest.Mocked<Pick<CodeMemoryService, 'searchCodeMemory'>>;
  let llm: jest.Mocked<Pick<LlmClient, 'generate'>>;

  beforeEach(async () => {
    codeMemory = {
      searchCodeMemory: jest.fn().mockResolvedValue([
        { filePath: 'src/foo.ts', text: 'export const x = 1;', score: 0.9 },
      ]),
    };
    llm = { generate: jest.fn().mockResolvedValue('The constant x is defined in foo.ts.') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeRagService,
        { provide: CodeMemoryService, useValue: codeMemory },
        { provide: LlmClient, useValue: llm },
      ],
    }).compile();

    service = module.get<CodeRagService>(CodeRagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('askCodeBrain: searches code memory, calls LLM with context', async () => {
    const answer = await service.askCodeBrain('Where is x defined?');

    expect(codeMemory.searchCodeMemory).toHaveBeenCalledWith('Where is x defined?', 8);
    expect(llm.generate).toHaveBeenCalled();
    expect(answer).toBe('The constant x is defined in foo.ts.');
  });

  it('askCodeBrain with custom contextLimit', async () => {
    await service.askCodeBrain('Where is x?', 3);
    expect(codeMemory.searchCodeMemory).toHaveBeenCalledWith('Where is x?', 3);
  });
});
