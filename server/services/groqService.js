const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are an expert senior software engineer and code reviewer. You analyze code for bugs, security vulnerabilities, performance issues, and best practices.

You MUST respond in EXACTLY this JSON format. Do NOT add any text before or after the JSON:

{
  "summary": "A 2-3 sentence overview of the code quality",
  "scores": {
    "quality": <number 0-100>,
    "security": <number 0-100>,
    "performance": <number 0-100>,
    "bestPractices": <number 0-100>
  },
  "issues": [
    {
      "type": "<bug|security|performance|bestPractice>",
      "severity": "<critical|warning|info>",
      "title": "Short issue title",
      "description": "Detailed explanation of the issue",
      "lineNumbers": [<line numbers where issue exists>],
      "suggestion": "How to fix this issue",
      "codeExample": "Corrected code snippet if applicable"
    }
  ],
  "updatedCode": "The fully fixed, refactored, and optimized code. MUST preserve exact line breaks and indentation using \\n. Do NOT minify. No markdown blocks, just raw code string."
}

SCORING GUIDELINES:
- quality: Code readability, maintainability, naming, structure, error handling
- security: Input validation, injection prevention, auth, data exposure, secrets
- performance: Algorithmic efficiency, memory usage, unnecessary operations, caching
- bestPractices: Design patterns, DRY, SOLID, modern language features, documentation

SEVERITY GUIDELINES:
- critical: Bugs that crash the app, security vulnerabilities, data loss risks
- warning: Performance issues, potential bugs, poor patterns that could cause problems
- info: Style improvements, minor optimizations, suggestions for better practices

Be thorough but fair. If the provided code is already perfect or excellent, you MUST give a 100 score in all categories and return an empty array [] for issues. Do NOT artificially invent issues.

CRITICAL RULES FOR updatedCode:
1. You MUST return the ENTIRE, complete code with your fixes applied.
2. NEVER use placeholders like "// rest of the code" or "/* unchanged */".
3. NEVER truncate, shorten, or remove valid logic from the original code. 
4. If no fixes are needed, return the exact original code unmodified.
5. Always return valid JSON.`;

async function analyzeCode(code, language) {
  try {
    const userPrompt = `Analyze this ${language} code and provide a comprehensive review:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const MODELS = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768'
    ];

    let responseText = null;
    let lastError = null;

    for (const model of MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          model: model,
          temperature: 0.3,
          max_tokens: 4096,
          response_format: { type: 'json_object' }
        });
        
        responseText = completion.choices[0]?.message?.content;
        if (responseText) break; // Success
      } catch (err) {
        lastError = err;
        console.warn(`[Groq] Model ${model} failed: ${err.message}. Trying next...`);
        // If it's not a rate limit error, we might still want to try the next model just in case.
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response from AI');
    }

    const result = JSON.parse(responseText);

    // Calculate overall score and grade
    const { quality, security, performance, bestPractices } = result.scores;
    const overall = Math.round((quality + security + performance + bestPractices) / 4);

    let grade;
    if (overall >= 95) grade = 'A+';
    else if (overall >= 90) grade = 'A';
    else if (overall >= 85) grade = 'B+';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 75) grade = 'C+';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    return {
      summary: result.summary,
      scores: {
        quality,
        security,
        performance,
        bestPractices,
        overall,
        grade
      },
      issues: result.issues || [],
      updatedCode: (result.updatedCode || code).replace(/^```[\w]*\n/g, '').replace(/\n```$/g, '')
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to analyze code: ' + error.message);
  }
}

const MENTOR_SYSTEM_PROMPT = `You are an expert AI coding mentor. Your goal is to guide the user, help them understand concepts, build logic, and debug their code. 
CRITICAL RULE: You MUST NOT provide the exact code solutions or write code for the user. Instead, give hints, explain the logic, point out where the error might be, or provide pseudo-code. Your job is to help them learn, not do the work for them.`;

async function chatWithMentor(code, language, chatHistory) {
  try {
    const messages = [
      { role: 'system', content: MENTOR_SYSTEM_PROMPT }
    ];
    
    if (code) {
      messages.push({ role: 'user', content: `Here is my current ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` });
    }

    if (chatHistory && chatHistory.length > 0) {
      messages.push(...chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })));
    }

    const MODELS = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768'
    ];

    let responseText = null;
    let lastError = null;

    for (const model of MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          messages,
          model: model,
          temperature: 0.7,
          max_tokens: 2048,
        });
        
        responseText = completion.choices[0]?.message?.content;
        if (responseText) break;
      } catch (err) {
        lastError = err;
        console.warn(`[Groq Mentor] Model ${model} failed: ${err.message}. Trying next...`);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response from AI');
    }

    return responseText;
  } catch (error) {
    console.error('Groq Mentor API Error:', error);
    throw new Error('Failed to chat with mentor: ' + error.message);
  }
}

module.exports = { analyzeCode, chatWithMentor };
