import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestRunnerService } from './test-runner.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockTestRunner = {
      getTestUiHtml: () => '<html></html>',
      runTests: () => ({ success: true, exitCode: 0, output: '' }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: TestRunnerService, useValue: mockTestRunner },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
