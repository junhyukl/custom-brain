import { Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTestUi(@Res() res: Response) {
    res.type('html').send(this.appService.getTestUiHtml());
  }

  @Post('test/run')
  runTests() {
    return this.appService.runTests();
  }
}
