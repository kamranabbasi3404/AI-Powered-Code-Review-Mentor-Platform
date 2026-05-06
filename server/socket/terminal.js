const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { nanoid } = require('nanoid');

const DOCKER_IMAGES = {
  python: 'python:3.10-alpine',
  javascript: 'node:18-alpine',
  java: 'eclipse-temurin:17-alpine',
  cpp: 'gcc:12'
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    let currentProcess = null;
    let currentTempDir = null;

    socket.on('run_code', async (data) => {
      const { code, language } = data;
      const startTime = Date.now();

      if (!DOCKER_IMAGES[language]) {
        socket.emit('output', `Language ${language} is not supported.\r\n`);
        return socket.emit('exit', 1);
      }

      const executionId = nanoid(10);
      const tempDir = path.join(__dirname, '..', 'temp', executionId);
      currentTempDir = tempDir;

      try {
        await fs.mkdir(tempDir, { recursive: true });

        let fileName, cmd, args;
        const volumePath = process.platform === 'win32' ? tempDir.split(path.sep).join('/') : tempDir;

        switch (language) {
          case 'python':
            fileName = 'main.py';
            cmd = 'docker';
            // -u forces unbuffered output in python so prompts show up instantly
            args = ['run', '-i', '--rm', '--memory=128m', '--cpus=0.5', '-v', `${volumePath}:/app`, '-w', '/app', DOCKER_IMAGES.python, 'python', '-u', 'main.py'];
            break;
          case 'javascript':
            fileName = 'main.js';
            cmd = 'docker';
            args = ['run', '-i', '--rm', '--memory=128m', '--cpus=0.5', '-v', `${volumePath}:/app`, '-w', '/app', DOCKER_IMAGES.javascript, 'node', 'main.js'];
            break;
          case 'java':
            fileName = 'Main.java';
            cmd = 'docker';
            args = ['run', '-i', '--rm', '--memory=256m', '--cpus=0.5', '-v', `${volumePath}:/app`, '-w', '/app', DOCKER_IMAGES.java, 'sh', '-c', 'javac Main.java && java Main'];
            break;
          case 'cpp':
            fileName = 'main.cpp';
            cmd = 'docker';
            args = ['run', '-i', '--rm', '--memory=256m', '--cpus=0.5', '-v', `${volumePath}:/app`, '-w', '/app', DOCKER_IMAGES.cpp, 'sh', '-c', 'g++ main.cpp -o main && ./main'];
            break;
        }

        await fs.writeFile(path.join(tempDir, fileName), code);

        currentProcess = spawn(cmd, args);

        currentProcess.stdout.on('data', (data) => {
          socket.emit('output', data.toString('utf8').replace(/\n/g, '\r\n'));
        });

        currentProcess.stderr.on('data', (data) => {
          socket.emit('output', data.toString('utf8').replace(/\n/g, '\r\n'));
        });

        currentProcess.on('error', (err) => {
          console.error('[Terminal] Process error:', err.message);
          socket.emit('output', `Process Error: ${err.message}\r\n`);
          socket.emit('exit', 1);
        });

        currentProcess.on('close', async (code) => {
          const runTime = ((Date.now() - startTime) / 1000).toFixed(2);
          socket.emit('output', `\r\n\x1b[38;5;240m[Process completed in ${runTime}s]\x1b[0m\r\n`);
          socket.emit('exit', code);
          try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}
          currentProcess = null;
        });

        // 60-second timeout to kill runaway processes
        setTimeout(() => {
          if (currentProcess) {
            socket.emit('output', '\r\nError: Execution timed out (exceeded 60 seconds).\r\n');
            currentProcess.kill();
          }
        }, 60000);

      } catch (error) {
        console.error('[Terminal] Error:', error.message);
        socket.emit('output', `System Error: ${error.message}\r\n`);
        socket.emit('exit', 1);
        try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}
      }
    });

    socket.on('input', (data) => {
      if (currentProcess && currentProcess.stdin && currentProcess.stdin.writable) {
        currentProcess.stdin.write(data);
      }
    });

    socket.on('disconnect', async () => {
      if (currentProcess) {
        currentProcess.kill();
      }
      if (currentTempDir) {
        try { await fs.rm(currentTempDir, { recursive: true, force: true }); } catch (e) {}
      }
    });
  });
};
