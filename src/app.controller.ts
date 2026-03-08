import { Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { TestRunnerService } from './test-runner.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
@Public()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly testRunner: TestRunnerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTestUi(@Res() res: Response) {
    res.type('html').send(this.testRunner.getTestUiHtml());
  }

  @Post('test/run')
  runTests() {
    return this.testRunner.runTests();
  }
}
