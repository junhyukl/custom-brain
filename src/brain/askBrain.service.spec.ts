import { Test, TestingModule } from '@nestjs/testing';
import { AskBrainService } from './askBrain.service';
import { MemoryService } from './memory.service';
import { LlmClient } from '../llm/llmClient';
import { MemoryEvaluatorService } from './memoryEvaluator.service';

describe('AskBrainService', () => {
  let service: AskBrainService;
  let memory: jest.Mocked<Pick<MemoryService, 'search'>>;
  let llm: jest.Mocked<Pick<LlmClient, 'generate'>>;
  let memoryEvaluator: jest.Mocked<Pick<MemoryEvaluatorService, 'evaluateAndMaybeStore'>>;

  beforeEach(async () => {
    memory = { search: jest.fn().mockResolvedValue([{ id: '1', text: 'ctx' }]) };
    llm = { generate: jest.fn().mockResolvedValue('The answer.') };
    memoryEvaluator = { evaluateAndMaybeStore: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AskBrainService,
        { provide: MemoryService, useValue: memory },
        { provide: LlmClient, useValue: llm },
        { provide: MemoryEvaluatorService, useValue: memoryEvaluator },
      ],
    }).compile();

    service = module.get<AskBrainService>(AskBrainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('askBrain: searches memory, calls LLM, stores question and answer', async () => {
    const answer = await service.askBrain('What is it?');

    expect(memory.search).toHaveBeenCalledWith('What is it?');
    expect(llm.generate).toHaveBeenCalled();
    expect(memoryEvaluator.evaluateAndMaybeStore).toHaveBeenCalledWith('What is it?');
    expect(memoryEvaluator.evaluateAndMaybeStore).toHaveBeenCalledWith('The answer.');
    expect(answer).toBe('The answer.');
  });
});
