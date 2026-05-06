const express = require('express');
const auth = require('../middleware/auth');
const { chatWithMentor } = require('../services/groqService');

const router = express.Router();

// POST /api/ai/chat - Chat with AI mentor
router.post('/chat', auth, async (req, res) => {
  try {
    const { code, language, chatHistory } = req.body;

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: 'Chat history is required' });
    }

    const reply = await chatWithMentor(code, language || 'javascript', chatHistory);

    res.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to chat with mentor' });
  }
});

module.exports = router;
