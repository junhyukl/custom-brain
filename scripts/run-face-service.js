#!/usr/bin/env node
/**
 * face-service 띄우기. face-service/.venv 있으면 venv Python 사용, 없으면 python3.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const faceDir = path.join(root, 'face-service');
const venvPython = path.join(faceDir, '.venv', 'bin', 'python');
const venvPythonWin = path.join(faceDir, '.venv', 'Scripts', 'python.exe');
const python = fs.existsSync(venvPython)
  ? venvPython
  : fs.existsSync(venvPythonWin)
    ? venvPythonWin
    : process.platform === 'win32'
      ? 'python'
      : 'python3';

const child = spawn(python, ['-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8001'], {
  cwd: faceDir,
  stdio: 'inherit',
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
