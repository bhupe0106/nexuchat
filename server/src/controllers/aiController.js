const axios = require('axios');
const Message = require('../models/Message');

const getGorkAPI = () => {
  const baseURL = process.env.GORKAPI_BASE_URL || 'http://localhost:8000/v1';
  const apiKey = process.env.GORKAPI_API_KEY;
  
  if (!baseURL) {
    throw new Error('GorkAPI base URL not configured');
  }
  
  return axios.create({
    baseURL,
    headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
  });
};

const callGorkAPI = async (messages, model = 'openai/gpt-oss-120b', maxTokens = 800, temperature = 0.7) => {
  const client = getGorkAPI();
  try {
    const response = await client.post('/chat/completions', {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      console.error(`Groq API Error (${status}):`, JSON.stringify(data, null, 2));
      
      let message = `Groq API returned ${status}`;
      if (data?.error?.message) {
        message = data.error.message;
      } else if (typeof data === 'string') {
        message = data;
      }
      
      const err = new Error(message);
      err.status = status;
      err.apiError = data;
      throw err;
    }
    throw error;
  }
};

// @desc    AI Chat Assistant
// @route   POST /api/ai/chat
const aiChat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are NexusAI, a helpful, witty, and intelligent assistant integrated into a chat app called NexusChat. 
        You help users with questions, creative tasks, coding, analysis, and more. 
        Keep responses concise but helpful. Use markdown when appropriate.
        Current user: ${req.user.username}`,
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    const completion = await callGorkAPI(messages, 'openai/gpt-oss-120b', 800, 0.7);

    const reply = completion.choices[0].message.content;

    res.json({
      success: true,
      reply,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('AI chat error:', error.message, error.apiError);
    if (error.message.includes('base URL') || error.message.includes('not configured')) {
      return res.status(503).json({ success: false, message: 'AI service not configured. Please add GORKAPI_BASE_URL to .env' });
    }
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      success: false, 
      message: 'AI service error: ' + error.message,
      details: error.apiError 
    });
  }
};

// @desc    Summarize conversation
// @route   POST /api/ai/summarize
const summarizeChat = async (req, res) => {
  try {
    const { conversationId } = req.body;

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
      type: { $in: ['text', 'ai'] },
    })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(100);

    if (messages.length === 0) {
      return res.json({ success: true, summary: 'No messages to summarize.' });
    }

    const chatText = messages
      .reverse()
      .map((m) => `${m.sender.username}: ${m.content}`)
      .join('\n');

    const completion = await callGorkAPI(
      [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes chat conversations. Be concise and highlight key points, decisions, and action items.',
        },
        {
          role: 'user',
          content: `Please summarize this conversation and extract key points:\n\n${chatText}`,
        },
      ],
      'openai/gpt-oss-120b',
      500,
      0.3
    );

    res.json({
      success: true,
      summary: completion.choices[0].message.content,
      messageCount: messages.length,
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ success: false, message: 'AI service error: ' + error.message });
  }
};

// @desc    Analyze sentiment of a message
// @route   POST /api/ai/sentiment
const analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.json({ success: true, sentiment: { label: 'neutral', score: 0 } });
    }

    // Simple keyword-based fallback if no GorkAPI configured
    if (!process.env.GORKAPI_BASE_URL && !process.env.GORKAPI_API_KEY) {
      const sentiment = simpleSentimentAnalysis(text);
      return res.json({ success: true, sentiment });
    }

    const completion = await callGorkAPI(
      [
        {
          role: 'system',
          content: 'Analyze the sentiment of the given text. Respond ONLY with a JSON object: {"label": "positive|neutral|negative", "score": 0.0-1.0}',
        },
        { role: 'user', content: text },
      ],
      'openai/gpt-oss-120b',
      50,
      0
    );

    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, sentiment: result });
  } catch (error) {
    console.error('Sentiment error:', error);
    // Fallback to simple analysis
    const sentiment = simpleSentimentAnalysis(req.body.text || '');
    res.json({ success: true, sentiment });
  }
};

// Simple keyword-based sentiment analysis fallback
const simpleSentimentAnalysis = (text) => {
  const lower = text.toLowerCase();
  const positiveWords = ['good', 'great', 'awesome', 'love', 'happy', 'thanks', 'yes', 'nice', 'perfect', 'wonderful', 'excellent', '😊', '❤️', '👍', 'sure', 'absolutely'];
  const negativeWords = ['bad', 'hate', 'angry', 'no', 'terrible', 'awful', 'worst', 'horrible', 'disappointed', 'frustrating', '😡', '👎', 'never', 'wrong'];

  const posCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (posCount > negCount) return { label: 'positive', score: Math.min(posCount * 0.3, 1) };
  if (negCount > posCount) return { label: 'negative', score: Math.min(negCount * 0.3, 1) };
  return { label: 'neutral', score: 0 };
};

// @desc    Get smart reply suggestions
// @route   POST /api/ai/suggestions
const getSuggestions = async (req, res) => {
  try {
    const { lastMessage, context = [] } = req.body;

    if (!lastMessage?.trim()) {
      return res.json({ success: true, suggestions: ['👍', 'Okay!', 'Got it!'] });
    }

    if (!process.env.GORKAPI_BASE_URL && !process.env.GORKAPI_API_KEY) {
      return res.json({
        success: true,
        suggestions: generateSimpleSuggestions(lastMessage),
      });
    }

    const completion = await callGorkAPI(
      [
        {
          role: 'system',
          content: 'Generate exactly 3 short, natural reply suggestions for a chat message. Each should be 1-8 words. Return as JSON array: ["reply1", "reply2", "reply3"]',
        },
        { role: 'user', content: `Message to reply to: "${lastMessage}"` },
      ],
      'llama-3.1-70b-versatile',
      80,
      0.8
    );

    const content = completion.choices[0].message.content;
    let suggestions = ['Okay!', 'Got it!', 'Thanks!'];

    try {
      const parsed = JSON.parse(content);
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || parsed.replies || suggestions;
    } catch (e) {
      // fallback
    }

    res.json({ success: true, suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.json({ success: true, suggestions: generateSimpleSuggestions(req.body.lastMessage || '') });
  }
};

const generateSimpleSuggestions = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('how are you')) return ['Doing great!', 'Good, thanks!', 'Pretty good!'];
  if (lower.includes('?')) return ['Yes!', 'No, not really', 'Let me check'];
  if (lower.includes('thanks') || lower.includes('thank you')) return ["You're welcome!", 'No problem!', 'Happy to help!'];
  if (lower.includes('hello') || lower.includes('hi')) return ['Hey! 👋', 'Hi there!', 'Hello!'];
  return ['Okay!', 'Got it! 👍', 'Sure thing!'];
};

// @desc    Translate message
// @route   POST /api/ai/translate
const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage = 'en', messageId } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    if (!process.env.GORKAPI_BASE_URL) {
      return res.status(503).json({ success: false, message: 'Translation service not configured' });
    }

    const languageNames = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ar: 'Arabic',
      hi: 'Hindi', pt: 'Portuguese', ru: 'Russian', it: 'Italian',
      ta: 'Tamil', te: 'Telugu',
    };

    const langName = languageNames[targetLanguage] || targetLanguage;

    const completion = await callGorkAPI(
      [
        {
          role: 'system',
          content: `You are a translator. Translate the given text to ${langName}. Return ONLY the translated text, nothing else.`,
        },
        { role: 'user', content: text },
      ],
      'llama-3.1-70b-versatile',
      500,
      0.1
    );

    const translation = completion.choices[0].message.content.trim();

    // Cache translation in message
    if (messageId) {
      await Message.findByIdAndUpdate(messageId, {
        $set: { [`translations.${targetLanguage}`]: translation },
      });
    }

    res.json({ success: true, translation, targetLanguage });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ success: false, message: 'Translation failed: ' + error.message });
  }
};

module.exports = { aiChat, summarizeChat, analyzeSentiment, getSuggestions, translateMessage };
