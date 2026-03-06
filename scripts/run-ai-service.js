#!/usr/bin/env node
/**
 * ai-service 띄우기. ai-service/.venv 있으면 venv Python 사용, 없으면 python3.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const aiDir = path.join(root, 'ai-service');
const venvPython = path.join(aiDir, '.venv', 'bin', 'python');
const venvPythonWin = path.join(aiDir, '.venv', 'Scripts', 'python.exe');
const python = fs.existsSync(venvPython)
  ? venvPython
  : fs.existsSync(venvPythonWin)
    ? venvPythonWin
    : 'python3';

const child = spawn(python, ['-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8000'], {
  cwd: aiDir,
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
