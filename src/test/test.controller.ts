import { Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

@Controller('test')
export class TestController {
  @Get()
  ui(@Res() res: Response) {
    res.type('html').send(TestController.getHtml());
  }

  @Post('run')
  run() {
    const cwd = join(__dirname, '../..');
    const result = spawnSync('npm', ['run', 'test', '--', '--no-cache'], {
      encoding: 'utf-8',
      cwd,
      timeout: 60_000,
      shell: true,
    });
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    return {
      success: result.status === 0,
      exitCode: result.status,
      output: output || '(no output)',
    };
  }

  private static getHtml(): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Test Runner - custom-brain</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 1.5rem; background: #1a1a2e; color: #eee; min-height: 100vh; }
    h1 { font-size: 1.25rem; margin: 0 0 1rem; color: #a78bfa; }
    .toolbar { margin-bottom: 1rem; }
    button { background: #6366f1; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
    button:hover { background: #4f46e5; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    pre { background: #0f0f1a; padding: 1rem; border-radius: 8px; overflow: auto; font-size: 0.8125rem; line-height: 1.5; margin: 0; white-space: pre-wrap; }
    .success { color: #34d399; }
    .fail { color: #f87171; }
    .status { margin-bottom: 0.5rem; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>Test Runner</h1>
  <div class="toolbar">
    <button type="button" id="run">Run tests</button>
  </div>
  <div class="status" id="status"></div>
  <pre id="output">Click "Run tests" to run \`npm run test\`.</pre>
  <script>
    const runBtn = document.getElementById('run');
    const statusEl = document.getElementById('status');
    const outputEl = document.getElementById('output');
    runBtn.addEventListener('click', async () => {
      runBtn.disabled = true;
      statusEl.textContent = 'Running…';
      statusEl.className = 'status';
      outputEl.textContent = '…';
      try {
        const res = await fetch('/test/run', { method: 'POST' });
        const data = await res.json();
        statusEl.textContent = data.success ? 'Passed' : 'Failed (exit ' + (data.exitCode ?? '') + ')';
        statusEl.className = 'status ' + (data.success ? 'success' : 'fail');
        outputEl.textContent = data.output || '(no output)';
      } catch (e) {
        statusEl.textContent = 'Error';
        statusEl.className = 'status fail';
        outputEl.textContent = String(e);
      }
      runBtn.disabled = false;
    });
  </script>
</body>
</html>`;
  }
}
