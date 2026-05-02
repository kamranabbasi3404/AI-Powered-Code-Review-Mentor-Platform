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
  ]
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

Be thorough but fair. If code is good, give high scores. Always find at least 1-2 suggestions for improvement. Always return valid JSON.`;

async function analyzeCode(code, language) {
  try {
    const userPrompt = `Analyze this ${language} code and provide a comprehensive review:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
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
      issues: result.issues || []
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to analyze code: ' + error.message);
  }
}

module.exports = { analyzeCode };
