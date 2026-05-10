const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { nanoid } = require('nanoid');

const router = express.Router();
const auth = require('../middleware/auth');

const { DOCKER_IMAGES } = require('../config/docker');

router.post('/', auth, async (req, res) => {
  const { code, language, stdin } = req.body;

  if (!DOCKER_IMAGES[language]) {
    return res.status(400).json({ error: `Language ${language} is not supported.` });
  }

  // Create a unique temporary directory for this execution
  const executionId = nanoid(10);
  const tempDir = path.join(__dirname, '..', 'temp', executionId);
  
  try {
    await fs.mkdir(tempDir, { recursive: true });

    let fileName, runCommand;
    // Note: We use process.platform to handle Windows path formatting for Docker volumes
    const volumePath = process.platform === 'win32' ? tempDir.replace(/\\/g, '/') : tempDir;
    
    switch (language) {
      case 'python':
        fileName = 'main.py';
        runCommand = `docker run --rm --memory="128m" --cpus="0.5" -v "${volumePath}:/app" -w /app ${DOCKER_IMAGES.python} sh -c "python main.py ${stdin ? '< input.txt' : ''}"`;
        break;
      case 'javascript':
        fileName = 'main.js';
        runCommand = `docker run --rm --memory="128m" --cpus="0.5" -v "${volumePath}:/app" -w /app ${DOCKER_IMAGES.javascript} sh -c "node main.js ${stdin ? '< input.txt' : ''}"`;
        break;
      case 'java':
        fileName = 'Main.java';
        runCommand = `docker run --rm --memory="256m" --cpus="0.5" -v "${volumePath}:/app" -w /app ${DOCKER_IMAGES.java} sh -c "javac Main.java && java Main ${stdin ? '< input.txt' : ''}"`;
        break;
      case 'cpp':
        fileName = 'main.cpp';
        runCommand = `docker run --rm --memory="256m" --cpus="0.5" -v "${volumePath}:/app" -w /app ${DOCKER_IMAGES.cpp} sh -c "g++ main.cpp -o main && ./main ${stdin ? '< input.txt' : ''}"`;
        break;
    }

    // Write user code to the temp file
    await fs.writeFile(path.join(tempDir, fileName), code);
    
    // Write stdin to a file if provided
    if (stdin) {
      await fs.writeFile(path.join(tempDir, 'input.txt'), stdin);
    }

    // Execute the Docker container
    exec(runCommand, { timeout: 10000 }, async (error, stdout, stderr) => {
      // Clean up the temp directory
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}

      if (error) {
        if (error.killed) {
          return res.json({ output: 'Error: Execution timed out (exceeded 10 seconds limits).' });
        }
        // If compilation or execution failed, return the stderr
        return res.json({ output: stderr || error.message });
      }
      
      // Success
      res.json({ output: stdout || stderr });
    });

  } catch (error) {
    try { await fs.rm(tempDir, { recursive: true, force: true }); } catch (e) {}
    res.status(500).json({ error: 'Failed to execute code on server' });
  }
});

module.exports = router;
